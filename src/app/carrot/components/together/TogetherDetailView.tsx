"use client";

import React from "react";
import {
  ChevronLeft,
  Share2,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import { TOGETHER_CATEGORIES, TogetherPost } from "@/types/together";
import styles from "../../GajiMarketApp.module.css";

interface TogetherDetailViewProps {
  post: TogetherPost;
  onBack: () => void;
  onToggleJoin: () => void;
  onStartChat: () => void;
}

export function TogetherDetailView({
  post,
  onBack,
  onToggleJoin,
  onStartChat,
}: TogetherDetailViewProps) {
  const catMeta = TOGETHER_CATEGORIES[post.category] || TOGETHER_CATEGORIES.etc;
  const isJoined = Boolean(post.isJoined);
  const isFull = post.participantCount >= post.maxParticipants || post.status === "completed";
  const progressPercent = Math.min(
    100,
    Math.round((post.participantCount / post.maxParticipants) * 100)
  );

  return (
    <section className={styles.screen}>
      {/* ScreenHeader */}
      <header className={styles.screenHeader}>
        <button
          type="button"
          onClick={onBack}
          className={styles.iconButton}
          aria-label="뒤로"
        >
          <ChevronLeft size={27} />
        </button>
        <h1>같이해요</h1>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className={styles.iconButton} aria-label="공유">
            <Share2 size={21} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="더보기">
            <MoreVertical size={23} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <article className={styles.detailArticle} style={{ paddingBottom: 110 }}>
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

        {/* Title */}
        <h1>{post.title}</h1>

        <p className={styles.metaLine}>
          {post.regionName} · {post.deadline} 마감 · 조회 {post.viewCount}
        </p>

        {/* Author / Seller Profile Card */}
        <div className={styles.sellerCard}>
          <div className={styles.avatar}>
            {post.userName.slice(0, 1)}
          </div>
          <div>
            <strong>{post.userName}</strong>
            <span>{post.userNeighborhood}</span>
          </div>
          <button type="button" className={styles.trustPill}>
            신뢰온도 {post.userMannerTemp ?? 36.5}°C
          </button>
        </div>

        {/* Content Body */}
        <p className={styles.detailDescription}>{post.content}</p>

        {/* Group Buy Section if applicable */}
        {post.category === "group_buy" && (post.productName || post.targetPrice) && (
          <div className={styles.togetherBox}>
            <strong>🛒 공동구매 상세</strong>
            {post.productName && (
              <div>
                <span>구매 품목</span>
                <strong>{post.productName}</strong>
              </div>
            )}
            {post.targetPrice && (
              <div>
                <span>1인당 예상 분담금</span>
                <strong style={{ color: "var(--color-primary)" }}>
                  {post.targetPrice.toLocaleString()}원
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Participant Progress & List */}
        <div className={styles.togetherBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <strong>👥 참여 이웃 ({post.participantCount} / {post.maxParticipants}명)</strong>
            <span style={{ fontSize: 13, color: "var(--color-primary)", fontWeight: 700 }}>
              {progressPercent}%
            </span>
          </div>
          <div className={styles.togetherProgressBar}>
            <div
              className={styles.togetherProgressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className={styles.togetherParticipantList}>
            {post.participants.map((p, idx) => (
              <div key={idx} className={styles.togetherParticipantRow}>
                <div className={styles.togetherParticipantUser}>
                  <div className={styles.togetherMiniAvatar}>
                    {p.userName.slice(0, 1)}
                  </div>
                  <span>{p.userName}</span>
                  {p.userId === post.userId && (
                    <span className={styles.togetherTagHost}>모임장</span>
                  )}
                  {p.userId === "me" && (
                    <span className={styles.togetherTagMe}>나</span>
                  )}
                </div>
                <small style={{ color: "var(--color-muted)", fontSize: 12 }}>
                  {p.joinedAt.slice(0, 10)}
                </small>
              </div>
            ))}

            {Array.from({ length: Math.max(0, post.maxParticipants - post.participants.length) }).map(
              (_, i) => (
                <div key={`empty-${i}`} className={styles.togetherEmptyRow}>
                  <div className={styles.togetherEmptyAvatar}>+</div>
                  <span>참여 가능한 빈자리</span>
                </div>
              )
            )}
          </div>
        </div>
      </article>

      {/* Fixed Bottom Action Bar */}
      <div className={styles.detailActionBar}>
        {post.allowChat && (
          <button
            type="button"
            onClick={onStartChat}
            style={{ width: "auto", minWidth: 96 }}
          >
            <MessageCircle size={18} style={{ marginRight: 4 }} />
            채팅하기
          </button>
        )}
        <button
          type="button"
          onClick={onToggleJoin}
          disabled={!isJoined && isFull}
          style={{
            flex: 1,
            background: isJoined
              ? "#303136"
              : isFull
              ? "var(--color-dim)"
              : "var(--color-primary)",
            color: isJoined ? "var(--color-text)" : "#ffffff",
          }}
        >
          {isJoined ? "참여 취소" : isFull ? "모집 마감" : "같이하기"}
        </button>
      </div>
    </section>
  );
}

