import { adminAuthorizedFetch, type AdminDataStatus } from "@/services/adminService";

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
  region_ranking: AdminDataStatus["region_counts"];
  source: { name: string; status: "available" | "empty"; last_collected_at: string | null };
  recent_transactions: AdminDataStatus["recent_transactions"];
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const response = await adminAuthorizedFetch("/api/v1/admin/dashboard/overview?range=14d");
  if (!response.ok) throw new Error("거래 현황을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
  return response.json();
}
