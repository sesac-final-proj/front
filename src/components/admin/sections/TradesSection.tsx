"use client";
import { Database, MapPin } from "lucide-react";
import type { AdminDataStatus } from "@/services/adminService";
import { SeoulGuMap } from "../SeoulGuMap";
import { ModelMetricsPanel } from "../ModelMetricsPanel";
import styles from "@/app/admin/admin.module.css";
const number = new Intl.NumberFormat("ko-KR");
export default function TradesSection({status}: {status: AdminDataStatus}) {
return <>        {<section id="transactions" className={styles.section}>
          <div className={styles.sectionHead}><div><span>DG·02</span><div><p className={styles.eyebrow}>DAANGN TRANSACTION EXPLORER</p><h2>당근 거래 데이터 탐색</h2></div></div><small>지역·카테고리·최근 유입 분리 집계</small></div>
          <div className={styles.integrityGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>지역별 거래 표본</h3><p>구 탭 선택 → 동별 분포 · 진할수록 거래 많음</p></div><MapPin size={18} /></div>
              {status.region_counts.length ? <SeoulGuMap regionCounts={status.region_counts} /> : <p className={styles.empty}>지역이 연결된 거래 데이터가 없습니다.</p>}
            </article>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>카테고리 구성</h3><p>원천 데이터 기준</p></div><Database size={18} /></div>
              <div className={styles.categoryList}>
                {status.category_counts.map((category, index) => (
                  <div key={category.category}><span>{String(index + 1).padStart(2, "0")}</span><b>{category.category}</b><strong>{number.format(category.transaction_count)}건</strong></div>
                ))}
              </div>
            </article>
          </div>
          <div style={{ marginTop: 12 }}>
            <ModelMetricsPanel />
          </div>
        </section>}</>;
}

