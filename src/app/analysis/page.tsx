"use client";

import { useEffect, useState } from "react";
import styles from "./analysis.module.css";

type Platform = { name: string; rows: number; meanPrice: number; medianPrice: number; duplicateRate: number; statuses: Record<string, number> };
type ProductStats = { count: number; mean: number | null; median: number | null; q1: number | null; q3: number | null };
type Quarter = { label: string; platform: string; product: string; item: string; model: string; count: number; mean: number | null; median: number | null; selling: number; reserved: number; sold: number };
type Product = { name: string; item: string; model: string; referencePrice: number | null; elecmartVsJoonggonaraPct: number | null; elecmart: ProductStats; joonggonara: ProductStats };
type Comparison = { item: string; elecmartCount: number; joonggonaraCount: number; elecmartMedian: number | null; joonggonaraMedian: number | null; medianDifference: number | null; elecmartPremiumPct: number | null; meanDifference: number | null; confidenceInterval95: [number, number] | null; tStatistic: number | null; pValue: number | null; cohensD: number | null };
type AnalysisData = { rowCount: number; fileCount: number; platforms: Platform[]; products: Product[]; quarters: Quarter[]; comparison: Comparison[]; expensive: { product: string | null; platform: string | null; mean: number | null }; preprocessing: { rawRowCount: number; excludedRowCount: number; excludedByReason: Record<string, number> }; correlations: { favorites: { count: number; rho: number }; comments: { count: number; rho: number | null } } };
type DashboardView = "decision" | "models" | "quarters" | "comparison" | "method";

