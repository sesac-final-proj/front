import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, UserRound, Heart, House, Crosshair } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type {
  LocalCategory,
  LocalBusiness,
  MapSearchBounds,
  ThemeMode,
  TransitKind,
  TransitBounds,
  TransitStop,
  Restaurant,
  CongestionZone,
  DangerVisual,
} from "@/types";
import { NEIGHBORHOOD_COORDS, DANGER_VISUALS } from "../../constants";
import {
  matchesCongestionQuery,
  matchesBusinessQuery,
  getDangerVisual,
  restaurantToLocalBusiness,
} from "../../utils";
import { fetchCongestionZones } from "@/services";
import { StateBlock } from "../common";
import { KakaoMapLayer } from "./KakaoMapLayer";
import { RestaurantClusterListSheet } from "./RestaurantClusterListSheet";
import { RestaurantDetailSheet } from "./RestaurantDetailSheet";
import { TransitSection } from "./TransitSection";
import { useTransitStops } from "./useTransitStops";
import { RealtimeDangerTicker } from "./RealtimeDangerTicker";
import { CongestionAnalysisSection } from "./CongestionAnalysisSection";
import { DangerSignalCallout } from "./DangerSignalCallout";

export function createDangerMarkerContent(
  business: LocalBusiness,
  visual: DangerVisual,
  onSelectBusiness: (business: LocalBusiness) => void,
) {
  const marker = document.createElement("div");
  const toneClass = styles[`dangerMarker_${visual.tone}` as keyof typeof styles] ?? "";
  marker.className = `${styles.dangerMapMarker} ${toneClass}`;
  marker.tabIndex = 0;
  marker.setAttribute("role", "button");
  marker.setAttribute("aria-label", `${visual.label}: ${business.name}`);
  marker.innerHTML = `<span>${visual.emoji}</span>`;
  marker.addEventListener("click", () => onSelectBusiness(business));
  marker.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelectBusiness(business);
  });
  return marker;
}

export interface MapScreenProps {
  activeNeighborhood: string;
  secondaryNeighborhood: string;
  categories: LocalCategory[];
  selectedCategory: string;
  sheetState: "collapsed" | "half" | "expanded";
  query: string;
  businesses: LocalBusiness[];
  allDangerSignals?: LocalBusiness[];
  hasSearchedArea: boolean;
  searchBounds: MapSearchBounds | null;
  onSearchBounds: (bounds: MapSearchBounds) => void;
  locationAllowed: boolean;
  theme: ThemeMode;
  onCategoryChange: (id: string) => void;
  onSheetStateChange: (state: "collapsed" | "half" | "expanded") => void;
  onQueryChange: (value: string) => void;
  onRequestLocation: () => void;
  onOpenProfile: () => void;
}

