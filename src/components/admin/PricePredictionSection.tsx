"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ErrorBar, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import {
  getPriceModelListings,
  getPriceModelShapSummary,
  type DetailTypeCountItem,
  type PriceClusterItem,
  type PriceDistributionCategory,
  type PriceFeatureImportanceItem,
  type PriceModelListingItem,
  type PriceModelMetricItem,
  type PricePlatformComparisonItem,
  type PricePredictionItem,
} from "@/services/adminService";
import { getPricePredictionSummary } from "@/lib/admin/dashboard-api";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, EmptyState, ErrorState, Skeleton } from "./AdminUI";
import { HorizontalBars } from "./DashboardCharts";
import styles from "./portal.module.css";

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const PALETTE = ["#FF9D5B", "#ADB9A1", "#7C9CBF", "#D98E9B", "#B79FD9", "#8CC0A6", "#E0B45A"];
const PLATFORM_COLOR: Record<string, string> = { 당근마켓: "#FF6F0F", 번개장터: "#7C9CBF", 중고나라: "#8CC0A6" };
const BAND_ORDER = ["최저가", "저가", "중가", "고가", "최고가", "전체"];
const BAND_COLOR: Record<string, string> = { 최저가: "#FFE3CC", 저가: "#FFC08A", 중가: "#FF9D5B", 고가: "#E0630F", 최고가: "#A3480A", 전체: "#ADB9A1" };
const tooltipBox = { background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "8px 10px", fontSize: 12, lineHeight: 1.6 } as const;

function PredictionScatter({ predictions }: { predictions: PricePredictionItem[] }) {
  // 지표에서 R²가 가장 높은 feature_set만 골라 산점도 하나로 — 여러 개를 겹쳐 그리면 읽기 어려움.
  const bestFeatureSet = predictions[0]?.feature_set;
  const rows = predictions.filter(p => p.feature_set === bestFeatureSet);
  if (!rows.length) return <EmptyState message="예측 결과가 없습니다." />;
  // 두 축을 같은 domain으로 고정해야 대각선 기준선이 실제 45도로 그려진다.
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

const DOT_SIZE = 5;
const BINS = 160; // 가격 구간을 잘게 쪼갤수록 한 구간에 쌓이는 도트가 줄어 가로로 더 퍼진다
const ROW_GAP = 10; // 행 사이 여백
const MAX_STACK = 26; // 한 구간에 이보다 많이 쌓이면 그 이상은 겹쳐 그림 — 행 높이가 표본 1개짜리 이상치 때문에 끝없이 커지는 것 방지

// d3-force 없이: 세부유형별로 행을 나누고(색=유형), 같은 행 안에서는 가격을 BINS개 구간으로
// 나눠 같은 구간끼리 위아래로 쌓는다(도트 히스토그램). 행 높이는 고정이 아니라 그 행에서
// 실제로 가장 높이 쌓인 구간 기준으로 계산 — 안 그러면 표본이 몰린 유형이 다음 행까지
// 침범해서 색이 뭉개져 보인다(이전 버그). 실제 힘 기반 스웜이 필요해지면 d3-force로 교체.
function layoutRows(category: PriceDistributionCategory) {
  const domainMax = Math.max(...category.points.map(p => p.price), 1);
  const rows = category.types; // 백엔드가 이미 상위 5개+기타로 정리해서 내려줌
  const byType = new Map<string, { price: number; type: string }[]>();
  for (const p of category.points) {
    if (!byType.has(p.type)) byType.set(p.type, []);
    byType.get(p.type)!.push(p);
  }
  const binOf = (price: number) => Math.min(BINS - 1, Math.floor((price / domainMax) * BINS));

  const rowHeights = rows.map(row => {
    const bucketCounts = new Map<number, number>();
    for (const p of byType.get(row.type) ?? []) {
      const bin = binOf(p.price);
      bucketCounts.set(bin, (bucketCounts.get(bin) ?? 0) + 1);
    }
    const peak = Math.min(Math.max(1, ...bucketCounts.values()), MAX_STACK);
    return peak * DOT_SIZE + ROW_GAP;
  });
  const rowCenters: number[] = [];
  let cursor = 0;
  rowHeights.forEach(h => { rowCenters.push(cursor + h / 2); cursor += h; });

  const points: { price: number; type: string; y: number }[] = [];
  rows.forEach((row, rowIndex) => {
    const rowCenter = rowCenters[rowIndex];
    const bucketStack = new Map<number, number>();
    for (const p of byType.get(row.type) ?? []) {
      const bin = binOf(p.price);
      const stackIndex = bucketStack.get(bin) ?? 0;
      bucketStack.set(bin, stackIndex + 1);
      const clamped = Math.min(stackIndex, MAX_STACK - 1);
      const level = clamped % 2 === 0 ? clamped / 2 : -(clamped + 1) / 2;
      points.push({ price: p.price, type: p.type, y: rowCenter + level * DOT_SIZE });
    }
  });
  return { points, domainMax, totalHeight: cursor };
}

function DistributionSwarm({ category }: { category: PriceDistributionCategory }) {
  const { points, totalHeight } = useMemo(() => layoutRows(category), [category]);
  const typeColor = new Map(category.types.map((t, i) => [t.type, PALETTE[i % PALETTE.length]]));
  const height = Math.max(120, totalHeight + 16);
  return (
    <div key={category.category} className={styles.card}>
      <div className={styles.cardHead}><div><h2>{category.category}</h2><p>표본 {category.sample_count.toLocaleString("ko-KR")}건 · 세부유형 {category.types.length}개 · 행 = 세부유형</p></div></div>
      <div className={styles.chart} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#F0F1ED" horizontal={false} />
            <XAxis type="number" dataKey="price" tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="y" hide domain={[0, totalHeight]} />
            <Tooltip cursor={false} content={({ payload }) => {
              const row = payload?.[0]?.payload as { type: string; price: number } | undefined;
              if (!row) return null;
              return <div style={{ background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "6px 10px", fontSize: 12 }}>{row.type} · {money(row.price)}</div>;
            }} />
            <Scatter data={points} isAnimationActive={false} shape={(props: any) => <circle cx={props.cx} cy={props.cy} r={DOT_SIZE / 2.4} fill={typeColor.get(props.payload.type)} fillOpacity={0.8} />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 8 }}>
        {category.types.map((t, i) => <span key={t.type} style={{ fontSize: 11, color: "#656b60", display: "flex", alignItems: "center", gap: 5 }}>
          <i style={{ width: 8, height: 8, borderRadius: "50%", background: PALETTE[i % PALETTE.length], display: "inline-block" }} />
          {t.type} {t.count}건 · 중위 {money(t.median_price)}
        </span>)}
      </div>
    </div>
  );
}

