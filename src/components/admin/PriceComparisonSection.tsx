"use client";
import { useCallback, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  getPriceComparisonOverview,
  getPriceComparisonSamples,
  type PriceComparisonRegionItem,
  type PriceComparisonSample,
} from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, EmptyState, ErrorState, MetricCard, Skeleton } from "./AdminUI";
import pStyles from "./portal.module.css";
import styles from "./price-comparison.module.css";

const money = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const GU_TABS = ["전체", "영등포구", "노원구", "송파구"] as const;
const GU_ORDER = ["송파구", "영등포구", "노원구"] as const;
const GU_COLOR: Record<string, string> = { 송파구: "#FF9D5B", 영등포구: "#7C9CBF", 노원구: "#8CC0A6" };
const GRADE_COLOR: Record<string, string> = { S: "#A3480A", A: "#E0630F", B: "#FF9D5B", C: "#FFC08A" };
const GRADE_LABEL: Record<string, string> = { S: "매우 활발", A: "활발", B: "보통", C: "저조" };
const tooltipBox = { background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "8px 10px", fontSize: 12, lineHeight: 1.6 } as const;

function RegionBarChart({ rows }: { rows: PriceComparisonRegionItem[] }) {
  const data = GU_ORDER.filter(gu => rows.some(r => r.gu === gu)).map(gu => {
    const row = rows.find(r => r.gu === gu)!;
    return { gu, median_price: row.median_price, row };
  });
  if (!data.length) return <EmptyState message="지역별 데이터가 없습니다." />;
  return (
    <div className={pStyles.chart}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#F0F1ED" />
          <XAxis dataKey="gu" tick={{ fontSize: 11, fill: "#656b60" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#F7F7F5" }} isAnimationActive={false} content={({ payload }) => {
            const row = payload?.[0]?.payload?.row as PriceComparisonRegionItem | undefined;
            if (!row) return null;
            return <div style={tooltipBox}>
              <b>{row.gu}</b><br />중위가 {money(row.median_price)} · {row.sample_count.toLocaleString("ko-KR")}건<br />완료율 {row.completion_rate.toFixed(1)}% · 평균 매너온도 {row.avg_manner_temp.toFixed(1)}°C
            </div>;
          }} />
          <Bar dataKey="median_price" radius={[4, 4, 0, 0]} maxBarSize={72} isAnimationActive={false}>
            {data.map(d => <Cell key={d.gu} fill={GU_COLOR[d.gu]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const DOT_SIZE = 9;

function scatterDotShape(props: any) {
  return <circle cx={props.cx} cy={props.cy} r={DOT_SIZE / 2} fill={GU_COLOR[props.payload.gu]} fillOpacity={0.55} stroke={GU_COLOR[props.payload.gu]} strokeOpacity={0.9} />;
}

// 가격(x) x 관심수(y) 실제 두 지표로 그리는 산점도 — 구별로 색을 다르게 줘서
// 자연스럽게 뭉쳐 보인다(y축을 억지로 만들어내던 예전 스웜 레이아웃과 달리 둘 다 실데이터).
function PriceInterestScatter({ samples }: { samples: PriceComparisonSample[] }) {
  if (!samples.length) return <EmptyState message="매물 표본이 없습니다." />;
  return (
    <>
      <div className={pStyles.chart} style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 4, right: 16, left: -6, bottom: 0 }}>
            <CartesianGrid stroke="#F0F1ED" />
            <XAxis type="number" dataKey="price" name="가격" tickFormatter={v => `${(v / 10000).toFixed(0)}만`} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
            <YAxis type="number" dataKey="interest_count" name="관심수" tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={false} isAnimationActive={false} content={({ payload }) => {
              const row = payload?.[0]?.payload as PriceComparisonSample | undefined;
              if (!row) return null;
              return <div style={tooltipBox}>{row.gu} · {money(row.price)} · 관심 {row.interest_count}</div>;
            }} />
            <Scatter data={samples} isAnimationActive={false} shape={scatterDotShape} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend}>
        {GU_ORDER.map(gu => <span key={gu} className={styles.legendItem}><i className={styles.legendSwatch} style={{ background: GU_COLOR[gu] }} />{gu}</span>)}
      </div>
    </>
  );
}

export function PriceComparisonSection() {
  const { data, loading, error, retry } = useAdminResource(getPriceComparisonOverview);
  const [category, setCategory] = useState<string | null>(null);
  const [guTab, setGuTab] = useState<(typeof GU_TABS)[number]>("전체");

  // "전체"(합산) 탭이 맨 왼쪽에 오도록 — 백엔드는 카테고리명 가나다순으로 내려줘서
  // "전체"가 중간(음식물처리기~전자기기 사이)에 끼어 있음.
  const categories = useMemo(() => {
    if (!data) return [];
    return [...data.categories].sort((a, b) => (a.category === "전체" ? -1 : b.category === "전체" ? 1 : 0));
  }, [data]);
  const selectedCategory = category ?? categories[0]?.category ?? null;
  const summary = data?.categories.find(c => c.category === selectedCategory);
  const regionRows = useMemo(
    () => (data && selectedCategory ? data.regions.filter(r => r.category === selectedCategory) : []),
    [data, selectedCategory],
  );
  const detailRows = useMemo(
    () => (data && selectedCategory ? data.detail_types.filter(d => d.category === selectedCategory && d.gu === guTab) : []),
    [data, selectedCategory, guTab],
  );

  const samplesLoader = useCallback(
    () => (selectedCategory ? getPriceComparisonSamples(selectedCategory) : Promise.resolve({ category: "", samples: [] })),
    [selectedCategory],
  );
  const { retry: retrySamples, ...samplesState } = useAdminResource(samplesLoader);

  const refreshAll = useCallback(() => {
    retry();
    retrySamples();
  }, [retry, retrySamples]);

  const trend = summary?.price_trend_pct ?? null;
  const trendClass = trend === null ? styles.trendFlat : trend < 0 ? styles.trendGood : trend > 0 ? styles.trendBad : styles.trendFlat;
  const trendText = trend === null ? "판단 보류" : `${trend < 0 ? "▼" : trend > 0 ? "▲" : "→"} ${Math.abs(trend).toFixed(1)}%`;

  return (
    <section style={{ marginTop: 40 }}>
      <div className={pStyles.cardHead}>
        <div><h2 style={{ fontSize: 20 }}>가격 지역별 비교</h2><p>크롤링 분석 세션 산출물 · 송파구/영등포구/노원구 비교 · 관리자 전용</p></div>
        <button className={styles.headerBtn} onClick={refreshAll} disabled={loading || samplesState.loading}><RefreshCw size={14} />새로고침</button>
      </div>

      {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : !categories.length ? <EmptyState message="적재된 가격비교 데이터가 없습니다." /> : <>
        <div className={styles.tabs}>
          {categories.map(c => (
            <button key={c.category} type="button" className={`${styles.tab} ${c.category === selectedCategory ? styles.tabActive : ""}`} onClick={() => setCategory(c.category)}>
              {c.category}
            </button>
          ))}
        </div>

        {summary && <div className={pStyles.metrics}>
          <MetricCard label="표본수" value={summary.sample_count.toLocaleString("ko-KR")} detail="거래완료+거래중+예약중 합계" />
          <MetricCard label="중위가" value={money(summary.median_price)} detail={`변동계수 ${summary.cv_price.toFixed(1)}%`} />
          <MetricCard label="월 평균 등록" value={`${summary.listings_per_month.toFixed(1)}건`} detail="전체 수집 기간 기준" />
          <article className={pStyles.metric}>
            <span>거래빈도 등급 · 최근 180일 추세</span>
            <strong>
              <span className={styles.gradeChip} style={{ background: GRADE_COLOR[summary.frequency_grade] }}>{summary.frequency_grade}</span>
            </strong>
            <small className={trendClass}>{GRADE_LABEL[summary.frequency_grade] ?? summary.frequency_grade} · {trendText}</small>
          </article>
        </div>}

        <div className={pStyles.chartGrid} style={{ marginTop: 20 }}>
          <article className={`${pStyles.card} ${styles.lift}`}>
            <div className={pStyles.cardHead}><div><h2>구별 중위가</h2><p>막대 색 = 구 · 완료율/매너온도는 툴팁 참고</p></div></div>
            <RegionBarChart rows={regionRows} />
          </article>
          <article className={`${pStyles.card} ${styles.lift}`}>
            <div className={pStyles.cardHead}><div><h2>구별 통계</h2></div></div>
            <AdminTable headers={["구", "표본수", "중위가", "완료율", "평균 매너온도"]}>
              {regionRows.map(r => <tr key={r.gu}>
                <td>{r.gu}</td><td>{r.sample_count.toLocaleString("ko-KR")}</td><td>{money(r.median_price)}</td>
                <td>{r.completion_rate.toFixed(1)}%</td><td>{r.avg_manner_temp.toFixed(1)}°C</td>
              </tr>)}
            </AdminTable>
          </article>
        </div>

        <article className={`${pStyles.card} ${styles.lift}`} style={{ marginTop: 20 }}>
          <div className={pStyles.cardHead}><div><h2>가격 x 관심수 분포</h2><p>점 하나 = 매물 하나 · 가로 가격 · 세로 관심수 · 색 = 구(이상치 상위 3% 제외, 구별 최대 600건 표본)</p></div></div>
          {samplesState.loading ? <Skeleton /> : samplesState.error || !samplesState.data ? <ErrorState message={samplesState.error} retry={retrySamples} /> : <PriceInterestScatter samples={samplesState.data.samples} />}
        </article>

        <div style={{ marginTop: 20 }}>
          <div className={pStyles.cardHead}><div><h2 style={{ fontSize: 16 }}>세부유형별 통계</h2><p>표본 10건 미만 조합은 제외</p></div>
            <div className={styles.tabs} style={{ marginBottom: 0 }}>
              {GU_TABS.map(t => (
                <button key={t} type="button" className={`${styles.tab} ${t === guTab ? styles.tabActive : ""}`} onClick={() => setGuTab(t)}>{t}</button>
              ))}
            </div>
          </div>
          {!detailRows.length ? <EmptyState message="세부유형 통계가 없습니다." /> : (
            <AdminTable headers={["세부유형", "표본수", "중위가", "변동계수"]}>
              {detailRows.map(d => <tr key={`${d.detail_type}-${d.gu}`}>
                <td>{d.detail_type}</td><td>{d.sample_count.toLocaleString("ko-KR")}</td><td>{money(d.median_price)}</td><td>{d.cv_price.toFixed(1)}%</td>
              </tr>)}
            </AdminTable>
          )}
        </div>
      </>}
    </section>
  );
}
