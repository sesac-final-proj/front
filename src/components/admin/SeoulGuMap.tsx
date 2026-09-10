"use client";
import { useEffect, useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import seoulDong from "@/data/seoul-dong.json";

type RegionCount = { region_name: string; transaction_count: number };

// 지금 수집 지역이 이 3개 구뿐이라 탭도 이 3개만 — 구가 늘면 이 목록만 늘리면 됨.
const GU_LIST = ["영등포구", "노원구", "송파구"] as const;
const dongFeatures = (seoulDong as any).features as any[];

// 별도 색상 스케일 라이브러리 없이 연한 주황 -> 브랜드 오렌지로 RGB 선형보간.
function colorFor(ratio: number) {
  const from = [255, 243, 232];
  const to = [255, 111, 15];
  const rgb = from.map((c, i) => Math.round(c + (to[i] - c) * ratio));
  return `rgb(${rgb.join(",")})`;
}

// 크롤링 데이터의 "양평제1동" 표기와 2013년 행정동 경계 데이터의 "양평1동" 표기가
// "제" 유무로 갈려서, 매칭 전에 "제"를 지워 맞춘다. TradesSection이 category_counts_by_region을
// (구 동) 원본 표기 그대로 받으니, 이 동 이름으로 거를 때도 같은 정규화를 거쳐야 한다.
export const normalizeDong = (name: string) => name.replace(/제/g, "");

function GuDongMap({
  gu,
  regionCounts,
  selectedDong,
  onSelectDong,
}: {
  gu: string;
  regionCounts: RegionCount[];
  selectedDong: string | null;
  onSelectDong: (rawName: string | null) => void;
}) {
  const features = useMemo(() => dongFeatures.filter(f => f.properties.gu === gu), [gu]);
  const { width, height, pathGenerator } = useMemo(() => {
    const w = 420;
    const h = 420;
    const fc = { type: "FeatureCollection", features } as any;
    const projection = geoMercator().fitSize([w, h], fc);
    return { width: w, height: h, pathGenerator: geoPath(projection) };
  }, [features]);

  const countsByDong = useMemo(() => {
    const map = new Map<string, number>();
    regionCounts.forEach(row => {
      const [rowGu, ...rest] = row.region_name.split(" ");
      if (rowGu !== gu || !rest.length) return;
      const name = normalizeDong(rest.join(" "));
      map.set(name, (map.get(name) ?? 0) + row.transaction_count);
    });
    return map;
  }, [regionCounts, gu]);

  const matchedNames = new Set(features.map(f => normalizeDong(f.properties.name as string)));
  const unmatched = Array.from(countsByDong.entries()).filter(([name]) => !matchedNames.has(name));
  const maxCount = Math.max(1, ...countsByDong.values());
  const [hover, setHover] = useState<string | null>(null);

  // hover된 동을 맨 뒤로 옮겨서 그려야 튀어나온 모양이 이웃 동에 안 가린다(SVG는 z-index 대신 그리는 순서로 겹침 결정).
  const orderedFeatures = hover ? [...features.filter(f => f.properties.name !== hover), ...features.filter(f => f.properties.name === hover)] : features;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label={`${gu} 동별 거래 분포 지도`}>
        {/* 도형과 라벨을 두 패스로 나눠 그린다 — 한 <g>에 같이 넣으면 인접 동 도형이
            나중에 그려질 때 이전 동의 라벨을 덮어버려서(작은 동일수록 라벨이 이웃
            도형 경계 쪽으로 삐져나옴) 이름이 잘려 보였다. 라벨을 전부 맨 위 패스로
            분리하면 어떤 도형 순서든 항상 라벨이 위에 그려진다. */}
        {orderedFeatures.map(f => {
          const rawName = f.properties.name as string;
          const count = countsByDong.get(normalizeDong(rawName)) ?? 0;
          const ratio = count / maxCount;
          const isHovered = hover === rawName;
          const isSelected = selectedDong === rawName;
          return (
            <g
              key={rawName}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onMouseEnter={() => setHover(rawName)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectDong(isSelected ? null : rawName)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectDong(isSelected ? null : rawName);
              }}
              style={{
                cursor: "pointer",
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: isHovered || isSelected ? "scale(1.06)" : "scale(1)",
                transition: "transform 50ms ease-out",
                filter: isHovered || isSelected ? "drop-shadow(0 6px 10px rgba(26, 28, 32, 0.35))" : "none",
              }}
            >
              <path
                d={pathGenerator(f) ?? undefined}
                fill={count ? colorFor(ratio) : "#F0F1ED"}
                stroke={isSelected ? "#42483b" : "#fff"}
                strokeWidth={isSelected ? 2.2 : 1}
              >
                <title>{rawName} · {count.toLocaleString("ko-KR")}건 · 클릭해서 선택</title>
              </path>
            </g>
          );
        })}
        {features.map(f => {
          const rawName = f.properties.name as string;
          const count = countsByDong.get(normalizeDong(rawName)) ?? 0;
          const [cx, cy] = pathGenerator.centroid(f);
          const ratio = count / maxCount;

          // 작은 동은 이름+건수 두 줄이 옆 동까지 넘쳐서 안 보이는 게 아니라 오히려 더 헷갈렸다 —
          // 도형이 충분히 클 때만 라벨을 그리고, 작은 동은 hover 시 title 툴팁으로만 보여준다.
          const [[x0, y0], [x1, y1]] = pathGenerator.bounds(f);
          const showLabel = (x1 - x0) >= 46 && (y1 - y0) >= 30;
          const textFill = ratio > 0.55 ? "#fff" : "#1A1C20";
          // 흰 배경엔 검정 halo, 진한 주황 배경엔 흰 halo — 배경이 뭐든 글자 테두리가 반대색이라 묻히지 않음.
          // 3px는 9px 글자에 너무 두꺼워서 뭉개졌던 것 — 1.4px로 줄임.
          const haloProps = { paintOrder: "stroke" as const, stroke: textFill === "#fff" ? "#c9500a" : "#fff", strokeWidth: 1.4, strokeLinejoin: "round" as const };
          if (!showLabel) return null;
          return (
            <g key={`label-${rawName}`} style={{ pointerEvents: "none" }}>
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize={9} fill={textFill} {...haloProps}>
                {rawName}
              </text>
              <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fontWeight={700} fill={textFill} {...haloProps}>
                {count.toLocaleString("ko-KR")}
              </text>
            </g>
          );
        })}
      </svg>
      {unmatched.length > 0 && (
        <p style={{ fontSize: 11, color: "#91968c", marginTop: 8, lineHeight: 1.6 }}>
          지도 경계(2013년 기준)에 없는 동 — 최근 행정동 개편으로 빠짐: {unmatched.map(([name, count]) => `${name} ${count.toLocaleString("ko-KR")}건`).join(" · ")}
        </p>
      )}
    </div>
  );
}