function FeatureImportanceCard({ items }: { items: PriceFeatureImportanceItem[] }) {
  // predictions와 같은 feature set(R² 최고) 기준 · gain 상위 12개만 — 61개를 다 그리면 못 읽는다.
  const bestFeatureSet = items[0]?.feature_set;
  const top = items.filter(i => i.feature_set === bestFeatureSet).slice(0, 12).map(i => ({ name: i.feature, count: Math.round(i.gain) }));
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}><div><h2>Feature Importance</h2><p>gain 기준 상위 12개 · {bestFeatureSet}</p></div></div>
      <HorizontalBars data={top} />
    </article>
  );
}

// analyzer가 shap.summary_plot()으로 그린 PNG를 그대로 보여준다 — 매물 하나하나가 각 피처를
// 예측가를 어느 방향(+/-)으로 얼마나 밀었는지는 이 그림 이상으로 재현하기 어려워서(수치 자체를
// DB에 안 쌓아둠) 이미지째로 서빙. 피처별 수치가 필요해지면 그때 SHAP 값 자체를 CSV로 뽑아 적재.
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
        // eslint-disable-next-line @next/next/no-img-element -- blob: URL이라 next/image 최적화 대상이 아님
        <img src={imageUrl} alt={`SHAP summary plot (${featureSet})`} style={{ width: "100%", height: "auto", borderRadius: 8, background: "#fff" }} />
      )}
    </article>
  );
}

function MetricsR2Bar({ metrics }: { metrics: PriceModelMetricItem[] }) {
  const data = metrics.map(m => ({ name: `${m.feature_set} · ${m.label}`, count: Math.round(m.r2 * 100) }));
  return <HorizontalBars data={data} />;
}

