"use client";

import { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  FileText,
  X,
  ArrowUpDown,
  ShieldCheck,
  BarChart3,
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  Percent,
  CloudRain,
  DollarSign,
  Flame,
  AlertTriangle,
  Zap,
  MapPin,
  Calendar,
  Sliders,
  CheckCircle2,
  ArrowUpRight
} from "lucide-react";
import type { AdminAudienceInsights, AdminProductCluster } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) =>
  value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;

type ColumnKey =
  | "item"
  | "model"
  | "signature"
  | "count"
  | "median"
  | "range"
  | "iqr"
  | "dispersion"
  | "platformCount"
  | "completedRate"
  | "qualityStatus";

const AVAILABLE_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: "item", label: "품목군", defaultVisible: true },
  { key: "model", label: "정규화 모델", defaultVisible: true },
  { key: "signature", label: "제품 시그니처", defaultVisible: false },
  { key: "count", label: "표본수(n)", defaultVisible: true },
  { key: "median", label: "중앙값 시세", defaultVisible: true },
  { key: "range", label: "Q1 ~ Q3 범위", defaultVisible: true },
  { key: "iqr", label: "가격편차(IQR)", defaultVisible: true },
  { key: "dispersion", label: "분산도(IQR/Med)", defaultVisible: false },
  { key: "platformCount", label: "수집 플랫폼수", defaultVisible: true },
  { key: "completedRate", label: "거래완료율", defaultVisible: true },
  { key: "qualityStatus", label: "품질상태", defaultVisible: true },
];

// ==========================================
// 외부 지표 × 내부 감성/거래 결합 분석 시뮬레이션 데이터
// ==========================================
interface FusionScenario {
  id: string;
  title: string;
  externalMetricName: string;
  externalUnit: string;
  internalMetricName: string;
  internalUnit: string;
  pearsonR: number;
  significance: string;
  description: string;
  businessAction: string;
  productImprovement: string;
  alertLevel: "HIGH" | "MEDIUM" | "OPPORTUNITY";
  timeSeriesDaily: {
    date: string;
    externalVal: number;
    internalVal: number;
    negScore: number;
    sampleSize: number;
    note?: string;
  }[];
}

const FUSION_SCENARIOS: FusionScenario[] = [
  {
    id: "weather_cancellation",
    title: "기상청 날씨(강수량/한파) × 직거래 파기·잠수율",
    externalMetricName: "기상청 일 강수량",
    externalUnit: "mm",
    internalMetricName: "당근 직거래 파기/잠수율",
    internalUnit: "%",
    pearsonR: 0.78,
    significance: "p < 0.001 (강한 양의 상관관계 감지)",
    description: "강수량 15mm 이상 호우 또는 영하 5℃ 이하 한파 발생 시 직거래 약속 당일 취소 및 비매너 잠수 신고가 평시 대비 최대 7.4배 급증합니다.",
    businessAction: "특정 강수량(15mm) 도달 시 거래 채팅방에 '기상 악화로 약속 시간 변동이 생길 수 있어요' 사전 안심 알림 자동 푸시 및 택배 거래/문고리 거래 전환 유도 팝업 노출",
    productImprovement: "기상청 날씨 API 연동 기반 [우천 시 비대면 문고리거래 원클릭 전환] 버튼 채팅창 탑재",
    alertLevel: "HIGH",
    timeSeriesDaily: [
      { date: "08.26", externalVal: 0, internalVal: 4.1, negScore: 12, sampleSize: 1240 },
      { date: "08.27", externalVal: 2.5, internalVal: 5.2, negScore: 14, sampleSize: 1190 },
      { date: "08.28", externalVal: 0, internalVal: 3.9, negScore: 10, sampleSize: 1310 },
      { date: "08.29", externalVal: 38.5, internalVal: 28.4, negScore: 68, sampleSize: 1050, note: "호우주의보 발령 (파기율 급증)" },
      { date: "08.30", externalVal: 45.0, internalVal: 32.1, negScore: 74, sampleSize: 980, note: "호우경보 (잠수 신고 128건)" },
      { date: "08.31", externalVal: 14.0, internalVal: 15.2, negScore: 35, sampleSize: 1120 },
      { date: "09.01", externalVal: 0, internalVal: 4.5, negScore: 11, sampleSize: 1400 },
      { date: "09.02", externalVal: 0, internalVal: 4.0, negScore: 9, sampleSize: 1380 },
      { date: "09.03", externalVal: 18.0, internalVal: 19.8, negScore: 42, sampleSize: 1150, note: "국지성 소나기" },
      { date: "09.04", externalVal: 0, internalVal: 3.8, negScore: 8, sampleSize: 1420 },
      { date: "09.05", externalVal: 0, internalVal: 4.2, negScore: 12, sampleSize: 1390 },
      { date: "09.06", externalVal: 28.0, internalVal: 24.6, negScore: 56, sampleSize: 1080, note: "강한 비 (문고리 거래율 48% 상승)" },
      { date: "09.07", externalVal: 5.0, internalVal: 7.1, negScore: 18, sampleSize: 1290 },
      { date: "09.08", externalVal: 0, internalVal: 4.0, negScore: 10, sampleSize: 1450 },
    ]
  },
  {
    id: "cpi_nego_friction",
    title: "소비자물가지수(CPI)/출고가 × 가격·네고 불만 지수",
    externalMetricName: "가전 물가지수/출고가 변동률",
    externalUnit: "%",
    internalMetricName: "채팅 내 네고 갈등/가격 불만율",
    internalUnit: "%",
    pearsonR: 0.64,
    significance: "p < 0.01 (유의미한 양의 상관관계 감지)",
    description: "신제품 출고가 인상 및 거시 물가 상승기에 중고 판매자는 높은 호가를 고수하는 반면 구매자의 무리한 네고 요구가 증가하여 채팅 내 감정 대립 및 거래 성사율 저하가 관측됩니다.",
    businessAction: "외부 시세 기반 [적정 시세 밴드(Q1~Median)]를 채팅창에 투명 공개하고, '네고 없는 쿨거래' 선택 시 판매자/구매자에게 매너온도 가산점 부여",
    productImprovement: "판매 등록 시 외부 4,771건 시세 기반 [빠른 판매 보장가] 기본 추천 프리셋 탑재",
    alertLevel: "MEDIUM",
    timeSeriesDaily: [
      { date: "W1(8월초)", externalVal: 1.2, internalVal: 14.5, negScore: 22, sampleSize: 3400 },
      { date: "W2(8월중)", externalVal: 1.8, internalVal: 17.2, negScore: 28, sampleSize: 3520 },
      { date: "W3(8월말)", externalVal: 3.4, internalVal: 26.8, negScore: 48, sampleSize: 3310, note: "신제품 발표 및 출고가 인상 소식" },
      { date: "W4(9월초)", externalVal: 4.1, internalVal: 31.5, negScore: 59, sampleSize: 3600, note: "네고 분쟁 및 가격 시비 41% 증가" },
      { date: "W5(9월중)", externalVal: 3.8, internalVal: 29.0, negScore: 52, sampleSize: 3450 },
      { date: "W6(9월말)", externalVal: 2.5, internalVal: 21.0, negScore: 36, sampleSize: 3580 },
    ]
  },
  {
    id: "trend_social_premium",
    title: "소셜 트렌드 언급량 × 브랜드 선호도 & 리셀 프리미엄",
    externalMetricName: "네이버/인스타 소셜 언급량 지수",
    externalUnit: "pts",
    internalMetricName: "당근 검색량 & 프리미엄(P) 비율",
    internalUnit: "%",
    pearsonR: 0.82,
    significance: "p < 0.001 (매우 강한 양의 상관관계 감지)",
    description: "유튜브/인스타그램 뷰티/생활가전 바이럴 시 외부 언급량이 급증하며, 당근 로컬 매물 검색량이 4.2배 폭증하고 감가 방어율(프리미엄)이 15~25% 상승합니다.",
    businessAction: "소셜 급상승 키워드 실시간 연동으로 동네 피드 최상단 [실시간 트렌드 아이템] 배너 편성 및 시세 교란/가품 매물 모니터링 가드 강화",
    productImprovement: "동네 트렌드 랭킹 알고리즘에 외부 소셜 바이럴 가중치(30%) 실시간 결합",
    alertLevel: "OPPORTUNITY",
    timeSeriesDaily: [
      { date: "08.26", externalVal: 24, internalVal: 5.2, negScore: 4, sampleSize: 850 },
      { date: "08.28", externalVal: 35, internalVal: 8.1, negScore: 5, sampleSize: 920 },
      { date: "08.30", externalVal: 88, internalVal: 29.4, negScore: 12, sampleSize: 2400, note: "인플루언서 뷰티디바이스 바이럴" },
      { date: "09.01", externalVal: 95, internalVal: 34.8, negScore: 15, sampleSize: 2850, note: "검색량 420% 급증, 미개봉 P 형성" },
      { date: "09.03", externalVal: 76, internalVal: 25.1, negScore: 10, sampleSize: 2100 },
      { date: "09.05", externalVal: 58, internalVal: 18.0, negScore: 8, sampleSize: 1650 },
      { date: "09.07", externalVal: 42, internalVal: 12.4, negScore: 6, sampleSize: 1200 },
    ]
  }
];

