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
  Globe,
  ExternalLink,
  Sliders,
  CheckCircle2,
  ArrowUpRight,
  LineChart
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
// 구글 트렌드 (Google Trends 대한민국 관심도) & 외부 시장 매물 연동 지표
// ==========================================
interface GoogleTrendItem {
  item: string;
  category: string;
  googleQuery: string;
  trendScore: number; // 0~100 Google Search Interest Index
  trendChange: string;
  marketSamples: number;
  medianPrice: number;
  marketShare: number;
  trendSeries: {
    week: string;
    interest: number; // Google Trends Search Interest (0~100)
    inflow: number;   // External Market Listings Inflow
  }[];
}

const GOOGLE_TREND_INDICATORS: GoogleTrendItem[] = [
  {
    item: "쿠쿠 밥솥",
    category: "주방가전",
    googleQuery: "쿠쿠 밥솥",
    trendScore: 92,
    trendChange: "+14.2% (상승세)",
    marketSamples: 1600,
    medianPrice: 170000,
    marketShare: 33.5,
    trendSeries: [
      { week: "08.01~08.07", interest: 78, inflow: 280 },
      { week: "08.08~08.14", interest: 82, inflow: 310 },
      { week: "08.15~08.21", interest: 86, inflow: 340 },
      { week: "08.22~08.28", interest: 89, inflow: 390 },
      { week: "08.29~09.04", interest: 92, inflow: 420 },
      { week: "09.05~09.11", interest: 94, inflow: 460 },
    ]
  },
  {
    item: "다이슨 청소기",
    category: "생활가전",
    googleQuery: "다이슨 청소기",
    trendScore: 84,
    trendChange: "+8.5% (안정세)",
    marketSamples: 1180,
    medianPrice: 240000,
    marketShare: 24.7,
    trendSeries: [
      { week: "08.01~08.07", interest: 75, inflow: 220 },
      { week: "08.08~08.14", interest: 77, inflow: 240 },
      { week: "08.15~08.21", interest: 80, inflow: 260 },
      { week: "08.22~08.28", interest: 82, inflow: 290 },
      { week: "08.29~09.04", interest: 84, inflow: 310 },
      { week: "09.05~09.11", interest: 85, inflow: 330 },
    ]
  },
  {
    item: "메디큐브 부스터프로",
    category: "뷰티디바이스",
    googleQuery: "메디큐브 에이지알",
    trendScore: 88,
    trendChange: "+32.4% (급상승)",
    marketSamples: 1148,
    medianPrice: 195000,
    marketShare: 24.1,
    trendSeries: [
      { week: "08.01~08.07", interest: 52, inflow: 140 },
      { week: "08.08~08.14", interest: 64, inflow: 190 },
      { week: "08.15~08.21", interest: 78, inflow: 280 },
      { week: "08.22~08.28", interest: 85, inflow: 360 },
      { week: "08.29~09.04", interest: 88, inflow: 410 },
      { week: "09.05~09.11", interest: 91, inflow: 450 },
    ]
  },
  {
    item: "풀리오 마사지기",
    category: "헬스케어",
    googleQuery: "풀리오 마사지기",
    trendScore: 68,
    trendChange: "+5.1% (완만)",
    marketSamples: 454,
    medianPrice: 85000,
    marketShare: 9.5,
    trendSeries: [
      { week: "08.01~08.07", interest: 62, inflow: 80 },
      { week: "08.08~08.14", interest: 65, inflow: 95 },
      { week: "08.15~08.21", interest: 66, inflow: 105 },
      { week: "08.22~08.28", interest: 68, inflow: 115 },
      { week: "08.29~09.04", interest: 70, inflow: 130 },
      { week: "09.05~09.11", interest: 71, inflow: 140 },
    ]
  },
  {
    item: "미닉스 음식물처리기",
    category: "주방가전",
    googleQuery: "미닉스 더 플렌더",
    trendScore: 59,
    trendChange: "+12.0% (상승)",
    marketSamples: 350,
    medianPrice: 285000,
    marketShare: 7.3,
    trendSeries: [
      { week: "08.01~08.07", interest: 48, inflow: 50 },
      { week: "08.08~08.14", interest: 52, inflow: 65 },
      { week: "08.15~08.21", interest: 56, inflow: 80 },
      { week: "08.22~08.28", interest: 59, inflow: 95 },
      { week: "08.29~09.04", interest: 61, inflow: 110 },
      { week: "09.05~09.11", interest: 63, inflow: 125 },
    ]
  },
  {
    item: "브레짜 분유",
    category: "유아가전",
    googleQuery: "베이비브레짜",
    trendScore: 42,
    trendChange: "-2.1% (보합)",
    marketSamples: 39,
    medianPrice: 145000,
    marketShare: 0.8,
    trendSeries: [
      { week: "08.01~08.07", interest: 45, inflow: 8 },
      { week: "08.08~08.14", interest: 44, inflow: 10 },
      { week: "08.15~08.21", interest: 43, inflow: 9 },
      { week: "08.22~08.28", interest: 42, inflow: 11 },
      { week: "08.29~09.04", interest: 42, inflow: 12 },
      { week: "09.05~09.11", interest: 41, inflow: 10 },
    ]
  }
];

