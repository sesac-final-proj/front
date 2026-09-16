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
} from "recharts";
import {
  Activity,
  MapPin,
  Calendar,
  Clock,
  RotateCw,
  Users,
  TrendingUp,
  AlertTriangle,
  Compass,
  Layers,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  fetchDistrictCongestion,
  type DistrictCongestionSummary,
  DAY_LABELS,
  HOURLY_TIME_SLOTS,
  getCongestionLevelLabel,
} from "@/services/adminCongestionService";
import styles from "@/app/admin/admin.module.css";

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

export default function CongestionDashboard() {
  const [districts, setDistricts] = useState<DistrictCongestionSummary[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 탭 상태: "all" (전체 비교) 또는 각 구 id
  const [activeTab, setActiveTab] = useState<"all" | "yeongdeungpo" | "nowon" | "songpa">("all");
  // 분석 뷰: "both" | "daily" (일 혼잡도) | "hourly" (시간 혼잡도)
  const [viewMode, setViewMode] = useState<"both" | "daily" | "hourly">("both");

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchDistrictCongestion();
      setDistricts(data);
    } catch (e) {
      setError("실시간 혼잡도 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 시간대별 차트 결합 데이터 (3개 구 비교용)
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

  if (loading) {
    return (
      <section className={styles.congestionDashboardLoading}>
        <div className={styles.congestionLoaderOrb} />
        <p>영등포 · 노원 · 송파 실시간 도시데이터 및 혼잡도 패턴을 분석하고 있습니다…</p>
      </section>
    );
  }

  if (error || !districts || districts.length === 0) {
    return (
      <section className={styles.congestionDashboardError}>
        <AlertTriangle size={24} color="#EA580C" />
        <p>{error ?? "데이터를 불러올 수 없습니다."}</p>
        <button type="button" onClick={() => loadData()}>다시 시도</button>
      </section>
    );
  }

  const totalZones = districts.reduce((sum, d) => sum + d.zones.length, 0);
  const overallAvg = Math.round(districts.reduce((sum, d) => sum + d.averageScore, 0) / districts.length);
  const mostCrowdedDistrict = districts.reduce((peak, d) => (d.averageScore > peak.averageScore ? d : peak), districts[0]);
  const currentSelectedDistrict = activeTab === "all" ? null : districts.find((d) => d.district.id === activeTab);

  return (
    <section className={styles.congestionSection} aria-labelledby="congestion-dashboard-heading">
      {/* ── 1. Hero Card (거래 운영 디자인 기반) ── */}
      <div className={styles.congestionHeroBanner}>
        <div className={styles.congestionHeroTop}>
          <div className={styles.congestionHeroLeft}>
            <div className={styles.congestionHeroEyebrow}>
              <span className={styles.environmentCodeTag}>ENV·01</span>
              <span className={styles.congestionHeroMetaTag}>REAL-TIME CITYDATA FUSION</span>
              <span className={styles.livePulseBadge}>
                <i className={styles.livePing} />
                <i className={styles.liveDot} />
                실시간 연계 중
              </span>
            </div>
            <h2 id="congestion-dashboard-heading">
              구별 생활 혼잡도 & 인구 유동 분석
            </h2>
            <p className={styles.congestionHeroDesc}>
              <b>영등포구 · 노원구 · 송파구</b> 3개 핵심 자치구의 실시간 핫스팟 인파 지수와 <b>일(요일별) 혼잡도</b> 및 <b>시간대별 유동 패턴</b>을 비교 분석합니다.
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
              <span>{refreshing ? "동기화 중…" : "실시간 새로고침"}</span>
            </button>
            <span className={styles.congestionHeroTimestamp}>
              마지막 수집: {districts[0]?.lastUpdated || "방금 갱신"}
            </span>
          </div>
        </div>

        <div className={styles.congestionHeroKeyStats}>
          <div className={styles.congestionHeroStatCol}>
            <span>모니터링 스팟</span>
            <div className={styles.congestionHeroStatValueRow}>
              <strong>{totalZones}개소</strong>
            </div>
            <small>영등포 4 · 노원 3 · 송파 6 행정 거점</small>
          </div>
          <div className={styles.congestionHeroStatCol}>
            <span>3개 구 평균 혼잡</span>
            <div className={styles.congestionHeroStatValueRow}>
              <strong>{overallAvg}점</strong>
              <span className={`${styles.statBadgePill} ${styles.statBadgeNormal}`}>
                {getCongestionLevelLabel(mostCrowdedDistrict.level)}
              </span>
            </div>
            <small>전일 동시간 대비 정상 범위</small>
          </div>
          <div className={styles.congestionHeroStatCol}>
            <span>최고 혼잡 권역</span>
            <div className={styles.congestionHeroStatValueRow}>
              <span
                className={styles.guBadgePill}
                style={{
                  backgroundColor: `${mostCrowdedDistrict.theme.tagColor}18`,
                  borderColor: `${mostCrowdedDistrict.theme.tagColor}44`,
                  color: mostCrowdedDistrict.theme.tagColor,
                }}
              >
                {mostCrowdedDistrict.district.name}
              </span>
              <strong>{mostCrowdedDistrict.averageScore}점</strong>
            </div>
            <small>실시간 유동 인구 집중 권역 관제</small>
          </div>
        </div>
      </div>

      {/* ── 2. 인터랙티브 탭 & 뷰 모드 컨트롤 바 ── */}
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
              <MapPin size={14} />
              <span>{d.district.name}</span>
              <span
                className={styles.tabBadgeScore}
                style={{ background: d.theme.badgeBg, color: d.theme.badgeText, border: `1px solid ${d.theme.badgeBorder}` }}
              >
                {d.averageScore}점
              </span>
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
            일 혼잡도 (요일별)
          </button>
          <button
            type="button"
            className={viewMode === "hourly" ? styles.toggleActive : styles.toggleBtn}
            onClick={() => setViewMode("hourly")}
          >
            <Clock size={13} />
            시간 혼잡도 (시간대별)
          </button>
        </div>
      </div>

      {/* ── 3. 구별 핵심 메트릭 카드 3열 그리드 ── */}
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
              onKeyDown={(e) => e.key === "Enter" && setActiveTab(d.district.id)}
            >
              <div className={styles.districtCardHead}>
                <div>
                  <span className={styles.districtSubLabel}>{d.district.badge}</span>
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

              {/* 미니 수평 게이지 바 */}
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

      {/* ── 4. [일 혼잡도 분석] 요일별(월~일) 패턴 패널 ── */}
      {(viewMode === "both" || viewMode === "daily") && (
        <article className={styles.analysisPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <span className={styles.panelIconTag}><Calendar size={16} /></span>
              <div>
                <h3>구별 일(요일별) 혼잡도 분석</h3>
                <p>월요일부터 일요일까지 요일별 평균 유동 인파 지수 및 주중/주말 격차를 진단합니다.</p>
              </div>
            </div>
            <span className={styles.panelHeaderBadge}>
              주중 vs 주말 인파 변동 패턴
            </span>
          </div>

          <div className={styles.dailyAnalysisGrid}>
            {(currentSelectedDistrict ? [currentSelectedDistrict] : districts).map((d) => (
              <div key={d.district.id} className={styles.dailyDistrictCol}>
                <div className={styles.dailyDistrictHeader}>
                  <h4>{d.district.name} 요일별 추이</h4>
                  <div className={styles.dailyCompareBadges}>
                    <span>평일 평균 <b>{d.weekdayAvg}점</b></span>
                    <span>주말 평균 <b style={{ color: d.weekendAvg > d.weekdayAvg ? "#EA580C" : "#0284C7" }}>{d.weekendAvg}점</b></span>
                  </div>
                </div>

                {/* 요일별 바 차트 */}
                <div className={styles.dailyBarChart}>
                  {d.dailyTrends.map((dayItem, idx) => (
                    <div key={dayItem.day} className={styles.dailyBarCol}>
                      <span className={styles.dailyBarScore}>{dayItem.score}</span>
                      <div className={styles.dailyBarSlot}>
                        <div
                          className={styles.dailyBarFill}
                          style={{
                            height: `${dayItem.score}%`,
                            background: dayItem.theme.tagColor,
                            animationDelay: `${idx * 60}ms`,
                          }}
                        />
                      </div>
                      <span className={`${styles.dailyBarLabel} ${dayItem.isWeekend ? styles.weekendLabel : ""}`}>
                        {dayItem.day}
                      </span>
                      {dayItem.isPeak && (
                        <span className={styles.dailyPeakIndicator}>최대</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.dailyInsightCard}>
                  <Sparkles size={14} color="#FF6F0F" />
                  <p>
                    {d.district.name}은(는) <b>{d.peakDay}</b>에 가장 붐비며, 주말 유동량이 평일 대비{" "}
                    <b>
                      {d.weekendAvg >= d.weekdayAvg
                        ? `+${d.weekendAvg - d.weekdayAvg}점 증가`
                        : `${d.weekdayAvg - d.weekendAvg}점 안정적`}
                    </b>
                    합니다.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </article>
      )}

      {/* ── 5. [시간 혼잡도 분석] 24시간 타임라인 & 시간대별 추이 ── */}
      {(viewMode === "both" || viewMode === "hourly") && (
        <article className={styles.analysisPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitleGroup}>
              <span className={styles.panelIconTag}><Clock size={16} /></span>
              <div>
                <h3>구별 시간대별 혼잡도 분석 (00시 ~ 22시)</h3>
                <p>출근, 점심, 퇴근·골든타임, 심야 시간대별 인구 밀집 곡선을 실시간으로 비교합니다.</p>
              </div>
            </div>
            <div className={styles.chartLegendGroup}>
              <span className={styles.legendItem}><i style={{ background: "#FF6F0F" }} /> 영등포구</span>
              <span className={styles.legendItem}><i style={{ background: "#0284C7" }} /> 노원구</span>
              <span className={styles.legendItem}><i style={{ background: "#12B76A" }} /> 송파구</span>
            </div>
          </div>

          <div className={styles.hourlyChartContainer}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={combinedHourlyData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorYeongdeungpo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6F0F" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#FF6F0F" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorNowon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorSongpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#12B76A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#12B76A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(200, 205, 197, 0.25)" vertical={false} />
                <XAxis dataKey="hour" tickLine={false} tick={{ fontSize: 11, fill: "#8f968c" }} />
                <YAxis domain={[0, 100]} tickLine={false} tick={{ fontSize: 11, fill: "#8f968c" }} />
                <Tooltip content={<CustomHourlyTooltip />} />
                <Area
                  type="monotone"
                  dataKey="영등포구"
                  stroke="#FF6F0F"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorYeongdeungpo)"
                />
                <Area
                  type="monotone"
                  dataKey="노원구"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorNowon)"
                />
                <Area
                  type="monotone"
                  dataKey="송파구"
                  stroke="#12B76A"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSongpa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 시간대별 주요 이벤트 블록 */}
          <div className={styles.hourlyHighlightsGrid}>
            <div className={styles.hourlyHighlightCard}>
              <span className={styles.highlightBadge}>출근 구간 (08시~10시)</span>
              <strong>영등포(여의도/당산) 밀집</strong>
              <p>환승 거점과 오피스 권역 인구 유입으로 출근 시간대 급상승</p>
            </div>
            <div className={styles.hourlyHighlightCard}>
              <span className={styles.highlightBadge}>점심 구간 (12시~14시)</span>
              <strong>식당가 & 몰 유입</strong>
              <p>타임스퀘어, 롯데월드몰, 노원 상계동 중심 식음료 대기 형성</p>
            </div>
            <div className={styles.hourlyHighlightCard}>
              <span className={styles.highlightBadge}>골든 피크 (18시~20시)</span>
              <strong>3개 구 동시 최고치</strong>
              <p>퇴근길 쇼핑 및 잠실 관광특구, 석촌호수 산책객 집중 피크 구간</p>
            </div>
          </div>
        </article>
      )}

      {/* ── 6. 주요 핫스팟 실시간 모니터링 상세 카드 그리드 ── */}
      <article className={styles.hotspotsPanel}>
        <div className={styles.panelHeader}>
          <div className={styles.panelTitleGroup}>
            <span className={styles.panelIconTag}><Compass size={16} /></span>
            <div>
              <h3>실시간 주요 지점 모니터링 상세 리포트</h3>
              <p>서울시 실시간 도시데이터(인구·보행·체감메시지) 기반 핫스팟별 세부 분석</p>
            </div>
          </div>
          <span className={styles.panelHeaderCount}>
            {districts.flatMap((d) => d.zones).length}개 스팟 모니터링 중
          </span>
        </div>

        <div className={styles.hotspotGridColumns}>
          {(currentSelectedDistrict ? [currentSelectedDistrict] : districts).map((d) => (
            <div key={d.district.id} className={styles.hotspotDistrictGroup}>
              <div className={styles.hotspotGroupHead}>
                <MapPin size={15} style={{ color: d.theme.tagColor }} />
                <h4>{d.district.name} 권역</h4>
                <span>{d.zones.length}개소</span>
              </div>

              <div className={styles.hotspotCardStack}>
                {d.zones.slice(0, 4).map((zone) => {
                  const levelTheme = d.theme;
                  return (
                    <article key={zone.id} className={styles.hotspotDetailCard}>
                      <header className={styles.hotspotCardHeader}>
                        <div>
                          <b className={styles.hotspotName}>{zone.name}</b>
                          <small className={styles.hotspotNeighbor}>{zone.neighborhoodName}</small>
                        </div>
                        <div className={styles.hotspotScoreBox}>
                          <span
                            className={styles.hotspotLevelTag}
                            style={{
                              backgroundColor: levelTheme.badgeBg,
                              color: levelTheme.badgeText,
                              borderColor: levelTheme.badgeBorder,
                            }}
                          >
                            {zone.levelLabel || getCongestionLevelLabel(zone.level)}
                          </span>
                          <strong style={{ color: levelTheme.tagColor }}>{zone.currentScore}점</strong>
                        </div>
                      </header>

                      {/* 인구수 및 프로그레스 바 */}
                      <div className={styles.hotspotMeterRow}>
                        <div className={styles.hotspotMeterTrack}>
                          <div
                            className={styles.hotspotMeterFill}
                            style={{
                              width: `${zone.currentScore}%`,
                              background: levelTheme.tagColor,
                            }}
                          />
                        </div>
                      </div>

                      {zone.summary && (
                        <p className={styles.hotspotSummaryMsg}>{zone.summary}</p>
                      )}

                      {zone.recommendation && (
                        <div className={styles.hotspotDetourTip}>
                          <ArrowUpRight size={13} />
                          <span>우회 추천: {zone.recommendation}</span>
                        </div>
                      )}

                      <footer className={styles.hotspotCardFooter}>
                        {zone.populationMin && zone.populationMax ? (
                          <span className={styles.hotspotPopLabel}>
                            <Users size={11} />
                            약 {zone.populationMin.toLocaleString()}~{zone.populationMax.toLocaleString()}명 체류
                          </span>
                        ) : (
                          <span className={styles.hotspotPopLabel}>실시간 연동</span>
                        )}
                        <time className={styles.hotspotUpdatedTime}>{zone.updatedAt}</time>
                      </footer>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
