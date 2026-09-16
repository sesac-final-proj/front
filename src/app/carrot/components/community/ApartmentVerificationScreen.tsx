"use client";

import React, { useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  MapPin,
  MapPinned,
  Search,
  X,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import { IconButton } from "../common/IconButton";
import { ScreenHeader } from "../common/ScreenHeader";
import {
  findNearbyApartments,
  searchApartments,
  NEIGHBORHOOD_DEFAULT_COORDS,
  type NearbyApartment,
} from "./apartmentDataset";

export function ApartmentVerificationScreen({
  activeNeighborhood = "개봉동",
  onBack,
  onVerify,
}: {
  activeNeighborhood?: string;
  onBack: () => void;
  onVerify: (apartmentName: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "locating" | "found" | "searching">("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [nearbyApts, setNearbyApts] = useState<NearbyApartment[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleGPS = () => {
    setPhase("locating");
    setSelectedApt(null);

    const fallbackCoord =
      NEIGHBORHOOD_DEFAULT_COORDS[activeNeighborhood] || { lat: 37.495, lng: 126.847 };

    if (typeof window === "undefined" || !navigator.geolocation) {
      setTimeout(() => {
        const apts = findNearbyApartments(fallbackCoord.lat, fallbackCoord.lng, 8);
        setNearbyApts(apts);
        setDetectedLocation(activeNeighborhood);
        setPhase("found");
      }, 700);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const sorted = findNearbyApartments(latitude, longitude, 8);
        setNearbyApts(sorted);
        setDetectedLocation("현재 내 위치 (GPS)");
        setPhase("found");
      },
      () => {
        // Geolocation denied or failed -> fallback to activeNeighborhood
        const sorted = findNearbyApartments(fallbackCoord.lat, fallbackCoord.lng, 8);
        setNearbyApts(sorted);
        setDetectedLocation(`${activeNeighborhood} 기준`);
        setPhase("found");
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const searchResults: NearbyApartment[] = searchTerm.trim()
    ? searchApartments(searchTerm).map((a) => ({ ...a, dist: "", distanceMeters: 0 }))
    : [];

  const handleConfirm = () => {
    if (!selectedApt) return;
    setIsConfirming(true);
    setTimeout(() => {
      setIsConfirming(false);
      onVerify(selectedApt);
    }, 500);
  };

  return (
    <section className={styles.screen}>
      <ScreenHeader
        title="내 아파트 인증"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />

      <div className={styles.aptVerifyHero}>
        <div className={styles.aptVerifyIconBg}>
          <Building2 size={28} strokeWidth={1.8} />
        </div>
        <h1 className={styles.aptVerifyTitle}>
          입주민 전용 커뮤니티<br />
          <em>아파트를 인증해주세요</em>
        </h1>
        <p className={styles.aptVerifyDesc}>
          실제 거주 중인 아파트를 인증하면<br />
          이웃과 함께하는 전용 공간이 열려요
        </p>
      </div>

      <button
        type="button"
        className={styles.aptGpsBtn}
        onClick={handleGPS}
        disabled={phase === "locating"}
      >
        {phase === "locating" ? (
          <>
            <span className={styles.aptGpsSpinner} />
            <span>위치 확인 중...</span>
          </>
        ) : (
          <>
            <MapPin size={18} />
            <span>GPS로 내 위치 아파트 찾기</span>
          </>
        )}
      </button>

      <div className={styles.aptVerifyDivider}>
        <span>또는 직접 검색</span>
      </div>

      <div className={styles.aptSearchWrap}>
        <Search size={17} className={styles.aptSearchIcon} />
        <input
          type="text"
          className={styles.aptSearchInput}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPhase("searching");
            setSelectedApt(null);
          }}
          placeholder="아파트 이름 검색"
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.aptSearchClear}
            onClick={() => { setSearchTerm(""); setPhase(phase === "searching" ? "idle" : phase); }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {(phase === "found" || phase === "searching") && (
        <div className={styles.aptListWrap}>
          <p className={styles.aptListLabel}>
            {phase === "found"
              ? `📍 ${detectedLocation} 근처 아파트`
              : `'${searchTerm}' 검색 결과`}
          </p>
          <div className={styles.aptList}>
            {(phase === "found" ? nearbyApts : searchResults).map((apt) => {
              const sel = selectedApt === apt.name;
              return (
                <button
                  key={apt.name}
                  type="button"
                  className={`${styles.aptListItem} ${sel ? styles.aptListItemSelected : ""}`}
                  onClick={() => setSelectedApt(apt.name)}
                >
                  <div className={styles.aptListItemIcon}>
                    <Building2 size={18} />
                  </div>
                  <div className={styles.aptListItemInfo}>
                    <strong>{apt.name}</strong>
                    <span>{apt.addr} · {apt.units}</span>
                  </div>
                  <div className={styles.aptListItemRight}>
                    {apt.dist && <span className={styles.aptListDist}>{apt.dist}</span>}
                    <span className={`${styles.aptListRadio} ${sel ? styles.aptListRadioSelected : ""}`}>
                      {sel && <CheckCircle2 size={14} />}
                    </span>
                  </div>
                </button>
              );
            })}
            {phase === "searching" && searchResults.length === 0 && searchTerm.trim() && (
              <div className={styles.aptEmptyState}>
                <Search size={28} />
                <p>검색 결과가 없어요</p>
                <span>아파트 이름으로 검색해보세요</span>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === "idle" && (
        <div className={styles.aptIdleHint}>
          <MapPinned size={40} strokeWidth={1.3} />
          <p>GPS 버튼을 누르면 현재 위치에서<br />가까운 아파트를 자동으로 찾아줘요</p>
        </div>
      )}

      <div className={styles.aptVerifyBar}>
        <button
          type="button"
          className={`${styles.primaryButton} ${!selectedApt ? styles.aptVerifyBtnDisabled : ""}`}
          disabled={!selectedApt || isConfirming}
          onClick={handleConfirm}
        >
          {isConfirming
            ? "인증 중..."
            : selectedApt
            ? `${selectedApt} 인증하기`
            : "아파트를 선택해주세요"}
        </button>
      </div>
    </section>
  );
}