export default function InsightsSection({ insights }: { insights: AdminAudienceInsights | null }) {
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

  // Google Trends Panel Toggle
  const [showTrendsPanel, setShowTrendsPanel] = useState(true);
  const [selectedTrendItem, setSelectedTrendItem] = useState<string>("쿠쿠 밥솥");

  // Detail Modal & Report Modal State
  const [selectedCluster, setSelectedCluster] = useState<AdminProductCluster | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState<"governance" | "semantic" | "guide">("governance");

  if (!insights) return null;

  const rawClusters = insights.productClusters ?? [];

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

  // Active Google Trends Info
  const activeTrendData = useMemo(() => {
    return GOOGLE_TREND_INDICATORS.find(t => t.item === selectedTrendItem) || GOOGLE_TREND_INDICATORS[0];
  }, [selectedTrendItem]);

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
      {/* 1. Section Header */}
      <div className={styles.sectionHead}>
        <div>
          <span>EXT·01</span>
          <div>
            <p className={styles.eyebrow}>EXTERNAL MARKET INDICATORS & GOVERNANCE</p>
            <h2>외부 지표 인사이트 (Google Trends & 시세 거버넌스)</h2>
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
            <span>외부 지표 거버넌스 보고서</span>
          </button>
        </div>
      </div>

      {/* 2. Google Trends & External Market Signal Widget */}
      <div style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "20px 24px",
        marginBottom: "20px",
        color: "#f8fafc",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{
              background: "rgba(59, 130, 246, 0.2)",
              color: "#60a5fa",
              border: "1px solid #3b82f6",
              fontSize: "11px",
              fontWeight: 800,
              padding: "4px 8px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <Globe size={13} />
              GOOGLE TRENDS · KOREA SEARCH INDEX (KR)
            </span>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#fff" }}>
              구글 검색 트렌드 관심도 지수(0~100) × 외부 중고 매물 공급량(4,771건)
            </h3>
          </div>
          <button
            onClick={() => setShowTrendsPanel(!showTrendsPanel)}
            style={{
              background: "transparent",
              border: "1px solid #475569",
              color: "#cbd5e1",
              fontSize: "11px",
              padding: "4px 8px",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {showTrendsPanel ? "트렌드 위젯 접기 ▲" : "트렌드 위젯 펼치기 ▼"}
          </button>
        </div>

        {showTrendsPanel && (
          <div>
            {/* Trend Item Selector Buttons */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", marginBottom: "14px" }}>
              {GOOGLE_TREND_INDICATORS.map((t) => {
                const isSelected = selectedTrendItem === t.item;
                return (
                  <button
                    key={t.item}
                    onClick={() => {
                      setSelectedTrendItem(t.item);
                      setSelectedFamily(t.item);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: isSelected ? 800 : 500,
                      background: isSelected ? "#ff6e24" : "rgba(255,255,255,0.08)",
                      color: isSelected ? "#fff" : "#cbd5e1",
                      border: isSelected ? "1px solid #ff6e24" : "1px solid rgba(255,255,255,0.15)",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span>{t.item}</span>
                    <span style={{ fontSize: "10px", opacity: 0.85, background: "rgba(0,0,0,0.2)", padding: "1px 4px", borderRadius: "3px" }}>
                      관심도 {t.trendScore}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Trend Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>구글 검색 관심도 (0~100)</span>
                <div style={{ fontSize: "20px", fontWeight: 900, color: "#60a5fa", marginTop: "2px" }}>
                  {activeTrendData.trendScore} / 100
                  <small style={{ fontSize: "11px", color: "#34d399", marginLeft: "6px" }}>{activeTrendData.trendChange}</small>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>수집된 외부 실거래 표본수</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {number.format(activeTrendData.marketSamples)}건
                  <small style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px" }}>(시장 {activeTrendData.marketShare}%)</small>
                </div>
              </div>

              <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>외부 시장 중앙값 시세</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#ff8a48", marginTop: "2px" }}>
                  {money(activeTrendData.medianPrice)}
                </div>
              </div>
            </div>

            {/* Google Trends Weekly Search Interest vs Market Listings Chart */}
            <div style={{ background: "rgba(0,0,0,0.25)", padding: "14px", borderRadius: "6px", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#cbd5e1" }}>
                  주간 구글 검색 관심도 vs 타 플랫폼 매물 등록량 추이
                </span>
                <div style={{ display: "flex", gap: "12px", fontSize: "11px" }}>
                  <span style={{ color: "#60a5fa" }}>■ 구글 검색 관심도 (Index)</span>
                  <span style={{ color: "#ff8a48" }}>■ 외부 매물 등록건수 (건)</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", height: "120px", paddingTop: "10px", borderBottom: "1px solid #475569" }}>
                {activeTrendData.trendSeries.map((s, idx) => (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ display: "flex", gap: "3px", alignItems: "flex-end", height: "100%" }}>
                      {/* Interest Bar */}
                      <div
                        style={{
                          width: "14px",
                          height: `${s.interest}%`,
                          background: "#3b82f6",
                          borderRadius: "2px 2px 0 0"
                        }}
                        title={`구글 관심도: ${s.interest}pts`}
                      />
                      {/* Market Inflow Bar */}
                      <div
                        style={{
                          width: "14px",
                          height: `${Math.min(100, (s.inflow / 500) * 100)}%`,
                          background: "#ff6e24",
                          borderRadius: "2px 2px 0 0"
                        }}
                        title={`외부 매물 등록: ${s.inflow}건`}
                      />
                    </div>
                    <span style={{ fontSize: "10px", color: "#94a3b8", marginTop: "6px", whiteSpace: "nowrap" }}>
                      {s.week.split("~")[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Product Family Tab Bar */}
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
                  setSelectedTrendItem(fam);
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

      {/* 4. KPI Summary Cards */}
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

      {/* 5. Search, Filter, Column Selection, Tuning Toolbar */}
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

      {/* 6. Tuning Sandbox Panel */}
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

      {/* 7. Interactive Clusters Data Table */}
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

      {/* 8. Pagination Controls */}
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
