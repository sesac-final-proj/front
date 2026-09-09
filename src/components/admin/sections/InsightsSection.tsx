"use client";
import { useState } from "react";
import { BarChart3, MessageSquareText, Sparkles, Tags, ShieldCheck, Cpu } from "lucide-react";
import type { AdminAudienceInsights } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) => value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;

export default function InsightsSection({ insights }: { insights: AdminAudienceInsights | null }) {
  const [clusterFilter, setClusterFilter] = useState<"all" | "reliable" | "noisy">("reliable");

  if (!insights) return null;

  const dataQuality = insights.dataQuality;
  const modelQuality = insights.modelQuality;
  const productClusters = insights.productClusters ?? [];
  const readerGuide = insights.readerGuide ?? [];
  const selectionReasons = insights.selectionReasons ?? [];
  const distributions = insights.distributions ?? [];
  const keywords = insights.keywords ?? [];
  const examples = insights.examples ?? [];
  const llmCategories = insights.llmCategories ?? [];
  const populationRows = insights.population?.rows ?? productClusters.reduce((acc, c) => acc + (c.count || 0), 0);

  const interpretation = insights.interpretation ?? {
    finding: "가격 분포가 넓은 품목은 하나의 평균가보다 모델·규격 클러스터의 중앙값이 등록가 비교에 더 적합합니다.",
    action: "관리자는 이상치 비율과 실제 대표 매물을 먼저 확인하고, LLM 카테고리는 탐색·검수 우선순위에 사용해야 합니다.",
    caveat: "판매완료 표시는 실제 결제가격이나 판매기간을 보장하지 않으므로 회전율은 관측 상태 비율로만 해석합니다.",
  };

  const filteredClusters = productClusters.filter(cluster => {
    if (clusterFilter === "reliable") return cluster.qualityStatus === "reliable";
    if (clusterFilter === "noisy") return cluster.qualityStatus === "noisy";
    return true;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "reliable":
        return <span style={{ color: "#16a34a", background: "#f0fdf4", padding: "2px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px" }}>신뢰 (n≥10)</span>;
      case "limited":
        return <span style={{ color: "#ca8a04", background: "#fefce8", padding: "2px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px" }}>제한 (5≤n&lt;10)</span>;
      case "noisy":
        return <span style={{ color: "#ea580c", background: "#fff7ed", padding: "2px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px" }}>분산주의</span>;
      default:
        return <span style={{ color: "#64748b", background: "#f1f5f9", padding: "2px 6px", fontSize: "10px", fontWeight: 700, borderRadius: "3px" }}>희소 (n&lt;5)</span>;
    }
  };

  return (
    <>
      <section id="external-interpretation" className={styles.section}>
        <div className={styles.sectionHead}>
          <div>
            <span>EXT·01</span>
            <div>
              <p className={styles.eyebrow}>EXTERNAL MARKET ONLY</p>
              <h2>타 플랫폼 비교 브리핑</h2>
            </div>
          </div>
          <small>중고나라·번개장터 정제 표본 {number.format(populationRows)}건 (실시간 검증)</small>
        </div>

        <div className={styles.briefHero}>
          <div>
            <span>핵심 해석</span>
            <h3>{interpretation.finding}</h3>
          </div>
          <div>
            <b>운영 제안</b>
            <p>{interpretation.action}</p>
            <small>{interpretation.caveat}</small>
          </div>
        </div>

        {/* Real-time Data Quality & Model Quality Governance Banner */}
        {(dataQuality || modelQuality) && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginTop: "12px" }}>
            {dataQuality && (
              <article style={{ border: "1px solid var(--line)", background: "var(--surface)", padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--carrot-dark)", fontWeight: 800, fontSize: "13px" }}>
                  <ShieldCheck size={18} />
                  <span>데이터 품질 거버넌스 (Data Quality)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "14px" }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>정제 전/후</span>
                    <strong style={{ display: "block", fontSize: "13px", marginTop: "4px" }}>
                      {number.format(dataQuality.rowsBeforeCleaning)} → {number.format(dataQuality.rowsAfterCleaning)}건
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>제외율</span>
                    <strong style={{ display: "block", fontSize: "13px", marginTop: "4px", color: "#e11d48" }}>
                      {dataQuality.removedRate}% ({number.format(dataQuality.removedRows)}건)
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>신뢰 클러스터</span>
                    <strong style={{ display: "block", fontSize: "13px", marginTop: "4px", color: "#16a34a" }}>
                      {dataQuality.reliableClusters}개 / {dataQuality.totalClusters}개
                    </strong>
                  </div>
                </div>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>
                  • 부품/소모품 단품 {number.format(dataQuality.accessoryRows)}건, 비현실가/자리표시 {number.format(dataQuality.invalidPriceRows)}건 원천 차단
                </div>
              </article>
            )}

            {modelQuality && (
              <article style={{ border: "1px solid var(--line)", background: "var(--surface)", padding: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#2563eb", fontWeight: 800, fontSize: "13px" }}>
                  <Cpu size={18} />
                  <span>가격 모델 검증 품질 (Model Quality)</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "14px" }}>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>선정 모델</span>
                    <strong style={{ display: "block", fontSize: "13px", marginTop: "4px" }}>{modelQuality.selectedModel}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>테스트 R²</span>
                    <strong style={{ display: "block", fontSize: "13px", marginTop: "4px", color: "#2563eb" }}>
                      {modelQuality.r2.toFixed(3)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--muted)", fontSize: "11px" }}>테스트 MAE</span>
                    <strong style={{ display: "block", fontSize: "13px", marginTop: "4px" }}>
                      {money(modelQuality.mae)}
                    </strong>
                  </div>
                </div>
                <div style={{ marginTop: "10px", fontSize: "11px", color: "#64748b", lineHeight: 1.5 }}>
                  • 기준선(R² {modelQuality.baselineR2.toFixed(3)}, MAE {money(modelQuality.baselineMAE)}) 대비 오차 {money(modelQuality.baselineMAE - modelQuality.mae)} 단축
                </div>
              </article>
            )}
          </div>
        )}

        {readerGuide.length > 0 && (
          <div className={styles.guideGrid}>
            {readerGuide.map((guide, index) => (
              <article key={guide.question}>
                <span>0{index + 1}</span>
                <h3>{guide.question}</h3>
                <p>{guide.answer}</p>
              </article>
            ))}
          </div>
        )}

        {selectionReasons.length > 0 && (
          <div className={styles.methodPanel}>
            <div>
              <p className={styles.eyebrow}>WHY THESE LISTINGS</p>
              <h3>이 표본을 선정한 이유</h3>
            </div>
            <ol>
              {selectionReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ol>
          </div>
        )}

        {distributions.length > 0 && (
          <div className={styles.distributionPanel}>
            <div className={styles.panelHead}>
              <div>
                <h3>품목별 가격 분포</h3>
                <p>막대는 Q1~Q3, 점은 중앙값 · 이상치는 IQR 1.5배 밖의 비율</p>
              </div>
              <BarChart3 size={18} />
            </div>
            <div className={styles.distributionList}>
              {distributions.map((row) => {
                const maxPrice = Math.max(...distributions.map((item) => item.q3 || 1));
                return (
                  <div key={row.item} className={styles.distributionRow}>
                    <div>
                      <b>{row.item}</b>
                      <small>n={number.format(row.count)} · 이상치 {row.outlierRate}%</small>
                    </div>
                    <div className={styles.rangeTrack}>
                      <i style={{ left: `${(row.q1 / maxPrice) * 100}%`, width: `${Math.max(2, ((row.q3 - row.q1) / maxPrice) * 100)}%` }} />
                      <b style={{ left: `${(row.median / maxPrice) * 100}%` }} />
                    </div>
                    <strong>{money(row.median)}</strong>
                    <p>{row.interpretation}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Product Clusters Table */}
        {productClusters.length > 0 && (
          <div className={styles.keywordPanel}>
            <div className={styles.panelHead} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>제품 클러스터 기준표 (품질 상태 분류)</h3>
                <p>제품명·정규화 모델·용량·상태별 대표 가격 및 표본 품질</p>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => setClusterFilter("reliable")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: clusterFilter === "reliable" ? 700 : 500,
                    background: clusterFilter === "reliable" ? "#16a34a" : "var(--surface)",
                    color: clusterFilter === "reliable" ? "#fff" : "var(--muted)",
                    border: "1px solid var(--line)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  신뢰 클러스터 ({productClusters.filter(c => c.qualityStatus === "reliable").length})
                </button>
                <button
                  type="button"
                  onClick={() => setClusterFilter("all")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: clusterFilter === "all" ? 700 : 500,
                    background: clusterFilter === "all" ? "var(--carrot)" : "var(--surface)",
                    color: clusterFilter === "all" ? "#fff" : "var(--muted)",
                    border: "1px solid var(--line)",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  전체 ({productClusters.length})
                </button>
              </div>
            </div>
            <div className={styles.keywordGrid}>
              {filteredClusters.slice(0, 30).map((cluster) => (
                <div key={cluster.cluster} style={{ position: "relative" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <b>{cluster.item}</b>
                    {getStatusBadge(cluster.qualityStatus)}
                  </div>
                  <span>{cluster.model} · {cluster.condition}</span>
                  <strong>{money(cluster.median)}</strong>
                  <small>
                    n={number.format(cluster.count)} · {cluster.platformCount}개 플랫폼 · IQR {money(cluster.iqr ?? (cluster.q3 - cluster.q1))}
                  </small>
                </div>
              ))}
            </div>
            {filteredClusters.length > 30 && (
              <p style={{ textAlign: "center", marginTop: "12px", color: "var(--muted)", fontSize: "11px" }}>
                상위 30개 클러스터 표시 중 (총 {filteredClusters.length}개)
              </p>
            )}
          </div>
        )}
      </section>

      {/* Semantic Layer & Examples */}
      {(llmCategories.length > 0 || keywords.length > 0 || examples.length > 0) && (
        <section id="external-keywords" className={`${styles.section} ${styles.continuedSection}`}>
          <div className={styles.sectionHead}>
            <div>
              <span>EXT·02</span>
              <div>
                <p className={styles.eyebrow}>EXTERNAL SEMANTIC LAYER</p>
                <h2>타 플랫폼 키워드와 LLM 카테고리</h2>
              </div>
            </div>
            <small>{insights.llm?.provider ?? "OmniRoute"} · {insights.llm?.model ?? "gemini-3.7-flash"}</small>
          </div>
          <div className={styles.llmNote}>
            <Sparkles size={18} />
            <p>
              <b>역할을 분리했습니다.</b> 가격·분포·빈도는 통계 코드가 계산하고, LLM은 집계 결과와 실제 제목을 읽어 의미 카테고리와 검수 관점을 붙였습니다. {insights.llm?.guardrail ?? ""}
            </p>
          </div>
          {llmCategories.length > 0 && (
            <div className={styles.semanticGrid}>
              {llmCategories.map((category) => (
                <article key={category.name}>
                  <span>LLM CATEGORY</span>
                  <h3>{category.name}</h3>
                  <p>{category.definition}</p>
                  <div>
                    {category.signals?.slice(0, 6).map((signal) => (
                      <b key={signal}>{signal}</b>
                    ))}
                  </div>
                  <dl>
                    <dt>관리 활용</dt>
                    <dd>{category.adminUse}</dd>
                    <dt>주의</dt>
                    <dd>{category.caution}</dd>
                  </dl>
                </article>
              ))}
            </div>
          )}
          {keywords.length > 0 && (
            <div className={styles.keywordPanel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>제목 키워드 실제 관측</h3>
                  <p>등장 매물 수 · 전체 중앙값 대비 가격지수 · 관측 완료상태 비율</p>
                </div>
                <Tags size={18} />
              </div>
              <div className={styles.keywordGrid}>
                {keywords.map((keyword) => (
                  <div key={keyword.keyword}>
                    <b>{keyword.keyword}</b>
                    <span>{number.format(keyword.count)}건</span>
                    <strong>가격지수 {keyword.medianIndex}</strong>
                    <small>완료상태 {keyword.completionRate}%</small>
                  </div>
                ))}
              </div>
              <p className={styles.dataCaveat}>
                키워드는 제목에 함께 등장한 상관 신호입니다. 특정 단어가 가격이나 판매 완료를 유발한다고 해석하지 않습니다.
              </p>
            </div>
          )}
          {examples.length > 0 && (
            <div className={styles.examplePanel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>실제 데이터로 확인</h3>
                  <p>품목 중앙값에 가까운 양 플랫폼 대표 사례</p>
                </div>
                <MessageSquareText size={18} />
              </div>
              <div className={styles.exampleGrid}>
                {examples.map((example) => (
                  <a key={`${example.platform}-${example.title}`} href={example.url} target="_blank" rel="noreferrer">
                    <span>{example.item} · {example.platform}</span>
                    <h4>{example.title}</h4>
                    <b>{money(example.price)}</b>
                    <small>{example.model} · {example.status}</small>
                    <p>{example.reason}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
