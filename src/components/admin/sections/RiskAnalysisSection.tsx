"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Flame,
  Car,
  Construction,
  Ban,
  Waves,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Search,
  RefreshCw,
  TrendingUp,
  Activity,
  Layers,
  Radio,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  fetchAdminRiskAnalysis,
  type RiskAnalysisData,
  type DistrictRiskSummary,
} from "@/services/adminRiskService";
import { useAdminResource } from "../useAdminResource";
import { Skeleton, ErrorState } from "../AdminUI";
import styles from "./risk-analysis.module.css";

const numberFormat = new Intl.NumberFormat("ko-KR");
const percentFormat = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export default function RiskAnalysisSection() {
  const { data, loading, error, retry } = useAdminResource(fetchAdminRiskAnalysis);

  const [selectedGu, setSelectedGu] = useState<string>("영등포구");
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [sortMode, setSortMode] = useState<"score" | "count" | "share" | "name">("score");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Default selection when data loads
  const activeSelectedGu = useMemo(() => {
    if (!data?.districts) return selectedGu;
    const found = data.districts.find((d) => d.district === selectedGu);
    if (found) return selectedGu;
    const highest = data.districts.find((d) => d.signalCount > 0);
    return highest ? highest.district : "영등포구";
  }, [data, selectedGu]);

  // Filter & Sort
  const filteredDistricts = useMemo(() => {
    if (!data?.districts) return [];
    let list = [...data.districts];

    // Filter by tab
    if (activeTab === "ACTIVE") {
      list = list.filter((item) => item.signalCount > 0);
    } else if (activeTab !== "ALL") {
      list = list.filter((item) => item.district === activeTab);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((item) => item.district.toLowerCase().includes(q));
    }

    // Sort
    list.sort((a, b) => {
      if (sortMode === "score") {
        if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
        return b.signalCount - a.signalCount;
      }
      if (sortMode === "count") {
        if (b.signalCount !== a.signalCount) return b.signalCount - a.signalCount;
        return b.riskScore - a.riskScore;
      }
      if (sortMode === "share") {
        if (b.sharePercent !== a.sharePercent) return b.sharePercent - a.sharePercent;
        return b.riskScore - a.riskScore;
      }
      return a.district.localeCompare(b.district, "ko");
    });

    return list;
  }, [data?.districts, activeTab, searchQuery, sortMode]);

  const maxScore = useMemo(() => {
    if (!data?.districts) return 100;
    const scores = data.districts.map((d) => d.riskScore);
    return Math.max(1, ...scores);
  }, [data?.districts]);

  const selectedDistrictData = useMemo(() => {
    if (!data?.districts) return null;
    return (
      data.districts.find((item) => item.district === activeSelectedGu) ??
      data.districts.find((item) => item.signalCount > 0) ??
      data.districts[0]
    );
  }, [data?.districts, activeSelectedGu]);

  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState message={error ?? "위험요소 데이터를 불러오지 못했습니다."} retry={retry} />;

  const urgentCount = data.districts.filter(
    (d) => d.threatLevel === "심각" || d.threatLevel === "경계"
  ).length;

  return (
    <div className={styles.riskWrapper}>
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.headerBadge}>RS·01</span>
          <div>
            <p className={styles.eyebrow}>REAL-TIME SAFETY & RISK FACTOR INTELLIGENCE</p>
            <h2 className={styles.headerTitle}>위험요소 및 안전신호 분석</h2>
          </div>
        </div>
        <small className={styles.headerSubtitle}>
          서울안전누리 재난안전 피드 · 25개 자치구 실시간 교차 분석
        </small>
      </div>

      {/* 5-Column KPI Metric Cards */}
      <div className={styles.kpiGrid}>
        <article className={`${styles.kpiCard} ${styles.kpiDanger}`}>
          <span>총 감지 위험신호</span>
          <strong>{numberFormat.format(data.totalSignals)}건</strong>
          <small>서울시 전역 실시간 수집</small>
        </article>
        <article className={styles.kpiCard}>
          <span>최다 발생 자치구</span>
          <strong>{data.highestRiskDistrict}</strong>
          <small>위험 스코어 1위</small>
        </article>
        <article className={styles.kpiCard}>
          <span>주요 위험 유형</span>
          <strong>{data.primaryRiskLabel}</strong>
          <small>
            점유율 {data.typeDistribution[0] ? percentFormat.format(data.typeDistribution[0].percent) : "0"}%
          </small>
        </article>
        <article className={styles.kpiCard}>
          <span>긴급 대응 구역</span>
          <strong>
            {urgentCount}개 구 <span style={{ fontSize: "13px", fontWeight: 500, color: "#a83232" }}>(심각/경계)</span>
          </strong>
          <small>즉각 모니터링 대상</small>
        </article>
        <article className={styles.kpiCard}>
          <span>위험 감지 자치구</span>
          <strong>
            {data.activeDistrictsCount} / {data.analyzedDistrictsCount}개 구
          </strong>
          <small>서울 25개 자치구 커버리지</small>
        </article>
      </div>

      {/* Live Alert & Status Banner */}
      <div className={styles.liveBanner}>
        <div className={styles.liveBannerLeft}>
          <div className={styles.pulseDot} />
          <div>
            <b>서울안전누리 & 실시간 도시데이터 위험 피드 활성화</b>
            <p>
              동네생활 및 직거래 안전을 위해 화재, 교통사고, 도로통제, 침수, 시설고장 등의 위험신호를 구별로 분석하고 거래 주의보를 연계합니다. (수집 시각: {data.collectedAt})
            </p>
          </div>
        </div>
        <button type="button" className={styles.liveRefreshBtn} onClick={retry}>
          <RefreshCw size={13} /> 실시간 재수집
        </button>
      </div>

      {/* 2-Column Main Analysis Grid */}
      <div className={styles.mainGrid}>
        {/* Left Column: District Risk Share & Threat Explorer */}
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>자치구별 위험신호 점유율 & 위협 지수</h3>
              <p>구 탭 선택 → 구별 위험 스코어, 발생 건수 및 서울 전체 대비 % 점유율 분석</p>
            </div>
            <MapPin size={18} aria-hidden="true" />
          </div>

          {/* Quick Filter Tabs */}
          <div className={styles.tabRow}>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "ALL" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("ALL")}
            >
              전체 자치구 <span className={styles.tabCounter}>25</span>
            </button>
            <button
              type="button"
              className={`${styles.tabButton} ${activeTab === "ACTIVE" ? styles.tabButtonActive : ""}`}
              onClick={() => setActiveTab("ACTIVE")}
            >
              위험 감지 구 <span className={styles.tabCounter}>{data.activeDistrictsCount}</span>
            </button>
            {["영등포구", "송파구", "노원구", "강남구", "마포구"].map((gu) => {
              const d = data.districts.find((item) => item.district === gu);
              return (
                <button
                  key={gu}
                  type="button"
                  className={`${styles.tabButton} ${activeTab === gu ? styles.tabButtonActive : ""}`}
                  onClick={() => {
                    setActiveTab(gu);
                    setSelectedGu(gu);
                  }}
                >
                  {gu}
                  {d && d.signalCount > 0 && (
                    <span className={styles.tabCounter}>{d.signalCount}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Sort Toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchBox}>
              <Search size={14} color="#8a9085" />
              <input
                type="text"
                placeholder="자치구 검색 (예: 영등포구)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="자치구 검색"
              />
            </div>
            <select
              className={styles.sortSelect}
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as any)}
              aria-label="정렬 기준"
            >
              <option value="score">위험 스코어순</option>
              <option value="count">위험신호 건수순</option>
              <option value="share">위험 점유율순 (%)</option>
              <option value="name">자치구명 (가나다)</option>
            </select>
          </div>

          {/* District List with % Share Bars */}
          <div className={styles.districtList}>
            {filteredDistricts.length > 0 ? (
              filteredDistricts.map((row, index) => {
                const isSelected = activeSelectedGu === row.district;
                const barWidth = row.riskScore > 0
                  ? Math.max(8, (row.riskScore / maxScore) * 100)
                  : 4;

                let threatClass = styles.threatGood;
                if (row.threatLevel === "심각") threatClass = styles.threatSevere;
                else if (row.threatLevel === "경계") threatClass = styles.threatWarning;
                else if (row.threatLevel === "주의") threatClass = styles.threatCaution;

                return (
                  <div
                    key={row.district}
                    className={`${styles.districtRow} ${isSelected ? styles.districtRowSelected : ""}`}
                    onClick={() => setSelectedGu(row.district)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") setSelectedGu(row.district);
                    }}
                  >
                    <span className={styles.rankBadge}>{String(index + 1).padStart(2, "0")}</span>
                    <div className={styles.districtMeta}>
                      <div className={styles.districtNameRow}>
                        <span className={styles.districtName}>{row.district}</span>
                        <span className={`${styles.threatBadge} ${threatClass}`}>
                          {row.threatLevel}
                        </span>
                      </div>
                    </div>

                    <div className={styles.barWrapper}>
                      <div className={styles.barTrack}>
                        <div
                          className={row.signalCount > 0 ? styles.barFill : styles.barFillGood}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <div className={styles.barSubtext}>
                        <span>
                          {row.primaryVisual.emoji} {row.primaryVisual.label}
                        </span>
                        <span>{row.signalCount > 0 ? `${row.signalCount}건 감지` : "정상"}</span>
                      </div>
                    </div>

                    <div className={styles.valueContainer}>
                      <span
                        className={`${styles.percentChip} ${row.sharePercent === 0 ? styles.percentChipZero : ""}`}
                      >
                        {percentFormat.format(row.sharePercent)}%
                      </span>
                      <span className={styles.countReadout}>{row.riskScore}점</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#777d72", fontSize: "12px", textAlign: "center", padding: "24px 0" }}>
                일치하는 자치구가 없습니다.
              </p>
            )}
          </div>
        </article>

        {/* Right Column: Selected District Diagnostic & Signal Feed */}
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <h3>선택 자치구 위험요소 정밀 진단</h3>
              <p>선택된 자치구의 위협 요인 구성 및 실시간 감지 피드</p>
            </div>
            <ShieldAlert size={18} aria-hidden="true" />
          </div>

          {/* Selected District Spotlight */}
          {selectedDistrictData && (
            <div className={styles.spotlightCard}>
              <div className={styles.spotlightHead}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={styles.spotlightGu}>{selectedDistrictData.district}</span>
                  <span style={{ fontSize: "11px", color: "#b8beb3" }}>실시간 안전 스포트라이트</span>
                </div>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background:
                      selectedDistrictData.threatLevel === "심각"
                        ? "#e02424"
                        : selectedDistrictData.threatLevel === "경계"
                        ? "#df5900"
                        : selectedDistrictData.threatLevel === "주의"
                        ? "#a16207"
                        : "#03543f",
                    color: "#ffffff",
                  }}
                >
                  {selectedDistrictData.threatLevel} 등급
                </span>
              </div>

              <div className={styles.spotlightMetrics}>
                <div className={styles.spotlightMetricItem}>
                  <span>서울 위험 점유율</span>
                  <strong>{percentFormat.format(selectedDistrictData.sharePercent)}%</strong>
                  <small>전체 신호 대비</small>
                </div>
                <div className={styles.spotlightMetricItem}>
                  <span>종합 위험 스코어</span>
                  <strong>{selectedDistrictData.riskScore}점</strong>
                  <small>위협 가중치 환산</small>
                </div>
                <div className={styles.spotlightMetricItem}>
                  <span>감지 신호 건수</span>
                  <strong>{selectedDistrictData.signalCount}건</strong>
                  <small>
                    {selectedDistrictData.latestSignalTime
                      ? `${selectedDistrictData.latestSignalTime} 수신`
                      : "최근 이력 없음"}
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Tone Category Distribution Pills */}
          <div className={styles.typeGrid}>
            {data.typeDistribution.slice(0, 4).map((type) => (
              <div key={type.tone} className={styles.typeCard}>
                <div className={styles.typeCardLeft}>
                  <span className={styles.typeEmoji}>{type.emoji}</span>
                  <b>{type.label}</b>
                </div>
                <strong>
                  {type.count}건 ({percentFormat.format(type.percent)}%)
                </strong>
              </div>
            ))}
          </div>

          {/* Real-Time Signal Feed */}
          <div className={styles.feedHeader}>
            <span>관내 실시간 위험신호 피드</span>
            <span style={{ fontSize: "10px", color: "#8a9085", fontWeight: 500 }}>
              {selectedDistrictData?.signals.length ?? 0}개 수신됨
            </span>
          </div>

          <div className={styles.signalFeed}>
            {selectedDistrictData && selectedDistrictData.signals.length > 0 ? (
              selectedDistrictData.signals.map((sig) => (
                <div
                  key={sig.id}
                  className={styles.signalCard}
                  style={{
                    borderLeftColor:
                      sig.tone === "fire"
                        ? "#e02424"
                        : sig.tone === "accident"
                        ? "#df5900"
                        : sig.tone === "flood"
                        ? "#1c64f2"
                        : sig.tone === "control"
                        ? "#9061f9"
                        : "#4b5563",
                  }}
                >
                  <div className={styles.signalCardHeader}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>{sig.visual.emoji}</span>
                      <span className={styles.signalTitle}>{sig.name}</span>
                    </div>
                    <span className={styles.signalTime}>{sig.observedAtFormatted}</span>
                  </div>
                  <p className={styles.signalSummary}>{sig.summary}</p>
                </div>
              ))
            ) : (
              <p style={{ color: "#777d72", fontSize: "11px", textAlign: "center", padding: "20px 0" }}>
                현재 {selectedDistrictData?.district} 내 감지된 위험신호가 없습니다. (안전 상태)
              </p>
            )}
          </div>
        </article>
      </div>

      {/* Comprehensive Seoul Risk Matrix Table */}
      <section className={styles.tablePanel}>
        <div className={styles.panelHead}>
          <div>
            <h3>서울시 25개 자치구 위험요소 및 안전신호 상세 명세</h3>
            <p>실시간 안전누리 수집 데이터와 자치구별 기여 위험도 종합 지표</p>
          </div>
          <TrendingUp size={18} aria-hidden="true" />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th style={{ width: "48px" }}>순위</th>
                <th>자치구</th>
                <th>위협 등급</th>
                <th style={{ minWidth: "160px" }}>위험 점유율 (%)</th>
                <th style={{ textAlign: "right" }}>위험 스코어</th>
                <th style={{ textAlign: "right" }}>감지 건수</th>
                <th>주요 위협 요인</th>
                <th>최근 감지 시각</th>
                <th>권장 운영 조치</th>
              </tr>
            </thead>
            <tbody>
              {data.districts.map((row, idx) => {
                let threatClass = styles.threatGood;
                let actionText = "정상 운영";
                if (row.threatLevel === "심각") {
                  threatClass = styles.threatSevere;
                  actionText = "직거래 장소 변경 권고 · 안전 알림 발송";
                } else if (row.threatLevel === "경계") {
                  threatClass = styles.threatWarning;
                  actionText = "교통 서행 안내 · 우회로 노출";
                } else if (row.threatLevel === "주의") {
                  threatClass = styles.threatCaution;
                  actionText = "동네 보행 주의보 표출";
                }

                return (
                  <tr
                    key={row.district}
                    style={{
                      background: activeSelectedGu === row.district ? "#fff8f7" : undefined,
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedGu(row.district)}
                  >
                    <td style={{ color: "#8b9185", fontFamily: "ui-monospace, monospace" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className={styles.districtCell}>{row.district}</td>
                    <td>
                      <span className={`${styles.threatBadge} ${threatClass}`}>
                        {row.threatLevel}
                      </span>
                    </td>
                    <td>
                      <div className={styles.shareCell}>
                        <div className={styles.shareMiniTrack}>
                          <div
                            className={styles.shareMiniFill}
                            style={{
                              width: `${Math.max(0, row.sharePercent)}%`,
                              background:
                                row.threatLevel === "심각"
                                  ? "#e02424"
                                  : row.threatLevel === "경계"
                                  ? "#df5900"
                                  : "#6b7280",
                            }}
                          />
                        </div>
                        <span
                          className={`${styles.percentChip} ${row.sharePercent === 0 ? styles.percentChipZero : ""}`}
                          style={{ padding: "1px 5px", fontSize: "10px" }}
                        >
                          {percentFormat.format(row.sharePercent)}%
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "ui-monospace, monospace",
                        fontWeight: 700,
                        color: row.riskScore >= 45 ? "#d71913" : undefined,
                      }}
                    >
                      {row.riskScore}점
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
                      {row.signalCount}건
                    </td>
                    <td>
                      {row.primaryVisual.emoji} {row.primaryVisual.label}
                    </td>
                    <td style={{ color: "#777d72", fontSize: "10px" }}>
                      {row.latestSignalTime ?? "-"}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          color: row.threatLevel === "심각" ? "#c81e1e" : "#555b50",
                        }}
                      >
                        {actionText}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Operational Safety Protocols Panel */}
      <div className={styles.guidePanel}>
        <div>
          <p className={styles.eyebrow} style={{ color: "#ff7b72" }}>
            SAFETY PROTOCOL
          </p>
          <h3>당근 로컬 안전 및 거래보호 운영 가이드</h3>
        </div>
        <ul>
          <li>
            <b>화재 / 침수 심각 구역</b>: 해당 자치구 내 직거래 시 야외 공공장소 대신 안전이 확보된 실내 거점(주민센터, 지하철 역사 내 지정 스팟)을 우선 추천합니다.
          </li>
          <li>
            <b>교통사고 / 도로통제 경계 구역</b>: 동네지도에 실시간 통제 배지를 노출하고, 거래 약속 시 이동 지연 가능성 안내 메시지를 발송합니다.
          </li>
          <li>
            <b>가스배관 및 도로공사 주의 구역</b>: 야간 보행 안전을 위해 조명이 밝은 거래 핫스팟으로 안내를 유도합니다.
          </li>
        </ul>
        <small>데이터 출처: 서울안전누리 · 서울시 실시간 도시데이터 API</small>
      </div>
    </div>
  );
}
