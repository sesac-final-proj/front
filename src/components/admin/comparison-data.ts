import type { PricePlatformComparisonItem } from "@/services/adminService";
export const PLATFORMS = ["당근", "중고나라", "번개장터"] as const;
export const COLORS = ["#d65e13", "#2764a5", "#826a27"];
export const RADAR_CATEGORY_LIMITS = { min: 3, max: 6 } as const;

export function reconcileRadarCategories(selected: string[], available: string[]): string[] {
  const valid = selected.filter((category, index) => available.includes(category) && selected.indexOf(category) === index);
  for (const category of available) {
    if (valid.length >= RADAR_CATEGORY_LIMITS.min) break;
    if (!valid.includes(category)) valid.push(category);
  }
  return valid.slice(0, RADAR_CATEGORY_LIMITS.max);
}

export function toggleRadarCategory(selected: string[], category: string, available: string[]): string[] {
  const current = reconcileRadarCategories(selected, available);
  if (!available.includes(category)) return current;
  if (current.includes(category)) {
    return current.length <= RADAR_CATEGORY_LIMITS.min ? current : current.filter(item => item !== category);
  }
  return current.length >= RADAR_CATEGORY_LIMITS.max ? current : [...current, category];
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
      [row.p25_price, row.median_price, row.p75_price].every(value => Number.isFinite(value) && value >= 0) &&
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
    const priority = Math.abs(gapPercent) >= 20 && Math.min(carrot.sample_count, externalSamples) >= 20 ? "높음" : Math.abs(gapPercent) >= 10 ? "중간" : "관찰";
    const action = gapPercent >= 10 ? "가격 경쟁력 홍보" : gapPercent <= -10 ? "권장가 하향 점검" : "현 수준 유지";
    return { category, carrotMedian: carrot.median_price, externalMedian, gapPercent, spreadPercent,
      carrotSamples: carrot.sample_count, externalSamples, priority, action };
  }).sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent));
  const totalSamples = reviewed.rows.reduce((sum, row) => sum + row.sample_count, 0);
  const coverage = reviewed.categories.length ? reviewed.comparable.length * 100 / reviewed.categories.length : 0;
  return { ...reviewed, decisions, totalSamples, coverage };
}
