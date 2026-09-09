const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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
  const url = API_BASE_URL
    ? new URL(`/api/v1/dream/facilities?${params}`, API_BASE_URL).toString()
    : `/api/v1/dream/facilities?${params}`;
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
  });
}
