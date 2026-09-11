"use client";
import type { AdminAudienceInsights } from "@/services/adminService";
import { AdminTable } from "../AdminUI";
import { ComparisonSourceSummary } from "../ComparisonSourceSummary";
import styles from "../portal.module.css";

function analyzeSource(source: AdminAudienceInsights["sourceValidation"]["sources"][number]) {
  const priceRate = source.rows ? source.pricedRows * 100 / source.rows : 0;
  const duplicateRate = source.rows ? source.duplicateIds * 100 / source.rows : 0;
  const metadataRate = (source.modelKnownRate + source.datedRate) / 2;
  const score = Math.max(0, Math.min(100, priceRate * .5 + metadataRate * .5 - duplicateRate * 2));
  const priority = source.rows === 0 || priceRate < 80 || duplicateRate >= 3 || metadataRate < 70 ? "점검 필요" : score < 90 ? "관찰" : "양호";
  const action = source.rows === 0 ? "수집 실행 및 응답 상태 확인" : priceRate < 95 ? "가격 누락 행 파싱 규칙 점검" : duplicateRate > 0 ? "중복 ID 제거 규칙 점검" : metadataRate < 95 ? "모델·날짜 추출 규칙 보강" : "현재 규칙 유지";
  return { ...source, priceRate, duplicateRate, metadataRate, score, priority, action };
}

export default function SourceOperationsSection({ insights }: { insights: AdminAudienceInsights | null }) {
  if (!insights) return <p>수집원 데이터가 없습니다.</p>;
  const sources = insights.sourceValidation.sources.map(analyzeSource).sort((a, b) => a.score - b.score);
  const totalRows = sources.reduce((sum, source) => sum + source.rows, 0);
  const pricedRows = sources.reduce((sum, source) => sum + source.pricedRows, 0);
  const needsAction = sources.filter(source => source.priority === "점검 필요");
  return <section className={styles.card}><h2>수집원 운영 점검</h2><ComparisonSourceSummary /><h3>외부 데이터 품질 보고서</h3><p>아래 보고서는 별도 분석 산출물이며 위 가격 비교 집계와 범위가 다를 수 있습니다.</p><p>산출물 생성 시각: {insights.asOf} · 실시간 파이프라인 상태는 별도 미제공</p>
    <div className={styles.sourceAnalysisMetrics} aria-label="수집원 분석 요약">
      <article><span>분석 표본</span><strong>{totalRows.toLocaleString()}건</strong><small>현재 수집원 전체 행</small></article>
      <article><span>가격 식별률</span><strong>{totalRows ? `${(pricedRows * 100 / totalRows).toFixed(1)}%` : "—"}</strong><small>가격이 확인된 행 비율</small></article>
      <article><span>우선 점검</span><strong>{needsAction.length}개</strong><small>{needsAction.map(source => source.name).join(" · ") || "현재 이상 신호 없음"}</small></article>
    </div>
    <section className={styles.sourceQualityVisual} aria-labelledby="source-quality-visual-title">
      <header><div><h3 id="source-quality-visual-title">수집원 품질 비교</h3><p>막대가 길수록 가격·메타데이터 식별률은 높고, 중복 위험은 낮습니다.</p></div><span>0–100%</span></header>
      <div className={styles.sourceQualityLegend} aria-hidden="true"><span><i data-kind="price" />가격 식별</span><span><i data-kind="metadata" />메타데이터</span><span><i data-kind="duplicate" />중복 위험</span></div>
      <div className={styles.sourceQualityRows}>{sources.map(source => <article key={source.id}>
        <header><b>{source.name}</b><strong data-priority={source.priority}>{source.score.toFixed(1)}점 · {source.priority}</strong></header>
        <div className={styles.sourceMetricBars} aria-label={`${source.name}: 가격 식별률 ${source.priceRate.toFixed(1)}%, 메타데이터 식별률 ${source.metadataRate.toFixed(1)}%, 중복 위험 ${source.duplicateRate.toFixed(1)}%`}>
          <div><span>가격</span><i><b data-kind="price" style={{ width: `${source.priceRate}%` }} /></i><em>{source.priceRate.toFixed(1)}%</em></div>
          <div><span>메타</span><i><b data-kind="metadata" style={{ width: `${source.metadataRate}%` }} /></i><em>{source.metadataRate.toFixed(1)}%</em></div>
          <div><span>중복</span><i><b data-kind="duplicate" style={{ width: `${Math.min(100, source.duplicateRate)}%` }} /></i><em>{source.duplicateRate.toFixed(1)}%</em></div>
        </div>
      </article>)}</div>
    </section>
    <h3>수집원별 분석 및 다음 조치</h3><p>품질 점수는 가격 식별률 50% + 모델·날짜 식별률 평균 50%에서 중복률 페널티를 뺀 운영 우선순위용 지표입니다.</p>
    <AdminTable headers={["수집원", "품질 점수", "가격 식별", "메타데이터", "중복률", "판정", "다음 조치"]}>{sources.map(source => <tr key={source.id}>
      <td>{source.name}</td><td>{source.score.toFixed(1)}</td><td>{source.priceRate.toFixed(1)}%</td><td>{source.metadataRate.toFixed(1)}%</td><td>{source.duplicateRate.toFixed(1)}%</td><td><b data-priority={source.priority}>{source.priority}</b></td><td>{source.action}</td>
    </tr>)}</AdminTable>
    <AdminTable headers={["수집원", "상태", "표본", "가격 유효율", "모델 식별률", "날짜 식별률", "중복 ID", "점검 사항"]}>{sources.map(source => <tr key={source.id}>
      <td>{source.name}</td><td>{source.status}</td><td>{source.rows.toLocaleString()}</td><td>{source.rows ? `${(source.pricedRows / source.rows * 100).toFixed(1)}%` : "미산출"}</td><td>{source.modelKnownRate}%</td><td>{source.datedRate}%</td><td>{source.duplicateIds}</td>
      <td>{[source.rows === 0 ? "수집 결과 없음" : "", source.pricedRows < source.rows ? "가격 결측 확인" : "", source.duplicateIds > 0 ? "중복 제거 필요" : "", source.datedRate < 100 ? "날짜 결측 확인" : ""].filter(Boolean).join(" · ") || "표본 품질 조건 충족"}</td>
    </tr>)}</AdminTable>
    <h3>실무 점검 기준</h3><ul>{insights.sourceValidation.acceptance.map(item => <li key={item}>{item}</li>)}</ul>
    <h3>수집 메타데이터</h3><p>수집 시작·종료 시각, 최근 성공·실패 시각, 재시도 횟수, 담당자 정보는 현재 원천에 없습니다. 산출물 생성 시각을 마지막 수집 성공 시각으로 해석하지 마세요.</p>
  </section>;
}