function PlatformComparisonChart({ rows }: { rows: PricePlatformComparisonItem[] }) {
  // 플랫폼별로 그룹 막대(중위가) + 오차막대(p25~p75)를 카테고리마다 나란히 — 표보다 플랫폼 간 격차가 한눈에 들어온다.
  const platforms = Array.from(new Set(rows.map(r => r.platform)));
  const byCategory = new Map<string, Record<string, unknown>>();
  rows.forEach(r => {
    const row = byCategory.get(r.category) ?? { category: r.category };
    row[r.platform] = r.median_price;
    row[`${r.platform}__range`] = [Math.max(0, r.median_price - r.p25_price), Math.max(0, r.p75_price - r.median_price)];
    row[`${r.platform}__row`] = r;
    byCategory.set(r.category, row);
  });
  const data = Array.from(byCategory.values());
  if (!data.length) return <EmptyState message="비교할 데이터가 없습니다." />;
  return (
    <div className={styles.chart} style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F0F1ED" />
          <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#656b60" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#F7F7F5" }} content={({ payload, label }) => {
            if (!payload?.length) return null;
            return <div style={tooltipBox}>
              <b>{label}</b>
              {payload.map(entry => {
                const row = entry.payload[`${entry.dataKey}__row`] as PricePlatformComparisonItem | undefined;
                if (!row) return null;
                return <div key={row.platform}>{row.platform} 중위 {money(Math.round(row.median_price))} (p25 {money(Math.round(row.p25_price))} ~ p75 {money(Math.round(row.p75_price))}) · {row.sample_count}건</div>;
              })}
            </div>;
          }} />
          {platforms.map(platform => (
            <Bar key={platform} dataKey={platform} name={platform} fill={PLATFORM_COLOR[platform] ?? "#ADB9A1"} radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false}>
              <ErrorBar dataKey={`${platform}__range`} width={4} strokeWidth={1} stroke="#42483b" />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ClusterStackedBar({ clusters }: { clusters: PriceClusterItem[] }) {
  // GMM 군집을 카테고리별 100% 스택 막대로 — 가격대 구성비를 표 숫자보다 형태로 바로 비교.
  const bands = BAND_ORDER.filter(b => clusters.some(c => c.price_band === b));
  const byCategory = new Map<string, Record<string, unknown>>();
  clusters.forEach(c => {
    const row = byCategory.get(c.category) ?? { category: c.category };
    row[c.price_band] = c.share;
    row[`${c.price_band}__row`] = c;
    byCategory.set(c.category, row);
  });
  const data = Array.from(byCategory.values());
  if (!data.length) return <EmptyState message="군집 데이터가 없습니다." />;
  const height = data.length * 42 + 40;
  return (
    <div className={styles.chart} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="#F0F1ED" />
          <XAxis type="number" domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11, fill: "#656b60" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#F7F7F5" }} content={({ payload, label }) => {
            if (!payload?.length) return null;
            return <div style={tooltipBox}>
              <b>{label}</b>
              {payload.map(entry => {
                const row = entry.payload[`${entry.dataKey}__row`] as PriceClusterItem | undefined;
                if (!row) return null;
                return <div key={row.price_band}>{row.price_band} {(row.share * 100).toFixed(0)}% · 중위 {money(Math.round(row.median_price))} ({money(Math.round(row.range_low))}~{money(Math.round(row.range_high))}) · {row.sample_count}건</div>;
              })}
            </div>;
          }} />
          {bands.map(band => (
            <Bar key={band} dataKey={band} name={band} stackId="band" fill={BAND_COLOR[band]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// price-distribution의 types는 상위 5개+"기타"로 잘리는데(스웜 플롯 가독성 때문), 여기는
// 세부유형 분류가 실제 몇 건씩 잡혔는지 전부 — "다이슨 V6 몇 개, V10 몇 개"를 그대로 보여준다.
function DetailTypeCountsCard({ items }: { items: DetailTypeCountItem[] }) {
  const byCategory = new Map<string, DetailTypeCountItem[]>();
  items.forEach(item => {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category)!.push(item);
  });
  if (!byCategory.size) return <EmptyState message="세부유형 분류 데이터가 없습니다." />;
  return (
    <div className={styles.chartGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
      {Array.from(byCategory.entries()).map(([category, rows]) => (
        // 세부유형이 10~20개까지 나오는 카테고리(마사지기 등)는 표가 화면을 다 잡아먹어서
        // 접어두고 필요할 때만 펼쳐본다 — 상태 없이 native <details>로 충분.
        <details key={category} className={styles.card} open={rows.length <= 4}>
          <summary className={styles.cardHead} style={{ cursor: "pointer" }}>
            <div><h2 style={{ display: "inline" }}>{category}</h2><p>세부유형 {rows.length}개 · 표본 {rows.reduce((sum, r) => sum + r.count, 0).toLocaleString("ko-KR")}건</p></div>
          </summary>
          <AdminTable headers={["세부유형", "건수"]}>
            {rows.map(r => <tr key={r.detail_type}><td>{r.detail_type}</td><td>{r.count.toLocaleString("ko-KR")}건</td></tr>)}
          </AdminTable>
        </details>
      ))}
    </div>
  );
}

function ListingsTable({ page, onPage }: { page: number; onPage: (page: number) => void }) {
  const loader = useCallback(() => getPriceModelListings(page), [page]);
  const { data, loading, error, retry } = useAdminResource(loader);
  const size = 20;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / size)) : 1;
  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div><h2>가격예측 매물 데이터</h2><p>학습에 쓰인 매물 {data ? data.total.toLocaleString("ko-KR") : "—"}건 중 페이지당 {size}건</p></div>
        <button onClick={retry} disabled={loading}><RefreshCw size={14} />새로고침</button>
      </div>
      {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : data.items.length ? <>
        <AdminTable headers={["제목", "카테고리", "세부유형", "구", "상태", "가격", "채팅", "관심", "조회"]}>
          {data.items.map((row: PriceModelListingItem) => <tr key={row.id}>
            <td>{row.title}</td><td>{row.category}</td><td>{row.detail_type}</td><td>{row.gu}</td><td>{row.status}</td>
            <td>{money(row.price)}</td><td>{row.chat_count}</td><td>{row.interest_count}</td><td>{Math.round(row.view_count)}</td>
          </tr>)}
        </AdminTable>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14, fontSize: 12, color: "#656b60", alignItems: "center" }}>
          <button onClick={() => onPage(page - 1)} disabled={page <= 1}>이전</button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}>다음</button>
        </div>
      </> : <EmptyState message="매물 데이터가 없습니다." />}
    </article>
  );
}

