export type TransitKind = "subway" | "bike";

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
