import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const kind = incoming.searchParams.get("kind");
  if (kind !== "subway" && kind !== "bike") return NextResponse.json({ error: "교통 항목을 확인해 주세요." }, { status: 400 });
  const keys = ["sw_lat", "sw_lng", "ne_lat", "ne_lng"];
  const values = keys.map((key) => incoming.searchParams.get(key));
  if (values.some((v) => v === null || v.trim() === "" || !Number.isFinite(Number(v)))) {
    return NextResponse.json({ error: "지도 범위가 필요해요." }, { status: 400 });
  }
  const [south, west, north, east] = values.map(Number);
  if (!(south >= -90 && south < north && north <= 90 && west >= -180 && west < east && east <= 180)) {
    return NextResponse.json({ error: "지도 범위를 확인해 주세요." }, { status: 400 });
  }
  const base = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return NextResponse.json({ error: "교통정보 연결을 준비 중이에요." }, { status: 503 });
  try {
    const url = new URL("/api/v1/local/transit", base);
    if (url.origin === incoming.origin) return NextResponse.json({ error: "교통정보 연결을 확인해 주세요." }, { status: 503 });
    url.searchParams.set("kind", kind);
    keys.forEach((key, i) => url.searchParams.set(key, values[i]!));
    url.searchParams.set("limit", "120");
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(45_000) });
    if (!response.ok) return NextResponse.json({ error: "교통정보를 불러오지 못했어요." }, { status: 503 });
    return NextResponse.json(await response.json(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "교통정보 서버에 연결하지 못했어요." }, { status: 503 });
  }
}
