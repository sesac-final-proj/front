import React from "react";
import { X } from "lucide-react";
import styles from "../../GajiMarketApp.module.css";
import type { LocalBusiness } from "@/types";
import { DANGER_VISUALS } from "../../constants";
import { getDangerVisual } from "../../utils";

export interface DangerSignalCalloutProps {
  business: LocalBusiness;
  onClose: () => void;
}

export function DangerSignalCallout({ business, onClose }: DangerSignalCalloutProps) {
  const visual = getDangerVisual(business) ?? DANGER_VISUALS.default;
  const toneClass = styles[`dangerMarker_${visual.tone}` as keyof typeof styles] ?? "";
  const meta = [business.riskType ?? visual.label, business.neighborhoodName, business.distance].filter(Boolean).join(" · ");

  return (
    <aside className={`${styles.dangerCallout} ${toneClass}`} role="status" aria-live="polite">
      <span className={styles.dangerCalloutAvatar} aria-hidden="true">{visual.emoji}</span>
      <div className={styles.dangerCalloutBubble}>
        <div className={styles.dangerCalloutTop}>
          <span>안전 알림</span>
          <button type="button" onClick={onClose} aria-label="위험 알림 닫기">
            <X size={16} />
          </button>
        </div>
        <strong>{business.name}</strong>
        <p>{business.summary}</p>
        <small>{meta}</small>
      </div>
    </aside>
  );
}
