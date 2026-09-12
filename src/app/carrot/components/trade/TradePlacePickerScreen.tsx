"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { KAKAO_MAP_JS_KEY } from "../../constants";
import { createEggplantMarkerImage, loadKakaoMapScript } from "../map";
import { IconButton } from "../common/IconButton";
import { fetchTradePlaceRecommendations, type TradePlaceRecommendation } from "@/services/congestionService";

// 서울시청 기본 좌표 — 동네 좌표를 못 구한 경우의 최종 폴백.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export interface PickedTradePlace {
  name: string;
  lat: number;
  lng: number;
}

// 지도를 탭하거나(클릭 지점에 마커 이동) 마커를 직접 드래그해서 거래 희망 장소를 고르는
// 화면 — 화면 중앙에 핀을 고정하고 지도만 움직이던 이전 방식은 "정확히 그 자리"를
// 찍는다는 느낌이 안 들어서, 실제 마커를 찍는 방식으로 바꿨다. ProductFormScreen 안에서
// 오버레이로 띄운다(별도 subPage 이동이면 아직 안 낸 제목/설명 등 폼 입력값이 날아감).
export function TradePlacePickerScreen({
  initialLat,
  initialLng,
  onCancel,
  onConfirm,
}: {
  initialLat?: number;
  initialLng?: number;
  onCancel: () => void;
  onConfirm: (place: PickedTradePlace) => void;
}) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [hasPicked, setHasPicked] = useState(false);
  const [mapError, setMapError] = useState(!KAKAO_MAP_JS_KEY);
  const [recommendations, setRecommendations] = useState<TradePlaceRecommendation[]>([]);
  const [recommendError, setRecommendError] = useState<string | null>(null);

  function loadRecommendations(lat: number, lng: number) {
    setRecommendError(null);
    fetchTradePlaceRecommendations({ lat, lng, hour: new Date().getHours() })
      .then(setRecommendations)
      .catch(() => setRecommendError("혼잡도 추천을 불러오지 못했어요."));
  }

  useEffect(() => {
    if (!KAKAO_MAP_JS_KEY) return;
    let cancelled = false;

    function resolvePlaceName(lat: number, lng: number) {
      fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { name?: string } | null) => {
          if (!cancelled) setPlaceName(data?.name ?? null);
        })
        .catch(() => {
          if (!cancelled) setPlaceName(null);
        });
    }

    loadKakaoMapScript(KAKAO_MAP_JS_KEY)
      .then(() => {
        const kakaoMaps = (window as any).kakao?.maps;
        if (cancelled || !kakaoMaps || !mapElementRef.current) {
          if (!cancelled) setMapError(true);
          return;
        }
        const startLat = initialLat ?? DEFAULT_CENTER.lat;
        const startLng = initialLng ?? DEFAULT_CENTER.lng;
        const center = new kakaoMaps.LatLng(startLat, startLng);
        const map = new kakaoMaps.Map(mapElementRef.current, { center, level: 4 });
        mapRef.current = map;
        const marker = new kakaoMaps.Marker({
          position: center,
          map,
          draggable: true,
          image: createEggplantMarkerImage(kakaoMaps),
        });
        markerRef.current = marker;

        function moveMarkerTo(latLng: any) {
          marker.setPosition(latLng);
          setHasPicked(true);
          resolvePlaceName(latLng.getLat(), latLng.getLng());
        }

        // 지도 아무 곳이나 탭 -> 그 지점으로 마커 이동. 마커 자체를 손가락/마우스로
        // 끌어서 미세조정도 가능(draggable: true) — 둘 다 같은 moveMarkerTo로 수렴.
        kakaoMaps.event.addListener(map, "click", (e: any) => moveMarkerTo(e.latLng));
        kakaoMaps.event.addListener(marker, "dragend", () => moveMarkerTo(marker.getPosition()));

        if (initialLat !== undefined && initialLng !== undefined) setHasPicked(true);
        resolvePlaceName(startLat, startLng);
        loadRecommendations(startLat, startLng);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [initialLat, initialLng]);

  function handleConfirm() {
    const marker = markerRef.current;
    if (!marker) return;
    const position = marker.getPosition();
    onConfirm({ name: placeName ?? "직접 선택한 위치", lat: position.getLat(), lng: position.getLng() });
  }

  function pickRecommendation(place: TradePlaceRecommendation) {
    const kakaoMaps = (window as any).kakao?.maps;
    const marker = markerRef.current;
    if (!kakaoMaps || !marker) return;
    const next = new kakaoMaps.LatLng(place.lat, place.lng);
    marker.setPosition(next);
    mapRef.current?.panTo(next);
    setHasPicked(true);
    setPlaceName(place.name);
    loadRecommendations(place.lat, place.lng);
  }

  return (
    <div className={styles.tradePlacePicker}>
      <div className={styles.tradePlacePickerHeader}>
        <IconButton label="닫기" onClick={onCancel} className={styles.tradePlacePickerClose}>
          <X size={26} />
        </IconButton>
        <h2>
          이웃과 만나서
          <br />
          거래하고 싶은 장소를 선택해주세요.
        </h2>
        <p>만나서 거래할 때는 누구나 찾기 쉬운 공공장소가 좋아요.</p>
      </div>
      <div className={styles.tradePlacePickerMapWrap}>
        {mapError ? (
          <p className={styles.tradePlaceError}>지도를 불러오지 못했습니다.</p>
        ) : (
          <>
            <div ref={mapElementRef} className={styles.tradePlacePickerMap} />
            {!hasPicked && (
              <div className={styles.tradePlacePickerTooltip}>지도를 탭해서 위치를 선택해보세요.</div>
            )}
          </>
        )}
      </div>
      <div className={styles.tradePlaceRecommendations}>
        <div className={styles.tradePlaceRecommendationHeader}>
          <MapPin size={17} />
          <span>혼잡도 기반 추천 장소</span>
        </div>
        {recommendError ? (
          <p className={styles.tradePlaceRecommendationEmpty}>{recommendError}</p>
        ) : recommendations.length === 0 ? (
          <p className={styles.tradePlaceRecommendationEmpty}>주변 실시간 혼잡도 장소가 없어요.</p>
        ) : (
          recommendations.map((place) => (
            <button
              type="button"
              key={`${place.name}-${place.lat}-${place.lng}`}
              className={styles.tradePlaceRecommendationCard}
              onClick={() => pickRecommendation(place)}
            >
              <span>
                <strong>{place.name}</strong>
                <small>{place.recommendationReason ?? place.congestionMessage}</small>
              </span>
              <em>{place.congestionLevel}</em>
            </button>
          ))
        )}
      </div>
      <div className={styles.tradePlacePickerFooter}>
        <button type="button" className={styles.primaryButton} onClick={handleConfirm} disabled={!hasPicked}>
          선택 완료
        </button>
      </div>
    </div>
  );
}
