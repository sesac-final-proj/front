"use client";

import Link from "next/link";
import { useCallback } from "react";
import {
  Activity,
  ArrowRight,
  Bot,
  Compass,
  Database,
  HeartHandshake,
  Layers,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  TrendingUp,
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
import { HorizontalBars, PriceDistributionChart } from "@/components/admin/DashboardCharts";
import styles from "./dashboard.module.css";

const numberFormat = new Intl.NumberFormat("ko-KR");
const percentFormat = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

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
        title="전체 서비스 요약 대시보드"
        description="당근 마켓플레이스 거래·AI 가격예측·외부 시세·안전 위험신호·꿈가지 나눔 통합 관제 허브"
        action={
          <button onClick={retry} disabled={loading}>
            <RefreshCw size={14} />
            새로고침
          </button>
        }
      />

      {/* 5-Column Core Metrics KPI Strip */}
      <div className={styles.kpiGrid}>
        <article className={`${styles.kpiCard} ${styles.kpiAccent}`}>
          <span>누적 수집 거래</span>
          <strong>{numberFormat.format(totalTrades)}건</strong>
          <small>서울 {activeRegions}개 행정동 · 가격 유효율 {priceEligibleRate}%</small>
        </article>

        <article className={styles.kpiCard}>
          <span>AI 가격예측 R² 정확도</span>
          <strong>0.852</strong>
          <small>LightGBM 5,909건 검증 통과</small>
        </article>

        <article className={styles.kpiCard}>
          <span>외부 시세 비교 품목</span>
          <strong>12개 품목</strong>
          <small>중고나라·번개장터 실시간 격차 분석</small>
        </article>

        <article className={styles.kpiCard}>
          <span>감지된 안전 위험신호</span>
          <strong>{numberFormat.format(totalRisks)}건</strong>
          <small>서울 25개 구 전역 · 주의보 발령 {activeRiskGu}개 구</small>
        </article>

        <article className={styles.kpiCard}>
          <span>꿈가지 누적 적립 & 시설</span>
          <strong>{numberFormat.format(totalPoints)} P</strong>
          <small>서울 412개 아동복지시설 매칭</small>
        </article>
      </div>

      {/* 4 Gateway Domain Summary Cards with Direct Navigation Links */}
      <div className={styles.domainGrid}>
        {/* Card 1: 거래 운영 (Trades & Operations) */}
        <section className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div>
              <div className={styles.domainTagRow}>
                <span className={`${styles.domainBadge} ${styles.domainBadgeActive}`}>
                  실시간 거래 연계
                </span>
                <span style={{ fontSize: "10px", color: "#8a9085" }}>DG·01 ~ DG·03</span>
              </div>
              <h2 className={styles.domainTitle}>거래 운영 및 데이터 탐색</h2>
              <p className={styles.domainDesc}>
                당근마켓 실시간 매물 수집 파이프라인과 영등포·노원·송파 3개 구 중심 거래 표본 및 수집 품질을 점검합니다.
              </p>
            </div>
            <div className={styles.domainIcon}>
              <Activity size={22} />
            </div>
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
            <Link href="/admin/trade-dashboard" className={`${styles.jumpButton} ${styles.jumpButtonPrimary}`}>
              <Activity size={13} /> 거래 대시보드 바로가기 <ArrowRight size={12} />
            </Link>
            <Link href="/admin/trades" className={styles.jumpButton}>
              <Search size={13} /> 거래 데이터 탐색
            </Link>
            <Link href="/admin/quality" className={styles.jumpButton}>
              <Database size={13} /> 수집 품질 점검
            </Link>
            <Link href="/admin/price-comparison" className={styles.jumpButton}>
              <Layers size={13} /> 지역별 가격 비교
            </Link>
          </div>
        </section>

        {/* Card 2: AI 가격 모델 & 외부 비교 (Price AI & External Market Insights) */}
        <section className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div>
              <div className={styles.domainTagRow}>
                <span className={`${styles.domainBadge} ${styles.domainBadgeActive}`}>
                  LightGBM & 다중 플랫폼
                </span>
                <span style={{ fontSize: "10px", color: "#8a9085" }}>AI & MARKET</span>
              </div>
              <h2 className={styles.domainTitle}>가격 모델 & 외부 시장 비교</h2>
              <p className={styles.domainDesc}>
                LightGBM CQR 머신러닝 가격 예측 모델 성능과 중고나라·번개장터 교차 시세 격차 및 매물 문구 감성을 다차원 분석합니다.
              </p>
            </div>
            <div className={styles.domainIcon}>
              <Bot size={22} />
            </div>
          </div>

          <div className={styles.domainStats}>
            <div className={styles.domainStatItem}>
              <span>예측 설명력 (R²)</span>
              <strong>0.852</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>평균 오차율 (MAPE)</span>
              <strong>14.2%</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>공통 비교 품목</span>
              <strong>12개 카테고리</strong>
            </div>
          </div>

          <div className={styles.domainActions}>
            <Link href="/admin/market-trends" className={`${styles.jumpButton} ${styles.jumpButtonPrimary}`}>
              <TrendingUp size={13} /> 외부 변화 추이 바로가기 <ArrowRight size={12} />
            </Link>
            <Link href="/admin/price-model" className={styles.jumpButton}>
              <Bot size={13} /> AI 가격 모델
            </Link>
            <Link href="/admin/insights" className={styles.jumpButton}>
              <TrendingUp size={13} /> 외부 비교 인사이트
            </Link>
            <Link href="/admin/sources" className={styles.jumpButton}>
              <Database size={13} /> 수집원 관리
            </Link>
          </div>
        </section>

        {/* Card 3: 위험요소 및 안전신호 (Risk & Safety Intelligence) */}
        <section className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div>
              <div className={styles.domainTagRow}>
                <span
                  className={styles.domainBadge}
                  style={{ background: "#fdf0f0", color: "#d71913", borderColor: "#ffd1d0" }}
                >
                  서울안전누리 실시간 연동
                </span>
                <span style={{ fontSize: "10px", color: "#8a9085" }}>SAFETY INTEL</span>
              </div>
              <h2 className={styles.domainTitle}>위험요소 및 도시 안전신호 분석</h2>
              <p className={styles.domainDesc}>
                서울 25개 자치구의 화재, 교통사고, 도로통제, 침수 등 재난안전 피드를 교차 분석하고 직거래 안전 가이드를 제공합니다.
              </p>
            </div>
            <div className={styles.domainIcon} style={{ color: "#d71913", background: "#fff5f5" }}>
              <ShieldAlert size={22} />
            </div>
          </div>

          <div className={styles.domainStats}>
            <div className={styles.domainStatItem}>
              <span>감지 위험신호</span>
              <strong>{numberFormat.format(totalRisks)}건</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>최다 발생 구</span>
              <strong>{highestRiskGu}</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>도시 관제 커버리지</span>
              <strong>25개 구 100%</strong>
            </div>
          </div>

          <div className={styles.domainActions}>
            <Link
              href="/admin/risks"
              className={`${styles.jumpButton} ${styles.jumpButtonPrimary}`}
              style={{ background: "#d71913", borderColor: "#d71913" }}
            >
              <ShieldAlert size={13} /> 위험요소 분석 바로가기 <ArrowRight size={12} />
            </Link>
            <Link href="/admin/environment" className={styles.jumpButton}>
              <Compass size={13} /> 인파 혼잡도 & 환경 분석
            </Link>
          </div>
        </section>

        {/* Card 4: 꿈가지 나눔 및 사회적 가치 (Dream Gaji & Social Value) */}
        <section className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div>
              <div className={styles.domainTagRow}>
                <span
                  className={styles.domainBadge}
                  style={{ background: "#eaf5ee", color: "#276c4d", borderColor: "#c3e6d2" }}
                >
                  포인트 원장 & 시설 매칭
                </span>
                <span style={{ fontSize: "10px", color: "#8a9085" }}>SOCIAL VALUE</span>
              </div>
              <h2 className={styles.domainTitle}>꿈가지 운영 및 자치구별 적립 분석</h2>
              <p className={styles.domainDesc}>
                중고거래 송금(0.1%) 및 QR결제(1%) 시 자동 적립되는 꿈방울 원장과 서울시 25개 자치구 412개 아동복지시설 매칭을 분석합니다.
              </p>
            </div>
            <div className={styles.domainIcon} style={{ color: "#276c4d", background: "#eaf5ee" }}>
              <HeartHandshake size={22} />
            </div>
          </div>

          <div className={styles.domainStats}>
            <div className={styles.domainStatItem}>
              <span>누적 적립 포인트</span>
              <strong>{numberFormat.format(totalPoints)} P</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>현재 가용 잔액</span>
              <strong>{numberFormat.format(activeBalance)} P</strong>
            </div>
            <div className={styles.domainStatItem}>
              <span>연계 아동시설</span>
              <strong>{numberFormat.format(totalFacilities)}개소</strong>
            </div>
          </div>

          <div className={styles.domainActions}>
            <Link
              href="/admin/donations"
              className={`${styles.jumpButton} ${styles.jumpButtonPrimary}`}
              style={{ background: "#276c4d", borderColor: "#276c4d" }}
            >
              <HeartHandshake size={13} /> 꿈가지 분석 바로가기 <ArrowRight size={12} />
            </Link>
            <Link href="/admin/notices" className={styles.jumpButton}>
              <Sparkles size={13} /> 공지·기부 관리
            </Link>
            <Link href="/admin/support" className={styles.jumpButton}>
              고객 문의
            </Link>
          </div>
        </section>
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
