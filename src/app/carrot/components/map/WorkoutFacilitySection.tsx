"use client";

import React from "react";
import {
  ChevronRight,
  Dumbbell,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  RefreshCw,
  Sparkles,
  Star,
} from "lucide-react";
import {
  WorkoutFacility,
  WORKOUT_SUB_CATEGORIES,
  WorkoutSubCategoryId,
} from "@/services/workoutService";
import styles from "./WorkoutFacilitySection.module.css";

interface Props {
  facilities: WorkoutFacility[];
  selectedId: string | null;
  loading: boolean;
  error?: string;
  subCategory: string;
  onSubCategoryChange: (subCatId: WorkoutSubCategoryId) => void;
  onSelectFacility: (facility: WorkoutFacility) => void;
  onRetry: () => void;
}

export function WorkoutFacilitySection({
  facilities,
  selectedId,
  loading,
  error,
  subCategory,
  onSubCategoryChange,
  onSelectFacility,
  onRetry,
}: Props) {
  const selectedFacility = facilities.find((f) => f.id === selectedId);

  return (
    <section
      className={styles.section}
      aria-label="우리 동네 운동 시설"
      aria-busy={loading}
    >
      {/* 1. 상단 헤더 */}
      <div className={styles.heading}>
        <h2>
          우리 동네 운동 시설 <span>{facilities.length}곳</span>
        </h2>
        <button
          type="button"
          className={`${styles.refreshBtn} ${loading ? styles.spinning : ""}`}
          onClick={onRetry}
          disabled={loading}
          aria-label="운동 시설 새로고침"
          title="현재 지도 위치에서 새로고침"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <p className={styles.hint}>
        현재 지도 영역의 헬스장, 필라테스, 수영장 등 운동 시설을 모아봤어요.
      </p>

      {/* 2. 서브 카테고리 칩 필터 */}
      <div
        className={styles.chipContainer}
        role="tablist"
        aria-label="운동 종목 필터"
      >
        {WORKOUT_SUB_CATEGORIES.map((cat) => {
          const isActive = subCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`${styles.chip} ${isActive ? styles.chipActive : ""}`}
              onClick={() => onSubCategoryChange(cat.id)}
            >
              <span className={styles.chipIcon}>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. 지도 마커 선택 시 상세 팝오버 배너 */}
      {selectedFacility && (
        <div className={styles.detailBanner} role="region" aria-label="선택된 시설 상세">
          <div className={styles.detailBannerHeader}>
            <div>
              <strong>{selectedFacility.name}</strong>
              <span className={styles.detailBannerCategory} style={{ marginLeft: 6 }}>
                {selectedFacility.category}
              </span>
            </div>
          </div>
          <p className={styles.detailBannerDesc}>
            {selectedFacility.roadAddress || selectedFacility.address}
          </p>

          <div className={styles.detailActions}>
            <a
              href={`https://map.kakao.com/link/to/${encodeURIComponent(
                selectedFacility.name
              )},${selectedFacility.lat},${selectedFacility.lng}`}
              target="_blank"
              rel="noreferrer"
              className={`${styles.detailLink} ${styles.linkPrimary}`}
            >
              <Navigation size={13} />
              카카오맵 길찾기
            </a>
            {selectedFacility.phone && (
              <a
                href={`tel:${selectedFacility.phone}`}
                className={`${styles.detailLink} ${styles.linkSecondary}`}
              >
                <Phone size={13} />
                전화하기
              </a>
            )}
            {selectedFacility.placeUrl && (
              <a
                href={selectedFacility.placeUrl}
                target="_blank"
                rel="noreferrer"
                className={`${styles.detailLink} ${styles.linkSecondary}`}
              >
                <ExternalLink size={13} />
                상세정보
              </a>
            )}
          </div>
        </div>
      )}

      {/* 4. 에러 / 로딩 / 빈 상태 / 리스트 상태 */}
      {error ? (
        <div className={styles.state} role="alert">
          <p>운동 시설을 불러오지 못했습니다.</p>
          <small>{error}</small>
          <button type="button" onClick={onRetry}>
            다시 시도
          </button>
        </div>
      ) : loading && facilities.length === 0 ? (
        <div className={styles.skeletonList} aria-label="불러오는 중">
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      ) : facilities.length === 0 ? (
        <div className={styles.state}>
          <div className={styles.stateIcon}>🏋️</div>
          <p>주변에 검색된 운동 시설이 없어요.</p>
          <small>지도를 조금 이동하거나 축소해 주변을 탐색해 보세요.</small>
          <button type="button" onClick={onRetry}>
            현재 위치에서 재검색
          </button>
        </div>
      ) : (
        <ul className={styles.list}>
          {facilities.map((facility) => {
            const isSelected = facility.id === selectedId;
            return (
              <li
                key={facility.id}
                className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
                onClick={() => onSelectFacility(facility)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    onSelectFacility(facility);
                  }
                }}
              >
                <div className={styles.cardContent}>
                  <div className={styles.thumbWrapper}>
                    <img
                      src={facility.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80"}
                      alt={facility.name}
                      className={styles.thumb}
                      loading="lazy"
                    />
                    <span className={styles.subBadge}>{facility.category}</span>
                  </div>

                  <div className={styles.info}>
                    <div className={styles.titleRow}>
                      <h3 className={styles.name} title={facility.name}>
                        {facility.name}
                      </h3>
                      <span className={styles.categoryTag}>{facility.category}</span>
                    </div>

                    <div className={styles.ratingRow}>
                      <Star size={13} className={styles.star} fill="#ff9800" />
                      <strong>{facility.rating ?? 4.8}</strong>
                      <span className={styles.reviewCount}>
                        ({facility.reviewCount ?? 120})
                      </span>
                      {facility.distance && (
                        <span className={styles.distance}>{facility.distance}</span>
                      )}
                    </div>

                    <p className={styles.address}>
                      {facility.roadAddress || facility.address}
                    </p>

                    {facility.monthlyPrice && (
                      <div className={styles.priceTag}>{facility.monthlyPrice}</div>
                    )}

                    {facility.benefit && (
                      <div className={styles.benefitBadge}>
                        <Sparkles size={12} />
                        <span>{facility.benefit}</span>
                      </div>
                    )}

                    {facility.tags && facility.tags.length > 0 && (
                      <div className={styles.tagsRow}>
                        {facility.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className={styles.tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 5. 푸터 안내 */}
      <div className={styles.sourceFooter}>
        <span>출처: 카카오 로컬 지도 API</span> ·{" "}
        <span>당근 동네지도 운동 시설 정보</span>
      </div>
    </section>
  );
}
