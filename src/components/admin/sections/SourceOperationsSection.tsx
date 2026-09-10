"use client";
import type { AdminAudienceInsights } from "@/services/adminService";
import { AdminTable } from "../AdminUI";
import { ComparisonSourceSummary } from "../ComparisonSourceSummary";
import styles from "../portal.module.css";
export default function SourceOperationsSection({ insights }: { insights: AdminAudienceInsights | null }) {
  if (!insights) return <p>수집원 데이터가 없습니다.</p>;
  const sources = insights.sourceValidation.sources;
  return <section className={styles.card}><h2>수집원 운영 점검</h2><ComparisonSourceSummary /><h3>외부 데이터 품질 보고서</h3><p>아래 보고서는 별도 분석 산출물이며 위 가격 비교 집계와 범위가 다를 수 있습니다.</p><p>산출물 생성 시각: {insights.asOf} · 실시간 파이프라인 상태는 별도 미제공</p>
    <AdminTable headers={["수집원", "상태", "표본", "가격 유효율", "모델 식별률", "날짜 식별률", "중복 ID", "점검 사항"]}>{sources.map(source => <tr key={source.id}>
      <td>{source.name}</td><td>{source.status}</td><td>{source.rows.toLocaleString()}</td><td>{source.rows ? `${(source.pricedRows / source.rows * 100).toFixed(1)}%` : "미산출"}</td><td>{source.modelKnownRate}%</td><td>{source.datedRate}%</td><td>{source.duplicateIds}</td>
      <td>{[source.rows === 0 ? "수집 결과 없음" : "", source.pricedRows < source.rows ? "가격 결측 확인" : "", source.duplicateIds > 0 ? "중복 제거 필요" : "", source.datedRate < 100 ? "날짜 결측 확인" : ""].filter(Boolean).join(" · ") || "표본 품질 조건 충족"}</td>
    </tr>)}</AdminTable>
    <h3>실무 점검 기준</h3><ul>{insights.sourceValidation.acceptance.map(item => <li key={item}>{item}</li>)}</ul>
    <h3>수집 메타데이터</h3><p>수집 시작·종료 시각, 최근 성공·실패 시각, 재시도 횟수, 담당자 정보는 현재 원천에 없습니다. 산출물 생성 시각을 마지막 수집 성공 시각으로 해석하지 마세요.</p>
    <h3>추가 연결 대기</h3><AdminTable headers={["수집원", "상태", "연결 내용"]}>{insights.sourceValidation.futureSlots.map(slot => <tr key={slot.id}><td>{slot.name}</td><td>{slot.status}</td><td>{slot.description}</td></tr>)}</AdminTable>
  </section>;
}
