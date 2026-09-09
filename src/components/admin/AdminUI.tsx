import type { ReactNode } from "react";
import { Database, RefreshCw, Search } from "lucide-react";
import styles from "./portal.module.css";

export function AdminPageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className={styles.pageHeader}><div><h1>{title}</h1><p>{description}</p></div>{action}</header>;
}
export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
export function Skeleton() {
  return <div className={styles.skeleton} role="status" aria-label="데이터 불러오는 중"><div className={styles.metrics}>{[1,2,3,4].map(i => <div key={i} />)}</div><div className={styles.skeletonChart} /><span className={styles.srOnly}>불러오는 중</span></div>;
}
export function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return <div className={styles.state} role="alert"><h2>데이터를 불러오지 못했어요</h2><p>{message}</p><button onClick={retry}><RefreshCw size={16} />다시 시도</button></div>;
}
export function EmptyState({ message = "아직 수집된 거래가 없습니다." }: { message?: string }) {
  return <div className={styles.state}><Database size={24} /><p>{message}</p></div>;
}
export function AdminTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className={styles.tableScroll}><table className={styles.table}><thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function AdminFilterBar({ value, onChange, label = "최근 수집 데이터 검색" }: { value: string; onChange: (value: string) => void; label?: string }) {
  return <label className={styles.filter}><Search size={16} /><input aria-label={label} placeholder={label} value={value} onChange={event => onChange(event.target.value)} type="search" /></label>;
}