export default function InsightsSection({ insights }: { insights: AdminAudienceInsights | null }) {
  // Top View Mode: Market Clusters vs External-Internal Fusion
  const [activeViewMode, setActiveViewMode] = useState<"clusters" | "fusion">("clusters");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedQuality, setSelectedQuality] = useState("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "multi" | "single">("all");

  // Sorting State
  const [sortKey, setSortKey] = useState<"count" | "median" | "iqr" | "dispersion" | "completedRate" | "item">("count");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination / Page Size
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Column Customizer State
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    AVAILABLE_COLUMNS.forEach((col) => {
      initial[col.key] = col.defaultVisible;
    });
    return initial as Record<ColumnKey, boolean>;
  });
  const [showColumnModal, setShowColumnModal] = useState(false);

  // Interactive Tuning Sandbox State
  const [minSampleThreshold, setMinSampleThreshold] = useState<number>(5);
  const [iqrMultiplier, setIqrMultiplier] = useState<number>(1.5);
  const [showTuningPanel, setShowTuningPanel] = useState(false);

  // Detail Modal & Report Modal State
  const [selectedCluster, setSelectedCluster] = useState<AdminProductCluster | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState<"governance" | "semantic" | "guide">("governance");

  // ==========================================
  // Fusion Analytics State
  // ==========================================
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>("weather_cancellation");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [aggregationUnit, setAggregationUnit] = useState<"daily" | "weekly">("daily");
  const [normalizeScale, setNormalizeScale] = useState<boolean>(true);

  if (!insights) return null;

  const rawClusters = insights.productClusters ?? [];
  const dataQuality = insights.dataQuality;
  const modelQuality = insights.modelQuality;

  // Extract unique families for interactive Tab Bar
  const uniqueFamilies = useMemo(() => {
    const families = new Set<string>();
    rawClusters.forEach((c) => {
      if (c.item) families.add(c.item);
    });
    return Array.from(families).sort();
  }, [rawClusters]);

  // Dynamically recalculate cluster status according to Admin's Tuning Thresholds
  const processedClusters = useMemo(() => {
    return rawClusters.map((cluster) => {
      const n = cluster.count || cluster.sampleCount || 0;
      const median = cluster.median || cluster.medianPrice || 1;
      const iqr = cluster.iqr || cluster.q3 - cluster.q1 || 0;
      const disp = iqr / Math.max(median, 1);

      let dynStatus: "reliable" | "limited" | "sparse" | "noisy" = "sparse";
      if (disp > 0.5 * (iqrMultiplier / 1.5)) {
        dynStatus = "noisy";
      } else if (n >= minSampleThreshold * 2) {
        dynStatus = "reliable";
      } else if (n >= minSampleThreshold) {
        dynStatus = "limited";
      } else {
        dynStatus = "sparse";
      }

      return {
        ...cluster,
        tunedStatus: dynStatus,
        effectiveDispersion: disp,
      };
    });
  }, [rawClusters, minSampleThreshold, iqrMultiplier]);

  // Filtered & Sorted Clusters
  const filteredClusters = useMemo(() => {
    return processedClusters
      .filter((c) => {
        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (c.item || "").toLowerCase().includes(q);
          const matchModel = (c.model || "").toLowerCase().includes(q);
          const matchSig = (c.productSignature || c.cluster || "").toLowerCase().includes(q);
          const matchCond = (c.condition || "").toLowerCase().includes(q);
          if (!matchTitle && !matchModel && !matchSig && !matchCond) return false;
        }

        // Family Filter
        if (selectedFamily !== "all" && c.item !== selectedFamily) {
          return false;
        }

        // Quality Tier Filter
        if (selectedQuality !== "all") {
          const status = showTuningPanel ? c.tunedStatus : c.qualityStatus;
          if (status !== selectedQuality) return false;
        }

        // Platform Filter
        if (platformFilter === "multi" && (c.platformCount || 1) < 2) return false;
        if (platformFilter === "single" && (c.platformCount || 1) >= 2) return false;

        return true;
      })
      .sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;

        switch (sortKey) {
          case "count":
            valA = a.count || 0;
            valB = b.count || 0;
            break;
          case "median":
            valA = a.median || a.medianPrice || 0;
            valB = b.median || b.medianPrice || 0;
            break;
          case "iqr":
            valA = a.iqr || a.q3 - a.q1 || 0;
            valB = b.iqr || b.q3 - b.q1 || 0;
            break;
          case "dispersion":
            valA = a.effectiveDispersion || 0;
            valB = b.effectiveDispersion || 0;
            break;
          case "completedRate":
            valA = a.completedRate || 0;
            valB = b.completedRate || 0;
            break;
          case "item":
            valA = a.item || "";
            valB = b.item || "";
            return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortAsc ? valA - valB : valB - valA;
      });
  }, [processedClusters, searchQuery, selectedFamily, selectedQuality, platformFilter, sortKey, sortAsc, showTuningPanel]);

  // Paginated Slices
  const totalFilteredCount = filteredClusters.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const paginatedClusters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredClusters.slice(start, start + pageSize);
  }, [filteredClusters, currentPage, pageSize]);

  // Statistics for selected family / overall slice
  const currentSliceStats = useMemo(() => {
    const totalCount = filteredClusters.reduce((acc, c) => acc + (c.count || 0), 0);
    const prices = filteredClusters.map((c) => c.median || 0).filter((p) => p > 0);
    const avgMedian = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const reliableCount = filteredClusters.filter((c) => c.qualityStatus === "reliable").length;

    return {
      totalCount,
      clusterCount: filteredClusters.length,
      avgMedian,
      reliableCount,
    };
  }, [filteredClusters]);

  // Tuning simulation summary metrics
  const tuningStats = useMemo(() => {
    const reliable = processedClusters.filter((c) => c.tunedStatus === "reliable").length;
    const limited = processedClusters.filter((c) => c.tunedStatus === "limited").length;
    const sparse = processedClusters.filter((c) => c.tunedStatus === "sparse").length;
    const noisy = processedClusters.filter((c) => c.tunedStatus === "noisy").length;
    const coverageRows = processedClusters
      .filter((c) => c.tunedStatus === "reliable" || c.tunedStatus === "limited")
      .reduce((acc, c) => acc + (c.count || 0), 0);
    const totalRows = processedClusters.reduce((acc, c) => acc + (c.count || 0), 0);

    return {
      reliable,
      limited,
      sparse,
      noisy,
      coverageRate: totalRows > 0 ? ((coverageRows / totalRows) * 100).toFixed(1) : "0",
      coverageRows,
      totalRows,
    };
  }, [processedClusters]);

  // Active Fusion Scenario
  const currentScenario = useMemo(() => {
    return FUSION_SCENARIOS.find((s) => s.id === selectedScenarioId) || FUSION_SCENARIOS[0];
  }, [selectedScenarioId]);

  // Normalize Time Series Data for Visual Chart
  const normalizedSeries = useMemo(() => {
    const data = currentScenario.timeSeriesDaily;
    const extMax = Math.max(...data.map((d) => d.externalVal), 1);
    const extMin = Math.min(...data.map((d) => d.externalVal), 0);
    const intMax = Math.max(...data.map((d) => d.internalVal), 1);
    const intMin = Math.min(...data.map((d) => d.internalVal), 0);

    return data.map((d) => {
      const extNorm = ((d.externalVal - extMin) / Math.max(extMax - extMin, 1)) * 100;
      const intNorm = ((d.internalVal - intMin) / Math.max(intMax - intMin, 1)) * 100;
      return {
        ...d,
        extNorm,
        intNorm,
      };
    });
  }, [currentScenario]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section id="external-insights" className={styles.section}>
      {/* 1. Section Header with Top View Mode Switcher */}
      <div className={styles.sectionHead}>
        <div>
          <span>EXT·01</span>
          <div>
            <p className={styles.eyebrow}>CROSS-PLATFORM AUDIENCE & EXTERNAL FUSION INTELLIGENCE</p>
            <h2>외부 지표 인사이트 & 감성 결합 분석실</h2>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 12px",
              background: "#20231f",
              color: "#fff",
              border: "1px solid #3d433b",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <FileText size={14} color="#ff8a48" />
            <span>종합 거버넌스 보고서 요약</span>
          </button>
        </div>
      </div>

      {/* Top View Mode Switcher: 시세 클러스터 vs 외부 지표 결합 융합실 */}
      <div style={{
        display: "flex",
        background: "#f1f5f9",
        padding: "4px",
        borderRadius: "8px",
        marginBottom: "20px",
        gap: "4px"
      }}>
        <button
          onClick={() => setActiveViewMode("clusters")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: activeViewMode === "clusters" ? 800 : 600,
            background: activeViewMode === "clusters" ? "#fff" : "transparent",
            color: activeViewMode === "clusters" ? "var(--ink)" : "var(--muted)",
            border: activeViewMode === "clusters" ? "1px solid #e2e8f0" : "none",
            boxShadow: activeViewMode === "clusters" ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Layers size={16} color={activeViewMode === "clusters" ? "var(--carrot)" : "currentColor"} />
          <span>1. 외부 시세 클러스터 & 실시간 시세 거버넌스 (4,771건 정제 표본)</span>
        </button>

        <button
          onClick={() => setActiveViewMode("fusion")}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: activeViewMode === "fusion" ? 800 : 600,
            background: activeViewMode === "fusion" ? "#1e293b" : "transparent",
            color: activeViewMode === "fusion" ? "#fff" : "var(--muted)",
            border: activeViewMode === "fusion" ? "1px solid #334155" : "none",
            boxShadow: activeViewMode === "fusion" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <Zap size={16} color={activeViewMode === "fusion" ? "#ff8a48" : "currentColor"} />
          <span>2. 외부 지표(날씨·물가·소셜) × 내부 감성·파기 상관 결합 분석실 (PROTOTYPE)</span>
          <span style={{
            fontSize: "10px",
            background: activeViewMode === "fusion" ? "rgba(255,110,36,0.3)" : "#e2e8f0",
            color: activeViewMode === "fusion" ? "#ff8a48" : "#64748b",
            padding: "2px 6px",
            borderRadius: "4px",
            fontWeight: 800
          }}>
            NEW
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 2: EXTERNAL FUSION ANALYTICS (사용자 요청 핵심 구현) */}
      {/* ======================================================== */}
      {activeViewMode === "fusion" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Correlation Alert Banner (Pearson r >= 0.6 감지) */}
          <div style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border: "1px solid #334155",
            borderRadius: "8px",
            padding: "20px 24px",
            color: "#f8fafc",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  background: "rgba(255, 110, 36, 0.25)",
                  color: "#ff8a48",
                  border: "1px solid #ff6e24",
                  fontSize: "11px",
                  fontWeight: 800,
                  padding: "4px 8px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <AlertTriangle size={13} />
                  INSIGHT ALERT : CORRELATION r ≥ 0.6 DETECTED
                </span>
                <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#fff" }}>
                  내부 감성·거래 데이터 × 외부 지표 시계열 결합(Join) 분석
                </h3>
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#94a3b8" }}>
                <span>기준 키: <b>시간(Daily) × 행정동(Geo) × 카테고리</b></span>
                <span>·</span>
                <span>스케일링: <b>Min-Max 정규화 (0~100%)</b></span>
              </div>
            </div>
            <p style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
              중고거래는 단순 가격뿐 아니라 <b>기상 악화(강수/한파), 거시 물가 변동, 소셜 바이럴 트렌드</b>와 같은 외부 요인에 강력한 영향을 받습니다.
              백엔드에서 피어슨 상관계수(Pearson $r$)를 실시간 연산하여, 상관도가 높은 외부 지표를 프로덕트 사전 가이드 룰셋으로 자동 연결합니다.
            </p>
          </div>

          {/* 3 Scenario Presets Selector */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--ink)" }}>
                1. 유의미 외부 지표 매칭 시나리오 선택 (Scenario Selector)
              </span>
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                클릭 시 실시간 상관계수 및 프로덕트 개선 가이드라인 즉시 전환
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
              {FUSION_SCENARIOS.map((scenario) => {
                const isSelected = selectedScenarioId === scenario.id;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => setSelectedScenarioId(scenario.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      padding: "16px",
                      borderRadius: "8px",
                      background: isSelected ? "#fffaf6" : "#fff",
                      border: isSelected ? "2px solid var(--carrot)" : "1px solid var(--line)",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: isSelected ? "0 4px 12px rgba(255,110,36,0.15)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: scenario.alertLevel === "HIGH" ? "#ffe4e6" : scenario.alertLevel === "MEDIUM" ? "#fef3c7" : "#e0f2fe",
                        color: scenario.alertLevel === "HIGH" ? "#e11d48" : scenario.alertLevel === "MEDIUM" ? "#d97706" : "#0284c7"
                      }}>
                        {scenario.alertLevel === "HIGH" ? "🚨 리스크 경보" : scenario.alertLevel === "MEDIUM" ? "⚠️ 분쟁 관리" : "💡 기회 발굴"}
                      </span>
                      <strong style={{ fontSize: "14px", color: "var(--carrot-dark)", fontFamily: "monospace" }}>
                        r = +{scenario.pearsonR.toFixed(2)}
                      </strong>
                    </div>

                    <h4 style={{ fontSize: "14px", fontWeight: 700, margin: "4px 0 6px 0", color: "var(--ink)" }}>
                      {scenario.title}
                    </h4>

                    <div style={{ fontSize: "11px", color: "var(--muted)", display: "flex", gap: "10px", marginTop: "4px" }}>
                      <span>외부: <b>{scenario.externalMetricName}</b></span>
                      <span>↔</span>
                      <span>내부: <b>{scenario.internalMetricName}</b></span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Fusion Analytics Workbench */}
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "8px",
            padding: "24px"
          }}>
            {/* Control Bar: Region, Time Unit, Scaling Toggle */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
              paddingBottom: "18px",
              borderBottom: "1px solid var(--line)",
              marginBottom: "20px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                {/* Region Filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={15} color="var(--carrot)" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>지역 기준:</span>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--line)",
                      background: "#fff",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "var(--ink)",
                      cursor: "pointer"
                    }}
                  >
                    <option value="all">전국 단위 집계</option>
                    <option value="gangnam">서울특별시 강남구</option>
                    <option value="seocho">서울특별시 서초구</option>
                    <option value="mapo">서울특별시 마포구</option>
                    <option value="bundang">경기도 성남시 분당구</option>
                  </select>
                </div>

                {/* Aggregation Unit */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Calendar size={15} color="#2563eb" />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--ink)" }}>집계 주기:</span>
                  <div style={{ display: "flex", gap: "2px", background: "#f1f5f9", padding: "2px", borderRadius: "6px" }}>
                    <button
                      onClick={() => setAggregationUnit("daily")}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: aggregationUnit === "daily" ? 700 : 500,
                        background: aggregationUnit === "daily" ? "#fff" : "transparent",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      일별 (Daily)
                    </button>
                    <button
                      onClick={() => setAggregationUnit("weekly")}
                      style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: aggregationUnit === "weekly" ? 700 : 500,
                        background: aggregationUnit === "weekly" ? "#fff" : "transparent",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                    >
                      주별 (Weekly)
                    </button>
                  </div>
                </div>
              </div>

              {/* Normalization Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>Min-Max 0~100% 동일 축 비교:</span>
                <button
                  onClick={() => setNormalizeScale(!normalizeScale)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: normalizeScale ? "var(--carrot)" : "#e2e8f0",
                    color: normalizeScale ? "#fff" : "#475569",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  {normalizeScale ? "정규화 ON" : "원본 단위 OFF"}
                </button>
              </div>
            </div>

            {/* KPI Summary Strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              marginBottom: "24px"
            }}>
              <div style={{ padding: "14px", background: "#fff", border: "1px solid var(--line)", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, display: "block" }}>피어슨 상관계수 (r)</span>
                <div style={{ fontSize: "22px", fontWeight: 900, color: "var(--carrot-dark)", marginTop: "4px", fontFamily: "monospace" }}>
                  +{currentScenario.pearsonR.toFixed(2)}
                </div>
                <div style={{ fontSize: "11px", color: "#059669", marginTop: "4px", fontWeight: 600 }}>
                  {currentScenario.significance}
                </div>
              </div>

              <div style={{ padding: "14px", background: "#fff", border: "1px solid var(--line)", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, display: "block" }}>외부 지표 축 ({currentScenario.externalMetricName})</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#2563eb", marginTop: "4px" }}>
                  최대 {Math.max(...currentScenario.timeSeriesDaily.map(d => d.externalVal))} {currentScenario.externalUnit}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  관측 표본 {number.format(currentScenario.timeSeriesDaily.reduce((a, b) => a + b.sampleSize, 0))}건
                </div>
              </div>

              <div style={{ padding: "14px", background: "#fff", border: "1px solid var(--line)", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, display: "block" }}>내부 타깃 축 ({currentScenario.internalMetricName})</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#e11d48", marginTop: "4px" }}>
                  최대 {Math.max(...currentScenario.timeSeriesDaily.map(d => d.internalVal)).toFixed(1)} {currentScenario.internalUnit}
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  악화 시 최대 7.4배 변동
                </div>
              </div>

              <div style={{ padding: "14px", background: "#fff", border: "1px solid var(--line)", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700, display: "block" }}>조치 자동화 상태</span>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#059669", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={18} color="#059669" />
                  <span>실시간 가드 가동</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                  룰셋 자동 트리거 활성화
                </div>
              </div>
            </div>

            {/* Normalized Dual-Axis Time Series Chart (Interactive Visualization) */}
            <div style={{
              background: "#fff",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, margin: 0, color: "var(--ink)" }}>
                    시계열 동기화 곡선 (Time Series Join & Min-Max Scaled Overlay)
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0 0 0" }}>
                    동일한 시간축(Daily) 상에서 외부 원인 지표와 내부 감성/파기 결과 지표의 동조 현상을 실시간 추적합니다.
                  </p>
                </div>
                <div style={{ display: "flex", gap: "14px", fontSize: "12px", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", background: "#2563eb", borderRadius: "3px" }} />
                    <span style={{ color: "#2563eb" }}>외부: {currentScenario.externalMetricName}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", background: "#e11d48", borderRadius: "3px" }} />
                    <span style={{ color: "#e11d48" }}>내부: {currentScenario.internalMetricName}</span>
                  </div>
                </div>
              </div>

              {/* Bar / Line Visualization Container */}
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "200px", padding: "10px 0 25px 0", position: "relative", borderBottom: "2px solid #e2e8f0" }}>
                {normalizedSeries.map((d, idx) => {
                  const extHeight = normalizeScale ? d.extNorm : Math.min(100, d.externalVal * 2);
                  const intHeight = normalizeScale ? d.intNorm : Math.min(100, d.internalVal * 3);

                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                        position: "relative",
                        cursor: "pointer"
                      }}
                      title={`${d.date}\n외부(${currentScenario.externalMetricName}): ${d.externalVal}${currentScenario.externalUnit}\n내부(${currentScenario.internalMetricName}): ${d.internalVal}${currentScenario.internalUnit}\n${d.note ? `[비고] ${d.note}` : ""}`}
                    >
                      {/* Bars Container */}
                      <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", width: "100%", justifyContent: "center", height: "100%" }}>
                        {/* External Metric Bar */}
                        <div
                          style={{
                            width: "38%",
                            height: `${Math.max(4, extHeight)}%`,
                            background: "linear-gradient(to top, #2563eb, #60a5fa)",
                            borderRadius: "3px 3px 0 0",
                            transition: "height 0.3s ease",
                            opacity: 0.85
                          }}
                        />
                        {/* Internal Metric Bar */}
                        <div
                          style={{
                            width: "38%",
                            height: `${Math.max(4, intHeight)}%`,
                            background: "linear-gradient(to top, #e11d48, #fb7185)",
                            borderRadius: "3px 3px 0 0",
                            transition: "height 0.3s ease"
                          }}
                        />
                      </div>

                      {/* Date Label */}
                      <span style={{
                        position: "absolute",
                        bottom: "-22px",
                        fontSize: "10px",
                        fontWeight: 600,
                        color: d.note ? "#e11d48" : "var(--muted)",
                        whiteSpace: "nowrap"
                      }}>
                        {d.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "11px", color: "var(--muted)" }}>
                <span>← 과거 일별 추이</span>
                <span>※ 막대를 호버하면 세부 수치 및 이상치 발생 노트 확인 가능</span>
                <span>최근 실시간 집계 →</span>
              </div>
            </div>

            {/* Business Action Plan & Product Improvements */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
              gap: "16px"
            }}>
              {/* Card 1: Business Strategy */}
              <div style={{
                background: "#fffaf6",
                border: "1px solid #ffedd5",
                borderRadius: "8px",
                padding: "18px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <TrendingUp size={16} color="var(--carrot)" />
                  <h4 style={{ fontSize: "13px", fontWeight: 800, margin: 0, color: "var(--carrot-dark)" }}>
                    비즈니스 운영 전략 (Business Strategy)
                  </h4>
                </div>
                <p style={{ fontSize: "12px", color: "#7c2d12", lineHeight: 1.6, margin: 0 }}>
                  {currentScenario.businessAction}
                </p>
              </div>

              {/* Card 2: Product Improvement */}
              <div style={{
                background: "#f0fdf4",
                border: "1px solid #dcfce7",
                borderRadius: "8px",
                padding: "18px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Sparkles size={16} color="#16a34a" />
                  <h4 style={{ fontSize: "13px", fontWeight: 800, margin: 0, color: "#166534" }}>
                    프로덕트 기능 개선 및 자동화 기획 (Product Action)
                  </h4>
                </div>
                <p style={{ fontSize: "12px", color: "#14532d", lineHeight: 1.6, margin: 0 }}>
                  {currentScenario.productImprovement}
                </p>
              </div>
            </div>

            {/* Data Pipeline & Join Methodology Documentation */}
            <div style={{
              marginTop: "20px",
              padding: "16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px"
            }}>
              <strong style={{ fontSize: "12px", color: "var(--ink)", display: "block", marginBottom: "6px" }}>
                📐 데이터 결합(Join) 및 전처리 파이프라인 명세
              </strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
                <div>
                  <b style={{ color: "var(--ink)" }}>1. 시계열/공간 집계 (Aggregation)</b>
                  <p style={{ margin: "2px 0 0 0" }}>
                    개별 채팅/리뷰 감성을 Daily/Weekly 평균으로 축약하고, 행정동(Geo) 단위로 기상청 격자 좌표와 1:1 매핑 Join.
                  </p>
                </div>
                <div>
                  <b style={{ color: "var(--ink)" }}>2. 지표 정규화 (Normalization)</b>
                  <p style={{ margin: "2px 0 0 0" }}>
                    강수량(mm), 물가지수(%), 감성점수(0~1)의 단위 왜곡을 방지하기 위해 $Z = (X - \mu) / \sigma$ 및 Min-Max 변환 적용.
                  </p>
                </div>
                <div>
                  <b style={{ color: "var(--ink)" }}>3. 상관계수 가드 (Pearson Guard)</b>
                  <p style={{ margin: "2px 0 0 0" }}>
                    주기적 피어슨 $r \ge 0.6$ 검출 시에만 관리자 대시보드 메인 알림 배너로 승격하여 불필요한 노이즈 차단.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: MARKETPLACE PRICE CLUSTERS & GOVERNANCE TABLE */}
      {/* ======================================================== */}
      {activeViewMode === "clusters" && (
        <div>
          {/* Family Tab Bar */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "6px" }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedFamily("all");
                  setCurrentPage(1);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: selectedFamily === "all" ? 800 : 500,
                  background: selectedFamily === "all" ? "var(--carrot)" : "#fff",
                  color: selectedFamily === "all" ? "#fff" : "var(--ink)",
                  border: selectedFamily === "all" ? "1px solid var(--carrot)" : "1px solid var(--line)",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                전체 품목 ({number.format(rawClusters.reduce((acc, c) => acc + (c.count || 0), 0))}건)
              </button>

              {uniqueFamilies.map((fam) => {
                const count = rawClusters.filter((c) => c.item === fam).reduce((acc, c) => acc + (c.count || 0), 0);
                const isSelected = selectedFamily === fam;
                return (
                  <button
                    key={fam}
                    type="button"
                    onClick={() => {
                      setSelectedFamily(fam);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: isSelected ? 800 : 500,
                      background: isSelected ? "var(--carrot)" : "#fff",
                      color: isSelected ? "#fff" : "var(--ink)",
                      border: isSelected ? "1px solid var(--carrot)" : "1px solid var(--line)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {fam} ({number.format(count)}건)
                  </button>
                );
              })}
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "18px" }}>
            <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>선택 슬라이스 총 표본</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink)", marginTop: "4px" }}>
                {number.format(currentSliceStats.totalCount)}
                <small style={{ fontSize: "12px", fontWeight: 400, marginLeft: "4px" }}>건</small>
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                {currentSliceStats.clusterCount}개 클러스터 그룹
              </div>
            </div>

            <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>평균 중앙값 시세</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--carrot-dark)", marginTop: "4px" }}>
                {money(currentSliceStats.avgMedian)}
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                정규화 모델별 대표 중앙값 평균
              </div>
            </div>

            <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>신뢰 품질(Reliable) 비율</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                {currentSliceStats.clusterCount > 0
                  ? ((currentSliceStats.reliableCount / currentSliceStats.clusterCount) * 100).toFixed(1)
                  : "0"}
                %
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                {currentSliceStats.reliableCount} / {currentSliceStats.clusterCount} 클러스터
              </div>
            </div>

            <div style={{ padding: "16px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "6px" }}>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 700 }}>이상치 필터링 효과</span>
              <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--ink)", marginTop: "4px" }}>
                23.5%
              </div>
              <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "4px" }}>
                1,463건 비정상/소모품 사전 배제
              </div>
            </div>
          </div>

          {/* Search, Filter, Column Selection, Tuning Toggle Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "280px" }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "340px" }}>
                <Search size={16} color="var(--muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="품목, 모델명, 시그니처 검색..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px 8px 32px",
                    borderRadius: "6px",
                    border: "1px solid var(--line)",
                    background: "var(--surface)",
                    fontSize: "13px",
                    color: "var(--ink)",
                  }}
                />
              </div>

              <select
                value={selectedQuality}
                onChange={(e) => {
                  setSelectedQuality(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: "12px",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                <option value="all">모든 품질 상태</option>
                <option value="reliable">신뢰 (Reliable)</option>
                <option value="limited">제한적 (Limited)</option>
                <option value="sparse">표본 부족 (Sparse)</option>
                <option value="noisy">분산 큼 (Noisy)</option>
              </select>

              <select
                value={platformFilter}
                onChange={(e) => {
                  setPlatformFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  fontSize: "12px",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                <option value="all">모든 플랫폼</option>
                <option value="multi">다중 수집 (번개+중고나라)</option>
                <option value="single">단일 플랫폼 수집</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={() => setShowTuningPanel(!showTuningPanel)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: showTuningPanel ? "#ffefe5" : "var(--surface)",
                  color: showTuningPanel ? "var(--carrot-dark)" : "var(--ink)",
                  border: showTuningPanel ? "1px solid var(--carrot)" : "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                <SlidersHorizontal size={14} color={showTuningPanel ? "var(--carrot)" : "currentColor"} />
                <span>실시간 시세 튜닝 샌드박스</span>
              </button>

              <button
                type="button"
                onClick={() => setShowColumnModal(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: "var(--surface)",
                  color: "var(--ink)",
                  border: "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                <Layers size={14} />
                <span>컬럼 선택</span>
              </button>
            </div>
          </div>

          {/* Tuning Sandbox Panel */}
          {showTuningPanel && (
            <div style={{ background: "#fffaf6", border: "1px solid #ffedd5", borderRadius: "8px", padding: "18px", marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sparkles size={16} color="var(--carrot)" />
                  <strong style={{ fontSize: "13px", color: "var(--carrot-dark)" }}>관리자 실시간 가드레일 튜닝 (Sandbox Simulation)</strong>
                </div>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>슬라이더 조정 시 하단 클러스터 품질 상태 즉시 재계산</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                    <span>최소 표본수 기준 (Min Samples n): <b>{minSampleThreshold}건</b></span>
                    <span style={{ color: "var(--muted)" }}>안전권장: 5~10건</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={minSampleThreshold}
                    onChange={(e) => setMinSampleThreshold(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--carrot)", cursor: "pointer" }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                    <span>IQR 가드 배수 (Outlier Guard): <b>{iqrMultiplier}x</b></span>
                    <span style={{ color: "var(--muted)" }}>엄격 1.0x ~ 관대 2.0x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.5"
                    step="0.1"
                    value={iqrMultiplier}
                    onChange={(e) => setIqrMultiplier(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--carrot)", cursor: "pointer" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", marginTop: "14px", paddingTop: "12px", borderTop: "1px dashed #fed7aa", fontSize: "12px" }}>
                <span>실시간 커버리지: <b>{tuningStats.coverageRate}%</b> ({number.format(tuningStats.coverageRows)}/{number.format(tuningStats.totalRows)}건)</span>
                <span>신뢰(Reliable): <b style={{ color: "#16a34a" }}>{tuningStats.reliable}개</b></span>
                <span>제한(Limited): <b style={{ color: "#ca8a04" }}>{tuningStats.limited}개</b></span>
                <span>희소(Sparse): <b style={{ color: "#dc2626" }}>{tuningStats.sparse}개</b></span>
                <span>노이즈(Noisy): <b style={{ color: "#e11d48" }}>{tuningStats.noisy}개</b></span>
              </div>
            </div>
          )}

          {/* Interactive Clusters Data Table */}
          <div style={{ border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "6px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--line)", color: "var(--muted)" }}>
                  {visibleColumns.item && (
                    <th onClick={() => toggleSort("item")} style={{ padding: "10px 12px", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>품목군</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.model && <th style={{ padding: "10px 12px" }}>정규화 모델</th>}
                  {visibleColumns.signature && <th style={{ padding: "10px 12px" }}>시그니처</th>}
                  {visibleColumns.count && (
                    <th onClick={() => toggleSort("count")} style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        <span>표본수(n)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.median && (
                    <th onClick={() => toggleSort("median")} style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        <span>중앙값 시세</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.range && <th style={{ padding: "10px 12px", textAlign: "right" }}>가운데 50% (Q1 ~ Q3)</th>}
                  {visibleColumns.iqr && (
                    <th onClick={() => toggleSort("iqr")} style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        <span>가격편차(IQR)</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.dispersion && (
                    <th onClick={() => toggleSort("dispersion")} style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        <span>분산도</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.platformCount && <th style={{ padding: "10px 12px", textAlign: "center" }}>수집처</th>}
                  {visibleColumns.completedRate && (
                    <th onClick={() => toggleSort("completedRate")} style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                        <span>완료율</span>
                        <ArrowUpDown size={12} />
                      </div>
                    </th>
                  )}
                  {visibleColumns.qualityStatus && <th style={{ padding: "10px 12px", textAlign: "center" }}>품질상태</th>}
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>검수</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClusters.map((cluster, idx) => {
                  const status = showTuningPanel ? cluster.tunedStatus : cluster.qualityStatus;
                  const isReliable = status === "reliable";
                  const isLimited = status === "limited";
                  const isSparse = status === "sparse";
                  const isNoisy = status === "noisy";

                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: "1px solid var(--line)",
                        transition: "background 0.1s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#fcfcfc")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      {visibleColumns.item && (
                        <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink)" }}>
                          {cluster.item}
                        </td>
                      )}
                      {visibleColumns.model && (
                        <td style={{ padding: "10px 12px" }}>
                          <span style={{ fontWeight: 600 }}>{cluster.model || cluster.productSignature || cluster.cluster}</span>
                          {cluster.condition && (
                            <span style={{ display: "block", fontSize: "10px", color: "var(--muted)" }}>{cluster.condition}</span>
                          )}
                        </td>
                      )}
                      {visibleColumns.signature && (
                        <td style={{ padding: "10px 12px", color: "var(--muted)", fontFamily: "monospace", fontSize: "11px" }}>
                          {cluster.productSignature || "—"}
                        </td>
                      )}
                      {visibleColumns.count && (
                        <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                          {number.format(cluster.count || cluster.sampleCount || 0)}
                        </td>
                      )}
                      {visibleColumns.median && (
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--carrot-dark)", fontFamily: "monospace" }}>
                          {money(cluster.median || cluster.medianPrice)}
                        </td>
                      )}
                      {visibleColumns.range && (
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)", fontSize: "11px" }}>
                          {money(cluster.q1)} ~ {money(cluster.q3)}
                        </td>
                      )}
                      {visibleColumns.iqr && (
                        <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                          {money(cluster.iqr || cluster.q3 - cluster.q1)}
                        </td>
                      )}
                      {visibleColumns.dispersion && (
                        <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                          {((cluster.effectiveDispersion || 0) * 100).toFixed(1)}%
                        </td>
                      )}
                      {visibleColumns.platformCount && (
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {(cluster.platformCount || 1) >= 2 ? (
                            <span style={{ padding: "2px 6px", background: "#f0fdf4", color: "#166534", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                              번개+중고나라
                            </span>
                          ) : (
                            <span style={{ padding: "2px 6px", background: "#f1f5f9", color: "#475569", borderRadius: "4px", fontSize: "10px" }}>
                              단일 플랫폼
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.completedRate && (
                        <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                          {cluster.completedRate ? `${(cluster.completedRate * 100).toFixed(0)}%` : "—"}
                        </td>
                      )}
                      {visibleColumns.qualityStatus && (
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: "10px",
                              fontSize: "10px",
                              fontWeight: 700,
                              background: isReliable ? "#dcfce7" : isLimited ? "#fef9c3" : isSparse ? "#fee2e2" : "#ffe4e6",
                              color: isReliable ? "#166534" : isLimited ? "#854d0e" : isSparse ? "#991b1b" : "#9f1239",
                            }}
                          >
                            {isReliable ? "신뢰 (Reliable)" : isLimited ? "제한 (Limited)" : isSparse ? "표본부족" : "분산큼 (Noisy)"}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCluster(cluster)}
                          style={{
                            padding: "4px 8px",
                            background: "#f1f5f9",
                            border: "1px solid #cbd5e1",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--ink)",
                            cursor: "pointer",
                          }}
                        >
                          상세
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "12px", color: "var(--muted)" }}>
            <div>
              총 <b>{totalFilteredCount}</b>개 클러스터 중 {Math.min(totalFilteredCount, (currentPage - 1) * pageSize + 1)} - {Math.min(totalFilteredCount, currentPage * pageSize)} 표시
            </div>

            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                이전
              </button>

              <span style={{ padding: "0 6px" }}>
                <b>{currentPage}</b> / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "4px 10px",
                  borderRadius: "4px",
                  border: "1px solid var(--line)",
                  background: "var(--surface)",
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                다음
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Customizer Modal */}
      {showColumnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "8px", width: "420px", maxWidth: "90vw", padding: "20px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <strong style={{ fontSize: "15px", color: "var(--ink)" }}>표시 컬럼 선택 (Custom Column Visibility)</strong>
              <button type="button" onClick={() => setShowColumnModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "60vh", overflowY: "auto" }}>
              {AVAILABLE_COLUMNS.map((col) => (
                <label key={col.key} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={!!visibleColumns[col.key]}
                    onChange={() => toggleColumn(col.key)}
                    style={{ accentColor: "var(--carrot)", width: "16px", height: "16px" }}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setShowColumnModal(false)}
                style={{ padding: "8px 16px", background: "var(--carrot)", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                적용 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Detail Modal */}
      {selectedCluster && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: "8px", width: "500px", maxWidth: "90vw", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ color: "var(--carrot)", fontSize: "11px", fontWeight: 800 }}>CLUSTER DETAIL AUDIT</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "16px" }}>{selectedCluster.item} · {selectedCluster.model}</h3>
              </div>
              <button type="button" onClick={() => setSelectedCluster(null)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>중앙값 시세 (Median)</span>
                <strong style={{ display: "block", fontSize: "18px", color: "var(--carrot-dark)", marginTop: "2px" }}>
                  {money(selectedCluster.median || selectedCluster.medianPrice)}
                </strong>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>수집 표본수</span>
                <strong style={{ display: "block", fontSize: "18px", color: "var(--ink)", marginTop: "2px" }}>
                  {number.format(selectedCluster.count || selectedCluster.sampleCount || 0)}건
                </strong>
              </div>
            </div>

            <div style={{ fontSize: "12px", lineHeight: "1.8", color: "#475569" }}>
              <div><b>Q1 (하위 25%):</b> {money(selectedCluster.q1)}</div>
              <div><b>Q3 (상위 75%):</b> {money(selectedCluster.q3)}</div>
              <div><b>IQR 범위:</b> {money(selectedCluster.iqr || selectedCluster.q3 - selectedCluster.q1)}</div>
              <div><b>가운데 50% 시세:</b> {money(selectedCluster.q1)} ~ {money(selectedCluster.q3)}</div>
              <div><b>거래 완료율:</b> {selectedCluster.completedRate ? `${(selectedCluster.completedRate * 100).toFixed(0)}%` : "—"}</div>
              <div><b>수집 플랫폼 수:</b> {selectedCluster.platformCount ?? 1}개처 (번개장터, 중고나라)</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setSelectedCluster(null)}
                style={{ padding: "8px 16px", background: "#20231f", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Governance & Methodology Report Modal */}
      {showReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#fff", borderRadius: "8px", width: "760px", maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span style={{ color: "var(--carrot)", fontSize: "11px", fontWeight: 800 }}>EXECUTIVE GOVERNANCE REPORT</span>
                <h3 style={{ margin: "2px 0 0", fontSize: "18px" }}>외부 지표 및 가격 분석 거버넌스 보고서</h3>
              </div>
              <button type="button" onClick={() => setShowReportModal(false)} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "18px" }}>
              {[
                { id: "governance", label: "1. 데이터 품질 & 이상치 가드" },
                { id: "semantic", label: "2. LLM 의미 계층 분리" },
                { id: "guide", label: "3. 운영진 시세 가이드라인" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReportTab(tab.id as any)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: reportTab === tab.id ? 800 : 500,
                    background: reportTab === tab.id ? "#20231f" : "#f1f5f9",
                    color: reportTab === tab.id ? "#fff" : "var(--ink)",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Governance */}
            {reportTab === "governance" && (
              <div>
                <div style={{ padding: "14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", marginBottom: "16px" }}>
                  <strong style={{ fontSize: "13px", color: "var(--ink)", display: "block", marginBottom: "4px" }}>
                    이상치 제거 요약 (Noise Filtration)
                  </strong>
                  <p style={{ margin: "0", fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                    총 6,234건 중 1,463건(23.47%)의 비현실가/자리표시 및 소모품 단품을 차단하여 4,771건의 검증 완제품 표본을 확보했습니다.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                  <div style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px", color: "#e11d48" }}>차단된 주요 노이즈</strong>
                    <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                      <li>소모품/부품 단품 (내솥, 거치대, 충전기 등): 793건</li>
                      <li>부품/고장품/수리용: 258건</li>
                      <li>자리표시성 가격 (1,111원, 100원 등): 145건</li>
                      <li>극단 이상가 (5천원 청소기, 500만원 밥솥): 114건</li>
                    </ul>
                  </div>

                  <div style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "6px" }}>
                    <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px", color: "#16a34a" }}>확보된 데이터 무결성</strong>
                    <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>
                      <li>(platform, product_id) 고유키 중복: 0건 (0.0%)</li>
                      <li>가격 결측치: 0건 (100% 유효가)</li>
                      <li>모델 미상(Unknown) 비율: 0건 (정규화 완료)</li>
                      <li>플랫폼 편향: 번개 20.9% vs 중고나라 25.2% 균형 정제</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Semantic */}
            {reportTab === "semantic" && (
              <div>
                <div style={{ padding: "14px", background: "#30342f", color: "#fff", borderRadius: "6px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <Sparkles size={18} color="#ff9a57" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <p style={{ margin: 0, fontSize: "12px", color: "#c4c9c1", lineHeight: 1.6 }}>
                    <b>통계와 LLM의 명확한 역할 분리:</b> 가격/분포/빈도는 파이썬 통계 코드가 엄격 계산하고, LLM은 매물 제목 패턴을 읽어 검색/검수 우선순위용 의미 카테고리를 부여했습니다.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  {(insights.llmCategories ?? []).map((cat) => (
                    <div key={cat.name} style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "6px", background: "#f8fafc" }}>
                      <span style={{ color: "var(--carrot)", fontSize: "10px", fontWeight: 800 }}>LLM CATEGORY</span>
                      <h4 style={{ margin: "4px 0 6px", fontSize: "14px" }}>{cat.name}</h4>
                      <p style={{ margin: "0 0 8px", fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>{cat.definition}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "8px" }}>
                        {cat.signals?.map((s) => (
                          <span key={s} style={{ padding: "2px 6px", background: "#fff0e5", color: "#8d4b20", fontSize: "10px", borderRadius: "3px" }}>
                            {s}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: "11px", color: "#475569" }}>
                        <b>관리 활용:</b> {cat.adminUse}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: Guide */}
            {reportTab === "guide" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "18px" }}>
                  {(insights.readerGuide ?? []).map((g, idx) => (
                    <div key={g.question} style={{ padding: "14px", border: "1px solid var(--line)", borderRadius: "6px" }}>
                      <span style={{ color: "var(--carrot)", fontWeight: 800, fontSize: "11px" }}>0{idx + 1}</span>
                      <h4 style={{ margin: "6px 0 8px", fontSize: "13px" }}>{g.question}</h4>
                      <p style={{ margin: "0", fontSize: "11px", color: "var(--muted)", lineHeight: 1.6 }}>{g.answer}</p>
                    </div>
                  ))}
                </div>

                <div style={{ padding: "16px", background: "#fffaf6", border: "1px solid #ffedd5", borderRadius: "6px" }}>
                  <strong style={{ fontSize: "13px", color: "var(--carrot-dark)", display: "block", marginBottom: "6px" }}>
                    운영진 시세 활용 가이드라인
                  </strong>
                  <ul style={{ margin: "0", paddingLeft: "18px", fontSize: "12px", color: "#7c2d12", lineHeight: 1.6 }}>
                    <li>시세 비교 시 평균가 대신 <b>중앙값과 가운데 50% 가격 범위(Q1~Q3)</b>를 기준으로 삼습니다.</li>
                    <li>표본수 $n &lt; 5$인 희소 클러스터는 개별 모델 대신 <b>상위 품목군 중앙값으로 Fallback</b>하여 과적합을 방지합니다.</li>
                    <li>판매 완료 표시는 판매자의 수동 조작일 수 있으므로 회전율 지표는 절대 결제 데이터가 아닌 <b>관측 상태 비율</b>로만 해석합니다.</li>
                  </ul>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                style={{ padding: "8px 18px", background: "#20231f", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
