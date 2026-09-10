import { NextResponse } from "next/server";
import {
  WorkoutFacility,
  getFallbackWorkoutFacilities,
  categorizeFacility,
  getCategoryWorkoutImage,
  WORKOUT_SUB_CATEGORIES,
} from "@/services/workoutService";

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

interface KakaoKeywordSearchResponse {
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
  documents: KakaoPlaceDocument[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const swLat = parseFloat(searchParams.get("swLat") || "0");
  const swLng = parseFloat(searchParams.get("swLng") || "0");
  const neLat = parseFloat(searchParams.get("neLat") || "0");
  const neLng = parseFloat(searchParams.get("neLng") || "0");
  const subCategory = searchParams.get("subCategory") || "all";
  const userQuery = searchParams.get("query") || "";

  // 1. 유효성 검사
  const hasValidBounds =
    swLat !== 0 &&
    swLng !== 0 &&
    neLat !== 0 &&
    neLng !== 0 &&
    !isNaN(swLat) &&
    !isNaN(swLng) &&
    !isNaN(neLat) &&
    !isNaN(neLng);

  const fallbackParams = {
    swLat: hasValidBounds ? swLat : undefined,
    swLng: hasValidBounds ? swLng : undefined,
    neLat: hasValidBounds ? neLat : undefined,
    neLng: hasValidBounds ? neLng : undefined,
    subCategory,
  };

  const kakaoApiKey =
    process.env.KAKAO_REST_API_KEY ||
    process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

  if (!kakaoApiKey) {
    console.warn("[WorkoutAPI] No Kakao API Key detected, returning fallbacks.");
    return NextResponse.json({
      facilities: getFallbackWorkoutFacilities(fallbackParams),
      source: "fallback_no_key",
    });
  }

  // 2. 검색 키워드 결정
  let searchKeywords: string[] = [];
  if (userQuery.trim()) {
    searchKeywords = [userQuery.trim()];
  } else {
    const matchedCategory = WORKOUT_SUB_CATEGORIES.find((c) => c.id === subCategory);
    if (matchedCategory && matchedCategory.id !== "all") {
      searchKeywords = matchedCategory.query.split(" ");
    } else {
      // 'all'일 때는 대표적인 운동 키워드 복수 검색
      searchKeywords = ["헬스장", "필라테스", "체육관"];
    }
  }

  try {
    const minLng = Math.min(swLng, neLng);
    const minLat = Math.min(swLat, neLat);
    const maxLng = Math.max(swLng, neLng);
    const maxLat = Math.max(swLat, neLat);

    const rectParam = hasValidBounds ? `${minLng},${minLat},${maxLng},${maxLat}` : undefined;

    // 키워드별 병렬 조회 (최대 2~3개 키워드)
    const targetKeywords = searchKeywords.slice(0, 3);
    const searchPromises = targetKeywords.map(async (kw) => {
      const params = new URLSearchParams({
        query: kw,
        size: "15",
        sort: "accuracy",
      });
      if (rectParam) {
        params.append("rect", rectParam);
      }

      const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`, {
        headers: {
          Authorization: `KakaoAK ${kakaoApiKey}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        return [];
      }

      const json: KakaoKeywordSearchResponse = await res.json();
      return json.documents || [];
    });

    const resultsArray = await Promise.all(searchPromises);
    const rawDocuments = resultsArray.flat();

    // 중복 제거 (place id 기준)
    const uniqueDocsMap = new Map<string, KakaoPlaceDocument>();
    for (const doc of rawDocuments) {
      if (!uniqueDocsMap.has(doc.id)) {
        uniqueDocsMap.set(doc.id, doc);
      }
    }

    if (uniqueDocsMap.size === 0) {
      return NextResponse.json({
        facilities: getFallbackWorkoutFacilities(fallbackParams),
        source: "fallback_empty_result",
      });
    }

    // 문서 -> WorkoutFacility 변환
    const facilities: WorkoutFacility[] = Array.from(uniqueDocsMap.values()).map((doc) => {
      const lat = parseFloat(doc.y);
      const lng = parseFloat(doc.x);
      const { category, subCategory: derivedSub } = categorizeFacility(
        doc.category_name || "",
        doc.place_name
      );

      // 모의 평점 및 리뷰 수 (카카오 로컬 API에 리뷰수/평점 미포함 시 자연스러운 당근 체감형 메트릭 생성)
      const hash = doc.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const rating = Number((4.5 + (hash % 50) / 100).toFixed(2)); // 4.50 ~ 4.99
      const reviewCount = (hash % 180) + 15; // 15 ~ 195

      const defaultTags: string[] = [];
      if (hash % 2 === 0) defaultTags.push("샤워시설");
      if (hash % 3 === 0) defaultTags.push("주차 무료");
      if (hash % 5 === 0) defaultTags.push("24시 운영");
      if (defaultTags.length === 0) defaultTags.push("전문 강사진");

      return {
        id: `kakao_${doc.id}`,
        name: doc.place_name,
        category,
        subCategory: derivedSub,
        address: doc.address_name,
        roadAddress: doc.road_address_name || doc.address_name,
        lat,
        lng,
        placeUrl: doc.place_url,
        phone: doc.phone || undefined,
        distance: doc.distance ? `${doc.distance}m` : undefined,
        rating,
        reviewCount,
        monthlyPrice: derivedSub === "pilates" ? "회당 2만원~" : derivedSub === "swimming" ? "월 5만원~" : "월 3.5만원~",
        benefit: hash % 3 === 0 ? "당근 회원 일일권 10% 할인" : undefined,
        tags: defaultTags,
        imageUrl: getCategoryWorkoutImage(derivedSub),
      };
    });

    // 선택된 서브카테고리가 'all'이 아니면 필터링
    let filteredFacilities = facilities;
    if (subCategory && subCategory !== "all") {
      filteredFacilities = facilities.filter((f) => f.subCategory === subCategory);
      if (filteredFacilities.length === 0) {
        // 필터링 결과가 없으면 전체 반환 또는 폴백
        filteredFacilities = facilities;
      }
    }

    return NextResponse.json({
      facilities: filteredFacilities,
      source: "kakao_local_api",
      count: filteredFacilities.length,
    });
  } catch (error: any) {
    console.error("[WorkoutAPI] Failed to fetch from Kakao:", error);
    return NextResponse.json({
      facilities: getFallbackWorkoutFacilities(fallbackParams),
      source: "fallback_error",
    });
  }
}
