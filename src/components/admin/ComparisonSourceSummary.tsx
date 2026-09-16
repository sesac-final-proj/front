"use client";
import { adminAuthorizedFetch } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "./AdminUI";
interface Source { platform: string; file: string; missing?: boolean; rows?: number; accepted?: number; duplicates?: number; excluded?: number }
interface SourceData { source: string; period: string; sources: Source[] }
async function load(): Promise<SourceData> {
  const response = await adminAuthorizedFetch("/api/v1/admin/external-comparison");
  if (!response.ok) throw new Error("비교 원천의 집계 상태를 불러오지 못했습니다.");
  return response.json();
}
export function ComparisonSourceSummary() {
  const { data, loading, error, retry } = useAdminResource(load);
  if (loading) return <Skeleton />;
  if (!data || error) return <ErrorState message={error} retry={retry} />;
  return <div><h3>현재 가격 비교에 사용한 원천</h3><p>{data.source} · {data.period}</p>
    {data.sources.length ? <AdminTable headers={["플랫폼", "원천 파일", "전체 행", "가격 분석 행", "완전 중복", "가격·품목 제외", "점검"]}>
      {data.sources.map(row => <tr key={row.platform}><td>{row.platform}</td><td>{row.file}</td><td>{row.rows ?? "—"}</td><td>{row.accepted ?? "—"}</td><td>{row.duplicates ?? "—"}</td><td>{row.excluded ?? "—"}</td><td>{row.missing ? "원천 파일 연결 필요" : (row.excluded ?? 0) > 0 ? "무료·가격 미상·품목 누락 제외 내역 확인" : "집계 완료"}</td></tr>)}
    </AdminTable> : <p>DB 집계를 사용 중입니다. 원시 행별 제외 통계는 DB 집계에 포함돼 있지 않습니다.</p>}
  </div>;
}
