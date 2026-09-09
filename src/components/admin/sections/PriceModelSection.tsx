"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ModelValidation } from "./types";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;

export default function PriceModelSection({ validation }: { validation: ModelValidation | null }) {
  const selectedModel = validation?.models.find(model => model.name === validation.selectedModel) ?? validation?.models[0];

  return (
    <>
      {validation && selectedModel && (
        <section id="external-models" className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <span>EXT·04</span>
              <div>
                <p className={styles.eyebrow}>EXTERNAL MODEL VALIDATION</p>
                <h2>타 플랫폼 가격 모델</h2>
              </div>
            </div>
            <small>Optuna 20회 · 시간순 홀드아웃 · 결정계수(R²)</small>
          </div>
          <div className={styles.modelIntro}>
            <div>
              <span className={styles.modelBadge}>검증 완료</span>
              <h3>모델을 맹신하지 않고<br />설명력을 운영 기준으로 씁니다.</h3>
            </div>
            <p>{number.format(validation.rows)}개 정제 표본을 학습·테스트 시간순으로 분리했습니다. R²와 MAE, 교차검증 편차를 함께 확인하고 낮은 설명력 구간은 클러스터 중앙값을 우선합니다.</p>
          </div>
          <div className={styles.modelGrid}>
            {validation.models.map((model) => (
              <article key={model.name} className={model.name === validation.selectedModel ? styles.selectedModel : styles.modelCard}>
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
                  <div><dt>학습 R²</dt><dd>{model.trainR2.toFixed(3)}</dd></div>
                  <div><dt>CV R²</dt><dd>{model.cvR2Mean.toFixed(3)} ± {model.cvR2Std.toFixed(3)}</dd></div>
                  <div><dt>테스트 MAE</dt><dd>{money(model.testMAE)}</dd></div>
                </dl>
              </article>
            ))}
            <article className={styles.baselineCard}>
              <div className={styles.modelTitle}>
                <div>
                  <span>BASELINE</span>
                  <h3>{validation.baseline.name}</h3>
                </div>
              </div>
              <strong className={styles.r2}>R² {validation.baseline.testR2.toFixed(3)}</strong>
              <p>학습 중앙값만 사용한 기준선입니다. 선택 모델 대비 R² 차이 <b>{(selectedModel.testR2 - validation.baseline.testR2).toFixed(3)}</b></p>
              <small>{validation.leakageGuard}</small>
            </article>
          </div>
          <Link className={styles.analysisLink} href="/admin/quality">
            <span><b>수집 품질 대시보드</b><small>플랫폼·품목·분기 수집 현황 보기</small></span>
            <ArrowUpRight size={20} />
          </Link>
        </section>
      )}
    </>
  );
}
