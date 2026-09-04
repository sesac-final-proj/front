"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  getSeedPastelTheme,
  getCongestionPopulationLabel,
  getRestaurantsByBounds,
  type CongestionZone,
  type Restaurant,
} from "@/services";
import styles from "../../GajiMarketApp.module.css";
import transitStyles from "./TransitSection.module.css";
import type { TransitBounds, TransitStop } from "@/services/transitService";

export const KAKAO_MAP_KEY =
  process.env.NEXT_PUBLIC_KAKAO_MAP_KEY ||
  process.env.KAKAO_JAVASCRIPT_KEY ||
  "9e8d843f0342913acd917cdcf018807e";

const KAKAO_MAP_SCRIPT_ID = "kakao-map-script";
let kakaoMapScriptPromise: Promise<void> | null = null;

export function loadKakaoMapScript(appKey: string = KAKAO_MAP_KEY): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if ((window as any).kakao?.maps?.Map) {
    return Promise.resolve();
  }
  if (kakaoMapScriptPromise) {
    return kakaoMapScriptPromise;
  }

  kakaoMapScriptPromise = new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      if ((window as any).kakao?.maps?.load) {
        (window as any).kakao.maps.load(() => resolve());
      } else {
        resolve();
      }
    };

    const existingScript = document.getElementById(KAKAO_MAP_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      if ((window as any).kakao?.maps?.load) {
        (window as any).kakao.maps.load(() => resolve());
      } else {
        existingScript.addEventListener("load", onLoaded, { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Kakao map script failed to load")), {
          once: true,
        });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_MAP_SCRIPT_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&libraries=clusterer,services&autoload=false`;
    script.async = true;
    script.addEventListener("load", onLoaded, { once: true });
    script.addEventListener("error", () => reject(new Error("Kakao map script failed to load")), { once: true });
    document.head.appendChild(script);
  });

  return kakaoMapScriptPromise;
}

// 사진 2번: 당근 실시간 현 위치 ("내 장소") 동심원 펄스 마커
export function createCurrentLocationOverlayHtml(isDark: boolean): string {
  const textShadow = isDark
    ? "0 1px 4px rgba(0, 0, 0, 0.95), 0 0 2px rgba(0, 0, 0, 0.9)"
    : "0 1px 3px rgba(255, 255, 255, 0.95), 0 0 2px rgba(255, 255, 255, 0.9)";
  const textColor = isDark ? "#FFFFFF" : "#18181b";

  return `
    <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto; user-select: none;">
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <!-- Outer pulsating halo -->
        <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(49, 130, 246, 0.22); border: 1.5px solid rgba(49, 130, 246, 0.45); box-shadow: none;"></div>
        <!-- Inner white circle with blue center -->
        <div style="width: 20px; height: 20px; border-radius: 50%; background: #FFFFFF; border: 3px solid #3182F6; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center; z-index: 1;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #3182F6;"></div>
        </div>
        <!-- Mini home icon badge on top right -->
        <div style="position: absolute; top: 0px; right: 1px; width: 16px; height: 16px; border-radius: 50%; background: #3182F6; border: 1.5px solid #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 2;">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
      </div>
      <span style="margin-top: 1px; font-size: 11px; font-weight: 750; color: ${textColor}; text-shadow: ${textShadow}; letter-spacing: -0.2px;">
        내 장소
      </span>
    </div>
  `;
}

// 사진 2번 & 3번: 음식점 오버레이 엘리먼트 (일반: 살구색 🍴 배지+상호명, 선택: 대형 오렌지 물방울 핀+굵은 상호명)
export function createRestaurantOverlayElement(
  restaurant: Restaurant,
  isSelected: boolean,
  isDark: boolean,
  onClick: () => void,
): HTMLDivElement {
  const container = document.createElement("div");
  container.style.cursor = "pointer";
  container.style.userSelect = "none";

  if (isSelected) {
    // 사진 3번: 주황색 물방울 핀(위치 핀) + 하단 굵은 상호명
    const textShadow = isDark
      ? "0 2px 6px rgba(0, 0, 0, 0.95), 0 0 4px rgba(0, 0, 0, 0.95)"
      : "0 1px 4px #FFFFFF, 0 0 3px #FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#111827";

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translateY(-16px); transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <div style="filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22));">
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="#FF6F0F"/>
            <circle cx="17" cy="17" r="8" fill="#1C1D21"/>
            <path d="M14.5 12.5V15.5A1.5 1.5 0 0 1 13 17V21M13 14H16M19.5 12.5V21" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 13px; font-weight: 600; color: ${textColor}; text-shadow: ${textShadow}; white-space: nowrap; letter-spacing: -0.3px;">
          ${restaurant.name}
        </span>
      </div>
    `;
  } else {
    // 사진 2번: 살구색 원형 배지(🍴) + 우측 상호명 라벨
    const badgeBg = "var(--color-primary-container)";
    const iconColor = "var(--color-primary)";
    const textShadow = isDark
      ? "0 1px 4px rgba(0, 0, 0, 0.95), 0 0 3px rgba(0, 0, 0, 0.9)"
      : "0 0 3px #FFFFFF, 0 1px 2px #FFFFFF";
    const textColor = isDark ? "#FFFFFF" : "#1F2937";

    container.innerHTML = `
      <div style="display: flex; align-items: center; gap: 5px; transition: transform 0.15s ease;">
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${badgeBg};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
          flex-shrink: 0;
        ">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${iconColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
            <path d="M15 11v11" />
            <path d="M5 2v4a3 3 0 0 0 3 3h0a3 3 0 0 0 3-3V2" />
            <path d="M8 9v13" />
          </svg>
        </div>
        <span style="
          font-size: 11.5px;
          font-weight: 600;
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          color: ${textColor};
          text-shadow: ${textShadow};
          white-space: nowrap;
          letter-spacing: -0.3px;
        ">
          ${restaurant.name}
        </span>
      </div>
    `;
  }

  container.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });

  return container;
}

