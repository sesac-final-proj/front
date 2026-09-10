"use client";
import { getPriceModelMetrics } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "./AdminUI";
import styles from "./portal.module.css";
export function ModelMetricsPanel() {
  const { data, loading, error, retry } = useAdminResource(getPriceModelMetrics);
  return <article className={styles.card}><h2>모델 성능 비교</h2><p>R²는 비율이 아닌 결정계수이며 음수도 가능합니다. 오차는 낮을수록 좋습니다.</p>
    {loading ? <Skeleton /> : error ? <ErrorState message={error} retry={retry} /> :
    <AdminTable headers={["피처셋", "모델", "R²", "RMSE(원)", "MAE(원)", "MAPE", "Hit@10%", "Hit@20%"]}>{(data?.metrics ?? []).map(row => <tr key={row.feature_set + row.model_key}><td>{row.feature_set}</td><td>{row.label}</td><td>{row.r2.toFixed(3)}</td><td>{Math.round(row.rmse).toLocaleString()}</td><td>{Math.round(row.mae).toLocaleString()}</td><td>{(row.mape * 100).toFixed(1)}%</td><td>{(row.hit10 * 100).toFixed(1)}%</td><td>{(row.hit20 * 100).toFixed(1)}%</td></tr>)}</AdminTable>}
  </article>;
}
