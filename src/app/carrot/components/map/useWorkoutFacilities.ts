"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  WorkoutFacility,
  WorkoutSubCategoryId,
  fetchWorkoutFacilities,
} from "@/services/workoutService";

interface UseWorkoutFacilitiesParams {
  enabled: boolean;
  activeNeighborhood: string;
  currentLocation: { lat: number; lng: number } | null;
  coordsMap: Record<string, { lat: number; lng: number }>;
}

export function useWorkoutFacilities({
  enabled,
  activeNeighborhood,
  currentLocation,
  coordsMap,
}: UseWorkoutFacilitiesParams) {
  const [facilities, setFacilities] = useState<WorkoutFacility[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [subCategory, setSubCategory] = useState<WorkoutSubCategoryId>("all");
  const [mapBounds, setMapBounds] = useState<{
    south: number;
    north: number;
    west: number;
    east: number;
  } | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 기본 지도 좌표 가져오기
  const getCenterCoord = useCallback(() => {
    return (
      currentLocation ??
      coordsMap[activeNeighborhood] ??
      coordsMap["송파삼성래미안"] ?? { lat: 37.5029, lng: 127.1194 }
    );
  }, [activeNeighborhood, currentLocation, coordsMap]);

  // 운동 시설 데이터 페칭
  const loadFacilities = useCallback(async () => {
    if (!enabled) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError("");

    try {
      let swLat: number, swLng: number, neLat: number, neLng: number;

      if (mapBounds) {
        swLat = mapBounds.south;
        swLng = mapBounds.west;
        neLat = mapBounds.north;
        neLng = mapBounds.east;
      } else {
        const center = getCenterCoord();
        swLat = center.lat - 0.015;
        swLng = center.lng - 0.02;
        neLat = center.lat + 0.015;
        neLng = center.lng + 0.02;
      }

      const results = await fetchWorkoutFacilities(
        { swLat, swLng, neLat, neLng },
        subCategory,
        controller.signal
      );

      setFacilities(results);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("[useWorkoutFacilities] Failed to load facilities:", err);
        setError("운동 시설 정보를 불러오는 데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, mapBounds, subCategory, getCenterCoord]);

  // 활성화 상태나 동네/서브카테고리 변경 시 데이터 로드
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (enabled) {
        void loadFacilities();
      } else {
        setSelectedId(null);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeNeighborhood, enabled, loadFacilities, refreshTrigger]);

  const handleRetry = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleSelectFacility = useCallback((facility: WorkoutFacility) => {
    setSelectedId(facility.id);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedId(null);
  }, []);

  return {
    facilities,
    selectedId,
    setSelectedId,
    loading,
    error,
    subCategory,
    setSubCategory,
    setMapBounds,
    retry: handleRetry,
    handleSelectFacility,
    handleClearSelection,
  };
}
