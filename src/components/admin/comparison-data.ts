import type { PriceComparisonDetailTypeItem, PriceComparisonRegionItem, PricePlatformComparisonItem } from "@/services/adminService";
export const PLATFORMS = ["당근", "중고나라", "번개장터"] as const;
export const COLORS = ["#d65e13", "#2764a5", "#826a27"];
export const RADAR_SERIES_LIMITS = { min: 2, max: 3 } as const;
export const EXTERNAL_RADAR_METRICS = ["표본 수", "평균가", "가격 편차", "1사분위가", "중앙값", "3사분위가"] as const;
export const REGION_RADAR_METRICS = ["당근 중위가", "표본 규모", "거래 완료율", "매너온도", "가격 안정성", "세부유형 폭"] as const;

export function reconcileRadarSeries(selected: string[], available: string[]): string[] {
  const valid = selected.filter((category, index) => available.includes(category) && selected.indexOf(category) === index);
  for (const category of available) {
    if (valid.length >= RADAR_SERIES_LIMITS.min) break;
    if (!valid.includes(category)) valid.push(category);
  }
  return valid.slice(0, RADAR_SERIES_LIMITS.max);
}

export function toggleRadarSeries(selected: string[], category: string, available: string[]): string[] {
  const current = reconcileRadarSeries(selected, available);
  if (!available.includes(category)) return current;
  if (current.includes(category)) {
    return current.length <= RADAR_SERIES_LIMITS.min ? current : current.filter(item => item !== category);
  }
  return current.length >= RADAR_SERIES_LIMITS.max ? current : [...current, category];
}

export function normalizedRadarValues(rows: PricePlatformComparisonItem[]): number[][] {
  const keys = ["sample_count", "mean_price", "std_price", "p25_price", "median_price", "p75_price"] as const;
  const columns = keys.map(key => rows.map(row => Number(row[key])));
  return rows.map((_, rowIndex) => columns.map(values => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max === min) return 50;
    return (values[rowIndex] - min) * 100 / (max - min);
  }));
}

export function carrotBenchmarkValues(rows: PricePlatformComparisonItem[]): number[][] {
  const keys = ["sample_count", "mean_price", "std_price", "p25_price", "median_price", "p75_price"] as const;
  const carrot = rows.find(row => platformName(row.platform) === "당근");
  if (!carrot) return [];
  return rows.map(row => keys.map(key => {
    const baseline = carrot[key];
    if (baseline === 0) return row[key] === 0 ? 100 : 200;
    return Math.min(200, Math.max(0, row[key] * 100 / baseline));
  }));
}

export function regionRadarValues(
  rows: PriceComparisonRegionItem[],
  details: PriceComparisonDetailTypeItem[],
  carrotMedian: number,
): number[][] {
  const maxSamples = Math.max(1, ...rows.map(row => row.sample_count));
  const maxDetailCount = Math.max(1, ...rows.map(row => new Set(details.filter(item => item.gu === row.gu).map(item => item.detail_type)).size));
  return rows.map(row => {
    const related = details.filter(item => item.gu === row.gu);
    const weight = related.reduce((sum, item) => sum + item.sample_count, 0);
    const cv = weight ? related.reduce((sum, item) => sum + item.cv_price * item.sample_count, 0) / weight : 100;
    const detailCount = new Set(related.map(item => item.detail_type)).size;
    return [
      carrotMedian > 0 ? Math.min(200, row.median_price * 100 / carrotMedian) : 100,
      row.sample_count * 100 / maxSamples,
      Math.min(100, Math.max(0, row.completion_rate)),
      Math.min(100, Math.max(0, row.avg_manner_temp * 2)),
      Math.min(100, Math.max(0, 100 - cv)),
      detailCount * 100 / maxDetailCount,
    ];
  });
}

