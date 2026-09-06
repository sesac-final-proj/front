import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const values = ["sw_lat", "sw_lng", "ne_lat", "ne_lng"].map((key) => incoming.searchParams.get(key));
  if (values.some((value) => value === null || value.trim() === "" || !Number.isFinite(Number(value)))) {
    return NextResponse.json({ error: "지도 범위가 필요해요." }, { status: 400 });
  }
  const [south, west, north, east] = values.map(Number);
  if (south < -90 || north > 90 || west < -180 || east > 180 || south >= north || west >= east) {
    return NextResponse.json({ error: "지도 범위를 확인해 주세요." }, { status: 400 });
  }
  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return NextResponse.json({ error: "혼잡도 서버가 설정되지 않았어요." }, { status: 503 });
  try {
    const url = new URL("/api/v1/local/congestion-zones", base);
    ["sw_lat", "sw_lng", "ne_lat", "ne_lng"].forEach((key, index) => url.searchParams.set(key, values[index]!));
    url.searchParams.set("limit", "30");
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(25_000) });
    if (!response.ok) return NextResponse.json({ error: "혼잡도 정보를 확인하지 못했어요." }, { status: 503 });
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "혼잡도 서버에 연결하지 못했어요." }, { status: 503 });
  }
}
