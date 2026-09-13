"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import {
  getPriceModelShapSummary,
  type PriceFeatureImportanceItem,
  type PriceModelMetricItem,
  type PricePredictionItem,
} from "@/services/adminService";
import { getPricePredictionSummary } from "@/lib/admin/dashboard-api";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, EmptyState, ErrorState, Skeleton } from "./AdminUI";
import { HorizontalBars } from "./DashboardCharts";
import styles from "./portal.module.css";

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;

function PredictionScatter({ predictions }: { predictions: PricePredictionItem[] }) {
  const bestFeatureSet = predictions[0]?.feature_set;
  const rows = predictions.filter(p => p.feature_set === bestFeatureSet);
  if (!rows.length) return <EmptyState message="예측 결과가 없습니다." />;
  const maxPrice = Math.max(...rows.map(r => Math.max(r.actual_price, r.predicted_price)));
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="#F0F1ED" />
          <XAxis type="number" dataKey="actual_price" name="실제가" domain={[0, maxPrice]} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
          <YAxis type="number" dataKey="predicted_price" name="예측가" domain={[0, maxPrice]} tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
          <ZAxis range={[24, 24]} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: maxPrice, y: maxPrice }]} stroke="#E0453D" strokeWidth={1.5} strokeDasharray="4 4" ifOverflow="extendDomain" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
            const row = payload?.[0]?.payload as PricePredictionItem | undefined;
            if (!row) return null;
            return <div style={{ background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
              <b>{row.title}</b><br />실제 {money(row.actual_price)} · 예측 {money(row.predicted_price)}<br />오차율 {(row.error_rate * 100).toFixed(1)}%
            </div>;
          }} />
          <Scatter data={rows} fill="#FF6F0F" fillOpacity={0.55} isAnimationActive={false} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function FeatureImportanceCard({ items }: { items: PriceFeatureImportanceItem[] }) {
  const bestFeatureSet = items[0]?.feature_set;
  const top = items.filter(i => i.feature_set === bestFeatureSet).slice(0, 12).map(i => ({ name: i.feature, count: Math.round(i.gain) }));
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}><div><h2>Feature Importance</h2><p>gain 기준 상위 12개 · {bestFeatureSet}</p></div></div>
      <HorizontalBars data={top} />
    </article>
  );
}

function ShapSummaryCard() {
  const [featureSet, setFeatureSet] = useState<"full" | "no_leak_prone">("full");
  const loader = useCallback(() => getPriceModelShapSummary(featureSet), [featureSet]);
  const { data: blob, loading, error, retry } = useAdminResource(loader);
  const imageUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div><h2>SHAP 분석</h2><p>점 하나 = 매물 하나 · 오른쪽일수록 예측가를 높이는 방향으로 기여</p></div>
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {(["full", "no_leak_prone"] as const).map(fs => (
          <button
            key={fs}
            type="button"
            onClick={() => setFeatureSet(fs)}
            style={{
              padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 550,
              border: "1px solid #E7E8E5", background: featureSet === fs ? "#FF6F0F" : "#fff", color: featureSet === fs ? "#fff" : "#656b60",
            }}
          >
            {fs}
          </button>
        ))}
      </div>
      {loading ? <Skeleton /> : error || !imageUrl ? <ErrorState message={error || "이미지를 불러오지 못했습니다."} retry={retry} /> : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`SHAP summary plot (${featureSet})`} style={{ width: "100%", height: "auto", borderRadius: 8, background: "#fff" }} />
      )}
    </article>
  );
}

const OPTUNA_PARAM_LABELS: Record<string, string> = {
  learning_rate: "learning_rate",
  num_leaves: "num_leaves",
  max_depth: "max_depth",
  min_child_samples: "min_child_samples",
  subsample: "subsample",
  colsample_bytree: "colsample_bytree",
  reg_alpha: "reg_alpha",
  reg_lambda: "reg_lambda",
};

