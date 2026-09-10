"use client";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { getPriceModelMetrics, type PriceModelMetricItem } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import styles from "@/app/admin/admin.module.css";

// R² 하나를 "꽉 찬 원 중 몇 %" 도넛으로 — 모델 4개(feature set × LightGBM/RandomForest)를
// 한 파이에 욱여넣으면 조각끼리 비교가 안 돼서(R²는 합이 100%인 값이 아님), 모델별로 따로 그린다.
function R2Donut({ item }: { item: PriceModelMetricItem }) {
  const pct = Math.round(item.r2 * 1000) / 10;
  const data = [{ name: "r2", value: pct }, { name: "rest", value: Math.max(0, 100 - pct) }];
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", width: 120, height: 120, margin: "0 auto" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={42} outerRadius={56} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
              <Cell fill="#FF6F0F" />
              <Cell fill="#F0F1ED" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: "#303629" }}>
          {pct}%
        </div>
      </div>
      <p style={{ fontSize: 11, color: "#656b60", marginTop: 6 }}>{item.feature_set} · {item.label}</p>
    </div>
  );
}

// 가격예측 모델(analyzer LightGBM/RandomForest) 학습 결과 — "최근 수집 거래" 원본 테이블 대신
// 여기서는 모델을 얼마나 잘 학습시켰는지가 더 유용한 정보라 이걸로 교체.
export function ModelMetricsPanel() {
  const { data, loading, error, retry } = useAdminResource(getPriceModelMetrics);
  const metrics = data?.metrics ?? [];

  return (
    <article className={styles.panel}>
      <div className={styles.panelHead}>
        <div><h3>모델 성능 비교</h3><p>feature set × 모델(LightGBM/RandomForest)별 R²</p></div>
      </div>
      {loading ? <p className={styles.empty}>불러오는 중…</p> : error ? <p className={styles.empty}>{error} <button type="button" onClick={retry}>다시 시도</button></p> : !metrics.length ? <p className={styles.empty}>학습된 모델 지표가 없습니다.</p> : <>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          {metrics.map(m => <R2Donut key={`${m.feature_set}-${m.model_key}`} item={m} />)}
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          {metrics.map(m => (
            <div key={`${m.feature_set}-${m.model_key}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11, color: "#656b60", borderBottom: "1px solid #F0F1ED", paddingBottom: 6 }}>
              <b style={{ color: "#303629", whiteSpace: "nowrap" }}>{m.feature_set} · {m.label}</b>
              <span style={{ textAlign: "right" }}>
                RMSE {Math.round(m.rmse).toLocaleString("ko-KR")}원 · MAE {Math.round(m.mae).toLocaleString("ko-KR")}원 · MAPE {(m.mape * 100).toFixed(1)}% · Hit@10 {(m.hit10 * 100).toFixed(0)}% · Hit@20 {(m.hit20 * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </>}
    </article>
  );
}
