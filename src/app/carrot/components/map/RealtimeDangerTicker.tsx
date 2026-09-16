import React, { useState, useEffect } from "react";
import styles from "../../GajiMarketApp.module.css";
import type { LocalBusiness } from "@/types";

export interface RealtimeDangerTickerProps {
  dangerSignals: LocalBusiness[];
  onSelectDanger?: (business: LocalBusiness) => void;
}

export function RealtimeDangerTicker({
  dangerSignals,
  onSelectDanger,
}: RealtimeDangerTickerProps) {
  // 서울안전누리(Nuri) 실시간 크롤링 위험 소식 목록 (2개씩 순환 표시)
  const nuriAlerts = dangerSignals.map((d) => ({
    title: d.name,
    tag: d.riskType ? `${d.riskType}` : "공식 소식",
    business: d,
  }));

  const fallbackAlerts = [
    { title: "교통 통제·공지도 여기 모여요", tag: "공식 소식", business: null },
    { title: "잠수교 보행로 및 차도 전면 통제", tag: "도로통제", business: null },
    { title: "서울 동남권 호우주의보 발효 중", tag: "기상특보", business: null },
    { title: "성내천·탄천 산책로 출입 통제", tag: "하천통제", business: null },
    { title: "올림픽대로 여의교 부근 부분통제", tag: "도로공사", business: null },
  ];

  const streamAlerts = nuriAlerts.length >= 2 ? nuriAlerts : [...nuriAlerts, ...fallbackAlerts];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % streamAlerts.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [streamAlerts.length]);

  const safeIndex = streamAlerts.length > 0 ? currentIndex % streamAlerts.length : 0;
  const item1 = streamAlerts[safeIndex] || streamAlerts[0] || fallbackAlerts[0];
  const item2 = streamAlerts[(safeIndex + 1) % (streamAlerts.length || 1)] || streamAlerts[0] || fallbackAlerts[1];

  return (
    <div className={styles.realtimeNewsCard}>
      <div className={styles.realtimeNewsHeader}>
        <span className={styles.realtimeDot} />
        <strong>실시간 소식</strong>
      </div>
      <div className={styles.realtimeNewsSlider}>
        <div
          key={`row1-${safeIndex}`}
          className={styles.realtimeNewsRow}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (item1?.business && onSelectDanger) {
              onSelectDanger(item1.business);
            }
          }}
        >
          <p className={styles.realtimeNewsText}>{item1?.title}</p>
          <small className={styles.realtimeNewsTag}>{item1?.tag}</small>
        </div>
        <div
          key={`row2-${safeIndex}`}
          className={styles.realtimeNewsRow}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (item2?.business && onSelectDanger) {
              onSelectDanger(item2.business);
            }
          }}
        >
          <p className={styles.realtimeNewsText}>{item2?.title}</p>
          <small className={styles.realtimeNewsTag}>{item2?.tag}</small>
        </div>
      </div>
    </div>
  );
}
