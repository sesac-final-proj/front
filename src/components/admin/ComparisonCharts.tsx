"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables, type ChartConfiguration, type Plugin } from "chart.js";
import type { PriceComparisonDetailTypeItem, PriceComparisonRegionItem, PricePlatformComparisonItem } from "@/services/adminService";
import {
  COLORS,
  EXTERNAL_RADAR_METRICS,
  PLATFORMS,
  REGION_RADAR_METRICS,
  carrotBenchmarkValues,
  regionRadarValues,
  reviewComparisons,
} from "./comparison-data";
import styles from "./portal.module.css";

Chart.register(...registerables);

const RADAR_FILLS = ["rgba(214, 94, 19, .1)", "rgba(39, 100, 165, .08)", "rgba(130, 106, 39, .08)"];
const RADAR_SHAPES = ["circle", "rect", "triangle"] as const;
type RadarMode = "external" | "regions";

function CategoryRadar({ category, platformRows, regionRows, detailRows, mode }: {
  category: string;
  platformRows: PricePlatformComparisonItem[];
  regionRows: PriceComparisonRegionItem[];
  detailRows: PriceComparisonDetailTypeItem[];
  mode: RadarMode;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const carrot = platformRows.find(row => row.platform === "당근");
  const seriesRows = mode === "external" ? platformRows : regionRows;
  const labels = mode === "external" ? EXTERNAL_RADAR_METRICS : REGION_RADAR_METRICS;
  const series = seriesRows.map(row => mode === "external" ? (row as PricePlatformComparisonItem).platform : (row as PriceComparisonRegionItem).gu);
  const values = mode === "external"
    ? carrotBenchmarkValues(platformRows)
    : regionRadarValues(regionRows, detailRows, carrot?.median_price ?? 0);

  useEffect(() => {
    if (!canvas.current || values.length < 2) return;
    const chart = new Chart(canvas.current, {
      type: "radar",
      data: { labels: [...labels], datasets: values.map((data, index) => ({
        label: series[index], data, borderColor: COLORS[index], backgroundColor: RADAR_FILLS[index],
        pointBackgroundColor: COLORS[index], pointBorderColor: "#f3f2ed", pointStyle: RADAR_SHAPES[index],
        pointRadius: 3, pointHoverRadius: 5, borderWidth: 2, borderDash: index ? [index * 3, 3] : [], fill: true,
      })) },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, layout: { padding: 14 },
        scales: { r: { min: 0, max: 200, angleLines: { color: "rgba(67,72,65,.14)" }, grid: { color: context => context.tick.value === 100 ? "rgba(214,94,19,.48)" : "rgba(67,72,65,.12)", circular: false }, pointLabels: { color: "#30362e", font: { size: 10, weight: 600 }, padding: 9 }, ticks: { stepSize: 50, color: "#777d72", backdropColor: "transparent", showLabelBackdrop: false, font: { size: 8 } } } },
        plugins: { legend: { display: false }, tooltip: { backgroundColor: "#242823", padding: 10, callbacks: { label: context => `${context.dataset.label}: 지수 ${Number(context.raw).toFixed(0)}` } } },
      },
    });
    return () => chart.destroy();
  }, [labels, series, values]);

  if (values.length < 2) return <article className={styles.radarCard}><h4>{category}</h4><p className={styles.radarEmpty}>이 비교 방식의 표본이 부족합니다.</p></article>;
  return <article className={styles.radarCard}>
    <header><div><h4>{category}</h4><small>{mode === "external" ? "당근 = 100 기준" : `${regionRows.length}개 구 비교`}</small></div><span>{seriesRows.reduce((sum, row) => sum + row.sample_count, 0).toLocaleString()}건</span></header>
    <div className={styles.radarPlot}><canvas ref={canvas} role="img" aria-label={`${category} ${mode === "external" ? "외부 플랫폼" : "구별"} 거래 지표 비교`} /></div>
    <div className={styles.radarLegend}>{series.map((name, index) => <span key={name} data-series={index + 1}><i aria-hidden="true" />{name}</span>)}</div>
  </article>;
}

