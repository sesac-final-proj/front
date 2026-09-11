import {
  adminAuthorizedFetch,
  getPriceModelCharts,
  getPriceModelMetrics,
  getPriceDistribution,
  getDetailTypeCounts,
  type AdminDataStatus,
  type PriceModelMetricItem,
  type PriceDistributionCategory,
  type PriceModelCharts,
  type DetailTypeCountItem,
} from "@/services/adminService";

export interface DashboardOverview {
  summary: {
    total_transactions: number;
    price_eligible_transactions: number;
    price_eligible_rate: number;
    active_regions: number;
    average_listing_price: number | null;
  };
  collection_trend: AdminDataStatus["daily_counts"];
  trade_status: AdminDataStatus["status_counts"];
  trade_status_by_gu: { gu_name: string; status: string; transaction_count: number }[];
  region_ranking: AdminDataStatus["region_counts"];
  price_distribution: AdminDataStatus["price_band_counts"];
  source: { name: string; status: "available" | "empty"; last_collected_at: string | null };
  recent_transactions: AdminDataStatus["recent_transactions"];
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await adminAuthorizedFetch("/api/v1/admin/dashboard/overview?range=14d");
  if (!response.ok) throw new Error("거래 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return response.json();
}

export interface PricePredictionSummary {
  metrics: PriceModelMetricItem[];
  distribution: PriceDistributionCategory[];
  charts: PriceModelCharts;
  detailTypeCounts: DetailTypeCountItem[];
}

// 거래 대시보드 하단 "가격예측 모델" 블록용 — 지표/분포/차트/세부유형 개수는 자주 안 바뀌니
const emptyCharts: PriceModelCharts = { predictions: [], feature_importance: [], platform_comparisons: [], platform_tests: [], clusters: [] };

export async function getPricePredictionSummary(): Promise<PricePredictionSummary> {
  const [metrics, distribution, charts, detailTypeCounts] = await Promise.all([
    getPriceModelMetrics().catch(() => ({ metrics: [] })),
    getPriceDistribution().catch(() => ({ categories: [] })),
    getPriceModelCharts().catch(() => emptyCharts),
    getDetailTypeCounts().catch(() => ({ items: [] })),
  ]);
  return {
    metrics: Array.isArray(metrics?.metrics) ? metrics.metrics : [],
    distribution: Array.isArray(distribution?.categories) ? distribution.categories : [],
    charts: charts && Array.isArray(charts.predictions) ? charts : emptyCharts,
    detailTypeCounts: Array.isArray(detailTypeCounts?.items) ? detailTypeCounts.items : [],
  };
}
