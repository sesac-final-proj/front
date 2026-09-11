"use client";
import { adminAuthorizedFetch } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, ErrorState, MetricCard, Skeleton } from "./AdminUI";
import styles from "./portal.module.css";
interface PointSummaryData {
  earned: number; deducted: number; balance: number; basis: string; caveat: string;
  districts: { district: string; earned: number; deducted: number; balance: number; entries: number; users: number }[];
}
async function loadPoints(): Promise<PointSummaryData> {
  const response = await adminAuthorizedFetch("/api/v1/admin/point-summary");
  if (!response.ok) throw new Error("포인트 원장을 불러오지 못했습니다.");
  return response.json();
}
export function PointSummary() {
  const { data, loading, error, retry } = useAdminResource(loadPoints);
  if (loading) return <Skeleton />;
  if (!data || error) return <ErrorState message={error} retry={retry} />;
  return <article className={styles.card}><h2>구별 꿈방울 적립 현황</h2><p>{data.basis}</p>
    <div className={styles.metrics}>{[["누적 적립", data.earned], ["누적 차감", data.deducted], ["현재 잔액", data.balance]].map(([label, value]) => <MetricCard key={label} label={String(label)} value={`${Number(value).toLocaleString("ko-KR")} P`} detail="포인트 원장 집계" />)}</div>
    <AdminTable headers={["자치구", "적립(P)", "차감(P)", "잔액(P)", "원장 건수", "참여자"]}>{data.districts.map(row => <tr key={row.district}><td>{row.district}</td><td>{row.earned.toLocaleString()}</td><td>{row.deducted.toLocaleString()}</td><td>{row.balance.toLocaleString()}</td><td>{row.entries}</td><td>{row.users}</td></tr>)}</AdminTable>
    {!data.districts.length && <p>저장된 포인트 내역이 없습니다.</p>}<p>{data.caveat}</p>
  </article>;
}
