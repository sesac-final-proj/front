export type CongestionLevel = "low" | "moderate" | "high" | "severe";

export interface CongestionZone {
  id: string;
  name: string;
  neighborhoodName: string;
  districtName: string;
  lat: number;
  lng: number;
  distance: string;
  currentScore: number; // 0 ~ 100%
  baselineScore: number;
  level: CongestionLevel;
  summary: string;
  updatedAt: string;
  source: string;
  hourlyTrends?: number[];
  recommendation?: string;
}

/**
 * SEED Design System (Karrot) Scale Tokens 기반 %당 파스텔 컬러보드
 * https://seed-design.io 참조
 * - Green (0~25%): 쾌적 (Pastel Mint)
 * - Sky/Blue (26~50%): 여유 (Pastel Blue)
 * - Amber/Yellow (51~70%): 보통 (Pastel Yellow)
 * - Carrot (71~85%): 혼잡 (Pastel Orange)
 * - Rose/Red (86~100%): 매우 혼잡 (Pastel Rose)
 */
export interface SeedPastelTheme {
  level: CongestionLevel;
  rangeLabel: string;
  minScore: number;
  maxScore: number;
  // 히트맵 방사형 그라디언트 (SVG/Canvas용)
  heatmapInner: string;
  heatmapMid: string;
  heatmapOuter: string;
  glowShadow: string;
  // UI 뱃지 및 카드 색상
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  meterGradient: string;
  cardBg: string;
  label: string;
  tagColor: string;
  description: string;
}

export const SEED_PASTEL_COLOR_BOARD: SeedPastelTheme[] = [
  {
    level: "low",
    rangeLabel: "0~25%",
    minScore: 0,
    maxScore: 25,
    heatmapInner: "rgba(50, 213, 131, 0.48)",
    heatmapMid: "rgba(166, 244, 197, 0.24)",
    heatmapOuter: "rgba(232, 248, 240, 0.0)",
    glowShadow: "0 0 28px rgba(50, 213, 131, 0.38)",
    badgeBg: "#ECFDF3",
    badgeBorder: "#A6F4C5",
    badgeText: "#027A48",
    meterGradient: "linear-gradient(90deg, #A6F4C5 0%, #32D583 100%)",
    cardBg: "rgba(50, 213, 131, 0.06)",
    label: "쾌적",
    tagColor: "#12B76A",
    description: "인파가 적어 쾌적하게 이용할 수 있어요",
  },
  {
    level: "low",
    rangeLabel: "26~50%",
    minScore: 26,
    maxScore: 50,
    heatmapInner: "rgba(56, 189, 248, 0.48)",
    heatmapMid: "rgba(186, 230, 253, 0.24)",
    heatmapOuter: "rgba(240, 249, 255, 0.0)",
    glowShadow: "0 0 28px rgba(56, 189, 248, 0.38)",
    badgeBg: "#F0F9FF",
    badgeBorder: "#BAE6FD",
    badgeText: "#0284C7",
    meterGradient: "linear-gradient(90deg, #BAE6FD 0%, #38BDF8 100%)",
    cardBg: "rgba(56, 189, 248, 0.06)",
    label: "여유",
    tagColor: "#0284C7",
    description: "좌석 및 통로에 여유가 있어요",
  },
  {
    level: "moderate",
    rangeLabel: "51~70%",
    minScore: 51,
    maxScore: 70,
    heatmapInner: "rgba(251, 191, 36, 0.52)",
    heatmapMid: "rgba(254, 243, 199, 0.26)",
    heatmapOuter: "rgba(255, 251, 235, 0.0)",
    glowShadow: "0 0 30px rgba(251, 191, 36, 0.42)",
    badgeBg: "#FFFBEB",
    badgeBorder: "#FDE68A",
    badgeText: "#B45309",
    meterGradient: "linear-gradient(90deg, #FDE68A 0%, #FBBF24 100%)",
    cardBg: "rgba(251, 191, 36, 0.06)",
    label: "보통",
    tagColor: "#D97706",
    description: "방문객이 꾸준하며 원활하게 이동할 수 있어요",
  },
  {
    level: "high",
    rangeLabel: "71~85%",
    minScore: 71,
    maxScore: 85,
    heatmapInner: "rgba(255, 138, 76, 0.56)",
    heatmapMid: "rgba(254, 215, 170, 0.28)",
    heatmapOuter: "rgba(255, 247, 237, 0.0)",
    glowShadow: "0 0 34px rgba(255, 138, 76, 0.48)",
    badgeBg: "#FFF7ED",
    badgeBorder: "#FED7AA",
    badgeText: "#C2410C",
    meterGradient: "linear-gradient(90deg, #FED7AA 0%, #FB923C 100%)",
    cardBg: "rgba(255, 138, 76, 0.07)",
    label: "혼잡",
    tagColor: "#EA580C",
    description: "유동 인구가 많아 대기가 발생할 수 있어요",
  },
  {
    level: "severe",
    rangeLabel: "86~100%",
    minScore: 86,
    maxScore: 100,
    heatmapInner: "rgba(251, 113, 133, 0.62)",
    heatmapMid: "rgba(254, 205, 211, 0.32)",
    heatmapOuter: "rgba(255, 241, 242, 0.0)",
    glowShadow: "0 0 38px rgba(251, 113, 133, 0.54)",
    badgeBg: "#FFF1F2",
    badgeBorder: "#FECDD3",
    badgeText: "#BE123C",
    meterGradient: "linear-gradient(90deg, #FECDD3 0%, #FB7185 100%)",
    cardBg: "rgba(251, 113, 133, 0.08)",
    label: "매우 혼잡",
    tagColor: "#E11D48",
    description: "인파가 매우 밀집되어 대기 시간이 길어요",
  },
];

