"use client";
import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import seoulDong from "@/data/seoul-dong.json";
import type { PriceComparisonRegionItem, PriceComparisonSample, PriceDongStatItem } from "@/services/adminService";
import { EmptyState } from "./AdminUI";
import styles from "./PriceGuMap.module.css";

const dongFeatures = (seoulDong as any).features as any[];
const GU_ORDER = ["송파구", "영등포구", "노원구"] as const;
const COLOR_ABOVE = "#FF6F0F"; // 브랜드 오렌지 — 카테고리 중앙값보다 비쌈
const COLOR_BELOW = "#3B6FA8"; // 진한 블루 — 카테고리 중앙값보다 저렴
const COLOR_EQUAL = "#F0F1ED";
function fillForDev(devPct: number) {
  if (devPct === 0) return COLOR_EQUAL;
  return devPct > 0 ? COLOR_ABOVE : COLOR_BELOW;
}

const money = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const normalizeDong = (name: string) => name.replace(/제/g, "");

function PriceStrip({ prices }: { prices: number[] }) {
  if (!prices.length) return <p className={styles.muted}>표본 없음</p>;
  const w = 220;
  const h = 30;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const xOf = (p: number) => (max === min ? w / 2 : ((p - min) / (max - min)) * (w - 12) + 6);
  return (
    <div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <line x1={6} y1={h / 2} x2={w - 6} y2={h / 2} stroke="#E7E8E5" strokeWidth={1} />
        {prices.map((p, i) => (
          <line key={i} x1={xOf(p)} x2={xOf(p)} y1={5} y2={h - 5} stroke="#FF6F0F" strokeOpacity={0.35} strokeWidth={1.5} />
        ))}
      </svg>
      <div className={styles.stripScale}>
        <span>{money(min)}</span>
        <span>{money(max)}</span>
      </div>
    </div>
  );
}