function OptunaParamsCard({ metrics }: { metrics: PriceModelMetricItem[] }) {
  const row = metrics.find(m => m.model_key === "lightgbm" && m.extra?.best_params);
  if (!row?.extra?.best_params) return <EmptyState message="탐색된 하이퍼파라미터가 없습니다." />;
  const params = row.extra.best_params;
  const entries = Object.entries(OPTUNA_PARAM_LABELS).map(([key, label]) => ({
    label,
    value: params[key as keyof typeof params],
  }));

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h2>Optuna 하이퍼파라미터 탐색</h2>
          <p>
            {row.feature_set} · {row.label} 최종 선택값
            {row.extra.optuna_n_trials != null && ` · ${row.extra.optuna_n_trials} trial`}
            {row.extra.optuna_search_seconds != null && ` · 약 ${Math.round(row.extra.optuna_search_seconds)}초`}
          </p>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: "#F0F1ED", border: "1px solid #F0F1ED", borderRadius: 10, overflow: "hidden" }}>
        {entries.map(({ label, value }) => (
          <div key={label} style={{ background: "#fff", padding: "12px 14px" }}>
            <div style={{ fontSize: 11, color: "#8b9184" }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 650, color: "#303629", marginTop: 4 }}>
              {value == null ? "—" : typeof value === "number" && !Number.isInteger(value) ? value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "") : value}
            </div>
          </div>
        ))}
      </div>
      {row.extra.best_iteration != null && (
        <p style={{ fontSize: 11, color: "#91968c", marginTop: 10 }}>best_iteration {row.extra.best_iteration.toLocaleString("ko-KR")}회</p>
      )}
    </article>
  );
}

export function PricePredictionSection() {
  const { data, loading, error, retry } = useAdminResource(getPricePredictionSummary);

  return (
    <section style={{ marginTop: 40 }}>
      <div className={styles.cardHead} style={{ borderBottom: "2px solid #E7E8E5", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: 20, color: "#272B25", fontWeight: 750 }}>가격예측 모델</h2>
          <p style={{ marginTop: 6, color: "#777D72", fontSize: 13 }}>
            analyzer 파이프라인(LightGBM) 학습 결과 및 하이퍼파라미터·피처 중요도 검증
          </p>
        </div>
        <button
          type="button"
          className={styles.dynamicPillBtn}
          onClick={retry}
          disabled={loading}
        >
          <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
          <span>새로고침</span>
        </button>
      </div>

      {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : <>
        <div className={styles.chartGrid} style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>
          <article className={styles.card}>
            <div className={styles.cardHead}><div><h2>모델 지표</h2><p>feature set × 모델별 검증 성능 · Hit@20%(오차 ±20% 이내 적중률)와 구간 커버리지(예측 10~90% 구간 안에 실제가가 들어올 확률, 목표 80%)</p></div></div>
            <AdminTable headers={["Feature Set", "모델", "R²", "RMSE", "MAE", "MAPE", "Hit@10%", "Hit@20%", "구간 커버리지(10-90%)"]}>
              {data.metrics.map(m => <tr key={`${m.feature_set}-${m.model_key}`}>
                <td>{m.feature_set}</td><td>{m.label}</td><td>{m.r2.toFixed(3)}</td><td>{money(Math.round(m.rmse))}</td>
                <td>{money(Math.round(m.mae))}</td><td>{(m.mape * 100).toFixed(1)}%</td><td>{(m.hit10 * 100).toFixed(0)}%</td><td>{(m.hit20 * 100).toFixed(0)}%</td>
                <td>{m.extra?.range_coverage_10_90 != null ? `${(m.extra.range_coverage_10_90 * 100).toFixed(1)}%` : "—"}</td>
              </tr>)}
            </AdminTable>
          </article>
        </div>

        <div style={{ marginTop: 20 }}>
          <OptunaParamsCard metrics={data.metrics} />
        </div>

        <div className={styles.chartGrid} style={{ marginTop: 20 }}>
          <article className={styles.card}>
            <div className={styles.cardHead}><div><h2>예측가 vs 실제가</h2><p>대각선에 가까울수록 예측이 정확 · R²가 가장 높은 feature set 기준</p></div></div>
            <PredictionScatter predictions={data.charts.predictions} />
          </article>
          <FeatureImportanceCard items={data.charts.feature_importance} />
        </div>

        <div style={{ marginTop: 20 }}>
          <ShapSummaryCard />
        </div>
      </>}
    </section>
  );
}
export default PricePredictionSection;
