"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchTransitStops, type TransitBounds, type TransitKind, type TransitResponse } from "@/services/transitService";

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
        if (!controller.signal.aborted) setSnapshot({ key, data: null, error: error instanceof Error ? error.message : "교통정보를 불러오지 못했어요.", loading: false });
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
