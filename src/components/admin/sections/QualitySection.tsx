"use client";
import { AlertTriangle, CheckCircle2, CircleDollarSign, ShieldCheck } from "lucide-react";
import type { AdminDataStatus } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";
const number = new Intl.NumberFormat("ko-KR");
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString("ko-KR") : "수집 기록 없음";
export default function QualitySection({status}: {status: AdminDataStatus}) {
const pricedRate = status.total_transactions ? Math.round(status.priced_transactions / status.total_transactions * 100) : 0;
const regionMatchRate = status.total_transactions ? Math.round((status.total_transactions-status.unmatched_region_transactions)/status.total_transactions*100) : 0;

return <>        {<section id="quality" className={styles.section}>
          <div className={styles.sectionHead}><div><span>DG·03</span><div><p className={styles.eyebrow}>DAANGN DATA CONTROL</p><h2>당근 수집 품질 관리</h2></div></div><small>실제 백엔드 집계 · 오류 레코드 분리</small></div>
          <div className={styles.qualitySummary}>
            <article><span>가격 누락</span><strong>{number.format(status.total_transactions - status.priced_transactions)}</strong><small>전체의 {100 - pricedRate}%</small></article>
            <article><span>지역 미매칭</span><strong>{number.format(status.unmatched_region_transactions)}</strong><small>매칭률 {regionMatchRate}%</small></article>
            <article><span>최근 확인 오류</span><strong>{number.format(status.recent_errors.length)}</strong><small>최신 5건 기준</small></article>
          </div>
          <div className={styles.qualityGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>등록가 분포</h3><p>가격 유효 거래 기준</p></div><CircleDollarSign size={18} /></div>
              <div className={styles.priceBands}>{status.price_band_counts.map((row) => {
                const max = Math.max(1, ...status.price_band_counts.map((item) => item.transaction_count));
                return <div key={row.label}><span>{row.label}</span><i><b style={{ width: `${row.transaction_count / max * 100}%` }} /></i><strong>{number.format(row.transaction_count)}건</strong></div>;
              })}</div>
            </article>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>최근 품질 이슈</h3><p>운영자가 먼저 확인할 레코드</p></div><AlertTriangle size={18} /></div>
              <div className={styles.issueList}>{status.recent_errors.length ? status.recent_errors.map((issue) => <div key={`${issue.occurred_at}-${issue.message}`}><span>{issue.source}</span><b>{issue.message}</b><small>{dateTime(issue.occurred_at)}</small></div>) : <div className={styles.qualityEmpty}><CheckCircle2 size={22} /><b>최근 확인된 수집 오류가 없습니다.</b><span>다음 새로고침에서 다시 점검합니다.</span></div>}</div>
            </article>
          </div>
          <div className={styles.implementationNote}><ShieldCheck size={20} /><div><b>문서 반영 상태</b><p>관리자 인증, 자동 토큰 갱신, <code>/admin/me</code>, 데이터 현황 API는 실제 경로에 연결되어 있습니다. 공지 CRUD와 기부·집행 원장은 아직 API가 없어 운영 수치에서 제외합니다.</p></div></div>
        </section>}</>;
}

