"use client";
import { useState } from "react";
import { Database, ChartColumn, Download, Layers } from "lucide-react";
import QualitySection from "./QualitySection";
import PriceModelSection from "./PriceModelSection";
import SourceOperationsSection from "./SourceOperationsSection";
import type { AdminDataStatus, AdminAudienceInsights } from "@/services/adminService";
import type { ModelValidation } from "./types";
import styles from "@/components/admin/portal.module.css";

export interface ManagementSectionProps {
  status: AdminDataStatus | null;
  insights: AdminAudienceInsights | null;
  validation: ModelValidation | null;
}

type TabKey = "quality" | "price-model" | "sources";

const tabs: { key: TabKey; label: string; icon: typeof Database; desc: string }[] = [
  { key: "quality", label: "수집 품질", icon: Database, desc: "당근마켓 실시간 매물 수집 품질 및 이상치·결측치 점검" },
  { key: "price-model", label: "가격 모델", icon: ChartColumn, desc: "LightGBM 머신러닝 가격 예측 모델 성능 및 오차 검증" },
  { key: "sources", label: "수집원 관리", icon: Download, desc: "중고나라·번개장터 등 외부 플랫폼 수집원 운영 및 데이터 적재 현황" },
];

export default function ManagementSection({ status, insights, validation }: ManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("quality");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tab Navigation Toolbar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          background: "#fff",
          padding: "12px 16px",
          borderRadius: 18,
          border: "1px solid #E7E8E5",
          boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
          flexWrap: "wrap",
        }}
      >
        {tabs.map(({ key, label, icon: Icon, desc }) => {
          const isActive = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              className={styles.dynamicPillBtn}
              style={{
                background: isActive ? "linear-gradient(135deg, #FF6F0F 0%, #FF8A3D 100%)" : "#F7F8F5",
                color: isActive ? "#ffffff" : "#4A5145",
                borderColor: isActive ? "#FF6F0F" : "#DFE2D9",
                boxShadow: isActive ? "0 3px 10px rgba(255, 111, 15, 0.28)" : "none",
                fontWeight: isActive ? 700 : 550,
                padding: "9px 18px",
              }}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={14} color={isActive ? "#ffffff" : "#656C60"} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Description Banner */}
      <div
        style={{
          background: "#FAFBF8",
          border: "1px solid #E9EBE4",
          borderRadius: 14,
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 13,
          color: "#676E62",
        }}
      >
        <Layers size={16} color="#FF6F0F" />
        <span>{tabs.find((t) => t.key === activeTab)?.desc}</span>
      </div>

      {/* Tab Content View */}
      <div>
        {activeTab === "quality" && (
          status ? <QualitySection status={status} /> : <p style={{ padding: 20, color: "#858B80" }}>수집 품질 데이터를 불러오는 중이거나 데이터가 없습니다.</p>
        )}
        {activeTab === "price-model" && (
          validation ? <PriceModelSection validation={validation} /> : <p style={{ padding: 20, color: "#858B80" }}>가격 모델 검증 데이터를 불러오는 중이거나 데이터가 없습니다.</p>
        )}
        {activeTab === "sources" && (
          insights ? <SourceOperationsSection insights={insights} /> : <p style={{ padding: 20, color: "#858B80" }}>수집원 데이터를 불러오는 중이거나 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
export { ManagementSection };
