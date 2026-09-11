"use client";
import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import seoulDong from "@/data/seoul-dong.json";
import type { PriceComparisonRegionItem, PriceComparisonSample } from "@/services/adminService";
import { EmptyState } from "./AdminUI";
import styles from "./PriceGuMap.module.css";

// SeoulGuMap.tsx(거래건수 지도)과 같은 경계 데이터·기법(geoMercator+geoPath)을
// 쓴다 — 다만 seoul-dong.json엔 구 단위 경계가 따로 없어서(동 63개뿐), 동 폴리곤을
// 그대로 그리되 색은 그 동이 속한 "구" 값 하나로만 칠한다(동별로 안 갈림). 그래서
// 같은 구 안의 동끼리는 전부 같은 색 — 결과적으로 구 3개짜리 지도로 보인다.
const dongFeatures = (seoulDong as any).features as any[];

// 그라데이션(편차 크기에 따라 색 농도를 다르게)은 구가 3개뿐이라 크기 구분이
// 잘 안 되고, 오히려 흐린 색 때문에 "잘 안 보인다"는 피드백만 반복됐다 —
// 그래서 농도 계산을 버리고 방향(싸다/비싸다)만 완전 채도의 고정 두 색으로
// 칠한다. 정확한 편차 %는 어차피 라벨 숫자가 보여주니 색은 "어느 쪽인지"만
// 최대한 또렷하게 전달하면 된다. 0%(카테고리 중앙값과 정확히 같음)만 무채색.
const COLOR_ABOVE = "#FF6F0F"; // 브랜드 오렌지 — 카테고리 중앙값보다 비쌈
const COLOR_BELOW = "#3B6FA8"; // 진한 블루 — 카테고리 중앙값보다 저렴
const COLOR_EQUAL = "#F0F1ED";
// 순색 대신 은은한 방사형 그라데이션(동 하나하나가 유리 타일처럼 살짝 광택나게) —
// 색이 나타내는 의미(방향)는 그대로 고정 두 색이고, 그라데이션은 순수 장식이다.
function fillForDev(devPct: number) {
  if (devPct === 0) return COLOR_EQUAL;
  return devPct > 0 ? "url(#guGradAbove)" : "url(#guGradBelow)";
}

const money = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;

// 지도 색은 구 하나당 값이 하나(중위가)라 개별 매물 가격은 안 보인다 — 호버하면
// 그 구의 실제 매물 가격을 점 하나하나로 눈금 위에 찍은 띠(스트립 플롯)를 커서
// 옆에 띄워서 보여준다. 위쪽 "가격 분포" 히스토그램이 이미 불러온 표본을 그대로
// 재사용 — 새 API 호출 없음.
function PriceStrip({ prices }: { prices: number[] }) {
  if (!prices.length) return <p style={{ margin: 0, fontSize: 11, color: "#8b9184" }}>표본 없음</p>;
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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8b9184" }}>
        <span>{money(min)}</span>
        <span>{money(max)}</span>
      </div>
    </div>
  );
}

