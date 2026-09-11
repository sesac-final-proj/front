"use client";
import { useCallback, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  getPriceComparisonOverview,
  getPriceComparisonSamples,
  type PriceComparisonRegionItem,
  type PriceComparisonSample,
} from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminTable, EmptyState, ErrorState, Skeleton } from "./AdminUI";
import { PriceGuMap } from "./PriceGuMap";
import pStyles from "./portal.module.css";
import styles from "./price-comparison.module.css";

const money = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const GU_TABS = ["전체", "영등포구", "노원구", "송파구"] as const;
const GU_ORDER = ["송파구", "영등포구", "노원구"] as const;
const GU_COLOR: Record<string, string> = { 송파구: "#FF9D5B", 영등포구: "#7C9CBF", 노원구: "#8CC0A6" };
// 계속 "탁하다/흐리다"는 피드백이 반복된 이유 — 흰 글자가 보이게 하려고 배경을
// 어둡게(명도를 낮춰서) 잡다 보니, 진짜 쨍한 색(예: 순수 빨강 #FF0000류)은 다
// 후보에서 빠지고 매번 탁한 톤만 남았다. 그래서 이제 배경은 마음껏 쨍하고
// 밝은 색으로 고르고, 글자색을 그 배경 밝기에 맞춰 자동으로 흰색/검정 중
// 골라서 대비를 맞춘다(gradeTextColor) — "선명함"과 "글자 가독성"을 서로
// 안 부딪히게 분리한 것.
function gradeTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.42 ? "#1A1C20" : "#fff";
}

// 거래빈도 등급 색 — S~C 등급 구분은 칩 안의 글자(S/A/B/C)가 하므로, 색은
// "거래빈도 종류"라는 것만 최대한 쨍하게 전달하면 된다(가격 변동성의 초록/주황/
// 빨강 신호등 배색과는 확실히 다른 색 계열 — 진짜 선명한 파랑).
const GRADE_COLOR_SOLID = "#2563EB";
const GRADE_COLOR: Record<string, string> = { S: GRADE_COLOR_SOLID, A: GRADE_COLOR_SOLID, B: GRADE_COLOR_SOLID, C: GRADE_COLOR_SOLID };
const GRADE_LABEL: Record<string, string> = { S: "매우 활발", A: "활발", B: "보통", C: "저조" };

// 가격 변동성 등급 — cv_price(변동계수%)를 3단계로 나눈다. 경계값은 실데이터
// cv_price 분포(31~106, 카테고리 7개) 보고 역산: 31(음식물처리기)만 눈에 띄게
// 낮고 나머지는 46~106에 퍼져있어서, 40/70을 경계로 하면 안정/보통/변동큼이
// 대략 1:2:4로 갈린다 — 거래빈도 등급의 _GRADE_THRESHOLDS와 같은 성격의 값이라
// 실제 분포 보고 조정 필요하면 여기만 고치면 된다. 신호등 배색(초록=안정,
// 주황=보통, 빨강=변동큼)인데, 이번엔 눈에 확 띄는 쨍한 톤으로 골랐다.
function volatilityGrade(cvPrice: number): { label: string; color: string } {
  if (cvPrice < 40) return { label: "안정적", color: "#16A34A" };
  if (cvPrice < 70) return { label: "보통", color: "#F59E0B" };
  return { label: "변동 큼", color: "#DC2626" };
}
const tooltipBox = { background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "8px 10px", fontSize: 12, lineHeight: 1.6 } as const;

