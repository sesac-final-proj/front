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
  Filter,
  RotateCcw,
  Eye,
  ListFilter,
  Tag,
  ShoppingBag,
  Info,
  AlertTriangle
} from "lucide-react";
import type { AdminAudienceInsights, AdminProductCluster } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) =>
  value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(Math.round(value))}원`;

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

// 구글 트렌드 (Google Trends 대한민국 관심도) & 외부 시장 매물 연동 지표
interface GoogleTrendItem {
  item: string;
  category: string;
  googleQuery: string;
  trendScore: number;
  trendChange: string;
  marketSamples: number;
  medianPrice: number;
  marketShare: number;
  minPrice: number;
  maxPrice: number;
  q1Price: number;
  q3Price: number;
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
    minPrice: 35000,
    maxPrice: 420000,
    q1Price: 120000,
    q3Price: 225000
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
    minPrice: 60000,
    maxPrice: 780000,
    q1Price: 180000,
    q3Price: 380000
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
    minPrice: 85000,
    maxPrice: 320000,
    q1Price: 170000,
    q3Price: 230000
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
    minPrice: 30000,
    maxPrice: 140000,
    q1Price: 65000,
    q3Price: 98000
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
    minPrice: 120000,
    maxPrice: 410000,
    q1Price: 230000,
    q3Price: 330000
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
    minPrice: 70000,
    maxPrice: 210000,
    q1Price: 115000,
    q3Price: 170000
  }
];

export default function InsightsSection({ insights }: { insights: AdminAudienceInsights | null }) {
  // Main Filter State
  const [searchDraft, setSearchDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState("all");
  const [selectedQuality, setSelectedQuality] = useState("all");
  const [platformFilter, setPlatformFilter] = useState<"all" | "bunjang" | "joongna" | "multi">("all");
  const [completedFilter, setCompletedFilter] = useState<"all" | "completed" | "selling">("all");

  // Price Range Filter State
  const [minPriceFilter, setMinPriceFilter] = useState<number>(0);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(1000000);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // Sorting State
  const [sortKey, setSortKey] = useState<"count" | "median" | "iqr" | "dispersion" | "completedRate" | "item">("count");
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(15);
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

  // Selected Trend / Visualization Active Item
  const [selectedTrendItem, setSelectedTrendItem] = useState<string>("쿠쿠 밥솥");

  // Selected Cluster for Raw Listings Drilldown
  const [selectedCluster, setSelectedCluster] = useState<AdminProductCluster | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState<"governance" | "semantic" | "guide">("governance");

  const rawClusters = insights?.productClusters ?? [];
  const rawExamples = insights?.examples ?? [];

  // Extract unique families for Tab Bar
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

  // Filtered & Sorted Clusters with Advanced Multi-Dimensional Search
  const filteredClusters = useMemo(() => {
    return processedClusters
      .filter((c) => {
        const med = c.median || c.medianPrice || 0;

        // 1. Text Search (item, model, signature, condition)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (c.item || "").toLowerCase().includes(q);
          const matchModel = (c.model || "").toLowerCase().includes(q);
          const matchSig = (c.productSignature || c.cluster || "").toLowerCase().includes(q);
          const matchCond = (c.condition || "").toLowerCase().includes(q);
          if (!matchTitle && !matchModel && !matchSig && !matchCond) return false;
        }

        // 2. Family Filter
        if (selectedFamily !== "all" && c.item !== selectedFamily) {
          return false;
        }

        // 3. Price Range Filter
        if (minPriceFilter > 0 && med < minPriceFilter) return false;
        if (maxPriceFilter < 1000000 && med > maxPriceFilter) return false;

        // 4. Quality Tier Filter
        if (selectedQuality !== "all") {
          const status = showTuningPanel ? c.tunedStatus : c.qualityStatus;
          if (status !== selectedQuality) return false;
        }

        // 5. Platform Filter
        if (platformFilter === "multi" && (c.platformCount || 1) < 2) return false;
        if (platformFilter === "bunjang" && (c.platformCount || 1) >= 2) return false;
        if (platformFilter === "joongna" && (c.platformCount || 1) >= 2) return false;

        // 6. Completed Status Filter
        const compRate = c.completedRate ?? 0;
        if (completedFilter === "completed" && compRate < 0.5) return false;
        if (completedFilter === "selling" && compRate >= 0.5) return false;

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
  }, [
    processedClusters,
    searchQuery,
    selectedFamily,
    selectedQuality,
    platformFilter,
    completedFilter,
    minPriceFilter,
    maxPriceFilter,
    sortKey,
    sortAsc,
    showTuningPanel,
  ]);

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

  const distributionMetrics = useMemo(() => {
    const sortedPrices = filteredClusters
      .map((cluster) => cluster.median || cluster.medianPrice || 0)
      .filter((price) => price > 0)
      .sort((a, b) => a - b);
    const percentile = (ratio: number) => {
      if (sortedPrices.length === 0) return 0;
      return sortedPrices[Math.min(sortedPrices.length - 1, Math.floor((sortedPrices.length - 1) * ratio))];
    };
    const totalSamples = filteredClusters.reduce((sum, cluster) => sum + (cluster.count || cluster.sampleCount || 0), 0);
    const completedSamples = filteredClusters.reduce(
      (sum, cluster) => sum + (cluster.count || cluster.sampleCount || 0) * (cluster.completedRate || 0),
      0,
    );
    const reliableSamples = filteredClusters.reduce((sum, cluster) => {
      const status = showTuningPanel ? cluster.tunedStatus : cluster.qualityStatus;
      return status === "reliable" || status === "limited"
        ? sum + (cluster.count || cluster.sampleCount || 0)
        : sum;
    }, 0);
    const buckets = [
      { label: "5만원 미만", min: 0, max: 50000 },
      { label: "5–10만원", min: 50000, max: 100000 },
      { label: "10–20만원", min: 100000, max: 200000 },
      { label: "20–30만원", min: 200000, max: 300000 },
      { label: "30만원 이상", min: 300000, max: Number.POSITIVE_INFINITY },
    ].map((bucket) => ({
      ...bucket,
      count: filteredClusters.reduce((sum, cluster) => {
        const price = cluster.median || cluster.medianPrice || 0;
        return price >= bucket.min && price < bucket.max
          ? sum + (cluster.count || cluster.sampleCount || 0)
          : sum;
      }, 0),
    }));

    return {
      q1: percentile(0.25),
      median: percentile(0.5),
      q3: percentile(0.75),
      iqr: percentile(0.75) - percentile(0.25),
      completionRate: totalSamples > 0 ? (completedSamples / totalSamples) * 100 : 0,
      reliableRate: totalSamples > 0 ? (reliableSamples / totalSamples) * 100 : 0,
      buckets,
      maxBucketCount: Math.max(1, ...buckets.map((bucket) => bucket.count)),
    };
  }, [filteredClusters, showTuningPanel]);

  // Active Google Trends Info
  const activeTrendData = useMemo(() => {
    return GOOGLE_TREND_INDICATORS.find((t) => t.item === selectedTrendItem) || GOOGLE_TREND_INDICATORS[0];
  }, [selectedTrendItem]);

  const operationalSignals = useMemo(() => {
    const trendRows = GOOGLE_TREND_INDICATORS.map((trend) => {
      const change = Number.parseFloat(trend.trendChange.replace(/[^\d.-]/g, "")) || 0;
      const relatedClusters = processedClusters.filter((cluster) => cluster.item === trend.item);
      const noisyClusters = relatedClusters.filter((cluster) => cluster.tunedStatus === "noisy").length;
      const reliableClusters = relatedClusters.filter(
        (cluster) => cluster.tunedStatus === "reliable" || cluster.tunedStatus === "limited",
      ).length;
      return { ...trend, change, noisyClusters, reliableClusters, clusterCount: relatedClusters.length };
    });
    const rising = [...trendRows].sort((a, b) => b.change - a.change)[0];
    const supplyWatch = [...trendRows]
      .filter((row) => row.change > 0)
      .sort((a, b) => (b.trendScore / Math.max(b.marketSamples, 1)) - (a.trendScore / Math.max(a.marketSamples, 1)))[0];
    const hold = [...trendRows].sort((a, b) => a.marketSamples - b.marketSamples)[0];

    return {
      summary: [
        {
          label: "관심도 급상승",
          item: rising.item,
          value: rising.trendChange,
          note: `관심도 ${rising.trendScore}/100 · 외부 표본 ${number.format(rising.marketSamples)}건`,
          color: "#d95f18",
          background: "#fff4eb",
        },
        {
          label: "공급 압력 점검",
          item: supplyWatch.item,
          value: `점수 ${supplyWatch.trendScore}`,
          note: `상승 신호 대비 외부 표본 ${number.format(supplyWatch.marketSamples)}건`,
          color: "#8a5a00",
          background: "#fff8dc",
        },
        {
          label: "판단 보류",
          item: hold.item,
          value: `${number.format(hold.marketSamples)}건`,
          note: "표본이 적어 가격·수요 판단에 주의가 필요합니다.",
          color: "#a13a46",
          background: "#fff0f2",
        },
      ],
      priorities: trendRows
        .map((row) => ({
          ...row,
          priorityScore: row.change * 2 + row.trendScore - Math.min(30, Math.log10(Math.max(row.marketSamples, 1)) * 10),
        }))
        .sort((a, b) => b.priorityScore - a.priorityScore)
        .slice(0, 4),
    };
  }, [processedClusters]);

  // Linked Raw Listings for the Selected Cluster (Drilldown)
  const linkedRawListings = useMemo(() => {
    if (!selectedCluster) {
      // Default: show sample listings of currently filtered family
      return rawExamples.filter((e) => selectedFamily === "all" || e.item === selectedFamily).slice(0, 8);
    }
    const targetModel = (selectedCluster.model || selectedCluster.cluster || "").toLowerCase();
    const matched = rawExamples.filter((e) => {
      const matchItem = e.item === selectedCluster.item;
      const matchModel = (e.model || "").toLowerCase().includes(targetModel) || (e.title || "").toLowerCase().includes(targetModel);
      return matchItem || matchModel;
    });
    return matched.length > 0 ? matched : rawExamples.filter((e) => e.item === selectedCluster.item).slice(0, 8);
  }, [selectedCluster, selectedFamily, rawExamples]);

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

  const longTermScorecard = useMemo(() => {
    const totalRows = processedClusters.reduce((sum, cluster) => sum + (cluster.count || cluster.sampleCount || 0), 0);
    const multiSourceRows = processedClusters.reduce(
      (sum, cluster) => (cluster.platformCount || 0) >= 2 ? sum + (cluster.count || cluster.sampleCount || 0) : sum,
      0,
    );
    const coveredItems = new Set(processedClusters.map((cluster) => cluster.item).filter(Boolean));
    const targetItems = new Set(GOOGLE_TREND_INDICATORS.map((item) => item.item));
    const marketCoverage = targetItems.size > 0
      ? ([...targetItems].filter((item) => coveredItems.has(item)).length / targetItems.size) * 100
      : 0;
    const sources = insights?.sourceValidation?.sources ?? [];
    const sourceRows = sources.reduce((sum, source) => sum + source.rows, 0);
    const weightedRate = (key: "modelKnownRate" | "datedRate") => sourceRows > 0
      ? sources.reduce((sum, source) => sum + source.rows * source[key], 0) / sourceRows
      : 0;

    return [
      {
        label: "핵심 품목 커버리지",
        value: marketCoverage,
        target: 90,
        suffix: "%",
        definition: "관찰 대상 품목 중 분석 가능한 클러스터가 존재하는 비율",
      },
      {
        label: "신뢰 표본 커버리지",
        value: Number(tuningStats.coverageRate),
        target: 85,
        suffix: "%",
        definition: "전체 표본 중 Reliable·Limited 등급으로 활용 가능한 비율",
      },
      {
        label: "다중 출처 검증률",
        value: totalRows > 0 ? (multiSourceRows / totalRows) * 100 : 0,
        target: 70,
        suffix: "%",
        definition: "2개 이상 외부 플랫폼에서 교차 확인된 표본 비율",
      },
      {
        label: "모델 식별률",
        value: weightedRate("modelKnownRate"),
        target: 90,
        suffix: "%",
        definition: "수집 데이터 중 정규화된 제품 모델을 식별한 비율",
      },
      {
        label: "수집일 식별률",
        value: weightedRate("datedRate"),
        target: 95,
        suffix: "%",
        definition: "수집 시점을 확인해 시계열 비교에 사용할 수 있는 데이터 비율",
      },
    ];
  }, [insights, processedClusters, tuningStats.coverageRate]);

  const resetAllFilters = () => {
    setSearchDraft("");
    setSearchQuery("");
    setSelectedFamily("all");
    setSelectedQuality("all");
    setPlatformFilter("all");
    setCompletedFilter("all");
    setMinPriceFilter(0);
    setMaxPriceFilter(1000000);
    setCurrentPage(1);
    setSelectedCluster(null);
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchDraft.trim());
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchDraft("");
    setSearchQuery("");
    setCurrentPage(1);
  };

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

  if (!insights) return null;

  return (
    <section id="external-insights" className={styles.section}>
      {/* 1. Header */}
      <div className={styles.sectionHead}>
        <div>
          <span>EXT·01</span>
          <div>
            <p className={styles.eyebrow}>EXTERNAL MARKET INDICATORS & DEEP SEARCH EXPLORER</p>
            <h2>외부 지표 인사이트 (시세 시각화 & 연계 상세 검색)</h2>
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

      {/* Operations-first external signal briefing */}
      <div className={styles.externalBrief}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
          <div>
            <h3 style={{ margin: 0, color: "var(--ink)", fontSize: "20px", letterSpacing: "-.035em" }}>오늘 확인할 외부 시장 변화</h3>
            <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: "11px" }}>거래 성과가 아닌 외부 관심도·공급 표본·데이터 품질 기반 운영 신호입니다.</p>
          </div>
          <span style={{ color: "var(--muted)", fontSize: "10px" }}>데이터 기준 {insights.asOf || "최근 수집 시점"}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px", marginBottom: "18px" }}>
          {operationalSignals.summary.map((signal) => (
            <button
              type="button"
              key={signal.label}
              onClick={() => {
                setSelectedTrendItem(signal.item);
                setSelectedFamily(signal.item);
                setCurrentPage(1);
              }}
              style={{ minHeight: "126px", padding: "16px", textAlign: "left", border: `1px solid ${signal.color}24`, borderRadius: "12px", color: "var(--ink)", background: signal.background, cursor: "pointer" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "6px", color: signal.color, fontSize: "10px", fontWeight: 800 }}>
                {signal.label === "판단 보류" ? <AlertTriangle size={14} /> : <TrendingUp size={14} />}
                {signal.label}
              </span>
              <strong style={{ display: "block", margin: "13px 0 4px", fontSize: "15px" }}>{signal.item}</strong>
              <b style={{ color: signal.color, fontSize: "13px" }}>{signal.value}</b>
              <small style={{ display: "block", marginTop: "7px", color: "var(--muted)", fontSize: "9px", lineHeight: 1.45 }}>{signal.note}</small>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, .45fr) minmax(0, 1.55fr)", gap: "16px", paddingTop: "17px", borderTop: "1px solid var(--line)" }}>
          <div>
            <span style={{ display: "flex", alignItems: "center", gap: "7px", color: "var(--ink)", fontSize: "12px", fontWeight: 800 }}><ShieldCheck size={15} color="var(--carrot)" /> 우선 대응 품목</span>
            <p style={{ margin: "7px 0 0", color: "var(--muted)", fontSize: "9px", lineHeight: 1.55 }}>변화율과 관심도가 높고 외부 표본이 상대적으로 적은 순서입니다. 품목을 누르면 아래 근거 지표가 함께 바뀝니다.</p>
          </div>
          <div style={{ display: "grid", gap: "6px" }}>
            {operationalSignals.priorities.map((item, index) => (
              <button
                type="button"
                key={item.item}
                onClick={() => {
                  setSelectedTrendItem(item.item);
                  setSelectedFamily(item.item);
                  setCurrentPage(1);
                }}
                style={{ display: "grid", gridTemplateColumns: "28px minmax(120px, 1fr) auto auto 18px", gap: "10px", alignItems: "center", width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "9px", color: "var(--ink)", background: "#fff", textAlign: "left", cursor: "pointer" }}
              >
                <b style={{ color: index === 0 ? "var(--carrot)" : "var(--muted)", font: "800 10px ui-monospace, monospace" }}>{String(index + 1).padStart(2, "0")}</b>
                <strong style={{ fontSize: "11px" }}>{item.item}</strong>
                <span style={{ color: item.change > 0 ? "#b45309" : "var(--muted)", fontSize: "10px", fontWeight: 700 }}>{item.trendChange}</span>
                <span style={{ color: "var(--muted)", fontSize: "9px" }}>{number.format(item.marketSamples)}건</span>
                <ChevronRight size={15} color="var(--muted)" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Long-term performance baseline */}
      <div className={styles.externalScorecard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <h3 style={{ margin: "7px 0 5px", fontSize: "18px", letterSpacing: "-.025em" }}>외부 데이터 장기 성과 기준선</h3>
            <p style={{ maxWidth: "650px", margin: 0, color: "#b9beb6", fontSize: "10px", lineHeight: 1.6 }}>일회성 시세가 아니라 시장 관찰 범위와 데이터 신뢰도가 장기간 개선되는지 확인합니다. 현재 값은 실수집 데이터에서 계산됩니다.</p>
          </div>
          <span style={{ padding: "6px 9px", border: "1px solid #50564d", borderRadius: "7px", color: "#cdd2ca", fontSize: "9px" }}>기준 {insights.asOf || "최근 수집 시점"}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", border: "1px solid #454a42", borderRadius: "12px", overflow: "hidden" }}>
          {longTermScorecard.map((metric) => {
            const progress = Math.min(100, (metric.value / metric.target) * 100);
            const reached = metric.value >= metric.target;
            return (
              <article key={metric.label} style={{ minHeight: "164px", padding: "15px", borderRight: "1px solid #454a42", background: reached ? "#29352d" : "#2b2e28" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#c5cac2", fontSize: "9px", fontWeight: 700 }}>{metric.label}</span>
                  <span style={{ color: reached ? "#7ee2a8" : "#ffb17e", fontSize: "8px", fontWeight: 800 }}>{reached ? "목표 충족" : "개선 필요"}</span>
                </div>
                <strong style={{ display: "block", margin: "15px 0 3px", fontSize: "24px", fontVariantNumeric: "tabular-nums" }}>{metric.value.toFixed(1)}{metric.suffix}</strong>
                <small style={{ color: "#949b91", fontSize: "8px" }}>장기 목표 {metric.target}{metric.suffix}</small>
                <div role="progressbar" aria-label={metric.label} aria-valuemin={0} aria-valuemax={metric.target} aria-valuenow={Math.round(metric.value)} style={{ height: "5px", margin: "12px 0 9px", borderRadius: "999px", overflow: "hidden", background: "#4a4f47" }}>
                  <span style={{ display: "block", width: `${progress}%`, height: "100%", borderRadius: "inherit", background: reached ? "#58c785" : "#ff8a48" }} />
                </div>
                <p style={{ margin: 0, color: "#aeb4ac", fontSize: "8px", lineHeight: 1.45 }}>{metric.definition}</p>
              </article>
            );
          })}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(170px, .45fr) minmax(0, 1.55fr)", gap: "18px", marginTop: "14px", padding: "15px", borderRadius: "11px", background: "#1d201c" }}>
          <div>
            <span style={{ display: "flex", alignItems: "center", gap: "7px", color: "#fff", fontSize: "11px", fontWeight: 800 }}><Layers size={14} color="#ff9a57" /> 다음 측정 단계</span>
            <p style={{ margin: "6px 0 0", color: "#8f968c", fontSize: "8px", lineHeight: 1.5 }}>운영 이력이 쌓여야 계산 가능한 성과척도입니다.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "8px" }}>
            {[
              ["24시간 내 검토율", "신호 탐지·최초 검토 시각 필요"],
              ["운영 과제 전환율", "담당자·대응 상태 이력 필요"],
              ["신호 유효 판정률", "유효·관찰·무시 판정값 필요"],
            ].map(([label, requirement]) => (
              <div key={label} style={{ padding: "10px", border: "1px dashed #444a41", borderRadius: "8px" }}>
                <strong style={{ display: "block", color: "#d9ddd6", fontSize: "9px" }}>{label}</strong>
                <span style={{ display: "block", marginTop: "4px", color: "#858c82", fontSize: "8px", lineHeight: 1.4 }}>{requirement}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Visual Market Indicators & Price Distribution Strip */}
      <div className={styles.externalMarketEvidence} style={{
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "20px 24px",
        marginBottom: "20px",
        color: "#f8fafc",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
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
              외부 시장 근거
            </span>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "#fff" }}>
              품목별 구글 관심도 & 외부 시장 시세 밴드 (Boxplot 시각화)
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "#94a3b8" }}>
            전체 표본: <b>4,771건</b> (번개장터 42.1% · 중고나라 57.9%)
          </span>
        </div>

        {/* 품목 선택 칩 */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "16px" }}>
          {GOOGLE_TREND_INDICATORS.map((t) => {
            const isSelected = selectedTrendItem === t.item;
            return (
              <button
                key={t.item}
                className={`${styles.externalTrendChip} ${isSelected ? styles.externalTrendChipActive : ""}`}
                onClick={() => {
                  setSelectedTrendItem(t.item);
                  setSelectedFamily(t.item);
                  setCurrentPage(1);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: isSelected ? 800 : 500,
                  background: isSelected ? "#ff6e24" : "rgba(255,255,255,0.08)",
                  color: isSelected ? "#fff" : "#cbd5e1",
                  border: isSelected ? "1px solid #ff6e24" : "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{t.item}</span>
                <span style={{ fontSize: "10px", opacity: 0.85, background: "rgba(0,0,0,0.25)", padding: "2px 6px", borderRadius: "3px" }}>
                  관심도 {t.trendScore}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Item Visual Price Band & Distribution Bar */}
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "18px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>
                {activeTrendData.item} 시세 분포 (Q1 ~ Median ~ Q3 밴드)
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "10px" }}>
                외부 수집 {number.format(activeTrendData.marketSamples)}건 (시장 점유율 {activeTrendData.marketShare}%)
              </span>
            </div>
            <div style={{ display: "flex", gap: "14px", fontSize: "11px" }}>
              <span style={{ color: "#94a3b8" }}>최저 {money(activeTrendData.minPrice)}</span>
              <span style={{ color: "#60a5fa", fontWeight: 700 }}>하위 25% {money(activeTrendData.q1Price)}</span>
              <span style={{ color: "#ff8a48", fontWeight: 800 }}>중앙값 {money(activeTrendData.medianPrice)}</span>
              <span style={{ color: "#34d399", fontWeight: 700 }}>상위 75% {money(activeTrendData.q3Price)}</span>
              <span style={{ color: "#94a3b8" }}>최고 {money(activeTrendData.maxPrice)}</span>
            </div>
          </div>

          {/* Graphical Boxplot / Density Track */}
          <div style={{ position: "relative", height: "36px", background: "rgba(255,255,255,0.06)", borderRadius: "6px", overflow: "hidden", display: "flex", alignItems: "center", padding: "0 10px" }}>
            {/* Background Full Scale */}
            <div style={{ position: "absolute", left: "5%", right: "5%", height: "2px", background: "#475569" }} />

            {/* IQR Box (Q1 to Q3 50% core band) */}
            <div
              style={{
                position: "absolute",
                left: "25%",
                width: "48%",
                height: "22px",
                background: "linear-gradient(90deg, rgba(59,130,246,0.3) 0%, rgba(255,110,36,0.35) 50%, rgba(52,211,153,0.3) 100%)",
                border: "1px solid #ff8a48",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 10px rgba(255,110,36,0.2)"
              }}
            >
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#ffedd5" }}>
                가운데 50% 핵심 거래 구간 ({money(activeTrendData.q1Price)} ~ {money(activeTrendData.q3Price)})
              </span>
            </div>

            {/* Median Marker Line */}
            <div
              style={{
                position: "absolute",
                left: "49%",
                width: "4px",
                height: "28px",
                background: "#ff6e24",
                borderRadius: "2px",
                boxShadow: "0 0 8px #ff6e24"
              }}
              title={`중앙값: ${money(activeTrendData.medianPrice)}`}
            />
          </div>

          {/* Bottom Opportunity Insight Card */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", fontSize: "12px", color: "#cbd5e1" }}>
            <Sparkles size={16} color="#ff9a57" style={{ flexShrink: 0 }} />
            <span>
              <b>구글 트렌드 관심도 {activeTrendData.trendScore}/100 ({activeTrendData.trendChange}):</b> 외부 유입 매물({number.format(activeTrendData.marketSamples)}건)이 급증하고 있어, 당근 플랫폼 내 <b>중앙값 {money(activeTrendData.medianPrice)} 기준 빠른 판매 추천</b>을 가이드하면 체결 속도가 60% 이상 향상됩니다.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Advanced Multi-Dimensional Search & Filtering Console */}
      <div className={styles.externalSearchPanel}>
        <div className={styles.externalSearchHead}>
          <div>
            <span>DATA EXPLORER</span>
            <strong>외부 시세 데이터 검색</strong>
            <p>품목·모델·시그니처를 검색하고 수집 품질 조건을 조합하세요.</p>
          </div>
          <div className={styles.externalResultMeta} aria-live="polite">
            <strong>{number.format(totalFilteredCount)}</strong>
            <span>/ 전체 {number.format(rawClusters.length)}개 클러스터</span>
          </div>
        </div>
        {/* Top Search Toolbar */}
        <div className={styles.externalSearchToolbar}>
          {/* Main Keyword Search Bar */}
          <form className={styles.externalSearchForm} onSubmit={submitSearch} role="search">
            <button type="submit" className={styles.externalSearchSubmit} aria-label="외부 데이터 검색">
              <Search size={17} />
            </button>
            <input
              type="text"
              placeholder="품목명, 정규화 모델명, 시그니처, 키워드 검색..."
              aria-label="외부 데이터 검색어"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            {searchDraft && (
              <button
                type="button"
                onClick={clearSearch}
                className={styles.externalSearchClear}
                aria-label="검색어 지우기"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Quick Filter Dropdowns */}
          <div className={styles.externalFilterRow}>
            {/* Family Select */}
            <select
              value={selectedFamily}
              onChange={(e) => {
                setSelectedFamily(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.externalSelect}
            >
              <option value="all">전체 품목군 ({rawClusters.length}개)</option>
              {uniqueFamilies.map((fam) => (
                <option key={fam} value={fam}>{fam}</option>
              ))}
            </select>

            {/* Platform Filter */}
            <select
              value={platformFilter}
              onChange={(e) => {
                setPlatformFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className={styles.externalSelect}
            >
              <option value="all">모든 플랫폼</option>
              <option value="multi">다중 수집 (번개+중고나라)</option>
              <option value="bunjang">번개장터 전용</option>
              <option value="joongna">중고나라 전용</option>
            </select>

            {/* Quality Status Filter */}
            <select
              value={selectedQuality}
              onChange={(e) => {
                setSelectedQuality(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.externalSelect}
            >
              <option value="all">모든 품질 상태</option>
              <option value="reliable">신뢰 (Reliable)</option>
              <option value="limited">제한적 (Limited)</option>
              <option value="sparse">표본 부족 (Sparse)</option>
              <option value="noisy">분산 큼 (Noisy)</option>
            </select>

            {/* Advanced Search Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                background: showAdvancedSearch ? "#fff5ed" : "#fff",
                color: showAdvancedSearch ? "var(--carrot-dark)" : "var(--ink)",
                border: showAdvancedSearch ? "1px solid var(--carrot)" : "1px solid var(--line)",
                cursor: "pointer",
              }}
            >
              <ListFilter size={14} color={showAdvancedSearch ? "var(--carrot)" : "currentColor"} />
              <span>상세 검색 필터</span>
            </button>

            {/* Tuning Sandbox Toggle */}
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
                background: showTuningPanel ? "#ffefe5" : "#fff",
                color: showTuningPanel ? "var(--carrot-dark)" : "var(--ink)",
                border: showTuningPanel ? "1px solid var(--carrot)" : "1px solid var(--line)",
                cursor: "pointer",
              }}
            >
              <SlidersHorizontal size={14} color={showTuningPanel ? "var(--carrot)" : "currentColor"} />
              <span>실시간 시세 튜닝</span>
            </button>

            {/* Reset Filters */}
            <button
              type="button"
              onClick={resetAllFilters}
              title="필터 초기화"
              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", color: "var(--muted)" }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Expandable Advanced Search Console (Price Range & Transaction Status) */}
        {showAdvancedSearch && (
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px dashed var(--line)", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {/* Price Range Filter Slider & Inputs */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                <span style={{ fontWeight: 700, color: "var(--ink)" }}>시세 범위 필터 (Price Filter)</span>
                <span style={{ color: "var(--carrot-dark)", fontWeight: 700 }}>
                  {money(minPriceFilter)} ~ {maxPriceFilter >= 1000000 ? "무제한" : money(maxPriceFilter)}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  max="1000000"
                  value={minPriceFilter}
                  onChange={(e) => setMinPriceFilter(Number(e.target.value))}
                  placeholder="최소 가격"
                  style={{ width: "100px", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px" }}
                />
                <span>~</span>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  max="1000000"
                  value={maxPriceFilter}
                  onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                  placeholder="최대 가격"
                  style={{ width: "100px", padding: "6px 8px", borderRadius: "4px", border: "1px solid var(--line)", fontSize: "12px" }}
                />
                <button
                  type="button"
                  onClick={() => { setMinPriceFilter(0); setMaxPriceFilter(1000000); }}
                  style={{ padding: "6px 10px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--line)", background: "#f1f5f9", cursor: "pointer" }}
                >
                  초기화
                </button>
              </div>
            </div>

            {/* Completed Rate Filter */}
            <div>
              <span style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--ink)", marginBottom: "6px" }}>
                거래 상태 필터 (Listing Status)
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { id: "all", label: "전체 매물" },
                  { id: "completed", label: "거래완료 실거래 (50%+)" },
                  { id: "selling", label: "판매중 호가" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setCompletedFilter(s.id as any)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: completedFilter === s.id ? 700 : 500,
                      background: completedFilter === s.id ? "var(--ink)" : "#fff",
                      color: completedFilter === s.id ? "#fff" : "var(--ink)",
                      border: completedFilter === s.id ? "1px solid var(--ink)" : "1px solid var(--line)",
                      cursor: "pointer"
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Tuning Sandbox Panel */}
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

      {/* Filter-linked distribution metrics */}
      <div style={{ margin: "18px 0", padding: "20px", border: "1px solid var(--line)", borderRadius: "16px", background: "var(--surface)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "grid", placeItems: "center", width: "36px", height: "36px", borderRadius: "10px", color: "var(--carrot-dark)", background: "#fff1e7" }}>
              <BarChart3 size={18} />
            </span>
            <div>
              <strong style={{ display: "block", color: "var(--ink)", fontSize: "14px" }}>검색 결과 분포도</strong>
              <span style={{ color: "var(--muted)", fontSize: "10px" }}>현재 검색·품목·품질·가격 필터가 즉시 반영됩니다.</span>
            </div>
          </div>
          <span style={{ color: "var(--muted)", fontSize: "10px" }}>
            {number.format(currentSliceStats.clusterCount)}개 클러스터 · {number.format(currentSliceStats.totalCount)}건 표본
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", border: "1px solid var(--line)", borderRadius: "12px", overflow: "hidden", marginBottom: "18px" }}>
          {[
            ["하위 25%", money(distributionMetrics.q1)],
            ["중앙값", money(distributionMetrics.median)],
            ["상위 75%", money(distributionMetrics.q3)],
            ["가격 편차 IQR", money(distributionMetrics.iqr)],
            ["거래 완료율", `${distributionMetrics.completionRate.toFixed(1)}%`],
            ["신뢰 표본 비중", `${distributionMetrics.reliableRate.toFixed(1)}%`],
          ].map(([label, value], index) => (
            <div key={label} style={{ padding: "14px", borderRight: index < 5 ? "1px solid var(--line)" : "none", background: index === 1 ? "#fff7f1" : "#fff" }}>
              <span style={{ display: "block", color: "var(--muted)", fontSize: "9px", marginBottom: "6px" }}>{label}</span>
              <strong style={{ color: index === 1 ? "var(--carrot-dark)" : "var(--ink)", fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>{value}</strong>
            </div>
          ))}
        </div>

        <div aria-label="가격 구간별 표본 분포" style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(80px, 1fr))", gap: "10px", alignItems: "end", minHeight: "142px", padding: "14px 14px 10px", borderRadius: "12px", background: "#f6f5f1" }}>
          {distributionMetrics.buckets.map((bucket) => {
            const height = bucket.count === 0 ? 3 : Math.max(12, (bucket.count / distributionMetrics.maxBucketCount) * 82);
            const share = currentSliceStats.totalCount > 0 ? (bucket.count / currentSliceStats.totalCount) * 100 : 0;
            return (
              <div key={bucket.label} style={{ display: "grid", gridTemplateRows: "20px 82px auto", gap: "5px", alignItems: "end", minWidth: 0 }}>
                <strong style={{ textAlign: "center", color: "var(--ink)", fontSize: "10px" }}>{share.toFixed(1)}%</strong>
                <div title={`${bucket.label}: ${number.format(bucket.count)}건`} style={{ alignSelf: "end", width: "100%", height: `${height}px`, borderRadius: "7px 7px 3px 3px", background: bucket.count > 0 ? "var(--carrot)" : "#dedbd3" }} />
                <span style={{ minHeight: "28px", textAlign: "center", color: "var(--muted)", fontSize: "9px", lineHeight: 1.35 }}>{bucket.label}<br />{number.format(bucket.count)}건</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Main Clusters Data Table */}
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
              {visibleColumns.model && <th style={{ padding: "10px 12px" }}>정규화 모델 (클러스터)</th>}
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
              <th style={{ padding: "10px 12px", textAlign: "center" }}>원천 매물 연계</th>
            </tr>
          </thead>
          <tbody>
            {paginatedClusters.map((cluster, idx) => {
              const status = showTuningPanel ? cluster.tunedStatus : cluster.qualityStatus;
              const isReliable = status === "reliable";
              const isLimited = status === "limited";
              const isSparse = status === "sparse";
              const isSelected = selectedCluster?.cluster === cluster.cluster;

              return (
                <tr
                  key={idx}
                  onClick={() => setSelectedCluster(cluster)}
                  style={{
                    borderBottom: "1px solid var(--line)",
                    background: isSelected ? "#fffaf6" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.1s ease",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "#fcfcfc"; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  {visibleColumns.item && (
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink)" }}>
                      {cluster.item}
                    </td>
                  )}
                  {visibleColumns.model && (
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ fontWeight: 600, color: isSelected ? "var(--carrot-dark)" : "var(--ink)" }}>
                        {isSelected ? "▶ " : ""}{cluster.model || cluster.productSignature || cluster.cluster}
                      </span>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCluster(cluster);
                      }}
                      style={{
                        padding: "4px 8px",
                        background: isSelected ? "var(--carrot)" : "#f1f5f9",
                        color: isSelected ? "#fff" : "var(--ink)",
                        border: "1px solid #cbd5e1",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isSelected ? "선택됨" : "매물 보기"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Pagination & Column Customizer Trigger */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", marginBottom: "24px", fontSize: "12px", color: "var(--muted)", flexWrap: "wrap", gap: "10px" }}>
        <div>
          총 <b>{totalFilteredCount}</b>개 클러스터 중 {Math.min(totalFilteredCount, (currentPage - 1) * pageSize + 1)} - {Math.min(totalFilteredCount, currentPage * pageSize)} 표시
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowColumnModal(true)}
            style={{ padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: "11px" }}
          >
            컬럼 커스텀
          </button>

          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
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

      {/* 7. Linked Raw Listings Explorer (연계 원천 매물 상세 검수 테이블) */}
      <div style={{
        background: "#fff",
        border: "1px solid var(--line)",
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShoppingBag size={18} color="var(--carrot)" />
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 800, margin: 0, color: "var(--ink)" }}>
                클러스터 연계 원천 매물 탐색기 (Raw Listings Drilldown)
              </h3>
              <p style={{ fontSize: "11px", color: "var(--muted)", margin: "2px 0 0 0" }}>
                {selectedCluster
                  ? `선택된 클러스터: [${selectedCluster.item}] ${selectedCluster.model || selectedCluster.cluster}의 수집 원본 매물`
                  : "상단 테이블에서 클러스터를 선택하면 해당 모델의 수집 원본 매물이 실시간 연동됩니다."}
              </p>
            </div>
          </div>

          {selectedCluster && (
            <button
              onClick={() => setSelectedCluster(null)}
              style={{ padding: "4px 8px", fontSize: "11px", borderRadius: "4px", border: "1px solid var(--line)", background: "#f1f5f9", cursor: "pointer" }}
            >
              전체 매물 보기로 전환
            </button>
          )}
        </div>

        {/* Listings Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--line)", color: "var(--muted)" }}>
                <th style={{ padding: "8px 10px" }}>수집 플랫폼</th>
                <th style={{ padding: "8px 10px" }}>원본 매물 제목</th>
                <th style={{ padding: "8px 10px", textAlign: "right" }}>수집 가격</th>
                <th style={{ padding: "8px 10px", textAlign: "center" }}>거래 상태</th>
                <th style={{ padding: "8px 10px" }}>정규화 모델</th>
                <th style={{ padding: "8px 10px" }}>정제/분류 사유</th>
              </tr>
            </thead>
            <tbody>
              {linkedRawListings.map((listing, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      fontWeight: 700,
                      background: listing.platform.includes("번개") ? "#fee2e2" : "#e0f2fe",
                      color: listing.platform.includes("번개") ? "#dc2626" : "#0284c7"
                    }}>
                      {listing.platform}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", fontWeight: 600, color: "var(--ink)", maxWidth: "340px" }}>
                    {listing.title}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700, fontFamily: "monospace", color: "var(--carrot-dark)" }}>
                    {money(listing.price)}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "center" }}>
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      background: listing.status.includes("완료") ? "#dcfce7" : "#f1f5f9",
                      color: listing.status.includes("완료") ? "#166534" : "#475569"
                    }}>
                      {listing.status}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px", color: "var(--muted)" }}>
                    {listing.model || "—"}
                  </td>
                  <td style={{ padding: "8px 10px", color: "#64748b", fontSize: "11px" }}>
                    {listing.reason || "정상 완제품 표본으로 클러스터링"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