export function PricePredictionSection() {
  const { data, loading, error, retry } = useAdminResource(getPricePredictionSummary);
  const [page, setPage] = useState(1);

  return (
    <section style={{ marginTop: 40 }}>
      <div className={styles.cardHead}>
        <div><h2 style={{ fontSize: 20 }}>가격예측 모델</h2><p>analyzer 파이프라인(LightGBM) 학습 결과 · 관리자 전용</p></div>
        <button onClick={retry} disabled={loading}><RefreshCw size={14} />새로고침</button>
      </div>

      {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : <>
        <div className={styles.chartGrid}>
          <article className={styles.card}>
            <div className={styles.cardHead}><div><h2>모델 지표</h2><p>feature set × 모델별 검증 성능 · Hit@20%(오차 ±20% 이내 적중률)와 구간 커버리지(예측 10~90% 구간 안에 실제가가 들어올 확률, 목표 80%)는 서로 다른 지표</p></div></div>
            <AdminTable headers={["Feature Set", "모델", "R²", "RMSE", "MAE", "MAPE", "Hit@10%", "Hit@20%", "구간 커버리지(10-90%)"]}>
              {data.metrics.map(m => <tr key={`${m.feature_set}-${m.model_key}`}>
                <td>{m.feature_set}</td><td>{m.label}</td><td>{m.r2.toFixed(3)}</td><td>{money(Math.round(m.rmse))}</td>
                <td>{money(Math.round(m.mae))}</td><td>{(m.mape * 100).toFixed(1)}%</td><td>{(m.hit10 * 100).toFixed(0)}%</td><td>{(m.hit20 * 100).toFixed(0)}%</td>
                <td>{m.extra?.range_coverage_10_90 != null ? `${(m.extra.range_coverage_10_90 * 100).toFixed(1)}%` : "—"}</td>
              </tr>)}
            </AdminTable>
          </article>
          <article className={styles.card}>
            <div className={styles.cardHead}><div><h2>R² 비교</h2><p>값이 높을수록(100에 가까울수록) 설명력이 좋음</p></div></div>
            <MetricsR2Bar metrics={data.metrics} />
          </article>
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

        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 12px" }}>세부유형 분류 개수</h2>
          <DetailTypeCountsCard items={data.detailTypeCounts} />
        </div>

        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 12px" }}>세부유형별 가격분포</h2>
          <div className={styles.chartGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            {data.distribution.map(cat => <DistributionSwarm key={cat.category} category={cat} />)}
          </div>
        </div>

        <div className={styles.chartGrid} style={{ marginTop: 20 }}>
          <article className={styles.card}>
            <div className={styles.cardHead}><div><h2>플랫폼 가격 비교</h2><p>카테고리별 중위가 · 막대 위아래 선은 p25~p75 구간</p></div></div>
            <PlatformComparisonChart rows={data.charts.platform_comparisons} />
          </article>
          <article className={styles.card}>
            <div className={styles.cardHead}><div><h2>유의성 검정</h2><p>플랫폼 간 가격차 통계 검정</p></div></div>
            <AdminTable headers={["카테고리", "비교", "차이", "p-value", "유의"]}>
              {data.charts.platform_tests.map((row, i) => <tr key={i}>
                <td>{row.category}</td><td>{row.platform_a} vs {row.platform_b}</td><td>{row.diff_pct.toFixed(1)}%</td><td>{row.p_value.toFixed(3)}</td><td>{row.significant ? "유의함" : "—"}</td>
              </tr>)}
            </AdminTable>
          </article>
        </div>

        <article className={styles.card} style={{ marginTop: 20 }}>
          <div className={styles.cardHead}><div><h2>가격 군집 (GMM)</h2><p>카테고리별 가격대 구성비 · 100% 스택 막대</p></div></div>
          <ClusterStackedBar clusters={data.charts.clusters} />
        </article>

        <div style={{ marginTop: 20 }}>
          <ListingsTable page={page} onPage={setPage} />
        </div>
      </>}
    </section>
  );
}
