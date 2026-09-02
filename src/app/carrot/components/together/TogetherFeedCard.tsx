"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { TOGETHER_CATEGORIES, TogetherPost } from "@/types/together";
import styles from "../../GajiMarketApp.module.css";

interface TogetherFeedCardProps {
  post: TogetherPost;
  onClick: () => void;
}

export function TogetherFeedCard({ post, onClick }: TogetherFeedCardProps) {
  const catMeta = TOGETHER_CATEGORIES[post.category] || TOGETHER_CATEGORIES.etc;
  const isFull = post.participantCount >= post.maxParticipants || post.status === "completed";
  const progressPercent = Math.min(
    100,
    Math.round((post.participantCount / post.maxParticipants) * 100)
  );

  return (
    <article className={styles.postRow}>
      <button type="button" onClick={onClick} className={styles.togetherPostBtn}>
        <div className={styles.postText}>
          {/* Badges */}
          <div className={styles.togetherBadgeRow}>
            <span className={styles.categoryBadge}>{catMeta.label}</span>
            <span className={`${styles.categoryBadge} ${isFull ? "" : styles.togetherStatusActive}`}>
              {isFull ? "모집완료" : "모집중"}
            </span>
            <span className={styles.categoryBadge}>
              {post.deadlineDaysLeft > 0 ? `D-${post.deadlineDaysLeft}` : "오늘 마감"}
            </span>
          </div>

          {/* Title & Preview */}
          <h2>{post.title}</h2>
          <p>{post.content}</p>

          {/* Group Buy Inline Price if applicable */}
          {post.targetPrice && (
            <div className={styles.togetherInlinePrice}>
              <span>1인 예상 분담금</span>
              <strong>{post.targetPrice.toLocaleString()}원</strong>
            </div>
          )}

          {/* Seed Linear Progress Bar */}
          <div className={styles.togetherProgressWrap}>
            <div className={styles.togetherProgressBar}>
              <div
                className={styles.togetherProgressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Footer Metadata */}
          <small>
            {post.regionName} · {post.userName} · 참여 {post.participantCount}/{post.maxParticipants}명 ({progressPercent}%) · 조회 {post.viewCount}
          </small>
        </div>

        <ChevronRight size={18} className={styles.togetherBannerArrow} style={{ alignSelf: "center" }} />
      </button>
    </article>
  );
}


