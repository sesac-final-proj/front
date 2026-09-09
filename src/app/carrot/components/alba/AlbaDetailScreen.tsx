import React, { useState } from "react";
import {
  ChevronLeft,
  Share2,
  EllipsisVertical,
  Clock3,
  Calendar,
  Heart,
  Store,
  MapPin,
} from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { AlbaItem } from "@/types";

export interface AlbaDetailScreenProps {
  alba: AlbaItem;
  onBack: () => void;
  onToggleFavorite: () => void;
  onApply: () => void;
}

export function AlbaDetailScreen({
  alba,
  onBack,
  onToggleFavorite,
  onApply,
}: AlbaDetailScreenProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <section className={styles.albaDetailScreen}>
      <div className={styles.albaDetailHeroFrame}>
        {alba.thumbnailUrl && !imgError ? (
          <img
            src={alba.thumbnailUrl}
            alt={alba.companyName}
            className={styles.albaDetailHeroImg}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className={styles.albaDetailHeroPlaceholder}
            style={{ background: alba.bgGradient || "var(--color-surface-2)" }}
          >
            <Store size={48} className={styles.albaDetailHeroIcon} />
          </div>
        )}
        <div className={styles.albaDetailHeroOverlay} />
        <div className={styles.albaDetailNavFloat}>
          <button type="button" className={styles.albaDetailGlassBtn} onClick={onBack} aria-label="뒤로">
            <ChevronLeft size={22} />
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className={styles.albaDetailGlassBtn} aria-label="공유">
              <Share2 size={19} />
            </button>
            <button type="button" className={styles.albaDetailGlassBtn} aria-label="더보기">
              <EllipsisVertical size={19} />
            </button>
          </div>
        </div>
        <div className={styles.albaDetailHeroBottom}>
          <span className={styles.albaDetailHeroBadge}>{alba.category}</span>
          <h2 className={styles.albaDetailHeroCompany}>{alba.companyName}</h2>
        </div>
      </div>

      <div className={styles.albaDetailContent}>
        <h1 className={styles.albaDetailTitle}>{alba.title}</h1>
        <div className={styles.albaDetailCompanyRow}>
          <span>{alba.companyName}</span> · <span>{alba.neighborhoodName}</span>
          {alba.reviewCount && <span> · 후기 {alba.reviewCount}개</span>}
        </div>

        {/* Key Conditions Box */}
        <div className={styles.albaDetailConditionBox}>
          <div className={styles.albaDetailConditionItem}>
            <Clock3 size={22} />
            <div>
              <span>급여</span>
              <strong>{alba.payLabel}</strong>
            </div>
          </div>
          <div className={styles.albaDetailConditionItem}>
            <Calendar size={22} />
            <div>
              <span>근무 요일</span>
              <strong>{alba.workingDays}</strong>
            </div>
          </div>
          <div className={styles.albaDetailConditionItem}>
            <Clock3 size={22} />
            <div>
              <span>근무 시간</span>
              <strong>{alba.workingHours}</strong>
            </div>
          </div>
        </div>

        {/* Detailed Duties */}
        <h2 className={styles.albaDetailSectionHeading}>근무 내용 및 상세 정보</h2>
        <div className={styles.albaDetailDuties}>
          <p style={{ margin: "0 0 10px", fontWeight: 600 }}>{alba.details}</p>
          <ul>
            {alba.descriptionBullets.map((bullet, idx) => (
              <li key={idx}>{bullet}</li>
            ))}
          </ul>
        </div>

        {/* Location Info */}
        <h2 className={styles.albaDetailSectionHeading}>근무지 위치</h2>
        <div className={styles.albaDetailDuties}>
          <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={16} color="var(--alba-brand)" /> {alba.detailLocation}
          </strong>
          <p style={{ margin: "4px 0 0", color: "var(--color-muted)", fontSize: "0.8125rem" }}>
            {alba.neighborhoodName}
          </p>
        </div>

        <div className={styles.albaDetailStatsFooter}>
          조회 {alba.viewCount} · 지원자 {alba.applicantCount}명 · 등록 {alba.createdAt}
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <footer className={styles.albaDetailActionBar}>
        <button
          type="button"
          className={`${styles.albaDetailHeartBtn} ${alba.isFavorite ? styles.albaDetailHeartBtnActive : ""}`}
          aria-label={alba.isFavorite ? "관심 알바 해제" : "관심 알바 저장"}
          onClick={onToggleFavorite}
        >
          <Heart size={22} fill={alba.isFavorite ? "currentColor" : "none"} color="currentColor" />
        </button>
        <button
          type="button"
          className={styles.albaDetailCallBtn}
          onClick={() => alert(`전화문의: ${alba.phoneContact}`)}
        >
          전화문의
        </button>
        <button
          type="button"
          className={styles.albaDetailApplyBtn}
          onClick={onApply}
        >
          {alba.hasApplied ? "지원 완료 ✓" : "지원하기"}
        </button>
      </footer>
    </section>
  );
}
