"use client";
import { useState } from "react";
import Link from "next/link";
import type { DashboardOverview } from "@/lib/admin/dashboard-api";
import { AdminFilterBar, AdminTable, EmptyState } from "./AdminUI";
import styles from "./portal.module.css";
export function RecentTransactions({ rows }: { rows: DashboardOverview["recent_transactions"] }) {
 const [query, setQuery] = useState("");
 const filtered = rows.filter(row => [row.product_title, row.category, row.region_name, row.status].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
 return <article className={`${styles.card} ${styles.recent}`}><div className={styles.cardHead}><div><h2>최근 수집 데이터</h2><p>최근 8건 · 검색은 표시된 데이터에 적용됩니다.</p></div><AdminFilterBar value={query} onChange={setQuery} /><Link href="/admin/trades">거래 데이터 탐색 ↗</Link></div>{filtered.length ? <AdminTable headers={["상품명", "지역", "카테고리", "등록가", "상태", "수집일"]}>{filtered.map(row => <tr key={row.id}><td>{row.product_title}</td><td>{row.region_name ?? "지역 미확인"}</td><td>{row.category}</td><td>{row.price === null ? "가격 미정" : `${row.price.toLocaleString("ko-KR")}원`}</td><td>{row.status}</td><td>{new Date(row.collected_at).toLocaleDateString("ko-KR")}</td></tr>)}</AdminTable> : <EmptyState message={query ? "검색 결과가 없습니다." : "최근 수집 데이터가 없습니다."} />}</article>;
}
