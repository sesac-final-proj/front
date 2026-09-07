export type TransitKind = "subway" | "bike";

const SUBWAY_LINE_COLORS: Record<string, string> = {
  "1호선": "#0052a4",
  "2호선": "#00a84d",
  "3호선": "#ef7c1c",
  "4호선": "#00a5de",
  "5호선": "#996cac",
  "6호선": "#cd7c2f",
  "7호선": "#747f00",
  "8호선": "#e51e25",
  "9호선": "#bdb092",
  "경의중앙선": "#77c4a3",
  "수인분당선": "#fabe00",
  "신분당선": "#d4003b",
  "경춘선": "#0c8e72",
  "공항철도": "#0090d2",
  "우이신설선": "#b7c452",
  "의정부경전철": "#fd8100",
  "김포골드라인": "#ad8605",
  "인천1호선": "#759cce",
  "인천2호선": "#f5a251",
};

export function getSubwayLineNames(line: string | null): string[] {
  return (line ?? "").split(/[,/·]|\s+(?=(?:경의중앙선|수인분당선|신분당선|공항철도|우이신설선|김포골드라인|\d+호선))/).map((value) => value.trim()).filter(Boolean);
}

export function getSubwayLineColor(line: string): string {
  return SUBWAY_LINE_COLORS[line] ?? "#6b7280";
}

export interface TransitBounds {
  south: number;
  north: number;
  west: number;
  east: number;
}

export interface TransitStop {
  id: string;
  kind: TransitKind;
  name: string;
  lat: number;
  lng: number;
  line: string | null;
  bikes_available: number | null;
  racks: number | null;
}

export interface TransitResponse {
  items: TransitStop[];
  total: number;
  fetched_at: string;
  source: string;
}

export async function fetchTransitStops(kind: TransitKind, bounds: TransitBounds, signal: AbortSignal): Promise<TransitResponse> {
  const params = new URLSearchParams({
    kind,
    sw_lat: String(bounds.south), sw_lng: String(bounds.west),
    ne_lat: String(bounds.north), ne_lng: String(bounds.east),
    limit: "120",
  });
  const response = await fetch(`/api/v1/local/transit?${params}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error("교통정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  const data = await response.json() as TransitResponse;
  if (!Array.isArray(data.items) || !Number.isFinite(data.total) || !Number.isFinite(Date.parse(data.fetched_at))) {
    throw new Error("교통정보 응답을 확인하지 못했어요.");
  }
  return data;
}
