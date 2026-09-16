export type BenchmarkStats = {
  count: number;
  mean: number | null;
  median: number | null;
  q1: number | null;
  q3: number | null;
};

export type BenchmarkProduct = {
  name: string;
  item: string;
  model: string;
  referencePrice: number | null;
  elecmart: BenchmarkStats;
  joonggonara: BenchmarkStats;
};

export type BenchmarkCategory = {
  item: string;
  elecmartCount: number;
  joonggonaraCount: number;
  elecmartMedian: number | null;
  joonggonaraMedian: number | null;
};

export type ListingBenchmarkInput = {
  item: string;
  model: string;
  price: number;
};

export type ListingBenchmarkResult = {
  basis: "model" | "category";
  benchmarkPrice: number;
  lowerQuartile: number;
  upperQuartile: number;
  quickSalePrice: number;
  balancedPrice: number;
  priceDifference: number;
  priceIndex: number;
  sampleCount: number;
  platformSpread: number | null;
  confidenceScore: number;
  confidenceLabel: "높음" | "보통" | "낮음";
  position: "빠른 판매 가격" | "시장 적정 가격" | "가격 경쟁력 낮음" | "고가 위험";
  recommendation: string;
  elecmartMedian: number | null;
  joonggonaraMedian: number | null;
};

const average = (values: Array<number | null>) => {
  const valid = values.filter((value): value is number => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

export function evaluateListing(
  products: BenchmarkProduct[],
  categories: BenchmarkCategory[],
  input: ListingBenchmarkInput,
): ListingBenchmarkResult | null {
  if (!Number.isFinite(input.price) || input.price <= 0) return null;

  const exact = products.find((product) => product.item === input.item && product.model === input.model);
  const category = categories.find((candidate) => candidate.item === input.item);
  const hasExactBenchmark = Boolean(input.model !== "모델 미상" && exact?.referencePrice && exact.elecmart.count + exact.joonggonara.count >= 3);
  const basis = hasExactBenchmark ? "model" : "category";
  const benchmarkPrice = hasExactBenchmark
    ? exact?.referencePrice ?? null
    : average([category?.elecmartMedian ?? null, category?.joonggonaraMedian ?? null]);
  if (!benchmarkPrice) return null;

  const elecmartMedian = hasExactBenchmark ? exact?.elecmart.median ?? null : category?.elecmartMedian ?? null;
  const joonggonaraMedian = hasExactBenchmark ? exact?.joonggonara.median ?? null : category?.joonggonaraMedian ?? null;
  const sampleCount = hasExactBenchmark
    ? (exact?.elecmart.count ?? 0) + (exact?.joonggonara.count ?? 0)
    : (category?.elecmartCount ?? 0) + (category?.joonggonaraCount ?? 0);
  const lowerQuartile = hasExactBenchmark
    ? average([exact?.elecmart.q1 ?? null, exact?.joonggonara.q1 ?? null]) ?? benchmarkPrice * 0.75
    : benchmarkPrice * 0.75;
  const upperQuartile = hasExactBenchmark
    ? average([exact?.elecmart.q3 ?? null, exact?.joonggonara.q3 ?? null]) ?? benchmarkPrice * 1.25
    : benchmarkPrice * 1.25;
  const platformSpread = elecmartMedian && joonggonaraMedian
    ? Math.abs(elecmartMedian - joonggonaraMedian) / ((elecmartMedian + joonggonaraMedian) / 2) * 100
    : null;
  const priceIndex = input.price / benchmarkPrice * 100;

  let position: ListingBenchmarkResult["position"];
  let recommendation: string;
  if (priceIndex <= 90) {
    position = "빠른 판매 가격";
    recommendation = "외부 시장 기준보다 낮습니다. 빠른 판매를 우선한다면 유지하고, 수익을 높이려면 균형 가격까지 조정할 수 있습니다.";
  } else if (priceIndex <= 105) {
    position = "시장 적정 가격";
    recommendation = "외부 시장 기준과 가까운 가격입니다. 상품 상태와 구성품을 설명해 현재 가격의 근거를 강화하세요.";
  } else if (priceIndex <= 120) {
    position = "가격 경쟁력 낮음";
    recommendation = "비교 기준보다 다소 높습니다. 상태가 우수하지 않다면 균형 가격 수준으로 낮추는 편이 유리합니다.";
  } else {
    position = "고가 위험";
    recommendation = "외부 시장 기준을 크게 웃돕니다. 희소 모델이나 추가 구성품 근거가 없다면 가격 조정을 권장합니다.";
  }

  const sampleScore = sampleCount >= 50 ? 45 : sampleCount >= 20 ? 35 : sampleCount >= 5 ? 24 : 12;
  const crossPlatformScore = elecmartMedian !== null && joonggonaraMedian !== null ? 15 : 7;
  const agreementScore = platformSpread === null ? 5 : platformSpread <= 10 ? 25 : platformSpread <= 25 ? 15 : 5;
  const modelScore = basis === "model" ? 10 : 3;
  const confidenceScore = Math.min(100, sampleScore + crossPlatformScore + agreementScore + modelScore);
  const confidenceLabel = confidenceScore >= 75 ? "높음" : confidenceScore >= 50 ? "보통" : "낮음";

  return {
    basis,
    benchmarkPrice,
    lowerQuartile,
    upperQuartile,
    quickSalePrice: benchmarkPrice * 0.9,
    balancedPrice: benchmarkPrice * 0.97,
    priceDifference: input.price - benchmarkPrice,
    priceIndex,
    sampleCount,
    platformSpread,
    confidenceScore,
    confidenceLabel,
    position,
    recommendation,
    elecmartMedian,
    joonggonaraMedian,
  };
}

export function inferBenchmarkSelection(title: string, products: BenchmarkProduct[]) {
  const normalized = title.toUpperCase().replace(/[^0-9A-Z가-힣]/g, "");
  const itemRules: Array<[string, string[]]> = [
    ["다이슨 청소기", ["다이슨", "DYSON"]],
    ["메디큐브 부스터 프로", ["메디큐브", "부스터프로", "AGE-R"]],
    ["미닉스 음식물처리기", ["미닉스", "음식물처리"]],
    ["브레짜 분유", ["브레짜", "BREZZA", "분유"]],
    ["쿠쿠 밥솥", ["쿠쿠", "CUCKOO", "밥솥", "CRP"]],
    ["풀리오 마사지기", ["풀리오", "PULIO", "마사지"]],
  ];
  const item = itemRules.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword.replace(/[^0-9A-Z가-힣]/g, ""))))?.[0]
    ?? products[0]?.item
    ?? "";
  const models = products
    .filter((product) => product.item === item && product.model !== "모델 미상")
    .sort((left, right) => right.model.length - left.model.length);
  const model = models.find((product) => normalized.includes(product.model.toUpperCase().replace(/[^0-9A-Z가-힣]/g, "")))?.model
    ?? "모델 미상";
  return { item, model };
}
