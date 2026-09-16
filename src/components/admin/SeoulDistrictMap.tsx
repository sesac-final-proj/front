"use client";

import { useMemo, useState } from "react";
import { geoMercator, geoPath } from "d3-geo";
import seoulGuFeatures from "@/data/seoul-gu.json";

export interface DistrictStat {
  district: string;
  earned: number;
  deducted: number;
  balance: number;
  facilityCount: number;
  earnedShare: number;
  balanceShare: number;
  facilityShare: number;
  isActive: boolean;
}

interface SeoulDistrictMapProps {
  selectedGu: string;
  onSelectGu: (gu: string) => void;
  districtAnalytics: DistrictStat[];
}

// 당근 브랜드 정합성 컬러 스케일 (연한 크림오렌지 -> 진한 당근 오렌지)
function getCarrotColor(share: number, isSelected: boolean, isHovered: boolean) {
  if (isSelected) return "#DF5900"; // 선택 시 진한 당근 다크오렌지
  if (isHovered) return "#FF8A3D"; // 호버 시 밝은 당근 오렌지

  if (share <= 0) return "#FAF7F2"; // 미적립 구 (부드러운 웜그레이/크림)
  if (share < 5) return "#FFE6D3"; // 소폭 적립 (연한 당근 틴트)
  if (share < 15) return "#FFBF91"; // 중위 적립
  if (share < 30) return "#FFA25B"; // 상위 적립
  return "#FF6F0F"; // 최상위 적립 (당근 대표 오렌지)
}

export default function SeoulDistrictMap({
  selectedGu,
  onSelectGu,
  districtAnalytics,
}: SeoulDistrictMapProps) {
  const [hoveredGu, setHoveredGu] = useState<string | null>(null);

  const features = useMemo(() => (seoulGuFeatures as any).features as any[], []);

  // Map analytics by district name
  const analyticsMap = useMemo(() => {
    const map = new Map<string, DistrictStat>();
    districtAnalytics.forEach((item) => map.set(item.district, item));
    return map;
  }, [districtAnalytics]);

  // D3 Projection for Seoul
  const { width, height, pathGenerator } = useMemo(() => {
    const w = 480;
    const h = 400;
    const fc = { type: "FeatureCollection", features } as any;
    const projection = geoMercator().fitSize([w, h], fc);
    return { width: w, height: h, pathGenerator: geoPath(projection) };
  }, [features]);

  // Sort features so hovered and selected appear on top of rendering stack
  const orderedFeatures = useMemo(() => {
    return [...features].sort((a, b) => {
      const nameA = a.properties.name;
      const nameB = b.properties.name;
      if (nameA === selectedGu || nameA === hoveredGu) return 1;
      if (nameB === selectedGu || nameB === hoveredGu) return -1;
      return 0;
    });
  }, [features, selectedGu, hoveredGu]);

  return (
    <div style={{ position: "relative", width: "100%", userSelect: "none" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        style={{ overflow: "visible", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.06))" }}
        role="img"
        aria-label="서울시 25개 자치구 꿈가지 동적 지도"
      >
        <defs>
          <filter id="guShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#DF5900" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 25개 자치구 구역 패스 */}
        {orderedFeatures.map((f) => {
          const guName = f.properties.name as string;
          const stat = analyticsMap.get(guName);
          const share = stat ? stat.earnedShare : 0;
          const isSelected = selectedGu === guName;
          const isHovered = hoveredGu === guName;
          const pathData = pathGenerator(f);

          return (
            <g
              key={guName}
              role="button"
              tabIndex={0}
              aria-label={`${guName} 꿈가지 점유율 ${share.toFixed(1)}%`}
              aria-pressed={isSelected}
              onClick={() => onSelectGu(guName)}
              onMouseEnter={() => setHoveredGu(guName)}
              onMouseLeave={() => setHoveredGu(null)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") onSelectGu(guName);
              }}
              style={{
                cursor: "pointer",
                outline: "none",
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: isSelected ? "scale(1.035)" : isHovered ? "scale(1.02)" : "scale(1)",
                transition: "transform 0.15s ease-out, filter 0.15s ease-out",
                filter: isSelected ? "url(#guShadow)" : "none",
              }}
            >
              <path
                d={pathData ?? undefined}
                fill={getCarrotColor(share, isSelected, isHovered)}
                stroke={isSelected ? "#DF5900" : isHovered ? "#FF6F0F" : "#E2DDD5"}
                strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 1}
                strokeLinejoin="round"
              >
                <title>{`${guName} · 꿈가지 점유율 ${share.toFixed(1)}% (${stat?.earned.toLocaleString()} P) · 클릭하여 상세 보기`}</title>
              </path>
            </g>
          );
        })}

        {/* 자치구명 및 점유율 라벨 텍스트 패스 (모든 도형 상단에 렌더링) */}
        {features.map((f) => {
          const guName = f.properties.name as string;
          const stat = analyticsMap.get(guName);
          const share = stat ? stat.earnedShare : 0;
          const isSelected = selectedGu === guName;
          const isHovered = hoveredGu === guName;
          const [cx, cy] = pathGenerator.centroid(f);

          const isDarkBg = isSelected || (share >= 15 && !isHovered);
          const textColor = isDarkBg ? "#FFFFFF" : "#2E332B";
          const subColor = isDarkBg ? "#FFE6D3" : "#757B70";
          const haloColor = isDarkBg ? "#B34700" : "#FFFFFF";

          return (
            <g
              key={`label-${guName}`}
              style={{ pointerEvents: "none", transition: "all 0.15s ease" }}
            >
              {/* 구 이름 */}
              <text
                x={cx}
                y={share > 0 ? cy - 3 : cy + 1}
                textAnchor="middle"
                fontSize={isSelected ? 11 : 9.5}
                fontWeight={isSelected || isHovered ? 800 : 700}
                fill={textColor}
                paintOrder="stroke"
                stroke={haloColor}
                strokeWidth={2}
                strokeLinejoin="round"
              >
                {guName}
              </text>

              {/* 점유율 % (적립 실적이 있는 구이거나 선택된 경우) */}
              {share > 0 && (
                <text
                  x={cx}
                  y={cy + 9}
                  textAnchor="middle"
                  fontSize={8.5}
                  fontWeight={750}
                  fontFamily="ui-monospace, monospace"
                  fill={isDarkBg ? "#FFF4ED" : "#DF5900"}
                  paintOrder="stroke"
                  stroke={haloColor}
                  strokeWidth={1.8}
                  strokeLinejoin="round"
                >
                  {share.toFixed(1)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* 지도 하단 당근 정합성 범례 (Legend) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "10px",
          padding: "8px 12px",
          background: "#FAF9F5",
          borderRadius: "8px",
          border: "1px solid #EAE7E0",
          fontSize: "10px",
          color: "#656B60",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <span style={{ fontWeight: 600 }}>꿈가지 점유율:</span>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#FAF7F2", border: "1px solid #DDD" }} />
          <span>0%</span>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#FFE6D3" }} />
          <span>~5%</span>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#FFA25B" }} />
          <span>~30%</span>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#FF6F0F" }} />
          <span>30%+</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "2px", background: "#DF5900" }} />
          <strong style={{ color: "#DF5900" }}>선택: {selectedGu}</strong>
        </div>
      </div>
    </div>
  );
}
