"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chart, registerables, type ChartConfiguration, type Plugin } from "chart.js";
import type { PricePlatformComparisonItem } from "@/services/adminService";
import {
  COLORS,
  PLATFORMS,
  RADAR_CATEGORY_LIMITS,
  reconcileRadarCategories,
  reviewComparisons,
  toggleRadarCategory,
} from "./comparison-data";
import styles from "./portal.module.css";

Chart.register(...registerables);

const RADAR_FILLS = ["rgba(214, 94, 19, .1)", "rgba(39, 100, 165, .08)", "rgba(130, 106, 39, .08)"];
const RADAR_SHAPES = ["circle", "rect", "triangle"] as const;

export function ComparisonCharts({ rows }: { rows: PricePlatformComparisonItem[] }) {
  const radar = useRef<HTMLCanvasElement>(null);
  const boxes = useRef<HTMLCanvasElement>(null);
  const changes = useRef<HTMLCanvasElement>(null);
  const reviewed = useMemo(() => reviewComparisons(rows), [rows]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(reviewed.comparable.slice(0, RADAR_CATEGORY_LIMITS.max));
  const radarCategories = useMemo(
    () => reconcileRadarCategories(selectedCategories, reviewed.comparable),
    [selectedCategories, reviewed.comparable],
  );

  useEffect(() => {
    const { rows: valid, comparable, gaps } = reviewComparisons(rows);
    const charts: Chart[] = [];
    const base = { responsive: true, maintainAspectRatio: false, animation: false as const };

    if (radar.current && comparable.length >= RADAR_CATEGORY_LIMITS.min && radarCategories.length >= RADAR_CATEGORY_LIMITS.min) {
      const categories = radarCategories;
      charts.push(new Chart(radar.current, {
        type: "radar",
        data: {
          labels: categories,
          datasets: PLATFORMS.map((platform, index) => ({
            label: platform,
            borderColor: COLORS[index],
            backgroundColor: RADAR_FILLS[index],
            pointBackgroundColor: COLORS[index],
            pointBorderColor: "#f3f2ed",
            pointStyle: RADAR_SHAPES[index],
            pointRadius: 4,
            pointHoverRadius: 5,
            borderWidth: 2,
            borderDash: index ? [index * 3, 3] : [],
            fill: true,
            data: categories.map(category => {
              const group = valid.filter(row => row.category === category);
              return 100 * group.find(row => row.platform === platform)!.median_price / Math.max(1, ...group.map(row => row.median_price));
            }),
          })),
        },
        options: {
          ...base,
          layout: { padding: 22 },
          scales: {
            r: {
              min: 0,
              max: 100,
              angleLines: { color: "rgba(67, 72, 65, .14)", lineWidth: 1 },
              grid: { color: "rgba(67, 72, 65, .14)", circular: false },
              pointLabels: { color: "#30362e", font: { size: 12, weight: 600 }, padding: 13 },
              ticks: { stepSize: 25, color: "#6f756c", backdropColor: "transparent", showLabelBackdrop: false, font: { size: 10 } },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "#242823",
              titleColor: "#f7f7f5",
              bodyColor: "#f7f7f5",
              padding: 11,
              displayColors: true,
              callbacks: { label: context => `${context.dataset.label}: 지수 ${Number(context.raw).toFixed(1)}` },
            },
          },
        },
      }));
    }

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
  }, [rows, radarCategories]);

  const updateCategory = (category: string) => {
    setSelectedCategories(current => toggleRadarCategory(current, category, reviewed.comparable));
  };

  return <>
    <section className={styles.radarSection} aria-labelledby="radar-title">
      <header className={styles.radarHeader}>
        <div>
          <h3 id="radar-title">플랫폼별 품목 가격 지수</h3>
          <p id="radar-description">각 품목의 최고 중앙값을 100으로 환산해 플랫폼별 가격 수준을 비교합니다.</p>
        </div>
        <span id="radar-selection-status" className={styles.radarSelectionStatus} aria-live="polite">
          선택 {radarCategories.length} / {RADAR_CATEGORY_LIMITS.max}
        </span>
      </header>
      {reviewed.comparable.length >= RADAR_CATEGORY_LIMITS.min ? <>
        <fieldset className={styles.radarCategoryPicker} aria-describedby="radar-selection-status">
          <legend>비교 품목</legend>
          <div>
            {reviewed.comparable.map(category => {
              const checked = radarCategories.includes(category);
              const disabled = checked
                ? radarCategories.length <= RADAR_CATEGORY_LIMITS.min
                : radarCategories.length >= RADAR_CATEGORY_LIMITS.max;
              return <label key={category} className={styles.radarCategoryOption}>
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => updateCategory(category)} />
                <span>{category}</span>
              </label>;
            })}
          </div>
        </fieldset>
        <figure className={styles.radarFigure} aria-describedby="radar-description radar-selection-status">
          <div className={styles.radarLegend} aria-label="플랫폼 범례">
            {PLATFORMS.map((platform, index) => <span key={platform} data-series={index + 1}>
              <i aria-hidden="true" />{platform}
            </span>)}
          </div>
          <div className={styles.radarPlot}>
            <canvas ref={radar} role="img" aria-label={`당근, 중고나라, 번개장터의 ${radarCategories.join(", ")} 가격 지수 레이더 차트`} />
          </div>
        </figure>
      </> : <p className={styles.radarEmpty}>3개 플랫폼의 공통 품목이 3개 이상 있어야 레이더를 표시합니다.</p>}
    </section>

    <h3>오늘 확인할 외부 시장 변화</h3><p>현재 스냅샷에서 당근 대비 가격 격차 · 과거 스냅샷이 없어 전일 증감은 미산출.</p>
    {reviewed.gaps.length ? <div style={{ position: "relative", height: Math.max(280, reviewed.gaps.length * 32) }}><canvas ref={changes} role="img" aria-label="당근 대비 외부 플랫폼 중앙값 차이" /></div> : <p>당근과 동일 품목의 비교 자료가 없습니다.</p>}
    <h3>플랫폼별 가격 박스플롯 (Q1·중앙값·Q3)</h3><p>등록가 가운데 50% 구간 · 최솟값·최댓값·이상치 원자료가 없어 수염은 표시하지 않습니다.</p>
    <div style={{ position: "relative", height: Math.max(280, reviewed.rows.length * 32) }}><canvas ref={boxes} role="img" aria-label="플랫폼별 사분위 가격 구간. 아래 원본 수치 표 제공." /></div>
  </>;
}
