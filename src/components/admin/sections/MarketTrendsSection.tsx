"use client";

import dynamic from "next/dynamic";
import { TrendingUp, BarChart3, LineChart, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  adminAuthorizedFetch,
  getPriceComparisonOverview,
  type PriceComparisonOverview,
  type PricePlatformComparisonItem,
} from "@/services/adminService";
import { useAdminResource } from "../useAdminResource";
import { AdminTable, ErrorState, Skeleton } from "../AdminUI";
import { ComparisonCharts } from "../ComparisonCharts";
import { comparisonDecisions, PLATFORMS } from "../comparison-data";
import styles from "../portal.module.css";
import adminStyles from "@/app/admin/admin.module.css";

const ComparisonSpace = dynamic(() => import("../ComparisonSpace"), { ssr: false });

interface ComparisonData {
  items: PricePlatformComparisonItem[];
  source: string;
  period: string;
  caveat: string;
  regional: PriceComparisonOverview;
}

async function loadMarketTrends(): Promise<ComparisonData> {
  const [response, regional] = await Promise.all([
    adminAuthorizedFetch("/api/v1/admin/external-comparison"),
    getPriceComparisonOverview(),
  ]);
  if (!response.ok) throw new Error("외부 시장 비교 데이터를 불러오지 못했습니다.");
  return { ...(await response.json()), regional };
}

const numberFormat = new Intl.NumberFormat("ko-KR");

export default function MarketTrendsSection() {
  const { data, loading, error, retry } = useAdminResource(loadMarketTrends);

  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState message={error} retry={retry} />;

  const analysis = comparisonDecisions(data.items);
  const highestGap = [...analysis.decisions].sort((a, b) => Math.abs(b.gapPercent) - Math.abs(a.gapPercent))[0];
  const avgGap = analysis.decisions.length
    ? analysis.decisions.reduce((sum, d) => sum + Math.abs(d.gapPercent), 0) / analysis.decisions.length
    : 0;

  return (
    <section className={styles.comparisonWorkspace}>
      {/* Header Metric Strip */}
      <div className={styles.comparisonMetrics} aria-label="외부시장 변화 추이 핵심 지표">
        <article>
          <Layers size={18} />
          <span>공통 비교 품목</span>
          <strong>{analysis.comparable.length}개 품목</strong>
          <small>당근·중고나라·번개장터 교차</small>
        </article>
        <article>
          <TrendingUp size={18} />
          <span>평균 시장 가격 편차</span>
          <strong>±{avgGap.toFixed(1)}%</strong>
          <small>당근 중앙값 대비 외부 격차</small>
        </article>
        <article>
          <LineChart size={18} />
          <span>최대 격차 품목</span>
          <strong>{highestGap?.category ?? "대기"}</strong>
          <small>
            {highestGap
              ? `당근 대비 ${highestGap.gapPercent >= 0 ? "+" : ""}${highestGap.gapPercent.toFixed(1)}%`
              : "표본 수집 중"}
          </small>
        </article>
        <article className={styles.comparisonAccent}>
          <BarChart3 size={18} />
          <span>분석 유효 표본</span>
          <strong>{numberFormat.format(analysis.totalSamples)}건</strong>
          <small>{data.source} · {data.period}</small>
        </article>
      </div>

      {/* Brief Overview Card */}
      <article className={styles.comparisonBrief}>
        <div>
          <h2>외부 시장 변화 추이 분석 브리핑</h2>
          <p>{data.source} · {data.period}</p>
        </div>
        <p>
          당근마켓과 외부 주요 2개 중고거래 플랫폼(중고나라·번개장터) 간 실시간 시세 격차와 품목별 사분위수(Q1, 중앙값, Q3) 가격 분포 및 변화 양상을 정밀 분석합니다.
        </p>
        {!!analysis.excluded && (
          <p role="status">
            검증 제외 {analysis.excluded}행 · 중복 그룹 또는 유효하지 않은 표본
          </p>
        )}
      </article>

      {/* Main Charts: 품목별 거래 비교 & 외부시장 변화 */}
      {analysis.rows.length ? (
        <>
          <article className={styles.comparisonPanel}>
            <ComparisonCharts
              rows={analysis.rows}
              regions={data.regional.regions}
              detailTypes={data.regional.detail_types}
            />
          </article>

          {/* 3D Visual Distribution Space */}
          <article className={styles.comparisonPanel}>
            <ComparisonSpace rows={analysis.rows} />
          </article>

          {/* Detailed Changes Table */}
          <article className={styles.comparisonPanel}>
            <header>
              <div>
                <h2>품목별 외부 시장 변화 상세 원본</h2>
                <p>
                  {PLATFORMS.map(
                    (platform) =>
                      `${platform} ${analysis.rows.filter((row) => row.platform === platform).length}개 품목`
                  ).join(" · ")}
                </p>
              </div>
            </header>
            <AdminTable headers={["품목", "플랫폼", "표본(건)", "Q1(원)", "중앙값(원)", "Q3(원)"]}>
              {analysis.rows.map((row) => (
                <tr key={`${row.category}|${row.platform}`}>
                  <td style={{ fontWeight: 600 }}>{row.category}</td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        background:
                          row.platform === "당근"
                            ? "#FFE9DA"
                            : row.platform === "중고나라"
                            ? "#E8F4EC"
                            : "#EBF2FA",
                        color:
                          row.platform === "당근"
                            ? "#DF5900"
                            : row.platform === "중고나라"
                            ? "#1F7842"
                            : "#2164A6",
                      }}
                    >
                      {row.platform}
                    </span>
                  </td>
                  <td>{numberFormat.format(row.sample_count)}</td>
                  <td>{numberFormat.format(row.p25_price)}원</td>
                  <td style={{ fontWeight: 700, color: "#1A1C20" }}>
                    {numberFormat.format(row.median_price)}원
                  </td>
                  <td>{numberFormat.format(row.p75_price)}원</td>
                </tr>
              ))}
            </AdminTable>
          </article>
        </>
      ) : (
        <p className={styles.comparisonEmpty}>DB에 비교 가능한 외부 시장 가격 통계가 없습니다.</p>
      )}
    </section>
  );
}
