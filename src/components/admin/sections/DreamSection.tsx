"use client";
import { Database, HeartHandshake, MapPin } from "lucide-react";
import type { AdminDreamStatus } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";
import { PointSummary } from "../PointSummary";
const number = new Intl.NumberFormat("ko-KR");
export default function DreamSection({dream}: {dream: AdminDreamStatus | null}) {


return <><PointSummary />        {dream && <section id="dream" className={styles.section}>
          <div className={styles.sectionHead}><div><span>02</span><div><p className={styles.eyebrow}>DREAM GAJI</p><h2>꿈가지 운영 분석</h2></div></div><small>서울 아동복지시설 실제 원천 기준</small></div>
          <div className={styles.dreamSummary}>
            <div><span>운영 대상 시설</span><strong>{number.format(dream.totalFacilities)}</strong><small>개 시설</small></div>
            <div><span>자치구 커버리지</span><strong>{dream.coveredDistricts}/{dream.configuredDistricts}</strong><small>개 자치구</small></div>
            <div><span>포인트 원장</span><strong>구별 집계</strong><small>위 적립 현황에서 DB 조회 결과 확인</small></div>
          </div>
          <div className={styles.dreamWarning}><HeartHandshake size={20} /><div><b>현재 분석 가능한 범위</b><p>구별 포인트 적립·차감·잔액과 시설 분포를 확인합니다. 포인트 적립과 시설로 집행된 기부금은 별도 지표입니다.</p></div></div>
          <div className={styles.dreamGrid}>
            <article className={styles.panel}><div className={styles.panelHead}><div><h3>자치구별 시설 분포</h3><p>실제 로컬 원천에서 확인된 시설</p></div><MapPin size={18} /></div><div className={styles.dreamBars}>{dream.districts.map((row) => <div key={row.district}><span>{row.district}<small>{row.source}</small></span><i><b style={{ width: `${row.facilityCount / Math.max(...dream.districts.map((item) => item.facilityCount), 1) * 100}%` }} /></i><strong>{number.format(row.facilityCount)}</strong></div>)}</div></article>
            <article className={styles.panel}><div className={styles.panelHead}><div><h3>시설 유형 구성</h3><p>상위 10개 유형</p></div><Database size={18} /></div><div className={styles.dreamTypes}>{dream.facilityTypes.map((row, index) => <div key={row.facilityType}><span>{String(index + 1).padStart(2, "0")}</span><b>{row.facilityType}</b><strong>{number.format(row.count)}개</strong></div>)}</div></article>
          </div>
          <div className={styles.dreamLimitations}><div><p className={styles.eyebrow}>DATA CONTRACT</p><h3>성과 분석 활성화 조건</h3></div><ul>{dream.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul><small>원천: {dream.sourceFiles.join(" · ") || "연결된 파일 없음"}</small></div>
        </section>}</>;
}

