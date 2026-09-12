"use client";
import {
  type CongestionZone,
  type CongestionLevel,
  CONGESTION_ZONES,
  getSeedPastelTheme,
  getCongestionLevelLabel,
  getCongestionLevelFromScore,
  fetchCongestionZones,
  summarizeCongestion,
  type SeedPastelTheme,
} from "./congestionService";

export type { CongestionZone, CongestionLevel, SeedPastelTheme };
export { getSeedPastelTheme, getCongestionLevelLabel, getCongestionLevelFromScore };

/* ── 대상 3개 구 설정 ───────────── */
export interface DistrictConfig {
  id: "yeongdeungpo" | "nowon" | "songpa";
  name: string;
  badge: string;
  subtitle: string;
  bounds: { south: number; north: number; west: number; east: number };
  fallbackNeighborhoods: string[];
}

export const TARGET_DISTRICTS: DistrictConfig[] = [
  {
    id: "yeongdeungpo",
    name: "영등포구",
    badge: "업무·상업 허브",
    subtitle: "타임스퀘어 · 여의도 · 당산 복합상권",
    bounds: { south: 37.500, north: 37.545, west: 126.880, east: 126.930 },
    fallbackNeighborhoods: ["당산 2동", "영등포동4가", "여의도"],
  },
  {
    id: "nowon",
    name: "노원구",
    badge: "주거·대학 상권",
    subtitle: "공릉 경춘선숲길 · 과기대 · 노원역세권",
    bounds: { south: 37.610, north: 37.660, west: 127.050, east: 127.110 },
    fallbackNeighborhoods: ["공릉", "노원", "상계"],
  },
  {
    id: "songpa",
    name: "송파구",
    badge: "관광·문화 중심",
    subtitle: "잠실 관광특구 · 롯데월드몰 · 석촌호수 · 가락시장",
    bounds: { south: 37.475, north: 37.530, west: 127.080, east: 127.150 },
    fallbackNeighborhoods: ["송파삼성래미안", "위례", "잠실"],
  },
];

/* ── 요일 및 시간대 라벨 정의 ───────────── */
export const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];
export const FULL_DAY_LABELS = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"];

export const HOURLY_TIME_SLOTS = [
  "00시", "02시", "04시", "06시", "08시", "10시",
  "12시", "14시", "16시", "18시", "20시", "22시"
];

/* ── 일 혼잡도 (요일별) 데이터 ───────────── */
export interface DailyCongestionItem {
  day: string;
  dayFull: string;
  score: number;
  level: CongestionLevel;
  theme: SeedPastelTheme;
  isWeekend: boolean;
  isPeak: boolean;
}

/* ── 시간 혼잡도 데이터 ───────────── */
export interface HourlyCongestionItem {
  hour: string;
  score: number;
  level: CongestionLevel;
  theme: SeedPastelTheme;
  isPeak: boolean;
  label: string; // "출근", "점심", "퇴근/저녁", "심야" 등
}

/* ── 구별 대시보드 종합 집계 ───────────── */
export interface DistrictCongestionSummary {
  district: DistrictConfig;
  zones: CongestionZone[];
  averageScore: number;
  level: CongestionLevel;
  theme: SeedPastelTheme;
  peakZone: CongestionZone | null;
  lowestZone: CongestionZone | null;
  crowdedCount: number;
  // 일 혼잡도 분석
  dailyTrends: DailyCongestionItem[];
  weekdayAvg: number;
  weekendAvg: number;
  peakDay: string;
  // 시간 혼잡도 분석
  hourlyTrends: HourlyCongestionItem[];
  peakHour: string;
  // 인구 추정치
  totalPopulationMin: number;
  totalPopulationMax: number;
  lastUpdated: string;
}

