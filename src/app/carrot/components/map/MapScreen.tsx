import React, { useState, useEffect, useLayoutEffect, useCallback, useMemo, useRef } from "react";
import { Search, UserRound, House, Crosshair, X } from "lucide-react";
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
import { fetchCongestionZones, getCongestionPopulationLabel } from "@/services";
import { StateBlock } from "../common";
import { KakaoMapLayer } from "./KakaoMapLayer";
import { RestaurantClusterListSheet } from "./RestaurantClusterListSheet";
import { RestaurantDetailSheet } from "./RestaurantDetailSheet";
import { TransitSection } from "./TransitSection";
import { useTransitStops } from "./useTransitStops";
import { RealtimeDangerTicker } from "./RealtimeDangerTicker";
import { CongestionAnalysisSection } from "./CongestionAnalysisSection";
import { DangerSignalCallout } from "./DangerSignalCallout";
import { WorkoutFacilitySection } from "./WorkoutFacilitySection";
import { WorkoutClusterListSheet, WorkoutDetailSheet } from "./WorkoutMapSheets";
import { useWorkoutFacilities } from "./useWorkoutFacilities";
import type { WorkoutFacility } from "@/services/workoutService";

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
  secondaryNeighborhood: string | null;
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
  const isWorkoutMode = selectedCategory === "workout";
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const workout = useWorkoutFacilities({
    enabled: isWorkoutMode,
    activeNeighborhood,
    currentLocation,
    coordsMap: NEIGHBORHOOD_COORDS,
  });
  const [workoutClusterFacilities, setWorkoutClusterFacilities] = useState<WorkoutFacility[] | null>(null);
  const selectedWorkoutFacility = workout.selectedId
    ? workout.facilities.find((facility) => facility.id === workout.selectedId) ?? null
    : null;
  const [centerRequest, setCenterRequest] = useState(0);
  const [selectedDanger, setSelectedDanger] = useState<LocalBusiness | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const locationRequestRef = useRef(0);
  const initialHeightRef = useRef(198);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragSourceRef = useRef<"sheet" | "map" | null>(null);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const lastYRef = useRef(0);
  const lastTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const originStateRef = useRef<"collapsed" | "half" | "expanded">(sheetState);
  const currentDeltaYRef = useRef(0);
  const hasMovedSignificantRef = useRef(false);
  const wheelTimeoutRef = useRef<number | null>(null);
  const animationTimeoutRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    originStateRef.current = sheetState;
    if (sheetState === "collapsed" && sheetRef.current) {
      sheetRef.current.scrollTop = 0;
    }
  }, [sheetState]);

  const transitionToState = useCallback((targetState: "collapsed" | "half" | "expanded") => {
    const sheetEl = sheetRef.current;
    if (!sheetEl) {
      onSheetStateChange(targetState);
      return;
    }

    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }

    // 아래로 접힐 때는 스크롤을 무조건 맨 위(0)로 리셋하여 5개 카테고리 아이콘이 완벽하게 보이도록 보장
    if (targetState === "collapsed") {
      sheetEl.scrollTop = 0;
      sheetEl.scrollTo({ top: 0, behavior: "instant" });
    }

    // transform 대신 바닥(bottom: 0)에 고정된 height를 부드럽게 전환하여 하단이 잘리는 현상 원천 차단
    sheetEl.style.transition = "height 320ms cubic-bezier(0.25, 1, 0.5, 1)";
    sheetEl.style.transform = "";

    if (targetState === "collapsed") {
      sheetEl.style.height = "calc(198px + env(safe-area-inset-bottom))";
    } else if (targetState === "half") {
      sheetEl.style.height = "min(52%, 420px)";
    } else {
      sheetEl.style.height = "calc(100% - 60px)";
    }

    onSheetStateChange(targetState);

    animationTimeoutRef.current = window.setTimeout(() => {
      if (sheetEl) {
        sheetEl.style.transition = "";
        sheetEl.style.height = "";
        sheetEl.style.transform = "";
        if (targetState === "collapsed") {
          sheetEl.scrollTop = 0;
        }
      }
      animationTimeoutRef.current = null;
    }, 320);
  }, [onSheetStateChange]);

  const handleSelectTransit = useCallback((stop: TransitStop) => {
    setSelectedTransitId(stop.id);
    setTransitFocus(stop);
    transitionToState("half");
    window.requestAnimationFrame(() => sheetRef.current?.scrollTo({ top: 100, behavior: "smooth" }));
  }, [transitionToState]);

  const handleSelectWorkoutFacility = useCallback((facility: WorkoutFacility) => {
    setWorkoutClusterFacilities(null);
    workout.handleSelectFacility(facility);
    transitionToState("half");
    window.requestAnimationFrame(() => sheetRef.current?.scrollTo({ top: 100, behavior: "smooth" }));
  }, [workout, transitionToState]);
  const handleSelectWorkoutCluster = useCallback((facilities: WorkoutFacility[]) => {
    setWorkoutClusterFacilities(facilities);
    workout.setSelectedId(null);
    sheetRef.current?.scrollTo({ top: 0, behavior: "instant" });
    onSheetStateChange("half");
  }, [workout, onSheetStateChange]);

  const onGlobalPointerMove = useCallback((e: PointerEvent) => {
    const deltaY = e.clientY - dragStartYRef.current;
    const deltaX = e.clientX - dragStartXRef.current;

    if (!isDraggingRef.current) {
      if (dragSourceRef.current === "map") {
        if (Math.abs(deltaY) > 8 && Math.abs(deltaY) > Math.abs(deltaX) * 0.85) {
          if (deltaY < 0 || originStateRef.current !== "collapsed") {
            isDraggingRef.current = true;
            hasMovedSignificantRef.current = true;
          } else {
            return;
          }
        } else {
          return;
        }
      } else {
        if (Math.abs(deltaY) > 5) {
          isDraggingRef.current = true;
          hasMovedSignificantRef.current = true;
        } else {
          return;
        }
      }
    }

    if (e.cancelable) {
      e.preventDefault();
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
      const containerHeight = sheetEl.parentElement?.getBoundingClientRect().height || window.innerHeight;
      const minHeight = 198;
      const maxHeight = containerHeight - 60;

      // 위로 끌어올리면(deltaY < 0) height가 커지고, 아래로 내리면(deltaY > 0) height가 줄어듭니다.
      // bottom: 0에 고정되어 있으므로 시트 아래가 허공에 뜨거나 잘리지 않습니다.
      const targetHeight = initialHeightRef.current - deltaY;
      let visualHeight = targetHeight;
      if (targetHeight < minHeight) {
        visualHeight = minHeight - (minHeight - targetHeight) * 0.2;
      } else if (targetHeight > maxHeight) {
        visualHeight = maxHeight + (targetHeight - maxHeight) * 0.2;
      }

      // 시트가 아래로 내려갈 때는 내부 스크롤을 0으로 강제 유지하여 카테고리 아이콘이 항상 온전히 보이게 함 (사진 2번 상태 보장)
      if (visualHeight < 360 || deltaY > 0) {
        sheetEl.scrollTop = 0;
      }

      sheetEl.style.transition = "none";
      sheetEl.style.transform = "none";
      sheetEl.style.height = `${visualHeight}px`;
    }
  }, []);

  const endDragRef = useRef<() => void>(() => {});

  const handlePointerUp = useCallback(() => {
    endDragRef.current();
  }, []);

  const cleanupDragListeners = useCallback(() => {
    window.removeEventListener("pointermove", onGlobalPointerMove, { capture: true } as any);
    window.removeEventListener("pointerup", handlePointerUp, { capture: true } as any);
    window.removeEventListener("pointercancel", handlePointerUp, { capture: true } as any);
  }, [onGlobalPointerMove, handlePointerUp]);

  const endDrag = useCallback(() => {
    cleanupDragListeners();

    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    if (!isDraggingRef.current) {
      currentDeltaYRef.current = 0;
      dragSourceRef.current = null;
      window.setTimeout(() => {
        hasMovedSignificantRef.current = false;
      }, 50);
      return;
    }

    isDraggingRef.current = false;
    const currentHeight = sheetEl.getBoundingClientRect().height;
    const velocity = dragVelocityRef.current;
    const origin = originStateRef.current;

    const containerHeight = sheetEl.parentElement?.getBoundingClientRect().height || window.innerHeight;
    const minHeight = 198;
    const halfHeight = Math.min(containerHeight * 0.52, 420);
    const maxHeight = containerHeight - 60;

    let targetState: "collapsed" | "half" | "expanded" = origin;

    // 빠른 스와이프(플릭) 판정
    if (velocity < -0.28) {
      // 위로 빠르게 튕김
      if (origin === "collapsed") {
        targetState = (velocity < -0.7 || currentHeight > (halfHeight + maxHeight) / 2) ? "expanded" : "half";
      } else {
        targetState = "expanded";
      }
    } else if (velocity > 0.28) {
      // 아래로 빠르게 튕김 -> 지도를 더 많이 보도록 아래로 접힘
      if (origin === "expanded") {
        targetState = (velocity > 0.7 || currentHeight < (minHeight + halfHeight) / 2) ? "collapsed" : "half";
      } else {
        targetState = "collapsed";
      }
    } else {
      // 드래그 후 놓은 높이 기준 스냅
      const mid1 = (minHeight + halfHeight) / 2;
      const mid2 = (halfHeight + maxHeight) / 2;

      if (currentHeight < mid1) {
        targetState = "collapsed";
      } else if (currentHeight < mid2) {
        targetState = "half";
      } else {
        targetState = "expanded";
      }
    }

    transitionToState(targetState);
    currentDeltaYRef.current = 0;
    dragSourceRef.current = null;
    window.setTimeout(() => {
      hasMovedSignificantRef.current = false;
    }, 100);
  }, [cleanupDragListeners, transitionToState]);

  useEffect(() => {
    endDragRef.current = endDrag;
  }, [endDrag]);

  const handleHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    initialHeightRef.current = sheetRef.current?.getBoundingClientRect().height ?? 198;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    originStateRef.current = sheetState;
    currentDeltaYRef.current = 0;
    hasMovedSignificantRef.current = false;
    dragSourceRef.current = "sheet";

    window.addEventListener("pointermove", onGlobalPointerMove, { capture: true, passive: false });
    window.addEventListener("pointerup", handlePointerUp, { capture: true });
    window.addEventListener("pointercancel", handlePointerUp, { capture: true });
  };

  const handleHandleClick = () => {
    if (hasMovedSignificantRef.current) return;
    // 언더바 클릭 시: 펼쳐져 있을 땐 아래로 접어 지도를 보여주고, 접혀있을 땐 절반으로 펼침
    const target = sheetState === "expanded" ? "half" : sheetState === "half" ? "collapsed" : "half";
    if (sheetRef.current) {
      sheetRef.current.scrollTop = 0;
      sheetRef.current.scrollTo({ top: 0, behavior: "instant" });
    }
    transitionToState(target);
  };

  const handleSheetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;

    if (target.closest("input, textarea, select")) {
      return;
    }

    const isHandle = target.closest(`.${styles.sheetHandle}`) !== null;
    const isAtTop = (sheetRef.current?.scrollTop ?? 0) <= 2;
    const isCollapsed = sheetState === "collapsed";

    if (!isHandle && !isCollapsed && !isAtTop) {
      return;
    }

    initialHeightRef.current = sheetRef.current?.getBoundingClientRect().height ?? 198;
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    lastYRef.current = e.clientY;
    lastTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    originStateRef.current = sheetState;
    currentDeltaYRef.current = 0;
    hasMovedSignificantRef.current = false;
    dragSourceRef.current = "sheet";

    window.addEventListener("pointermove", onGlobalPointerMove, { capture: true, passive: false });
    window.addEventListener("pointerup", handlePointerUp, { capture: true });
    window.addEventListener("pointercancel", handlePointerUp, { capture: true });
  };

  const handleSheetClickCapture = (e: React.MouseEvent) => {
    if (hasMovedSignificantRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  useEffect(() => {
    return () => {
      cleanupDragListeners();
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [cleanupDragListeners]);

  // Wheel & Trackpad scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (wheelTimeoutRef.current) return;
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    const isOverHandle = (e.target as HTMLElement).closest(`.${styles.sheetHandle}`) !== null;
    const isAtTop = sheetEl.scrollTop <= 2;

    // 시트 또는 손잡이 위의 휠 입력만 시트 높이에 반영한다.
    if (e.deltaY > 8 && (isOverHandle || (isAtTop && sheetState !== "collapsed"))) {
      if (sheetState !== "collapsed") {
        wheelTimeoutRef.current = window.setTimeout(() => { wheelTimeoutRef.current = null; }, 260);
        const target = sheetState === "expanded" ? "half" : "collapsed";
        if (sheetEl) {
          sheetEl.scrollTop = 0;
          sheetEl.scrollTo({ top: 0, behavior: "instant" });
        }
        transitionToState(target);
      }
    }
    else if (e.deltaY < -8 && (isOverHandle || sheetState === "collapsed" || (sheetState === "half" && isAtTop))) {
      if (sheetState !== "expanded") {
        wheelTimeoutRef.current = window.setTimeout(() => { wheelTimeoutRef.current = null; }, 260);
        const target = sheetState === "collapsed" ? "half" : "expanded";
        transitionToState(target);
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
  const [selectedCongestion, setSelectedCongestion] = useState<CongestionZone | null>(null);
  const handleSelectCongestion = useCallback((zone: CongestionZone) => {
    setSelectedCongestion(zone);
  }, []);
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
    setSelectedCongestion(null);
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
    setSelectedCongestion(null);
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
      <div
        ref={mapCanvasRef}
        className={`${styles.mapCanvas} ${isTransitMode ? styles.transitCanvas : ""}`}
        data-sheet={sheetState}
      >
        <KakaoMapLayer
          activeNeighborhood={activeNeighborhood}
          currentLocation={currentLocation}
          centerRequest={centerRequest}
          selectedCategory={selectedCategory}
          selectedRestaurantId={selectedRestaurantId}
          congestionZones={isCongestionMode ? congestionZones : []}
          onSelectCongestion={handleSelectCongestion}
          businesses={selectedCategory === "danger" && businesses.length === 0 ? liveDangerSignals : businesses}
          renderBusinessMarker={renderDangerMarker}
          onCongestionBoundsChange={handleCongestionBounds}
          transitStops={isTransitMode ? transit.stops : []}
          selectedTransitId={selectedTransitId}
          transitFocus={transitFocus}
          onTransitBoundsChange={handleTransitBounds}
          onSelectTransit={handleSelectTransit}
          workoutFacilities={isWorkoutMode ? workout.facilities : []}
          selectedWorkoutId={workout.selectedId}
          onSelectWorkoutFacility={handleSelectWorkoutFacility}
          onSelectWorkoutCluster={handleSelectWorkoutCluster}
          onWorkoutBoundsChange={workout.setMapBounds}
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
        {sheetState !== "expanded" && selectedCategory !== "food" && !isCongestionMode && !isTransitMode && !isWorkoutMode ? (
          <RealtimeDangerTicker
            dangerSignals={liveDangerSignals}
            onSelectDanger={selectDanger}
          />
        ) : null}
        {locationError && <p className={styles.mapLocationError} role="alert">{locationError}</p>}
        {isLocating && <p className={styles.mapLocationError} role="status">현재 위치를 확인하고 있어요...</p>}
        {isCongestionMode && selectedCongestion ? (() => {
          const score = selectedCongestion.currentScore;
          const baselineGap = selectedCongestion.baselineScore === undefined ? 0 : Math.abs(score - selectedCongestion.baselineScore);
          const safetyLevel = score >= 30 && score <= 70 && baselineGap <= 20 ? 2 : score >= 15 && score <= 85 ? 1 : 0;
          const safetyLabel = ["다른 장소를 권해요", "주변을 확인해요", "거래하기 괜찮아요"][safetyLevel];
          return (
            <aside className={styles.tradeSafetyCard} aria-label={`${selectedCongestion.name} 거래안전 참고 지표`}>
              <div className={styles.tradeSafetyHeader}>
                <span className={styles.tradeSafetyMascot} aria-hidden="true" />
                <div>
                  <small>거래 장소 참고</small>
                  <strong>{selectedCongestion.name}</strong>
                </div>
                <button type="button" onClick={() => setSelectedCongestion(null)} aria-label="거래안전 지표 닫기"><X size={18} /></button>
              </div>
              <div className={styles.tradeSafetyResult}>
                <strong>{safetyLabel}</strong>
                <span>{selectedCongestion.levelLabel} · {getCongestionPopulationLabel(selectedCongestion)}</span>
              </div>
              <p>밝고 사람이 보이는 공공장소에서 거래하세요.</p>
              <small className={styles.tradeSafetyDisclaimer}>현재 혼잡도만 반영한 참고 정보예요.</small>
            </aside>
          );
        })() : null}
        <div className={styles.mapControls}>
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
        onPointerDown={handleSheetPointerDown}
        onClickCapture={handleSheetClickCapture}
      >
        <button
          type="button"
          className={styles.sheetHandle}
          aria-label={
            sheetState === "expanded"
              ? "지도 목록 반으로 접기"
              : sheetState === "half"
                ? "지도 목록 전체 펼치기"
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
        ) : isWorkoutMode && workoutClusterFacilities && !selectedWorkoutFacility ? (
          <WorkoutClusterListSheet
            facilities={workoutClusterFacilities}
            onSelect={handleSelectWorkoutFacility}
            onClose={() => setWorkoutClusterFacilities(null)}
          />
        ) : isWorkoutMode && selectedWorkoutFacility ? (
          <WorkoutDetailSheet
            facility={selectedWorkoutFacility}
            onClose={() => workout.setSelectedId(null)}
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
            {isWorkoutMode ? (
              <WorkoutFacilitySection
                facilities={workoutClusterFacilities ?? workout.facilities}
                selectedId={workout.selectedId}
                loading={workout.loading}
                error={workout.error}
                subCategory={workout.subCategory}
                onSubCategoryChange={(subCategory) => {
                  setWorkoutClusterFacilities(null);
                  workout.setSubCategory(subCategory);
                }}
                onSelectFacility={handleSelectWorkoutFacility}
                onRetry={() => {
                  setWorkoutClusterFacilities(null);
                  workout.retry();
                }}
              />
            ) : transitKind ? (
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
                  {selectedCategory === "danger"
                    ? "여기 조심하세요!"
                    : hasSearchedArea || selectedCategory === "food"
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
                  <div className={`${styles.businessGrid} ${selectedCategory === "danger" ? styles.dangerResultGrid : ""}`}>
                    {displayedBusinesses.map((business) => {
                      const dangerVisual = getDangerVisual(business);
                      const isFood = business.category === "food";
                      const isSelected = selectedRestaurantId === business.id;
                      const thumbUrl = business.imageUrl || business.thumbnailUrl;

                      return (
                        <article
                          key={business.id}
                          className={`${styles.businessCard} ${dangerVisual ? styles.dangerResultCard : ""} ${isSelected ? styles.businessCardSelected : ""}`}
                          onClick={() => handleCardClick(business)}
                          style={{ cursor: "pointer" }}
                        >
                          <div
                            className={`${styles.businessImage} ${
                              dangerVisual
                                ? `${styles.dangerBusinessImage} ${styles[`dangerThumb_${dangerVisual.tone}` as keyof typeof styles] ?? ""}`
                                : ""
                            }`}
                          >
                            {dangerVisual ? (
                              <div className={styles.dangerCardVisual}>
                                <div className={styles.dangerMascotWrapper}>
                                  <span className={styles.dangerMascotFigure} aria-hidden="true" />
                                  <span className={styles.dangerMascotMiniBadge} aria-hidden="true">
                                    {dangerVisual.emoji}
                                  </span>
                                </div>
                                <div className={styles.dangerMetaGroup}>
                                  <span className={styles.dangerPillLabel}>
                                    <span className={styles.dangerPillDot} />
                                    {dangerVisual.label}
                                  </span>
                                  {dangerVisual.subLabel ? (
                                    <span className={styles.dangerSubNotice}>{dangerVisual.subLabel}</span>
                                  ) : null}
                                </div>
                              </div>
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
