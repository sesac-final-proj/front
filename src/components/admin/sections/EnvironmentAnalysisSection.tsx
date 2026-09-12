"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from "recharts";
import {
  Activity,
  MapPin,
  Calendar,
  Clock,
  RotateCw,
  Users,
  Compass,
  Layers,
  Sparkles,
  ArrowUpRight,
  CloudSun,
  AlertCircle,
  Database,
} from "lucide-react";
import {
  fetchDistrictCongestion,
  type DistrictCongestionSummary,
  DAY_LABELS,
  HOURLY_TIME_SLOTS,
  getCongestionLevelLabel,
} from "@/services/adminCongestionService";
import { AdminTable } from "../AdminUI";
import pStyles from "../portal.module.css";
import styles from "@/app/admin/admin.module.css";

/* ── 지역 시맨틱 3색 트라이어드 (Regional Triad) ───────────── */
const GU_COLOR: Record<string, string> = {
  송파구: "#FF9D5B",
  영등포구: "#7C9CBF",
  노원구: "#8CC0A6",
};

/* ── 도넛 게이지 (Seed 파스텔 테마) ───────────── */
function CongestionGauge({
  score,
  theme,
  size = 110,
}: {
  score: number;
  theme: DistrictCongestionSummary["theme"];
  size?: number;
}) {
  const data = [
    { name: "score", value: score },
    { name: "rest", value: Math.max(0, 100 - score) },
  ];
  return (
    <div className={styles.congestionGauge} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius="72%"
            outerRadius="94%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={theme.tagColor} />
            <Cell fill="rgba(231, 232, 229, 0.45)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className={styles.congestionGaugeLabel}>
        <strong style={{ color: theme.tagColor }}>{score}</strong>
        <span>{getCongestionLevelLabel(theme.level)}</span>
      </div>
    </div>
  );
}

/* ── 120-Bin 도트 스웜 인파 밀집도 시각화 ───────────── */
const DOT_SIZE = 6;
const BINS = 60;
const MAX_STACK = 12;

function layoutCongestionSwarm(districts: DistrictCongestionSummary[]) {
  const points: { score: number; gu: string; y: number; name: string }[] = [];
  const guNames = ["송파구", "영등포구", "노원구"];

  guNames.forEach((gu, rowIdx) => {
    const d = districts.find((item) => item.district.name === gu);
    if (!d) return;

    const baseCenter = rowIdx * 38 + 20;
    const binCounts = new Map<number, number>();

    // 핫스팟 + 시간대별 샘플을 도트로 변환
    const samples = [
      ...d.zones.map((z) => ({ score: z.currentScore, name: z.name })),
      ...d.hourlyTrends.map((h) => ({ score: h.score, name: `${h.hour} 추정치` })),
    ];

    samples.forEach((s) => {
      const bin = Math.min(BINS - 1, Math.floor((s.score / 100) * BINS));
      const stackIdx = binCounts.get(bin) ?? 0;
      binCounts.set(bin, stackIdx + 1);

      if (stackIdx < MAX_STACK) {
        const level = stackIdx % 2 === 0 ? stackIdx / 2 : -(stackIdx + 1) / 2;
        points.push({
          score: s.score,
          gu,
          y: baseCenter + level * (DOT_SIZE + 1),
          name: s.name,
        });
      }
    });
  });

  return { points, totalHeight: 125 };
}

function SwarmDotShape(props: any) {
  const gu = props.payload.gu;
  const color = GU_COLOR[gu] || "#FF6F0F";
  return <circle cx={props.cx} cy={props.cy} r={DOT_SIZE / 2} fill={color} fillOpacity={0.85} />;
}

/* ── 커스텀 차트 툴팁 ───────────── */
function CustomHourlyTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className={styles.chartTooltip}>
      <p className={styles.chartTooltipTitle}>{label} 혼잡도</p>
      {payload.map((item: any) => (
        <div key={item.name} className={styles.chartTooltipRow}>
          <span style={{ color: item.color }}>● {item.name}:</span>
          <strong>{item.value}점</strong>
        </div>
      ))}
    </div>
  );
}

