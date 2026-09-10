import { authorizedFetch } from "@/services/tradeService";

export interface DreamFacility {
  id: string;
  name: string;
  facilityType: string;
  neighborhoodName: string;
  homepageUrl: string | null;
  address: string;
  phone: string | null;
  establishedDate: string | null;
  operationStatus: string | null;
  lat: number;
  lng: number;
  donationCount: number;
  currentAmount: number;
  targetAmount: number;
  totalScore: number | null;
  districtRank: number | null;
  isRepresentative: boolean;
  isSelected: boolean;
  checklist: Record<string, string> | null;
}

interface ApiFacility {
  id: string;
  name: string;
  district: string;
  facility_type: string;
  homepage_url: string | null;
  address: string;
  phone: string | null;
  established_date: string | null;
  operation_status: string | null;
  lat: number | null;
  lng: number | null;
  total_score: number | null;
  district_rank: number | null;
  is_representative: boolean;
  is_selected: boolean;
  checklist: Record<string, string> | null;
}

export async function getDreamFacilities(district: string, signal?: AbortSignal): Promise<DreamFacility[]> {
  const params = new URLSearchParams({ district, limit: "50" });
  const url = `/api/v1/dream/facilities?${params}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("어린이 센터를 불러오지 못했습니다.");

  const payload: { items: ApiFacility[] } = await response.json();
  return payload.items.map((item, idx) => {
    const lat = item.lat ?? (37.5665 + (idx % 5) * 0.0015);
    const lng = item.lng ?? (126.9780 + (Math.floor(idx / 5) % 5) * 0.0015);
    return {
      id: item.id,
      name: item.name,
      facilityType: item.facility_type,
      neighborhoodName: item.district,
      homepageUrl: item.homepage_url,
      address: item.address,
      phone: item.phone,
      establishedDate: item.established_date,
      operationStatus: item.operation_status,
      lat,
      lng,
      donationCount: 0,
      currentAmount: 0,
      targetAmount: 0,
      totalScore: item.total_score,
      districtRank: item.district_rank,
      isRepresentative: item.is_representative,
      isSelected: item.is_selected,
      checklist: item.checklist,
    };
  })
    .filter((facility) => facility.isSelected)
    .sort((a, b) => (a.districtRank ?? Number.MAX_SAFE_INTEGER) - (b.districtRank ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 2);
}

// 꿈방울(기부 가능 포인트) 잔액 — 결제할 때마다 자동 적립되는 값(일반결제 1%, 중고거래
// 0.1%·5,000원 이상만)이라 여기선 조회만 한다. 나의 당근 화면의 "포인트" 배지에 씀.
export async function getDreamPointsBalance(signal?: AbortSignal): Promise<number> {
  const response = await authorizedFetch("/api/v1/dream/points", {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("포인트를 불러오지 못했습니다.");

  const payload: { balance: number } = await response.json();
  return payload.balance;
}

export interface DreamPointTransaction {
  id: number;
  amount: number;
  source: "general_payment" | "trade";
  createdAt: string;
}

// 꿈가지 화면 상단 "최근 적립" 카드용 — 잔액만 쓰던 getDreamPointsBalance와 별개로
// 개별 적립 내역(source/금액/일시)까지 필요해서 추가. size로 최근 몇 건만 받는다.
export async function getDreamPointsHistory(size = 5, signal?: AbortSignal): Promise<{ balance: number; transactions: DreamPointTransaction[] }> {
  const response = await authorizedFetch(`/api/v1/dream/points?size=${size}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("포인트 내역을 불러오지 못했습니다.");

  const payload: {
    balance: number;
    transactions: { items: { id: number; amount: number; source: "general_payment" | "trade"; created_at: string }[] };
  } = await response.json();
  return {
    balance: payload.balance,
    transactions: payload.transactions.items.map((item) => ({
      id: item.id,
      amount: item.amount,
      source: item.source,
      createdAt: item.created_at,
    })),
  };
}