// 80% 이상 중첩된 클러스터용 원형 뱃지 오버레이 엘리먼트
export function createClusterOverlayElement(
  count: number,
  isDark: boolean,
  onClick: () => void,
): HTMLDivElement {
  const container = document.createElement("div");
  const button = document.createElement("button");
  button.type = "button";
  button.className = styles.restaurantClusterMarker;
  button.dataset.theme = isDark ? "dark" : "light";
  button.setAttribute("aria-label", `이 위치의 음식점 ${count}곳 보기`);
  button.textContent = String(count);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  container.append(button);
  return container;
}

interface MarkerBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  area: number;
  cx: number;
  cy: number;
}

function getRestaurantMarkerBox(point: { x: number; y: number }, name: string): MarkerBox {
  const textWidth = Math.min(Math.max(name.length * 11.5, 36), 160);
  const width = 24 + 5 + textWidth + 8;
  const height = 26;
  return {
    left: point.x - width / 2,
    right: point.x + width / 2,
    top: point.y - height / 2,
    bottom: point.y + height / 2,
    width,
    height,
    area: width * height,
    cx: point.x,
    cy: point.y,
  };
}

function calculateMarkerOverlapRatio(boxA: MarkerBox, boxB: MarkerBox): number {
  const interLeft = Math.max(boxA.left, boxB.left);
  const interRight = Math.min(boxA.right, boxB.right);
  const interTop = Math.max(boxA.top, boxB.top);
  const interBottom = Math.min(boxA.bottom, boxB.bottom);

  if (interRight <= interLeft || interBottom <= interTop) {
    return 0;
  }

  const interArea = (interRight - interLeft) * (interBottom - interTop);
  const minArea = Math.min(boxA.area, boxB.area);
  return interArea / minArea;
}

/**
 * 교집합 80% (overlapRatio >= 0.80) 기준 스마트 클러스터링 알고리즘
 */
