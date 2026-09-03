import { NextResponse } from "next/server";
import { getFallbackRestaurants } from "@/services/restaurantService";

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
  place_url: string;
  distance: string;
}

interface KakaoCategorySearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
    same_name: any;
  };
  documents: KakaoPlaceDocument[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const swLat = parseFloat(searchParams.get("swLat") ?? "0");
  const swLng = parseFloat(searchParams.get("swLng") ?? "0");
  const neLat = parseFloat(searchParams.get("neLat") ?? "0");
  const neLng = parseFloat(searchParams.get("neLng") ?? "0");
  const requestedLimit = parseInt(searchParams.get("limit") ?? "45", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 45) : 45;

  if (!swLat || !swLng || !neLat || !neLng) {
    return NextResponse.json({ error: "Missing coordinates bounds" }, { status: 400 });
  }

  const minLat = Math.min(swLat, neLat);
  const maxLat = Math.max(swLat, neLat);
  const minLng = Math.min(swLng, neLng);
  const maxLng = Math.max(swLng, neLng);

  const kakaoApiKey = process.env.KAKAO_REST_API_KEY?.trim();

  // 1. 카카오 REST API 키가 등록되어 있는 경우: 카카오 Local 카테고리 검색(FD6) 실시간 호출
  if (kakaoApiKey) {
    try {
      // 카카오 rect 포맷: 좌측하단경도,좌측하단위도,우측상단경도,우측상단위도 (minLng,minLat,maxLng,maxLat)
      const rect = `${minLng},${minLat},${maxLng},${maxLat}`;
      const allPlaces: KakaoPlaceDocument[] = [];

      // 최대 3페이지(페이지당 15개, 최대 45개) 조회
      const maxPages = Math.min(3, Math.ceil(limit / 15));
      for (let page = 1; page <= maxPages; page++) {
        const params = new URLSearchParams({
          category_group_code: "FD6", // 음식점 카테고리
          rect,
          size: "15",
          page: String(page),
        });

        const res = await fetch(`https://dapi.kakao.com/v2/local/search/category.json?${params}`, {
          headers: {
            Authorization: `KakaoAK ${kakaoApiKey}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          console.error(`[Kakao Local API] Error: ${res.status} ${res.statusText}`);
          break;
        }

        const data: KakaoCategorySearchResponse = await res.json();
        if (data.documents && Array.isArray(data.documents)) {
          allPlaces.push(...data.documents);
        }

        // 더 이상 다음 페이지가 없으면 루프 종료
        if (data.meta?.is_end) {
          break;
        }
      }

      if (allPlaces.length > 0) {
        const normalizedRestaurants = allPlaces.slice(0, limit).map((place) => {
          // "음식점 > 한식 > 육류,고기" -> "한식" 또는 서브 카테고리 추출
          const categoryParts = place.category_name.split(" > ");
          const simplifiedCategory = categoryParts.length > 1 ? categoryParts.slice(1).join(" · ") : place.category_name;

          return {
            id: `kakao-${place.id}`,
            name: place.place_name,
            category: simplifiedCategory,
            address: place.address_name,
            roadAddress: place.road_address_name || place.address_name,
            phone: place.phone,
            lat: parseFloat(place.y),
            lng: parseFloat(place.x),
            placeUrl: place.place_url,
            naverUrl: `https://map.naver.com/v5/search/${encodeURIComponent(place.place_name)}`,
            source: "kakao_local_api",
          };
        });

        return NextResponse.json({
          source: "kakao_local_api",
          count: normalizedRestaurants.length,
          restaurants: normalizedRestaurants,
        });
      }
    } catch (error) {
      console.error("[Kakao Local API] Fetch failed:", error);
    }
  }

  // 2. 키가 아직 없거나 API 실패 시: 부드러운 테스트 및 시연을 위한 Fallback 데이터 반환
  const fallbackList = getFallbackRestaurants({ minLat, maxLat, minLng, maxLng, limit });

  return NextResponse.json({
    source: kakaoApiKey ? "fallback_after_error" : "fallback_no_api_key",
    count: fallbackList.length,
    restaurants: fallbackList,
  });
}