export function platformName(value: string): string {
  const name = value.trim().toLowerCase();
  if (["당근", "당근마켓", "daangn", "danggeun", "carrot"].includes(name)) return "당근";
  if (["중고나라", "joongna", "joonggonara"].includes(name)) return "중고나라";
  if (["번개장터", "번개", "bunjang", "elecmart"].includes(name)) return "번개장터";
  return value;
}
export function reviewComparisons(input: PricePlatformComparisonItem[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const candidates = input.map(row => ({ ...row, platform: platformName(row.platform) }));
  candidates.forEach(row => { const key = `${row.category}|${row.platform}`; if (seen.has(key)) duplicates.add(key); seen.add(key); });
  const rows = candidates.filter(row => {
    return PLATFORMS.some(platform => platform === row.platform) && row.category.trim() &&
      !duplicates.has(`${row.category}|${row.platform}`) && Number.isInteger(row.sample_count) && row.sample_count > 0 &&
      [row.mean_price, row.std_price, row.p25_price, row.median_price, row.p75_price].every(value => Number.isFinite(value) && value >= 0) &&
      row.p25_price <= row.median_price && row.median_price <= row.p75_price;
  });
  const categories = [...new Set(rows.map(row => row.category))].sort();
  const comparable = categories.filter(category => PLATFORMS.every(platform => rows.some(row => row.category === category && row.platform === platform)));
  const gaps = categories.flatMap(category => {
    const carrot = rows.find(row => row.category === category && row.platform === "당근");
    if (!carrot || carrot.median_price <= 0) return [];
    return rows.filter(row => row.category === category && row.platform !== "당근").map(row => ({
      category, platform: row.platform, percent: (row.median_price / carrot.median_price - 1) * 100,
      samples: row.sample_count, carrotSamples: carrot.sample_count,
    }));
  });
  return { rows, categories, comparable, gaps, excluded: input.length - rows.length };
}

export function comparisonDecisions(input: PricePlatformComparisonItem[]) {
  const reviewed = reviewComparisons(input);
  const decisions = reviewed.comparable.map(category => {
    const rows = reviewed.rows.filter(row => row.category === category);
    const carrot = rows.find(row => row.platform === "당근")!;
    const external = rows.filter(row => row.platform !== "당근");
    const externalMedian = external.reduce((sum, row) => sum + row.median_price, 0) / external.length;
    const gapPercent = carrot.median_price > 0 ? (externalMedian / carrot.median_price - 1) * 100 : 0;
    const spreadPercent = carrot.median_price > 0 ? (carrot.p75_price - carrot.p25_price) * 100 / carrot.median_price : 0;
    const externalSamples = external.reduce((sum, row) => sum + row.sample_count, 0);
    const enoughSamples = Math.min(carrot.sample_count, externalSamples) >= 20;
    const priority = Math.abs(gapPercent) >= 20 && enoughSamples ? "높음" : Math.abs(gapPercent) >= 10 && enoughSamples ? "중간" : "관찰";
    const action = gapPercent >= 10 ? "가격 경쟁력 홍보" : gapPercent <= -10 ? "권장가 하향 점검" : "현 수준 유지";
    const confidence = enoughSamples ? (Math.abs(gapPercent) >= 10 ? "판단 가능" : "안정") : "판단 보류";
    return { category, carrotMedian: carrot.median_price, carrotQ1: carrot.p25_price, carrotQ3: carrot.p75_price,
      externalMedian, externalQ1: external.reduce((sum, row) => sum + row.p25_price, 0) / external.length,
      externalQ3: external.reduce((sum, row) => sum + row.p75_price, 0) / external.length,
      gapPercent, spreadPercent, carrotSamples: carrot.sample_count, externalSamples, priority, confidence, action };
  }).sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));
  const totalSamples = reviewed.rows.reduce((sum, row) => sum + row.sample_count, 0);
  const coverage = reviewed.categories.length ? reviewed.comparable.length * 100 / reviewed.categories.length : 0;
  return { ...reviewed, decisions, totalSamples, coverage };
}
