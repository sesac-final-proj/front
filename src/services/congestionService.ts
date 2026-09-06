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
  baselineScore?: number;
  levelLabel?: string;
  populationMin?: number;
  populationMax?: number;
  level: CongestionLevel;
  summary: string;
  updatedAt: string;
  source: 
  string;
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
  // 히트맵 방사형 그라디언트 (다크모드용)
  heatmapInnerDark: string;
  heatmapMidDark: string;
  heatmapOuterDark: string;
  // 히트맵 방사형 그라디언트 (라이트/일반모드용 - 밝은 타일에서 뚜렷하게 발색)
  heatmapInnerLight: string;
  heatmapMidLight: string;
  heatmapOuterLight: string;
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
    heatmapInnerDark: "rgba(50, 213, 131, 0.48)",
    heatmapMidDark: "rgba(166, 244, 197, 0.24)",
    heatmapOuterDark: "rgba(232, 248, 240, 0.0)",
    heatmapInnerLight: "rgba(18, 183, 106, 0.65)",
    heatmapMidLight: "rgba(50, 213, 131, 0.35)",
    heatmapOuterLight: "rgba(166, 244, 197, 0.0)",
    glowShadow: "0 0 28px rgba(50, 213, 131, 0.40)",
    badgeBg: "#ECFDF3",
    badgeBorder: "#A6F4C5",
    badgeText: "#027A48",
    meterGradient: "linear-gradient(90deg, #A6F4C5 0%, #32D583 100%)",
    cardBg: "rgba(50, 213, 131, 0.08)",
    label: "쾌적",
    tagColor: "#12B76A",
    description: "인파가 적어 쾌적하게 이용할 수 있어요",
  },
  {
    level: "low",
    rangeLabel: "26~50%",
    minScore: 26,
    maxScore: 50,
    heatmapInnerDark: "rgba(56, 189, 248, 0.48)",
    heatmapMidDark: "rgba(186, 230, 253, 0.24)",
    heatmapOuterDark: "rgba(240, 249, 255, 0.0)",
    heatmapInnerLight: "rgba(2, 132, 199, 0.65)",
    heatmapMidLight: "rgba(56, 189, 248, 0.35)",
    heatmapOuterLight: "rgba(186, 230, 253, 0.0)",
    glowShadow: "0 0 28px rgba(56, 189, 248, 0.40)",
    badgeBg: "#F0F9FF",
    badgeBorder: "#BAE6FD",
    badgeText: "#0284C7",
    meterGradient: "linear-gradient(90deg, #BAE6FD 0%, #38BDF8 100%)",
    cardBg: "rgba(56, 189, 248, 0.08)",
    label: "여유",
    tagColor: "#0284C7",
    description: "좌석 및 통로에 여유가 있어요",
  },
  {
    level: "moderate",
    rangeLabel: "51~70%",
    minScore: 51,
    maxScore: 70,
    heatmapInnerDark: "rgba(251, 191, 36, 0.52)",
    heatmapMidDark: "rgba(254, 243, 199, 0.26)",
    heatmapOuterDark: "rgba(255, 251, 235, 0.0)",
    heatmapInnerLight: "rgba(217, 119, 6, 0.68)",
    heatmapMidLight: "rgba(251, 191, 36, 0.38)",
    heatmapOuterLight: "rgba(254, 243, 199, 0.0)",
    glowShadow: "0 0 30px rgba(251, 191, 36, 0.45)",
    badgeBg: "#FFFBEB",
    badgeBorder: "#FDE68A",
    badgeText: "#B45309",
    meterGradient: "linear-gradient(90deg, #FDE68A 0%, #FBBF24 100%)",
    cardBg: "rgba(251, 191, 36, 0.08)",
    label: "보통",
    tagColor: "#D97706",
    description: "방문객이 꾸준하며 원활하게 이동할 수 있어요",
  },
  {
    level: "high",
    rangeLabel: "71~85%",
    minScore: 71,
    maxScore: 85,
    heatmapInnerDark: "rgba(255, 138, 76, 0.56)",
    heatmapMidDark: "rgba(254, 215, 170, 0.28)",
    heatmapOuterDark: "rgba(255, 247, 237, 0.0)",
    heatmapInnerLight: "rgba(234, 88, 12, 0.72)",
    heatmapMidLight: "rgba(255, 138, 76, 0.42)",
    heatmapOuterLight: "rgba(254, 215, 170, 0.0)",
    glowShadow: "0 0 34px rgba(255, 138, 76, 0.50)",
    badgeBg: "#FFF7ED",
    badgeBorder: "#FED7AA",
    badgeText: "#C2410C",
    meterGradient: "linear-gradient(90deg, #FED7AA 0%, #FB923C 100%)",
    cardBg: "rgba(255, 138, 76, 0.09)",
    label: "혼잡",
    tagColor: "#EA580C",
    description: "유동 인구가 많아 대기가 발생할 수 있어요",
  },
  {
    level: "severe",
    rangeLabel: "86~100%",
    minScore: 86,
    maxScore: 100,
    heatmapInnerDark: "rgba(251, 113, 133, 0.62)",
    heatmapMidDark: "rgba(254, 205, 211, 0.32)",
    heatmapOuterDark: "rgba(255, 241, 242, 0.0)",
    heatmapInnerLight: "rgba(225, 29, 72, 0.75)",
    heatmapMidLight: "rgba(251, 113, 133, 0.45)",
    heatmapOuterLight: "rgba(254, 205, 211, 0.0)",
    glowShadow: "0 0 38px rgba(251, 113, 133, 0.58)",
    badgeBg: "#FFF1F2",
    badgeBorder: "#FECDD3",
    badgeText: "#BE123C",
    meterGradient: "linear-gradient(90deg, #FECDD3 0%, #FB7185 100%)",
    cardBg: "rgba(251, 113, 133, 0.10)",
    label: "매우 혼잡",
    tagColor: "#E11D48",
    description: "인파가 매우 밀집되어 대기 시간이 길어요",
  },
];

