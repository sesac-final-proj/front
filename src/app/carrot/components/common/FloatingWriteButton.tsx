"use client";

import React from "react";
import { Plus } from "lucide-react";
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
  return (
    <div className={styles.floatingWriteWrapper}>
      {showTogetherTooltip && (
        <div
          className={styles.togetherFabTooltip}
          onClick={onTooltipClick || onClick}
          role="button"
          tabIndex={0}
        >
          <span>같이해요 기능이 출시되었어요!</span>
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
