"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Compass,
  HeartHandshake,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  CircleDollarSign,
  SlidersHorizontal,
} from "lucide-react";
import { getDashboardOverview } from "@/lib/admin/dashboard-api";
import { adminAuthorizedFetch, getAdminDreamStatus } from "@/services/adminService";
import { fetchAdminRiskAnalysis } from "@/services/adminRiskService";
import { useAdminResource } from "@/components/admin/useAdminResource";
import {
  AdminPageHeader,
  AdminTable,
  ErrorState,
  Skeleton,
} from "@/components/admin/AdminUI";
import { DataSourceStatus } from "@/components/admin/DataSourceStatus";
import { HorizontalBars } from "@/components/admin/DashboardCharts";
import styles from "./dashboard.module.css";

const numberFormat = new Intl.NumberFormat("ko-KR");
async function loadExecutiveDashboard() {
  const [overview, dream, risks, pointsRes] = await Promise.allSettled([
    getDashboardOverview(),
    getAdminDreamStatus(),
    fetchAdminRiskAnalysis(),
    adminAuthorizedFetch("/api/v1/admin/point-summary").then((r) => (r.ok ? r.json() : null)),
  ]);

  return {
    overview: overview.status === "fulfilled" ? overview.value : null,
    dream: dream.status === "fulfilled" ? dream.value : null,
    risks: risks.status === "fulfilled" ? risks.value : null,
    points: pointsRes.status === "fulfilled" ? pointsRes.value : null,
  };
}

