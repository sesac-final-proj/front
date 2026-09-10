import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { DonationFacility } from "@/types";
import { NEIGHBORHOOD_DISTRICTS } from "../../constants";
import { getDreamFacilities } from "@/services";
import { ScreenHeader, IconButton } from "../common";
import { DreamMapLayer } from "./DreamMapLayer";

export interface DreamDashboardScreenProps {
  activeNeighborhood: string;
  onBack: () => void;
  onChangeNeighborhood: () => void;
  onOpenNotice: () => void;
}

export function DreamDashboardScreen({
  activeNeighborhood,
  onBack,
  onChangeNeighborhood,
  onOpenNotice,
}: DreamDashboardScreenProps) {
  const facilityListRef = useRef<HTMLElement | null>(null);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);
  const district = NEIGHBORHOOD_DISTRICTS[activeNeighborhood] ?? activeNeighborhood;
  const [facilityResult, setFacilityResult] = useState<{
    district: string;
    items: DonationFacility[];
    status: "ready" | "error";
  }>({ district: "", items: [], status: "ready" });
  const facilityStatus = facilityResult.district === district ? facilityResult.status : "loading";
  const visibleFacilities = facilityResult.district === district ? facilityResult.items : [];

  useEffect(() => {
    const controller = new AbortController();
    getDreamFacilities(district, controller.signal)
      .then((items) => {
        setFacilityResult({ district, items, status: "ready" });
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFacilityResult({ district, items: [], status: "error" });
      });
    return () => controller.abort();
  }, [district]);
  const visibleSelectedFacilityId = visibleFacilities.some((facility) => facility.id === selectedFacilityId)
    ? selectedFacilityId
    : null;
  const selectedFacility = visibleFacilities.find((facility) => facility.id === visibleSelectedFacilityId) ?? null;
  const selectFacility = useCallback((facility: DonationFacility | null) => {
    setSelectedFacilityId(facility ? facility.id : null);
  }, []);
  const totalCurrentAmount = visibleFacilities.reduce((sum, facility) => sum + facility.currentAmount, 0);
  const totalTargetAmount = visibleFacilities.reduce((sum, facility) => sum + facility.targetAmount, 0);
  const totalDonationCount = visibleFacilities.reduce((sum, facility) => sum + facility.donationCount, 0);
  const neighborhoodProgress = totalTargetAmount > 0 ? Math.round((totalCurrentAmount / totalTargetAmount) * 100) : 0;

  return (
    <section className={`${styles.screen} ${styles.dreamScreen}`}>
      <ScreenHeader
        title="꿈가지"
        leading={
          <IconButton label="뒤로" onClick={onBack}>
            <ChevronLeft size={27} />
          </IconButton>
        }
      />
      <button
        type="button"
        className={styles.dreamBanner}
        aria-label="꿈가지 나눔 캠페인 공지사항 보기"
        onClick={onOpenNotice}
      >
        <Image
          src="/dream/dream-main-banner.png"
          alt="우리 동네와 함께, 꿈가지. 작은 나눔이 모여 꿈이 자라요"
          width={1940}
          height={809}
          className={styles.dreamBannerImage}
          priority
        />
      </button>
      <section className={styles.dreamMapPanel}>
        <DreamMapLayer
          activeNeighborhood={activeNeighborhood}
          facilities={visibleFacilities}
          selectedFacility={selectedFacility}
          onSelectFacility={selectFacility}
        />
        <button type="button" className={styles.dreamMapTitle} onClick={onChangeNeighborhood} aria-label={`모금 지역 변경, 현재 ${activeNeighborhood}`}>
          <span className={styles.dreamMapTitleCopy}>
            <span>우리 동네 모금기지</span>
            <strong>{district}</strong>
            <small>{activeNeighborhood === "송파삼성래미안" ? "송파나루역 - 송파삼성래미안" : "우리 동네 나눔 소식"}</small>
          </span>
          <ChevronRight size={24} aria-hidden="true" />
        </button>
        <div className={styles.dreamSummaryDock} aria-label="꿈가지 요약">
          <div className={styles.dreamSummaryItem}>
            <span>기부 참여</span>
            <strong>{totalDonationCount}<small>회</small></strong>
          </div>
          <div className={styles.dreamSummaryItem}>
            <span>동네 기부 진행률</span>
            <strong>{neighborhoodProgress}%</strong>
            <div className={styles.dreamProgressTrack} role="progressbar" aria-label="동네 기부 진행률" aria-valuenow={Math.min(neighborhoodProgress, 100)} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${Math.min(neighborhoodProgress, 100)}%` }} />
            </div>
          </div>
        </div>
      </section>
      <section ref={facilityListRef} className={styles.dreamFacilityCard} aria-label="시설별 모금 현황">
        <div className={styles.dreamFacilityHeading}>
          <h2>함께 키우는 우리 동네 꿈</h2>
          <span>{visibleFacilities.length}곳</span>
        </div>
        {facilityStatus === "loading" && <p className={styles.dreamEmpty}>어린이 센터를 불러오는 중이에요.</p>}
        {facilityStatus === "error" && <p className={styles.dreamEmpty}>어린이 센터를 불러오지 못했어요.</p>}
        {facilityStatus === "ready" && visibleFacilities.length === 0 && <p className={styles.dreamEmpty}>이 구에서 확인된 어린이 센터가 없어요.</p>}
        {visibleFacilities.map((facility) => {
          const progress = facility.targetAmount > 0 ? Math.round((facility.currentAmount / facility.targetAmount) * 100) : 0;
          const isSelected = facility.id === visibleSelectedFacilityId;
          return (
            <div
              key={facility.id}
              className={`${styles.dreamFacilityItemCard} ${isSelected ? styles.dreamFacilitySelected : ""}`}
            >
              <button
                type="button"
                className={styles.dreamFacilityItem}
                onClick={() => selectFacility(isSelected ? null : facility)}
              >
                <div>
                  <strong>
                    {facility.name}
                    {facility.isRepresentative && (
                      <span className={styles.dreamTrustBadge}>신뢰 {facility.districtRank}순위</span>
                    )}
                  </strong>
                  <span>{facility.facilityType} - 현재 모금액 {facility.currentAmount.toLocaleString()}원</span>
                  <span className={styles.dreamFacilityContact}><b>주소</b> {facility.address || "주소 정보 미제공"}</span>
                  <span className={styles.dreamFacilityContact}>
                    <b>전화</b> {facility.phone || "전화번호 미제공"}
                  </span>
                </div>
                <em>{facility.totalScore !== null ? `${facility.totalScore}점` : `${progress}%`}</em>
                <div className={styles.dreamProgressTrack} role="progressbar" aria-label={`${facility.name} 모금 진행률`} aria-valuenow={Math.min(progress, 100)} aria-valuemin={0} aria-valuemax={100}>
                  <span style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </button>
              {isSelected && (
                <div className={styles.dreamFacilityExpandedDetails}>
                  {facility.checklist && (
                    <div className={styles.dreamTrustChecklist} aria-label={`${facility.name} 신뢰 판단 근거`}>
                      {Object.values(facility.checklist).slice(0, 4).map((label) => (
                        <span key={label}>{label}</span>
                      ))}
                    </div>
                  )}
                  <div className={styles.dreamFacilityDetailMeta}>
                    {facility.operationStatus && <p><strong>운영 상태:</strong> {facility.operationStatus}</p>}
                    {facility.establishedDate && <p><strong>인허가일:</strong> {facility.establishedDate}</p>}
                  </div>
                  {facility.homepageUrl && (
                    <a
                      className={styles.dreamFacilityHomepageButton}
                      href={facility.homepageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className={styles.homepageLogoBadge}>
                        <Image src="/brand/daangn-mark.svg" alt="" width={16} height={16} />
                      </span>
                      <span>시설 정보와 홈페이지 보기 ➔</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </section>
  );
}
