import React from "react";
import styles from "../../GajiMarketApp.module.css";
import type { LocalBusiness } from "@/types";
import { DANGER_VISUALS, NEIGHBORHOOD_COORDS } from "../../constants";
import { getDangerVisual } from "../../utils";

export interface FallbackDangerMarkersProps {
  activeNeighborhood: string;
  businesses: LocalBusiness[];
  onSelectBusiness: (business: LocalBusiness) => void;
}

export function FallbackDangerMarkers({
  activeNeighborhood,
  businesses,
  onSelectBusiness,
}: FallbackDangerMarkersProps) {
  const center = NEIGHBORHOOD_COORDS[activeNeighborhood] ?? NEIGHBORHOOD_COORDS.송파삼성래미안;
  const dangerBusinesses = businesses.filter((business) => business.category === "danger").slice(0, 18);

  return (
    <div className={styles.fallbackMarkers}>
      {dangerBusinesses.map((business) => {
        const visual = getDangerVisual(business) ?? DANGER_VISUALS.default;
        const x = Math.min(92, Math.max(8, 50 + (business.lng - center.lng) * 4200));
        const y = Math.min(88, Math.max(12, 50 - (business.lat - center.lat) * 5200));
        return (
          <button
            type="button"
            key={business.id}
            className={`${styles.dangerMapMarker} ${styles[`dangerMarker_${visual.tone}` as keyof typeof styles] ?? ""}`}
            aria-label={`${visual.label}: ${business.name}`}
            onClick={() => onSelectBusiness(business)}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span>{visual.emoji}</span>
          </button>
        );
      })}
    </div>
  );
}
