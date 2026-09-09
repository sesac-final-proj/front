import { Database } from "lucide-react";
import type { DashboardOverview } from "@/lib/admin/dashboard-api";
import styles from "./portal.module.css";
export function DataSourceStatus({ source }: { source: DashboardOverview["source"] }) {
 return <article className={`${styles.card} ${styles.source}`}><div className={styles.sourceHeader}><h2>원천 데이터 상태</h2><Database size={19} /></div><div className={styles.sourceHeader}><strong>{source.name}</strong><span>{source.status === "available" ? "데이터 있음" : "수집 대기"}</span></div><dl><div><dt>마지막 수집</dt><dd>{source.last_collected_at ? new Date(source.last_collected_at).toLocaleString("ko-KR") : "수집 기록 없음"}</dd></div><div><dt>집계 범위</dt><dd>내부 당근 수집 거래</dd></div></dl><p>등록가는 판매자가 제시한 가격입니다. 최종 체결가와 다를 수 있습니다. 수집 상태는 저장된 데이터를 기준으로 표시합니다.</p></article>;
}
