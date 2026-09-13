import React, { useState, useEffect, useRef, useMemo } from "react";
import { MapPinned, Crosshair, Plus, Minus } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type {
  PropertyBuilding,
  RealEstateBounds,
  NaverMapInstance,
  NaverMarkerInstance,
} from "@/types";
import { NAVER_MAP_KEY_ID } from "../../constants";
import { loadNaverMapScript } from "../../utils";
import { groupBuildingsByDong, groupBuildingsByDistrict } from "@/services";
import { REAL_ESTATE_DISTRICT_CENTERS, displayBuildingName } from "./constants";

const DEFAULT_GRANULAR_ZOOM = 16; // 가장 작은 단위 (건물/단지 상세 단위)부터 시작

export function makeRealEstateMarker(
  title: string,
  detail: string,
  selected: boolean,
  kind: "gu" | "dong" | "building",
) {
  const root = document.createElement("button");
  root.type = "button";
  const kindClass =
    kind === "gu"
      ? styles.realEstateGuMarker
      : kind === "dong"
      ? styles.realEstateDongMarker
      : styles.realEstateBuildingMarker;

  root.className = `${styles.realEstateMarker} ${kindClass} ${selected ? styles.realEstateMarkerSelected : ""}`;
  const heading = document.createElement("strong");
  heading.textContent = title;
  const caption = document.createElement("span");
  caption.textContent = detail;
  root.append(heading, caption);
  return root;
}

export interface RealEstateMapProps {
  district: string;
  buildings: PropertyBuilding[];
  selectedBuildingId: string | null;
  onSelectBuilding: (building: PropertyBuilding) => void;
  onViewportChange: (bounds: RealEstateBounds, outsideSeoul: boolean) => void;
}