const won = new Intl.NumberFormat("ko-KR");
const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => value === null ? "N/A" : `${won.format(Math.round(value))}원`;

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState(false);
  const [selectedItem, setSelectedItem] = useState("전체");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("전체");
  const [selectedPlatform, setSelectedPlatform] = useState("전체");
  const [selectedQuarter, setSelectedQuarter] = useState("전체");
  const [sortBy, setSortBy] = useState("price-desc");
  const [dashboardView, setDashboardView] = useState<DashboardView>("models");

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
    .flatMap((product) => ["elecmart", "joonggonara"].map((platform) => ({ name: product.name, platform, mean: product[platform as "elecmart" | "joonggonara"].mean })))
    .filter((product): product is { name: string; platform: string; mean: number } => product.mean !== null)
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
  const averageGap = categoryComparisons.filter((item) => item.meanDifference !== null).reduce((sum, item) => sum + (item.meanDifference ?? 0), 0) / Math.max(categoryComparisons.filter((item) => item.meanDifference !== null).length, 1);
  const decisionRows = filteredProducts.map((product) => {
    const medians = [product.elecmart.median, product.joonggonara.median].filter((value): value is number => value !== null);
    const marketMedian = medians.length ? medians.reduce((sum, value) => sum + value, 0) / medians.length : null;
    const observedQuarters = data.quarters.filter((quarter) => quarter.product === product.name);
    const observedCount = observedQuarters.reduce((sum, quarter) => sum + quarter.count, 0);
    const soldCount = observedQuarters.reduce((sum, quarter) => sum + quarter.sold, 0);
    const spread = product.elecmart.median !== null && product.joonggonara.median !== null && marketMedian
      ? Math.abs(product.elecmart.median - product.joonggonara.median) / marketMedian * 100
      : null;
    const confidence = (product.elecmart.count + product.joonggonara.count) >= 20 ? "높음" : (product.elecmart.count + product.joonggonara.count) >= 5 ? "보통" : "낮음";
    return { product, marketMedian, listingGuide: marketMedian ? marketMedian * 0.95 : null, sellThrough: observedCount ? soldCount / observedCount * 100 : null, spread, confidence, observedCount };
  }).filter((row) => row.marketMedian !== null).sort((left, right) => (right.marketMedian ?? 0) - (left.marketMedian ?? 0));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.topbar}><a href="/" className={styles.back}>가지를 아시나요</a><span className={styles.status}><i /> LIVE DATASET · 2026</span></div>
        <div className={styles.headerCopy}><div><p className={styles.kicker}>MARKET INTELLIGENCE</p><h1 className={styles.title}>중고거래<br /><em>분석 대시보드</em></h1></div><p className={styles.intro}>가격, 플랫폼 차이, 거래 상태를 한 화면에서 비교하세요. 현재 수집 표본에 한정된 기술통계입니다.</p></div>
      </header>

      <section className={styles.metrics} aria-label="분석 범위">
        <Metric label="전체 관측" value={`${number.format(data.rowCount)}건`} detail={`원본 ${data.fileCount}개`} />
        <Metric label="선택 모델" value={`${number.format(selectedProductCount)}개`} detail={`표본 ${number.format(selectedSampleCount)}건`} />
        <Metric label="최고 평균가" value={money(data.expensive.mean)} detail={data.expensive.product ?? "모델 없음"} />
        <Metric label="플랫폼 평균 차이" value={money(averageGap || null)} detail="품목별 평균 기준" />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>PLATFORM SNAPSHOT</p><h2>플랫폼별 요약</h2></div><span className={styles.sectionHint}>수집 표본의 가격 분포와 상태</span></div>
        <div className={styles.platformGrid}>
          {data.platforms.map((platform) => <article className={styles.platform} key={platform.name}>
            <div className={styles.platformTop}><h3>{platform.name}</h3><span>{number.format(platform.rows)}건</span></div>
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
          <label className={styles.filterField}><span>플랫폼</span><select value={selectedPlatform} onChange={(event) => setSelectedPlatform(event.target.value)}>{platforms.map((platform) => <option value={platform} key={platform}>{platform}</option>)}</select></label>
          <label className={styles.filterField}><span>분기</span><select value={selectedQuarter} onChange={(event) => setSelectedQuarter(event.target.value)}>{quarters.map((quarter) => <option value={quarter} key={quarter}>{quarter}</option>)}</select></label>
          <label className={styles.filterField}><span>정렬</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="price-desc">금액 큰 순</option><option value="product">제품 순</option><option value="quarter">분기 순</option></select></label>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>VISUAL READOUT</p><h2>가격 그래프</h2></div><span className={styles.sectionHint}>필터 결과 실시간 반영</span></div>
        <div className={styles.chartGrid}>
          <article className={styles.chartPanel}><div className={styles.chartTitle}><h3>모델 평균가 TOP 10</h3><span>{selectedItem}</span></div><div className={styles.barChart}>{rankedProducts.map((product, index) => <div className={styles.barRow} key={`${product.name}-${product.platform}`}><b>{String(index + 1).padStart(2, "0")}</b><span className={styles.barLabel}>{product.name} · {product.platform}</span><i style={{ width: `${(product.mean / maxRankedMean) * 100}%` }} /><strong>{money(product.mean)}</strong></div>)}</div>{rankedProducts.length === 0 && <p className={styles.emptyChart}>선택 조건에 맞는 가격 데이터가 없습니다.</p>}</article>
          <article className={styles.chartPanel}><div className={styles.chartTitle}><h3>분기별 평균가</h3><span>표본 가중 평균</span></div><div className={styles.quarterChart}>{quarterlyTotals.map((quarter) => <div className={styles.quarterBar} key={quarter.label}><strong>{money(quarter.mean)}</strong><i style={{ height: `${(quarter.mean / maxQuarterMean) * 100}%` }} /><span>{quarter.label}</span><small>{number.format(quarter.count)}건</small></div>)}</div>{quarterlyTotals.length === 0 && <p className={styles.emptyChart}>선택 조건에 맞는 분기 데이터가 없습니다.</p>}</article>
        </div>
      </section>

      <nav className={styles.dashboardTabs} aria-label="상세 분석 섹션">
        {([["decision", "등록가 가이드"], ["models", "모델 가격"], ["quarters", "분기 추이"], ["comparison", "플랫폼 차이"], ["method", "상관·방법론"]] as [DashboardView, string][]).map(([value, label]) => <button type="button" className={dashboardView === value ? styles.dashboardTabActive : styles.dashboardTab} key={value} onClick={() => setDashboardView(value)}>{label}</button>)}
      </nav>

      {dashboardView === "decision" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>LISTING DECISION</p><h2>당근 등록가 가이드</h2></div><span className={styles.sectionHint}>{decisionRows.length}개 모델</span></div>
        <p className={styles.disclaimer}>현재 수집된 두 플랫폼의 중앙값을 기준으로 계산한 참고선입니다. 당근의 실제 노출·거래 속도는 별도 데이터가 없어 예측하지 않습니다.</p>
        <div className={styles.decisionGrid}>{decisionRows.slice(0, 12).map((row) => <article className={styles.decisionCard} key={row.product.name}>
          <div className={styles.decisionCardTop}><div><span>{row.product.item}</span><h3>{row.product.model}</h3></div><b className={`${styles.confidence} ${styles[`confidence${row.confidence}`]}`}>{row.confidence} 신뢰</b></div>
          <div className={styles.decisionPrice}><div><small>시장 중앙값</small><strong>{money(row.marketMedian)}</strong></div><div><small>보수적 등록가</small><strong>{money(row.listingGuide)}</strong></div></div>
          <div className={styles.decisionSignals}><span>플랫폼 차이 <b>{row.spread === null ? "N/A" : `${row.spread.toFixed(1)}%`}</b></span><span>판매완료 비중 <b>{row.sellThrough === null ? "N/A" : `${row.sellThrough.toFixed(1)}%`}</b></span></div>
        </article>)}</div>
      </section>}

      {dashboardView === "models" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>MODEL DISTRIBUTION</p><h2>상품·모델별 가격 분포</h2></div><span className={styles.sectionHint}>{filteredProducts.length}개 모델</span></div>
        <p className={styles.resultCount}>{filteredProducts.length}개 모델 표시 중</p><div className={styles.tableWrap}><table><thead><tr><th>No.</th><th>대분류 제품</th><th>소분류 모델</th><th>플랫폼</th><th>표본</th><th>평균</th><th>중앙값</th><th>Q1 - Q3</th></tr></thead><tbody>{filteredProducts.flatMap((product) => ["elecmart", "joonggonara"].filter((platform) => selectedPlatform === "전체" || platform === selectedPlatform).map((platform) => ({ product, platform, stats: product[platform as "elecmart" | "joonggonara"] }))).map((row) => <tr key={`${row.product.name}-${row.platform}`}><td>{productNumbers.get(row.product.name)}</td><td>{row.product.item}</td><td>{row.product.model}</td><td>{row.platform}</td><td>{number.format(row.stats.count)}</td><td>{money(row.stats.mean)}</td><td>{money(row.stats.median)}</td><td>{row.stats.q1 === null || row.stats.q3 === null ? "N/A" : `${won.format(row.stats.q1)} - ${won.format(row.stats.q3)}원`}</td></tr>)}</tbody></table></div>
      </section>}

      {dashboardView === "quarters" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>QUARTERLY SIGNALS</p><h2>분기별 지표</h2></div><span className={styles.sectionHint}>{filteredQuarters.length}개 행</span></div>
        <div className={styles.tableWrap}><table><thead><tr><th>No.</th><th>분기</th><th>대분류 제품</th><th>소분류 모델</th><th>플랫폼</th><th>표본</th><th>평균 가격</th><th>중앙값</th><th>판매중</th><th>예약중</th><th>판매완료</th></tr></thead><tbody>{filteredQuarters.map((quarter) => <tr key={`${quarter.label}-${quarter.platform}-${quarter.product}`}><td>{productNumbers.get(quarter.product)}</td><td>{quarter.label}</td><td>{quarter.item}</td><td>{quarter.model}</td><td>{quarter.platform}</td><td>{number.format(quarter.count)}</td><td>{money(quarter.mean)}</td><td>{money(quarter.median)}</td><td>{number.format(quarter.selling)}</td><td>{number.format(quarter.reserved)}</td><td>{number.format(quarter.sold)}</td></tr>)}</tbody></table></div>
        <p className={styles.disclaimer}>분기는 상품의 `update_time` 또는 `registered_at` 날짜를 기준으로 계산했습니다. 표본이 1건인 분기도 그대로 표시하며, 별도 보정이나 추정은 하지 않았습니다.</p>
      </section>}

      {dashboardView === "method" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>RANK CORRELATION</p><h2>가격과 참여 지표</h2></div><span className={styles.sectionHint}>Spearman rho</span></div>
        <div className={styles.correlationGrid}><Correlation label="가격 - 찜 수" value={data.correlations.favorites.rho} count={data.correlations.favorites.count} /><Correlation label="가격 - 댓글 수" value={data.correlations.comments.rho} count={data.correlations.comments.count} /></div>
        <p className={styles.disclaimer}>Spearman rho는 이 표본에서 두 변수의 순위가 함께 움직이는 정도를 나타내는 기술통계입니다. 댓글 수는 값이 모두 같아 상관계수를 계산할 수 없었습니다.</p>
      </section>}

      {dashboardView === "comparison" && <section className={styles.section}>
        <div className={styles.sectionHeading}><div><p className={styles.kicker}>CATEGORY GAP</p><h2>대분류 품목별 플랫폼 차이</h2></div><span className={styles.sectionHint}>{categoryComparisons.length}개 품목</span></div>
        <p className={styles.disclaimer}>대분류 품목 단위로 두 플랫폼의 관측 중앙값과 평균가격 차이를 비교합니다. 품목 안의 모델 구성 차이는 별도로 보정하지 않았습니다.</p>
        <div className={styles.categoryGrid}>{categoryComparisons.map((comparison, index) => <article className={styles.categoryCard} key={comparison.item}><div className={styles.categoryTop}><span>{String(index + 1).padStart(2, "0")}</span><h3>{comparison.item}</h3></div><div className={styles.categoryPrices}><div><small>일렉트로마트 중앙값</small><strong>{money(comparison.elecmartMedian)}</strong></div><div><small>중고나라 중앙값</small><strong>{money(comparison.joonggonaraMedian)}</strong></div></div><div className={styles.categoryResult}><span>일렉트로마트 평균 차이</span><b>{money(comparison.meanDifference)}</b><em>{comparison.elecmartPremiumPct === null ? "N/A" : `${comparison.elecmartPremiumPct.toFixed(2)}%`}</em></div><p className={styles.categoryMeta}>표본 {number.format(comparison.elecmartCount)}건 / {number.format(comparison.joonggonaraCount)}건 · p-value {comparison.pValue === null ? "N/A" : comparison.pValue.toFixed(4)}</p></article>)}</div>
      </section>}

      {dashboardView === "comparison" && <section className={styles.section}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>08 / PRICE DECISION</p><h2>참고 적정가와 모델별 차이</h2></div>
        <p className={styles.disclaimer}>참고 적정가는 모델의 양 플랫폼 관측 중앙값입니다. 미래 가격을 예측하거나 공식 적정가를 정한 값이 아닙니다. 최고 평균가는 플랫폼별 표본 10건 이상 모델만 비교했습니다.</p>
        <div className={styles.tableWrap}><table><thead><tr><th>No.</th><th>대분류</th><th>모델</th><th>참고 적정가</th><th>일렉트로마트 중앙값</th><th>중고나라 중앙값</th><th>일렉트로마트 차이</th></tr></thead><tbody>{filteredProducts.filter((product) => product.referencePrice !== null).slice(0, 20).map((product, index) => <tr key={`decision-${product.name}`}><td>{String(index + 1).padStart(2, "0")}</td><td>{product.item}</td><td>{product.model}</td><td>{money(product.referencePrice)}</td><td>{money(product.elecmart.median)}</td><td>{money(product.joonggonara.median)}</td><td>{product.elecmartVsJoonggonaraPct === null ? "N/A" : `${product.elecmartVsJoonggonaraPct.toFixed(2)}%`}</td></tr>)}</tbody></table></div>
        <div className={styles.tableWrap}><table><thead><tr><th>No.</th><th>품목</th><th>일렉트로마트 표본</th><th>중고나라 표본</th><th>평균 차이</th><th>95% 신뢰구간</th><th>효과크기 d</th><th>p-value</th></tr></thead><tbody>{data.comparison.filter((item) => selectedItem === "전체" || item.item === selectedItem).map((item, index) => <tr key={`test-${item.item}`}><td>{String(index + 1).padStart(2, "0")}</td><td>{item.item}</td><td>{number.format(item.elecmartCount)}</td><td>{number.format(item.joonggonaraCount)}</td><td>{item.meanDifference === null ? "N/A" : money(item.meanDifference)}</td><td>{item.confidenceInterval95 === null ? "N/A" : `${money(item.confidenceInterval95[0])} ~ ${money(item.confidenceInterval95[1])}`}</td><td>{item.cohensD === null ? "N/A" : item.cohensD.toFixed(2)}</td><td>{item.pValue === null ? "N/A" : item.pValue.toFixed(4)}</td></tr>)}</tbody></table></div>
        <p className={styles.disclaimer}>Welch t-검정은 품목별 두 플랫폼의 평균가격 차이를 검토합니다. p-value만으로 차이의 원인이나 미래 가격을 확정할 수 없고, 모든 결과는 현재 수집 표본에 한정됩니다.</p>
      </section>}

      <footer className={styles.footer}>분석 기준: `yccraw/scratch` 내 elecmart 및 joonggonara CSV · 가격 유효값만 사용 · 인과관계 해석 없음</footer>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Correlation({ label, value, count }: { label: string; value: number | null; count: number }) { return <article className={styles.correlation}><span>{label}</span><strong>{value === null ? "N/A" : value.toFixed(4)}</strong><small>유효 쌍 {number.format(count)}개</small></article>; }