export function SeoulGuMap({
  regionCounts,
  onChangeGu,
  onChangeDong,
}: {
  regionCounts: RegionCount[];
  onChangeGu?: (gu: string) => void;
  // 동을 클릭해 선택/해제할 때마다 알려준다 — dongName은 normalizeDong을 거친 값(선택 해제면 null).
  onChangeDong?: (gu: string, dongName: string | null) => void;
}) {
  const totalsByGu = useMemo(() => {
    const map = new Map<string, number>();
    regionCounts.forEach(row => {
      const gu = row.region_name.split(" ")[0];
      if (!GU_LIST.includes(gu as (typeof GU_LIST)[number])) return;
      map.set(gu, (map.get(gu) ?? 0) + row.transaction_count);
    });
    return map;
  }, [regionCounts]);
  const availableGu = GU_LIST.filter(gu => totalsByGu.has(gu));
  const [activeGu, setActiveGu] = useState<string>(availableGu[0] ?? GU_LIST[0]);
  const [selectedDong, setSelectedDong] = useState<string | null>(null);

  // 부모(TradesSection)가 "카테고리 구성" 패널을 이 탭 선택에 맞춰 바꿔야 해서 알려준다 —
  // 최초 렌더(기본 선택된 구)도 놓치지 않게 마운트 시 한 번 포함.
  useEffect(() => {
    onChangeGu?.(activeGu);
  }, [activeGu, onChangeGu]);

  useEffect(() => {
    onChangeDong?.(activeGu, selectedDong ? normalizeDong(selectedDong) : null);
  }, [activeGu, selectedDong, onChangeDong]);

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {GU_LIST.map(gu => (
          <button
            key={gu}
            type="button"
            onClick={() => {
              setActiveGu(gu);
              setSelectedDong(null); // 다른 구로 넘어가면 이전 구에서 고른 동은 의미 없어짐
            }}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 550,
              border: "1px solid #E7E8E5",
              background: activeGu === gu ? "#FF6F0F" : "#fff",
              color: activeGu === gu ? "#fff" : "#656b60",
            }}
          >
            {gu} {(totalsByGu.get(gu) ?? 0).toLocaleString("ko-KR")}건
          </button>
        ))}
      </div>
      <GuDongMap gu={activeGu} regionCounts={regionCounts} selectedDong={selectedDong} onSelectDong={setSelectedDong} />
      {selectedDong && (
        <p style={{ fontSize: 11, color: "#656b60", marginTop: 8 }}>
          <b style={{ color: "#303629" }}>{selectedDong}</b> 선택됨 · 다시 클릭하면 해제
        </p>
      )}
    </div>
  );
}
