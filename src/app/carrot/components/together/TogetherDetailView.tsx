"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  Share2,
  MoreVertical,
  MessageCircle,
} from "lucide-react";
import { TOGETHER_CATEGORIES, TogetherPost } from "@/types/together";
import styles from "../../GajiMarketApp.module.css";
import { MannerTemperatureModal } from "../common/MannerTemperatureModal";

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
  const [showMannerModal, setShowMannerModal] = useState(false);
  const catMeta = TOGETHER_CATEGORIES[post.category] || TOGETHER_CATEGORIES.etc;
  const isJoined = Boolean(post.isJoined);
  const isCancelled = post.status === "cancelled";
  const isFull = post.participantCount >= post.maxParticipants || post.status === "completed";
  const isClosed = isFull || isCancelled;
  const remainingCount = Math.max(0, post.maxParticipants - post.participantCount);
  const statusLabel = isCancelled ? "모임 취소" : isFull ? "모집 완료" : "모집중";

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
          <span className={styles.togetherCategoryPill}>
            <span>{catMeta.label}</span>
          </span>
          <span
            className={`${styles.togetherStatusPill} ${
              isClosed ? styles.togetherStatusPillFull : styles.togetherStatusPillActive
            }`}
          >
            <span>{statusLabel}</span>
          </span>
          <span className={styles.togetherDdayPill}>
            {post.deadlineDaysLeft > 0 ? `D-${post.deadlineDaysLeft}` : "오늘 마감"}
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 21,
            fontWeight: 800,
            margin: "10px 0 6px",
            lineHeight: 1.35,
            wordBreak: "keep-all",
            letterSpacing: "-0.02em",
          }}
        >
          {post.title}
        </h1>

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
          <button type="button" className={styles.trustPill} onClick={() => setShowMannerModal(true)}>
            신뢰온도 {post.userMannerTemp ?? 36.5}°C
          </button>
        </div>

        {/* Content Body */}
        <p
          className={styles.detailDescription}
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "keep-all",
            lineHeight: 1.65,
            fontSize: 15,
            color: "var(--color-text)",
            margin: "16px 0 8px",
          }}
        >
          {post.content}
        </p>

        {/* Group Buy Section if applicable */}
        {post.category === "group_buy" && (post.productName || post.targetPrice) && (
          <div className={styles.togetherBox}>
            <div className={styles.togetherBoxHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>공동구매 상세 정보</span>
              </div>
            </div>
            <div className={styles.togetherInfoGrid}>
              {post.productName && (
                <div className={styles.togetherInfoRow}>
                  <span className={styles.togetherInfoLabel}>구매 품목</span>
                  <strong className={styles.togetherInfoValue}>{post.productName}</strong>
                </div>
              )}
              {post.targetPrice && (
                <div className={styles.togetherInfoRow}>
                  <span className={styles.togetherInfoLabel}>1인당 예상 분담금</span>
                  <strong className={styles.togetherInfoPrice}>
                    {post.targetPrice.toLocaleString()}원
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Neighbor participation, expressed as people instead of a percentage. */}
        <div className={styles.togetherBox}>
          <div className={styles.togetherBoxHeader}>
            <div>
              <span>같이 참여하는 이웃</span>
              <p className={styles.togetherNeighborDetailCopy}>
                <strong>{post.participantCount}명</strong>이 함께하고 있어요
              </p>
            </div>
            <span className={styles.togetherRemainingLabel}>
              {isCancelled
                ? "취소된 모임"
                : isFull
                  ? "모집이 끝났어요"
                  : `${remainingCount}자리 남았어요`}
            </span>
          </div>
          <ul className={styles.togetherParticipantList} aria-label="참여 이웃 목록">
            {post.participants.map((p, idx) => (
              <li key={`${p.userId}-${idx}`} className={styles.togetherParticipantRow}>
                <div className={styles.togetherParticipantUser}>
                  <div className={styles.togetherMiniAvatar} aria-hidden="true">
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
              </li>
            ))}

            {Array.from({ length: Math.max(0, post.maxParticipants - post.participants.length) }).map(
              (_, i) => (
                <li key={`empty-${i}`} className={styles.togetherEmptyRow}>
                  <div className={styles.togetherEmptyUser}>
                    <div className={styles.togetherEmptyAvatar} aria-hidden="true">+</div>
                    <span className={styles.togetherEmptyLabel}>함께할 이웃을 기다려요</span>
                  </div>
                </li>
              )
            )}
          </ul>
        </div>
      </article>

      {/* Dedicated Fixed Bottom Action Bar */}
      <div className={styles.togetherDetailActionBar}>
        {post.allowChat && (
          <button
            type="button"
            onClick={onStartChat}
            className={styles.togetherDetailChatBtn}
            aria-label="채팅하기"
          >
            <MessageCircle size={18} />
            <span>채팅하기</span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleJoin}
          disabled={!isJoined && isClosed}
          className={`${styles.togetherDetailJoinBtn} ${
            isJoined
              ? styles.togetherDetailJoinBtnJoined
              : isClosed
              ? styles.togetherDetailJoinBtnFull
              : styles.togetherDetailJoinBtnActive
          }`}
          aria-label={isJoined ? "참여 취소" : isCancelled ? "취소된 모임" : isFull ? "모집 마감" : "같이하기"}
        >
          {isJoined ? "참여 취소" : isCancelled ? "취소된 모임" : isFull ? "모집 마감" : "같이하기"}
        </button>
      </div>

      <MannerTemperatureModal
        isOpen={showMannerModal}
        onClose={() => setShowMannerModal(false)}
        targetTemp={post.userMannerTemp ?? 36.5}
      />
    </section>
  );
}