export function MapScreen({
  activeNeighborhood,
  secondaryNeighborhood,
  categories,
  selectedCategory,
  sheetState,
  query,
  businesses,
  allDangerSignals = [],
  hasSearchedArea,
  searchBounds,
  onSearchBounds,
  locationAllowed,
  theme,
  onCategoryChange,
  onSheetStateChange,
  onQueryChange,
  onRequestLocation,
  onOpenProfile,
}: MapScreenProps) {
  const liveDangerSignals = allDangerSignals.length > 0 ? allDangerSignals : businesses.filter((b) => b.category === "danger");
  const transitKind: TransitKind | null = selectedCategory === "subway" || selectedCategory === "bike" ? selectedCategory : null;
  const isTransitMode = transitKind !== null;
  const [transitBounds, setTransitBounds] = useState<TransitBounds | null>(null);
  const [selectedTransitId, setSelectedTransitId] = useState<string | null>(null);
  const [transitFocus, setTransitFocus] = useState<TransitStop | null>(null);
  const transit = useTransitStops(transitKind, transitBounds, query);
  const handleTransitBounds = useCallback((bounds: TransitBounds) => {
    setTransitBounds((previous: TransitBounds | null) => previous &&
      (Object.keys(bounds) as (keyof TransitBounds)[]).every((key) => Math.abs(previous[key] - bounds[key]) < 0.000001) ? previous : bounds);
  }, []);
  const currentCategory = categories.find((category) => category.id === selectedCategory) ?? categories[0];
  const isCongestionMode = selectedCategory === "congestion";
  const nextState = sheetState === "collapsed" ? "half" : sheetState === "half" ? "expanded" : "collapsed";
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [centerRequest, setCenterRequest] = useState(0);
  const [selectedDanger, setSelectedDanger] = useState<LocalBusiness | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const locationRequestRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const originStateRef = useRef<"collapsed" | "half" | "expanded">(sheetState);
  const currentDeltaYRef = useRef(0);
  const hasMovedSignificantRef = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const wheelTimeoutRef = useRef<number | null>(null);

  const handleSelectTransit = useCallback((stop: TransitStop) => {
    setSelectedTransitId(stop.id);
    setTransitFocus(stop);
    onSheetStateChange("half");
    window.requestAnimationFrame(() => sheetRef.current?.scrollTo({ top: 100, behavior: "instant" }));
  }, [onSheetStateChange]);

  const onGlobalPointerMove = useCallback((e: PointerEvent) => {
    const deltaY = e.clientY - dragStartYRef.current;

    if (!isDraggingRef.current) {
      if (Math.abs(deltaY) > 5) {
        if (originStateRef.current === "expanded" && deltaY > 0 && sheetRef.current && sheetRef.current.scrollTop > 5) {
          return;
        }
        isDraggingRef.current = true;
        hasMovedSignificantRef.current = true;
      } else {
        return;
      }
    }

    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dy = e.clientY - lastYRef.current;
    dragVelocityRef.current = dy / dt;
    lastYRef.current = e.clientY;
    lastTimeRef.current = now;
    currentDeltaYRef.current = deltaY;

    const sheetEl = sheetRef.current;
    if (sheetEl) {
      sheetEl.style.transition = "none";
      let visualDy = deltaY;
      if (originStateRef.current === "collapsed" && deltaY > 0) {
        visualDy = deltaY * 0.2;
      } else if (originStateRef.current === "expanded" && deltaY < 0) {
        visualDy = deltaY * 0.2;
      }
      sheetEl.style.transform = `translate3d(0, ${visualDy}px, 0)`;
    }
  }, []);

  const endDrag = useCallback(() => {
    window.removeEventListener("pointermove", onGlobalPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);

    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    if (!isDraggingRef.current) {
      currentDeltaYRef.current = 0;
      hasMovedSignificantRef.current = false;
      return;
    }

    isDraggingRef.current = false;
    const deltaY = currentDeltaYRef.current;
    const velocity = dragVelocityRef.current;
    const origin = originStateRef.current;

    let targetState: "collapsed" | "half" | "expanded" = origin;

    // Fast flick or clear drag threshold
    if (velocity < -0.3 || deltaY < -45) {
      // Dragged UP ("올리면")
      if (origin === "collapsed") {
        targetState = (velocity < -0.8 || deltaY < -130) ? "expanded" : "half";
      } else if (origin === "half") {
        targetState = "expanded";
      }
    } else if (velocity > 0.3 || deltaY > 45) {
      // Dragged DOWN ("내리면")
      if (origin === "expanded") {
        targetState = (velocity > 0.8 || deltaY > 130) ? "collapsed" : "half";
      } else if (origin === "half") {
        targetState = "collapsed";
      }
    }

    // Smooth release transition with native spring physics
    sheetEl.style.transition = "transform 320ms cubic-bezier(0.32, 0.72, 0, 1), height 320ms cubic-bezier(0.32, 0.72, 0, 1)";
    sheetEl.style.transform = "translate3d(0, 0, 0)";

    if (targetState !== origin) {
      onSheetStateChange(targetState);
    }

    currentDeltaYRef.current = 0;
    hasMovedSignificantRef.current = false;
  }, [onGlobalPointerMove, onSheetStateChange]);

  const handleHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragStartYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    originStateRef.current = sheetState;
    currentDeltaYRef.current = 0;
    hasMovedSignificantRef.current = false;

    window.addEventListener("pointermove", onGlobalPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const handleHandleClick = () => {
    if (hasMovedSignificantRef.current) return;
    onSheetStateChange(nextState);
    window.requestAnimationFrame(() => sheetRef.current?.scrollTo({ top: 0, behavior: "instant" }));
  };

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [role='button']")) {
      return;
    }
    if (sheetRef.current && sheetRef.current.scrollTop > 5 && sheetState === "expanded") {
      return;
    }
    if (e.button !== 0) return;
    dragStartYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    originStateRef.current = sheetState;
    currentDeltaYRef.current = 0;
    hasMovedSignificantRef.current = false;

    window.addEventListener("pointermove", onGlobalPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("pointermove", onGlobalPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [onGlobalPointerMove, endDrag]);

  // Wheel & Trackpad scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (wheelTimeoutRef.current) return;
    if (e.deltaY > 16 && sheetState !== "expanded") {
      wheelTimeoutRef.current = window.setTimeout(() => { wheelTimeoutRef.current = null; }, 280);
      onSheetStateChange(sheetState === "collapsed" ? "half" : "expanded");
    } else if (e.deltaY < -16 && sheetState !== "collapsed") {
      if (sheetRef.current && sheetRef.current.scrollTop <= 0) {
        wheelTimeoutRef.current = window.setTimeout(() => { wheelTimeoutRef.current = null; }, 280);
        onSheetStateChange(sheetState === "expanded" ? "half" : "collapsed");
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.touches[0].clientY; // > 0: swipe up, < 0: swipe down

    // Swipe UP
    if (delta > 20) {
      if (sheetState === "collapsed") {
        onSheetStateChange("half");
        touchStartY.current = null;
      } else if (sheetState === "half" && sheetRef.current && sheetRef.current.scrollTop + sheetRef.current.clientHeight >= sheetRef.current.scrollHeight - 10) {
        onSheetStateChange("expanded");
        touchStartY.current = null;
      }
    }
    // Swipe DOWN ("자연스럽게 내리면")
    else if (delta < -20) {
      if (sheetRef.current && sheetRef.current.scrollTop <= 0) {
        if (sheetState === "expanded") {
          onSheetStateChange("half");
          touchStartY.current = null;
        } else if (sheetState === "half") {
          onSheetStateChange("collapsed");
          touchStartY.current = null;
        }
      }
    }
  };

  const [selectedRestaurants, setSelectedRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurantResults, setRestaurantResults] = useState<Restaurant[]>([]);

  const handleSelectRestaurants = useCallback((list: Restaurant[], singleId: string | null) => {
    setSelectedRestaurants(list);
    setSelectedRestaurantId(singleId);
    sheetRef.current?.scrollTo({ top: 0, behavior: "instant" });
    onSheetStateChange("half");
  }, [onSheetStateChange]);

  const handleClearRestaurants = useCallback(() => {
    setSelectedRestaurants([]);
    setSelectedRestaurantId(null);
  }, []);

  const selectedRestaurant = useMemo(
    () =>
      selectedRestaurantId
        ? restaurantResults.find((r) => r.id === selectedRestaurantId) ??
          selectedRestaurants.find((r) => r.id === selectedRestaurantId) ??
          null
        : null,
    [restaurantResults, selectedRestaurantId, selectedRestaurants],
  );

  const selectDanger = useCallback((business: LocalBusiness) => {
    if (business.category !== "danger") return;
    setSelectedDanger(business);
    if (selectedCategory !== "danger") {
      onCategoryChange("danger");
    }
  }, [selectedCategory, onCategoryChange]);
  const renderDangerMarker = useCallback((business: LocalBusiness) =>
    createDangerMarkerContent(business, getDangerVisual(business) ?? DANGER_VISUALS.default, selectDanger), [selectDanger]);

  const handleCardClick = useCallback((business: LocalBusiness) => {
    if (business.category === "food") {
      const matched = restaurantResults.find((r) => r.id === business.id);
      if (matched) {
        setSelectedRestaurants([matched]);
        setSelectedRestaurantId(matched.id);
        onSheetStateChange("half");
      }
    } else if (business.category === "danger") {
      selectDanger(business);
    }
  }, [restaurantResults, onSheetStateChange, selectDanger]);

  useEffect(() => () => { locationRequestRef.current += 1; }, []);
  const visibleSelectedDanger = selectedDanger;
  const restaurantBusinesses = useMemo(
    () => restaurantResults.map((restaurant, index) => restaurantToLocalBusiness(restaurant, activeNeighborhood, index)),
    [activeNeighborhood, restaurantResults],
  );
  const [congestionBounds, setCongestionBounds] = useState<MapSearchBounds | null>(null);
  const [congestionData, setCongestionData] = useState<CongestionZone[]>([]);
  const [congestionLoading, setCongestionLoading] = useState(false);
  const [congestionError, setCongestionError] = useState("");
  const [congestionRefresh, setCongestionRefresh] = useState(0);
  const handleCongestionBounds = useCallback((bounds: MapSearchBounds) => {
    setCongestionBounds((previous: MapSearchBounds | null) => previous &&
      (Object.keys(bounds) as (keyof MapSearchBounds)[]).every((key) =>
        Math.abs(previous[key] - bounds[key]) < 0.000001) ? previous : bounds);
  }, []);
  useEffect(() => {
    if (!isCongestionMode || !congestionBounds) return;
    const controller = new AbortController();
    const refresh = async () => {
      setCongestionLoading(true);
      setCongestionError("");
      setCongestionData([]);
      try {
        const zones = await fetchCongestionZones(congestionBounds, controller.signal);
        if (!controller.signal.aborted) setCongestionData(zones);
      } catch (error) {
        if (!controller.signal.aborted) setCongestionError(error instanceof Error ? error.message : "혼잡도를 불러오지 못했어요.");
      } finally {
        if (!controller.signal.aborted) setCongestionLoading(false);
      }
    };
    const timer = window.setTimeout(refresh, 250);
    const interval = window.setInterval(refresh, 300_000);
    return () => { controller.abort(); window.clearTimeout(timer); window.clearInterval(interval); };
  }, [isCongestionMode, congestionBounds, congestionRefresh]);
  const congestionZones = useMemo(() => congestionData.filter((zone) =>
    congestionBounds && zone.lat >= congestionBounds.south && zone.lat <= congestionBounds.north &&
    zone.lng >= congestionBounds.west && zone.lng <= congestionBounds.east &&
    matchesCongestionQuery(zone, query)), [congestionData, congestionBounds, query]);
  const displayedBusinesses = useMemo(
    () =>
      selectedCategory === "food"
        ? restaurantBusinesses.filter((business) => matchesBusinessQuery(business, query))
        : isCongestionMode
          ? []
        : selectedCategory === "danger"
          ? (businesses.length > 0 ? businesses : liveDangerSignals).filter((business) => matchesBusinessQuery(business, query))
        : businesses,
    [businesses, isCongestionMode, liveDangerSignals, query, restaurantBusinesses, selectedCategory],
  );

  function changeCategory(id: string) {
    setSelectedTransitId(null);
    setTransitFocus(null);
    sheetRef.current?.scrollTo({ top: 0, behavior: "instant" });
    setSelectedDanger(null);
    setSelectedRestaurants([]);
    setSelectedRestaurantId(null);
    if (id !== "food") {
      setRestaurantResults([]);
    }
    if (id === "congestion" || id === "food" || id === "subway" || id === "bike") {
      onSheetStateChange("half");
    } else if (sheetState === "collapsed") {
      onSheetStateChange("half");
    }
    onCategoryChange(id);
  }

  function changeQuery(value: string) {
    setSelectedTransitId(null);
    setSelectedDanger(null);
    setSelectedRestaurants([]);
    setSelectedRestaurantId(null);
    onQueryChange(value);
  }

  function requestCurrentLocation() {
    if (isLocating) return;
    if (!window.isSecureContext) {
      setLocationError("현재 위치는 HTTPS 또는 localhost에서 사용할 수 있어요.");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("현재 위치를 지원하지 않는 브라우저예요.");
      return;
    }
    setIsLocating(true);
    setLocationError("");
    const requestId = ++locationRequestRef.current;
    const onSuccess = ({ coords }: GeolocationPosition) => {
        if (requestId !== locationRequestRef.current) return;
        setCurrentLocation({ lat: coords.latitude, lng: coords.longitude });
        setCenterRequest((value) => value + 1);
        setIsLocating(false);
        onRequestLocation();
    };
    const onError = (error: GeolocationPositionError) => {
        if (requestId !== locationRequestRef.current) return;
        setIsLocating(false);
        const messages: Record<number, string> = {
          1: "위치 권한이 차단됐어요. 브라우저의 위치 권한과 기기의 위치 서비스를 허용한 뒤 다시 시도해 주세요.",
          2: "기기에서 위치를 제공하지 못했어요. 위치 서비스를 확인하거나 Chrome·Edge에서 이 페이지를 열어 주세요.",
          3: "위치 확인 시간이 초과됐어요. 네트워크와 기기의 위치 서비스를 확인한 뒤 다시 시도해 주세요.",
        };
        setLocationError(messages[error.code] ?? "현재 위치를 찾지 못했어요. 다시 시도해 주세요.");
    };
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        if (requestId !== locationRequestRef.current) return;
        if (error.code === 1) {
          onError(error);
          return;
        }
        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
          enableHighAccuracy: false, timeout: 15000, maximumAge: 0,
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }

  return (
    <section className={styles.mapScreen}>
      <div className={`${styles.mapCanvas} ${isTransitMode ? styles.transitCanvas : ""}`} data-sheet={sheetState}>
        <KakaoMapLayer
          activeNeighborhood={activeNeighborhood}
          currentLocation={currentLocation}
          centerRequest={centerRequest}
          selectedCategory={selectedCategory}
          selectedRestaurantId={selectedRestaurantId}
          congestionZones={isCongestionMode ? congestionZones : []}
          businesses={selectedCategory === "danger" && businesses.length === 0 ? liveDangerSignals : businesses}
          renderBusinessMarker={renderDangerMarker}
          onCongestionBoundsChange={handleCongestionBounds}
          transitStops={isTransitMode ? transit.stops : []}
          selectedTransitId={selectedTransitId}
          transitFocus={transitFocus}
          onTransitBoundsChange={handleTransitBounds}
          onSelectTransit={handleSelectTransit}
          theme={theme}
          onSelectRestaurants={handleSelectRestaurants}
          onRestaurantsLoaded={setRestaurantResults}
          onClearRestaurants={handleClearRestaurants}
          onSearchBounds={(bounds) => {
            onSearchBounds(bounds);
            onSheetStateChange("collapsed");
          }}
          coordsMap={NEIGHBORHOOD_COORDS}
        />
        <div className={styles.mapSearch}>
          <Search size={27} />
          <input
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder={transitKind === "subway" ? "역 이름 또는 호선 검색" : transitKind === "bike" ? "따릉이 대여소 검색" : "집 근처 업체 검색"}
          />
          <button type="button" onClick={onOpenProfile} aria-label="프로필">
            <UserRound size={25} />
          </button>
        </div>
        {sheetState !== "expanded" && selectedCategory !== "food" && !isCongestionMode && !isTransitMode ? (
          <RealtimeDangerTicker
            dangerSignals={liveDangerSignals}
            onSelectDanger={selectDanger}
          />
        ) : null}
        {locationError && <p className={styles.mapLocationError} role="alert">{locationError}</p>}
        {isLocating && <p className={styles.mapLocationError} role="status">현재 위치를 확인하고 있어요...</p>}
        <div className={styles.mapControls}>
          <button type="button" aria-label="관심 장소">
            <Heart size={25} />
          </button>
          <button type="button" aria-label="내 장소" title="내 장소로 이동" onClick={() => setCenterRequest((value) => value + 1)}>
            <House size={25} />
          </button>
          <button type="button" aria-label="현재 위치" aria-busy={isLocating} title={isLocating ? "위치 확인 중" : "현재 위치로 이동"} disabled={isLocating} onClick={requestCurrentLocation}>
            <Crosshair size={25} />
          </button>
        </div>
        {!isCongestionMode && !isTransitMode && selectedCategory !== "food" && (
          <button type="button" className={styles.mapCategoryFab} aria-label={currentCategory.name}>
            <currentCategory.icon size={26} />
          </button>
        )}
        {visibleSelectedDanger ? (
          <DangerSignalCallout business={visibleSelectedDanger} onClose={() => setSelectedDanger(null)} />
        ) : null}

      </div>

      <div
        className={`${styles.localSheet} ${styles[`sheet_${sheetState}`]} ${isTransitMode ? styles.transitSheet : ""} ${selectedCategory === "food" && selectedRestaurants.length > 0 ? styles.restaurantSheet : ""}`}
        ref={sheetRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onPointerDown={handleSheetPointerDown}
      >
        <button
          type="button"
          className={styles.sheetHandle}
          aria-label={
            sheetState === "expanded"
              ? "지도 목록 반으로 접기"
              : sheetState === "half"
                ? "지도 목록 접기"
                : "지도 목록 펼치기"
          }
          aria-expanded={sheetState !== "collapsed"}
          onPointerDown={handleHandlePointerDown}
          onClick={handleHandleClick}
        >
          <span />
        </button>
        {!locationAllowed ? (
          <StateBlock
            title="동네 인증이 필요해요"
            body="현재 위치 권한을 허용하면 지도 업체와 동네 글을 더 정확하게 보여드려요."
            actionLabel="권한 허용"
            onAction={requestCurrentLocation}
          />
        ) : selectedCategory === "food" && selectedRestaurants.length > 1 && !selectedRestaurantId ? (
          <RestaurantClusterListSheet
            restaurants={selectedRestaurants}
            theme={theme}
            onSelectRestaurant={(restaurant) => {
              setSelectedRestaurantId(restaurant.id);
              sheetRef.current?.scrollTo({ top: 0, behavior: "instant" });
            }}
            onClose={handleClearRestaurants}
          />
        ) : selectedCategory === "food" && selectedRestaurant ? (
          <RestaurantDetailSheet
            restaurant={selectedRestaurant}
            theme={theme}
            onClose={() => {
              if (selectedRestaurants.length > 1) {
                setSelectedRestaurantId(null);
              } else {
                handleClearRestaurants();
              }
            }}
          />
        ) : (
          <>
            <div className={styles.localCategoryGrid}>
              {categories.map((category) => {
                const CategoryIcon = category.icon;
                return (
                  <button
                    type="button"
                    key={category.id}
                    className={selectedCategory === category.id ? styles.localCategoryActive : ""}
                    onClick={() => changeCategory(category.id)}
                  >
                    <span className={`${styles.localIcon} ${styles[`local_${category.tone}` as keyof typeof styles] ?? ""}`}>
                      <CategoryIcon size={27} />
                    </span>
                    <span className={styles.localCategoryLabel}>{category.name}</span>
                  </button>
                );
              })}
            </div>
            <div className={styles.localDots}>
              <span />
              <span />
            </div>
            {transitKind ? (
              <TransitSection
                kind={transitKind}
                stops={transit.stops}
                selectedId={selectedTransitId}
                total={transit.total}
                fetchedAt={transit.fetchedAt}
                loading={transit.loading}
                error={transit.error}
                hasQuery={Boolean(query.trim())}
                onRetry={transit.retry}
                onClearQuery={() => changeQuery("")}
                onSelect={handleSelectTransit}
              />
            ) : isCongestionMode ? (
              <CongestionAnalysisSection
                colorScheme={theme}
                zones={congestionZones}
                loading={congestionLoading || !congestionBounds}
                error={congestionError}
                onRetry={() => setCongestionRefresh((value) => value + 1)}
                onClearQuery={query ? () => changeQuery("") : undefined}
              />
            ) : (
              <section className={styles.localResults}>
                <h2 aria-live="polite">
                  {hasSearchedArea || selectedCategory === "food"
                    ? `현 지도 검색 결과 ${displayedBusinesses.length}곳`
                    : "이런 동네 가게 알고 있었나요?"}
                </h2>
                {displayedBusinesses.length === 0 ? (
                  <StateBlock
                    title="검색 결과가 없어요"
                    body="다른 카테고리나 검색어로 다시 찾아보세요."
                    actionLabel="검색어 지우기"
                    onAction={() => changeQuery("")}
                  />
                ) : (
                  <div className={styles.businessGrid}>
                    {displayedBusinesses.map((business) => {
                      const dangerVisual = getDangerVisual(business);
                      const isFood = business.category === "food";
                      const isSelected = selectedRestaurantId === business.id;
                      const thumbUrl = business.imageUrl || business.thumbnailUrl;

                      return (
                        <article
                          key={business.id}
                          className={`${styles.businessCard} ${isSelected ? styles.businessCardSelected : ""}`}
                          onClick={() => handleCardClick(business)}
                          style={{ cursor: "pointer" }}
                        >
                          <button
                            type="button"
                            aria-label={`${business.name} 관심`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Heart size={25} fill={business.liked ? "currentColor" : "none"} />
                          </button>
                          <div
                            className={`${styles.businessImage} ${
                              dangerVisual
                                ? `${styles.dangerBusinessImage} ${styles[`dangerThumb_${dangerVisual.tone}` as keyof typeof styles] ?? ""}`
                                : ""
                            }`}
                          >
                            {dangerVisual ? (
                              <>
                                <span className={styles.dangerEmoji}>{dangerVisual.emoji}</span>
                                <span>{dangerVisual.label}</span>
                              </>
                            ) : thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={business.name}
                                className={styles.businessThumbImg}
                                loading="lazy"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              business.name.slice(0, 2)
                            )}
                          </div>
                          <h3>{business.name}</h3>
                          <p>{business.summary}</p>
                          <small>
                            {dangerVisual
                              ? `${business.distance}${business.neighborhoodName ? ` · ${business.neighborhoodName}` : ""}`
                              : isFood
                                ? `${business.distance} · ${business.source === "kakao_local_api" ? "카카오 지도" : "임시 데이터"}`
                                : `${business.distance} · ${business.openNow ? "영업중" : "준비중"}`}
                          </small>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
