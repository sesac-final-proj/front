import type {
  HouseTypeFilter,
  PropertyBuilding,
  PropertyDongGroup,
  RealEstateBounds,
  RentTransaction,
  RentTransactionResponse,
  RentTypeFilter,
} from "@/types/realEstate";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface ApiRentTransaction {
  id: string;
  district: string;
  dong: string;
  building_name?: string | null;
  address: string;
  rent_type: "monthly" | "jeonse";
  deposit: number;
  monthly_rent: number;
  area_m2: number;
  floor?: number | null;
  contract_date: string;
  house_type: RentTransaction["houseType"];
  house_type_label: string;
  build_year?: number | null;
  lat?: number | null;
  lng?: number | null;
}

interface ApiRentResponse {
  items: ApiRentTransaction[];
  total: number;
  source: RentTransactionResponse["source"];
  geocoded_count: number;
  notice?: string | null;
}

export interface RentTransactionQuery {
  district: string;
  dong?: string;
  q?: string;
  rentType: RentTypeFilter;
  houseType: HouseTypeFilter;
  depositMax?: number;
  monthlyRentMax?: number;
  year?: number;
  bounds?: RealEstateBounds | null;
  limit?: number;
}

function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

export async function getRentTransactions(
  query: RentTransactionQuery,
  signal?: AbortSignal,
): Promise<RentTransactionResponse> {
  const params = new URLSearchParams({
    district: query.district,
    rent_type: query.rentType,
    house_type: query.houseType,
    limit: String(query.limit ?? 160),
  });
  if (query.dong) params.set("dong", query.dong);
  if (query.q) params.set("q", query.q);
  if (query.depositMax !== undefined) params.set("deposit_max", String(query.depositMax));
  if (query.monthlyRentMax !== undefined) params.set("monthly_rent_max", String(query.monthlyRentMax));
  if (query.year) params.set("year", String(query.year));
  if (query.bounds) {
    Object.entries(query.bounds).forEach(([key, value]) => params.set(key, String(value)));
  }

  const response = await fetch(apiUrl(`/api/real-estate/rent?${params}`), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? "실거래 정보를 불러오지 못했습니다.");
  }

  const payload: ApiRentResponse = await response.json();
  return {
    items: payload.items.map((item) => ({
      id: item.id,
      district: item.district,
      dong: item.dong,
      buildingName: item.building_name ?? undefined,
      address: item.address,
      rentType: item.rent_type,
      deposit: item.deposit,
      monthlyRent: item.monthly_rent,
      areaM2: item.area_m2,
      floor: item.floor ?? undefined,
      contractDate: item.contract_date,
      houseType: item.house_type,
      houseTypeLabel: item.house_type_label,
      buildYear: item.build_year ?? undefined,
      lat: item.lat ?? undefined,
      lng: item.lng ?? undefined,
    })),
    total: payload.total,
    source: payload.source,
    geocodedCount: payload.geocoded_count,
    notice: payload.notice ?? undefined,
  };
}

export function groupTransactionsByBuilding(transactions: RentTransaction[]): PropertyBuilding[] {
  const groups = new Map<string, RentTransaction[]>();
  transactions.forEach((transaction) => {
    if (transaction.lat === undefined || transaction.lng === undefined) return;
    const key = `${transaction.address}|${transaction.buildingName ?? ""}`;
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  });

  return [...groups.entries()].map(([key, items]) => {
    const sorted = [...items].sort((a, b) => b.contractDate.localeCompare(a.contractDate));
    const latestTransaction = sorted[0];
    return {
      id: key,
      district: latestTransaction.district,
      dong: latestTransaction.dong,
      buildingName: latestTransaction.buildingName,
      address: latestTransaction.address,
      lat: latestTransaction.lat as number,
      lng: latestTransaction.lng as number,
      transactions: sorted,
      transactionCount: sorted.length,
      latestTransaction,
      representativeRent:
        latestTransaction.rentType === "monthly" ? latestTransaction.monthlyRent : undefined,
    };
  });
}

export function groupBuildingsByDong(buildings: PropertyBuilding[]): PropertyDongGroup[] {
  const groups = new Map<string, PropertyBuilding[]>();
  buildings.forEach((building) => groups.set(building.dong, [...(groups.get(building.dong) ?? []), building]));
  return [...groups.entries()].map(([dong, items]) => ({
    dong,
    lat: items.reduce((sum, item) => sum + item.lat, 0) / items.length,
    lng: items.reduce((sum, item) => sum + item.lng, 0) / items.length,
    transactionCount: items.reduce((sum, item) => sum + item.transactionCount, 0),
    buildingCount: items.length,
    buildings: items,
  }));
}
