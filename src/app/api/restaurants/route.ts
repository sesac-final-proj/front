import { NextResponse } from "next/server";
import { getFallbackRestaurants, getCategoryFallbackImage } from "@/services/restaurantService";

interface KakaoPlaceDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  roadAddress?: string;
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

// In-memory cache to ensure instant response times for repeated places
interface PlaceImageData {
  thumbnailUrl: string;
  images: string[];
}

const imageCache = new Map<string, PlaceImageData>();

async function fetchPlaceImages(
  kakaoApiKey: string,
  placeName: string,
  addressName: string,
  category: string,
): Promise<PlaceImageData> {
  const cacheKey = `${placeName}|${addressName}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const region = addressName.split(/\s+/).slice(0, 2).join(" ");
    const query = `${region} ${placeName}`.trim();
    const params = new URLSearchParams({
      query,
      size: "5",
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1400);

    const res = await fetch(`https://dapi.kakao.com/v2/search/image?${params}`, {
      headers: {
        Authorization: `KakaoAK ${kakaoApiKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      const docs = data.documents || [];
      const imageUrls: string[] = docs
        .map((d: any) => d.thumbnail_url || d.image_url)
        .filter(Boolean);

      if (imageUrls.length > 0) {
        const result: PlaceImageData = {
          thumbnailUrl: imageUrls[0],
          images: imageUrls,
        };
        imageCache.set(cacheKey, result);
        if (imageCache.size > 2000) {
          const firstKey = imageCache.keys().next().value;
          if (firstKey) imageCache.delete(firstKey);
        }
        return result;
      }
    }
  } catch {
    // Ignore timeout / network errors and gracefully use category fallback image
  }

  const fallback = getCategoryFallbackImage(category);
  return {
    thumbnailUrl: fallback,
    images: [fallback],
  };
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
        const topPlaces = allPlaces.slice(0, limit);

        // 카카오 이미지 검색 API를 통해 대표 사진 및 갤러리 이미지 병렬 조회
        const imagePromises = topPlaces.map((place) => {
          const categoryParts = place.category_name.split(" > ");
          const simplifiedCategory = categoryParts.length > 1 ? categoryParts.slice(1).join(" · ") : place.category_name;
          return fetchPlaceImages(kakaoApiKey, place.place_name, place.address_name, simplifiedCategory);
        });

        const imageResults = await Promise.all(imagePromises);

        const normalizedRestaurants = topPlaces.map((place, idx) => {
          // "음식점 > 한식 > 육류,고기" -> "한식" 또는 서브 카테고리 추출
          const categoryParts = place.category_name.split(" > ");
          const simplifiedCategory = categoryParts.length > 1 ? categoryParts.slice(1).join(" · ") : place.category_name;
          const imgData = imageResults[idx] || { thumbnailUrl: getCategoryFallbackImage(simplifiedCategory), images: [] };

          // 실제 당근마켓처럼 자연스러운 별점 / 후기 / 단골 / 혜택 데이터
          const hash = Array.from(place.id).reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const rating = Number((4.1 + (hash % 9) * 0.1).toFixed(1));
          const reviewCount = 7 + (hash % 42);
          const regularCount = 1 + (hash % 9);
          const benefits = [
            "얼음생맥주 서비스쿠폰 (리뷰이벤트)",
            "음료수 1캔 무료 증정 (방문인증)",
            "테이블당 사이드메뉴 1개 서비스",
            "단골 전용 1,000원 할인 쿠폰",
          ];
          const benefit = benefits[hash % benefits.length];

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
            imageUrl: imgData.thumbnailUrl,
            thumbnailUrl: imgData.thumbnailUrl,
            images: imgData.images.length > 0 ? imgData.images : [imgData.thumbnailUrl],
            rating,
            reviewCount,
            regularCount,
            benefit,
            tags: ["지역화폐", "주차가능"],
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
