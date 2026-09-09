"use client";
import { useCallback } from "react";
import { getAdminDataStatus, getAdminAudienceInsights, getAdminDreamStatus } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminPageHeader, Skeleton, ErrorState } from "./AdminUI";
import DreamSection from "./sections/DreamSection";
import InsightsSection from "./sections/InsightsSection";
import TradesSection from "./sections/TradesSection";
import QualitySection from "./sections/QualitySection";
import SourcesSection from "./sections/SourcesSection";
import PriceModelSection from "./sections/PriceModelSection";
import NoticesSection from "./sections/NoticesSection";
import SystemSection from "./sections/SystemSection";
import type { ModelValidation } from "./sections/types";
import styles from "@/app/admin/admin.module.css";
export const sectionTitles: Record<string, string> = { trades: "거래 데이터 탐색", quality: "수집 품질", insights: "비교 인사이트", sources: "수집원 관리", "price-model": "가격 모델", donations: "꿈가지 분석", notices: "공지·기부 운영", system: "구현 현황" };
async function getModel(): Promise<ModelValidation> {
 const response = await fetch("/model-validation.json");
 if (!response.ok) throw new Error("가격 모델 검증 산출물을 불러오지 못했습니다.");
 return response.json();
}
export default function AdminSectionPage({ section }: { section: string }) {
 const loader = useCallback(async () => {
  const [status, insights, dream, validation] = await Promise.all([
   ["trades","quality"].includes(section) ? getAdminDataStatus() : null,
   ["insights","sources"].includes(section) ? getAdminAudienceInsights() : null,
   section === "donations" ? getAdminDreamStatus() : null,
   ["sources","price-model"].includes(section) ? getModel() : null,
  ]);
  return { status, insights, dream, validation };
 }, [section]);
 const { data, loading, error, retry } = useAdminResource(loader);
 return <><AdminPageHeader title={sectionTitles[section]} description={["insights","sources","price-model"].includes(section) ? "외부 플랫폼의 수집 표본과 분석 결과를 확인하세요." : "운영 데이터를 확인하고 필요한 항목을 점검하세요."} action={<button onClick={retry} disabled={loading}>새로고침</button>} />
 {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : <div className={styles.legacy}>
 {section === "trades" && data.status && <TradesSection status={data.status} />}
 {section === "quality" && data.status && <QualitySection status={data.status} />}
 {section === "insights" && <InsightsSection insights={data.insights} />}
 {section === "sources" && <SourcesSection insights={data.insights} validation={data.validation} />}
 {section === "price-model" && <PriceModelSection validation={data.validation} />}
 {section === "donations" && <DreamSection dream={data.dream} />}
 {section === "notices" && <NoticesSection />}
 {section === "system" && <SystemSection insights={null} />}
 </div>}</>;
}
