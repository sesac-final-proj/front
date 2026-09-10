import { NextResponse } from "next/server";

interface FacilityItem {
  name: string;
  district_rank?: number | null;
  is_selected?: boolean;
  is_representative?: boolean;
  address?: string | null;
  phone?: string | null;
}

interface FacilityResponse {
  items?: FacilityItem[];
  total?: number;
  geocoded_count?: number;
  [key: string]: unknown;
}

interface KakaoPlace {
  place_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
}

function normalizePlaceName(value: string) {
  return value.replace(/[^0-9A-Za-z가-힣]/g, "").toLowerCase();
}

async function findKakaoPlace(name: string, district: string, apiKey: string): Promise<KakaoPlace | null> {
  const params = new URLSearchParams({ query: `${district} ${name}`, size: "5" });
  const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) return null;

  const payload: { documents?: KakaoPlace[] } = await response.json();
  const expectedName = normalizePlaceName(name);
  const districtMatches = (payload.documents ?? []).filter((place) =>
    `${place.road_address_name} ${place.address_name}`.includes(district),
  );
  return districtMatches.find((place) => {
    const candidateName = normalizePlaceName(place.place_name);
    return candidateName.includes(expectedName) || expectedName.includes(candidateName);
  }) ?? districtMatches[0] ?? null;
}

async function enrichMissingContact(facility: FacilityItem, district: string, apiKey: string) {
  if (facility.address?.trim() && facility.phone?.trim()) return facility;

  try {
    const place = await findKakaoPlace(facility.name, district, apiKey);
    if (!place) return facility;
    return {
      ...facility,
      address: facility.address?.trim() || place.road_address_name || place.address_name || null,
      phone: facility.phone?.trim() || place.phone || null,
    };
  } catch {
    return facility;
  }
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const district = incoming.searchParams.get("district")?.trim();

  if (!district) {
    return NextResponse.json({ error: "지역을 확인해 주세요." }, { status: 400 });
  }

  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  try {
    const url = new URL("/api/v1/dream/facilities", base);
    if (url.origin === incoming.origin) {
      return NextResponse.json({ error: "꿈가지 시설 서비스 연결을 확인해 주세요." }, { status: 503 });
    }

    incoming.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
      return NextResponse.json({ error: "어린이 시설을 불러오지 못했어요." }, { status: 503 });
    }

    const payload: FacilityResponse = await response.json();
    const allFacilities = [...(payload.items ?? [])];
    const ranked = allFacilities
      .filter((item) => item.is_selected)
      .sort((a, b) => (a.district_rank ?? Number.MAX_SAFE_INTEGER) - (b.district_rank ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 2);
    const fallbackRanked = allFacilities
      .filter((item) => !ranked.includes(item))
      .sort((a, b) => (a.district_rank ?? Number.MAX_SAFE_INTEGER) - (b.district_rank ?? Number.MAX_SAFE_INTEGER));
    const priorityFacilities = [...ranked, ...fallbackRanked].slice(0, 2).map((item, index) => ({
      ...item,
      district_rank: item.district_rank ?? index + 1,
      is_selected: true,
      is_representative: true,
    }));
    const kakaoApiKey = process.env.KAKAO_REST_API_KEY?.trim();
    const items = kakaoApiKey
      ? await Promise.all(priorityFacilities.map((item) => enrichMissingContact(item, district, kakaoApiKey)))
      : priorityFacilities;

    return NextResponse.json({ ...payload, items, total: items.length }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "꿈가지 시설 서버에 연결하지 못했어요." }, { status: 503 });
  }
}
