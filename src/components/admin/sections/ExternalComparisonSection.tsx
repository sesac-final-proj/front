"use client";

import Link from "next/link";
import { Activity, ChartNoAxesCombined, Database, Gauge, ArrowRight, TrendingUp } from "lucide-react";
import {
  adminAuthorizedFetch,
  getPriceComparisonOverview,
  type ListingSentimentAnalysis,
  type PriceComparisonOverview,
  type PricePlatformComparisonItem,
} from "@/services/adminService";
import { useAdminResource } from "../useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "../AdminUI";
import { comparisonDecisions, PLATFORMS } from "../comparison-data";
import styles from "../portal.module.css";

interface ComparisonData {
  items: PricePlatformComparisonItem[];
  source: string;
  period: string;
  caveat: string;
  sentiment?: ListingSentimentAnalysis;
  regional: PriceComparisonOverview;
}

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
    .filter((row) => row.total >= 5)
    .sort((a, b) => b.negative / b.total - a.negative / a.total || a.score - b.score)
    .slice(0, 8);
  const alertQueue = analysis.decisions.filter((row) => row.priority !== "관찰").slice(0, 6);

  return (
    <section className={styles.comparisonWorkspace}>
      {/* Metrics Strip */}
      <div className={styles.comparisonMetrics} aria-label="외부 비교 핵심 지표">
        <article>
          <Database size={18} />
          <span>분석 표본</span>
          <strong>{analysis.totalSamples.toLocaleString()}건</strong>
          <small>검증 통과 가격 행</small>
        </article>
        <article>
          <ChartNoAxesCombined size={18} />
          <span>공통 비교 품목</span>
          <strong>{analysis.comparable.length}개</strong>
          <small>3개 플랫폼 모두 존재</small>
        </article>
        <article>
          <Gauge size={18} />
          <span>비교 커버리지</span>
          <strong>{analysis.coverage.toFixed(0)}%</strong>
          <small>전체 품목 중 공통 품목</small>
        </article>
        <article className={styles.comparisonAccent}>
          <Activity size={18} />
          <span>최우선 점검</span>
          <strong>{lead?.category ?? "대기"}</strong>
          <small>
            {lead
              ? `당근 대비 외부 ${lead.gapPercent >= 0 ? "+" : ""}${lead.gapPercent.toFixed(1)}%`
              : "공통 표본 필요"}
          </small>
        </article>
      </div>

      {/* Guide Banner to Market Trends Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "#FFF4ED",
          borderRadius: "10px",
          border: "1px solid #FFD8BA",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TrendingUp size={18} color="#DF5900" />
          <span style={{ fontSize: "12px", color: "#632700", fontWeight: 600 }}>
            품목별 거래 기준 비교(다차원 레이더) 및 외부 시장 변화 추이는 전용 메뉴에서 확인하실 수 있습니다.
          </span>
        </div>
        <Link
          href="/admin/market-trends"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "7px 13px",
            borderRadius: "6px",
            background: "#DF5900",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          외부 변화 추이 바로가기 <ArrowRight size={13} />
        </Link>
      </div>

      {/* Operational Briefing */}
      <article className={styles.comparisonBrief}>
        <div>
          <h2>오늘의 운영 판단</h2>
          <p>{data.source} · {data.period}</p>
        </div>
        <p>{data.caveat}</p>
        {!!analysis.excluded && (
          <p role="status">
            검증 제외 {analysis.excluded}행 · 중복 그룹, 유효하지 않은 표본 또는 사분위 순서 오류
          </p>
        )}
      </article>

      {/* External Baseline Table */}
      {analysis.decisions.length ? (
        <article className={styles.comparisonPanel}>
          <header>
            <div>
              <h2>외부 시세 기준선</h2>
              <p>
                품목별 당근·중고나라·번개장터 중앙값과 Q1–Q3를 함께 봅니다. 표본이 충분한 격차만 조치 큐로 올립니다.
              </p>
            </div>
            <span>{analysis.decisions.length}개 공통 품목</span>
          </header>
          {!!alertQueue.length && (
            <div className={styles.comparisonAlertQueue}>
              <strong>외부 가격 격차 알림</strong>
              <span>표본 20건 이상 · 당근 중앙값 대비 ±10% 이상</span>
              {alertQueue.map((row) => (
                <div key={row.category}>
                  <b data-priority={row.priority}>{row.priority}</b>
                  <strong>{row.category}</strong>
                  <span>
                    {row.gapPercent >= 0 ? "외부가" : "당근이"}{" "}
                    {Math.abs(row.gapPercent).toFixed(1)}%{" "}
                    {row.gapPercent >= 0 ? "낮음" : "높음"}
                  </span>
                  <em>{row.action}</em>
                </div>
              ))}
            </div>
          )}
          <AdminTable
            headers={[
              "우선순위",
              "품목",
              "당근 기준선(Q1/중앙/Q3)",
              "외부 기준선(Q1/중앙/Q3)",
              "격차",
              "표본",
              "신뢰도",
            ]}
          >
            {analysis.decisions.map((row) => (
              <tr key={row.category}>
                <td>
                  <b data-priority={row.priority}>{row.priority}</b>
                </td>
                <td>{row.category}</td>
                <td>
                  {Math.round(row.carrotQ1).toLocaleString()} /{" "}
                  {Math.round(row.carrotMedian).toLocaleString()} /{" "}
                  {Math.round(row.carrotQ3).toLocaleString()}원
                </td>
                <td>
                  {Math.round(row.externalQ1).toLocaleString()} /{" "}
                  {Math.round(row.externalMedian).toLocaleString()} /{" "}
                  {Math.round(row.externalQ3).toLocaleString()}원
                </td>
                <td className={row.gapPercent >= 0 ? styles.positiveGap : styles.negativeGap}>
                  {row.gapPercent >= 0 ? "+" : ""}
                  {row.gapPercent.toFixed(1)}%
                </td>
                <td>
                  {row.carrotSamples.toLocaleString()} / {row.externalSamples.toLocaleString()}
                </td>
                <td>{row.confidence}</td>
              </tr>
            ))}
          </AdminTable>
        </article>
      ) : (
        <p className={styles.comparisonEmpty}>
          3개 플랫폼에 함께 존재하는 품목이 없어 운영 우선순위를 계산할 수 없습니다.
        </p>
      )}

      {/* Listing Sentiment Analysis */}
      {data.sentiment && (
        <article className={styles.comparisonPanel}>
          <header>
            <div>
              <h2>매물 문구 감성 분석</h2>
              <p>
                후기 감성이 아닌 제목 속 상품 상태 표현입니다. 긍정은 미개봉·정품·최상, 부정은 하자·고장·사용감 같은 신호입니다.
              </p>
            </div>
            <span>{data.sentiment.analyzed_count.toLocaleString()}건 분석</span>
          </header>
          <div className={styles.sentimentGrid}>
            {data.sentiment.platforms.map((row) => {
              const total = Math.max(1, row.total);
              return (
                <section key={row.platform} className={styles.sentimentPlatform}>
                  <div>
                    <h3>{row.platform}</h3>
                    <strong>
                      {row.score > 0 ? "+" : ""}
                      {row.score.toFixed(1)}
                    </strong>
                  </div>
                  <div
                    className={styles.sentimentBar}
                    aria-label={`${row.platform}: 긍정 ${row.positive}건, 중립 ${row.neutral}건, 부정 ${row.negative}건`}
                  >
                    <i style={{ width: `${(row.positive * 100) / total}%` }} />
                    <i style={{ width: `${(row.neutral * 100) / total}%` }} />
                    <i style={{ width: `${(row.negative * 100) / total}%` }} />
                  </div>
                  <dl>
                    <div>
                      <dt>긍정</dt>
                      <dd>{((row.positive * 100) / total).toFixed(1)}%</dd>
                    </div>
                    <div>
                      <dt>중립</dt>
                      <dd>{((row.neutral * 100) / total).toFixed(1)}%</dd>
                    </div>
                    <div>
                      <dt>부정</dt>
                      <dd>{((row.negative * 100) / total).toFixed(1)}%</dd>
                    </div>
                  </dl>
                  <p>
                    <b>긍정 근거</b> {row.top_positive_terms.join(" · ") || "감지 없음"}
                  </p>
                  <p>
                    <b>부정 근거</b> {row.top_negative_terms.join(" · ") || "감지 없음"}
                  </p>
                </section>
              );
            })}
          </div>
          {!!sentimentRisks.length && (
            <div className={styles.sentimentRisks}>
              <h3>부정 상태 신호 상위 품목</h3>
              <AdminTable headers={["플랫폼", "품목", "제목 표본", "부정 비율", "감성 점수", "주요 근거"]}>
                {sentimentRisks.map((row) => (
                  <tr key={`${row.platform}|${row.category}`}>
                    <td>{row.platform}</td>
                    <td>{row.category}</td>
                    <td>{row.total.toLocaleString()}</td>
                    <td className={styles.negativeGap}>
                      {((row.negative * 100) / row.total).toFixed(1)}%
                    </td>
                    <td>
                      {row.score > 0 ? "+" : ""}
                      {row.score.toFixed(1)}
                    </td>
                    <td>{row.top_negative_terms.join(" · ") || "직접 부정어 없음"}</td>
                  </tr>
                ))}
              </AdminTable>
            </div>
          )}
          <footer>
            <span>점수 = (긍정 건수 - 부정 건수) / 전체 제목 × 100</span>
            <span>{data.sentiment.method}</span>
          </footer>
        </article>
      )}

      {/* Verified Raw Comparison Table */}
      {analysis.rows.length ? (
        <article className={styles.comparisonPanel}>
          <header>
            <div>
              <h2>검증된 비교 원본 수치</h2>
              <p>
                {PLATFORMS.map(
                  (platform) =>
                    `${platform} ${analysis.rows.filter((row) => row.platform === platform).length}개 품목`
                ).join(" · ")}
              </p>
            </div>
          </header>
          <AdminTable headers={["품목", "플랫폼", "표본", "Q1(원)", "중앙값(원)", "Q3(원)"]}>
            {analysis.rows.map((row) => (
              <tr key={`${row.category}|${row.platform}`}>
                <td>{row.category}</td>
                <td>{row.platform}</td>
                <td>{row.sample_count.toLocaleString()}</td>
                <td>{row.p25_price.toLocaleString()}</td>
                <td>{row.median_price.toLocaleString()}</td>
                <td>{row.p75_price.toLocaleString()}</td>
              </tr>
            ))}
          </AdminTable>
        </article>
      ) : null}
    </section>
  );
}
