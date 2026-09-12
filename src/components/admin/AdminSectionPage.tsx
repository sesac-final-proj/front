"use client";
import { useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { getAdminDataStatus, getAdminAudienceInsights, getAdminDreamStatus } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminPageHeader, Skeleton, ErrorState } from "./AdminUI";
import DreamSection from "./sections/DreamSection";
import MarketTrendsSection from "./sections/MarketTrendsSection";
import ExternalComparisonSection from "./sections/ExternalComparisonSection";
import EnvironmentAnalysisSection from "./sections/EnvironmentAnalysisSection";
import RiskAnalysisSection from "./sections/RiskAnalysisSection";
import TradeDashboardSection from "./sections/TradeDashboardSection";
import TradesSection from "./sections/TradesSection";
import QualitySection from "./sections/QualitySection";
import SourceOperationsSection from "./sections/SourceOperationsSection";
import PriceModelSection from "./sections/PriceModelSection";
import { PriceStatusSection } from "./sections/PriceStatusSection";
import { PriceComparisonSection } from "./PriceComparisonSection";
import { ManagementSection } from "./sections/ManagementSection";
import NoticesSection from "./sections/NoticesSection";
import SystemSection from "./sections/SystemSection";
import type { ModelValidation } from "./sections/types";
import styles from "@/app/admin/admin.module.css";

export const sectionTitles: Record<string, string> = {
  "trade-dashboard": "거래 대시보드",
  trades: "거래 데이터 탐색",
  "price-status": "가격현황",
  management: "관리",
  quality: "수집 품질",
  insights: "외부 비교 인사이트",
  "market-trends": "외부 변화 추이",
  environment: "모델 및 외부 환경 분석",
  risks: "위험요소 및 안전신호 분석",
  sources: "수집원 관리",
  "price-model": "가격 모델",
  "price-comparison": "가격 지역별 비교",
  donations: "꿈가지 분석",
  notices: "공지·기부",
  system: "구현 현황",
};

async function getModel(): Promise<ModelValidation> {
  const response = await fetch("/model-validation.json", { cache: "no-store" });
  if (!response.ok) throw new Error("가격 모델 검증 산출물을 불러오지 못했습니다.");
  return response.json();
}

export default function AdminSectionPage({ section }: { section: string }) {
  const loader = useCallback(async () => {
    const [status, insights, dream, validation] = await Promise.all([
      ["trades", "quality", "management"].includes(section) ? getAdminDataStatus() : null,
      ["sources", "management"].includes(section) ? getAdminAudienceInsights() : null,
      section === "donations" ? getAdminDreamStatus() : null,
      ["sources", "price-model", "management"].includes(section) ? getModel() : null,
    ]);
    return { status, insights, dream, validation };
  }, [section]);

  const { data, loading, error, retry } = useAdminResource(loader);
  const showHeaderRefresh = section !== "price-comparison" && section !== "environment";

  return (
    <>
      <AdminPageHeader
        title={sectionTitles[section]}
        description={
          section === "environment"
            ? "서울시 실시간 도시데이터 혼잡도 모델 & 기상·유동인구 외부 환경 융합 분석 결과를 확인하세요."
            : section === "risks"
            ? "서울안전누리 및 실시간 도시데이터 기반 자치구별 위험신호 점유율과 안전 위협 요소를 정밀 분석합니다."
            : section === "market-trends"
            ? "품목별 거래 기준 비교 및 당근 대비 외부시장(중고나라·번개장터) 가격 변화 추이와 사분위수 분포를 정밀 분석합니다."
            : section === "management"
            ? "수집 데이터 품질 검수, AI 가격 예측 모델 성능 검증, 외부 수집원 운영 현황을 한곳에서 통합 관리합니다."
            : ["insights", "sources", "price-model"].includes(section)
            ? "외부 비교(시세, 기상, 물가, 소셜 트렌드) 수집 표본과 분석 결과를 확인하세요."
            : "운영 데이터를 확인하고 필요한 항목을 점검하세요."
        }
        action={
          showHeaderRefresh ? (
            <button
              type="button"
              className={styles.dynamicPillBtn}
              onClick={retry}
              disabled={loading}
            >
              <RefreshCw size={13} style={loading ? { animation: "spin 1s linear infinite" } : undefined} />
              <span>새로고침</span>
            </button>
          ) : undefined
        }
      />
      {loading && section !== "environment" && section !== "risks" && section !== "trade-dashboard" && section !== "market-trends" && section !== "management" ? (
        <Skeleton />
      ) : error || !data ? (
        <ErrorState message={error} retry={retry} />
      ) : (
        <div className={styles.legacy}>
          {section === "trade-dashboard" && <TradeDashboardSection />}
          {section === "trades" && data.status && <TradesSection status={data.status} />}
          {section === "price-status" && <PriceStatusSection />}
          {section === "management" && (
            <ManagementSection
              status={data.status}
              insights={data.insights}
              validation={data.validation}
            />
          )}
          {section === "quality" && data.status && <QualitySection status={data.status} />}
          {section === "insights" && <ExternalComparisonSection />}
          {section === "market-trends" && <MarketTrendsSection />}
          {section === "environment" && <EnvironmentAnalysisSection />}
          {section === "risks" && <RiskAnalysisSection />}
          {section === "sources" && <SourceOperationsSection insights={data.insights} />}
          {section === "price-model" && <PriceModelSection validation={data.validation} />}
          {section === "price-comparison" && <PriceComparisonSection />}
          {section === "donations" && <DreamSection dream={data.dream} />}
          {section === "notices" && <NoticesSection />}
          {section === "system" && <SystemSection insights={null} />}
        </div>
      )}
    </>
  );
}