export function RealEstateMap({
  district,
  buildings,
  selectedBuildingId,
  onSelectBuilding,
  onViewportChange,
}: RealEstateMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<NaverMapInstance | null>(null);
  const markerRefs = useRef<NaverMarkerInstance[]>([]);
  const listenerRefs = useRef<unknown[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_GRANULAR_ZOOM);

  const fallbackCenter = REAL_ESTATE_DISTRICT_CENTERS[district] ?? { lat: 37.5665, lng: 126.978 };

  // 선택된 건물 또는 첫 번째 건물의 위치를 우선 중심으로 설정 (최소 단위 집중 뷰)
  const targetCenter = useMemo(() => {
    if (selectedBuildingId) {
      const selected = buildings.find((b) => b.id === selectedBuildingId);
      if (selected) return { lat: selected.lat, lng: selected.lng };
    }
    if (buildings.length > 0 && buildings[0].lat && buildings[0].lng) {
      return { lat: buildings[0].lat, lng: buildings[0].lng };
    }
    return fallbackCenter;
  }, [buildings, fallbackCenter, selectedBuildingId]);

  useEffect(() => {
    if (!NAVER_MAP_KEY_ID) return;
    let mounted = true;
    loadNaverMapScript(NAVER_MAP_KEY_ID)
      .then(() => {
        if (mounted) setMapReady(Boolean(window.naver?.maps));
      })
      .catch(() => {
        if (mounted) setMapReady(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 지도 초기화 및 중심 이동 (가장 세밀한 최소 단위 zoom 16부터 시작)
  useEffect(() => {
    const maps = window.naver?.maps;
    if (!maps || !mapElementRef.current || !mapReady) return;
    const position = new maps.LatLng(targetCenter.lat, targetCenter.lng);

    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapElementRef.current, {
        center: position,
        zoom: DEFAULT_GRANULAR_ZOOM,
        logoControl: false,
        mapDataControl: false,
        mapTypeControl: false,
        scaleControl: false,
        zoomControl: false,
      });
      window.requestAnimationFrame(() => {
        mapRef.current?.autoResize?.();
        mapRef.current?.setCenter(position);
      });
    } else {
      mapRef.current.setCenter(position);
    }
  }, [mapReady, targetCenter.lat, targetCenter.lng]);

  // Viewport 변경 감지 (이동 및 줌 완료 시)
  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps?.Event || !map || !mapReady) return;

    let timer = 0;
    const emitViewport = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const bounds = map.getBounds();
        const sw = bounds.getSW();
        const ne = bounds.getNE();
        const nextBounds = { south: sw.lat(), north: ne.lat(), west: sw.lng(), east: ne.lng() };
        if (nextBounds.north - nextBounds.south < 0.0005 || nextBounds.east - nextBounds.west < 0.0005) {
          map.autoResize?.();
          return;
        }
        const centerLat = (nextBounds.south + nextBounds.north) / 2;
        const centerLng = (nextBounds.west + nextBounds.east) / 2;
        const outsideSeoul = centerLat < 37.413 || centerLat > 37.715 || centerLng < 126.734 || centerLng > 127.269;
        setZoom(map.getZoom());
        onViewportChange(nextBounds, outsideSeoul);
      }, 350);
    };

    const idleListener = maps.Event.addListener(map, "idle", emitViewport);
    const zoomListener = maps.Event.addListener(map, "zoom_changed", () => {
      setZoom(map.getZoom());
    });

    emitViewport();
    return () => {
      window.clearTimeout(timer);
      maps.Event?.removeListener(idleListener);
      maps.Event?.removeListener(zoomListener);
    };
  }, [mapReady, onViewportChange]);

  // 척도(Level of Detail)에 따른 마커 계층 렌더링
  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !mapReady) return;

    markerRefs.current.forEach((marker) => marker.setMap(null));
    listenerRefs.current.forEach((listener) => maps.Event?.removeListener(listener));
    markerRefs.current = [];
    listenerRefs.current = [];

    // [Level 1] Zoom <= 13 : 광역 구 단위 클러스터
    if (zoom <= 13) {
      const guGroups = groupBuildingsByDistrict(buildings);
      guGroups.forEach((group) => {
        const position = new maps.LatLng(group.lat, group.lng);
        const content = makeRealEstateMarker(group.district, `${group.transactionCount}건`, false, "gu");
        const marker = new maps.Marker({
          position,
          map,
          title: `${group.district} ${group.transactionCount}건`,
          icon: { content, anchor: maps.Point ? new maps.Point(40, 24) : undefined },
        });
        const listener = maps.Event?.addListener(marker, "click", () => {
          if (map.panTo) map.panTo(position);
          else map.setCenter(position);
          map.setZoom(15);
        });
        markerRefs.current.push(marker);
        if (listener) listenerRefs.current.push(listener);
      });
    }
    // [Level 2] Zoom 14 ~ 15 : 동/생활권 단위 클러스터
    else if (zoom < 16) {
      const dongGroups = groupBuildingsByDong(buildings);
      dongGroups.forEach((group) => {
        const position = new maps.LatLng(group.lat, group.lng);
        const content = makeRealEstateMarker(group.dong, `${group.transactionCount}건`, false, "dong");
        const marker = new maps.Marker({
          position,
          map,
          title: `${group.dong} 실거래 ${group.transactionCount}건`,
          icon: { content, anchor: maps.Point ? new maps.Point(36, 22) : undefined },
        });
        const listener = maps.Event?.addListener(marker, "click", () => {
          if (map.panTo) map.panTo(position);
          else map.setCenter(position);
          map.setZoom(16); // 가장 작은 건물 단위로 드릴다운
        });
        markerRefs.current.push(marker);
        if (listener) listenerRefs.current.push(listener);
      });
    }
    // [Level 3] Zoom >= 16 : 가장 적은 단위 (개별 건물/단지/매물) 상세 뷰 (빠른 렌더링을 위해 뷰포트 기반 필터링)
    else {
      const bounds = map.getBounds();
      const sw = bounds?.getSW ? bounds.getSW() : null;
      const ne = bounds?.getNE ? bounds.getNE() : null;

      // 현재 화면 내에 위치한 건물만 렌더링하여 DOM 부하를 줄이고 렌더링 속도 극대화
      const visibleBuildings = buildings.filter((b) => {
        if (!sw || !ne) return true;
        return (
          b.lat >= sw.lat() - 0.005 &&
          b.lat <= ne.lat() + 0.005 &&
          b.lng >= sw.lng() - 0.005 &&
          b.lng <= ne.lng() + 0.005
        );
      });

      const renderTargets = visibleBuildings.length > 0 ? visibleBuildings : buildings.slice(0, 50);

      renderTargets.forEach((building) => {
        const latest = building.latestTransaction;
        const title = latest.rentType === "monthly" ? `월 ${latest.monthlyRent}` : "전세";
        const detail =
          latest.rentType === "monthly"
            ? `보증 ${latest.deposit.toLocaleString()}`
            : latest.deposit.toLocaleString();
        const position = new maps.LatLng(building.lat, building.lng);
        const isSelected = building.id === selectedBuildingId;
        const content = makeRealEstateMarker(title, detail, isSelected, "building");
        const marker = new maps.Marker({
          position,
          map,
          title: displayBuildingName(latest),
          zIndex: isSelected ? 300 : 100,
          icon: { content, anchor: maps.Point ? new maps.Point(30, 20) : undefined },
        });
        const listener = maps.Event?.addListener(marker, "click", () => onSelectBuilding(building));
        markerRefs.current.push(marker);
        if (listener) listenerRefs.current.push(listener);
      });
    }

    return () => {
      markerRefs.current.forEach((marker) => marker.setMap(null));
      listenerRefs.current.forEach((listener) => maps.Event?.removeListener(listener));
      markerRefs.current = [];
      listenerRefs.current = [];
    };
  }, [buildings, mapReady, onSelectBuilding, selectedBuildingId, zoom]);

  const handleZoomIn = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(Math.min(map.getZoom() + 1, 19));
  };

  const handleZoomOut = () => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(Math.max(map.getZoom() - 1, 10));
  };

  const handleRecenter = () => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map) return;
    const pos = new maps.LatLng(targetCenter.lat, targetCenter.lng);
    if (map.panTo) map.panTo(pos);
    else map.setCenter(pos);
    map.setZoom(DEFAULT_GRANULAR_ZOOM);
  };

  const scaleText =
    zoom >= 16
      ? "🏢 단지·건물 상세 뷰 (최소 단위)"
      : zoom >= 14
      ? "🏘️ 동별 묶어보기"
      : "🗺️ 구별 광역 묶어보기";

  return (
    <div className={styles.realEstateMapCanvas}>
      <div ref={mapElementRef} className={styles.realEstateNaverMap} />

      {/* 척도 단계 배지 */}
      <div className={styles.realEstateScaleBadge}>
        <span />
        {scaleText}
      </div>

      {!NAVER_MAP_KEY_ID ? (
        <div className={styles.realEstateMapUnavailable}>
          <MapPinned size={32} />
          <strong>네이버 지도 키가 필요해요</strong>
          <span>목록의 실거래 정보는 계속 확인할 수 있습니다.</span>
        </div>
      ) : null}

      {/* 우측 하단 컨트롤 (확대, 축소, 최소 단위 재정렬) */}
      <div className={styles.realEstateControlGroup}>
        <button
          type="button"
          className={styles.realEstateZoomBtn}
          aria-label="지도 확대"
          onClick={handleZoomIn}
        >
          <Plus size={20} />
        </button>
        <button
          type="button"
          className={styles.realEstateZoomBtn}
          aria-label="지도 축소"
          onClick={handleZoomOut}
        >
          <Minus size={20} />
        </button>
        <button
          type="button"
          className={styles.realEstateRecenter}
          aria-label={`${district} 중심으로 이동`}
          onClick={handleRecenter}
        >
          <Crosshair size={22} />
        </button>
      </div>
    </div>
  );
}
