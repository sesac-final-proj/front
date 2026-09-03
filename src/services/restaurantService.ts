export interface Restaurant {
  id: string;
  name: string;
  category?: string;
  address?: string;
  roadAddress?: string;
  lat: number;
  lng: number;
  naverUrl?: string;
  placeUrl?: string;
  phone?: string;
  source?: string;
  distance?: string;
  rating?: number;
  reviewCount?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

export interface BoundsQueryParams {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
  limit?: number;
}

const SAMPLE_RESTAURANTS: Omit<Restaurant, "id">[] = [
  // 송파 / 잠실 / 가락 권역
  { name: "송파 감자탕", category: "한식", roadAddress: "서울 송파구 백제고분로 123", lat: 37.5052, lng: 127.1191 },
  { name: "래미안 돈까스", category: "일식", roadAddress: "서울 송파구 송파대로 300", lat: 37.5048, lng: 127.1180 },
  { name: "송파나루 파스타", category: "양식", roadAddress: "서울 송파구 오금로 18", lat: 37.5061, lng: 127.1174 },
  { name: "가락골 마라탕", category: "중식", roadAddress: "서울 송파구 송파대로 28길 10", lat: 37.5039, lng: 127.1165 },
  { name: "송파 숯불갈비", category: "고기/구이", roadAddress: "서울 송파구 백제고분로 45", lat: 37.5058, lng: 127.1205 },
  { name: "카페 온화 송파", category: "카페/디저트", roadAddress: "서울 송파구 백제고분로45길 21", lat: 37.5068, lng: 127.1189 },
  { name: "방이 편백 육편정", category: "한식", roadAddress: "서울 송파구 오금로11길 55", lat: 37.5074, lng: 127.1198 },
  { name: "송파 초밥명가", category: "일식", roadAddress: "서울 송파구 송파대로 32길 8", lat: 37.5032, lng: 127.1182 },

  // 위례 권역
  { name: "위례 중앙칼국수", category: "한식", roadAddress: "서울 송파구 위례광장로 270", lat: 37.4778, lng: 127.1441 },
  { name: "위례 스시노칸도", category: "일식", roadAddress: "서울 송파구 위례광장로 188", lat: 37.4765, lng: 127.1432 },
  { name: "위례 버거하우스", category: "패스트푸드", roadAddress: "서울 송파구 위례광장로 200", lat: 37.4782, lng: 127.1425 },
  { name: "위례 태국식당", category: "아시안", roadAddress: "서울 송파구 위례중앙로 43", lat: 37.4791, lng: 127.1448 },
  { name: "위례자이 베이커리", category: "카페/베이커리", roadAddress: "서울 송파구 위례광장로 130", lat: 37.4761, lng: 127.1418 },

  // 공릉 권역
  { name: "공릉 닭한마리", category: "한식", roadAddress: "서울 노원구 동일로192길 63", lat: 37.6261, lng: 127.0738 },
  { name: "공릉 우동명가", category: "일식", roadAddress: "서울 노원구 동일로 1000", lat: 37.6252, lng: 127.0725 },
  { name: "과기대앞 수제버거", category: "양식", roadAddress: "서울 노원구 공릉로 232", lat: 37.6270, lng: 127.0745 },
  { name: "공릉 철판닭갈비", category: "한식", roadAddress: "서울 노원구 동일로191가길 12", lat: 37.6248, lng: 127.0719 },

  // 영등포 / 당산 / 신도림 권역
  { name: "영등포시장 순대국", category: "한식 · 국밥", roadAddress: "서울 영등포구 영등포로 35길 8", lat: 37.5348, lng: 126.9031 },
  { name: "당산 옛날곱창", category: "한식", roadAddress: "서울 영등포구 당산로 200", lat: 37.5355, lng: 126.9022 },
  { name: "당산역 텐동 츠키", category: "일식", roadAddress: "서울 영등포구 양평로 44", lat: 37.5361, lng: 126.9015 },
  { name: "구로 곱창마을", category: "한식 · 구이", roadAddress: "서울 구로구 구로동로 12", lat: 37.5338, lng: 126.9042 },
  { name: "신도림 국밥명가", category: "한식", roadAddress: "서울 구로구 경인로 662", lat: 37.5342, lng: 126.9010 },
  { name: "당산2동 브런치카페", category: "카페/디저트", roadAddress: "서울 영등포구 당산로 180", lat: 37.5358, lng: 126.9039 },
];

export const CATEGORY_FOOD_IMAGES: Record<string, string> = {
  한식: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300&q=80",
  일식: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=80",
  중식: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300&q=80",
  양식: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&q=80",
  "카페/디저트": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=80",
  카페: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&q=80",
  분식: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=300&q=80",
  "고기/구이": "https://images.unsplash.com/photo-1544025162-d76694265947?w=300&q=80",
  기타: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&q=80",
};

export function getCategoryFallbackImage(category?: string): string {
  if (!category) return CATEGORY_FOOD_IMAGES.기타;
  for (const [key, url] of Object.entries(CATEGORY_FOOD_IMAGES)) {
    if (category.includes(key)) return url;
  }
  return CATEGORY_FOOD_IMAGES.기타;
}

export function getFallbackRestaurants({
  minLat,
  maxLat,
  minLng,
  maxLng,
  limit = 45,
}: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  limit?: number;
}): Restaurant[] {
  const results: Restaurant[] = [];

  SAMPLE_RESTAURANTS.forEach((item, index) => {
    if (item.lat >= minLat && item.lat <= maxLat && item.lng >= minLng && item.lng <= maxLng) {
      const fallbackImg = getCategoryFallbackImage(item.category);
      results.push({
        id: `sample-rest-${index}`,
        ...item,
        placeUrl: `https://map.naver.com/v5/search/${encodeURIComponent(item.name)}`,
        imageUrl: fallbackImg,
        thumbnailUrl: fallbackImg,
      });
    }
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  const categories = ["한식", "일식", "중식", "양식", "카페/디저트", "분식", "고기/구이", "술집/주점"];
  const names = [
    "동네 든든 밥집", "향긋한 커피공방", "바삭 돈카츠", "진한 곰탕집", "정통 화덕피자",
    "매콤 떡볶이", "생연어 초밥", "장작구이 통닭", "수제 햄버거", "달콤 와플하우스",
    "시원한 평양냉면", "얼큰 김치찌개", "불향 짬뽕", "고소한 라멘집", "가정식 백반"
  ];

  const countToGenerate = Math.min(25, limit - results.length);
  for (let i = 0; i < countToGenerate; i++) {
    const angle = i * 2.39996;
    const r = Math.sqrt((i + 1) / countToGenerate) * 0.4;
    const lat = centerLat + Math.sin(angle) * (latSpan * r);
    const lng = centerLng + Math.cos(angle) * (lngSpan * r);

    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      const name = `${names[i % names.length]} ${i + 1}호점`;
      const category = categories[i % categories.length];
      const fallbackImg = getCategoryFallbackImage(category);
      results.push({
        id: `dynamic-rest-${i}-${Math.round(lat * 10000)}`,
        name,
        category,
        roadAddress: `서울 주변 골목길 ${i + 12}번길`,
        lat,
        lng,
        naverUrl: `https://map.naver.com/v5/search/${encodeURIComponent(name)}`,
        placeUrl: `https://map.naver.com/v5/search/${encodeURIComponent(name)}`,
        imageUrl: fallbackImg,
        thumbnailUrl: fallbackImg,
        rating: 4.2 + ((i % 8) * 0.1),
        reviewCount: 12 + (i * 7),
      });
    }
  }

  return results.slice(0, limit);
}

/**
 * Bounds 범위 내의 음식점 목록을 조회합니다 (Next.js Server Route → 카카오 Local REST API).
 */
export async function getRestaurantsByBounds({
  swLat,
  swLng,
  neLat,
  neLng,
  limit = 45,
}: BoundsQueryParams): Promise<Restaurant[]> {
  const minLat = Math.min(swLat, neLat);
  const maxLat = Math.max(swLat, neLat);
  const minLng = Math.min(swLng, neLng);
  const maxLng = Math.max(swLng, neLng);

  try {
    const url = `/api/restaurants?swLat=${minLat}&swLng=${minLng}&neLat=${maxLat}&neLng=${maxLng}&limit=${limit}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json() as { source?: string; restaurants?: Restaurant[] };
      if (Array.isArray(data.restaurants) && data.restaurants.length > 0) {
        return data.restaurants.map((restaurant) => ({
          ...restaurant,
          source: restaurant.source ?? data.source,
        }));
      }
    }
  } catch (error) {
    console.warn("Client fallback triggered:", error);
  }

  return getFallbackRestaurants({ minLat, maxLat, minLng, maxLng, limit }).map((restaurant) => ({
    ...restaurant,
    source: restaurant.source ?? "fallback_client",
  }));
}