// App-specific role colors inspired by SEED; these are not official SEED palette tokens.
const DARK_CONGESTION_COLORS = [
  { bg: "#1C3029", line: "#365A49", fg: "#8BC9AA" },
  { bg: "#202D3A", line: "#3C536B", fg: "#9ABDE0" },
  { bg: "#332D20", line: "#605337", fg: "#D7BF87" },
  { bg: "#37291F", line: "#674A34", fg: "#E0AE85" },
  { bg: "#362429", line: "#68414A", fg: "#DEA0AB" },
];

export function getSeedPastelTheme(
  score: number,
  colorScheme: "dark" | "light" = "light",
): SeedPastelTheme {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const index = clamped <= 25 ? 0 : clamped <= 50 ? 1 : clamped <= 70 ? 2 : clamped <= 85 ? 3 : 4;
  const theme = SEED_PASTEL_COLOR_BOARD[index];
  if (colorScheme === "light") return theme;
  const colors = DARK_CONGESTION_COLORS[index];
  return {
    ...theme,
    badgeBg: colors.bg,
    badgeBorder: colors.line,
    badgeText: colors.fg,
    tagColor: colors.fg,
    meterGradient: colors.fg,
    cardBg: "var(--color-surface)",
    glowShadow: "none",
  };
}

export const CONGESTION_ZONES: CongestionZone[] = [
  // 1. 송파구 / 잠실 핵심 핫스팟 (지도 화면 전역 커버)
  {
    id: "congestion-jamsil-station",
    name: "잠실역 · 롯데월드몰",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5133,
    lng: 127.1001,
    distance: "320m",
    currentScore: 89,
    baselineScore: 68,
    level: "severe",
    summary: "지하철 환승 인파와 쇼핑몰 매장 대기열이 매우 길어요.",
    updatedAt: "방금 갱신",
    source: "kakao_map_ready",
    hourlyTrends: [38, 48, 65, 82, 94, 89, 78, 60, 42],
    recommendation: "지하상가 외곽 통로나 8호선 연결통로를 이용하시면 훨씬 수월해요.",
  },
  {
    id: "congestion-bangi-food",
    name: "방이동 먹자골목",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5140,
    lng: 127.1120,
    distance: "280m",
    currentScore: 76,
    baselineScore: 58,
    level: "high",
    summary: "저녁 외식 인파가 집중되어 골목 진입 보행자가 많아요.",
    updatedAt: "2분 전",
    source: "kakao_map_ready",
    hourlyTrends: [22, 30, 45, 68, 85, 76, 68, 50, 32],
    recommendation: "방이삼거리 방면 도로변 식당들은 비교적 대기가 적어요.",
  },
  {
    id: "congestion-songpa-lake",
    name: "석촌호수 동호 산책로",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5085,
    lng: 127.1065,
    distance: "550m",
    currentScore: 91,
    baselineScore: 64,
    level: "severe",
    summary: "호수 둘레길 산책객과 카페 테라스 대기열이 겹쳐 붐벼요.",
    updatedAt: "방금 갱신",
    source: "kakao_map_ready",
    hourlyTrends: [32, 28, 45, 62, 75, 88, 91, 84, 60],
    recommendation: "호수 서호 방면으로 우회하시면 여유롭게 산책하실 수 있어요.",
  },
  {
    id: "congestion-songpa-office",
    name: "송파구청 사거리",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5145,
    lng: 127.1060,
    distance: "210m",
    currentScore: 65,
    baselineScore: 55,
    level: "moderate",
    summary: "횡단보도 신호 대기 인파가 꾸준하지만 이동은 원활해요.",
    updatedAt: "4분 전",
    source: "kakao_map_ready",
    hourlyTrends: [25, 38, 52, 60, 68, 65, 58, 42, 30],
    recommendation: "구청 앞 광장 보행로를 이용하시면 한결 쾌적해요.",
  },
  {
    id: "congestion-jamsillaru",
    name: "잠실나루역 1번 출구",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5208,
    lng: 127.1039,
    distance: "620m",
    currentScore: 42,
    baselineScore: 48,
    level: "low",
    summary: "한강 보행 동선과 아파트 상가 통로로 이동이 여유로워요.",
    updatedAt: "5분 전",
    source: "kakao_map_ready",
    hourlyTrends: [20, 26, 35, 45, 48, 42, 38, 30, 22],
    recommendation: "잠실철교 방면 산책길은 인파가 적어 쾌적합니다.",
  },
  {
    id: "congestion-olympic-park",
    name: "올림픽공원 평화의문",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5165,
    lng: 127.1195,
    distance: "480m",
    currentScore: 24,
    baselineScore: 35,
    level: "low",
    summary: "공원 광장과 산책로가 넓게 트여 매우 한산하고 쾌적해요.",
    updatedAt: "7분 전",
    source: "kakao_map_ready",
    hourlyTrends: [12, 18, 25, 30, 28, 24, 20, 16, 10],
    recommendation: "자전거 라이딩이나 가족 나들이에 최고의 시간대예요.",
  },
  {
    id: "congestion-songridan",
    name: "송리단길 카페거리",
    neighborhoodName: "송파삼성래미안",
    districtName: "송파구",
    lat: 37.5100,
    lng: 127.1110,
    distance: "410m",
    currentScore: 81,
    baselineScore: 60,
    level: "high",
    summary: "유명 디저트 샵과 베이커리 매장에 대기 번호표가 발급 중이에요.",
    updatedAt: "3분 전",
    source: "kakao_map_ready",
    hourlyTrends: [26, 38, 55, 72, 86, 81, 74, 52, 35],
    recommendation: "골목 안쪽 신규 입점 카페들은 대기 없이 입장 가능해요.",
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

  // 2. 위례 지역
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

  // 3. 공릉 지역
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

  // 4. 당산 지역
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
  return zone.currentScore - (zone.baselineScore ?? zone.currentScore);
}

export function getCongestionZonesForNeighborhood(
  activeNeighborhood: string,
  secondaryNeighborhood?: string,
): CongestionZone[] {
  const neighborhoods = new Set([activeNeighborhood, secondaryNeighborhood].filter(Boolean));
  return CONGESTION_ZONES.filter((zone) => neighborhoods.has(zone.neighborhoodName));
}

/**
 * 지도 화면 바운드(남서~북동 좌표) 내 혼잡도 구역 필터링
 */
export function getCongestionZonesForBounds(bounds: { south: number; north: number; west: number; east: number }): CongestionZone[] {
  const filtered = CONGESTION_ZONES.filter(
    (zone) =>
      zone.lat >= bounds.south &&
      zone.lat <= bounds.north &&
      zone.lng >= bounds.west &&
      zone.lng <= bounds.east,
  );
  if (filtered.length > 0) return filtered;

  // 바운드가 주어졌으나 등록된 핫스팟이 없는 경우 중심 좌표 근처 구역 자동 생성
  const centerLat = (bounds.south + bounds.north) / 2;
  const centerLng = (bounds.west + bounds.east) / 2;
  return getCongestionZonesNearCenter(centerLat, centerLng);
}

/**
 * 특정 중심 좌표 주변 핫스팟 자동 생성 (화면이 비는 일 방지)
 */
export function getCongestionZonesNearCenter(lat: number, lng: number): CongestionZone[] {
  // 기본 데이터베이스 내 반경 2.5km 이내 검색
  const nearby = CONGESTION_ZONES.filter((z) => {
    const dLat = Math.abs(z.lat - lat);
    const dLng = Math.abs(z.lng - lng);
    return dLat < 0.025 && dLng < 0.035;
  });
  if (nearby.length > 0) return nearby;

  // 완전히 새로운 지역인 경우 동적 샘플 핫스팟 구성
  return [
    {
      id: `dynamic-hotspot-1`,
      name: "역 앞 번화가",
      neighborhoodName: "현재 위치",
      districtName: "주변 지역",
      lat: lat + 0.003,
      lng: lng + 0.003,
      distance: "180m",
      currentScore: 78,
      baselineScore: 58,
      level: "high",
      summary: "상권과 대중교통 이동 동선이 몰리는 시간대예요.",
      updatedAt: "방금 갱신",
      source: "kakao_map_ready",
      hourlyTrends: [25, 38, 55, 72, 85, 78, 65, 48, 30],
      recommendation: "이면도로 보행로를 이용하시면 한산해요.",
    },
    {
      id: `dynamic-hotspot-2`,
      name: "동네 근린공원",
      neighborhoodName: "현재 위치",
      districtName: "주변 지역",
      lat: lat - 0.004,
      lng: lng - 0.002,
      distance: "320m",
      currentScore: 28,
      baselineScore: 35,
      level: "low",
      summary: "산책로가 여유로워 쾌적하게 쉴 수 있어요.",
      updatedAt: "3분 전",
      source: "kakao_map_ready",
      hourlyTrends: [15, 20, 28, 35, 30, 28, 22, 18, 12],
      recommendation: "조용한 휴식이나 산책에 추천드려요.",
    },
    {
      id: `dynamic-hotspot-3`,
      name: "카페 · 식당 거리",
      neighborhoodName: "현재 위치",
      districtName: "주변 지역",
      lat: lat - 0.001,
      lng: lng + 0.005,
      distance: "250m",
      currentScore: 62,
      baselineScore: 52,
      level: "moderate",
      summary: "방문객이 꾸준하지만 이동은 원활한 편이에요.",
      updatedAt: "5분 전",
      source: "kakao_map_ready",
      hourlyTrends: [20, 32, 48, 60, 65, 62, 55, 40, 25],
      recommendation: "매장 내 대기 시간이 5분 이내예요.",
    },
  ];
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


/** Query the visible map only. No generated places or scores on API failure. */
export async function fetchCongestionZones(
  bounds: { south: number; north: number; west: number; east: number },
  signal?: AbortSignal,
): Promise<CongestionZone[]> {
  const params = new URLSearchParams({
    sw_lat: String(bounds.south), sw_lng: String(bounds.west),
    ne_lat: String(bounds.north), ne_lng: String(bounds.east), limit: "30",
  });
  const response = await fetch(`/api/v1/local/congestion-zones?${params}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("혼잡도 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error("혼잡도 응답을 확인하지 못했어요.");
  return data.filter((zone): zone is CongestionZone =>
    zone && zone.source === "seoul_citydata_api" && typeof zone.name === "string" &&
    typeof zone.id === "string" && Number.isFinite(zone.currentScore) &&
    Number.isFinite(zone.lat) && Number.isFinite(zone.lng) &&
    zone.lat >= bounds.south && zone.lat <= bounds.north &&
    zone.lng >= bounds.west && zone.lng <= bounds.east,
  );
}

export function getCongestionPopulationLabel(zone: CongestionZone): string {
  if (!Number.isFinite(zone.populationMin) || !Number.isFinite(zone.populationMax)) return "";
  return `약 ${zone.populationMin!.toLocaleString("ko-KR")}~${zone.populationMax!.toLocaleString("ko-KR")}명`;
}
