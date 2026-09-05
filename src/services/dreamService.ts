const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface DreamFacility {
  id: string;
  name: string;
  facilityType: string;
  neighborhoodName: string;
  lat: number;
  lng: number;
  donationCount: number;
  currentAmount: number;
  targetAmount: number;
}

interface ApiFacility {
  id: string;
  name: string;
  district: string;
  facility_type: string;
  lat: number | null;
  lng: number | null;
}

export async function getDreamFacilities(district: string, signal?: AbortSignal): Promise<DreamFacility[]> {
  const params = new URLSearchParams({ district, limit: "50" });
  const url = API_BASE_URL
    ? new URL(`/api/v1/dream/facilities?${params}`, API_BASE_URL).toString()
    : `/api/v1/dream/facilities?${params}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("어린이 센터를 불러오지 못했습니다.");

  const payload: { items: ApiFacility[] } = await response.json();
  return payload.items.flatMap((item) =>
    item.lat === null || item.lng === null
      ? []
      : [{
          id: item.id,
          name: item.name,
          facilityType: item.facility_type,
          neighborhoodName: item.district,
          lat: item.lat,
          lng: item.lng,
          donationCount: 0,
          currentAmount: 0,
          targetAmount: 0,
        }],
  );
}
