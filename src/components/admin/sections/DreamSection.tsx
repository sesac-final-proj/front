"use client";

import { useMemo, useState } from "react";
import { Database, HeartHandshake, MapPin, Award, ChevronRight } from "lucide-react";
import type { AdminDreamStatus } from "@/services/adminService";
import { adminAuthorizedFetch } from "@/services/adminService";
import { useAdminResource } from "../useAdminResource";
import { Skeleton, ErrorState } from "../AdminUI";
import SeoulDistrictMap, { type DistrictStat } from "../SeoulDistrictMap";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const percentFormat = new Intl.NumberFormat("ko-KR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

interface PointSummaryData {
  earned: number;
  deducted: number;
  balance: number;
  basis: string;
  caveat: string;
  districts: {
    district: string;
    earned: number;
    deducted: number;
    balance: number;
    entries: number;
    users: number;
  }[];
}

async function loadPoints(): Promise<PointSummaryData> {
  const response = await adminAuthorizedFetch("/api/v1/admin/point-summary");
  if (!response.ok) throw new Error("포인트 원장을 불러오지 못했습니다.");
  return response.json();
}

const SEOUL_25_GU = [
  "강남구", "강동구", "강북구", "강서구", "관악구",
  "광진구", "구로구", "금천구", "노원구", "도봉구",
  "동대문구", "동작구", "마포구", "서대문구", "서초구",
  "성동구", "성북구", "송파구", "양천구", "영등포구",
  "용산구", "은평구", "종로구", "중구", "중랑구"
];

export default function DreamSection({ dream }: { dream: AdminDreamStatus | null }) {
  const { data: pointsData, loading, error, retry } = useAdminResource(loadPoints);
  const [selectedGu, setSelectedGu] = useState<string>("영등포구");

  // Combine Point Ledger with Welfare Facility data
  const districtAnalytics = useMemo<DistrictStat[]>(() => {
    const totalEarned = pointsData?.earned ?? 0;
    const totalBalance = pointsData?.balance ?? 0;
    const totalFacilities = dream?.totalFacilities ?? 0;

    const pointsByGu = new Map<string, { earned: number; deducted: number; balance: number }>();
    if (pointsData?.districts) {
      for (const row of pointsData.districts) {
        pointsByGu.set(row.district, row);
      }
    }

    const facilitiesByGu = new Map<string, { facilityCount: number; source: string }>();
    if (dream?.districts) {
      for (const row of dream.districts) {
        facilitiesByGu.set(row.district, row);
      }
    }

    const allGuNames = new Set<string>(SEOUL_25_GU);
    pointsByGu.forEach((_, gu) => allGuNames.add(gu));

    const list: DistrictStat[] = Array.from(allGuNames).map((gu) => {
      const p = pointsByGu.get(gu) ?? { earned: 0, deducted: 0, balance: 0 };
      const f = facilitiesByGu.get(gu) ?? { facilityCount: 0, source: "원천 기준" };
      const earnedShare = totalEarned > 0 ? (p.earned / totalEarned) * 100 : 0;
      const balanceShare = totalBalance > 0 ? (p.balance / totalBalance) * 100 : 0;
      const facilityShare = totalFacilities > 0 ? (f.facilityCount / totalFacilities) * 100 : 0;

      return {
        district: gu,
        earned: p.earned,
        deducted: p.deducted,
        balance: p.balance,
        facilityCount: f.facilityCount,
        earnedShare,
        balanceShare,
        facilityShare,
        isActive: p.earned > 0,
      };
    });

    // Sort by earned share (%) descending
    list.sort((a, b) => {
      if (b.earnedShare !== a.earnedShare) return b.earnedShare - a.earnedShare;
      if (b.earned !== a.earned) return b.earned - a.earned;
      return b.facilityCount - a.facilityCount;
    });

    return list;
  }, [pointsData, dream]);

  // Selected Gu data
  const selectedDistrictData = useMemo(() => {
    return (
      districtAnalytics.find((d) => d.district === selectedGu) ??
      districtAnalytics[0] ?? {
        district: selectedGu,
        earned: 0,
        deducted: 0,
        balance: 0,
        facilityCount: 0,
        earnedShare: 0,
        balanceShare: 0,
        facilityShare: 0,
        isActive: false,
      }
    );
  }, [districtAnalytics, selectedGu]);

  const selectedRank = useMemo(() => {
    const idx = districtAnalytics.findIndex((d) => d.district === selectedGu);
    return idx >= 0 ? idx + 1 : "-";
  }, [districtAnalytics, selectedGu]);

  if (loading) return <Skeleton />;
  if (error || !pointsData) return <ErrorState message={error ?? "데이터를 불러오지 못했습니다."} retry={retry} />;

  return (
    <section id="dream" className={styles.section}>
      {/* Section Head: DG·04 */}
      <div className={styles.sectionHead}>
        <div>
          <span>DG·04</span>
          <div>
            <p className={styles.eyebrow}>DREAM GAJI & WELFARE SHARING</p>
            <h2>꿈가지 나눔 및 구별 적립 분석</h2>
          </div>
        </div>
        <small>포인트 원장 실시간 집계 · 25개 자치구 아동복지시설 연계 현황</small>
      </div>

      {/* 3-Column Summary Bar */}
      <div className={styles.dreamSummary}>
        <div>
          <span>누적 적립 포인트</span>
          <strong>{number.format(pointsData.earned)} P</strong>
          <small>거래 결제 자동 적립 원장 기준</small>
        </div>
        <div>
          <span>누적 차감 (기부 집행)</span>
          <strong>{number.format(pointsData.deducted)} P</strong>
          <small>아동시설 기부 및 차감 집행액</small>
        </div>
        <div>
          <span>현재 가용 잔여 포인트</span>
          <strong style={{ color: "#df5900" }}>{number.format(pointsData.balance)} P</strong>
          <small>서울 전역 412개 아동시설 연계 지원 풀</small>
        </div>
      </div>

      {/* Warning/Guide Banner */}
      <div className={styles.dreamWarning}>
        <HeartHandshake size={20} />
        <div>
          <b>구별 꿈가지 점유율 분석 기준</b>
          <p>
            중고거래 송금(0.1%) 및 QR결제(1%)로 적립된 꿈방울 원장을 기준으로 25개 자치구별 기여 점유율(%)을 산출합니다.
            지도의 자치구를 클릭하면 오른쪽 표에 해당 구의 세부 정보가 실시간으로 표시됩니다.
          </p>
        </div>
      </div>

      {/* 2-Column Main Grid: Interactive Map (Left) + Dynamic Details Table (Right) */}
      <div className={styles.dreamGrid} style={{ gridTemplateColumns: "1.15fr 0.85fr", gap: "16px" }}>
        {/* Left Panel: 서울시 25개 자치구 동적 지도 (당근 정합성 테마) */}
        <article className={`${styles.panel} ${styles.districtDetailPanel}`}>
          <div className={styles.panelHead}>
            <div>
              <h3>서울시 25개 자치구 꿈가지 동적 지도</h3>
              <p>자치구를 클릭하면 오른쪽 표에 해당 구의 상세 데이터가 실시간 표시됩니다</p>
            </div>
            <MapPin size={18} />
          </div>

          <div style={{ marginTop: "14px" }}>
            <SeoulDistrictMap
              selectedGu={selectedGu}
              onSelectGu={(gu) => setSelectedGu(gu)}
              districtAnalytics={districtAnalytics}
            />
          </div>
        </article>

        {/* Right Panel: 누르면 정보가 오른쪽 표에 보여주는 동적 표 */}
        <article className={styles.panel}>
          <div className={styles.panelHead}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 800,
                    background: "#FFE9DA",
                    color: "#DF5900",
                  }}
                >
                  {selectedDistrictData.district}
                </span>
                <span style={{ fontSize: "11px", color: "#777D72", fontWeight: 600 }}>
                  서울 {selectedRank}위 ({selectedDistrictData.earnedShare > 0 ? "원장 활성" : "적립 대기"})
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "15px" }}>자치구 적립·시설 현황</h3>
              <p style={{ margin: "4px 0 0", fontSize: "9px", color: "#777D72" }}>
                지도에서 선택한 지역의 적립, 집행, 복지시설 현황입니다.
              </p>
            </div>
            <Database size={18} />
          </div>

          {/* 동적 정보 표 (Dynamic Table) */}
          <div style={{ marginTop: "14px", overflowX: "auto" }}>
            <table
              className={styles.districtDetailTable}
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
                border: "1px solid #E7E8E5",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <tbody>
                <tr style={{ borderBottom: "1px solid #EFECE6", background: "#FAF9F6" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700, width: "38%" }}>
                    자치구명
                  </th>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: "#1A1C20" }}>
                    {selectedDistrictData.district}
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #EFECE6" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700 }}>
                    꿈가지 점유율 (%)
                  </th>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ color: "#DF5900", fontSize: "13px", fontFamily: "ui-monospace, monospace" }}>
                        {percentFormat.format(selectedDistrictData.earnedShare)}%
                      </strong>
                      <div style={{ flex: 1, height: "6px", background: "#EAE7E0", borderRadius: "3px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${Math.min(100, Math.max(selectedDistrictData.earnedShare > 0 ? 5 : 0, selectedDistrictData.earnedShare))}%`,
                            background: "#FF6F0F",
                          }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #EFECE6", background: "#FAF9F6" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700 }}>
                    누적 적립 포인트
                  </th>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>
                    {number.format(selectedDistrictData.earned)} P
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #EFECE6" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700 }}>
                    누적 기부 집행액
                  </th>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, monospace" }}>
                    {number.format(selectedDistrictData.deducted)} P
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #EFECE6", background: "#FAF9F6" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700 }}>
                    현재 가용 잔여액
                  </th>
                  <td style={{ padding: "10px 12px", fontFamily: "ui-monospace, monospace", fontWeight: 800, color: "#DF5900" }}>
                    {number.format(selectedDistrictData.balance)} P
                  </td>
                </tr>
                <tr style={{ borderBottom: "1px solid #EFECE6" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700 }}>
                    관내 아동복지시설
                  </th>
                  <td style={{ padding: "10px 12px", fontWeight: 700 }}>
                    {number.format(selectedDistrictData.facilityCount)}개소{" "}
                    <small style={{ color: "#777D72", fontWeight: 500 }}>
                      (서울의 {percentFormat.format(selectedDistrictData.facilityShare)}%)
                    </small>
                  </td>
                </tr>
                <tr>
                  <th style={{ padding: "10px 12px", textAlign: "left", color: "#656B60", fontWeight: 700 }}>
                    연계 지원 상태
                  </th>
                  <td style={{ padding: "10px 12px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 7px",
                        borderRadius: "999px",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        background: selectedDistrictData.earned > 0 ? "#EAF5EE" : "#F4F3EF",
                        color: selectedDistrictData.earned > 0 ? "#276C4D" : "#7D827C",
                      }}
                    >
                      {selectedDistrictData.earned > 0 ? "원장 실시간 적립 연동" : "거래 결제 적립 대기"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 아동복지시설 유형 구성 미니 표 */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <strong style={{ fontSize: "11px", color: "#2E332B" }}>아동복지시설 유형</strong>
              <small style={{ color: "#8A9085", fontSize: "9px" }}>총 {dream?.totalFacilities || 412}개소</small>
            </div>
            <div className={styles.dreamTypes} style={{ marginTop: 0 }}>
              {dream?.facilityTypes && dream.facilityTypes.slice(0, 5).map((row, index) => {
                const totalFacilities = dream.totalFacilities || 1;
                const typePct = (row.count / totalFacilities) * 100;
                return (
                  <div key={row.facilityType} style={{ padding: "7px 0", fontSize: "10px" }}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                    <b title={row.facilityType}>{row.facilityType.replace(/^\([^)]*\)\s*/, "")}</b>
                    <strong style={{ fontFamily: "ui-monospace, monospace" }}>
                      {number.format(row.count)}개 ({percentFormat.format(typePct)}%)
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </div>

      {/* Full-width Comprehensive Table Panel */}
      <article className={styles.tablePanel}>
        <div className={styles.panelHead}>
          <div>
            <h3>구별 꿈가지 적립 및 아동시설 연계 상세 명세</h3>
            <p>지도에서 클릭한 자치구가 하이라이트됩니다 · 25개 자치구 교차 집계표</p>
          </div>
          <Award size={18} />
        </div>

        <div className={styles.tableScroll}>
          <table>
            <thead>
              <tr>
                <th style={{ width: "45px" }}>순위</th>
                <th>자치구</th>
                <th style={{ minWidth: "180px" }}>꿈가지 점유율 (%)</th>
                <th style={{ textAlign: "right" }}>누적 적립 (P)</th>
                <th style={{ textAlign: "right" }}>누적 차감 (P)</th>
                <th style={{ textAlign: "right" }}>현재 잔액 (P)</th>
                <th style={{ textAlign: "right" }}>관내 아동시설</th>
              </tr>
            </thead>
            <tbody>
              {districtAnalytics.map((row, idx) => {
                const isSelected = selectedGu === row.district;
                return (
                  <tr
                    key={row.district}
                    onClick={() => setSelectedGu(row.district)}
                    style={{
                      background: isSelected ? "#FFF6EE" : undefined,
                      cursor: "pointer",
                      borderLeft: isSelected ? "3px solid #DF5900" : undefined,
                    }}
                  >
                    <td style={{ fontFamily: "ui-monospace, monospace", color: idx < 3 ? "#df5900" : "#858a84" }}>
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td style={{ fontWeight: isSelected ? 800 : 600, color: isSelected ? "#DF5900" : "#1A1C20" }}>
                      {row.district}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ flex: 1, height: "8px", background: "#eeece6", borderRadius: "2px", overflow: "hidden" }}>
                          <div
                            style={{
                              height: "100%",
                              width: `${Math.min(100, Math.max(row.earnedShare > 0 ? 4 : 0, row.earnedShare))}%`,
                              background: row.earnedShare > 0 ? "#ff6f0f" : "#eeece6",
                            }}
                          />
                        </div>
                        <span
                          style={{
                            width: "48px",
                            textAlign: "right",
                            fontFamily: "ui-monospace, monospace",
                            fontWeight: 700,
                            fontSize: "10px",
                            color: row.earnedShare > 0 ? "#df5900" : "#858a84",
                          }}
                        >
                          {percentFormat.format(row.earnedShare)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace", fontWeight: 600 }}>
                      {number.format(row.earned)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
                      {number.format(row.deducted)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontFamily: "ui-monospace, monospace",
                        fontWeight: 700,
                        color: row.balance > 0 ? "#df5900" : undefined,
                      }}
                    >
                      {number.format(row.balance)}
                    </td>
                    <td style={{ textAlign: "right", fontFamily: "ui-monospace, monospace" }}>
                      {number.format(row.facilityCount)}개소
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </article>

      {/* Data Contract */}
      {dream && (
        <div className={styles.dreamLimitations}>
          <div>
            <p className={styles.eyebrow} style={{ color: "#ff9a57" }}>DATA CONTRACT</p>
            <h3>성과 분석 활성화 조건</h3>
          </div>
          <ul>
            {dream.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
          <small>원천: {dream.sourceFiles.join(" · ") || "연결된 파일 없음"}</small>
        </div>
      )}
    </section>
  );
}
