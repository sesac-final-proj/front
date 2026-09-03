export type CongestionLevel = "low" | "moderate" | "high" | "severe";

export interface CongestionZone {
  id: string;
  name: string;
  neighborhoodName: string;
  districtName: string;
  lat: number;
  lng: number;
  distance: string;
  currentScore: number;
  baselineScore: number;
  level: CongestionLevel;
  summary: string;
  updatedAt: string;
  source: string;
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
  if (score >= 85) return "severe";
  if (score >= 70) return "high";
  if (score >= 45) return "moderate";
  return "low";
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
  const crowdedCount = zones.filter((zone) => zone.level === "high" || zone.level === "severe").length;

  return {
    averageScore,
    averageLevel: getCongestionLevelFromScore(averageScore),
    peakZone,
    crowdedCount,
  };
}
