"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTransitStops, type TransitBounds, type TransitKind, type TransitResponse } from "@/services/transitService";

const LOCAL_BIKE_FALLBACK: TransitResponse = {
  total: 12,
  source: "local-development-fallback",
  fetched_at: new Date().toISOString(),
  items: ([
    ["문래역 4번출구 앞", 37.5172, 126.8946, 2, 10],
    ["문래동 주민센터", 37.5173, 126.8947, 11, 15],
    ["문래동 꽃밭정원", 37.5158, 126.8969, 16, 10],
    ["문래현대2차", 37.5160, 126.8971, 30, 10],
    ["영등포유통상가 사거리", 37.5142, 126.9030, 1, 11],
    ["영등포청과시장 사거리", 37.5139, 126.9050, 3, 10],
    ["당산역 3번출구", 37.5348, 126.9026, 8, 12],
    ["당산역 4번출구", 37.5349, 126.9028, 14, 12],
    ["신정교 하부", 37.5188, 126.8828, 23, 10],
    ["문래동 롯데캐슬", 37.5206, 126.8901, 71, 10],
    ["에이스하이테크시티", 37.5145, 126.8954, 1, 10],
    ["근로자회관 사거리", 37.5117, 126.8918, 13, 12],
  ] as Array<[string, number, number, number, number]>).map(([name, lat, lng, bikes_available, racks], index) => ({
    id: `local-bike-${index}`,
    kind: "bike" as const,
    name,
    lat,
    lng,
    line: null,
    bikes_available,
    racks,
  })),
};

export function useTransitStops(kind: TransitKind | null, bounds: TransitBounds | null, query: string) {
  const [snapshot, setSnapshot] = useState<{ key: string; data: TransitResponse | null; error: string; loading: boolean } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const key = kind && bounds ? `${kind}:${bounds.south}:${bounds.west}:${bounds.north}:${bounds.east}` : "";

  useEffect(() => {
    if (!kind || !bounds) return;
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      setSnapshot((previous) => ({ key, data: previous?.key === key ? previous.data : null, error: "", loading: true }));
      try {
        const data = await fetchTransitStops(kind, bounds, controller.signal);
        if (!controller.signal.aborted) setSnapshot({ key, data, error: "", loading: false });
      } catch (error) {
        if (!controller.signal.aborted) {
          const fallback = process.env.NODE_ENV !== "production" && kind === "bike" ? LOCAL_BIKE_FALLBACK : null;
          setSnapshot({
            key,
            data: fallback,
            error: fallback ? "" : error instanceof Error ? error.message : "교통정보를 불러오지 못했어요.",
            loading: false,
          });
        }
      } finally { inFlight = false; }
    };
    const timer = window.setTimeout(load, 250);
    const interval = kind === "bike" ? window.setInterval(load, 60_000) : null;
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [kind, bounds, key, refresh]);

  const current = snapshot?.key === key ? snapshot : null;
  const data = current?.data ?? null;
  const stops = useMemo(() => {
    const term = query.trim().toLocaleLowerCase().replace(/\s/g, "");
    return (data?.items ?? []).filter((stop) => `${stop.name}${stop.line ?? ""}`.toLocaleLowerCase().replace(/\s/g, "").includes(term));
  }, [data, query]);
  return { stops, total: data?.total ?? 0, fetchedAt: data?.fetched_at ?? null, loading: Boolean(kind && (!current || current.loading)), error: current?.error ?? "", retry: useCallback(() => setRefresh((value) => value + 1), []) };
}