export function PriceGuMap({ regions, categoryMedianPrice, samples = [] }: { regions: PriceComparisonRegionItem[]; categoryMedianPrice: number; samples?: PriceComparisonSample[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const { width, height, pathGenerator } = useMemo(() => {
    const w = 560;
    const h = 520;
    const fc = { type: "FeatureCollection", features: dongFeatures } as any;
    const projection = geoMercator().fitSize([w, h], fc);
    return { width: w, height: h, pathGenerator: geoPath(projection) };
  }, []);

  const statByGu = useMemo(() => {
    const map = new Map<string, { median_price: number; dev_pct: number; sample_count: number }>();
    regions.forEach(r => {
      const dev = categoryMedianPrice ? ((r.median_price - categoryMedianPrice) / categoryMedianPrice) * 100 : 0;
      map.set(r.gu, { median_price: r.median_price, dev_pct: Math.round(dev * 10) / 10, sample_count: r.sample_count });
    });
    return map;
  }, [regions, categoryMedianPrice]);

  // 라벨은 동마다 찍으면 같은 값이 63번 반복돼 지저분하다 — 구당 하나만,
  // 그 구에 속한 동들 중심점의 평균 위치(폴리곤 정식 합집합은 아니지만 라벨
  // 위치로는 충분)에 띄운다.
  const labelPointByGu = useMemo(() => {
    const sums = new Map<string, { x: number; y: number; n: number }>();
    dongFeatures.forEach(f => {
      const gu = f.properties.gu as string;
      const [cx, cy] = pathGenerator.centroid(f);
      const cur = sums.get(gu) ?? { x: 0, y: 0, n: 0 };
      sums.set(gu, { x: cur.x + cx, y: cur.y + cy, n: cur.n + 1 });
    });
    const points = new Map<string, { x: number; y: number }>();
    sums.forEach((v, gu) => points.set(gu, { x: v.x / v.n, y: v.y / v.n }));
    return points;
  }, [pathGenerator]);

  const pricesByGu = useMemo(() => {
    const map = new Map<string, number[]>();
    samples.forEach(s => map.set(s.gu, [...(map.get(s.gu) ?? []), s.price]));
    return map;
  }, [samples]);

  if (!regions.length) return <EmptyState message="이 카테고리는 지역별 시세 데이터가 없습니다." />;

  return (
    <div
      style={{ position: "relative" }}
      onMouseMove={e => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="420" style={{ maxWidth: "100%", display: "block" }} preserveAspectRatio="xMidYMid meet" role="img" aria-label="구별 가격 시세지도">
        <defs>
          <radialGradient id="guGradAbove" cx="32%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#FFB27A" />
            <stop offset="100%" stopColor={COLOR_ABOVE} />
          </radialGradient>
          <radialGradient id="guGradBelow" cx="32%" cy="28%" r="80%">
            <stop offset="0%" stopColor="#8FB4D9" />
            <stop offset="100%" stopColor={COLOR_BELOW} />
          </radialGradient>
        </defs>
        {dongFeatures.map((f, i) => {
          const rawName = f.properties.name as string;
          const gu = f.properties.gu as string;
          const stat = statByGu.get(gu);
          const isHovered = hover === gu;
          return (
            <g
              key={`${gu}-${rawName}`}
              onMouseEnter={() => setHover(gu)}
              onMouseLeave={() => setHover(null)}
              className={`${styles.guShape} ${isHovered ? styles.guShapeHover : ""}`}
              style={{ animationDelay: `${Math.min(i, 40) * 8}ms` }}
            >
              <path d={pathGenerator(f) ?? undefined} fill={stat ? fillForDev(stat.dev_pct) : "#F0F1ED"} stroke="#fff" strokeWidth={1}>
                <title>
                  {gu}
                  {stat ? ` · 중위가 ${stat.median_price.toLocaleString("ko-KR")}원 · 카테고리 대비 ${stat.dev_pct > 0 ? "+" : ""}${stat.dev_pct}% · 표본 ${stat.sample_count}건` : " · 데이터 없음"}
                </title>
              </path>
            </g>
          );
        })}
        {Array.from(labelPointByGu.entries()).map(([gu, { x, y }]) => {
          const stat = statByGu.get(gu);
          if (!stat) return null;
          // 채도 높은 오렌지 위에 흰 글자만 놓으면 밝기 대비가 약해서(예: FF6F0F
          // 위 흰색은 명도대비 ~2.8:1로 WCAG 기준 미달) 잘 안 읽힌다 — 반투명
          // 헤일로 대신 완전 불투명한 진한 테두리를 둘러서 배경색과 무관하게
          // 항상 또렷하게 만든다.
          const textFill = stat.dev_pct === 0 ? "#1A1C20" : "#fff";
          const haloProps = { paintOrder: "stroke" as const, stroke: textFill === "#fff" ? "#1A1C20" : "#fff", strokeWidth: 3, strokeLinejoin: "round" as const };
          return (
            <g key={`label-${gu}`} style={{ pointerEvents: "none" }}>
              <text x={x} y={y - 6} textAnchor="middle" fontSize={15} fontWeight={800} fill={textFill} {...haloProps}>{gu}</text>
              <text x={x} y={y + 12} textAnchor="middle" fontSize={12} fontWeight={700} fill={textFill} {...haloProps}>
                {money(stat.median_price)} ({stat.dev_pct > 0 ? "+" : ""}{stat.dev_pct}%)
              </text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10, fontSize: 11, color: "#8b9184" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: COLOR_BELOW, display: "inline-block" }} />중앙값보다 저렴</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: COLOR_EQUAL, border: "1px solid #E7E8E5", display: "inline-block" }} />중앙값과 같음</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><i style={{ width: 12, height: 12, borderRadius: 3, background: COLOR_ABOVE, display: "inline-block" }} />중앙값보다 비쌈</span>
      </div>
      {hover && hoverPos && (
        <div
          className={styles.tooltip}
          style={{
            position: "absolute",
            left: hoverPos.x + 14,
            top: hoverPos.y + 14,
            pointerEvents: "none",
            background: "#fff",
            border: "1px solid #E7E8E5",
            borderRadius: 10,
            padding: "10px 12px",
            boxShadow: "0 12px 28px -10px rgba(26,28,32,.35)",
            zIndex: 10,
          }}
        >
          <b style={{ fontSize: 12 }}>{hover}</b>
          <p style={{ margin: "2px 0 6px", fontSize: 11, color: "#8b9184" }}>매물 {(statByGu.get(hover)?.sample_count ?? 0).toLocaleString("ko-KR")}건 · 가격 실측(표본 {(pricesByGu.get(hover) ?? []).length.toLocaleString("ko-KR")}건 표시)</p>
          <PriceStrip prices={pricesByGu.get(hover) ?? []} />
        </div>
      )}
    </div>
  );
}
