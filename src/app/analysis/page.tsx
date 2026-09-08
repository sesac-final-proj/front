"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./analysis.module.css";
import { ListingBenchmark } from "./ListingBenchmark";

type Platform = { name: string; rows: number; meanPrice: number; trimmedMeanPrice: number; medianPrice: number; standardDeviation: number | null; coefficientOfVariation: number | null; meanConfidenceInterval95: [number, number] | null; meanMedianGapPct: number | null; duplicateRate: number; statuses: Record<string, number> };
type ProductStats = { count: number; mean: number | null; trimmedMean: number | null; median: number | null; q1: number | null; q3: number | null; standardDeviation: number | null; coefficientOfVariation: number | null; meanConfidenceInterval95: [number, number] | null; meanMedianGapPct: number | null };
type Quarter = { label: string; platform: string; product: string; item: string; model: string; count: number; mean: number | null; median: number | null; selling: number; reserved: number; sold: number };
type Product = { name: string; item: string; model: string; referencePrice: number | null; elecmartVsJoonggonaraPct: number | null; elecmart: ProductStats; joonggonara: ProductStats };
type Comparison = { item: string; elecmartCount: number; joonggonaraCount: number; elecmartMean: number | null; joonggonaraMean: number | null; elecmartTrimmedMean: number | null; joonggonaraTrimmedMean: number | null; elecmartStandardDeviation: number | null; joonggonaraStandardDeviation: number | null; elecmartMedian: number | null; joonggonaraMedian: number | null; medianDifference: number | null; elecmartPremiumPct: number | null; meanDifference: number | null; confidenceInterval95: [number, number] | null; tStatistic: number | null; pValue: number | null; cohensD: number | null };
type AnalysisData = { rowCount: number; fileCount: number; overallStats: ProductStats; overallComparison: Pick<Comparison, "elecmartCount" | "joonggonaraCount" | "meanDifference" | "confidenceInterval95" | "tStatistic" | "pValue" | "cohensD">; platforms: Platform[]; products: Product[]; quarters: Quarter[]; comparison: Comparison[]; expensive: { product: string | null; platform: string | null; mean: number | null }; preprocessing: { rawRowCount: number; excludedRowCount: number; excludedByReason: Record<string, number> }; correlations: { favorites: { count: number; rho: number }; comments: { count: number; rho: number | null } }; coverage: { datedRowCount: number; datedRowRate: number; from: string | null; to: string | null } };
type DashboardView = "decision" | "models" | "quarters" | "comparison" | "method";