/* ── 구별 표준 일/시간대 프로필 (실시간 점수에 비례하여 동적 스케일링) ───────────── */
const DISTRICT_BASE_PATTERNS = {
  yeongdeungpo: {
    // 평일 오피스 + 금/토 타임스퀘어 집중형
    dailyWeights: [64, 68, 70, 74, 86, 88, 60],
    hourlyWeights: [18, 12, 10, 24, 76, 68, 74, 62, 65, 88, 78, 45],
    peakDay: "토요일",
    peakHour: "18시",
  },
  nowon: {
    // 대학가/주거지: 목~토 저녁 및 주말 여가형
    dailyWeights: [52, 56, 60, 68, 75, 78, 54],
    hourlyWeights: [22, 14, 10, 20, 62, 54, 58, 52, 56, 76, 72, 48],
    peakDay: "금요일",
    peakHour: "19시",
  },
  songpa: {
    // 잠실 관광특구: 금/토/일 폭발적 집중형
    dailyWeights: [58, 62, 66, 70, 84, 94, 86],
    hourlyWeights: [16, 12, 10, 18, 58, 65, 78, 72, 76, 92, 84, 42],
    peakDay: "토요일",
    peakHour: "18시",
  },
};

function buildDailyTrends(districtId: DistrictConfig["id"], currentAvg: number): DailyCongestionItem[] {
  const pattern = DISTRICT_BASE_PATTERNS[districtId];
  const weights = pattern.dailyWeights;
  const patternAvg = weights.reduce((a, b) => a + b, 0) / weights.length;
  const ratio = currentAvg > 0 ? currentAvg / patternAvg : 1;

  const maxVal = Math.max(...weights);
  return DAY_LABELS.map((day, idx) => {
    const rawScore = Math.round(weights[idx] * (0.6 + ratio * 0.4));
    const score = Math.max(12, Math.min(98, rawScore));
    const isWeekend = idx >= 5;
    const isPeak = weights[idx] === maxVal;
    return {
      day,
      dayFull: FULL_DAY_LABELS[idx],
      score,
      level: getCongestionLevelFromScore(score),
      theme: getSeedPastelTheme(score),
      isWeekend,
      isPeak,
    };
  });
}

function buildHourlyTrends(districtId: DistrictConfig["id"], currentAvg: number): HourlyCongestionItem[] {
  const pattern = DISTRICT_BASE_PATTERNS[districtId];
  const weights = pattern.hourlyWeights;
  const patternAvg = weights.reduce((a, b) => a + b, 0) / weights.length;
  const ratio = currentAvg > 0 ? currentAvg / patternAvg : 1;

  const maxVal = Math.max(...weights);
  return HOURLY_TIME_SLOTS.map((hour, idx) => {
    const rawScore = Math.round(weights[idx] * (0.6 + ratio * 0.4));
    const score = Math.max(10, Math.min(99, rawScore));
    const isPeak = weights[idx] === maxVal;

    let label = "평온";
    if (idx === 4) label = "출근";
    else if (idx === 6) label = "점심";
    else if (idx === 9) label = "퇴근·골든";
    else if (idx === 10) label = "야간";

    return {
      hour,
      score,
      level: getCongestionLevelFromScore(score),
      theme: getSeedPastelTheme(score),
      isPeak,
      label,
    };
  });
}

function getFallbackZonesForDistrict(district: DistrictConfig): CongestionZone[] {
  const matched = CONGESTION_ZONES.filter(
    (z) =>
      z.districtName === district.name ||
      district.fallbackNeighborhoods.some((n) => z.neighborhoodName.includes(n) || z.name.includes(n)),
  );
  if (matched.length > 0) return matched;

  // 노원구 전용 보강 (폴백 없을 시)
  if (district.id === "nowon") {
    return [
      {
        id: "congestion-gongneung-station",
        name: "공릉역 1번 출구",
        neighborhoodName: "공릉동",
        districtName: "노원구",
        lat: 37.6258,
        lng: 127.0732,
        distance: "120m",
        currentScore: 74,
        baselineScore: 57,
        level: "high",
        levelLabel: "혼잡",
        populationMin: 12000,
        populationMax: 14000,
        summary: "지하철 출구와 먹자골목 진입 동선이 몰리는 시간대예요.",
        updatedAt: "방금 갱신",
        source: "local_fallback",
        recommendation: "경춘선 숲길 방향 보행로를 이용하시면 혼잡을 피할 수 있어요.",
      },
      {
        id: "congestion-gongneung-campus",
        name: "서울과기대 정문",
        neighborhoodName: "공릉동",
        districtName: "노원구",
        lat: 37.6291,
        lng: 127.0772,
        distance: "540m",
        currentScore: 42,
        baselineScore: 46,
        level: "low",
        levelLabel: "여유",
        populationMin: 4500,
        populationMax: 5500,
        summary: "강의 이동 시간이 지나 캠퍼스 진입로가 비교적 여유로운 상태예요.",
        updatedAt: "방금 갱신",
        source: "local_fallback",
        recommendation: "교내 산책로나 주변 카페 이용이 한산해요.",
      },
      {
        id: "congestion-nowon-culture",
        name: "노원역 문화의거리",
        neighborhoodName: "상계동",
        districtName: "노원구",
        lat: 37.6563,
        lng: 127.0632,
        distance: "310m",
        currentScore: 78,
        baselineScore: 62,
        level: "high",
        levelLabel: "약간 붐빔",
        populationMin: 16000,
        populationMax: 18000,
        summary: "상업시설과 버스 환승 정류장 부근에 보행 밀집이 높아요.",
        updatedAt: "방금 갱신",
        source: "local_fallback",
        recommendation: "이면도로 롯데백화점 후문 방면이 이동에 수월합니다.",
      },
    ];
  }

  return [];
}

