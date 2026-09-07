import React, { useState, useEffect, useRef } from "react";
import { MapPinned, Crosshair } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type {
  PropertyBuilding,
  RealEstateBounds,
  NaverMapInstance,
  NaverMarkerInstance,
} from "@/types";
import { NAVER_MAP_KEY_ID } from "../../constants";
import { loadNaverMapScript } from "../../utils";
import { groupBuildingsByDong } from "@/services";
import { REAL_ESTATE_DISTRICT_CENTERS, displayBuildingName } from "./constants";

export function makeRealEstateMarker(
  title: string,
  detail: string,
  selected: boolean,
  kind: "dong" | "building",
) {
  const root = document.createElement("button");
  root.type = "button";
  root.className = `${styles.realEstateMarker} ${kind === "dong" ? styles.realEstateDongMarker : styles.realEstateBuildingMarker} ${selected ? styles.realEstateMarkerSelected : ""}`;
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
  const [zoom, setZoom] = useState(13);
  const center = REAL_ESTATE_DISTRICT_CENTERS[district] ?? { lat: 37.5665, lng: 126.978 };

  useEffect(() => {
    if (!NAVER_MAP_KEY_ID) return;
    let mounted = true;
    loadNaverMapScript(NAVER_MAP_KEY_ID)
      .then(() => { if (mounted) setMapReady(Boolean(window.naver?.maps)); })
      .catch(() => { if (mounted) setMapReady(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const maps = window.naver?.maps;
    if (!maps || !mapElementRef.current || !mapReady) return;
    const position = new maps.LatLng(center.lat, center.lng);
    if (!mapRef.current) {
      mapRef.current = new maps.Map(mapElementRef.current, {
        center: position,
        zoom: 13,
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
      mapRef.current.setZoom(13);
    }
  }, [center.lat, center.lng, mapReady]);

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
        if (nextBounds.north - nextBounds.south < 0.001 || nextBounds.east - nextBounds.west < 0.001) {
          map.autoResize?.();
          return;
        }
        const centerLat = (nextBounds.south + nextBounds.north) / 2;
        const centerLng = (nextBounds.west + nextBounds.east) / 2;
        const outsideSeoul = centerLat < 37.413 || centerLat > 37.715 || centerLng < 126.734 || centerLng > 127.269;
        setZoom(map.getZoom());
        onViewportChange(nextBounds, outsideSeoul);
      }, 400);
    };
    const listener = maps.Event.addListener(map, "idle", emitViewport);
    emitViewport();
    return () => {
      window.clearTimeout(timer);
      maps.Event?.removeListener(listener);
    };
  }, [mapReady, onViewportChange]);

  useEffect(() => {
    const maps = window.naver?.maps;
    const map = mapRef.current;
    if (!maps || !map || !mapReady) return;
    markerRefs.current.forEach((marker) => marker.setMap(null));
    listenerRefs.current.forEach((listener) => maps.Event?.removeListener(listener));
    markerRefs.current = [];
    listenerRefs.current = [];

    if (zoom < 15) {
      groupBuildingsByDong(buildings).forEach((group) => {
        const position = new maps.LatLng(group.lat, group.lng);
        const content = makeRealEstateMarker(group.dong, `거래 ${group.transactionCount}`, false, "dong");
        const marker = new maps.Marker({
          position,
          map,
          title: `${group.dong} 거래 ${group.transactionCount}건`,
          icon: { content, anchor: maps.Point ? new maps.Point(48, 62) : undefined },
        });
        const listener = maps.Event?.addListener(marker, "click", () => {
          map.setCenter(position);
          map.setZoom(15);
        });
        markerRefs.current.push(marker);
        if (listener) listenerRefs.current.push(listener);
      });
    } else {
      buildings.forEach((building) => {
        const latest = building.latestTransaction;
        const title = latest.rentType === "monthly" ? `월 ${latest.monthlyRent}` : "전세";
        const detail = latest.rentType === "monthly" ? `보증 ${latest.deposit.toLocaleString()}` : latest.deposit.toLocaleString();
        const position = new maps.LatLng(building.lat, building.lng);
        const content = makeRealEstateMarker(title, detail, building.id === selectedBuildingId, "building");
        const marker = new maps.Marker({
          position,
          map,
          title: displayBuildingName(latest),
          zIndex: building.id === selectedBuildingId ? 200 : 100,
          icon: { content, anchor: maps.Point ? new maps.Point(44, 56) : undefined },
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

  return (
    <div className={styles.realEstateMapCanvas}>
      <div ref={mapElementRef} className={styles.realEstateNaverMap} />
      {!NAVER_MAP_KEY_ID ? (
        <div className={styles.realEstateMapUnavailable}>
          <MapPinned size={32} />
          <strong>네이버 지도 키가 필요해요</strong>
          <span>목록의 실거래 정보는 계속 확인할 수 있습니다.</span>
        </div>
      ) : null}
      <button
        type="button"
        className={styles.realEstateRecenter}
        aria-label={`${district} 중심으로 이동`}
        onClick={() => {
          const maps = window.naver?.maps;
          if (!maps || !mapRef.current) return;
          mapRef.current.setCenter(new maps.LatLng(center.lat, center.lng));
          mapRef.current.setZoom(13);
        }}
      >
        <Crosshair size={22} />
      </button>
    </div>
  );
}
