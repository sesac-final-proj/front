import React, { useState, useEffect, useRef } from "react";
import { MapPinned, Crosshair } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { DonationFacility } from "@/types";
import { NEIGHBORHOOD_COORDS } from "../../constants";
import { KAKAO_MAP_KEY, loadKakaoMapScript } from "../map";
import { DreamFacilityCallout } from "./DreamFacilityCallout";

export function createDreamFacilityMarkerContent(
  facility: DonationFacility,
  selected: boolean,
  onSelectFacility: (facility: DonationFacility | null) => void,
) {
  const marker = document.createElement("span");
  marker.className = `${styles.dreamFacilityPin} ${styles.dreamLivePin} ${selected ? styles.dreamFacilityPinSelected : ""}`;
  marker.tabIndex = 0;
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `${facility.name} 모금 현황`);

  const mascot = document.createElement("span");
  mascot.className = styles.dreamFacilityPinMascot;
  const image = document.createElement("img");
  image.src = "/dream/baby-elephant.png";
  image.alt = "";
  mascot.append(image);

  const label = document.createElement("span");
  label.className = styles.dreamFacilityPinLabel;
  label.textContent = facility.name;

  if (selected) marker.append(label);
  marker.append(mascot);
  marker.addEventListener("click", () => onSelectFacility(selected ? null : facility));
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectFacility(selected ? null : facility);
  });
  return marker;
}

export interface DreamMapLayerProps {
  activeNeighborhood: string;
  facilities: DonationFacility[];
  selectedFacility: DonationFacility | null;
  onSelectFacility: (facility: DonationFacility | null) => void;
}

export function DreamMapLayer({
  activeNeighborhood,
  facilities,
  selectedFacility,
  onSelectFacility,
}: DreamMapLayerProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlayRefs = useRef<any[]>([]);
  const [isKakaoMapReady, setIsKakaoMapReady] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const canUseKakaoMap = Boolean(KAKAO_MAP_KEY && isKakaoMapReady);

  useEffect(() => {
    if (!KAKAO_MAP_KEY) return;
    let isMounted = true;
    loadKakaoMapScript(KAKAO_MAP_KEY)
      .then(() => {
        if (isMounted) setIsKakaoMapReady(Boolean((window as any).kakao?.maps?.Map));
      })
      .catch(() => {
        if (isMounted) {
          setIsKakaoMapReady(false);
          setHasMapError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const kakao = (window as any).kakao;
    const mapElement = mapElementRef.current;
    if (!mapElement || !kakao?.maps?.Map || !canUseKakaoMap) return;

    const centerCoord = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
    const center = new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng);
    const level = 4;

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(mapElement, {
        center,
        level,
      });

      kakao.maps.event.addListener(mapRef.current, "click", () => {
        onSelectFacility(null);
      });
    } else {
      mapRef.current.setCenter(center);
      mapRef.current.setLevel(level);
    }
  }, [activeNeighborhood, canUseKakaoMap]);

  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!kakao?.maps || !map || !canUseKakaoMap) return;

    overlayRefs.current.forEach((overlay) => overlay.setMap(null));
    overlayRefs.current = [];

    const newOverlays: any[] = [];
    facilities.forEach((facility) => {
      const isSelected = facility.id === selectedFacility?.id;
      const content = createDreamFacilityMarkerContent(facility, isSelected, onSelectFacility);
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(facility.lat, facility.lng),
        content,
        yAnchor: 1.0,
        zIndex: isSelected ? 100 : 50,
      });
      overlay.setMap(map);
      newOverlays.push(overlay);
    });

    overlayRefs.current = newOverlays;

    return () => {
      overlayRefs.current.forEach((overlay) => overlay.setMap(null));
      overlayRefs.current = [];
    };
  }, [facilities, selectedFacility, canUseKakaoMap, onSelectFacility]);

  return (
    <div className={styles.dreamMapCanvas}>
      <div className={styles.kakaoMapFrame}>
        <div ref={mapElementRef} className={styles.kakaoMapLayer} aria-hidden={!canUseKakaoMap} />
      </div>
      {selectedFacility && (
        <DreamFacilityCallout
          facility={selectedFacility}
          onClose={() => onSelectFacility(null)}
        />
      )}
      {!canUseKakaoMap && (
        <div className={styles.dreamMapUnavailable} role="status">
          <MapPinned size={28} />
          <span>{hasMapError ? "지도를 불러오지 못했어요" : "지도를 연결하고 있어요"}</span>
          <small>모금 현황은 아래에서 확인할 수 있어요.</small>
        </div>
      )}
      <button
        type="button"
        className={styles.dreamMapRecenter}
        aria-label="우리 동네 위치로"
        title="우리 동네 위치로"
        disabled={!canUseKakaoMap}
        onClick={() => {
          const kakao = (window as any).kakao;
          const center = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
          if (!kakao?.maps || !mapRef.current) return;
          mapRef.current.setCenter(new kakao.maps.LatLng(center.lat, center.lng));
          mapRef.current.setLevel(4);
        }}
      >
        <Crosshair size={22} />
      </button>
    </div>
  );
}
