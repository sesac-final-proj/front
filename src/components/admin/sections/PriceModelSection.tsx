"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ModelValidation } from "./types";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) => value == null ? "—" : `${number.format(Math.round(value))}원`;
const riskLabel = (risk: string) => risk === "LOW" ? "낮음" : risk === "MEDIUM" ? "보통" : "확인 필요";

export default function PriceModelSection({ validation }: { validation: ModelValidation | null }) {
  if (!validation) return null;
  const selected = validation.models.find(model => model.name === validation.selectedModel) ?? validation.models[0];
  const baselines = validation.baselines ?? (validation.baseline ? [validation.baseline] : []);
  const baseline = baselines[0];
  const maeImprovement = baseline ? baseline.testMAE - selected.testMAE : null;
  const maxR2 = Math.max(0.01, ...validation.models.map(model => Math.max(0, model.testR2)));
  const categories = validation.selectedCategoryMetrics ?? [];
  const maxCategoryMae = Math.max(1, ...categories.map(category => category.mae));

  return <section className={`${styles.section} ${styles.priceModelSection}`}>
    <article className={styles.priceModelSummary}>
      <header><div><span>배포 모델</span><h2>{selected.name}</h2><p>{validation.split.method} 기준 · {validation.leakageGuard}</p></div><strong>R² {selected.testR2.toFixed(3)}</strong></header>
      <dl><div><dt>학습 표본</dt><dd>{number.format(validation.rows)}건</dd></div><div><dt>테스트 MAE</dt><dd>{money(selected.testMAE)}</dd></div><div><dt>베이스라인 대비</dt><dd>{maeImprovement == null ? "—" : `${money(maeImprovement)} 개선`}</dd></div><div><dt>과적합 위험</dt><dd>{riskLabel(selected.overfitRisk)}</dd></div></dl>
    </article>

    <article className={styles.priceModelPanel}>
      <header className={styles.priceModelPanelHead}><div><h3>모델 성능 비교</h3><p>테스트 R² 막대와 검증 수치를 함께 비교합니다.</p></div><span>선정 모델 주황색 표시</span></header>
      <div className={styles.priceModelCompare}>
        <div className={styles.priceModelBars} aria-label="모델별 테스트 R제곱 비교">{validation.models.map(model => <div key={model.name}><span>{model.name}</span><i><b className={model.name === validation.selectedModel ? styles.priceModelBarSelected : ""} style={{ width: `${Math.max(2, Math.max(0, model.testR2) * 100 / maxR2)}%` }} /></i><strong>{model.testR2.toFixed(3)}</strong></div>)}</div>
        <div className={styles.priceModelTableWrap}><table className={styles.priceModelTable}><thead><tr><th>모델</th><th>학습 R²</th><th>CV R²</th><th>테스트 R²</th><th>MAE</th><th>위험</th></tr></thead><tbody>{validation.models.map(model => <tr key={model.name} data-selected={model.name === validation.selectedModel}><td>{model.name}</td><td>{model.trainR2.toFixed(3)}</td><td>{model.cvR2Mean.toFixed(3)} ± {model.cvR2Std.toFixed(3)}</td><td>{model.testR2.toFixed(3)}</td><td>{money(model.testMAE)}</td><td>{riskLabel(model.overfitRisk)}</td></tr>)}</tbody></table></div>
      </div>
    </article>

    {!!validation.splitComparison?.length && <article className={styles.priceModelPanel}><header className={styles.priceModelPanelHead}><div><h3>분할 전략 검증</h3><p>데이터 분할 방식을 바꿔도 성능이 유지되는지 확인합니다.</p></div></header><div className={styles.priceModelTableWrap}><table className={styles.priceModelTable}><thead><tr><th>분할 전략</th><th>모델</th><th>테스트 R²</th><th>테스트 MAE</th></tr></thead><tbody>{validation.splitComparison.map(row => <tr key={`${row.split}-${row.model}`} data-selected={row.model === validation.selectedModel}><td>{row.split}</td><td>{row.model}</td><td>{row.testR2.toFixed(3)}</td><td>{money(row.testMAE)}</td></tr>)}</tbody></table></div></article>}

    {!!categories.length && <article className={styles.priceModelPanel}><header className={styles.priceModelPanelHead}><div><h3>품목별 예측 오차</h3><p>오차 막대가 길수록 품목별 예측 편차가 큽니다.</p></div></header><div className={styles.priceCategoryRows}>{categories.map(category => <div key={category.item ?? "전체"}><span>{category.item ?? "전체"}<small>{number.format(category.count)}건</small></span><i><b style={{ width: `${category.mae * 100 / maxCategoryMae}%` }} /></i><strong>{money(category.mae)}</strong><em>R² {category.r2?.toFixed(3) ?? "—"}</em></div>)}</div></article>}

    <Link className={styles.analysisLink} href="/admin/quality"><span><b>수집 데이터 품질 검수</b><small>이상치 제거와 학습 표본 구성을 확인합니다.</small></span><ArrowUpRight size={18} /></Link>
  </section>;
}