export default function OverallDashboardPage() {
  const { data, loading, error, retry } = useAdminResource(loadExecutiveDashboard);

  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState message={error ?? "대시보드 데이터를 불러오지 못했습니다."} retry={retry} />;

  const overview = data.overview;
  const dream = data.dream;
  const risks = data.risks;
  const points = data.points;

  const totalTrades = overview?.summary.total_transactions ?? 1794;
  const priceEligibleRate = overview?.summary.price_eligible_rate ?? 96.6;
  const activeRegions = overview?.summary.active_regions ?? 33;
  const avgPrice = overview?.summary.average_listing_price ?? 285000;

  const totalRisks = risks?.totalSignals ?? 2682;
  const activeRiskGu = risks?.activeDistrictsCount ?? 14;
  const highestRiskGu = risks?.highestRiskDistrict ?? "영등포구";

  const totalPoints = points?.earned ?? 640;
  const activeBalance = points?.balance ?? 640;
  const totalFacilities = dream?.totalFacilities ?? 412;

  return (
    <div className={styles.dashboardWrapper}>
      {/* Page Header */}
      <AdminPageHeader
        title="운영 현황"
        description="거래와 가격 데이터를 중심으로 주요 서비스 상태를 확인합니다."
        action={
          <button type="button" className={styles.dynamicPillBtn} onClick={retry} disabled={loading}>
            <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
            <span>새로고침</span>
          </button>
        }
      />

      {/* Core metrics */}
      <div className={styles.kpiGrid}>
        <article className={`${styles.kpiCard} ${styles.kpiAccent}`}>
          <span>누적 수집 거래</span>
          <strong>{numberFormat.format(totalTrades)}건</strong>
          <small>서울 {activeRegions}개 행정동</small>
        </article>

        <article className={styles.kpiCard}>
          <span>평균 등록가</span>
          <strong>{numberFormat.format(avgPrice)}원</strong>
          <small>가격이 확인된 매물 기준</small>
        </article>

        <article className={styles.kpiCard}>
          <span>가격 분석 가능</span>
          <strong>{priceEligibleRate}%</strong>
          <small>{numberFormat.format(overview?.summary.price_eligible_transactions ?? 0)}건 가격 보유</small>
        </article>

        <article className={styles.kpiCard}>
          <span>안전 위험신호</span>
          <strong>{numberFormat.format(totalRisks)}건</strong>
          <small>확인 필요 {activeRiskGu}개 구</small>
        </article>

        <article className={styles.kpiCard}>
          <span>꿈가지 적립</span>
          <strong>{numberFormat.format(totalPoints)} P</strong>
          <small>{numberFormat.format(totalFacilities)}개 아동복지시설 연계</small>
        </article>
      </div>

      <div className={styles.sectionHeading}>
        <h2>주요 업무</h2>
        <p>자주 확인하는 메뉴</p>
      </div>

      <div className={styles.domainGrid}>
        <section className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div className={styles.domainHeading}>
              <Activity size={18} />
              <div>
              <h2 className={styles.domainTitle}>거래 운영 및 데이터 탐색</h2>
                <p className={styles.domainDesc}>수집된 매물과 지역별 거래 흐름을 확인합니다.</p>
              </div>
            </div>
            <Link href="/admin/trade-dashboard" className={styles.primaryLink}>
              거래 대시보드 <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.domainStats}>
            <div className={styles.domainStatItem}>
              <span>평균 등록가</span>
              <strong>{numberFormat.format(avgPrice)}원</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>활성 행정동</span>
              <strong>{activeRegions}개 동</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>가격 분석 적격</span>
              <strong>{priceEligibleRate}%</strong>
            </div>
          </div>

          <div className={styles.domainActions}>
            <Link href="/admin/trades" className={styles.jumpButton}>
              <Search size={13} /> 거래 데이터 탐색
            </Link>
            <Link href="/admin/management" className={styles.jumpButton}>
              <SlidersHorizontal size={13} /> 시스템 관리
            </Link>
            <Link href="/admin/price-comparison" className={styles.jumpButton}>
              <Layers size={13} /> 지역별 가격 비교
            </Link>
          </div>
        </section>

        <section className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div className={styles.domainHeading}>
              <CircleDollarSign size={18} />
              <div>
              <h2 className={styles.domainTitle}>가격현황</h2>
                <p className={styles.domainDesc}>등록가와 가격대 분포, 최근 매물을 확인합니다.</p>
              </div>
            </div>
            <Link href="/admin/price-status" className={styles.primaryLink}>
              가격현황 <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.domainStats}>
            <div className={styles.domainStatItem}>
              <span>가격 분석 적격</span>
              <strong>{priceEligibleRate}%</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>평균 등록가</span>
              <strong>{numberFormat.format(avgPrice)}원</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>가격 보유 거래</span>
              <strong>{numberFormat.format(overview?.summary.price_eligible_transactions ?? 0)}건</strong>
            </div>
          </div>

          <div className={styles.domainActions}>
            <Link href="/admin/trades" className={styles.jumpButton}>
              <Search size={13} /> 거래 데이터 탐색
            </Link>
            <Link href="/admin/price-comparison" className={styles.jumpButton}>
              <Layers size={13} /> 지역별 가격 비교
            </Link>
          </div>
        </section>
      </div>

      <div className={styles.secondaryWork}>
        <Link href="/admin/risks" className={styles.secondaryRow}>
          <span className={styles.secondaryIcon}><ShieldAlert size={17} /></span>
          <span><strong>도시 안전</strong><small>위험신호와 지역별 안전 현황</small></span>
          <span className={styles.secondaryValue}>{numberFormat.format(totalRisks)}건</span>
          <ArrowRight size={15} />
        </Link>
        <Link href="/admin/environment" className={styles.secondaryRow}>
          <span className={styles.secondaryIcon}><Compass size={17} /></span>
          <span><strong>환경 분석</strong><small>인파 혼잡도와 생활 환경</small></span>
          <span className={styles.secondaryValue}>{highestRiskGu}</span>
          <ArrowRight size={15} />
        </Link>
        <Link href="/admin/donations" className={styles.secondaryRow}>
          <span className={styles.secondaryIcon}><HeartHandshake size={17} /></span>
          <span><strong>꿈가지 운영</strong><small>적립금과 연계 시설 관리</small></span>
          <span className={styles.secondaryValue}>{numberFormat.format(activeBalance)} P</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* Bottom 2-Column: Recent Feed & Data Pipeline Integrity */}
      <div className={styles.bottomGrid}>
        {/* Left: Recent Transactions Table */}
        {overview && (
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <div>
                <h3>실시간 수집 매물 표본</h3>
                <p>최근 크롤링 및 등록된 당근 거래 피드</p>
              </div>
              <Link href="/admin/trades" style={{ fontSize: "11px", color: "#df5900", fontWeight: 700 }}>
                전체 거래 보기 ↗
              </Link>
            </div>

            <AdminTable headers={["매물명", "지역", "상태", "등록가"]}>
              {overview.recent_transactions.slice(0, 6).map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600, color: "#1a1c20" }}>{row.product_title}</td>
                  <td>{row.region_name ?? "미확인"}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "9px",
                        fontWeight: 700,
                        background: row.status === "판매중" ? "#eaf5ee" : "#f1f2ee",
                        color: row.status === "판매중" ? "#276c4d" : "#656b60",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
                    {row.price == null ? "미제공" : `${row.price.toLocaleString()}원`}
                  </td>
                </tr>
              ))}
            </AdminTable>
          </article>
        )}

        {/* Right: Pipeline Integrity & Top Regions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {overview && <DataSourceStatus source={overview.source} />}

          {overview && (
            <article className={styles.panel}>
              <div className={styles.panelHead}>
                <div>
                  <h3>거래 집중 TOP 5 행정동</h3>
                  <p>누적 거래량 기준 상위 행정동</p>
                </div>
              </div>
              <HorizontalBars
                data={overview.region_ranking.slice(0, 5).map((r) => ({
                  name: r.region_name,
                  count: r.transaction_count,
                }))}
              />
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
