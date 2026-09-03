import { NextResponse } from "next/server";

// 카카오 Local 키워드검색 — 역명/아파트명 같은 POI를 좌표로 바꿔준다.
// (네이버 Geocoding은 정식 주소만 찾아서 "거래 희망 장소" 같은 값엔 못 씀)
interface KakaoKeywordDocument {
  place_name: string;
  x: string; // lng
  y: string; // lat
}

interface KakaoKeywordResponse {
  documents: KakaoKeywordDocument[];
}

async function searchKeyword(
  query: string,
  apiKey: string,
  near?: { x: string; y: string },
): Promise<KakaoKeywordDocument | null> {
  const params = new URLSearchParams({ query, size: "1" });
  // near를 주면 정렬을 그 좌표 쪽으로 살짝 기울인다(하드 반경 필터는 아님) — trade_place가
  // "<직거래>"처럼 실제 장소가 아닌 값일 때 엉뚱한 지역(예: 전혀 다른 도시) 매칭을 줄여줌.
  if (near) {
    params.set("x", near.x);
    params.set("y", near.y);
  }
  const res = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Kakao API error ${res.status}`);
  }
  const data: KakaoKeywordResponse = await res.json();
  return data.documents?.[0] ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  // 항상 존재하는 동네 이름(neighborhood_name) — query 검색의 지역 편향 기준점으로 쓰고,
  // query가 아예 매칭 안 되면 최종 폴백으로도 쓴다.
  const fallback = searchParams.get("fallback")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const kakaoApiKey = process.env.KAKAO_REST_API_KEY?.trim();
  if (!kakaoApiKey) {
    return NextResponse.json({ error: "Kakao API key not configured" }, { status: 503 });
  }

  try {
    const anchor = fallback ? await searchKeyword(fallback, kakaoApiKey) : null;
    const near = anchor ? { x: anchor.x, y: anchor.y } : undefined;

    let place = await searchKeyword(query, kakaoApiKey, near);
    let matched: "query" | "fallback" = "query";
    if (!place && anchor) {
      place = anchor;
      matched = "fallback";
    }
    if (!place) {
      return NextResponse.json({ error: "No match" }, { status: 404 });
    }
    return NextResponse.json({
      name: place.place_name,
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      matched,
    });
  } catch (error) {
    console.error("[Kakao geocode] Fetch failed:", error);
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
