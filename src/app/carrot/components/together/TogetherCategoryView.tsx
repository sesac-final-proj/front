"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TOGETHER_CATEGORIES, TogetherCategory } from "@/types/together";
import styles from "../../GajiMarketApp.module.css";

interface TogetherCategoryViewProps {
  onBack: () => void;
  onSelectCategory: (category: TogetherCategory) => void;
}

export function TogetherCategoryView({
  onBack,
  onSelectCategory,
}: TogetherCategoryViewProps) {
  const categoryList = Object.values(TOGETHER_CATEGORIES);

  return (
    <section className={styles.screen}>
      {/* Top Navigation */}
      <header className={styles.screenHeader}>
        <button
          type="button"
          onClick={onBack}
          className={styles.iconButton}
          aria-label="뒤로"
        >
          <ChevronLeft size={27} />
        </button>
        <h1>카테고리 선택</h1>
        <div style={{ width: 27 }} />
      </header>

      {/* Main Content */}
      <div style={{ padding: "16px 0" }}>
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 6px" }}>
            어떤 활동을 이웃과 함께할까요?
          </h2>
          <p style={{ fontSize: 14, color: "var(--color-muted)", margin: 0 }}>
            원하는 모임의 주제를 선택해주세요.
          </p>
        </div>

        {/* Category List */}
        <div className={styles.togetherCategoryList}>
          {categoryList.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelectCategory(cat.key)}
              className={styles.togetherCategoryCard}
            >
              <span className={styles.togetherCategoryEmoji}>{cat.icon}</span>
              <div className={styles.togetherCategoryInfo}>
                <strong className={styles.togetherCategoryName}>{cat.label}</strong>
                <p className={styles.togetherCategoryDesc}>{cat.description}</p>
              </div>
              <ChevronRight size={18} className={styles.togetherCategoryArrow} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

