"use client";
import { RefreshCw } from "lucide-react";
import { getDashboardOverview } from "@/lib/admin/dashboard-api";
import { useAdminResource } from "@/components/admin/useAdminResource";
import { AdminPageHeader, AdminTable, MetricCard, Skeleton, ErrorState } from "@/components/admin/AdminUI";
import { PriceDistributionChart, TradeStatusCard, HorizontalBars } from "@/components/admin/DashboardCharts";
import { DataSourceStatus } from "@/components/admin/DataSourceStatus";
import { PricePredictionSection } from "@/components/admin/PricePredictionSection";
import styles from "@/components/admin/portal.module.css";
export default function DashboardPage() {
 const { data, loading, error, retry } = useAdminResource(getDashboardOverview);
 return <><AdminPageHeader title="거래 대시보드" description="우리 동네 거래 현황을 한눈에 확인하세요." action={<button onClick={retry} disabled={loading}><RefreshCw size={15} />새로고침</button>} />
 {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : <>
 <div className={styles.metrics}>
 <MetricCard label="누적 수집 거래" value={`${data.summary.total_transactions.toLocaleString("ko-KR")}건`} detail="당근 수집 거래 전체" />
 <MetricCard label="가격 분석 가능 비율" value={`${data.summary.price_eligible_rate}%`} detail={`${data.summary.price_eligible_transactions.toLocaleString("ko-KR")}건 가격 보유`} />
 <MetricCard label="거래 발생 지역" value={`${data.summary.active_regions.toLocaleString("ko-KR")}개`} detail="거래가 연결된 행정동" />
 <MetricCard label="평균 등록가" value={data.summary.average_listing_price === null ? "—" : `${data.summary.average_listing_price.toLocaleString("ko-KR")}원`} detail="가격 보유 거래 기준 · 체결가 아님" />
 </div>
 <div className={styles.chartGrid}><article className={styles.card}><div className={styles.cardHead}><div><h2>최근 수집 데이터</h2><p>수집된 등록가 원본 · 최근 {data.recent_transactions.length}건</p></div></div><AdminTable headers={["매물", "지역", "상태", "등록가"]}>{data.recent_transactions.map(row => <tr key={row.id}><td>{row.product_title}</td><td>{row.region_name ?? "미확인"}</td><td>{row.status}</td><td>{row.price == null ? "미제공" : `${row.price.toLocaleString()}원`}</td></tr>)}</AdminTable></article><TradeStatusCard data={data.trade_status} dataByGu={data.trade_status_by_gu} /></div>
 <div className={styles.chartGrid}><PriceDistributionChart data={data.price_distribution} /><article className={styles.card}><div className={styles.cardHead}><div><h2>지역별 거래 TOP 5</h2><p>누적 거래 수 기준 · 지역 미확인 제외</p></div></div><HorizontalBars data={data.region_ranking.map(row => ({ name: row.region_name, count: row.transaction_count }))} /></article></div>
 <div className={styles.chartGrid}><DataSourceStatus source={data.source} /></div>
 <PricePredictionSection />
 </>}
 </>;
}
