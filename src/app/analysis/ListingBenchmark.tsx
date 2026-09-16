"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./analysis.module.css";
import {
  evaluateListing,
  inferBenchmarkSelection,
  type BenchmarkCategory,
  type BenchmarkProduct,
} from "./benchmark";

const won = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => value === null ? "N/A" : `${won.format(Math.round(value))}원`;

export function ListingBenchmark({
  products,
  categories,
}: {
  products: BenchmarkProduct[];
  categories: BenchmarkCategory[];
}) {
  const [item, setItem] = useState(products[0]?.item ?? "");
  const [model, setModel] = useState("모델 미상");
  const [price, setPrice] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isRegisteredListing, setIsRegisteredListing] = useState(false);

  const models = useMemo(
    () => Array.from(new Set(products.filter((product) => product.item === item).map((product) => product.model))).sort((a, b) => a.localeCompare(b, "ko")),
    [item, products],
  );
  const result = evaluateListing(products, categories, { item, model, price: Number(price) });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const title = params.get("title")?.trim();
    const queryPrice = params.get("price")?.replace(/[^0-9]/g, "");
    if (!title && !queryPrice) return;
    const frame = window.requestAnimationFrame(() => {
      if (title) {
        const selection = inferBenchmarkSelection(title, products);
        setItem(selection.item);
        setModel(selection.model);
      }
      if (queryPrice) {
        setPrice(queryPrice);
        setHasAnalyzed(Number(queryPrice) > 0);
      }
      setIsRegisteredListing(Boolean(params.get("productId")));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [products]);

  const markerPosition = result ? Math.min(96, Math.max(4, (result.priceIndex - 60) / 100 * 100)) : 50;

  return (
    <section id="listing-benchmark" className={styles.listingLab} aria-labelledby="listing-lab-title">
      <div className={styles.listingIntro}>
        <p>등록 전 가격 점검</p>
        <h2 id="listing-lab-title">내 매물은 시장에서 어디쯤일까?</h2>
        <span>상품과 희망 가격을 입력하면 두 플랫폼의 같은 모델 또는 품목 표본과 바로 비교합니다.</span>
        <div className={styles.outcomeList} aria-label="제공 분석">
          <span><b>가격 위치</b> 시장 기준 대비 높고 낮음</span>
          <span><b>권장 가격대</b> 빠른 판매와 균형 가격</span>
          <span><b>비교 근거</b> 표본 수와 플랫폼 중앙값</span>
          <span><b>신뢰도</b> 표본 규모와 플랫폼 합의도</span>
        </div>
      </div>

      <div className={styles.listingWorkbench}>
        <form
          className={styles.benchmarkForm}
          onSubmit={(event) => {
            event.preventDefault();
            setHasAnalyzed(Boolean(result));
          }}
        >
          <label>품목<select value={item} onChange={(event) => { setItem(event.target.value); setModel("모델 미상"); setHasAnalyzed(false); }}>{categories.map((category) => <option key={category.item}>{category.item}</option>)}</select></label>
          <label>모델<select value={models.includes(model) ? model : "모델 미상"} onChange={(event) => { setModel(event.target.value); setHasAnalyzed(false); }}>{models.map((candidate) => <option key={candidate}>{candidate}</option>)}</select></label>
          <label>희망 가격<input type="number" min="1" inputMode="numeric" value={price} onChange={(event) => { setPrice(event.target.value); setHasAnalyzed(false); }} placeholder="예: 450000" required /></label>
          <button type="submit">내 가격 분석</button>
        </form>

        {!hasAnalyzed || !result ? (
          <div className={styles.benchmarkEmpty}>
            <strong>가격을 입력하면 비교 결과가 여기에 표시됩니다.</strong>
            <span>정확한 모델을 모르면 품목 전체 중앙값을 기준으로 분석합니다.</span>
          </div>
        ) : (
          <div className={styles.benchmarkResult} aria-live="polite">
            {isRegisteredListing && <p className={styles.registeredNotice}>등록 완료. 방금 올린 가격을 외부 시장과 비교했습니다.</p>}
            <div className={styles.resultLead}>
              <div><span>{result.basis === "model" ? `${model} 모델 기준` : `${item} 품목 기준`}</span><strong>{result.position}</strong></div>
              <div><span>가격 지수</span><strong>{result.priceIndex.toFixed(0)}</strong><small>시장 기준 100</small></div>
            </div>
            <div className={styles.priceScale} aria-label={`시장 기준 대비 가격 지수 ${result.priceIndex.toFixed(0)}`}>
              <i style={{ left: `${markerPosition}%` }}><b>{money(Number(price))}</b></i>
              <span>낮음 60</span><span>시장 100</span><span>높음 160+</span>
            </div>
            <div className={styles.resultMetrics}>
              <div><span>외부시장 기준</span><strong>{money(result.benchmarkPrice)}</strong></div>
              <div><span>빠른 판매</span><strong>{money(result.quickSalePrice)}</strong></div>
              <div><span>균형 가격</span><strong>{money(result.balancedPrice)}</strong></div>
              <div><span>비교 신뢰도</span><strong>{result.confidenceLabel} {result.confidenceScore}</strong></div>
            </div>
            <p className={styles.resultAdvice}>{result.recommendation}</p>
            <div className={styles.resultEvidence}>
              <span>번개장터 {money(result.elecmartMedian)}</span>
              <span>중고나라 {money(result.joonggonaraMedian)}</span>
              <span>표본 {won.format(result.sampleCount)}건</span>
              <span>플랫폼 간극 {result.platformSpread === null ? "N/A" : `${result.platformSpread.toFixed(1)}%`}</span>
              <span>관측 중간 50% {money(result.lowerQuartile)}-{money(result.upperQuartile)}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