export function PriceGuMap({ regions, categoryMedianPrice, samples = [], dongStats = [] }: { regions: PriceComparisonRegionItem[]; categoryMedianPrice: number; samples?: PriceComparisonSample[]; dongStats?: PriceDongStatItem[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedDong, setSelectedDong] = useState<string | null>(null);

  const availableGu = useMemo(
    () => GU_ORDER.filter(gu => regions.some(r => r.gu === gu)),
    [regions],
  );
  const [selectedGu, setSelectedGu] = useState<string>(GU_ORDER[0]);
  const activeGu = availableGu.includes(selectedGu as any) ? selectedGu : availableGu[0];

  const activeFeatures = useMemo(
    () => dongFeatures.filter(f => f.properties.gu === activeGu),
    [activeGu],
  );

  const { width, height, pathGenerator } = useMemo(() => {
    const w = 560;
    const h = 380;
    const fc = { type: "FeatureCollection", features: activeFeatures } as any;
    const projection = geoMercator().fitSize([w, h], fc);
    return { width: w, height: h, pathGenerator: geoPath(projection) };
  }, [activeFeatures]);

  const statByGu = useMemo(() => {
    const map = new Map<string, { median_price: number; dev_pct: number; sample_count: number }>();
    regions.forEach(r => {
      const dev = categoryMedianPrice ? ((r.median_price - categoryMedianPrice) / categoryMedianPrice) * 100 : 0;
      map.set(r.gu, { median_price: r.median_price, dev_pct: Math.round(dev * 10) / 10, sample_count: r.sample_count });
    });
    return map;
  }, [regions, categoryMedianPrice]);

  const labelPoint = useMemo(() => {
    if (!activeFeatures.length) return null;
    const sum = activeFeatures.reduce((acc, f) => {
      const [cx, cy] = pathGenerator.centroid(f);
      return { x: acc.x + cx, y: acc.y + cy, n: acc.n + 1 };
    }, { x: 0, y: 0, n: 0 });
    return { x: sum.x / sum.n, y: sum.y / sum.n };
  }, [activeFeatures, pathGenerator]);

  const pricesByGu = useMemo(() => {
    const map = new Map<string, number[]>();
    samples.forEach(s => map.set(s.gu, [...(map.get(s.gu) ?? []), s.price]));
    return map;
  }, [samples]);

  const dongStatByName = useMemo(() => {
    const map = new Map<string, PriceDongStatItem>();
    dongStats.filter(row => row.gu === activeGu).forEach(row => map.set(normalizeDong(row.dong), row));
    return map;
  }, [dongStats, activeGu]);

  if (!regions.length) return <EmptyState message="이 카테고리는 지역별 시세 데이터가 없습니다." />;
  const activeStat = statByGu.get(activeGu);
  const activePrices = pricesByGu.get(activeGu) ?? [];
  const selectedStat = selectedDong ? dongStatByName.get(normalizeDong(selectedDong)) : null;

  return (
    <div
      className={styles.mapShell}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <div className={styles.guTabs} aria-label="자치구 선택">
        {availableGu.map(gu => (
          <button key={gu} type="button" className={gu === activeGu ? styles.guTabActive : ""} onClick={() => { setSelectedGu(gu); setSelectedDong(null); }}>
            {gu}
          </button>
        ))}
      </div>
      <div className={styles.mapBody}>
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.mapSvg} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${activeGu} 가격 시세지도`}>
        {activeFeatures.map((f, i) => {
          const rawName = f.properties.name as string;
          const gu = f.properties.gu as string;
          const dongStat = dongStatByName.get(normalizeDong(rawName));
          const isHovered = hover === rawName;
          const isSelected = selectedDong === rawName;
          return (
            <g
              key={`${gu}-${rawName}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onMouseEnter={() => setHover(rawName)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setSelectedDong(isSelected ? null : rawName)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setSelectedDong(isSelected ? null : rawName);
              }}
              className={`${styles.guShape} ${isHovered || isSelected ? styles.guShapeHover : ""}`}
              style={{ animationDelay: `${Math.min(i, 40) * 8}ms` }}
            >
              <path d={pathGenerator(f) ?? undefined} fill={dongStat ? fillForDev(dongStat.dev_pct) : "#F0F1ED"} stroke={isSelected ? "#1A1C20" : "#fff"} strokeWidth={isSelected ? 2.4 : 1}>
                <title>
                  {rawName}
                  {dongStat ? ` · 중위가 ${dongStat.median_price.toLocaleString("ko-KR")}원 · 구 중위가 대비 ${dongStat.dev_pct > 0 ? "+" : ""}${dongStat.dev_pct}% · 표본 ${dongStat.sample_count}건` : " · 데이터 없음"}
                </title>
              </path>
            </g>
          );
        })}
        {labelPoint && activeStat && (
          <g style={{ pointerEvents: "none" }}>
            <text x={labelPoint.x} y={labelPoint.y - 8} textAnchor="middle" className={styles.mapLabel}>{activeGu}</text>
            <text x={labelPoint.x} y={labelPoint.y + 15} textAnchor="middle" className={styles.mapSubLabel}>
              {money(activeStat.median_price)} ({activeStat.dev_pct > 0 ? "+" : ""}{activeStat.dev_pct}%)
            </text>
          </g>
        )}
        </svg>
        <aside className={styles.summaryPanel}>
          <span>{selectedDong ? `${activeGu} ${selectedDong}` : activeGu}</span>
          <strong>{selectedStat ? money(selectedStat.median_price) : activeStat ? money(activeStat.median_price) : "데이터 없음"}</strong>
          {selectedStat ? (
            <p>구 중위가 대비 {selectedStat.dev_pct > 0 ? "+" : ""}{selectedStat.dev_pct}% · 표본 {selectedStat.sample_count.toLocaleString("ko-KR")}건 · 클릭하면 선택 해제</p>
          ) : activeStat && (
            <p>카테고리 중앙값 대비 {activeStat.dev_pct > 0 ? "+" : ""}{activeStat.dev_pct}% · 표본 {activeStat.sample_count.toLocaleString("ko-KR")}건 · 동을 클릭해 상세 보기</p>
          )}
          <PriceStrip prices={activePrices} />
        </aside>
      </div>
      <div className={styles.legend}>
        <span><i style={{ background: COLOR_BELOW }} />중앙값보다 저렴</span>
        <span><i style={{ background: COLOR_EQUAL, border: "1px solid #E7E8E5" }} />중앙값과 같음</span>
        <span><i style={{ background: COLOR_ABOVE }} />중앙값보다 비쌈</span>
      </div>
      {hover && hoverPos && (
        <div
          className={styles.tooltip}
          style={{
            left: hoverPos.x + 14,
            top: hoverPos.y + 14,
          }}
        >
          <b>{hover}</b>
          {(() => {
            const stat = dongStatByName.get(normalizeDong(hover));
            return <p>{stat ? `중위가 ${money(stat.median_price)} · 구 대비 ${stat.dev_pct > 0 ? "+" : ""}${stat.dev_pct}% · 표본 ${stat.sample_count.toLocaleString("ko-KR")}건` : "동별 시세 데이터 없음"}</p>;
          })()}
        </div>
      )}
    </div>
  );
}