export function clusterRestaurantsByOverlap(
  restaurants: Restaurant[],
  map: any,
): Restaurant[][] {
  if (restaurants.length === 0) return [];
  if (!map) return restaurants.map((r) => [r]);

  const proj = map.getProjection ? map.getProjection() : null;
  const kakao = (window as any).kakao;
  if (!proj || !kakao?.maps) {
    return restaurants.map((r) => [r]);
  }

  const n = restaurants.length;
  const boxes: MarkerBox[] = [];

  for (let i = 0; i < n; i++) {
    const pos = new kakao.maps.LatLng(restaurants[i].lat, restaurants[i].lng);
    const point = proj.pointFromCoords(pos);
    boxes.push(getRestaurantMarkerBox(point, restaurants[i].name));
  }

  // Disjoint-Set Union (Union-Find)
  const parent = Array.from({ length: n }, (_, idx) => idx);
  function find(i: number): number {
    if (parent[i] === i) return i;
    return (parent[i] = find(parent[i]));
  }
  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) parent[rootI] = rootJ;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const overlap = calculateMarkerOverlapRatio(boxes[i], boxes[j]);
      const dist = Math.hypot(boxes[i].cx - boxes[j].cx, boxes[i].cy - boxes[j].cy);

      // 클러스터링 기준: 교집합 80% (0.80) 이상 또는 극히 인접(14px 이내)
      if (overlap >= 0.80 || dist <= 14) {
        union(i, j);
      }
    }
  }

  const clustersMap = new Map<number, Restaurant[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    if (!clustersMap.has(root)) {
      clustersMap.set(root, []);
    }
    clustersMap.get(root)!.push(restaurants[i]);
  }

  return Array.from(clustersMap.values());
}


// SEED Design System (seed-design.io) 기반 자연스럽게 녹아드는 파스텔 열지도 및 카토그래픽 텍스트 (박스 없는 자연스러운 지도 융합)
export function createSeedPastelHeatmapElement(
  zone: CongestionZone,
  isDark: boolean,
  onClick?: () => void,
): HTMLDivElement {
  const score = Math.max(0, Math.min(100, zone.currentScore));
  const theme = getSeedPastelTheme(score, isDark ? "dark" : "light");
  const container = document.createElement("div");
  container.className = styles.congestionHeatmap;
  const diameter = Math.round(220 + score * 0.7);
  container.style.setProperty("--heat-size", `${diameter}px`);
  // Transparent edges and bounded opacity: source-over, never additive light.
  const rgb = theme.tagColor.match(/[a-f0-9]{2}/gi)!.map((hex) => parseInt(hex, 16)).join(", ");
  const opacity = isDark ? 0.20 : 0.30;
  const field = document.createElement("div");
  field.className = styles.congestionHeatmapField;
  field.style.filter = isDark ? "saturate(1.625) brightness(0.9)" : "none";
  field.setAttribute("aria-hidden", "true");
  field.style.background = `radial-gradient(circle, rgba(${rgb}, ${opacity}) 0%, rgba(${rgb}, ${opacity * 0.75}) 26%, rgba(${rgb}, ${opacity * 0.3}) 52%, rgba(${rgb}, 0) 74%)`;

  const label = document.createElement(onClick ? "button" : "div");
  label.className = styles.congestionMapLabel;
  if (label instanceof HTMLButtonElement) label.type = "button";
  label.style.setProperty("--congestion-accent", theme.badgeText);
  label.style.setProperty("--heat-label-color", isDark ? "#E5E5E8" : "#202124");
  label.style.setProperty("--heat-label-halo", isDark ? "#202124" : "#FFFFFF");
  const statusText = [zone.levelLabel ?? theme.label, getCongestionPopulationLabel(zone)].filter(Boolean).join(" · ");
  label.setAttribute("aria-label", `${zone.name}, ${statusText}`);
  const title = document.createElement("span");
  title.className = styles.congestionMapTitle;
  title.textContent = zone.name;
  const status = document.createElement("span");
  status.className = styles.congestionMapStatus;
  status.textContent = statusText;
  label.append(title, status);
  container.append(field, label);
  if (onClick) label.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });
  return container;
}

