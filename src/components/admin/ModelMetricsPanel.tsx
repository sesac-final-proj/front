"use client";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { getPriceModelMetrics, type PriceModelMetricItem } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "./AdminUI";
import styles from "./portal.module.css";

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

type MetricRow = { label: string; format: (m: PriceModelMetricItem) => number; unit: string; better: "min" | "max" };

// 행 = 지표, 열 = 모델이라 "이 지표는 어느 모델이 제일 좋은가"를 가로로 훑어보기 쉽다.
// better에 따라 그 행에서 제일 좋은 값을 굵게+오렌지로 강조 — vs 비교표의 핵심.
const METRIC_ROWS: MetricRow[] = [
  { label: "R²", format: (m) => m.r2, unit: "", better: "max" },
  { label: "RMSE", format: (m) => m.rmse, unit: "원", better: "min" },
  { label: "MAE", format: (m) => m.mae, unit: "원", better: "min" },
  { label: "MAPE", format: (m) => m.mape * 100, unit: "%", better: "min" },
  { label: "Hit@10%", format: (m) => m.hit10 * 100, unit: "%", better: "max" },
  { label: "Hit@20%", format: (m) => m.hit20 * 100, unit: "%", better: "max" },
];

function formatMetricValue(row: MetricRow, value: number) {
  if (row.label === "R²") return value.toFixed(3);
  if (row.unit === "원") return `${Math.round(value).toLocaleString("ko-KR")}원`;
  if (row.unit === "%") return `${value.toFixed(1)}%`;
  return String(value);
}

// 가격예측 모델(analyzer LightGBM/RandomForest) 학습 결과 — "최근 수집 거래" 원본 테이블 대신
// 여기서는 모델을 얼마나 잘 학습시켰는지가 더 유용한 정보라 이걸로 교체.
export function ModelMetricsPanel() {
  const { data, loading, error, retry } = useAdminResource(getPriceModelMetrics);
  const metrics = data?.metrics ?? [];

  return (
    <article className={styles.card}>
      <h2>모델 성능 비교</h2>
      <p>feature set × 모델(LightGBM/RandomForest)별 R². 오차는 낮을수록, R²·Hit%는 높을수록 좋습니다.</p>
      {loading ? <Skeleton /> : error ? <ErrorState message={error} retry={retry} /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12, marginTop: 16 }}>
            {metrics.map(m => <R2Donut key={`${m.feature_set}-${m.model_key}`} item={m} />)}
          </div>
          <AdminTable headers={["지표", ...metrics.map(m => `${m.feature_set} · ${m.label}`)]}>
            {METRIC_ROWS.map(row => {
              const values = metrics.map(m => row.format(m));
              const bestValue = row.better === "min" ? Math.min(...values) : Math.max(...values);
              return (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  {metrics.map((m, i) => (
                    <td
                      key={`${m.feature_set}-${m.model_key}`}
                      style={values[i] === bestValue ? { color: "#FF6F0F", fontWeight: 700 } : undefined}
                    >
                      {formatMetricValue(row, values[i])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </AdminTable>
        </>
      )}
    </article>
  );
}
