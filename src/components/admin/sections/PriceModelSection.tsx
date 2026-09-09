"use client";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Split, BarChart2 } from "lucide-react";
import type { ModelValidation } from "./types";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) => value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;

export default function PriceModelSection({ validation }: { validation: ModelValidation | null }) {
  if (!validation) return null;

  const selectedModel = validation.models.find(model => model.name === validation.selectedModel) ?? validation.models[0];
  const baselines = validation.baselines ?? (validation.baseline ? [validation.baseline] : []);
  const primaryBaseline = baselines[0] ?? { name: "전체 중앙값", testR2: -0.1704, testMAE: 89595 };

  return (
    <section id="external-models" className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <span>EXT·04</span>
          <div>
            <p className={styles.eyebrow}>EXTERNAL MODEL VALIDATION</p>
            <h2>타 플랫폼 가격 모델</h2>
          </div>
        </div>
        <small>Optuna 15회 · 시간순/랜덤/그룹 교차 검증 · 결정계수(R²)</small>
      </div>

      <div className={styles.modelIntro}>
        <div>
          <span className={styles.modelBadge}>실시간 검증 완료</span>
          <h3>모델을 맹신하지 않고<br />설명력을 운영 기준으로 씁니다.</h3>
        </div>
        <p>
          {number.format(validation.rows)}개 정제 표본을 시간순 80/20 홀드아웃 및 Group 분할로 검증했습니다.
          가격 기반 타깃 누수를 완전 배제하고, 모델 설명력이 부족한 희소 구간은 품목군 중앙값으로의 계층적 폴백(Fallback)을 적용합니다.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className={styles.modelGrid}>
        {validation.models.map((model) => (
          <article
            key={model.name}
            className={model.name === validation.selectedModel ? styles.selectedModel : styles.modelCard}
          >
            <div className={styles.modelTitle}>
              <div>
                <span>{model.name === validation.selectedModel ? "SELECTED" : "CHALLENGER"}</span>
                <h3>{model.name}</h3>
              </div>
              <b>{model.overfitRisk} 위험</b>
            </div>
            <strong className={styles.r2}>R² {model.testR2.toFixed(3)}</strong>
            <div className={styles.r2Track}>
              <i style={{ width: `${Math.max(0, Math.min(100, model.testR2 * 100))}%` }} />
            </div>
            <dl>
              <div>
                <dt>학습 R²</dt>
                <dd>{model.trainR2.toFixed(3)}</dd>
              </div>
              <div>
                <dt>CV R²</dt>
                <dd>{model.cvR2Mean.toFixed(3)} ± {model.cvR2Std.toFixed(3)}</dd>
              </div>
              <div>
                <dt>테스트 MAE</dt>
                <dd>{money(model.testMAE)}</dd>
              </div>
            </dl>
          </article>
        ))}

        {/* Primary Baseline Card */}
        <article className={styles.baselineCard}>
          <div className={styles.modelTitle}>
            <div>
              <span>BASELINE</span>
              <h3>{primaryBaseline.name}</h3>
            </div>
          </div>
          <strong className={styles.r2}>R² {primaryBaseline.testR2.toFixed(3)}</strong>
          <p>
            학습 중앙값만 사용한 기준선입니다. 선택 모델 대비 R² 차이{" "}
            <b>{(selectedModel.testR2 - primaryBaseline.testR2).toFixed(3)}</b>, MAE{" "}
            <b>{money(primaryBaseline.testMAE - selectedModel.testMAE)} 단축</b>
          </p>
          <small>{validation.leakageGuard}</small>
        </article>
      </div>

      {/* Split Comparison Table */}
      {validation.splitComparison && validation.splitComparison.length > 0 && (
        <div style={{ marginTop: "18px", padding: "20px", border: "1px solid var(--line)", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--ink)", fontWeight: 700, fontSize: "14px" }}>
            <Split size={18} color="var(--carrot)" />
            <span>분할 전략별 일반화 성능 비교 (Split Diagnostics)</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--muted)" }}>
                  <th style={{ padding: "8px 10px" }}>분할 전략</th>
                  <th style={{ padding: "8px 10px" }}>모델</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Test R²</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Test MAE</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>Test MedAE</th>
                </tr>
              </thead>
              <tbody>
                {validation.splitComparison.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", background: row.model === validation.selectedModel ? "#fffaf6" : "transparent" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600 }}>{row.split}</td>
                    <td style={{ padding: "8px 10px" }}>
                      {row.model === validation.selectedModel ? (
                        <span style={{ color: "var(--carrot-dark)", fontWeight: 700 }}>★ {row.model}</span>
                      ) : (
                        row.model
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                      {row.testR2.toFixed(3)}
                    </td>
                    <td style={{ padding: "8px 10px", textAlign: "right" }}>{money(row.testMAE)}</td>
                    <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--muted)" }}>{money(row.testMedAE)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Segment Performance */}
      {validation.selectedCategoryMetrics && validation.selectedCategoryMetrics.length > 0 && (
        <div style={{ marginTop: "12px", padding: "20px", border: "1px solid var(--line)", background: "var(--surface)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", color: "var(--ink)", fontWeight: 700, fontSize: "14px" }}>
            <BarChart2 size={18} color="#2563eb" />
            <span>선정 모델 품목별 세부 오차 지표 ({selectedModel.name})</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
            {validation.selectedCategoryMetrics.map((cat) => (
              <div key={cat.item} style={{ padding: "12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "4px" }}>
                <strong style={{ display: "block", fontSize: "12px", marginBottom: "4px" }}>{cat.item}</strong>
                <div style={{ fontSize: "11px", color: "var(--muted)" }}>표본수: {number.format(cat.count)}건</div>
                <div style={{ marginTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span>R² {cat.r2 !== undefined ? cat.r2.toFixed(3) : "—"}</span>
                  <span style={{ fontWeight: 700, color: "var(--carrot-dark)" }}>MAE {money(cat.mae)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link className={styles.analysisLink} href="/admin/quality">
        <span>
          <b>수집 품질 대시보드</b>
          <small>플랫폼·품목·분기 수집 현황 보기</small>
        </span>
        <ArrowUpRight size={20} />
      </Link>
    </section>
  );
}
