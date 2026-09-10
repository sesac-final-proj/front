"use client";
import { useCallback } from "react";
import { getAdminDataStatus, getAdminAudienceInsights, getAdminDreamStatus } from "@/services/adminService";
import { useAdminResource } from "./useAdminResource";
import { AdminPageHeader, Skeleton, ErrorState } from "./AdminUI";
import DreamSection from "./sections/DreamSection";
import ExternalComparisonSection from "./sections/ExternalComparisonSection";
import TradesSection from "./sections/TradesSection";
import QualitySection from "./sections/QualitySection";
import SourceOperationsSection from "./sections/SourceOperationsSection";
import NoticesSection from "./sections/NoticesSection";
import SystemSection from "./sections/SystemSection";
import styles from "@/app/admin/admin.module.css";
export const sectionTitles: Record<string, string> = { trades: "거래 데이터 탐색", quality: "수집 품질", insights: "외부 지표 인사이트", sources: "수집원 관리", "price-model": "가격 모델", donations: "꿈가지 분석", notices: "공지·기부", system: "구현 현황" };
export default function AdminSectionPage({ section }: { section: string }) {
 const loader = useCallback(async () => {
  const [status, insights, dream] = await Promise.all([
   ["trades","quality"].includes(section) ? getAdminDataStatus() : null,
   section === "sources" ? getAdminAudienceInsights() : null,
   section === "donations" ? getAdminDreamStatus() : null,
  ]);
  return { status, insights, dream };
 }, [section]);
 const { data, loading, error, retry } = useAdminResource(loader);
 return <><AdminPageHeader title={sectionTitles[section]} description={["insights","sources","price-model"].includes(section) ? "당근·중고나라·번개장터 수집 표본의 가격 차이와 데이터 품질을 확인하세요." : "운영 데이터를 확인하고 필요한 항목을 점검하세요."} action={<button onClick={retry} disabled={loading}>새로고침</button>} />
 {loading ? <Skeleton /> : error || !data ? <ErrorState message={error} retry={retry} /> : <div className={styles.legacy}>
 {section === "trades" && data.status && <TradesSection status={data.status} />}
 {section === "quality" && data.status && <QualitySection status={data.status} />}
 {section === "insights" && <ExternalComparisonSection />}
 {section === "sources" && <SourceOperationsSection insights={data.insights} />}
 {section === "donations" && <DreamSection dream={data.dream} />}
 {section === "notices" && <NoticesSection />}
 {section === "system" && <SystemSection insights={null} />}
 </div>}</>;
}