function summarizeDistrict(district: DistrictConfig, rawZones: CongestionZone[]): DistrictCongestionSummary {
  const zones = rawZones.length > 0 ? rawZones : getFallbackZonesForDistrict(district);
  const { averageScore, averageLevel, averageTheme, peakZone, crowdedCount } = summarizeCongestion(zones);

  const lowestZone = zones.reduce<CongestionZone | null>(
    (low, z) => (!low || z.currentScore < low.currentScore ? z : low),
    null,
  );

  const dailyTrends = buildDailyTrends(district.id, averageScore);
  const hourlyTrends = buildHourlyTrends(district.id, averageScore);

  const weekdayItems = dailyTrends.filter((d) => !d.isWeekend);
  const weekendItems = dailyTrends.filter((d) => d.isWeekend);

  const weekdayAvg = Math.round(weekdayItems.reduce((s, d) => s + d.score, 0) / Math.max(1, weekdayItems.length));
  const weekendAvg = Math.round(weekendItems.reduce((s, d) => s + d.score, 0) / Math.max(1, weekendItems.length));

  const peakDayItem = dailyTrends.reduce((max, d) => (d.score > max.score ? d : max), dailyTrends[0]);
  const peakHourItem = hourlyTrends.reduce((max, h) => (h.score > max.score ? h : max), hourlyTrends[0]);

  const totalPopulationMin = zones.reduce((sum, z) => sum + (z.populationMin ?? 0), 0);
  const totalPopulationMax = zones.reduce((sum, z) => sum + (z.populationMax ?? 0), 0);

  const lastUpdated = zones[0]?.updatedAt ?? "실시간";

  return {
    district,
    zones,
    averageScore,
    level: averageLevel,
    theme: averageTheme,
    peakZone,
    lowestZone,
    crowdedCount,
    dailyTrends,
    weekdayAvg,
    weekendAvg,
    peakDay: peakDayItem?.dayFull ?? DISTRICT_BASE_PATTERNS[district.id].peakDay,
    hourlyTrends,
    peakHour: peakHourItem?.hour ?? DISTRICT_BASE_PATTERNS[district.id].peakHour,
    totalPopulationMin,
    totalPopulationMax,
    lastUpdated,
  };
}

/* ── 3개 구 혼잡도 실시간 병렬 조회 ───────────── */
export async function fetchDistrictCongestion(): Promise<DistrictCongestionSummary[]> {
  const results = await Promise.allSettled(
    TARGET_DISTRICTS.map(async (district) => {
      try {
        const zones = await fetchCongestionZones(district.bounds);
        if (zones && zones.length > 0) {
          return summarizeDistrict(district, zones);
        }
      } catch {
        // Fallback to district profile
      }
      return summarizeDistrict(district, getFallbackZonesForDistrict(district));
    }),
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : summarizeDistrict(TARGET_DISTRICTS[i], getFallbackZonesForDistrict(TARGET_DISTRICTS[i])),
  );
}
