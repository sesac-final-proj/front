"use client";
import dynamic from "next/dynamic";
import { adminAuthorizedFetch, type PricePlatformComparisonItem } from "@/services/adminService";
import { useAdminResource } from "../useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "../AdminUI";
import { ComparisonCharts } from "../ComparisonCharts";
import { reviewComparisons, PLATFORMS } from "../comparison-data";
import styles from "../portal.module.css";
const ComparisonSpace = dynamic(() => import("../ComparisonSpace"), { ssr: false });
interface ComparisonData { items: PricePlatformComparisonItem[]; source: string; period: string; caveat: string }
async function load(): Promise<ComparisonData> {
  const response = await adminAuthorizedFetch("/api/v1/admin/external-comparison");
  if (!response.ok) throw new Error("플랫폼 비교 데이터를 불러오지 못했습니다.");
  return response.json();
}
export default function ExternalComparisonSection() {
  const { data, loading, error, retry } = useAdminResource(load);
  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState message={error} retry={retry} />;
  const reviewed = reviewComparisons(data.items);
  return <section className={styles.card}><h2>당근 · 중고나라 · 번개장터 외부 비교</h2><p>{data.source} · {data.period}</p>
    <p>{data.caveat}</p>
    {!!reviewed.excluded && <p role="status">검증에서 제외된 통계 {reviewed.excluded}행: 중복 플랫폼·품목 또는 유효하지 않은 표본·사분위 값.</p>}
    <p>{PLATFORMS.map(platform => `${platform} ${reviewed.rows.filter(row => row.platform === platform).length}개 품목`).join(" · ")}</p>
    {reviewed.rows.length ? <><ComparisonCharts rows={reviewed.rows} /><ComparisonSpace rows={reviewed.rows} />
      <h3>비교 원본 수치</h3><AdminTable headers={["품목", "플랫폼", "표본", "Q1(원)", "중앙값(원)", "Q3(원)"]}>{reviewed.rows.map(row => <tr key={`${row.category}|${row.platform}`}><td>{row.category}</td><td>{row.platform}</td><td>{row.sample_count.toLocaleString()}</td><td>{row.p25_price.toLocaleString()}</td><td>{row.median_price.toLocaleString()}</td><td>{row.p75_price.toLocaleString()}</td></tr>)}</AdminTable>
    </> : <p>DB에 비교 가능한 플랫폼 가격 통계가 없습니다.</p>}
    <p>Silhouette score: 현재 응답은 집계 통계이며 관측치별 군집 라벨·특성 행렬이 없어 산출 불가.</p>
  </section>;
}
