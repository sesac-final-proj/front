"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { KAKAO_MAP_JS_KEY } from "../../constants";
import { loadKakaoMapScript } from "../map";
import { IconButton } from "../common/IconButton";

// 서울시청 기본 좌표 — 동네 좌표를 못 구한 경우의 최종 폴백.
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

export interface PickedTradePlace {
  name: string;
  lat: number;
  lng: number;
}

// 지도를 움직여서 중앙 핀 위치를 거래 희망 장소로 고르는 화면 — 실제 당근마켓과
// 동일하게 핀은 화면 중앙에 고정하고 지도(밑판)만 움직인다. ProductFormScreen 안에서
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
  const mapInstanceRef = useRef<any>(null);
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [mapError, setMapError] = useState(!KAKAO_MAP_JS_KEY);

  useEffect(() => {
    if (!KAKAO_MAP_JS_KEY) return;
    let cancelled = false;

    function resolvePlaceName(map: any) {
      const center = map.getCenter();
      const lat = center.getLat();
      const lng = center.getLng();
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
        const center = new kakaoMaps.LatLng(
          initialLat ?? DEFAULT_CENTER.lat,
          initialLng ?? DEFAULT_CENTER.lng,
        );
        const map = new kakaoMaps.Map(mapElementRef.current, { center, level: 4 });
        mapInstanceRef.current = map;
        kakaoMaps.event.addListener(map, "dragstart", () => setHasMoved(true));
        kakaoMaps.event.addListener(map, "idle", () => resolvePlaceName(map));
        resolvePlaceName(map);
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [initialLat, initialLng]);

  function handleConfirm() {
    const map = mapInstanceRef.current;
    if (!map) return;
    const center = map.getCenter();
    onConfirm({ name: placeName ?? "직접 선택한 위치", lat: center.getLat(), lng: center.getLng() });
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
            <div className={styles.tradePlacePickerPin} aria-hidden>
              <MapPin size={40} fill="var(--color-primary)" color="#fff" strokeWidth={1.5} />
            </div>
            {!hasMoved && (
              <div className={styles.tradePlacePickerTooltip}>지도를 움직여서 선택해보세요.</div>
            )}
          </>
        )}
      </div>
      <div className={styles.tradePlacePickerFooter}>
        <button type="button" className={styles.primaryButton} onClick={handleConfirm}>
          선택 완료
        </button>
      </div>
    </div>
  );
}
