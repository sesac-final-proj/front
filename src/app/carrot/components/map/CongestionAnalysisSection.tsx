import React from "react";
import styles from "../../GajiMarketApp.module.css";
import type { CongestionZone } from "@/types";
import { getSeedPastelTheme, getCongestionPopulationLabel } from "@/services";
import { StateBlock } from "../common";

export interface CongestionAnalysisSectionProps {
  zones: CongestionZone[];
  colorScheme: "dark" | "light";
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClearQuery?: () => void;
}

export function CongestionAnalysisSection({
  zones,
  colorScheme,
  loading,
  error,
  onRetry,
  onClearQuery,
}: CongestionAnalysisSectionProps) {
  return (
    <section className={`${styles.localResults} ${styles.congestionSection}`} aria-busy={loading}>
      <div className={styles.congestionHeader}>
        <div>
          <h2 aria-live="polite">현 지도 혼잡도 {zones.length > 0 ? `${zones.length}곳` : ""}</h2>
          <p>서울시 제공 장소의 인구 혼잡 단계예요. 색상은 단계별로 표시해요.</p>
        </div>
      </div>
      <div className={styles.seedColorBoardPills} aria-label="혼잡 단계 범례">
        {[{ score: 22, label: "여유" }, { score: 60, label: "보통" }, { score: 78, label: "약간 붐빔" }, { score: 92, label: "붐빔" }].map(({ score, label }) => {
          const theme = getSeedPastelTheme(score, colorScheme);
          return (
            <span key={label} className={styles.seedColorBoardPill} style={{ background: theme.badgeBg, borderColor: theme.badgeBorder, color: theme.badgeText }}>
              <span className={styles.seedPillDot} style={{ background: theme.tagColor }} />{label}
            </span>
          );
        })}
      </div>
      {loading ? (
        <p role="status">현재 지도 범위의 혼잡도를 확인하고 있어요.</p>
      ) : error ? (
        <StateBlock title="혼잡도를 불러오지 못했어요" body={error} actionLabel="다시 시도" onAction={onRetry} />
      ) : zones.length === 0 ? (
        <StateBlock
          title="이 지도 범위에는 제공되는 혼잡도 정보가 없어요"
          body="지도를 넓히거나 다른 지역을 확인해 주세요. 서울시 주요 장소만 제공돼요."
          actionLabel={onClearQuery ? "검색어 지우기" : "다시 확인"}
          onAction={onClearQuery ?? onRetry}
        />
      ) : (
        <div className={styles.congestionZoneList}>
          {zones.map((zone) => {
            const theme = getSeedPastelTheme(zone.currentScore, colorScheme);
            return (
              <article key={zone.id} className={styles.congestionZoneCard} style={{ borderLeft: `3px solid ${theme.tagColor}`, background: "var(--color-surface)" }}>
                <div className={styles.congestionZoneTop}>
                  <div>
                    <strong className={styles.congestionZoneTitle}>{zone.name}</strong>
                    <span className={styles.congestionZoneSummary}>{getCongestionPopulationLabel(zone)}</span>
                  </div>
                  <span className={styles.seedZoneBadge} style={{ background: theme.badgeBg, color: theme.badgeText, borderColor: theme.badgeBorder }}>
                    {zone.levelLabel}
                  </span>
                </div>
                <p className={styles.congestionZoneSummary}>{zone.summary}</p>
                <footer className={styles.congestionZoneFooter}>
                  <span>서울시 · {zone.updatedAt}</span>
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