export default function EnvironmentAnalysisSection() {
  const [districts, setDistricts] = useState<DistrictCongestionSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 탭 상태: "all" (전체 비교) 또는 각 구 id
  const [activeTab, setActiveTab] = useState<"all" | "yeongdeungpo" | "nowon" | "songpa">("all");
  // 뷰 모드: "both" (종합) | "daily" (일 혼잡도) | "hourly" (시간 혼잡도) | "environment" (환경/AI 모델)
  const [viewMode, setViewMode] = useState<"both" | "daily" | "hourly" | "environment">("both");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchDistrictCongestion();
      setDistricts(data);
    } catch (e) {
      setError("실시간 혼잡도 및 외부 환경 분석 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 시간대별 차트 결합 데이터
  const combinedHourlyData = useMemo(() => {
    if (!districts) return [];
    return HOURLY_TIME_SLOTS.map((hour, idx) => {
      const entry: Record<string, any> = { hour };
      districts.forEach((d) => {
        entry[d.district.name] = d.hourlyTrends[idx]?.score ?? 0;
      });
      return entry;
    });
  }, [districts]);

  // 도트 스웜 데이터
  const swarmLayout = useMemo(() => {
    if (!districts) return { points: [], totalHeight: 120 };
    return layoutCongestionSwarm(districts);
  }, [districts]);

  if (loading) {
    return (
      <section className={styles.congestionDashboardLoading}>
        <div className={styles.congestionLoaderOrb} />
        <p>서울시 실시간 도시데이터 및 모델·외부 환경 분석 지표를 계산하고 있습니다…</p>
      </section>
    );
  }

  if (error || !districts || districts.length === 0) {
    return (
      <section className={styles.congestionDashboardError}>
        <AlertCircle size={24} color="#EA580C" />
        <p>{error ?? "데이터를 불러올 수 없습니다."}</p>
        <button type="button" onClick={() => loadData()}>다시 시도</button>
      </section>
    );
  }

  const totalZones = districts.reduce((sum, d) => sum + d.zones.length, 0);
  const overallAvg = Math.round(districts.reduce((sum, d) => sum + d.averageScore, 0) / districts.length);
  const mostCrowdedDistrict = districts.reduce((peak, d) => (d.averageScore > peak.averageScore ? d : peak), districts[0]);
  const currentSelectedDistrict = activeTab === "all" ? null : districts.find((d) => d.district.id === activeTab);
  const allZones = districts.flatMap((d) => d.zones);
  const liveZoneCount = allZones.filter((zone) => zone.source === "seoul_citydata_api").length;
  const hasFallbackData = liveZoneCount !== allZones.length;

  return (
    <section className={styles.congestionSection} aria-labelledby="environment-analysis-heading">
      {/* ── 1. 거래 운영 디자인 기반 통합 Hero Overview Card ── */}
      <div className={styles.congestionHeroBanner}>
        <div className={styles.congestionHeroTop}>
          <div className={styles.congestionHeroLeft}>
            <div className={styles.congestionHeroEyebrow}>
              <span className={styles.livePulseBadge}>
                <Database size={12} aria-hidden="true" />
                서울시 도시데이터
              </span>
              <span className={styles.congestionHeroTimestamp}>
                수집 기준 {districts[0]?.lastUpdated || "방금 갱신"}
              </span>
            </div>
            <h2 id="environment-analysis-heading">
              모델 및 외부 환경 분석
            </h2>
            <p className={styles.congestionHeroDesc}>
              영등포구, 노원구, 송파구의 현재 혼잡도를 비교합니다. 요일·시간대별 흐름은 현재 점수에 기준 패턴을 적용한 추정치입니다.
            </p>
          </div>

          <div className={styles.congestionHeroRight}>
            <button
              type="button"
              className={styles.congestionRefreshBtn}
              onClick={() => loadData(true)}
              disabled={refreshing}
              aria-label="데이터 새로고침"
            >
              <RotateCw size={13} className={refreshing ? styles.spinning : ""} />
              <span>{refreshing ? "불러오는 중…" : "새로고침"}</span>
            </button>
            <span className={styles.congestionHeroTimestamp}>
              <Clock size={11} />
              최근 수집 시각 기준
            </span>
          </div>
        </div>

        {/* 4열 운영 통계 스트립 (Trade Operations sourceAnalysisMetrics / qualitySummary 규격) */}
        <div className={styles.congestionHeroKeyStats}>
          <div className={styles.congestionHeroStatCol}>
            <span>모니터링 표본 거점</span>
            <div className={styles.congestionHeroStatValueRow}>
              <strong>{totalZones}개소</strong>
            </div>
            <small>영등포 4 · 노원 3 · 송파 6 행정 핫스팟</small>
          </div>

          <div className={styles.congestionHeroStatCol}>
            <span>3개 구 평균 혼잡도</span>
            <div className={styles.congestionHeroStatValueRow}>
              <strong>{overallAvg}점</strong>
              <span
                className={`${styles.statBadgePill} ${
                  mostCrowdedDistrict.level === "severe"
                    ? styles.statBadgeAlert
                    : mostCrowdedDistrict.level === "high"
                    ? styles.statBadgeCaution
                    : styles.statBadgeNormal
                }`}
              >
                {getCongestionLevelLabel(mostCrowdedDistrict.level)}
              </span>
            </div>
            <small>최근 수집된 권역별 점수 평균</small>
          </div>

          <div className={styles.congestionHeroStatCol}>
            <span>최고 혼잡 권역</span>
            <div className={styles.congestionHeroStatValueRow}>
              <span
                className={styles.guBadgePill}
                style={{
                  backgroundColor: `${GU_COLOR[mostCrowdedDistrict.district.name]}18`,
                  borderColor: `${GU_COLOR[mostCrowdedDistrict.district.name]}44`,
                  color: GU_COLOR[mostCrowdedDistrict.district.name],
                }}
              >
                {mostCrowdedDistrict.district.name}
              </span>
              <strong>{mostCrowdedDistrict.averageScore}점</strong>
            </div>
            <small>현재 평균 점수가 가장 높은 자치구</small>
          </div>

          <div className={styles.congestionHeroStatCol}>
            <span>서울시 API 수집</span>
            <div className={styles.congestionHeroStatValueRow}>
              <span className={`${styles.statBadgePill} ${styles.statBadgeNormal}`}>
                {hasFallbackData ? "일부 대체" : "수집 완료"}
              </span>
              <strong>{liveZoneCount}/{allZones.length}</strong>
            </div>
            <small>{hasFallbackData ? "API 미수집 지점은 대체 데이터 표시" : `${districts[0]?.lastUpdated || "방금"} 기준`}</small>
          </div>
        </div>
      </div>

      {/* ── 3. 인터랙티브 탭 & 뷰 모드 컨트롤 바 ── */}
      <div className={styles.congestionControlsBar}>
        <nav className={styles.congestionDistrictTabs} aria-label="구 선택 탭">
          <button
            type="button"
            className={activeTab === "all" ? styles.tabActive : styles.tabBtn}
            onClick={() => setActiveTab("all")}
          >
            <Layers size={14} />
            <span>전체 3개 구 비교</span>
          </button>
          {districts.map((d) => (
            <button
              key={d.district.id}
              type="button"
              className={activeTab === d.district.id ? styles.tabActive : styles.tabBtn}
              onClick={() => setActiveTab(d.district.id)}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: GU_COLOR[d.district.name] || "#FF6F0F",
                  display: "inline-block",
                }}
              />
              <span>{d.district.name}</span>
            </button>
          ))}
        </nav>

        <div className={styles.congestionViewToggle} aria-label="분석 관점 선택">
          <button
            type="button"
            className={viewMode === "both" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setViewMode("both")}
          >
            종합 뷰
          </button>
          <button
            type="button"
            className={viewMode === "daily" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setViewMode("daily")}
          >
            <Calendar size={13} />
            요일별 추정
          </button>
          <button
            type="button"
            className={viewMode === "hourly" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setViewMode("hourly")}
          >
            <Clock size={13} />
            시간대별 추정
          </button>
          <button
            type="button"
            className={viewMode === "environment" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setViewMode("environment")}
          >
            <CloudSun size={13} />
            외부 환경·예측
          </button>
        </div>
      </div>

      {/* ── 4. 구별 핵심 서머리 카드 3열 그리드 ── */}
      <div className={styles.districtSummaryGrid}>
        {districts.map((d) => {
          const isSelected = activeTab === d.district.id;
          return (
            <article
              key={d.district.id}
              className={`${styles.districtSummaryCard} ${isSelected ? styles.districtCardSelected : ""}`}
              onClick={() => setActiveTab(d.district.id)}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveTab(d.district.id);
                }
              }}
            >
              <div className={styles.districtCardHead}>
                <div>
                  <span className={styles.districtSubLabel} style={{ color: GU_COLOR[d.district.name] }}>
                    ● {d.district.badge}
                  </span>
                  <h3>{d.district.name}</h3>
                </div>
                <span
                  className={styles.districtLevelBadge}
                  style={{
                    backgroundColor: d.theme.badgeBg,
                    color: d.theme.badgeText,
                    borderColor: d.theme.badgeBorder,
                  }}
                >
                  {getCongestionLevelLabel(d.level)}
                </span>
              </div>

              <div className={styles.districtCardBody}>
                <CongestionGauge score={d.averageScore} theme={d.theme} />
                <div className={styles.districtQuickDetails}>
                  <p className={styles.districtSubtitle}>{d.district.subtitle}</p>
                  <dl className={styles.districtStatList}>
                    <div>
                      <dt>최고 혼잡 지점</dt>
                      <dd title={d.peakZone?.name ?? "—"}>
                        <b>{d.peakZone?.name ?? "—"}</b> ({d.peakZone?.currentScore ?? 0}점)
                      </dd>
                    </div>
                    <div>
                      <dt>피크 요일 / 시간</dt>
                      <dd>
                        {d.peakDay} · {d.peakHour}
                      </dd>
                    </div>
                    <div>
                      <dt>추정 유동인구</dt>
                      <dd>
                        <Users size={12} />
                        {d.totalPopulationMin > 0
                          ? `약 ${(d.totalPopulationMin / 10000).toFixed(1)}만~${(d.totalPopulationMax / 10000).toFixed(1)}만명`
                          : "실시간 집계중"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className={styles.districtMiniBarTrack}>
                <div
                  className={styles.districtMiniBarFill}
                  style={{
                    width: `${d.averageScore}%`,
                    background: d.theme.meterGradient,
                  }}
                />
              </div>
            </article>
          );
        })}
      </div>

      {/* ── 5. 비대칭 1.7fr : 1fr 차트 그리드 (거래 대시보드 패턴 계승) ── */}
      {(viewMode === "both" || viewMode === "hourly") && (
        <div className={pStyles.chartGrid}>
          {/* 좌측: 24시간 타임라인 AreaChart */}
          <article className={pStyles.card}>
            <div className={pStyles.cardHead}>
              <div>
                <h2>구별 24시간 유동 곡선 추이</h2>
                <p>영등포 · 노원 · 송파 3개 구 시간대별 평균 인파 지수 (00시 ~ 22시)</p>
              </div>
              <div className={styles.chartLegendGroup}>
                <span className={styles.legendItem}><i style={{ background: GU_COLOR["영등포구"] }} /> 영등포구</span>
                <span className={styles.legendItem}><i style={{ background: GU_COLOR["노원구"] }} /> 노원구</span>
                <span className={styles.legendItem}><i style={{ background: GU_COLOR["송파구"] }} /> 송파구</span>
              </div>
            </div>

            <div className={styles.hourlyChartContainer}>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={combinedHourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorYeongdeungpoEnv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GU_COLOR["영등포구"]} stopOpacity={0.45} />
                      <stop offset="95%" stopColor={GU_COLOR["영등포구"]} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorNowonEnv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GU_COLOR["노원구"]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={GU_COLOR["노원구"]} stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSongpaEnv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={GU_COLOR["송파구"]} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={GU_COLOR["송파구"]} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F1ED" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} tick={{ fontSize: 10, fill: "#8b9184" }} />
                  <YAxis domain={[0, 100]} tickLine={false} tick={{ fontSize: 10, fill: "#8b9184" }} />
                  <Tooltip content={<CustomHourlyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="영등포구"
                    stroke={GU_COLOR["영등포구"]}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorYeongdeungpoEnv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="노원구"
                    stroke={GU_COLOR["노원구"]}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorNowonEnv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="송파구"
                    stroke={GU_COLOR["송파구"]}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSongpaEnv)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>

          {/* 우측: 구별 유동 비중 및 상태 파이 도넛 */}
          <article className={pStyles.card}>
            <div className={pStyles.cardHead}>
              <div>
                <h2>구별 유동 인파 점유 비중</h2>
                <p>3개 구 총 유동 표본 대비 권역별 분담률</p>
              </div>
            </div>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={districts.map((d) => ({
                      name: d.district.name,
                      count: d.averageScore,
                    }))}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {districts.map((d) => (
                      <Cell key={d.district.id} fill={GU_COLOR[d.district.name] || "#FF6F0F"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}점 (평균)`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: -10, fontSize: 11 }}>
              {districts.map((d) => (
                <span key={d.district.id} style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#656b60" }}>
                  <i style={{ width: 9, height: 9, borderRadius: "50%", background: GU_COLOR[d.district.name] }} />
                  {d.district.name} ({Math.round((d.averageScore / (overallAvg * 3 || 1)) * 100)}%)
                </span>
              ))}
            </div>
          </article>
        </div>
      )}

      {/* ── 6. 120-Bin 도트 스웜 인파 밀집도 산점도 (PriceComparison SampleSwarm 패턴 계승) ── */}
      <article className={pStyles.card} style={{ marginTop: 8 }}>
        <div className={pStyles.cardHead}>
          <div>
            <h2>구별 유동 인파 밀집도 스웜 (Dot Swarm)</h2>
            <p>점 하나 = 핫스팟/시간대별 관측치 1건 · 행 = 구 (0~100점 혼잡도 분포)</p>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {Object.entries(GU_COLOR).map(([gu, color]) => (
              <span key={gu} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#656b60" }}>
                <i style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
                {gu}
              </span>
            ))}
          </div>
        </div>

        <div style={{ height: swarmLayout.totalHeight + 10, width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid stroke="#F0F1ED" horizontal={false} />
              <XAxis
                type="number"
                dataKey="score"
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: "#8b9184" }}
                tickFormatter={(v) => `${v}점`}
              />
              <YAxis type="number" dataKey="y" hide domain={[0, swarmLayout.totalHeight]} />
              <Tooltip
                cursor={false}
                content={({ payload }) => {
                  const row = payload?.[0]?.payload as { gu: string; score: number; name: string } | undefined;
                  if (!row) return null;
                  return (
                    <div style={{ background: "#fff", border: "1px solid #E7E8E5", borderRadius: 8, padding: "6px 10px", fontSize: 11 }}>
                      <b>{row.gu}</b> · {row.name} ({row.score}점)
                    </div>
                  );
                }}
              />
              <Scatter data={swarmLayout.points} isAnimationActive={false} shape={SwarmDotShape} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </article>

      {/* ── 7. [일 혼잡도 분석] 요일별(월~일) 패턴 패널 ── */}
      {(viewMode === "both" || viewMode === "daily") && (
        <article className={styles.analysisPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <span className={styles.panelIconTag}><Calendar size={16} /></span>
              <div>
                <h3>구별 일(요일별) 혼잡도 패턴 분석</h3>
                <p>월요일부터 일요일까지 요일별 인파 지표와 주중(평일) 대비 주말의 유동량 변화 추이를 진단합니다.</p>
              </div>
            </div>
            <span className={styles.panelHeaderBadge}>
              주중 vs 주말 인파 편차 모델
            </span>
          </div>

          <div className={styles.dailyAnalysisGrid}>
            {(currentSelectedDistrict ? [currentSelectedDistrict] : districts).map((d) => (
              <div key={d.district.id} className={styles.dailyDistrictCol}>
                <div className={styles.dailyDistrictHeader}>
                  <h4>{d.district.name} 요일별 지수</h4>
                  <div className={styles.dailyCompareBadges}>
                    <span>평일 <b>{d.weekdayAvg}점</b></span>
                    <span>주말 <b style={{ color: d.weekendAvg > d.weekdayAvg ? "#EA580C" : "#0284C7" }}>{d.weekendAvg}점</b></span>
                  </div>
                </div>

                <div className={styles.dailyBarChart}>
                  {d.dailyTrends.map((dayItem, idx) => (
                    <div key={dayItem.day} className={styles.dailyBarCol}>
                      <span className={styles.dailyBarScore}>{dayItem.score}</span>
                      <div className={styles.dailyBarSlot}>
                        <div
                          className={styles.dailyBarFill}
                          style={{
                            height: `${dayItem.score}%`,
                            background: GU_COLOR[d.district.name] || dayItem.theme.tagColor,
                            animationDelay: `${idx * 50}ms`,
                          }}
                        />
                      </div>
                      <span className={`${styles.dailyBarLabel} ${dayItem.isWeekend ? styles.weekendLabel : ""}`}>
                        {dayItem.day}
                      </span>
                      {dayItem.isPeak && (
                        <span className={styles.dailyPeakIndicator}>피크</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.dailyInsightCard}>
                  <Sparkles size={14} color="#FF6F0F" />
                  <p>
                    {d.district.name}은(는) <b>{d.peakDay}</b>에 가장 붐비며, 주말 인파가 평일 대비{" "}
                    <b>
                      {d.weekendAvg >= d.weekdayAvg
                        ? `+${d.weekendAvg - d.weekdayAvg}점 상승`
                        : `${d.weekdayAvg - d.weekendAvg}점 감소`}
                    </b>
                    하는 패턴을 보입니다.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* 외부 환경 연계 상태 */}
      {(viewMode === "both" || viewMode === "environment") && (
        <article className={styles.analysisPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <span className={styles.panelIconTag}><CloudSun size={16} /></span>
              <div>
                <h3>외부 환경 데이터</h3>
                <p>기상·대기 데이터 연계 상태</p>
              </div>
            </div>
            <span className={styles.panelHeaderBadge}>연계 준비 중</span>
          </div>
          <p className={styles.environmentNotice}>
            현재 화면은 도시데이터 혼잡도만 제공합니다. 기온, 강수, 미세먼지 지표는 원천 API 연계 후 표시됩니다.
          </p>
        </article>
      )}

      {/* ── 9. 주요 핫스팟 실시간 모니터링 테이블 (AdminTable 패턴) ── */}
      <article className={pStyles.card} style={{ marginTop: 8 }}>
        <div className={pStyles.cardHead}>
          <div>
            <h2>주요 지점 혼잡도</h2>
            <p>서울시 API {liveZoneCount}개 · 대체 데이터 {allZones.length - liveZoneCount}개</p>
          </div>
        </div>

        <AdminTable headers={["핫스팟 명칭", "소속 자치구", "행정동", "혼잡 등급", "실시간 점수", "추정 체류 인구", "우회 가이드"]}>
          {allZones.map((zone) => {
            const guColor = GU_COLOR[zone.districtName] || "#FF6F0F";
            return (
              <tr key={zone.id}>
                <td>
                  <b>{zone.name}</b>
                </td>
                <td>
                  <span style={{ color: guColor, fontWeight: 700 }}>● {zone.districtName}</span>
                </td>
                <td>{zone.neighborhoodName}</td>
                <td>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 700,
                      backgroundColor: zone.currentScore >= 71 ? "#FFF7ED" : "#ECFDF3",
                      color: zone.currentScore >= 71 ? "#EA580C" : "#12B76A",
                    }}
                  >
                    {zone.levelLabel || getCongestionLevelLabel(zone.level)}
                  </span>
                </td>
                <td>
                  <strong style={{ fontFamily: "ui-monospace, monospace" }}>{zone.currentScore}점</strong>
                </td>
                <td>
                  {zone.populationMin && zone.populationMax
                    ? `약 ${zone.populationMin.toLocaleString()}~${zone.populationMax.toLocaleString()}명`
                    : "집계중"}
                </td>
                <td style={{ fontSize: 11, color: "#656b60" }}>
                  {zone.recommendation || "원활한 보행 가능"}
                </td>
              </tr>
            );
          })}
        </AdminTable>
      </article>
    </section>
  );
}
