"use client";

import React, { useId } from "react";
import { ChevronRight } from "lucide-react";
import { TOGETHER_CATEGORIES, TogetherPost } from "@/types/together";
import styles from "../../GajiMarketApp.module.css";

interface TogetherFeedCardProps {
  post: TogetherPost;
  onClick: () => void;
}

export function TogetherFeedCard({ post, onClick }: TogetherFeedCardProps) {
  const catMeta = TOGETHER_CATEGORIES[post.category] || TOGETHER_CATEGORIES.etc;
  const neighborSummaryId = useId();
  const isCancelled = post.status === "cancelled";
  const isFull = post.participantCount >= post.maxParticipants || post.status === "completed";
  const remainingCount = Math.max(0, post.maxParticipants - post.participantCount);
  const statusLabel = isCancelled ? "모임 취소" : isFull ? "모집 완료" : "모집중";
  const remainingLabel = isCancelled
    ? "취소된 모임이에요"
    : isFull
      ? "모집이 끝났어요"
      : `${remainingCount}자리 남았어요`;

  return (
    <article className={styles.togetherFeedCard}>
      <button
        type="button"
        onClick={onClick}
        className={styles.togetherFeedCardBtn}
        aria-label={`${post.title} 모임 상세보기`}
        aria-describedby={neighborSummaryId}
      >
        {/* Top Header: Badges & Right Arrow */}
        <div className={styles.togetherCardHeader}>
          <div className={styles.togetherBadgeRow}>
            <span className={styles.togetherCategoryPill}>
              <span>{catMeta.label}</span>
            </span>
            <span
              className={`${styles.togetherStatusPill} ${
                isFull || isCancelled ? styles.togetherStatusPillFull : styles.togetherStatusPillActive
              }`}
            >
              <span>{statusLabel}</span>
            </span>
            <span className={styles.togetherDdayPill}>
              {post.deadlineDaysLeft > 0 ? `D-${post.deadlineDaysLeft}` : "오늘 마감"}
            </span>
          </div>

          <ChevronRight size={18} className={styles.togetherCardArrow} />
        </div>

        {/* Title & Preview Content */}
        <div className={styles.togetherCardBody}>
          <h2 className={styles.togetherCardTitle}>{post.title}</h2>
          <p className={styles.togetherCardContent}>{post.content}</p>
        </div>

        {/* Group-buy price stays secondary to title and neighbors. */}
        {post.targetPrice && (
          <div className={styles.togetherPriceTag}>
            <span className={styles.togetherPriceLabel}>1인 예상</span>
            <strong className={styles.togetherPriceAmount}>
              {post.targetPrice.toLocaleString()}원
            </strong>
          </div>
        )}

        <div className={styles.togetherNeighborSummary} id={neighborSummaryId}>
          <div className={styles.togetherNeighborAvatars} aria-hidden="true">
            {post.participants.slice(0, 3).map((participant) => (
              <span key={participant.userId} className={styles.togetherNeighborAvatar}>
                {participant.userName.slice(0, 1)}
              </span>
            ))}
            {post.participants.length === 0 && (
              <span className={styles.togetherNeighborAvatarEmpty}>이웃</span>
            )}
          </div>
          <div className={styles.togetherNeighborCopy}>
            <span>같이 참여하는 이웃</span>
            <strong>{post.participantCount}명</strong>
          </div>
          <span className={styles.togetherRemainingLabel}>{remainingLabel}</span>
        </div>

        {/* Footer Metadata */}
        <div className={styles.togetherCardFooter}>
          <div className={styles.togetherCardMetaLeft}>
            <span>{post.regionName}</span>
            <span className={styles.togetherDotDivider}>·</span>
            <span>{post.userName}</span>
          </div>
          <div className={styles.togetherCardMetaRight}>
            <span>조회 {post.viewCount}</span>
          </div>
        </div>
      </button>
    </article>
  );
}
