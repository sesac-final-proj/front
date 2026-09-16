"use client";

import { useCallback } from "react";
import { Building2, Gauge, House, TrendingUp } from "lucide-react";
import { getRentTransactions } from "@/services/realEstateService";
import type { RentTransaction } from "@/types/realEstate";
import { AdminTable, ErrorState, Skeleton } from "../AdminUI";
import { useAdminResource } from "../useAdminResource";
import styles from "./real-estate-analysis.module.css";

const DISTRICTS = ["송파구", "영등포구", "노원구"];

interface DongActivity {
  district: string;
  dong: string;
  recent: number;
  previous: number;
  properties: number;
  momentum: number;
  score: number;
}

function analyze(items: RentTransaction[]): DongActivity[] {
  const latest = Math.max(...items.map((item) => Date.parse(item.contractDate)).filter(Number.isFinite));
  if (!Number.isFinite(latest)) return [];
  const recentStart = latest - 89 * 86400000;
  const previousStart = recentStart - 90 * 86400000;
  const groups = new Map<string, { district: string; dong: string; recent: RentTransaction[]; previous: number }>();

  items.forEach((item) => {
    const date = Date.parse(item.contractDate);
    if (!Number.isFinite(date) || date < previousStart) return;
    const key = `${item.district}|${item.dong}`;
    const group = groups.get(key) ?? { district: item.district, dong: item.dong, recent: [], previous: 0 };
    if (date >= recentStart) group.recent.push(item);
    else group.previous += 1;
    groups.set(key, group);
  });

  const rows = [...groups.values()].map((group) => ({
    district: group.district,
    dong: group.dong,
    recent: group.recent.length,
    previous: group.previous,
    properties: new Set(group.recent.map((item) => `${item.address}|${item.buildingName ?? ""}`)).size,
    momentum: group.previous ? ((group.recent.length - group.previous) / group.previous) * 100 : group.recent.length ? 100 : 0,
    score: 0,
  }));
  const maxRecent = Math.max(1, ...rows.map((row) => row.recent));
  const maxProperties = Math.max(1, ...rows.map((row) => row.properties));
  rows.forEach((row) => {
    const momentumScore = Math.max(0, Math.min(1, (row.momentum + 100) / 200));
    row.score = Math.round((row.recent / maxRecent * 0.45 + row.properties / maxProperties * 0.3 + momentumScore * 0.25) * 100);
  });
  return rows.sort((a, b) => b.score - a.score || b.recent - a.recent);
}

async function load() {
  const responses = await Promise.all(DISTRICTS.map((district) => getRentTransactions({
    district,
    rentType: "all",
    houseType: "all",
    limit: 300,
  })));
  const items = responses.flatMap((response) => response.items);
  return {
    rows: analyze(items),
    total: items.length,
    source: responses.some((response) => response.source === "seoul_open_data") ? "서울시 열린데이터광장" : "서울시 샘플 데이터",
  };
}

export default function RealEstateAnalysisSection() {
  const loader = useCallback(load, []);
  const { data, loading, error, retry } = useAdminResource(loader);
  if (loading) return <Skeleton />;
  if (error || !data) return <ErrorState message={error || "부동산 분석 데이터를 불러오지 못했습니다."} retry={retry} />;

  const leader = data.rows[0];
  const mostListings = [...data.rows].sort((a, b) => b.properties - a.properties)[0];
  const mostDeals = [...data.rows].sort((a, b) => b.recent - a.recent)[0];
  const fastest = [...data.rows].sort((a, b) => b.momentum - a.momentum)[0];

  return (
    <section className={styles.workspace}>
      <div className={styles.metrics} aria-label="부동산 핵심 지표">
        <article><House size={18} /><span>매물처가 많은 곳</span><strong>{mostListings?.dong ?? "-"}</strong><small>최근 90일 고유 주소 {mostListings?.properties ?? 0}곳</small></article>
        <article><Building2 size={18} /><span>거래가 많은 곳</span><strong>{mostDeals?.dong ?? "-"}</strong><small>최근 90일 계약 {mostDeals?.recent ?? 0}건</small></article>
        <article><TrendingUp size={18} /><span>거래 증가 1위</span><strong>{fastest?.dong ?? "-"}</strong><small>직전 90일 대비 {fastest ? `${fastest.momentum >= 0 ? "+" : ""}${fastest.momentum.toFixed(1)}%` : "-"}</small></article>
        <article className={styles.accent}><Gauge size={18} /><span>잠재 활성도 1위</span><strong>{leader?.dong ?? "-"}</strong><small>{leader?.district ?? "분석 대기"} · {leader?.score ?? 0}점</small></article>
      </div>

      <article className={styles.panel}>
        <header>
          <div><h2>동별 부동산 거래 잠재력</h2><p>최근 거래량 45%, 고유 매물처 30%, 직전 기간 대비 증가세 25%를 합산합니다.</p></div>
          <span>{data.source} · {data.total.toLocaleString()}건</span>
        </header>
        {data.rows.length ? (
          <AdminTable headers={["순위", "자치구", "동", "최근 거래", "고유 매물처", "직전 거래", "증감률", "잠재 활성도"]}>
            {data.rows.slice(0, 20).map((row, index) => (
              <tr key={`${row.district}|${row.dong}`}>
                <td>{index + 1}</td><td>{row.district}</td><td><strong>{row.dong}</strong></td>
                <td>{row.recent.toLocaleString()}건</td><td>{row.properties.toLocaleString()}곳</td><td>{row.previous.toLocaleString()}건</td>
                <td className={row.momentum >= 0 ? styles.up : styles.down}>{row.momentum >= 0 ? "+" : ""}{row.momentum.toFixed(1)}%</td>
                <td><div className={styles.score}><i style={{ width: `${row.score}%` }} /><b>{row.score}</b></div></td>
              </tr>
            ))}
          </AdminTable>
        ) : <p className={styles.empty}>분석할 실거래 표본이 없습니다.</p>}
        <footer>고유 매물처는 실거래 API의 주소·건물명 조합입니다. 매물 등록 수나 실제 전환율로 해석하면 안 됩니다.</footer>
      </article>
    </section>
  );
}
