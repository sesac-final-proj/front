"use client";
import { useCallback, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ErrorBar, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  getPriceModelListings,
  type DetailTypeCountItem,
  type PriceClusterItem,
  type PriceDistributionCategory,
  type PriceModelListingItem,
  type PricePlatformComparisonItem,
} from "@/services/adminService";
import { getPricePredictionSummary } from "@/lib/admin/dashboard-api";
import { useAdminResource } from "../useAdminResource";
import { AdminTable, EmptyState, ErrorState, Skeleton } from "../AdminUI";
import styles from "../portal.module.css";

const money = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const PALETTE = ["#FF9D5B", "#ADB9A1", "#7C9CBF", "#D98E9B", "#B79FD9", "#8CC0A6", "#E0B45A"];
const PLATFORM_COLOR: Record<string, string> = { 당근마켓: "#FF6F0F", 번개장터: "#7C9CBF", 중고나라: "#8CC0A6" };
const BAND_ORDER = ["최저가", "저가", "중가", "고가", "최고가", "전체"];
const BAND_COLOR: Record<string, string> = { 최저가: "#FFE3CC", 저가: "#FFC08A", 중가: "#FF9D5B", 고가: "#E0630F", 최고가: "#A3480A", 전체: "#ADB9A1" };
const tooltipBox = { background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "8px 10px", fontSize: 12, lineHeight: 1.6 } as const;

const DOT_SIZE = 5;
const BINS = 160;
const ROW_GAP = 10;
const MAX_STACK = 26;

function layoutRows(category: PriceDistributionCategory) {
  const domainMax = Math.max(...category.points.map(p => p.price), 1);
  const rows = category.types;
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

function PlatformComparisonChart({ rows }: { rows: PricePlatformComparisonItem[] }) {
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
        <article key={category} className={styles.card}>
          <div className={styles.cardHead}>
            <div><h2>{category}</h2><p>세부유형 {rows.length}개 · 표본 {rows.reduce((sum, r) => sum + r.count, 0).toLocaleString("ko-KR")}건</p></div>
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            <AdminTable headers={["세부유형", "건수"]}>
              {rows.map(r => <tr key={r.detail_type}><td>{r.detail_type}</td><td>{r.count.toLocaleString("ko-KR")}건</td></tr>)}
            </AdminTable>
          </div>
        </article>
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
      {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : data.items.length ? <>
        <AdminTable headers={["제목", "카테고리", "세부유형", "구", "상태", "가격", "채팅", "관심", "조회"]}>
          {data.items.map((row: PriceModelListingItem) => <tr key={row.id}>
            <td>{row.title}</td><td>{row.category}</td><td>{row.detail_type}</td><td>{row.gu}</td><td>{row.status}</td>
            <td>{money(row.price)}</td><td>{row.chat_count}</td><td>{row.interest_count}</td><td>{Math.round(row.view_count)}</td>
          </tr>)}
        </AdminTable>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16, fontSize: 12, color: "#656b60", alignItems: "center" }}>
          <button
            type="button"
            className={styles.dynamicPillBtn}
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
          >
            이전
          </button>
          <span style={{ fontWeight: 650, color: "#3A4036" }}>{page} / {totalPages}</span>
          <button
            type="button"
            className={styles.dynamicPillBtn}
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
          >
            다음
          </button>
        </div>
      </> : <EmptyState message="매물 데이터가 없습니다." />}
    </article>
  );
}

export default function PriceStatusSection() {
  const { data, loading, error, retry } = useAdminResource(getPricePredictionSummary);
  const [page, setPage] = useState(1);

  return (
    <section style={{ marginTop: 40 }}>
      <div className={styles.cardHead} style={{ borderBottom: "2px solid #E7E8E5", paddingBottom: "16px", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: 20, color: "#272B25", fontWeight: 750 }}>가격현황</h2>
          <p style={{ marginTop: 6, color: "#777D72", fontSize: 13 }}>
            세부유형별 가격 분포, 플랫폼 시세 비교, 가격대 군집 및 수집 매물 현황
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
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 12px" }}>세부유형 분류 개수</h2>
          <DetailTypeCountsCard items={data.detailTypeCounts} />
        </div>

        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 650, margin: "0 0 12px" }}>세부유형별 가격분포</h2>
          <div className={styles.chartGrid} style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}>
            {data.distribution.map(cat => <DistributionSwarm key={cat.category} category={cat} />)}
          </div>
        </div>

        <div className={styles.chartGrid} style={{ marginTop: 24 }}>
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

        <article className={styles.card} style={{ marginTop: 24 }}>
          <div className={styles.cardHead}><div><h2>가격 군집 (GMM)</h2><p>카테고리별 가격대 구성비 · 100% 스택 막대</p></div></div>
          <ClusterStackedBar clusters={data.charts.clusters} />
        </article>

        <div style={{ marginTop: 24 }}>
          <ListingsTable page={page} onPage={setPage} />
        </div>
      </>}
    </section>
  );
}
export { PriceStatusSection };
