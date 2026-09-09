"use client";
import { Database, MapPin } from "lucide-react";
import type { AdminDataStatus } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";
const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;
export default function TradesSection({status}: {status: AdminDataStatus}) {
const maxRegionCount = Math.max(1, ...status.region_counts.map(row => row.transaction_count));

return <>        {<section id="transactions" className={styles.section}>
          <div className={styles.sectionHead}><div><span>DG·02</span><div><p className={styles.eyebrow}>DAANGN TRANSACTION EXPLORER</p><h2>당근 거래 데이터 탐색</h2></div></div><small>지역·카테고리·최근 유입 분리 집계</small></div>
          <div className={styles.integrityGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>지역별 거래 표본</h3><p>상위 12개 행정동</p></div><MapPin size={18} /></div>
              <div className={styles.regionList}>
                {status.region_counts.length ? status.region_counts.map((region) => (
                  <div key={region.region_name}><span>{region.region_name}</span><i><b style={{ width: `${(region.transaction_count / maxRegionCount) * 100}%` }} /></i><strong>{number.format(region.transaction_count)}</strong></div>
                )) : <p className={styles.empty}>지역이 연결된 거래 데이터가 없습니다.</p>}
              </div>
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
          <div className={styles.tablePanel}>
            <div className={styles.panelHead}><div><h3>최근 수집 거래</h3><p>운영 점검용 최신 8건</p></div><span className={styles.healthy}><i /> 오류 {status.recent_errors.length}건</span></div>
            <div className={styles.tableScroll}><table><thead><tr><th>ID</th><th>상품명</th><th>카테고리</th><th>지역</th><th>등록가</th><th>상태</th><th>등록일</th></tr></thead><tbody>
              {status.recent_transactions.map((transaction) => <tr key={transaction.id}><td>#{transaction.id}</td><td><strong>{transaction.product_title}</strong></td><td>{transaction.category}</td><td>{transaction.region_name ?? "미매칭"}</td><td>{money(transaction.price)}</td><td><span className={styles.statusChip}>{transaction.status}</span></td><td>{transaction.listed_at}</td></tr>)}
            </tbody></table></div>
          </div>
        </section>}</>;
}