function RegionBarChart({ rows, height }: { rows: PriceComparisonRegionItem[]; height?: number }) {
  const data = GU_ORDER.filter(gu => rows.some(r => r.gu === gu)).map(gu => {
    const row = rows.find(r => r.gu === gu)!;
    return { gu, median_price: row.median_price, row };
  });
  if (!data.length) return <EmptyState message="지역별 데이터가 없습니다." />;
  return (
    <div className={pStyles.chart} style={height ? { height } : undefined}>
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


// --------------------------------------------------------------------------
// 산점도(점 하나 = 매물 하나)는 점 수백 개가 겹치면 색이 섞여버려서 "구별로
// 다르다"는 느낌이 잘 안 산다 — 이런 "그룹 간 분포 비교"엔 히스토그램(가격
// 구간별로 구 3개 막대를 나란히)이 훨씬 낫다. 같은 가격대에 구별로 몇 건 있는지
// 막대 높이로 바로 비교되니까 그룹 차이가 뚜렷하게 보인다. 좌표는 여전히 실데이터
// (구간 나누기 = 집계일 뿐, 값 자체를 손대지 않음).
// --------------------------------------------------------------------------

const HISTOGRAM_BINS = 10;

function buildGuHistogram(samples: PriceComparisonSample[]): { label: string; counts: Record<string, number> }[] {
  if (!samples.length) return [];
  const prices = samples.map(s => s.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const width = (max - min) / HISTOGRAM_BINS || 1;

  const bins = Array.from({ length: HISTOGRAM_BINS }, (_, i) => {
    const start = min + i * width;
    const end = start + width;
    const counts: Record<string, number> = {};
    GU_ORDER.forEach(gu => { counts[gu] = 0; });
    return { label: `${Math.round(start / 10000)}~${Math.round(end / 10000)}만`, counts };
  });

  samples.forEach(s => {
    const idx = Math.min(HISTOGRAM_BINS - 1, Math.max(0, Math.floor((s.price - min) / width)));
    bins[idx].counts[s.gu] += 1;
  });
  return bins;
}

function GuPriceHistogram({ samples }: { samples: PriceComparisonSample[] }) {
  const bins = useMemo(() => buildGuHistogram(samples), [samples]);
  if (!bins.length) return <EmptyState message="표본이 없습니다." />;
  const data = bins.map(b => ({ label: b.label, ...b.counts }));
  return (
    <>
      <div className={pStyles.chart} style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, left: -6, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#F0F1ED" />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={48} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8b9184" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#F7F7F5" }} isAnimationActive={false} content={({ payload, label }) => {
              if (!payload?.length) return null;
              return <div style={tooltipBox}>
                <b>{label}</b><br />
                {GU_ORDER.map(gu => <span key={gu}>{gu} {payload.find(p => p.dataKey === gu)?.value ?? 0}건<br /></span>)}
              </div>;
            }} />
            {GU_ORDER.map(gu => <Bar key={gu} dataKey={gu} fill={GU_COLOR[gu]} radius={[3, 3, 0, 0]} maxBarSize={18} isAnimationActive={false} />)}
          </BarChart>
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

        {summary && (
          <div className={styles.overviewStrip}>
            <span className={styles.overviewChip}><span>표본수</span><strong>{summary.sample_count.toLocaleString("ko-KR")}</strong></span>
            <span className={styles.overviewChip}><span>중위가</span><strong>{money(summary.median_price)}</strong></span>
            <span className={styles.overviewChip}><span>월 평균 등록</span><strong>{summary.listings_per_month.toFixed(1)}건</strong></span>
            <span className={styles.overviewChip}>
              <span>거래빈도</span>
              <strong><span className={styles.gradeChip} style={{ background: GRADE_COLOR[summary.frequency_grade], color: gradeTextColor(GRADE_COLOR[summary.frequency_grade]) }}>{summary.frequency_grade}</span></strong>
              <span className={trendClass}>{trendText}</span>
            </span>
            <span className={styles.overviewChip}><span>완료율</span><strong>{summary.completion_rate.toFixed(1)}%</strong></span>
            <span className={styles.overviewChip}>
              <span>가격 변동성</span>
              <strong><span className={styles.gradeChip} style={{ background: volatilityGrade(summary.cv_price).color, color: gradeTextColor(volatilityGrade(summary.cv_price).color) }}>{volatilityGrade(summary.cv_price).label}</span></strong>
            </span>
          </div>
        )}

        <div className={styles.primaryHeading}>
          <h2>구별 가격 비교</h2>
          <span className={styles.primaryBadge}>지역별 비교</span>
        </div>
        <div className={pStyles.chartGrid}>
          <article className={`${pStyles.card} ${styles.lift} ${styles.primaryCard}`}>
            <div className={pStyles.cardHead}><div><h2>구별 중위가</h2><p>막대 색 = 구 · 완료율/매너온도는 툴팁 참고</p></div></div>
            <RegionBarChart rows={regionRows} height={320} />
          </article>
          <article className={`${pStyles.card} ${styles.lift} ${styles.primaryCard}`}>
            <div className={pStyles.cardHead}><div><h2>구별 통계</h2></div></div>
            <div className={styles.regionTable}>
              <AdminTable headers={["구", "표본수", "중위가", "완료율", "평균 매너온도", "거래빈도", "가격 변동성"]}>
                {regionRows.map(r => <tr key={r.gu}>
                  <td>{r.gu}</td><td>{r.sample_count.toLocaleString("ko-KR")}</td><td>{money(r.median_price)}</td>
                  <td>{r.completion_rate.toFixed(1)}%</td><td>{r.avg_manner_temp.toFixed(1)}°C</td>
                  <td><span className={styles.gradeChip} style={{ background: GRADE_COLOR[r.frequency_grade], color: gradeTextColor(GRADE_COLOR[r.frequency_grade]) }}>{r.frequency_grade}</span></td>
                  <td><span className={styles.gradeChip} style={{ background: volatilityGrade(r.cv_price).color, color: gradeTextColor(volatilityGrade(r.cv_price).color) }}>{volatilityGrade(r.cv_price).label}</span></td>
                </tr>)}
              </AdminTable>
            </div>
          </article>
        </div>

        <article className={`${pStyles.card} ${styles.lift}`} style={{ marginTop: 20 }}>
          <div className={pStyles.cardHead}><div><h2>{selectedCategory} 가격 분포</h2><p>가격 구간별 매물 건수 · 막대 색 = 구</p></div></div>
          {samplesState.loading ? <Skeleton /> : samplesState.error || !samplesState.data ? <ErrorState message={samplesState.error} retry={retrySamples} /> : <GuPriceHistogram samples={samplesState.data.samples} />}
        </article>

        <article className={`${pStyles.card} ${styles.lift}`} style={{ marginTop: 20 }}>
          <div className={pStyles.cardHead}><div><h2>{selectedCategory} 구별 시세지도</h2><p>구별 색 = 카테고리 중앙값 대비 편차(파랑 저렴 · 오렌지 비쌈) · 구에 마우스 올리면 개별 매물 가격 표시</p></div></div>
          <PriceGuMap regions={regionRows} categoryMedianPrice={summary?.median_price ?? 0} samples={samplesState.data?.samples ?? []} />
        </article>

        <div style={{ marginTop: 20 }}>
          <div className={pStyles.cardHead}><div><h2 style={{ fontSize: 16 }}>세부유형별 통계</h2><p>표본 10건 미만 조합은 제외</p></div>
            <div className={styles.tabs} style={{ marginBottom: 0 }}>
              {GU_TABS.map(t => (
                <button key={t} type="button" className={`${styles.tab} ${t === guTab ? styles.tabActive : ""}`} onClick={() => setGuTab(t)}>{t}</button>
              ))}
            </div>
          </div>
          {selectedCategory === "전체" ? (
            <EmptyState message="'전체' 탭은 세부유형 구분이 없어요 — 위에서 카테고리를 하나 선택해주세요." />
          ) : !detailRows.length ? <EmptyState message="세부유형 통계가 없습니다." /> : (
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