export interface KakaoMapLayerProps<T extends { lat: number; lng: number }> {
  activeNeighborhood: string;
  currentLocation: { lat: number; lng: number } | null;
  centerRequest: number;
  selectedCategory?: string;
  selectedRestaurantId?: string | null;
  congestionZones?: CongestionZone[];
  transitStops?: TransitStop[];
  selectedTransitId?: string | null;
  transitFocus?: TransitStop | null;
  onTransitBoundsChange?: (bounds: TransitBounds) => void;
  onSelectTransit?: (stop: TransitStop) => void;
  businesses: T[];
  renderBusinessMarker: (business: T) => HTMLElement;
  onCongestionBoundsChange: (bounds: { south: number; north: number; west: number; east: number }) => void;
  theme: "dark" | "light";
  onSelectRestaurants: (restaurants: Restaurant[], singleId: string | null) => void;
  onRestaurantsLoaded: (restaurants: Restaurant[]) => void;
  onClearRestaurants: () => void;
  onSearchBounds: (bounds: { south: number; north: number; west: number; east: number }) => void;
  coordsMap: Record<string, { lat: number; lng: number }>;
}

export function KakaoMapLayer<T extends { lat: number; lng: number }>({
  activeNeighborhood,
  currentLocation,
  centerRequest,
  selectedCategory,
  selectedRestaurantId,
  congestionZones = [],
  transitStops = [],
  selectedTransitId,
  transitFocus,
  onTransitBoundsChange,
  onSelectTransit,
  businesses,
  renderBusinessMarker,
  onCongestionBoundsChange,
  theme,
  onSelectRestaurants,
  onRestaurantsLoaded,
  onClearRestaurants,
  onSearchBounds,
  coordsMap,
}: KakaoMapLayerProps<T>) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [isKakaoMapReady, setIsKakaoMapReady] = useState(false);
  const [hasScriptError, setHasScriptError] = useState(false);
  const [isZoomTooLow, setIsZoomTooLow] = useState(false);
  const canUseKakaoMap = Boolean(KAKAO_MAP_KEY && isKakaoMapReady);

  const isRestaurantMode = selectedCategory === "food";
  const isCongestionMode = selectedCategory === "congestion";
  const isTransitMode = selectedCategory === "subway" || selectedCategory === "bike";
  const restaurantOverlaysRef = useRef<any[]>([]);
  const businessOverlaysRef = useRef<any[]>([]);
  const congestionOverlaysRef = useRef<any[]>([]);
  const restaurantRequestIdRef = useRef<number>(0);
  const previousBoundsRef = useRef<{ swLat: number; swLng: number; neLat: number; neLng: number } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const allLoadedRestaurantsRef = useRef<Restaurant[]>([]);

  // Stable callback refs
  const onSelectRestaurantsRef = useRef(onSelectRestaurants);
  const onRestaurantsLoadedRef = useRef(onRestaurantsLoaded);
  const onClearRestaurantsRef = useRef(onClearRestaurants);

  useEffect(() => {
    onSelectRestaurantsRef.current = onSelectRestaurants;
    onRestaurantsLoadedRef.current = onRestaurantsLoaded;
    onClearRestaurantsRef.current = onClearRestaurants;
  }, [onSelectRestaurants, onRestaurantsLoaded, onClearRestaurants]);

  const isDark = theme === "dark";

  // 1. Script Loading
  useEffect(() => {
    if (!KAKAO_MAP_KEY) return;
    let isMounted = true;
    loadKakaoMapScript(KAKAO_MAP_KEY)
      .then(() => {
        if (isMounted) {
          setIsKakaoMapReady(Boolean((window as any).kakao?.maps?.Map));
        }
      })
      .catch((err) => {
        console.error("Kakao map load failed:", err);
        if (isMounted) {
          setIsKakaoMapReady(false);
          setHasScriptError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1-1. 음식점 카테고리 진입 시 즉시 동네 주변 음식점 데이터 호출 (하단 시트 목록 즉시 활성화)
  useEffect(() => {
    if (!isRestaurantMode) return;
    const centerCoord = currentLocation ?? coordsMap[activeNeighborhood] ?? coordsMap["송파삼성래미안"] ?? { lat: 37.5029, lng: 127.1194 };
    const swLat = centerCoord.lat - 0.015;
    const swLng = centerCoord.lng - 0.02;
    const neLat = centerCoord.lat + 0.015;
    const neLng = centerCoord.lng + 0.02;

    getRestaurantsByBounds({ swLat, swLng, neLat, neLng, limit: 100 }).then((restaurants) => {
      allLoadedRestaurantsRef.current = restaurants;
      onRestaurantsLoadedRef.current(restaurants);
    });
  }, [isRestaurantMode, activeNeighborhood, currentLocation, coordsMap]);

  // 2. Map creation and MarkerClusterer setup
  useEffect(() => {
    const kakao = (window as any).kakao;
    const container = mapElementRef.current;
    if (!container || !kakao?.maps?.Map || !canUseKakaoMap) return;

    const centerCoord = currentLocation ?? coordsMap[activeNeighborhood] ?? coordsMap["송파삼성래미안"] ?? { lat: 37.5029, lng: 127.1194 };
    const centerLatLng = new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng);

    if (!mapRef.current) {
      const map = new kakao.maps.Map(container, {
        center: centerLatLng,
        level: 4,
      });
      mapRef.current = map;

      // 지도 빈 공간 클릭 시 음식점 선택 해제 (자연스럽게 원래로 복귀)
      kakao.maps.event.addListener(map, "click", () => {
        onClearRestaurantsRef.current();
      });
    } else {
      mapRef.current.setCenter(centerLatLng);
    }
  }, [activeNeighborhood, currentLocation, centerRequest, canUseKakaoMap, coordsMap]);

  // Keep the visible map viewport above the transit sheet. Relayout preserves
  // center, so selecting a station cannot put its marker behind the list.
  useEffect(() => {
    const map = mapRef.current;
    const element = mapElementRef.current;
    if (!map || !element || !canUseKakaoMap) return;
    const observer = new ResizeObserver(() => {
      const center = map.getCenter();
      map.relayout();
      map.setCenter(center);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [canUseKakaoMap]);

  // 3. Current Location ("내 장소") Overlay (사진 2번)
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !currentLocation) return;

    const centerCoord = currentLocation;
    const centerLatLng = new kakao.maps.LatLng(centerCoord.lat, centerCoord.lng);

    const wrapper = document.createElement("div");
    wrapper.innerHTML = createCurrentLocationOverlayHtml(isDark);

    const placeOverlay = new kakao.maps.CustomOverlay({
      position: centerLatLng,
      content: wrapper,
      yAnchor: 0.5,
      zIndex: 100,
    });
    placeOverlay.setMap(map);

    return () => {
      placeOverlay.setMap(null);
    };
  }, [activeNeighborhood, currentLocation, centerRequest, canUseKakaoMap, isDark, coordsMap]);

  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    businessOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    businessOverlaysRef.current = [];
    if (!map || !kakao?.maps || !canUseKakaoMap || selectedCategory !== "danger") return;

    businessOverlaysRef.current = businesses.map((business) => {
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(business.lat, business.lng),
        content: renderBusinessMarker(business),
        xAnchor: 0,
        yAnchor: 0,
        zIndex: 80,
      });
      overlay.setMap(map);
      return overlay;
    });

    return () => {
      businessOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      businessOverlaysRef.current = [];
    };
  }, [businesses, canUseKakaoMap, renderBusinessMarker, selectedCategory]);

  // 4. Restaurant Layer: bounds fetch, 80% overlap clustering, and custom overlays
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !isRestaurantMode) {
      restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
      restaurantOverlaysRef.current = [];
      previousBoundsRef.current = null;
      setIsZoomTooLow(false);
      return;
    }

    // 80% 교집합 기반 오버레이 렌더링 함수
    const renderRestaurantClusters = () => {
      restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
      restaurantOverlaysRef.current = [];

      const restaurants = allLoadedRestaurantsRef.current;
      if (restaurants.length === 0) return;

      const clusters = clusterRestaurantsByOverlap(restaurants, map);
      const newOverlays: any[] = [];

      clusters.forEach((cluster) => {
        if (cluster.length === 1) {
          // 단독 마커
          const restaurant = cluster[0];
          const isSelected = selectedRestaurantId === restaurant.id;
          const pos = new kakao.maps.LatLng(restaurant.lat, restaurant.lng);

          const el = createRestaurantOverlayElement(restaurant, isSelected, isDark, () => {
            onSelectRestaurantsRef.current([restaurant], restaurant.id);
          });

          const overlay = new kakao.maps.CustomOverlay({
            position: pos,
            content: el,
            yAnchor: isSelected ? 0.95 : 0.5,
            zIndex: isSelected ? 1000 : 50,
          });
          overlay.setMap(map);
          newOverlays.push(overlay);
        } else {
          // 80% 이상 중첩된 클러스터 마커
          let latSum = 0;
          let lngSum = 0;
          let hasSelected = false;
          for (const r of cluster) {
            latSum += r.lat;
            lngSum += r.lng;
            if (selectedRestaurantId === r.id) hasSelected = true;
          }
          const avgLat = latSum / cluster.length;
          const avgLng = lngSum / cluster.length;
          const clusterPos = new kakao.maps.LatLng(avgLat, avgLng);

          const el = createClusterOverlayElement(cluster.length, isDark, () => {
            // 클러스터 클릭 시: 해당 클러스터 식당 리스트로 전달하여 바텀시트에 목록 표시!
            onSelectRestaurantsRef.current(cluster, null);
            map.panTo(clusterPos);
          });

          const overlay = new kakao.maps.CustomOverlay({
            position: clusterPos,
            content: el,
            yAnchor: 0.5,
            xAnchor: 0.5,
            zIndex: hasSelected ? 900 : 150,
          });
          overlay.setMap(map);
          newOverlays.push(overlay);
        }
      });

      restaurantOverlaysRef.current = newOverlays;
    };

    const fetchRestaurantsForCurrentBounds = () => {
      const level = map.getLevel();
      // 카카오맵 레벨: 1~5 확대, 6 초과 시 축소 안내
      if (level > 6) {
        setIsZoomTooLow(true);
        onRestaurantsLoadedRef.current([]);
        restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
        restaurantOverlaysRef.current = [];
        return;
      }
      setIsZoomTooLow(false);

      const bounds = map.getBounds();
      if (!bounds) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const swLat = sw.getLat();
      const swLng = sw.getLng();
      const neLat = ne.getLat();
      const neLng = ne.getLng();

      const prev = previousBoundsRef.current;
      if (
        prev &&
        restaurantOverlaysRef.current.length > 0 &&
        Math.abs(prev.swLat - swLat) < 0.0001 &&
        Math.abs(prev.swLng - swLng) < 0.0001 &&
        Math.abs(prev.neLat - neLat) < 0.0001 &&
        Math.abs(prev.neLng - neLng) < 0.0001
      ) {
        return;
      }
      previousBoundsRef.current = { swLat, swLng, neLat, neLng };

      const requestId = ++restaurantRequestIdRef.current;

      getRestaurantsByBounds({ swLat, swLng, neLat, neLng, limit: 100 }).then((restaurants) => {
        if (requestId !== restaurantRequestIdRef.current) return;
        allLoadedRestaurantsRef.current = restaurants;
        onRestaurantsLoadedRef.current(restaurants);

        renderRestaurantClusters();
      });
    };

    // 지도를 확대/축소했을 때 클러스터링 즉시 재계산
    const onZoomChanged = () => {
      renderRestaurantClusters();
    };

    // Idle listener with 300ms debounce
    const onIdle = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchRestaurantsForCurrentBounds();
      }, 300);
    };

    kakao.maps.event.addListener(map, "idle", onIdle);
    kakao.maps.event.addListener(map, "zoom_changed", onZoomChanged);

    fetchRestaurantsForCurrentBounds();

    return () => {
      ++restaurantRequestIdRef.current;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      kakao.maps.event.removeListener(map, "idle", onIdle);
      kakao.maps.event.removeListener(map, "zoom_changed", onZoomChanged);
      restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
      restaurantOverlaysRef.current = [];
      previousBoundsRef.current = null;
    };
  }, [isRestaurantMode, canUseKakaoMap, isDark, selectedRestaurantId]);

  // Transit uses its own overlays so switching categories removes every marker.
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !isTransitMode) return;
    const overlays = transitStops.map((stop) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = transitStyles.marker;
      button.dataset.kind = stop.kind;
      button.dataset.empty = String(stop.kind === "bike" && stop.bikes_available === 0);
      button.setAttribute("aria-pressed", String(stop.id === selectedTransitId));
      const availability = stop.bikes_available === null ? "확인 불가" : `${stop.bikes_available}대`;
      button.textContent = stop.kind === "bike" ? `자전거 ${availability}` : stop.name;
      button.setAttribute("aria-label", `${stop.name} ${stop.kind === "bike" ? availability : stop.line ?? ""}`);
      button.title = `${stop.name} ${stop.line ?? ""}`.trim();
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        kakao.maps.event.preventMap?.();
        onSelectTransit?.(stop);
      });
      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(stop.lat, stop.lng), content: button,
        yAnchor: 1.2, xAnchor: 0.5, zIndex: stop.id === selectedTransitId ? 200 : 70,
      });
      overlay.setMap(map);
      return overlay;
    });
    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [canUseKakaoMap, isTransitMode, transitStops, selectedTransitId, onSelectTransit]);

  useEffect(() => {
    const kakao = (window as any).kakao;
    if (!canUseKakaoMap || !isTransitMode || !transitFocus || !mapRef.current || !kakao?.maps) return;
    mapRef.current.panTo(new kakao.maps.LatLng(transitFocus.lat, transitFocus.lng));
  }, [canUseKakaoMap, isTransitMode, transitFocus]);

  useEffect(() => {
    if (!isTransitMode || !onTransitBoundsChange) return;
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    // The list remains usable if the map SDK is unavailable.
    if (!map || !kakao?.maps || !canUseKakaoMap) {
      const center = currentLocation ?? coordsMap[activeNeighborhood] ?? { lat: 37.5029, lng: 127.1194 };
      onTransitBoundsChange({ south: center.lat - .015, north: center.lat + .015, west: center.lng - .02, east: center.lng + .02 });
      return;
    }
    const publishBounds = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onTransitBoundsChange({ south: sw.getLat(), north: ne.getLat(), west: sw.getLng(), east: ne.getLng() });
    };
    publishBounds();
    kakao.maps.event.addListener(map, "idle", publishBounds);
    return () => kakao.maps.event.removeListener(map, "idle", publishBounds);
  }, [canUseKakaoMap, isTransitMode, onTransitBoundsChange, activeNeighborhood, currentLocation, centerRequest, coordsMap]);

  // 6. Congestion Layer: 카카오 지도 위 SEED Design 파스텔 히트맵 오버레이
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !isCongestionMode) {
      congestionOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      congestionOverlaysRef.current = [];
      return;
    }

    congestionOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
    congestionOverlaysRef.current = [];

    const placedLabels: { left: number; right: number; top: number; bottom: number }[] = [];
    const projection = map.getProjection();
    const mapWidth = mapElementRef.current?.clientWidth ?? 390;
    const newOverlays = [...congestionZones].sort((a, b) => b.currentScore - a.currentScore).map((zone) => {
      const el = createSeedPastelHeatmapElement(zone, isDark, () => {
        map.panTo(new kakao.maps.LatLng(zone.lat, zone.lng));
      });
      const point = projection.containerPointFromCoords(new kakao.maps.LatLng(zone.lat, zone.lng));
      const label = el.querySelector<HTMLElement>(`.${styles.congestionMapLabel}`)!;
      const labelWidth = Math.min(208, mapWidth * 0.56);
      const x = Math.max(labelWidth / 2 + 8, Math.min(mapWidth - labelWidth / 2 - 8, point.x));
      const box = { left: x - labelWidth / 2, right: x + labelWidth / 2, top: point.y - 22, bottom: point.y + 22 };
      // Nearby areas can share a coordinate (for example, a station and a tourism district).
      // Keep all heat fields and list entries, but avoid drawing unreadable labels on top of each other.
      if (placedLabels.some((other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top)) {
        label.hidden = true;
        label.style.display = "none";
      } else {
        label.style.transform = `translateX(${x - point.x}px)`;
        placedLabels.push(box);
      }

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(zone.lat, zone.lng),
        content: el,
        yAnchor: 0.5,
        xAnchor: 0.5,
        zIndex: 120,
      });
      overlay.setMap(map);
      return overlay;
    });

    congestionOverlaysRef.current = newOverlays;

    return () => {
      congestionOverlaysRef.current.forEach((overlay) => overlay.setMap(null));
      congestionOverlaysRef.current = [];
    };
  }, [canUseKakaoMap, congestionZones, isCongestionMode, isDark]);

  // Viewport queries never change the map center or the bottom sheet state.
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !isCongestionMode) return;
    // Area-level population data needs a wider view than individual restaurant pins.
    // Keep the user's center; entering this mode only widens a street-level zoom.
    if (map.getLevel() < 6) map.setLevel(6);
    const publishBounds = () => {
      const bounds = map.getBounds();
      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      onCongestionBoundsChange({ south: sw.getLat(), north: ne.getLat(), west: sw.getLng(), east: ne.getLng() });
    };
    publishBounds();
    kakao.maps.event.addListener(map, "idle", publishBounds);
    return () => kakao.maps.event.removeListener(map, "idle", publishBounds);
  }, [canUseKakaoMap, isCongestionMode, onCongestionBoundsChange, activeNeighborhood, currentLocation, centerRequest]);

  return (
    <>
      <div className={styles.kakaoMapFrame}>
        <div ref={mapElementRef} className={styles.kakaoMapLayer} />
      </div>
      {hasScriptError && (
        <div
          className={styles.restaurantZoomAlert}
          style={{
            background: "rgba(220, 38, 38, 0.95)",
            color: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.35)",
            top: 140,
            maxWidth: "88%",
            textAlign: "center",
            fontSize: "12px",
            lineHeight: 1.4,
          }}
          role="alert"
        >
          ⚠️ 카카오 개발자 콘솔 [플랫폼] &gt; [Web]에 http://localhost:3000 을 등록해 주세요.
        </div>
      )}
      {isZoomTooLow && isRestaurantMode && (
        <div className={styles.restaurantZoomAlert} role="status">
          <span>🔍</span> 지도를 확대하면 음식점이 표시됩니다.
        </div>
      )}
      <button
        type="button"
        className={styles.mapSearchAgain}
        disabled={!canUseKakaoMap}
        title={canUseKakaoMap ? "현재 지도 범위에서 검색" : "지도를 불러오는 중"}
        onClick={() => {
          const bounds = mapRef.current?.getBounds();
          if (!bounds) return;
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          const currentBounds = { south: sw.getLat(), north: ne.getLat(), west: sw.getLng(), east: ne.getLng() };
          if (isTransitMode) onTransitBoundsChange?.(currentBounds);
          else onSearchBounds(currentBounds);
        }}
      >
        현 지도에서 검색
      </button>
    </>
  );
}
