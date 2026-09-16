import React from "react";
import { Clock3, ShieldCheck } from "lucide-react";
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

function getTradeGuidance(levelLabel?: string) {
  if (levelLabel === "붐빔") return "사람이 많아요. 약속 장소를 정확히 정해두세요.";
  if (levelLabel === "약간 붐빔") return "주변을 살피고, 사람이 보이는 곳에서 거래해요.";
  if (levelLabel === "여유") return "한적할 수 있어요. 밝은 공공장소에서 거래해요.";
  return "사람이 보이는 공공장소에서 거래하기 좋아요.";
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
      <div className={styles.congestionScale} aria-label="혼잡 단계 범례">
        {[{ score: 22, label: "여유" }, { score: 60, label: "보통" }, { score: 78, label: "약간 붐빔" }, { score: 92, label: "붐빔" }].map(({ score, label }) => {
          const theme = getSeedPastelTheme(score, colorScheme);
          return (
            <span key={label} className={styles.congestionScaleStep} style={{ color: theme.badgeText }}>
              <span className={styles.congestionScaleBar} style={{ background: theme.tagColor }} aria-hidden="true" />
              <span>{label}</span>
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
              <article
                key={zone.id}
                className={styles.congestionZoneCard}
                style={{ "--zone-accent": theme.tagColor } as React.CSSProperties}
              >
                <span className={styles.congestionZoneMascot} aria-hidden="true" />
                <div className={styles.congestionZoneBody}>
                  <div className={styles.congestionZoneTop}>
                    <div>
                      <strong className={styles.congestionZoneTitle}>{zone.name}</strong>
                      <div className={styles.congestionZoneMeta}>
                        <span className={styles.congestionZoneSummary}>{getCongestionPopulationLabel(zone)}</span>
                        <span className={styles.congestionZoneStatus} style={{ color: theme.badgeText }}>
                          <i style={{ background: theme.tagColor }} aria-hidden="true" />
                          {zone.levelLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.congestionTradeGuide}>
                    <ShieldCheck size={15} aria-hidden="true" />
                    <span>{getTradeGuidance(zone.levelLabel)}</span>
                  </p>
                  <footer className={styles.congestionZoneFooter}>
                    <Clock3 size={12} aria-hidden="true" />
                    <span>서울시 · {zone.updatedAt}</span>
                  </footer>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