export function getSeedPastelTheme(score: number): SeedPastelTheme {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  if (clamped <= 25) return SEED_PASTEL_COLOR_BOARD[0];
  if (clamped <= 50) return SEED_PASTEL_COLOR_BOARD[1];
  if (clamped <= 70) return SEED_PASTEL_COLOR_BOARD[2];
  if (clamped <= 85) return SEED_PASTEL_COLOR_BOARD[3];
  return SEED_PASTEL_COLOR_BOARD[4];
}

const CONGESTION_ZONES: CongestionZone[] = [
  {
    id: "congestion-songpa-lake",
    name: "석촌호수 동호 산책로",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5081,
    lng: 127.1127,
    distance: "620m",
    currentScore: 91,
    baselineScore: 64,
    level: "severe",
    summary: "산책 인파와 카페 대기열이 겹쳐 이동이 느린 편이에요.",
    updatedAt: "방금 갱신",
    source: "kakao_map_ready",
    hourlyTrends: [32, 28, 45, 62, 75, 88, 91, 84, 60],
    recommendation: "호수 서호 방면으로 우회하시면 한산하게 산책하실 수 있어요.",
  },
  {
    id: "congestion-songpa-station",
    name: "송파나루역 2번 출구",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5103,
    lng: 127.1121,
    distance: "780m",
    currentScore: 78,
    baselineScore: 58,
    level: "high",
    summary: "퇴근길 유동 인구가 늘어 매장 입장 대기가 생길 수 있어요.",
    updatedAt: "3분 전",
    source: "kakao_map_ready",
    hourlyTrends: [25, 30, 42, 58, 82, 78, 65, 48, 35],
    recommendation: "1번 출구 지하 연결통로를 이용하시면 쾌적하게 이동 가능해요.",
  },
  {
    id: "congestion-songpa-market",
    name: "래미안 상가 앞",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5049,
    lng: 127.1185,
    distance: "90m",
    currentScore: 56,
    baselineScore: 51,
    level: "moderate",
    summary: "동네 장보기와 픽업 주문이 꾸준하지만 이동은 가능한 수준이에요.",
    updatedAt: "5분 전",
    source: "kakao_map_ready",
    hourlyTrends: [20, 35, 48, 56, 52, 58, 54, 40, 25],
    recommendation: "포장 주문 시 5~10분 내 픽업이 원활한 시간대예요.",
  },
  {
    id: "congestion-songpa-park",
    name: "송파 송이골 공원",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5018,
    lng: 127.1232,
    distance: "340m",
    currentScore: 22,
    baselineScore: 30,
    level: "low",
    summary: "산책로와 벤치가 여유로워 쾌적하게 쉴 수 있어요.",
    updatedAt: "10분 전",
    source: "kakao_map_ready",
    hourlyTrends: [15, 18, 22, 28, 25, 20, 18, 15, 10],
    recommendation: "조용한 휴식이나 반려견 산책에 최적의 상태예요.",
  },
  {
    id: "congestion-wirye-square",
    name: "위례중앙광장",
    neighborhoodName: "위례",
    districtName: "송파구",
    lat: 37.4777,
    lng: 127.1441,
    distance: "420m",
    currentScore: 83,
    baselineScore: 62,
    level: "high",
    summary: "식당가와 버스 승하차 동선이 겹쳐 체감 혼잡이 높아요.",
    updatedAt: "2분 전",
    source: "kakao_map_ready",
    hourlyTrends: [30, 40, 55, 70, 85, 83, 72, 50, 35],
    recommendation: "광장 외곽 보행로를 이용하시면 쾌적하게 이동하실 수 있어요.",
  },
  {
    id: "congestion-wirye-cafe",
    name: "위례 카페거리",
    neighborhoodName: "위례",
    districtName: "송파구",
    lat: 37.4768,
    lng: 127.1419,
    distance: "610m",
    currentScore: 48,
    baselineScore: 52,
    level: "moderate",
    summary: "좌석 여유가 조금 남아 있고 포장 주문은 빠른 편이에요.",
    updatedAt: "6분 전",
    source: "kakao_map_ready",
    hourlyTrends: [18, 32, 45, 52, 48, 50, 42, 30, 20],
    recommendation: "안쪽 골목 카페들은 한산하게 머무르기 좋아요.",
  },
  {
    id: "congestion-gongneung-station",
    name: "공릉역 1번 출구",
    neighborhoodName: "공릉",
    districtName: "노원구",
    lat: 37.6258,
    lng: 127.0732,
    distance: "120m",
    currentScore: 74,
    baselineScore: 57,
    level: "high",
    summary: "지하철 출구와 먹자골목 진입 동선이 몰리는 시간대예요.",
    updatedAt: "4분 전",
    source: "kakao_map_ready",
    hourlyTrends: [28, 35, 50, 68, 80, 74, 60, 45, 30],
    recommendation: "경춘선 숲길 방향으로 우회하시면 혼잡을 피할 수 있어요.",
  },
  {
    id: "congestion-gongneung-campus",
    name: "서울과기대 정문",
    neighborhoodName: "공릉",
    districtName: "노원구",
    lat: 37.6291,
    lng: 127.0772,
    distance: "540m",
    currentScore: 39,
    baselineScore: 46,
    level: "low",
    summary: "강의 이동 시간이 지나 비교적 여유로운 상태예요.",
    updatedAt: "7분 전",
    source: "kakao_map_ready",
    hourlyTrends: [45, 60, 72, 55, 39, 42, 35, 25, 15],
    recommendation: "교내 산책로나 카페 이용이 매우 여유로워요.",
  },
  {
    id: "congestion-dangsan-station",
    name: "당산역 환승통로",
    neighborhoodName: "당산 2동",
    districtName: "영등포구",
    lat: 37.5348,
    lng: 126.9028,
    distance: "210m",
    currentScore: 88,
    baselineScore: 63,
    level: "severe",
    summary: "환승 인파가 많아 식당 방문 전 대기 시간을 확인하는 게 좋아요.",
    updatedAt: "1분 전",
    source: "kakao_map_ready",
    hourlyTrends: [35, 45, 65, 82, 92, 88, 75, 55, 38],
    recommendation: "지상 환승 경로를 이용하시면 이동 속도가 훨씬 빨라요.",
  },
  {
    id: "congestion-dangsan-park",
    name: "선유도공원 입구",
    neighborhoodName: "당산 2동",
    districtName: "영등포구",
    lat: 37.5372,
    lng: 126.9003,
    distance: "480m",
    currentScore: 34,
    baselineScore: 45,
    level: "low",
    summary: "산책 인파가 적어 주변 카페도 비교적 한산해요.",
    updatedAt: "8분 전",
    source: "kakao_map_ready",
    hourlyTrends: [15, 22, 34, 40, 36, 34, 28, 20, 12],
    recommendation: "전망대 방면 벤치에서 여유롭게 휴식할 수 있어요.",
  },
];

