import { NextResponse } from "next/server";

interface FacilityItem {
  id: string;
  name: string;
  district: string;
  facility_type: string;
  district_rank?: number | null;
  is_selected?: boolean;
  is_representative?: boolean;
  address?: string | null;
  phone?: string | null;
  homepage_url?: string | null;
  operation_status?: string | null;
  lat?: number | null;
  lng?: number | null;
  total_score?: number | null;
}

interface FacilityResponse {
  items?: FacilityItem[];
  total?: number;
  geocoded_count?: number;
  [key: string]: unknown;
}

const BUNDLED_FACILITIES: Record<string, FacilityItem[]> = {
  "송파구": [
    {
      id: "songpa-munjeong-1",
      name: "구립 문정1동 지역아동센터",
      district: "송파구",
      facility_type: "지역아동센터",
      address: "서울특별시 송파구 송이로32길 22 (문정동)",
      phone: "02-431-1319",
      homepage_url: "https://umppa.seoul.go.kr/icare/user/localCareResve/BD_selectLocalCareResve.do?q_fcltyId=SP200201&q_gubun=1",
      operation_status: "운영중",
      lat: 37.4857,
      lng: 127.1268,
      total_score: 100,
      district_rank: 1,
      is_selected: true,
      is_representative: true,
    },
    {
      id: "songpa-solbit",
      name: "솔빛지역아동센터",
      district: "송파구",
      facility_type: "지역아동센터",
      address: "서울특별시 송파구 성내천로18길 1, 2층 (거여동)",
      phone: "02-431-7979",
      homepage_url: "https://umppa.seoul.go.kr/icare/user/fcltyInfoManage/BD_selectFcltyInfoManage.do?q_fcltyId=SP200101&q_fclty=1003",
      operation_status: "운영중",
      lat: 37.4936,
      lng: 127.1454,
      total_score: 92,
      district_rank: 2,
      is_selected: true,
      is_representative: true,
    },
  ],
  "노원구": [
    {
      id: "nowon-public-1",
      name: "구립노원1지역아동센터",
      district: "노원구",
      facility_type: "지역아동센터",
      address: "서울특별시 노원구 월계로55길 16, 관리동 1층 (월계동)",
      phone: "02-972-0704",
      homepage_url: "https://umppa.seoul.go.kr/icare/user/fcltyInfoManage/BD_selectFcltyInfoManage.do?q_fcltyId=NW200194&q_fclty=1003",
      operation_status: "운영중",
      lat: 37.6317,
      lng: 127.0498,
      total_score: 100,
      district_rank: 1,
      is_selected: true,
      is_representative: true,
    },
    {
      id: "nowon-taereung",
      name: "태릉지역아동센터",
      district: "노원구",
      facility_type: "지역아동센터",
      address: "서울특별시 노원구 동일로174길 9-4, 2층 (공릉동)",
      phone: "070-8163-5591",
      homepage_url: "https://umppa.seoul.go.kr/icare/user/fcltyInfoManage/BD_selectFcltyInfoManage.do?q_fcltyId=NW200178&q_fclty=1003",
      operation_status: "운영중",
      lat: 37.6215,
      lng: 127.0754,
      total_score: 92,
      district_rank: 2,
      is_selected: true,
      is_representative: true,
    },
  ],
  "영등포구": [
    {
      id: "yeongdeungpo-pureureum",
      name: "구립푸르름지역아동센터",
      district: "영등포구",
      facility_type: "지역아동센터",
      address: "서울특별시 영등포구 영등포로64길 15 (신길동)",
      phone: "02-841-0818",
      homepage_url: "https://umppa.seoul.go.kr/icare/user/localCareResve/BD_selectLocalCareResve.do?q_fcltyId=YF200132&q_gubun=1",
      operation_status: "운영중",
      lat: 37.5075,
      lng: 126.9107,
      total_score: 100,
      district_rank: 1,
      is_selected: true,
      is_representative: true,
    },
    {
      id: "yeongdeungpo-donbosco",
      name: "돈보스코 자립생활관",
      district: "영등포구",
      facility_type: "아동자립지원시설",
      address: "서울특별시 영등포구 여의대방로 65 (신길동)",
      phone: null,
      homepage_url: "https://umppa.seoul.go.kr/icare/user/fcltyInfoManage/BD_selectFcltyInfoManage.do",
      operation_status: "운영중",
      lat: 37.4988,
      lng: 126.9172,
      total_score: 88,
      district_rank: 2,
      is_selected: true,
      is_representative: true,
    },
  ],
};

function bundledResponse(district: string) {
  const items = BUNDLED_FACILITIES[district];
  if (!items) return null;
  return NextResponse.json(
    {
      items,
      total: items.length,
      geocoded_count: items.length,
      source: "bundled_fallback",
      notice: "실시간 시설 서버 연결 전 저장된 선정 자료를 표시합니다.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
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
      return bundledResponse(district)
        ?? NextResponse.json({ error: "어린이 시설을 불러오지 못했어요." }, { status: 503 });
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
    return bundledResponse(district)
      ?? NextResponse.json({ error: "꿈가지 시설 서버에 연결하지 못했어요." }, { status: 503 });
  }
}
