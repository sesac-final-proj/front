"use client";
import dynamic from "next/dynamic";
import { Activity, ChartNoAxesCombined, Database, Gauge } from "lucide-react";
import { adminAuthorizedFetch, getPriceComparisonOverview, type ListingSentimentAnalysis, type PriceComparisonOverview, type PricePlatformComparisonItem } from "@/services/adminService";
import { useAdminResource } from "../useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "../AdminUI";
import { ComparisonCharts } from "../ComparisonCharts";
import { comparisonDecisions, PLATFORMS } from "../comparison-data";
import styles from "../portal.module.css";
const ComparisonSpace = dynamic(() => import("../ComparisonSpace"), { ssr: false });
interface ComparisonData { items: PricePlatformComparisonItem[]; source: string; period: string; caveat: string; sentiment?: ListingSentimentAnalysis; regional: PriceComparisonOverview }
async function load(): Promise<ComparisonData> {
  const [response, regional] = await Promise.all([
    adminAuthorizedFetch("/api/v1/admin/external-comparison"),
    getPriceComparisonOverview(),
  ]);
  if (!response.ok) throw new Error("플랫폼 비교 데이터를 불러오지 못했습니다.");
  return { ...(await response.json()), regional };
}
export default function ExternalComparisonSection() {
  const { data, loading, error, retry } = useAdminResource(load);
  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState message={error} retry={retry} />;
  const analysis = comparisonDecisions(data.items);
  const lead = analysis.decisions[0];
  const sentimentRisks = [...(data.sentiment?.categories ?? [])]
    .filter(row => row.total >= 5)
    .sort((a, b) => b.negative / b.total - a.negative / a.total || a.score - b.score)
    .slice(0, 8);
  return <section className={styles.comparisonWorkspace}>
    <div className={styles.comparisonMetrics} aria-label="외부 비교 핵심 지표">
      <article><Database size={18} /><span>분석 표본</span><strong>{analysis.totalSamples.toLocaleString()}건</strong><small>검증 통과 가격 행</small></article>
      <article><ChartNoAxesCombined size={18} /><span>공통 비교 품목</span><strong>{analysis.comparable.length}개</strong><small>3개 플랫폼 모두 존재</small></article>
      <article><Gauge size={18} /><span>비교 커버리지</span><strong>{analysis.coverage.toFixed(0)}%</strong><small>전체 품목 중 공통 품목</small></article>
      <article className={styles.comparisonAccent}><Activity size={18} /><span>최우선 점검</span><strong>{lead?.category ?? "대기"}</strong><small>{lead ? `당근 대비 외부 ${lead.gapPercent >= 0 ? "+" : ""}${lead.gapPercent.toFixed(1)}%` : "공통 표본 필요"}</small></article>
    </div>

    <article className={styles.comparisonBrief}>
      <div><h2>오늘의 운영 판단</h2><p>{data.source} · {data.period}</p></div>
      <p>{data.caveat}</p>
      {!!analysis.excluded && <p role="status">검증 제외 {analysis.excluded}행 · 중복 그룹, 유효하지 않은 표본 또는 사분위 순서 오류</p>}
    </article>

    {analysis.decisions.length ? <article className={styles.comparisonPanel}>
      <header><div><h2>가격 경쟁력과 운영 우선순위</h2><p>외부 2개 플랫폼 중앙값 평균을 당근과 비교합니다. 격차와 표본을 함께 봐야 합니다.</p></div><span>{analysis.decisions.length}개 공통 품목</span></header>
      <AdminTable headers={["우선순위", "품목", "당근 중앙값", "외부 중앙값", "가격 격차", "당근 변동폭", "표본(당근/외부)", "권장 조치"]}>
        {analysis.decisions.map(row => <tr key={row.category}><td><b data-priority={row.priority}>{row.priority}</b></td><td>{row.category}</td><td>{Math.round(row.carrotMedian).toLocaleString()}원</td><td>{Math.round(row.externalMedian).toLocaleString()}원</td><td className={row.gapPercent >= 0 ? styles.positiveGap : styles.negativeGap}>{row.gapPercent >= 0 ? "+" : ""}{row.gapPercent.toFixed(1)}%</td><td>{row.spreadPercent.toFixed(1)}%</td><td>{row.carrotSamples.toLocaleString()} / {row.externalSamples.toLocaleString()}</td><td>{row.action}</td></tr>)}
      </AdminTable>
    </article> : <p className={styles.comparisonEmpty}>3개 플랫폼에 함께 존재하는 품목이 없어 운영 우선순위를 계산할 수 없습니다.</p>}

    {data.sentiment && <article className={styles.comparisonPanel}>
      <header><div><h2>매물 문구 감성 분석</h2><p>후기 감성이 아닌 제목 속 상품 상태 표현입니다. 긍정은 미개봉·정품·최상, 부정은 하자·고장·사용감 같은 신호입니다.</p></div><span>{data.sentiment.analyzed_count.toLocaleString()}건 분석</span></header>
      <div className={styles.sentimentGrid}>{data.sentiment.platforms.map(row => {
        const total = Math.max(1, row.total);
        return <section key={row.platform} className={styles.sentimentPlatform}>
          <div><h3>{row.platform}</h3><strong>{row.score > 0 ? "+" : ""}{row.score.toFixed(1)}</strong></div>
          <div className={styles.sentimentBar} aria-label={`${row.platform}: 긍정 ${row.positive}건, 중립 ${row.neutral}건, 부정 ${row.negative}건`}>
            <i style={{ width: `${row.positive * 100 / total}%` }} /><i style={{ width: `${row.neutral * 100 / total}%` }} /><i style={{ width: `${row.negative * 100 / total}%` }} />
          </div>
          <dl><div><dt>긍정</dt><dd>{(row.positive * 100 / total).toFixed(1)}%</dd></div><div><dt>중립</dt><dd>{(row.neutral * 100 / total).toFixed(1)}%</dd></div><div><dt>부정</dt><dd>{(row.negative * 100 / total).toFixed(1)}%</dd></div></dl>
          <p><b>긍정 근거</b> {row.top_positive_terms.join(" · ") || "감지 없음"}</p><p><b>부정 근거</b> {row.top_negative_terms.join(" · ") || "감지 없음"}</p>
        </section>;
      })}</div>
      {!!sentimentRisks.length && <div className={styles.sentimentRisks}>
        <h3>부정 상태 신호 상위 품목</h3>
        <AdminTable headers={["플랫폼", "품목", "제목 표본", "부정 비율", "감성 점수", "주요 근거"]}>
          {sentimentRisks.map(row => <tr key={`${row.platform}|${row.category}`}><td>{row.platform}</td><td>{row.category}</td><td>{row.total.toLocaleString()}</td><td className={styles.negativeGap}>{(row.negative * 100 / row.total).toFixed(1)}%</td><td>{row.score > 0 ? "+" : ""}{row.score.toFixed(1)}</td><td>{row.top_negative_terms.join(" · ") || "직접 부정어 없음"}</td></tr>)}
        </AdminTable>
      </div>}
      <footer><span>점수 = (긍정 건수 - 부정 건수) / 전체 제목 × 100</span><span>{data.sentiment.method}</span></footer>
    </article>}

    {analysis.rows.length ? <>
      <article className={styles.comparisonPanel}><ComparisonCharts rows={analysis.rows} regions={data.regional.regions} detailTypes={data.regional.detail_types} /></article>
      <article className={styles.comparisonPanel}><ComparisonSpace rows={analysis.rows} /></article>
      <article className={styles.comparisonPanel}><header><div><h2>검증된 비교 원본 수치</h2><p>{PLATFORMS.map(platform => `${platform} ${analysis.rows.filter(row => row.platform === platform).length}개 품목`).join(" · ")}</p></div></header><AdminTable headers={["품목", "플랫폼", "표본", "Q1(원)", "중앙값(원)", "Q3(원)"]}>{analysis.rows.map(row => <tr key={`${row.category}|${row.platform}`}><td>{row.category}</td><td>{row.platform}</td><td>{row.sample_count.toLocaleString()}</td><td>{row.p25_price.toLocaleString()}</td><td>{row.median_price.toLocaleString()}</td><td>{row.p75_price.toLocaleString()}</td></tr>)}</AdminTable></article>
    </> : <p className={styles.comparisonEmpty}>DB에 비교 가능한 플랫폼 가격 통계가 없습니다.</p>}
  </section>;
}
