import React from "react";
import { Heart } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { AlbaItem } from "@/types";

export interface AlbaCardComponentProps {
  alba: AlbaItem;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

export function AlbaCardComponent({
  alba,
  onSelect,
  onToggleFavorite,
}: AlbaCardComponentProps) {
  return (
    <article className={styles.albaCard}>
      <button type="button" className={styles.albaCardMain} onClick={onSelect}>
        <div className={styles.albaCardThumbFrame}>
          <div className={styles.albaCardThumbVisual} style={{ background: alba.bgGradient }}>
            <span className={styles.albaCardThumbEmoji}>{alba.thumbnailEmoji ?? "🏢"}</span>
          </div>
        </div>
        <div className={styles.albaCardBody}>
          <span className={styles.albaCardCompany}>{alba.companyName}</span>
          <h3 className={styles.albaCardTitle}>{alba.title}</h3>
          <div className={styles.albaCardMeta}>
            {alba.neighborhoodName} · {alba.workingDays}
          </div>
          <div className={styles.albaCardPay}>{alba.payLabel}</div>
          <div className={styles.albaBadgeRow}>
            {alba.badges.slice(0, 2).map((badge, idx) => (
              <span
                key={`${badge}-${idx}`}
                className={`${styles.albaBadge} ${badge.includes("정직원") || badge.includes("모범") ? styles.albaBadgeGreen : ""}`}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </button>
      <button
        type="button"
        className={`${styles.albaCardHeartBtn} ${alba.isFavorite ? styles.albaCardHeartBtnActive : ""}`}
        aria-label={alba.isFavorite ? "관심 알바 해제" : "관심 알바 저장"}
        onClick={onToggleFavorite}
      >
        <Heart size={16} fill={alba.isFavorite ? "currentColor" : "none"} color="currentColor" />
      </button>
    </article>
  );
}
