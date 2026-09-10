"use client";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardOverview } from "@/lib/admin/dashboard-api";
import { EmptyState } from "./AdminUI";
import styles from "./portal.module.css";
export function CollectionTrendChart({ data }: { data: DashboardOverview["collection_trend"] }) {
  if (!data.some(row => row.transaction_count)) return <EmptyState message="최근 14일 동안 수집된 거래가 없습니다." />;
  return <div className={styles.chart} role="img" aria-label={data.map(row => `${row.date}: ${row.transaction_count}건`).join(", ")}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 4, left: -22, bottom: 0 }} accessibilityLayer><CartesianGrid vertical={false} stroke="#F0F1ED" /><XAxis dataKey="date" tickFormatter={value => String(value).slice(5).replace("-", ".")} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8b9184" }} minTickGap={12} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8b9184" }} /><Tooltip labelFormatter={label => String(label)} cursor={{ fill: "#F7F7F5" }} /><Bar name="수집 거래" dataKey="transaction_count" fill="#FF9D5B" radius={[4,4,0,0]} maxBarSize={24} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>;
}
// 지금 수집 지역이 이 3개 구뿐이라 탭도 이 3개만 — 구가 늘면 이 목록만 늘리면 됨(SeoulGuMap과 동일 패턴).
const GU_TABS = ["전체", "영등포구", "노원구", "송파구"] as const;
export function TradeStatusCard({ data, dataByGu }: { data: DashboardOverview["trade_status"]; dataByGu: DashboardOverview["trade_status_by_gu"] }) {
 const [tab, setTab] = useState<(typeof GU_TABS)[number]>("전체");
 const rows = tab === "전체" ? data : dataByGu.filter(row => row.gu_name === tab);
 return <article className={styles.card}>
   <div className={styles.cardHead}><div><h2>거래 상태</h2><p>{tab === "전체" ? "누적 수집 거래의 현재 상태" : `${tab} 거래의 현재 상태`}</p></div></div>
   <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
     {GU_TABS.map(t => <button key={t} type="button" onClick={() => setTab(t)} style={{ padding: "5px 11px", borderRadius: 999, fontSize: 11, fontWeight: 550, border: "1px solid #E7E8E5", background: tab === t ? "#FF6F0F" : "#fff", color: tab === t ? "#fff" : "#656b60" }}>{t}</button>)}
   </div>
   <StatusPieChart data={rows.map(row => ({ name: row.status, count: row.transaction_count }))} />
 </article>;
}
// chart.js는 새로 안 깔고 이미 쓰고 있는 recharts의 Pie로 — 애니메이션은 기본 켜짐.
const PIE_COLORS = ["#FF9D5B", "#ADB9A1", "#8FA6C9", "#D9A6C2", "#C9B458", "#9A9FE0"];
export function StatusPieChart({ data }: { data: { name: string; count: number }[] }) {
 if (!data.length) return <EmptyState message="표시할 데이터가 없습니다." />;
 return <div className={styles.chart} role="img" aria-label={data.map(row => `${row.name}: ${row.count}건`).join(", ")}>
   <ResponsiveContainer width="100%" height="100%">
     <PieChart>
       <Pie data={data} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} animationDuration={700}>
         {data.map((row, i) => <Cell key={row.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
       </Pie>
       <Tooltip formatter={(value) => `${Number(value).toLocaleString("ko-KR")}건`} />
       <Legend verticalAlign="bottom" height={28} wrapperStyle={{ fontSize: 11 }} />
     </PieChart>
   </ResponsiveContainer>
 </div>;
}
export function PriceDistributionChart({ data }: { data: DashboardOverview["price_distribution"] }) {
 if (!data.some(row => row.transaction_count)) return <EmptyState message="가격이 있는 거래가 없습니다." />;
 return <article className={styles.card}><div className={styles.cardHead}><div><h2>중고거래 가격 분포</h2><p>가격 보유 거래 기준 · 무료나눔 제외</p></div></div><div className={styles.chart} role="img" aria-label={data.map(row => `${row.label}: ${row.transaction_count}건`).join(", ")}><ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }} accessibilityLayer><CartesianGrid vertical={false} stroke="#F0F1ED" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#656b60" }} interval={0} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8b9184" }} /><Tooltip cursor={{ fill: "#F7F7F5" }} /><Bar name="거래 수" dataKey="transaction_count" fill="#FF9D5B" radius={[4,4,0,0]} maxBarSize={34} isAnimationActive={false} /></BarChart></ResponsiveContainer></div></article>;
}
export function HorizontalBars({ data }: { data: { name: string; count: number }[] }) {
 if (!data.length) return <EmptyState message="표시할 데이터가 없습니다." />;
 return <div className={styles.chart} role="img" aria-label={data.map(row => `${row.name}: ${row.count}건`).join(", ")}><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={data} margin={{ right: 20, left: 0 }} accessibilityLayer><CartesianGrid horizontal={false} stroke="#F0F1ED" /><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#8b9184" }} /><YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 11, fill: "#656b60" }} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: "#F7F7F5" }} /><Bar name="거래 수" dataKey="count" fill="#ADB9A1" radius={[0,4,4,0]} maxBarSize={18} isAnimationActive={false} /></BarChart></ResponsiveContainer></div>;
}
