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

export function ApartmentVerificationScreen({
  onBack,
  onVerify,
}: {
  onBack: () => void;
  onVerify: (apartmentName: string) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "locating" | "found" | "searching">("idle");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApt, setSelectedApt] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<string | null>(null);
  const [nearbyApts, setNearbyApts] = useState<{ name: string; addr: string; units: string; dist: string }[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const APT_DB = [
    { name: "푸르지오시티", addr: "서울 구로구 개봉동 128-3", units: "1,240세대", lat: 37.495, lng: 126.847 },
    { name: "개봉두산위브", addr: "서울 구로구 개봉동 84-1", units: "798세대", lat: 37.496, lng: 126.849 },
    { name: "개봉한신", addr: "서울 구로구 개봉동 202", units: "560세대", lat: 37.493, lng: 126.845 },
    { name: "현대홈타운", addr: "서울 구로구 개봉동 45-2", units: "980세대", lat: 37.494, lng: 126.851 },
    { name: "아이파크", addr: "서울 구로구 개봉동 89", units: "620세대", lat: 37.492, lng: 126.844 },
    { name: "래미안", addr: "서울 송파구 신천동 7-20", units: "1,840세대", lat: 37.515, lng: 127.105 },
    { name: "헬리오시티", addr: "서울 송파구 가락동 100", units: "9,510세대", lat: 37.498, lng: 127.118 },
    { name: "올림픽선수촌", addr: "서울 송파구 방이동 88", units: "5,540세대", lat: 37.511, lng: 127.127 },
    { name: "마포래미안푸르지오", addr: "서울 마포구 아현동 747", units: "3,885세대", lat: 37.555, lng: 126.953 },
    { name: "e편한세상", addr: "서울 은평구 불광동 329", units: "1,350세대", lat: 37.616, lng: 126.923 },
  ];

  const handleGPS = () => {
    setPhase("locating");
    setSelectedApt(null);

    if (!navigator.geolocation) {
      setTimeout(() => {
        const apts = APT_DB.slice(0, 5).map((a) => ({ ...a, dist: `${Math.floor(Math.random() * 300 + 50)}m` }));
        setNearbyApts(apts);
        setDetectedLocation("개봉동");
        setPhase("found");
      }, 1200);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const sorted = APT_DB.map((apt) => {
          const dlat = (apt.lat - latitude) * 111000;
          const dlng = (apt.lng - longitude) * 88000;
          const dist = Math.round(Math.sqrt(dlat * dlat + dlng * dlng));
          return { name: apt.name, addr: apt.addr, units: apt.units, dist: dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km` };
        }).sort((a, b) => parseInt(a.dist) - parseInt(b.dist)).slice(0, 5);
        setNearbyApts(sorted);
        setDetectedLocation("현재 위치");
        setPhase("found");
      },
      () => {
        const apts = APT_DB.slice(0, 5).map((a) => ({ ...a, dist: `${Math.floor(Math.random() * 400 + 100)}m` }));
        setNearbyApts(apts);
        setDetectedLocation("내 동네");
        setPhase("found");
      },
      { timeout: 8000 }
    );
  };

  const searchResults = searchTerm.trim()
    ? APT_DB.filter((a) =>
        a.name.includes(searchTerm) || a.addr.includes(searchTerm)
      ).map((a) => ({ ...a, dist: "" }))
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
