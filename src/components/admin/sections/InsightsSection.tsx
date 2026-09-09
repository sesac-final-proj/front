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

  // Detail Modal & Report Modal State
  const [selectedCluster, setSelectedCluster] = useState<AdminProductCluster | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState<"governance" | "semantic" | "guide">("governance");

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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "reliable":
        return (
          <span style={{ color: "#16a34a", background: "#f0fdf4", padding: "2px 8px", fontSize: "11px", fontWeight: 700, borderRadius: "4px", border: "1px solid #bbf7d0" }}>
            신뢰 (n≥10)
          </span>
        );
      case "limited":
        return (
          <span style={{ color: "#ca8a04", background: "#fefce8", padding: "2px 8px", fontSize: "11px", fontWeight: 700, borderRadius: "4px", border: "1px solid #fef08a" }}>
            제한 (5≤n&lt;10)
          </span>
        );
      case "noisy":
        return (
          <span style={{ color: "#ea580c", background: "#fff7ed", padding: "2px 8px", fontSize: "11px", fontWeight: 700, borderRadius: "4px", border: "1px solid #fed7aa" }}>
            분산주의
          </span>
        );
      default:
        return (
          <span style={{ color: "#64748b", background: "#f1f5f9", padding: "2px 8px", fontSize: "11px", fontWeight: 700, borderRadius: "4px", border: "1px solid #e2e8f0" }}>
            희소 (n&lt;5)
          </span>
        );
    }
  };

  return (
    <section id="external-interpretation" className={styles.section}>
      {/* Header with Quick Action Buttons */}
      <div className={styles.sectionHead} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <span>EXT·01</span>
          <div>
            <p className={styles.eyebrow}>EXTERNAL MARKET INTELLIGENCE</p>
            <h2 style={{ fontSize: "22px", margin: "4px 0" }}>타 플랫폼 비교 시세 & 제품 클러스터 관리</h2>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowTuningPanel(!showTuningPanel)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: showTuningPanel ? "var(--carrot-dark)" : "#20231f",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={14} />
            {showTuningPanel ? "시세 튜닝 닫기" : "실시간 시세 튜닝 샌드박스"}
          </button>
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "var(--surface)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <FileText size={14} color="var(--carrot)" />
            종합 거버넌스 보고서 요약
          </button>
        </div>
      </div>

      {/* Interactive Product Family Tab Bar (품목 선택 바) */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", margin: "16px 0 12px", scrollbarWidth: "thin" }}>
        <button
          type="button"
          onClick={() => {
            setSelectedFamily("all");
            setCurrentPage(1);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            border: "1px solid",
            borderColor: selectedFamily === "all" ? "var(--carrot)" : "var(--line)",
            background: selectedFamily === "all" ? "var(--carrot)" : "var(--surface)",
            color: selectedFamily === "all" ? "#fff" : "var(--ink)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            boxShadow: selectedFamily === "all" ? "0 2px 4px rgba(255, 111, 15, 0.2)" : "none",
            transition: "all 0.15s",
          }}
        >
          <span>전체 품목 보기</span>
          <span
            style={{
              fontSize: "11px",
              padding: "2px 7px",
              borderRadius: "10px",
              background: selectedFamily === "all" ? "rgba(255,255,255,0.3)" : "#f1f5f9",
              color: selectedFamily === "all" ? "#fff" : "var(--muted)",
              fontWeight: 800,
            }}
          >
            {number.format(rawClusters.reduce((acc, c) => acc + (c.count || 0), 0))}건
          </span>
        </button>

        {uniqueFamilies.map((family) => {
          const famCount = rawClusters.filter((c) => c.item === family).reduce((acc, c) => acc + (c.count || 0), 0);
          const isSelected = selectedFamily === family;

          return (
            <button
              key={family}
              type="button"
              onClick={() => {
                setSelectedFamily(family);
                setCurrentPage(1);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 700,
                border: "1px solid",
                borderColor: isSelected ? "var(--carrot)" : "var(--line)",
                background: isSelected ? "var(--carrot)" : "var(--surface)",
                color: isSelected ? "#fff" : "var(--ink)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: isSelected ? "0 2px 4px rgba(255, 111, 15, 0.2)" : "none",
                transition: "all 0.15s",
              }}
            >
              <span>{family}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 7px",
                  borderRadius: "10px",
                  background: isSelected ? "rgba(255,255,255,0.3)" : "#f1f5f9",
                  color: isSelected ? "#fff" : "var(--muted)",
                  fontWeight: 800,
                }}
              >
                {number.format(famCount)}건
              </span>
            </button>
          );
        })}
      </div>

      {/* KPI Highlight Strip for Selected Product Family */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "16px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "14px 18px", borderRadius: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>
            {selectedFamily === "all" ? "전체 수집 표본수" : `${selectedFamily} 표본수`}
          </span>
          <strong style={{ display: "block", fontSize: "18px", marginTop: "4px", color: "var(--ink)" }}>
            {number.format(currentSliceStats.totalCount)}건
          </strong>
          <small style={{ color: "var(--muted)", fontSize: "11px" }}>번개장터 + 중고나라 실거래</small>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "14px 18px", borderRadius: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>시그니처 클러스터</span>
          <strong style={{ display: "block", fontSize: "18px", marginTop: "4px", color: "var(--ink)" }}>
            {currentSliceStats.clusterCount}개 모델 그룹
          </strong>
          <small style={{ color: "#16a34a", fontSize: "11px", fontWeight: 700 }}>
            신뢰 클러스터 {currentSliceStats.reliableCount}개
          </small>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "14px 18px", borderRadius: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>품목 대표 평균 중앙값</span>
          <strong style={{ display: "block", fontSize: "18px", marginTop: "4px", color: "var(--carrot-dark)" }}>
            {money(Math.round(currentSliceStats.avgMedian))}
          </strong>
          <small style={{ color: "var(--muted)", fontSize: "11px" }}>이상치 제거 후 실거래 기준</small>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--line)", padding: "14px 18px", borderRadius: "6px" }}>
          <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 600 }}>이상치/소모품 필터링</span>
          <strong style={{ display: "block", fontSize: "18px", marginTop: "4px", color: "#e11d48" }}>
            {dataQuality ? `${dataQuality.removedRate}%` : "23.5%"}
          </strong>
          <small style={{ color: "var(--muted)", fontSize: "11px" }}>
            {dataQuality ? `${number.format(dataQuality.removedRows)}건 제외 완료` : "1,463건 차단"}
          </small>
        </div>
      </div>

      {/* Interactive Tuning Sandbox Panel (Expandable) */}
      {showTuningPanel && (
        <div style={{ background: "#1e293b", color: "#f8fafc", padding: "20px", borderRadius: "8px", marginBottom: "18px", border: "1px solid #334155" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #334155", paddingBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <SlidersHorizontal size={18} color="#38bdf8" />
              <strong style={{ fontSize: "15px" }}>실시간 시세 신뢰도 & 이상치 가드 튜닝 시뮬레이터</strong>
            </div>
            <button
              type="button"
              onClick={() => {
                setMinSampleThreshold(5);
                setIqrMultiplier(1.5);
              }}
              style={{ background: "#334155", color: "#e2e8f0", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "11px", cursor: "pointer" }}
            >
              기본값 복원
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {/* Slider 1: Min Sample Threshold */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span>최소 신뢰 표본수 (Min Samples Cutoff):</span>
                <strong style={{ color: "#38bdf8", fontSize: "13px" }}>
                  n ≥ {minSampleThreshold * 2} (제한: n ≥ {minSampleThreshold})
                </strong>
              </div>
              <input
                type="range"
                min={2}
                max={15}
                step={1}
                value={minSampleThreshold}
                onChange={(e) => setMinSampleThreshold(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#38bdf8" }}
              />
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
                설정한 기준 미만의 클러스터는 당근 시세 산정 시 상위 품목군 중앙값으로 자동 Fallback 처리됩니다.
              </p>
            </div>

            {/* Slider 2: IQR Dispersion Sensitivity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span>이상치 판정 민감도 (IQR Outlier Guard):</span>
                <strong style={{ color: "#fb923c", fontSize: "13px" }}>
                  {iqrMultiplier.toFixed(1)}x IQR (분산 컷: {(0.5 * (iqrMultiplier / 1.5)).toFixed(2)})
                </strong>
              </div>
              <input
                type="range"
                min={1.0}
                max={2.5}
                step={0.1}
                value={iqrMultiplier}
                onChange={(e) => setIqrMultiplier(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#fb923c" }}
              />
              <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>
                분산도가 컷오프를 초과하는 클러스터는 '분산주의'로 분류되어 단독 시세 가이드를 제한합니다.
              </p>
            </div>
          </div>

          {/* Tuning Live Simulation Output */}
          <div style={{ marginTop: "16px", padding: "12px 16px", background: "#0f172a", borderRadius: "6px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>튜닝 시뮬레이션 결과:</span>
            <span style={{ fontSize: "12px" }}>
              신뢰 클러스터: <b style={{ color: "#4ade80" }}>{tuningStats.reliable}개</b>
            </span>
            <span style={{ fontSize: "12px" }}>
              제한 클러스터: <b style={{ color: "#facc15" }}>{tuningStats.limited}개</b>
            </span>
            <span style={{ fontSize: "12px" }}>
              분산주의: <b style={{ color: "#fb923c" }}>{tuningStats.noisy}개</b>
            </span>
            <span style={{ fontSize: "12px" }}>
              희소(Fallback 대상): <b style={{ color: "#94a3b8" }}>{tuningStats.sparse}개</b>
            </span>
            <span style={{ fontSize: "12px", marginLeft: "auto", color: "#38bdf8", fontWeight: 700 }}>
              실질 시세 보증 커버리지: {tuningStats.coverageRate}% ({number.format(tuningStats.coverageRows)} / {number.format(tuningStats.totalRows)}건)
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Table & Filter Card */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px", padding: "20px" }}>
        {/* Table Controls Strip */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
          {/* Search Input */}
          <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", border: "1px solid var(--line)", borderRadius: "6px", padding: "6px 12px", width: "100%", maxWidth: "320px" }}>
            <Search size={16} color="var(--muted)" style={{ marginRight: "8px" }} />
            <input
              type="text"
              placeholder="모델코드(CRP, SV), 규격, 상태 검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              style={{ border: "none", background: "transparent", outline: "none", fontSize: "12px", width: "100%" }}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: "0" }}>
                <X size={14} color="var(--muted)" />
              </button>
            )}
          </div>

          {/* Filters & Column Customizer */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Quality Tier Dropdown */}
            <select
              value={selectedQuality}
              onChange={(e) => {
                setSelectedQuality(e.target.value);
                setCurrentPage(1);
              }}
              style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <option value="all">전체 품질 등급</option>
              <option value="reliable">신뢰 표본 (n≥10)</option>
              <option value="limited">제한 표본 (5≤n&lt;10)</option>
              <option value="noisy">분산주의 (IQR&gt;50%)</option>
              <option value="sparse">희소 표본 (n&lt;5)</option>
            </select>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              style={{ padding: "6px 10px", fontSize: "12px", borderRadius: "6px", border: "1px solid var(--line)", background: "var(--surface)" }}
            >
              <option value="all">모든 수집 플랫폼</option>
              <option value="multi">2개 플랫폼 교차 (신뢰)</option>
              <option value="single">단일 플랫폼 (1개)</option>
            </select>

            {/* Column Visibility Button */}
            <button
              type="button"
              onClick={() => setShowColumnModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid var(--line)",
                background: "var(--surface)",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <Layers size={14} color="var(--muted)" />
              컬럼 선택
            </button>
          </div>
        </div>

        {/* Active Filter Count & Clear */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", fontSize: "12px", color: "var(--muted)" }}>
          <div>
            검색 결과: <b style={{ color: "var(--ink)" }}>{number.format(totalFilteredCount)}개</b> 클러스터 (총 {number.format(rawClusters.length)}개 중)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span>페이지당 표시:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              style={{ padding: "2px 6px", fontSize: "12px", border: "1px solid var(--line)", borderRadius: "4px" }}
            >
              <option value={10}>10건</option>
              <option value={20}>20건</option>
              <option value={50}>50건</option>
              <option value={100}>100건</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: "6px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--line)", color: "#475569" }}>
                {visibleColumns.item && (
                  <th style={{ padding: "10px 12px", cursor: "pointer" }} onClick={() => toggleSort("item")}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      품목군
                      <ArrowUpDown size={12} color="var(--muted)" />
                    </div>
                  </th>
                )}
                {visibleColumns.model && <th style={{ padding: "10px 12px" }}>정규화 모델</th>}
                {visibleColumns.signature && <th style={{ padding: "10px 12px" }}>제품 시그니처</th>}
                {visibleColumns.count && (
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("count")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      표본수(n)
                      <ArrowUpDown size={12} color="var(--muted)" />
                    </div>
                  </th>
                )}
                {visibleColumns.median && (
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("median")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      중앙값 시세
                      <ArrowUpDown size={12} color="var(--muted)" />
                    </div>
                  </th>
                )}
                {visibleColumns.range && <th style={{ padding: "10px 12px", textAlign: "center" }}>Q1 ~ Q3 (50% 범위)</th>}
                {visibleColumns.iqr && (
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("iqr")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      IQR 편차
                      <ArrowUpDown size={12} color="var(--muted)" />
                    </div>
                  </th>
                )}
                {visibleColumns.dispersion && (
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("dispersion")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      분산도
                      <ArrowUpDown size={12} color="var(--muted)" />
                    </div>
                  </th>
                )}
                {visibleColumns.platformCount && <th style={{ padding: "10px 12px", textAlign: "center" }}>플랫폼</th>}
                {visibleColumns.completedRate && (
                  <th style={{ padding: "10px 12px", textAlign: "right", cursor: "pointer" }} onClick={() => toggleSort("completedRate")}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                      완료율
                      <ArrowUpDown size={12} color="var(--muted)" />
                    </div>
                  </th>
                )}
                {visibleColumns.qualityStatus && <th style={{ padding: "10px 12px", textAlign: "center" }}>품질 상태</th>}
                <th style={{ padding: "10px 12px", textAlign: "center" }}>검수</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClusters.map((cluster) => {
                const medianVal = cluster.median || cluster.medianPrice || 0;
                const q1Val = cluster.q1 || 0;
                const q3Val = cluster.q3 || 0;
                const iqrVal = cluster.iqr || q3Val - q1Val;
                const statusToDisplay = showTuningPanel ? cluster.tunedStatus : cluster.qualityStatus;

                return (
                  <tr
                    key={cluster.cluster}
                    style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s" }}
                    onClick={() => setSelectedCluster(cluster)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#fffaf6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {visibleColumns.item && (
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink)" }}>{cluster.item}</td>
                    )}
                    {visibleColumns.model && (
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: "12px", color: "#2563eb", fontWeight: 600 }}>
                        {cluster.normalizedModel || cluster.model}
                      </td>
                    )}
                    {visibleColumns.signature && (
                      <td style={{ padding: "10px 12px", color: "var(--muted)", fontSize: "11px", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cluster.productSignature || cluster.cluster}
                      </td>
                    )}
                    {visibleColumns.count && (
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>
                        {number.format(cluster.count || cluster.sampleCount || 0)}건
                      </td>
                    )}
                    {visibleColumns.median && (
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--carrot-dark)" }}>
                        {money(medianVal)}
                      </td>
                    )}
                    {visibleColumns.range && (
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b", fontSize: "11px" }}>
                        {money(q1Val)} ~ {money(q3Val)}
                      </td>
                    )}
                    {visibleColumns.iqr && (
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>{money(iqrVal)}</td>
                    )}
                    {visibleColumns.dispersion && (
                      <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>
                        {cluster.effectiveDispersion ? cluster.effectiveDispersion.toFixed(2) : "0.00"}
                      </td>
                    )}
                    {visibleColumns.platformCount && (
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ padding: "2px 6px", background: (cluster.platformCount || 1) >= 2 ? "#e0f2fe" : "#f1f5f9", color: (cluster.platformCount || 1) >= 2 ? "#0369a1" : "#64748b", borderRadius: "3px", fontSize: "10px", fontWeight: 700 }}>
                          {(cluster.platformCount || 1) >= 2 ? "양대 플랫폼" : "1개 플랫폼"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.completedRate && (
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "var(--muted)" }}>
                        {cluster.completedRate}%
                      </td>
                    )}
                    {visibleColumns.qualityStatus && (
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{getStatusBadge(statusToDisplay)}</td>
                    )}
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCluster(cluster);
                        }}
                        style={{ padding: "3px 8px", fontSize: "11px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "4px", cursor: "pointer", color: "var(--carrot-dark)", fontWeight: 700 }}
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {currentPage} / {totalPages} 페이지 (총 {number.format(totalFilteredCount)}건)
            </span>
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(1)}
                style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "4px", cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
              >
                처음
              </button>
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "4px", cursor: currentPage <= 1 ? "not-allowed" : "pointer" }}
              >
                이전
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "11px",
                      border: "1px solid var(--line)",
                      borderRadius: "4px",
                      background: currentPage === pageNum ? "var(--carrot)" : "var(--surface)",
                      color: currentPage === pageNum ? "#fff" : "var(--ink)",
                      fontWeight: currentPage === pageNum ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "4px", cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
              >
                다음
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(totalPages)}
                style={{ padding: "4px 8px", fontSize: "11px", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "4px", cursor: currentPage >= totalPages ? "not-allowed" : "pointer" }}
              >
                끝
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Column Customizer Modal */}
      {showColumnModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "8px", maxWidth: "420px", width: "100%", padding: "22px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <strong style={{ fontSize: "15px" }}>테이블 컬럼 표시 설정</strong>
              <button type="button" onClick={() => setShowColumnModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px" }}>
              대시보드 화면에 노출할 컬럼을 선택하세요.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
              {AVAILABLE_COLUMNS.map((col) => (
                <label
                  key={col.key}
                  style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", cursor: "pointer", padding: "6px 8px", borderRadius: "4px", background: "#f8fafc" }}
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns[col.key]}
                    onChange={() => toggleColumn(col.key)}
                    style={{ accentColor: "var(--carrot)" }}
                  />
                  <span>{col.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  const allVisible: Record<string, boolean> = {};
                  AVAILABLE_COLUMNS.forEach((c) => (allVisible[c.key] = true));
                  setVisibleColumns(allVisible as any);
                }}
                style={{ padding: "6px 12px", fontSize: "11px", border: "1px solid var(--line)", background: "var(--surface)", borderRadius: "4px", cursor: "pointer" }}
              >
                전체 선택
              </button>
              <button
                type="button"
                onClick={() => setShowColumnModal(false)}
                style={{ padding: "6px 14px", fontSize: "11px", background: "var(--carrot)", color: "#fff", border: "none", borderRadius: "4px", fontWeight: 700, cursor: "pointer" }}
              >
                적용 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Detail Modal (Drill-down Inspector) */}
      {selectedCluster && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "8px", maxWidth: "680px", width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "12px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "var(--carrot-dark)", fontWeight: 700 }}>CLUSTER DRILL-DOWN</span>
                <h3 style={{ fontSize: "18px", margin: "4px 0" }}>
                  {selectedCluster.item} · {selectedCluster.normalizedModel || selectedCluster.model}
                </h3>
                <small style={{ color: "var(--muted)", fontSize: "11px" }}>{selectedCluster.productSignature || selectedCluster.cluster}</small>
              </div>
              <button type="button" onClick={() => setSelectedCluster(null)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>표본 수</span>
                <strong style={{ display: "block", fontSize: "16px", marginTop: "4px" }}>{number.format(selectedCluster.count || 0)}건</strong>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>대표 중앙값 시세</span>
                <strong style={{ display: "block", fontSize: "16px", marginTop: "4px", color: "var(--carrot-dark)" }}>{money(selectedCluster.median)}</strong>
              </div>
              <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--muted)" }}>품질 등급</span>
                <div style={{ marginTop: "4px" }}>{getStatusBadge(selectedCluster.qualityStatus)}</div>
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>가격 통계 제원</strong>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", fontSize: "12px", background: "#f1f5f9", padding: "12px", borderRadius: "6px" }}>
                <div><span style={{ color: "#64748b" }}>1분위수 (Q1):</span><br /><b>{money(selectedCluster.q1)}</b></div>
                <div><span style={{ color: "#64748b" }}>3분위수 (Q3):</span><br /><b>{money(selectedCluster.q3)}</b></div>
                <div><span style={{ color: "#64748b" }}>편차 (IQR):</span><br /><b>{money(selectedCluster.iqr || selectedCluster.q3 - selectedCluster.q1)}</b></div>
                <div><span style={{ color: "#64748b" }}>거래 완료율:</span><br /><b>{selectedCluster.completedRate}%</b></div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
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

      {/* Comprehensive Report Modal (보고서 요약하기) */}
      {showReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "8px", maxWidth: "840px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "28px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--line)", paddingBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FileText size={20} color="var(--carrot)" />
                <h3 style={{ fontSize: "18px", margin: "0" }}>외부 마켓 분석 및 거버넌스 종합 보고서</h3>
              </div>
              <button type="button" onClick={() => setShowReportModal(false)} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div style={{ display: "flex", gap: "6px", borderBottom: "1px solid var(--line)", paddingBottom: "10px", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setReportTab("governance")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: reportTab === "governance" ? 700 : 500,
                  background: reportTab === "governance" ? "var(--carrot)" : "transparent",
                  color: reportTab === "governance" ? "#fff" : "var(--muted)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                1. 데이터 품질 거버넌스
              </button>
              <button
                type="button"
                onClick={() => setReportTab("semantic")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: reportTab === "semantic" ? 700 : 500,
                  background: reportTab === "semantic" ? "var(--carrot)" : "transparent",
                  color: reportTab === "semantic" ? "#fff" : "var(--muted)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                2. LLM 의미 분석 계층
              </button>
              <button
                type="button"
                onClick={() => setReportTab("guide")}
                style={{
                  padding: "6px 14px",
                  fontSize: "12px",
                  fontWeight: reportTab === "guide" ? 700 : 500,
                  background: reportTab === "guide" ? "var(--carrot)" : "transparent",
                  color: reportTab === "guide" ? "#fff" : "var(--muted)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                3. 시세 산정 원칙 및 가이드
              </button>
            </div>

            {/* Tab 1: Governance */}
            {reportTab === "governance" && (
              <div>
                <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "6px", marginBottom: "18px", border: "1px solid var(--line)" }}>
                  <h4 style={{ margin: "0 0 8px", fontSize: "14px", color: "var(--ink)" }}>전처리 정제 및 결측치 현황</h4>
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