export function ComparisonCharts({ rows, regions, detailTypes }: { rows: PricePlatformComparisonItem[]; regions: PriceComparisonRegionItem[]; detailTypes: PriceComparisonDetailTypeItem[] }) {
  const boxes = useRef<HTMLCanvasElement>(null);
  const changes = useRef<HTMLCanvasElement>(null);
  const reviewed = useMemo(() => reviewComparisons(rows), [rows]);
  const [radarMode, setRadarMode] = useState<RadarMode>("external");
  const radarCategories = useMemo(() => [...new Set([...reviewed.categories, ...regions.map(row => row.category)])]
    .filter(category => category !== "전체")
    .sort((a, b) => a.localeCompare(b, "ko")), [regions, reviewed.categories]);
  const [selectedRadarCategory, setSelectedRadarCategory] = useState("");
  const activeRadarCategory = radarCategories.includes(selectedRadarCategory)
    ? selectedRadarCategory
    : radarCategories[0];

  useEffect(() => {
    const { rows: valid, gaps } = reviewComparisons(rows);
    const charts: Chart[] = [];
    const base = { responsive: true, maintainAspectRatio: false, animation: false as const };

    if (changes.current && gaps.length) {
      charts.push(new Chart(changes.current, {
        type: "bar",
        data: { labels: gaps.map(row => `${row.category} · ${row.platform}`), datasets: [{ label: "당근 대비 중앙값 차이(%)", data: gaps.map(row => row.percent), backgroundColor: gaps.map(row => row.percent >= 0 ? "#2764a5" : "#cfdae5") }] },
        options: { ...base, indexAxis: "y", scales: { x: { beginAtZero: true, title: { display: true, text: "(외부 중앙값 / 당근 중앙값 - 1) × 100 (%)" } } }, plugins: { legend: { display: false } } },
      }));
    }

    if (boxes.current && valid.length) {
      const medianMarks: Plugin<"bar"> = { id: "medianMarks", afterDatasetsDraw(chart) {
        const ctx = chart.ctx;
        ctx.save();
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 2;
        chart.getDatasetMeta(0).data.forEach((element, index) => {
          const x = chart.scales.x.getPixelForValue(valid[index].median_price);
          ctx.beginPath();
          ctx.moveTo(x, element.y - 7);
          ctx.lineTo(x, element.y + 7);
          ctx.stroke();
        });
        ctx.restore();
      } };
      const config: ChartConfiguration<"bar", [number, number][]> = {
        type: "bar",
        plugins: [medianMarks],
        data: { labels: valid.map(row => `${row.category} · ${row.platform} (n=${row.sample_count})`), datasets: [{ label: "Q1-Q3", data: valid.map(row => [row.p25_price, row.p75_price]), backgroundColor: valid.map(row => COLORS[PLATFORMS.indexOf(row.platform as typeof PLATFORMS[number])]), barThickness: 16 }] },
        options: { ...base, indexAxis: "y", scales: { x: { beginAtZero: true, title: { display: true, text: "등록가 (원) · 검은 선: 중앙값" } } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => { const row = valid[context.dataIndex]; return `Q1 ${row.p25_price.toLocaleString()} / 중앙값 ${row.median_price.toLocaleString()} / Q3 ${row.p75_price.toLocaleString()}원`; } } } } },
      };
      charts.push(new Chart(boxes.current, config) as Chart);
    }

    return () => charts.forEach(chart => chart.destroy());
  }, [rows]);

  return <>
    <section className={styles.radarSection} aria-labelledby="radar-title">
      <header className={styles.radarHeader}>
        <div>
          <h3 id="radar-title">품목별 거래 기준 비교</h3>
          <p id="radar-description">선택한 품목 하나를 기준으로 플랫폼 또는 지역별 가격·거래 양상을 비교합니다.</p>
        </div>
        <div className={styles.radarControls}>
          <label className={styles.radarControl}>품목<select value={activeRadarCategory ?? ""} onChange={event => setSelectedRadarCategory(event.target.value)}>{radarCategories.map(category => <option key={category} value={category}>{category}</option>)}</select></label>
          <label className={styles.radarControl}>비교 기준<select value={radarMode} onChange={event => setRadarMode(event.target.value as RadarMode)}><option value="external">외부 플랫폼 비교</option><option value="regions">구별 비교</option></select></label>
        </div>
      </header>
      <p className={styles.radarModeNote}>{radarMode === "external" ? "주황 기준선(당근)=100 · 100보다 크면 당근보다 높은 값입니다." : "구별 지표는 해당 품목 안에서 비교합니다. 가격 안정성은 세부유형별 변동계수로 계산합니다."}</p>
      {activeRadarCategory ? <CategoryRadar key={`${activeRadarCategory}-${radarMode}`} category={activeRadarCategory} mode={radarMode} platformRows={reviewed.rows.filter(row => row.category === activeRadarCategory)} regionRows={regions.filter(row => row.category === activeRadarCategory)} detailRows={detailTypes.filter(row => row.category === activeRadarCategory)} /> : <p className={styles.radarEmpty}>비교 가능한 품목이 없습니다.</p>}
    </section>

    <h3>오늘 확인할 외부 시장 변화</h3><p>현재 스냅샷에서 당근 대비 가격 격차 · 과거 스냅샷이 없어 전일 증감은 미산출.</p>
    {reviewed.gaps.length ? <div style={{ position: "relative", height: Math.max(280, reviewed.gaps.length * 32) }}><canvas ref={changes} role="img" aria-label="당근 대비 외부 플랫폼 중앙값 차이" /></div> : <p>당근과 동일 품목의 비교 자료가 없습니다.</p>}
    <h3>플랫폼별 가격 박스플롯 (Q1·중앙값·Q3)</h3><p>등록가 가운데 50% 구간 · 최솟값·최댓값·이상치 원자료가 없어 수염은 표시하지 않습니다.</p>
    <div style={{ position: "relative", height: Math.max(280, reviewed.rows.length * 32) }}><canvas ref={boxes} role="img" aria-label="플랫폼별 사분위 가격 구간. 아래 원본 수치 표 제공." /></div>
  </>;
}