const won = new Intl.NumberFormat("ko-KR");
const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => value === null ? "N/A" : `${won.format(Math.round(value))}원`;
const platformName = (value: string) => value === "elecmart" ? "번개장터" : value === "joonggonara" ? "중고나라" : value;
const effectLabel = (value: number | null) => value === null ? "판단 불가" : Math.abs(value) < 0.2 ? "매우 작음" : Math.abs(value) < 0.5 ? "작음" : Math.abs(value) < 0.8 ? "중간" : "큼";
const significanceLabel = (value: number | null) => value !== null && value < 0.05 ? "유의한 차이" : "차이 불확실";

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState("전체");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("전체");
  const [selectedPlatform, setSelectedPlatform] = useState("전체");
  const [selectedQuarter, setSelectedQuarter] = useState("전체");
  const [sortBy, setSortBy] = useState("price-desc");
  const [dashboardView, setDashboardView] = useState<DashboardView>("decision");

  useEffect(() => {
    fetch("/analysis-data.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load"))))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <main className={styles.state}>분석 데이터를 불러오지 못했습니다.</main>;
  if (!data) return <main className={styles.state}>분석 데이터를 불러오는 중입니다.</main>;

  const items = ["전체", ...Array.from(new Set(data.products.map((product) => product.item)))];
  const products = ["전체", ...Array.from(new Set(data.products.filter((product) => selectedItem === "전체" || product.item === selectedItem).map((product) => product.model)))];
  const platforms = ["전체", ...Array.from(new Set(data.quarters.map((quarter) => quarter.platform)))];
  const quarters = ["전체", ...Array.from(new Set(data.quarters.map((quarter) => quarter.label))).sort().reverse()];
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProducts = data.products.filter((product) => {
    const matchesItem = selectedItem === "전체" || product.item === selectedItem;
    const matchesProduct = selectedProduct === "전체" || product.model === selectedProduct;
    const matchesQuery = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery) || product.item.toLowerCase().includes(normalizedQuery);
    return matchesItem && matchesProduct && matchesQuery;
  }).sort((left, right) => {
    if (sortBy === "product") return left.name.localeCompare(right.name, "ko");
    const leftMean = Math.max(left.elecmart.mean ?? -1, left.joonggonara.mean ?? -1);
    const rightMean = Math.max(right.elecmart.mean ?? -1, right.joonggonara.mean ?? -1);
    return rightMean - leftMean;
  });
  const visibleProductNames = new Set(filteredProducts.map((product) => product.name));
  const filteredQuarters = data.quarters.filter((quarter) => visibleProductNames.has(quarter.product) && (selectedPlatform === "전체" || quarter.platform === selectedPlatform) && (selectedQuarter === "전체" || quarter.label === selectedQuarter)).sort((left, right) => {
    if (sortBy === "quarter") return right.label.localeCompare(left.label);
    if (sortBy === "product") return left.product.localeCompare(right.product, "ko");
    return (right.mean ?? -1) - (left.mean ?? -1);
  });
  const productNumbers = new Map(filteredProducts.map((product, index) => [product.name, String(index + 1).padStart(2, "0")]));
  const rankedProducts = filteredProducts
    .flatMap((product) => ["elecmart", "joonggonara"].map((platform) => ({ name: product.name, platform, ...product[platform as "elecmart" | "joonggonara"] })))
    .filter((product): product is typeof product & { mean: number } => product.mean !== null && product.count >= 5)
    .filter((product) => selectedPlatform === "전체" || product.platform === selectedPlatform)
    .sort((left, right) => sortBy === "product" ? left.name.localeCompare(right.name, "ko") : right.mean - left.mean)
    .slice(0, 10);
  const maxRankedMean = rankedProducts[0]?.mean ?? 1;
  const quarterlyTotals = Array.from(new Set(filteredQuarters.map((quarter) => quarter.label))).sort().map((label) => {
    const quarters = filteredQuarters.filter((quarter) => quarter.label === label && quarter.mean !== null);
    const count = quarters.reduce((sum, quarter) => sum + quarter.count, 0);
    const mean = count ? quarters.reduce((sum, quarter) => sum + (quarter.mean ?? 0) * quarter.count, 0) / count : null;
    return { label, count, mean };
  }).filter((quarter): quarter is { label: string; count: number; mean: number } => quarter.mean !== null);
  const maxQuarterMean = Math.max(...quarterlyTotals.map((quarter) => quarter.mean), 1);
  const categoryComparisons = data.comparison.filter((comparison) => selectedItem === "전체" || comparison.item === selectedItem);
  const selectedProductCount = filteredProducts.length;
  const selectedSampleCount = filteredProducts.reduce((sum, product) => sum + product.elecmart.count + product.joonggonara.count, 0);
  const validComparisons = categoryComparisons.filter((item) => item.meanDifference !== null);
  const averageGap = validComparisons.reduce((sum, item) => sum + Math.abs(item.meanDifference ?? 0), 0) / Math.max(validComparisons.length, 1);
  const significantComparisons = categoryComparisons.filter((item) => item.pValue !== null && item.pValue < 0.05);
  const closestAgreement = [...categoryComparisons].filter((item) => item.elecmartPremiumPct !== null).sort((left, right) => Math.abs(left.elecmartPremiumPct ?? 0) - Math.abs(right.elecmartPremiumPct ?? 0))[0];
  const largestGap = [...categoryComparisons].filter((item) => item.elecmartPremiumPct !== null).sort((left, right) => Math.abs(right.elecmartPremiumPct ?? 0) - Math.abs(left.elecmartPremiumPct ?? 0))[0];
  const totalMean = data.overallStats.mean ?? 0;
  const totalMedian = data.overallStats.median ?? 0;
  const meanMedianGap = totalMedian ? (totalMean - totalMedian) / totalMedian * 100 : null;
  const maxPlatformPrice = Math.max(...data.platforms.flatMap((platform) => [platform.meanPrice, platform.trimmedMeanPrice, platform.medianPrice]), 1);
  const unknownModelRows = data.products.filter((product) => product.model === "모델 미상").reduce((sum, product) => sum + product.elecmart.count + product.joonggonara.count, 0);
  const identifiedModelRate = data.rowCount ? (data.rowCount - unknownModelRows) / data.rowCount * 100 : 0;
  const exclusionRate = data.preprocessing.rawRowCount ? data.preprocessing.excludedRowCount / data.preprocessing.rawRowCount * 100 : 0;
  const decisionRows = filteredProducts.map((product) => {
    const medians = [product.elecmart.median, product.joonggonara.median].filter((value): value is number => value !== null);
    const marketMedian = medians.length ? medians.reduce((sum, value) => sum + value, 0) / medians.length : null;
    const sampleCount = product.elecmart.count + product.joonggonara.count;
    const spread = product.elecmart.median !== null && product.joonggonara.median !== null && marketMedian
      ? Math.abs(product.elecmart.median - product.joonggonara.median) / marketMedian * 100
      : null;
    const confidence = sampleCount >= 20 && spread !== null && spread <= 20 ? "높음" : sampleCount >= 5 ? "보통" : "낮음";
    return { product, marketMedian, quickPrice: marketMedian ? marketMedian * 0.90 : null, balancedPrice: marketMedian ? marketMedian * 0.97 : null, spread, confidence, sampleCount };
  }).filter((row) => row.marketMedian !== null && row.product.elecmart.count > 0 && row.product.joonggonara.count > 0 && row.sampleCount >= 5).sort((left, right) => (right.marketMedian ?? 0) - (left.marketMedian ?? 0));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topbar}><Link href="/" className={styles.back}>가지를 아시나요</Link><span className={styles.status}>관측 종료 {data.coverage.to}</span></div>
        <div className={styles.headerCopy}><div><p className={styles.kicker}>내 매물 가격 분석</p><h1 className={styles.title}>올리기 전에<br /><em>가격부터 비교하세요</em></h1></div><div className={styles.heroBody}><p className={styles.intro}>내 매물을 번개장터와 중고나라 표본에 대조해 가격 위치, 권장 가격, 비교 신뢰도를 확인하세요.</p><a href="#listing-benchmark" className={styles.heroAction}>내 매물 비교하기</a></div></div>
      </header>

      <ListingBenchmark products={data.products} categories={data.comparison} />

      <aside className={styles.scopeNotice}><b>분석 범위</b><span>이 화면은 당근의 실제 거래 성과가 아닌 <strong>번개장터·중고나라 관측 매물 분석</strong>입니다. 아래 가격은 당근 등록가 결정을 위한 외부 벤치마크이며 거래 성사 가격을 뜻하지 않습니다.</span></aside>

      <section className={styles.metrics} aria-label="분석 범위">
        <Metric label="전체 관측" value={`${number.format(data.rowCount)}건`} detail={`원본 ${data.fileCount}개`} />
        <Metric label="선택 모델" value={`${number.format(selectedProductCount)}개`} detail={`표본 ${number.format(selectedSampleCount)}건`} />
        <Metric label="교차 확인 모델" value={`${number.format(decisionRows.length)}개`} detail="양 플랫폼 합계 5건 이상" />
        <Metric label="평균 가격 간극" value={money(averageGap || null)} detail="품목별 절대 차이" />
      </section>

      <section className={styles.insightSection} aria-label="핵심 분석 결과">
        <div className={styles.sectionHeading}><div><h2>지금 읽어야 할 분석 결론</h2></div><span className={styles.sectionHint}>현재 필터 기준</span></div>
        <div className={styles.insightGrid}>
          <article><span>01 · 플랫폼 합의</span><strong>{closestAgreement ? closestAgreement.item : "표본 부족"}</strong><p>{closestAgreement ? `중앙값 차이 ${Math.abs(closestAgreement.elecmartPremiumPct ?? 0).toFixed(1)}%로 두 시장이 가장 비슷합니다. 당근 가격 기준으로 활용하기 상대적으로 안정적입니다.` : "비교 가능한 품목이 없습니다."}</p></article>
          <article><span>02 · 주의가 필요한 품목</span><strong>{largestGap ? largestGap.item : "표본 부족"}</strong><p>{largestGap ? `플랫폼 중앙값이 ${Math.abs(largestGap.elecmartPremiumPct ?? 0).toFixed(1)}% 벌어집니다. 단일 플랫폼 가격을 그대로 적용하지 말고 상태·모델을 추가 확인하세요.` : "비교 가능한 품목이 없습니다."}</p></article>
          <article><span>03 · 통계적 차이</span><strong>{significantComparisons.length}개 품목</strong><p>{significantComparisons.length ? `${significantComparisons.map((item) => item.item).join(", ")}에서 평균가 차이가 유의했습니다(p<0.05). 다만 효과크기와 모델 구성을 함께 봐야 합니다.` : "현재 표본에서는 유의한 평균가 차이가 확인되지 않았습니다."}</p></article>
        </div>
      </section>

      <section className={styles.section} aria-label="평균 가격 진단">
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>MEAN DIAGNOSTICS</p><h2>평균이 말하는 것과 숨기는 것</h2></div><span className={styles.sectionHint}>전체 유효 가격 {number.format(data.overallStats.count)}건</span></div>
        <div className={styles.meanSummary}>
          <article><span>통합 표본평균</span><strong>{money(data.overallStats.mean)}</strong><small>모평균 95% CI* {data.overallStats.meanConfidenceInterval95 ? `${money(data.overallStats.meanConfidenceInterval95[0])}-${money(data.overallStats.meanConfidenceInterval95[1])}` : "N/A"}</small></article>
          <article><span>10% 절사평균</span><strong>{money(data.overallStats.trimmedMean)}</strong><small>상·하위 극단값 각 10% 제외</small></article>
          <article><span>전체 중앙값</span><strong>{money(data.overallStats.median)}</strong><small>관측값의 정가운데(50%) 가격</small></article>
          <article className={styles.meanWarning}>
            <span>평균-중앙값 왜곡률</span>
            <strong>{meanMedianGap === null ? "N/A" : `${meanMedianGap > 0 ? "+" : ""}${meanMedianGap.toFixed(1)}%`}</strong>
            <small>{meanMedianGap !== null && meanMedianGap >= 15 ? "고가 매물이 평균을 끌어올림 (중앙값 권장)" : meanMedianGap !== null && meanMedianGap <= -15 ? "저가 매물이 평균을 낮춤 (중앙값 권장)" : "평균 왜곡이 비교적 제한적"}</small>
          </article>
        </div>
        <div className={styles.meanPanels}>
          {data.platforms.map((platform) => <article className={styles.meanPanel} key={`mean-${platform.name}`}>
            <div className={styles.meanPanelHead}><div><span>{platformName(platform.name)}</span><strong>{money(platform.meanPrice)}</strong></div><em>n={number.format(platform.rows)}</em></div>
            <div className={styles.meanBars}>
              <div><span>평균</span><i><b style={{ width: `${platform.meanPrice / maxPlatformPrice * 100}%` }} /></i><strong>{money(platform.meanPrice)}</strong></div>
              <div><span>절사평균</span><i><b style={{ width: `${platform.trimmedMeanPrice / maxPlatformPrice * 100}%` }} /></i><strong>{money(platform.trimmedMeanPrice)}</strong></div>
              <div><span>중앙값</span><i><b style={{ width: `${platform.medianPrice / maxPlatformPrice * 100}%` }} /></i><strong>{money(platform.medianPrice)}</strong></div>
            </div>
            <p>변동계수 {platform.coefficientOfVariation === null ? "N/A" : `${platform.coefficientOfVariation.toFixed(1)}%`} · 평균 신뢰구간 {platform.meanConfidenceInterval95 ? `${money(platform.meanConfidenceInterval95[0])}-${money(platform.meanConfidenceInterval95[1])}` : "N/A"}</p>
          </article>)}
        </div>
        <div className={styles.hypothesisCallout}>
          <span>표본평균 기반 플랫폼 모평균 차이 검정 · Welch t-test</span>
          <strong>
            {(data.overallComparison.meanDifference ?? 0) < 0
              ? `번개장터 평균이 ${money(Math.abs(data.overallComparison.meanDifference ?? 0))} 더 낮음`
              : `번개장터 평균이 ${money(data.overallComparison.meanDifference ?? 0)} 더 높음`}
          </strong>
          <p>
            95% 신뢰구간 {data.overallComparison.confidenceInterval95 ? `${money(data.overallComparison.confidenceInterval95[0])} ~ ${money(data.overallComparison.confidenceInterval95[1])}` : "N/A"} · 
            p-value={data.overallComparison.pValue?.toFixed(4) ?? "N/A"} · 
            효과크기 d={data.overallComparison.cohensD?.toFixed(2) ?? "N/A"} ({effectLabel(data.overallComparison.cohensD)})
          </p>
          <em>
            {data.overallComparison.pValue !== null && data.overallComparison.pValue < 0.05
              ? "통계적으로 두 플랫폼의 평균가 차이가 유의하나, 효과크기가 매우 작아 플랫폼 자체보다 품목·모델 구성 차이가 가격을 더 크게 설명합니다."
              : "현재 표본만으로 플랫폼 모평균 차이를 확인하기 어렵습니다."}
          </em>
        </div>
        <p className={styles.analysisNote}><b>해석:</b> 평균은 고가 매물에 민감합니다. 평균과 절사평균·중앙값의 간격이 클수록 당근 등록가 기준에는 중앙값 또는 절사평균을 우선 사용하세요. *모평균 신뢰구간과 검정은 수집 매물이 각 플랫폼 시장을 대표하는 확률표본이라는 가정하의 참고 추론입니다.</p>
      </section>

      <section className={styles.section} aria-label="품목별 비교 요약">
        <div className={styles.sectionHeading}><div><h2>품목별 플랫폼 비교 한눈에 보기</h2></div><span className={styles.sectionHint}>번개장터 vs 중고나라 플랫폼 비교</span></div>
        <div className={styles.comparisonTableWrap}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>품목</th>
                <th>번개장터 (표본 / 평균 / 중앙값)</th>
                <th>중고나라 (표본 / 평균 / 중앙값)</th>
                <th>평균 차이</th>
                <th>중앙값 차이 (격차%)</th>
                <th>95% CI</th>
                <th>효과크기</th>
                <th>판정</th>
              </tr>
            </thead>
            <tbody>
              {categoryComparisons.map((item) => (
                <tr key={`matrix-${item.item}`}>
                  <td><strong>{item.item}</strong></td>
                  <td>
                    <span>{money(item.elecmartMedian)} (중앙)</span>
                    <small>평균 {money(item.elecmartMean)} · n={number.format(item.elecmartCount)}</small>
                  </td>
                  <td>
                    <span>{money(item.joonggonaraMedian)} (중앙)</span>
                    <small>평균 {money(item.joonggonaraMean)} · n={number.format(item.joonggonaraCount)}</small>
                  </td>
                  <td className={(item.meanDifference ?? 0) >= 0 ? styles.positive : styles.negative}>
                    {item.meanDifference === null ? "N/A" : money(item.meanDifference)}
                  </td>
                  <td className={(item.medianDifference ?? 0) >= 0 ? styles.positive : styles.negative}>
                    {item.medianDifference === null ? "N/A" : `${money(item.medianDifference)} (${item.elecmartPremiumPct !== null ? `${item.elecmartPremiumPct > 0 ? "+" : ""}${item.elecmartPremiumPct.toFixed(1)}%` : "N/A"})`}
                  </td>
                  <td>{item.confidenceInterval95 ? `${money(item.confidenceInterval95[0])} ~ ${money(item.confidenceInterval95[1])}` : "N/A"}</td>
                  <td>{item.cohensD === null ? "N/A" : `${item.cohensD.toFixed(2)} · ${effectLabel(item.cohensD)}`}</td>
                  <td>
                    <span className={item.pValue !== null && item.pValue < 0.05 ? styles.significant : styles.uncertain}>{significanceLabel(item.pValue)}</span>
                    <small>p={item.pValue === null ? "N/A" : item.pValue.toFixed(4)}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.analysisNote}><b>읽는 법:</b> 평균 차이 = 번개장터 평균 - 중고나라 평균입니다. 신뢰구간이 0을 포함하지 않고 p&lt;0.05일 때 평균 차이를 유의하다고 표시합니다.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><h2>플랫폼별 요약</h2></div><span className={styles.sectionHint}>수집 표본의 가격 분포와 상태</span></div>
        <div className={styles.platformGrid}>
          {data.platforms.map((platform) => <article className={styles.platform} key={platform.name}>
            <div className={styles.platformTop}><h3>{platformName(platform.name)}</h3><span>{number.format(platform.rows)}건</span></div>
            <div className={styles.pricePair}><div><small>평균</small><strong>{money(platform.meanPrice)}</strong></div><div><small>중앙값</small><strong>{money(platform.medianPrice)}</strong></div></div>
            <div className={styles.statuses}>{Object.entries(platform.statuses).map(([status, count]) => <div key={status}><span>{status}</span><b>{number.format(count)}</b><i style={{ width: `${(count / platform.rows) * 100}%` }} /></div>)}</div>
            <p className={styles.note}>product_id 중복률 <b>{platform.duplicateRate.toFixed(2)}%</b></p>
          </article>)}
        </div>
      </section>

      <section className={styles.dashboardControls} aria-label="상품 분류와 세부 검색">
        <div className={styles.controlHeading}><div><p className={styles.kicker}>EXPLORE DATA</p><h2>조건을 선택해 비교</h2></div><span>{number.format(selectedSampleCount)}건의 표본</span></div>
        <div className={styles.itemButtons}>{items.map((item, index) => <button type="button" className={selectedItem === item ? styles.itemButtonActive : styles.itemButton} key={item} onClick={() => { setSelectedItem(item); setSelectedProduct("전체"); }}><span>{String(index + 1).padStart(2, "0")}</span>{item}</button>)}</div>
        <div className={styles.detailFilters}>
          <label className={styles.search}><span>제품·모델 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="쿠쿠 CRP, 다이슨 V8..." /></label>
          <label className={styles.filterField}><span>소분류 모델</span><select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)}>{products.map((product, index) => <option value={product} key={product}>{index === 0 ? product : `${String(index).padStart(2, "0")} ${product}`}</option>)}</select></label>
          <label className={styles.filterField}><span>플랫폼</span><select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value)}>{platforms.map((platform) => <option value={platform} key={platform}>{platform === "전체" ? platform : platformName(platform)}</option>)}</select></label>
          <label className={styles.filterField}><span>분기</span><select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>{quarters.map((quarter) => <option value={quarter} key={quarter}>{quarter}</option>)}</select></label>
          <label className={styles.filterField}><span>정렬</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="price-desc">금액 큰 순</option><option value="product">제품 순</option><option value="quarter">분기 순</option></select></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><h2>가격 그래프</h2></div><span className={styles.sectionHint}>필터 결과 실시간 반영</span></div>
        <div className={styles.chartGrid}>
          <article className={styles.chartPanel}><div className={styles.chartTitle}><h3>모델 표본평균 TOP 10</h3><span>플랫폼별 n≥5 · {selectedItem}</span></div><div className={styles.barChart}>{rankedProducts.map((product, index) => <div className={styles.barRow} key={`${product.name}-${product.platform}`}><b>{String(index + 1).padStart(2, "0")}</b><span className={styles.barLabel}>{product.name} · {platformName(product.platform)}</span><i style={{ width: `${(product.mean / maxRankedMean) * 100}%` }} /><strong>{money(product.mean)} · n={product.count}</strong></div>)}</div>{rankedProducts.length === 0 && <p className={styles.emptyChart}>선택 조건에 맞는 5건 이상 가격 데이터가 없습니다.</p>}</article>
          <article className={styles.chartPanel}><div className={styles.chartTitle}><h3>분기별 평균가</h3><span>표본 가중 평균</span></div><div className={styles.quarterChart}>{quarterlyTotals.map((quarter) => <div className={styles.quarterBar} key={quarter.label}><strong>{money(quarter.mean)}</strong><i style={{ height: `${(quarter.mean / maxQuarterMean) * 100}%` }} /><span>{quarter.label}</span><small>{number.format(quarter.count)}건</small></div>)}</div>{quarterlyTotals.length === 0 && <p className={styles.emptyChart}>선택 조건에 맞는 분기 데이터가 없습니다.</p>}</article>
        </div>
      </section>

      <nav className={styles.dashboardTabs} aria-label="상세 분석 섹션">
        {([["decision", "등록가 가이드"], ["models", "모델 가격"], ["quarters", "분기 추이"], ["comparison", "플랫폼 차이"], ["method", "상관·방법론"]] as [DashboardView, string][]).map(([value, label]) => <button type="button" className={dashboardView === value ? styles.dashboardTabActive : styles.dashboardTab} key={value} onClick={() => setDashboardView(value)}>{label}</button>)}
      </nav>

      {dashboardView === "decision" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><h2>당근 등록가 벤치마크</h2></div><span className={styles.sectionHint}>{decisionRows.length}개 모델</span></div>
        <p className={styles.disclaimer}>양 플랫폼 중앙값의 단순 평균을 시장 기준선으로 두고, 빠른 판매는 90%, 균형 가격은 97% 수준으로 계산했습니다. 이는 전략 비교용 휴리스틱이며 당근의 실제 거래 성사를 보장하지 않습니다.</p>
        <div className={styles.decisionGrid}>{decisionRows.slice(0, 12).map((row) => <article className={styles.decisionCard} key={row.product.name}>
          <div className={styles.decisionCardTop}><div><span>{row.product.item}</span><h3>{row.product.model}</h3></div><b className={`${styles.confidence} ${styles[`confidence${row.confidence}`]}`}>{row.confidence} 신뢰</b></div>
          <div className={styles.decisionPrice}><div><small>빠른 판매 기준</small><strong>{money(row.quickPrice)}</strong></div><div><small>균형 가격 기준</small><strong>{money(row.balancedPrice)}</strong></div></div>
          <div className={styles.decisionSignals}><span>플랫폼 간극 <b>{row.spread === null ? "N/A" : `${row.spread.toFixed(1)}%`}</b></span><span>비교 표본 <b>{number.format(row.sampleCount)}건</b></span></div>
        </article>)}</div>
      </section>}

      {dashboardView === "models" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><h2>상품·모델별 가격 분포</h2></div><span className={styles.sectionHint}>{filteredProducts.length}개 모델</span></div>
        <p className={styles.resultCount}>{filteredProducts.length}개 모델 표시 중</p><div className={styles.tableWrap}><table><thead><tr><th>No.</th><th>대분류 제품</th><th>소분류 모델</th><th>플랫폼</th><th>표본</th><th>평균</th><th>중앙값</th><th>Q1 - Q3</th></tr></thead><tbody>{filteredProducts.flatMap((product) => ["elecmart", "joonggonara"].filter((platform) => selectedPlatform === "전체" || platform === selectedPlatform).map((platform) => ({ product, platform, stats: product[platform as "elecmart" | "joonggonara"] }))).map((row) => <tr key={`${row.product.name}-${row.platform}`}><td>{productNumbers.get(row.product.name)}</td><td>{row.product.item}</td><td>{row.product.model}</td><td>{platformName(row.platform)}</td><td>{number.format(row.stats.count)}</td><td>{money(row.stats.mean)}</td><td>{money(row.stats.median)}</td><td>{row.stats.q1 === null || row.stats.q3 === null ? "N/A" : `${won.format(row.stats.q1)} - ${won.format(row.stats.q3)}원`}</td></tr>)}</tbody></table></div>
      </section>}

      {dashboardView === "quarters" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><h2>분기별 지표</h2></div><span className={styles.sectionHint}>{filteredQuarters.length}개 행</span></div>
        <div className={styles.tableWrap}><table><thead><tr><th>No.</th><th>분기</th><th>대분류 제품</th><th>소분류 모델</th><th>플랫폼</th><th>표본</th><th>평균 가격</th><th>중앙값</th><th>판매중</th><th>예약중</th><th>판매완료</th></tr></thead><tbody>{filteredQuarters.map((quarter) => <tr key={`${quarter.label}-${quarter.platform}-${quarter.product}`}><td>{productNumbers.get(quarter.product)}</td><td>{quarter.label}</td><td>{quarter.item}</td><td>{quarter.model}</td><td>{platformName(quarter.platform)}</td><td>{number.format(quarter.count)}</td><td>{money(quarter.mean)}</td><td>{money(quarter.median)}</td><td>{number.format(quarter.selling)}</td><td>{number.format(quarter.reserved)}</td><td>{number.format(quarter.sold)}</td></tr>)}</tbody></table></div>
        <p className={styles.disclaimer}>분기는 상품의 `update_time` 또는 `registered_at` 날짜를 기준으로 계산했습니다. 표본이 1건인 분기도 그대로 표시하며, 별도 보정이나 추정은 하지 않았습니다.</p>
      </section>}

      {dashboardView === "method" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>METHOD & DATA HEALTH</p><h2>분석 신뢰도와 참여 지표</h2></div><span className={styles.sectionHint}>품질 가드레일</span></div>
        <div className={styles.qualityGrid}><Metric label="모델 식별률" value={`${identifiedModelRate.toFixed(1)}%`} detail={`모델 미상 ${number.format(unknownModelRows)}건`} /><Metric label="날짜 커버리지" value={`${data.coverage.datedRowRate.toFixed(1)}%`} detail={`${data.coverage.from}-${data.coverage.to}`} /><Metric label="전처리 제외율" value={`${exclusionRate.toFixed(1)}%`} detail={`${number.format(data.preprocessing.excludedRowCount)}건 제외`} /><Metric label="중복률 범위" value={`${Math.min(...data.platforms.map((platform) => platform.duplicateRate)).toFixed(1)}-${Math.max(...data.platforms.map((platform) => platform.duplicateRate)).toFixed(1)}%`} detail="플랫폼별 product_id" /></div>
        <div className={styles.correlationGrid}><Correlation label="가격 - 찜 수" value={data.correlations.favorites.rho} count={data.correlations.favorites.count} /><Correlation label="가격 - 댓글 수" value={data.correlations.comments.rho} count={data.correlations.comments.count} /></div>
        <p className={styles.disclaimer}>Spearman rho는 이 표본에서 두 변수의 순위가 함께 움직이는 정도를 나타내는 기술통계입니다. 참여 지표는 번개장터 원천에서만 수집되었고 댓글 수는 값이 모두 같아 상관계수를 계산할 수 없었습니다. 플랫폼 간 참여도 절대 비교에는 사용하지 않습니다.</p>
      </section>}

      {dashboardView === "comparison" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><h2>대분류 품목별 플랫폼 차이</h2></div><span className={styles.sectionHint}>{categoryComparisons.length}개 품목</span></div>
        <p className={styles.disclaimer}>대분류 품목 단위로 두 플랫폼의 관측 중앙값과 평균가격 차이를 비교합니다. 품목 안의 모델 구성 차이는 별도로 보정하지 않았습니다.</p>
        <div className={styles.categoryGrid}>
          {categoryComparisons.map((comparison, index) => (
            <article className={styles.categoryCard} key={comparison.item}>
              <div className={styles.categoryTop}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{comparison.item}</h3>
              </div>
              <div className={styles.categoryPrices}>
                <div>
                  <small>번개장터 (표본 {number.format(comparison.elecmartCount)}건)</small>
                  <strong>{money(comparison.elecmartMedian)} (중앙)</strong>
                  <small>평균 {money(comparison.elecmartMean)}</small>
                </div>
                <div>
                  <small>중고나라 (표본 {number.format(comparison.joonggonaraCount)}건)</small>
                  <strong>{money(comparison.joonggonaraMedian)} (중앙)</strong>
                  <small>평균 {money(comparison.joonggonaraMean)}</small>
                </div>
              </div>
              <div className={styles.categoryResult}>
                <div>
                  <span>평균 차이 </span>
                  <b>{money(comparison.meanDifference)}</b>
                </div>
                <div>
                  <span>중앙값 차이 </span>
                  <b>{money(comparison.medianDifference)}</b>
                  <small>({comparison.elecmartPremiumPct === null ? "N/A" : `${comparison.elecmartPremiumPct > 0 ? "+" : ""}${comparison.elecmartPremiumPct.toFixed(1)}%`})</small>
                </div>
              </div>
              <p className={styles.categoryMeta}>
                Welch 검정 p-value: <b>{comparison.pValue === null ? "N/A" : comparison.pValue.toFixed(4)}</b> ({significanceLabel(comparison.pValue)})
              </p>
            </article>
          ))}
        </div>
      </section>}

      {dashboardView === "comparison" && <section className={styles.section}>
        <div className={styles.sectionHeading}><h2>참고 적정가와 모델별 플랫폼 상세 비교</h2><span className={styles.sectionHint}>선택된 {filteredProducts.length}개 모델</span></div>
        <p className={styles.disclaimer}>참고 적정가는 각 모델의 양 플랫폼 관측 통합 중앙값입니다. 번개장터와 중고나라의 표본수, 평균, 중앙값을 대조하여 플랫폼 간 시세 격차를 확인할 수 있습니다.</p>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>대분류</th>
                <th>모델</th>
                <th>참고 적정가</th>
                <th>번개장터 (표본 / 평균 / 중앙값)</th>
                <th>중고나라 (표본 / 평균 / 중앙값)</th>
                <th>플랫폼 격차 (중앙값 기준)</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.filter((product) => product.referencePrice !== null).map((product, index) => (
                <tr key={`decision-${product.name}`}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td>{product.item}</td>
                  <td><strong>{product.model}</strong></td>
                  <td><strong>{money(product.referencePrice)}</strong></td>
                  <td>
                    <span>{money(product.elecmart.median)}</span>
                    <small>평균 {money(product.elecmart.mean)} · n={number.format(product.elecmart.count)}</small>
                  </td>
                  <td>
                    <span>{money(product.joonggonara.median)}</span>
                    <small>평균 {money(product.joonggonara.mean)} · n={number.format(product.joonggonara.count)}</small>
                  </td>
                  <td className={(product.elecmartVsJoonggonaraPct ?? 0) >= 0 ? styles.positive : styles.negative}>
                    {product.elecmartVsJoonggonaraPct === null ? "N/A" : `${product.elecmartVsJoonggonaraPct > 0 ? "+" : ""}${product.elecmartVsJoonggonaraPct.toFixed(1)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.sectionHeading} style={{ marginTop: "32px" }}><h2>품목별 통계적 가설검정 (Welch's t-test)</h2></div>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>품목</th>
                <th>번개장터 표본</th>
                <th>중고나라 표본</th>
                <th>평균 차이</th>
                <th>95% 신뢰구간</th>
                <th>효과크기 d</th>
                <th>p-value</th>
                <th>판정</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison.filter((item) => selectedItem === "전체" || item.item === selectedItem).map((item, index) => (
                <tr key={`test-${item.item}`}>
                  <td>{String(index + 1).padStart(2, "0")}</td>
                  <td><strong>{item.item}</strong></td>
                  <td>{number.format(item.elecmartCount)}</td>
                  <td>{number.format(item.joonggonaraCount)}</td>
                  <td className={(item.meanDifference ?? 0) >= 0 ? styles.positive : styles.negative}>{item.meanDifference === null ? "N/A" : money(item.meanDifference)}</td>
                  <td>{item.confidenceInterval95 === null ? "N/A" : `${money(item.confidenceInterval95[0])} ~ ${money(item.confidenceInterval95[1])}`}</td>
                  <td>{item.cohensD === null ? "N/A" : `${item.cohensD.toFixed(2)} (${effectLabel(item.cohensD)})`}</td>
                  <td>{item.pValue === null ? "N/A" : item.pValue.toFixed(4)}</td>
                  <td><span className={item.pValue !== null && item.pValue < 0.05 ? styles.significant : styles.uncertain}>{significanceLabel(item.pValue)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.disclaimer}>Welch t-검정은 품목별 두 플랫폼의 평균가격 차이를 검토합니다. p-value만으로 차이의 원인이나 미래 가격을 확정할 수 없고, 모든 결과는 현재 수집 표본에 한정됩니다.</p>
      </section>}

      <footer className={styles.footer}>관측기간 {data.coverage.from ?? "N/A"}-{data.coverage.to ?? "N/A"} · 날짜 확인 {data.coverage.datedRowRate.toFixed(1)}% · 전처리 제외 {number.format(data.preprocessing.excludedRowCount)}건 · 번개장터(elecmart 원천) 및 중고나라 수집 CSV · 당근 데이터 미포함 · 인과관계 해석 없음</footer>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Correlation({ label, value, count }: { label: string; value: number | null; count: number }) { return <article className={styles.correlation}><span>{label}</span><strong>{value === null ? "N/A" : value.toFixed(4)}</strong><small>유효 쌍 {number.format(count)}개</small></article>; }
