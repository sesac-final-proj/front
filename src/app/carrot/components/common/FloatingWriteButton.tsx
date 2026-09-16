"use client";

import React from "react";
import { Plus, Sparkles } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";

export function FloatingWriteButton({
  onClick,
  showTogetherTooltip = false,
  onTooltipClick,
}: {
  onClick: () => void;
  showTogetherTooltip?: boolean;
  onTooltipClick?: () => void;
}) {
  const handleTooltipClick = onTooltipClick || onClick;

  return (
    <div className={styles.floatingWriteWrapper}>
      {showTogetherTooltip && (
        <div
          className={styles.togetherFabTooltip}
          onClick={handleTooltipClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTooltipClick();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="같이해요 기능 시작하기 안내"
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={14} style={{ color: "#ff922b" }} />
            같이해요 기능이 출시되었어요!
          </span>
        </div>
      )}
      <button
        type="button"
        className={styles.circleFab}
        onClick={onClick}
        aria-label="글쓰기"
      >
        <Plus size={28} strokeWidth={2.4} />
      </button>
    </div>
  );
}