export function getCongestionLevelLabel(level: CongestionLevel): string {
  switch (level) {
    case "low":
      return "여유";
    case "moderate":
      return "보통";
    case "high":
      return "혼잡";
    case "severe":
      return "매우 혼잡";
  }
}

export function getCongestionLevelFromScore(score: number): CongestionLevel {
  const theme = getSeedPastelTheme(score);
  return theme.level;
}

export function getCongestionDelta(zone: Pick<CongestionZone, "currentScore" | "baselineScore">): number {
  return zone.currentScore - zone.baselineScore;
}

export function getCongestionZonesForNeighborhood(
  activeNeighborhood: string,
  secondaryNeighborhood?: string,
): CongestionZone[] {
  const neighborhoods = new Set([activeNeighborhood, secondaryNeighborhood].filter(Boolean));
  return CONGESTION_ZONES.filter((zone) => neighborhoods.has(zone.neighborhoodName));
}

export function summarizeCongestion(zones: CongestionZone[]) {
  const averageScore = zones.length
    ? Math.round(zones.reduce((sum, zone) => sum + zone.currentScore, 0) / zones.length)
    : 0;
  const peakZone = zones.reduce<CongestionZone | null>(
    (peak, zone) => (!peak || zone.currentScore > peak.currentScore ? zone : peak),
    null,
  );
  const crowdedCount = zones.filter((zone) => zone.currentScore >= 71).length;

  return {
    averageScore,
    averageLevel: getCongestionLevelFromScore(averageScore),
    averageTheme: getSeedPastelTheme(averageScore),
    peakZone,
    crowdedCount,
  };
}
