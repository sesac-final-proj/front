"use client";
import { useCallback, useEffect, useState } from "react";

export function useAdminResource<T>(loader: () => Promise<T>) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string }>({ data: null, loading: true, error: "" });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    loader().then(data => { if (active) setState({ data, loading: false, error: "" }); })
      .catch(error => { if (active) setState({ data: null, loading: false, error: error instanceof Error ? error.message : "데이터를 불러오지 못했습니다." }); });
    return () => { active = false; };
  }, [loader, revision]);
  const retry = useCallback(() => {
    setState({ data: null, loading: true, error: "" });
    setRevision(value => value + 1);
  }, []);
  return { ...state, retry };
}
