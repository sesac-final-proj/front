"use client";

import React, { useEffect, useRef, useState } from "react";
import type { Restaurant } from "@/services/restaurantService";
import { getRestaurantsByBounds } from "@/services/restaurantService";
import styles from "../../GajiMarketApp.module.css";

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
        <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(49, 130, 246, 0.22); border: 1.5px solid rgba(49, 130, 246, 0.45); box-shadow: 0 0 14px rgba(49, 130, 246, 0.35);"></div>
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
        <div style="filter: drop-shadow(0 4px 10px rgba(255, 111, 15, 0.55));">
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 0C7.611 0 0 7.611 0 17C0 29.75 17 44 17 44C17 44 34 29.75 34 17C34 7.611 26.389 0 17 0Z" fill="#FF6F0F"/>
            <circle cx="17" cy="17" r="8" fill="#1C1D21"/>
            <path d="M14.5 12.5V15.5A1.5 1.5 0 0 1 13 17V21M13 14H16M19.5 12.5V21" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </div>
        <span style="margin-top: 2px; font-size: 13px; font-weight: 850; color: ${textColor}; text-shadow: ${textShadow}; white-space: nowrap; letter-spacing: -0.3px;">
          ${restaurant.name}
        </span>
      </div>
    `;
  } else {
    // 사진 2번: 살구색 원형 배지(🍴) + 우측 상호명 라벨
    const badgeBg = isDark ? "#F8C7A3" : "#FFDEC4";
    const iconColor = "#1F2128";
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
          font-weight: 750;
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

export interface KakaoMapLayerProps {
  activeNeighborhood: string;
  currentLocation: { lat: number; lng: number } | null;
  centerRequest: number;
  selectedCategory?: string;
  selectedRestaurantId?: string | null;
  theme: "dark" | "light";
  onSelectRestaurants: (restaurants: Restaurant[], singleId: string | null) => void;
  onRestaurantsLoaded: (restaurants: Restaurant[]) => void;
  onClearRestaurants: () => void;
  onSearchBounds: (bounds: { south: number; north: number; west: number; east: number }) => void;
  coordsMap: Record<string, { lat: number; lng: number }>;
}

export function KakaoMapLayer({
  activeNeighborhood,
  currentLocation,
  centerRequest,
  selectedCategory,
  selectedRestaurantId,
  theme,
  onSelectRestaurants,
  onRestaurantsLoaded,
  onClearRestaurants,
  onSearchBounds,
  coordsMap,
}: KakaoMapLayerProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [isKakaoMapReady, setIsKakaoMapReady] = useState(false);
  const [hasScriptError, setHasScriptError] = useState(false);
  const [isZoomTooLow, setIsZoomTooLow] = useState(false);
  const canUseKakaoMap = Boolean(KAKAO_MAP_KEY && isKakaoMapReady);

  const isRestaurantMode = selectedCategory === "food";
  const restaurantOverlaysRef = useRef<any[]>([]);
  const restaurantRequestIdRef = useRef<number>(0);
  const previousBoundsRef = useRef<{ swLat: number; swLng: number; neLat: number; neLng: number } | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const allLoadedRestaurantsRef = useRef<Restaurant[]>([]);

  // Stable callback refs
  const onSelectRestaurantsRef = useRef(onSelectRestaurants);
  onSelectRestaurantsRef.current = onSelectRestaurants;
  const onRestaurantsLoadedRef = useRef(onRestaurantsLoaded);
  onRestaurantsLoadedRef.current = onRestaurantsLoaded;
  const onClearRestaurantsRef = useRef(onClearRestaurants);
  onClearRestaurantsRef.current = onClearRestaurants;

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

      // 카카오 맵 MarkerClusterer 클러스터러 초기화 (일반 살구색 마커 대비 선명하고 진한 고채도 오렌지 적용)
      if (kakao.maps.MarkerClusterer) {
        clustererRef.current = new kakao.maps.MarkerClusterer({
          map: map,
          averageCenter: true,
          minLevel: 5,
          disableClickZoom: false,
          styles: [
            {
              width: "36px",
              height: "36px",
              background: "#FF4500",
              borderRadius: "50%",
              color: "#FFFFFF",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "14px",
              lineHeight: "32px",
              boxShadow: "0 4px 12px rgba(255, 69, 0, 0.45)",
              border: "2px solid #FFFFFF",
              cursor: "pointer",
            },
            {
              width: "42px",
              height: "42px",
              background: "#E63900",
              borderRadius: "50%",
              color: "#FFFFFF",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "15px",
              lineHeight: "37px",
              boxShadow: "0 5px 15px rgba(230, 57, 0, 0.55)",
              border: "2.5px solid #FFFFFF",
              cursor: "pointer",
            },
            {
              width: "48px",
              height: "48px",
              background: "#C92A00",
              borderRadius: "50%",
              color: "#FFFFFF",
              textAlign: "center",
              fontWeight: "900",
              fontSize: "16px",
              lineHeight: "43px",
              boxShadow: "0 6px 18px rgba(201, 42, 0, 0.65)",
              border: "2.5px solid #FFFFFF",
              cursor: "pointer",
            },
          ],
        });
      }

      // 지도 빈 공간 클릭 시 음식점 선택 해제 (자연스럽게 원래로 복귀)
      kakao.maps.event.addListener(map, "click", () => {
        onClearRestaurantsRef.current();
      });
    } else {
      mapRef.current.setCenter(centerLatLng);
    }
  }, [activeNeighborhood, currentLocation, centerRequest, canUseKakaoMap, coordsMap]);

  // 3. Current Location ("내 장소") Overlay (사진 2번)
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap) return;

    const centerCoord = currentLocation ?? coordsMap[activeNeighborhood] ?? coordsMap["송파삼성래미안"] ?? { lat: 37.5029, lng: 127.1194 };
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

  // 4. Restaurant Layer: bounds fetch, clusterer, and custom overlays
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !isRestaurantMode) {
      restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
      restaurantOverlaysRef.current = [];
      if (clustererRef.current) clustererRef.current.clear();
      previousBoundsRef.current = null;
      setIsZoomTooLow(false);
      return;
    }

    const fetchRestaurantsForCurrentBounds = () => {
      const level = map.getLevel();
      // 카카오맵 레벨: 1~5 확대, 6 초과 시 축소 안내
      if (level > 6) {
        setIsZoomTooLow(true);
        onRestaurantsLoadedRef.current([]);
        restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
        restaurantOverlaysRef.current = [];
        if (clustererRef.current) clustererRef.current.clear();
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

        // 기존 오버레이 및 클러스터 마커 정리
        restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
        restaurantOverlaysRef.current = [];
        if (clustererRef.current) clustererRef.current.clear();

        const newOverlays: any[] = [];
        const clusterMarkers: any[] = [];

        restaurants.forEach((restaurant) => {
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

          // 클러스터러용 마커 등록 (기본 파란색 핀이 커스텀 오버레이 위에 중복 노출되지 않도록 투명 1x1 아이콘 적용)
          if (kakao.maps.Marker) {
            const transparentIcon = kakao.maps.MarkerImage && kakao.maps.Size
              ? new kakao.maps.MarkerImage(
                  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                  new kakao.maps.Size(1, 1),
                )
              : undefined;

            const marker = new kakao.maps.Marker({
              position: pos,
              image: transparentIcon,
            });
            kakao.maps.event.addListener(marker, "click", () => {
              onSelectRestaurantsRef.current([restaurant], restaurant.id);
            });
            clusterMarkers.push(marker);
          }
        });

        restaurantOverlaysRef.current = newOverlays;
        if (clustererRef.current && clusterMarkers.length > 0) {
          clustererRef.current.addMarkers(clusterMarkers);
        }
      });
    };

    // Idle listener with 300ms debounce
    const onIdle = () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchRestaurantsForCurrentBounds();
      }, 300);
    };

    kakao.maps.event.addListener(map, "idle", onIdle);

    fetchRestaurantsForCurrentBounds();

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      kakao.maps.event.removeListener(map, "idle", onIdle);
      restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
      restaurantOverlaysRef.current = [];
      if (clustererRef.current) clustererRef.current.clear();
      previousBoundsRef.current = null;
    };
  }, [isRestaurantMode, canUseKakaoMap, isDark]);

  // 5. Re-render overlays when selectedRestaurantId changes (to toggle teardrop pin vs circular badge)
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapRef.current;
    if (!map || !kakao?.maps || !canUseKakaoMap || !isRestaurantMode) return;

    restaurantOverlaysRef.current.forEach((o) => o.setMap(null));
    restaurantOverlaysRef.current = [];

    const newOverlays: any[] = [];
    allLoadedRestaurantsRef.current.forEach((restaurant) => {
      const isSelected = selectedRestaurantId === restaurant.id;
      const el = createRestaurantOverlayElement(restaurant, isSelected, isDark, () => {
        onSelectRestaurantsRef.current([restaurant], restaurant.id);
      });

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(restaurant.lat, restaurant.lng),
        content: el,
        yAnchor: isSelected ? 0.95 : 0.5,
        zIndex: isSelected ? 1000 : 50,
      });
      overlay.setMap(map);
      newOverlays.push(overlay);
    });

    restaurantOverlaysRef.current = newOverlays;
  }, [selectedRestaurantId, isRestaurantMode, canUseKakaoMap, isDark]);

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
          onSearchBounds({ south: sw.getLat(), north: ne.getLat(), west: sw.getLng(), east: ne.getLng() });
        }}
      >
        현 지도에서 검색
      </button>
    </>
  );
}
