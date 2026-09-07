"use client";

import { useEffect, useState } from "react";
import styles from "./analysis.module.css";

type Platform = { name: string; rows: number; meanPrice: number; medianPrice: number; duplicateRate: number; statuses: Record<string, number> };
type ProductStats = { count: number; mean: number; median: number; q1: number; q3: number };
type AnalysisData = { rowCount: number; fileCount: number; platforms: Platform[]; products: { name: string; elecmart: ProductStats; joonggonara: ProductStats }[]; correlations: { favorites: { count: number; rho: number }; comments: { count: number; rho: number | null } } };

const won = new Intl.NumberFormat("ko-KR");
const number = new Intl.NumberFormat("ko-KR");

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/analysis-data.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("load"))))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error) return <main className={styles.state}>분석 데이터를 불러오지 못했습니다.</main>;
  if (!data) return <main className={styles.state}>분석 데이터를 불러오는 중입니다.</main>;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="/" className={styles.back}>가지를 아시나요</a>
        <p className={styles.kicker}>MARKET OBSERVATION / 2026</p>
        <h1 className={styles.title}>중고거래 데이터<br /><em>통계 분석</em></h1>
        <p className={styles.intro}>수집된 상품 목록에서 확인되는 가격과 거래 상태를 정리했습니다. 표본 밖 시장 전체를 추정하거나 인과관계를 주장하지 않습니다.</p>
      </header>

      <section className={styles.metrics} aria-label="분석 범위">
        <Metric label="관측 상품" value={`${number.format(data.rowCount)}건`} />
        <Metric label="원본 파일" value={`${data.fileCount}개`} />
        <Metric label="분석 플랫폼" value={`${data.platforms.length}곳`} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>01 / PLATFORM</p><h2>플랫폼별 요약</h2></div>
        <div className={styles.platformGrid}>
          {data.platforms.map((platform) => <article className={styles.platform} key={platform.name}>
            <div className={styles.platformTop}><h3>{platform.name}</h3><span>{number.format(platform.rows)}건</span></div>
            <div className={styles.pricePair}><div><small>평균</small><strong>{won.format(platform.meanPrice)}원</strong></div><div><small>중앙값</small><strong>{won.format(platform.medianPrice)}원</strong></div></div>
            <div className={styles.statuses}>{Object.entries(platform.statuses).map(([status, count]) => <div key={status}><span>{status}</span><b>{number.format(count)}</b><i style={{ width: `${(count / platform.rows) * 100}%` }} /></div>)}</div>
            <p className={styles.note}>product_id 중복률 <b>{platform.duplicateRate.toFixed(2)}%</b></p>
          </article>)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>02 / PRICE DISTRIBUTION</p><h2>검색어별 가격 분포</h2></div>
        <div className={styles.tableWrap}><table><thead><tr><th>상품</th><th>플랫폼</th><th>표본</th><th>평균</th><th>중앙값</th><th>Q1 - Q3</th></tr></thead><tbody>{data.products.flatMap((product) => ["elecmart", "joonggonara"].map((platform) => { const stats = product[platform as "elecmart" | "joonggonara"]; return <tr key={`${product.name}-${platform}`}><td>{product.name}</td><td>{platform}</td><td>{number.format(stats.count)}</td><td>{won.format(stats.mean)}원</td><td>{won.format(stats.median)}원</td><td>{won.format(stats.q1)} - {won.format(stats.q3)}원</td></tr>; }))}</tbody></table></div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}><p className={styles.kicker}>03 / RANK CORRELATION</p><h2>가격과 참여 지표</h2></div>
        <div className={styles.correlationGrid}><Correlation label="가격 - 찜 수" value={data.correlations.favorites.rho} count={data.correlations.favorites.count} /><Correlation label="가격 - 댓글 수" value={data.correlations.comments.rho} count={data.correlations.comments.count} /></div>
        <p className={styles.disclaimer}>Spearman rho는 이 표본에서 두 변수의 순위가 함께 움직이는 정도를 나타내는 기술통계입니다. 댓글 수는 값이 모두 같아 상관계수를 계산할 수 없었습니다.</p>
      </section>

      <footer className={styles.footer}>분석 기준: `yccraw/scratch` 내 elecmart 및 joonggonara CSV · 가격 유효값만 사용 · 인과관계 해석 없음</footer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function Correlation({ label, value, count }: { label: string; value: number | null; count: number }) { return <article className={styles.correlation}><span>{label}</span><strong>{value === null ? "N/A" : value.toFixed(4)}</strong><small>유효 쌍 {number.format(count)}개</small></article>; }
