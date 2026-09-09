import { NextResponse } from "next/server";

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

    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "꿈가지 시설 서버에 연결하지 못했어요." }, { status: 503 });
  }
}
