"use client";

import React from "react";
import { ChevronLeft, ShoppingBag, Sparkles, HeartHandshake } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";

interface TogetherIntroViewProps {
  onBack: () => void;
  onStart: () => void;
}

export function TogetherIntroView({ onBack, onStart }: TogetherIntroViewProps) {
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
        <h1>같이해요 소개</h1>
        <div style={{ width: 27 }} />
      </header>

      {/* Intro Body */}
      <div className={styles.togetherIntroStack} style={{ paddingBottom: 100 }}>
        <div className={styles.togetherIntroHero}>
          <h1>
            우리 동네 이웃과 함께하는<br />
            <strong>🛒 같이해요</strong>
          </h1>
          <p>
            배송비 절약부터 취미, 육아까지 이웃과 함께 부담 없이 모여요.
          </p>
        </div>

        {/* Feature Cards */}
        <div className={styles.togetherIntroCards}>
          <div className={styles.togetherIntroCard}>
            <div className={styles.togetherIntroCardIcon}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className={styles.togetherIntroCardTitle}>공동구매 & 배송비 절약</div>
              <p className={styles.togetherIntroCardDesc}>
                대용량 식재료나 가구 배송비를 이웃과 1/N로 함께 나눠요.
              </p>
            </div>
          </div>

          <div className={styles.togetherIntroCard}>
            <div className={styles.togetherIntroCardIcon}>
              <HeartHandshake size={20} />
            </div>
            <div>
              <div className={styles.togetherIntroCardTitle}>공동육아 & 취미 활동</div>
              <p className={styles.togetherIntroCardDesc}>
                비슷한 또래 육아 정보 공유부터 배드민턴, 러닝, 독서까지 함께해요.
              </p>
            </div>
          </div>

          <div className={styles.togetherIntroCard}>
            <div className={styles.togetherIntroCardIcon}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className={styles.togetherIntroCardTitle}>반려견 산책 메이트</div>
              <p className={styles.togetherIntroCardDesc}>
                동네 댕댕이 친구들과 안전하고 즐겁게 안양천 산책을 즐겨요.
              </p>
            </div>
          </div>
        </div>

        {/* Seed Info Box */}
        <div className={styles.togetherBox} style={{ margin: 0 }}>
          <strong>💡 같이해요 이용 팁</strong>
          <p style={{ margin: 0, color: "var(--color-muted)", fontSize: 13, lineHeight: 1.5 }}>
            모임에 참여하거나 직접 모집 글을 올려 이웃과 1:1 채팅 또는 모임으로 연결될 수 있습니다.
          </p>
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className={styles.detailActionBar}>
        <button
          type="button"
          onClick={onStart}
          style={{ width: "100%", background: "var(--color-primary)", color: "#ffffff" }}
        >
          같이해요 시작하기
        </button>
      </div>
    </section>
  );
}

