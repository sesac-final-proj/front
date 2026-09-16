import { NextResponse } from "next/server";

function isFiniteCoordinate(value: string | null, min: number, max: number) {
  if (value === null || value.trim() === "") return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max;
}

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const query = incoming.searchParams.get("query")?.trim() ?? "";
  const lat = incoming.searchParams.get("lat");
  const lng = incoming.searchParams.get("lng");
  const hour = incoming.searchParams.get("hour");
  const hasCoordinates = isFiniteCoordinate(lat, -90, 90) && isFiniteCoordinate(lng, -180, 180);

  if (!query && !hasCoordinates) {
    return NextResponse.json({ error: "추천 기준 위치가 필요해요." }, { status: 400 });
  }
  if ((lat !== null || lng !== null) && !hasCoordinates) {
    return NextResponse.json({ error: "위치 좌표를 확인해 주세요." }, { status: 400 });
  }
  if (query.length > 100) {
    return NextResponse.json({ error: "장소 검색어가 너무 길어요." }, { status: 400 });
  }
  if (hour !== null && (!Number.isInteger(Number(hour)) || Number(hour) < 0 || Number(hour) > 23)) {
    return NextResponse.json({ error: "시간 값을 확인해 주세요." }, { status: 400 });
  }

  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  try {
    const url = new URL("/api/v1/local/recommend-place", base);
    if (query) url.searchParams.set("query", query);
    if (hasCoordinates) {
      url.searchParams.set("lat", lat!);
      url.searchParams.set("lng", lng!);
    }
    if (hour !== null) url.searchParams.set("hour", hour);

    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(25_000) });
    if (!response.ok) {
      return NextResponse.json({ error: "추천 혼잡도를 확인하지 못했어요." }, { status: response.status === 400 ? 400 : 503 });
    }
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "혼잡도 추천 서버에 연결하지 못했어요." }, { status: 503 });
  }
}
