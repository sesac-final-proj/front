# 가격예측 모델 대시보드 (프론트)

> 백엔드 API 계약: [back/docs/issue/12-price-prediction-dashboard.md](../../back/docs/issue/12-price-prediction-dashboard.md)
> 대상 화면: 어드민 "가격 모델" 섹션 (`src/app/admin/[section]/page.tsx` → `section=price-model`)

## 배경

`PriceModelSection.tsx`는 지금 `public/model-validation.json`(다른 모델, 등록가 기준)을 그대로 보여주는 임시 상태다. 백엔드 TASK-12-01/02가 끝나면 이 섹션을 analyzer 파이프라인(LightGBM, R² 0.752 / Hit@20% 80%)의 실제 결과로 교체하고, 세부유형별 가격분포 스웜 플롯을 새로 추가한다.

## 차트 라이브러리 역할 분담

| 차트 | 라이브러리 | 이유 |
| --- | --- | --- |
| R²/RMSE/Hit@10·20 전후 비교, Feature Importance | **Chart.js** | 표준 bar 차트. 기존 `DashboardCharts.tsx`도 이미 이런 용도 |
| 세부유형별 가격분포(스웜 플롯, 카테고리 facet) | **D3.js** | Chart.js엔 없는 차트 타입 — `d3-force`로 충돌 회피 지터 필요 |

두 라이브러리 다 신규 의존성 추가(`package.json`에 `chart.js`, `react-chartjs-2` 또는 `d3` 없음) — 설치 필요:

```bash
npm install chart.js react-chartjs-2 d3
npm install -D @types/d3
```

## 구현 계획

### 1. 서비스 함수 — `src/services/adminService.ts`에 추가

기존 `getAdminDataStatus` 패턴 그대로 따른다 (별도 파일 분리 불필요, 같은 어드민 API 그룹):

```ts
export interface PriceModelMetrics {
  final: { model: string; featureSet: string; r2: number; rmse: number; mae: number; mape: number;
           hitAt10: number; hitAt20: number; rangeCoverage2575: number; rangeCoverage1090: number; trainRows: number };
  baseline: { model: string; r2: number; rmse: number; hitAt20: number };
}

export interface PriceDistribution {
  categories: {
    category: string;
    sampleCount: number;
    types: { type: string; count: number; medianPrice: number }[];
    points: { type: string; price: number }[];
  }[];
}

export async function getPriceModelMetrics(): Promise<PriceModelMetrics> {
  const response = await adminAuthorizedFetch("/api/v1/admin/price-model/metrics", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "모델 지표를 불러오지 못했습니다."));
  return response.json();
}

export async function getPriceDistribution(category?: string): Promise<PriceDistribution> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await adminAuthorizedFetch(`/api/v1/admin/price-model/price-distribution${qs}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(await errorMessage(response, "가격분포를 불러오지 못했습니다."));
  return response.json();
}
```

### 2. `AdminSectionPage.tsx` 연결

기존 `getModel()` 대신 새 서비스 함수 사용, `loader`에 두 호출 추가:

```ts
["price-model"].includes(section) ? getPriceModelMetrics() : null,
["price-model"].includes(section) ? getPriceDistribution() : null,
```

`sections/types.ts`에 `PriceModelMetrics`/`PriceDistribution`은 `adminService.ts`에서 이미 export하므로 재정의하지 않고 import해서 쓴다 (기존 `ModelValidation`처럼 중복 타입 만들지 말 것).

### 3. 지표 비교 차트 — `PriceModelSection.tsx` 내 신규 하위 컴포넌트

`Chart.js`의 horizontal bar 하나로 R²/Hit@10/Hit@20/RMSE를 각각 그린다. `react-chartjs-2` 래퍼 사용:

```tsx
"use client";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip } from "chart.js";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip);

function MetricBar({ label, before, after, format }: { label: string; before: number; after: number; format: (n: number) => string }) {
  return (
    <div>
      <span>{label}</span>
      <Bar
        data={{ labels: ["RandomForest", "LightGBM (최종)"], datasets: [{ data: [before, after], backgroundColor: ["#8884", "#FF922B"] }] }}
        options={{ indexAxis: "y", plugins: { tooltip: { callbacks: { label: (ctx) => format(ctx.raw as number) } } }, scales: { x: { display: false } } }}
      />
    </div>
  );
}
```

### 4. 세부유형 스웜 플롯 — 신규 `PriceSwarmChart.tsx`

이미지의 "실제 세부유형으로 다시 그린 가격 분포"와 동일한 레이아웃. `d3-force`의 `forceX`(실제 가격 고정) + `forceCollide`(겹침 방지)로 스웜 좌표를 계산 후 SVG로 그린다.

```tsx
"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import type { PriceDistribution } from "@/services/adminService";

export default function PriceSwarmChart({ data }: { data: PriceDistribution }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    const width = 460, height = 260;

    data.categories.forEach((cat, i) => {
      const g = svg.append("g").attr("transform", `translate(${(i % 2) * (width + 20)}, ${Math.floor(i / 2) * (height + 60)})`);
      const x = d3.scaleLinear().domain([0, d3.max(cat.points, d => d.price) ?? 0]).range([20, width - 20]);
      const color = d3.scaleOrdinal(d3.schemeSet2).domain(cat.types.map(t => t.type));

      const nodes = cat.points.map(p => ({ ...p, x: x(p.price), y: height / 2 }));
      d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
        .force("x", d3.forceX((d: any) => x(d.price)).strength(1))
        .force("y", d3.forceY(height / 2).strength(0.06))
        .force("collide", d3.forceCollide(3))
        .stop()
        .tick(120);

      g.append("text").text(`${cat.category} (n=${cat.sampleCount})`).attr("y", -8).attr("font-weight", 600);
      g.selectAll("circle").data(nodes).join("circle")
        .attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)
        .attr("r", 3).attr("fill", (d: any) => color(d.type)).attr("opacity", 0.8);
      g.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).ticks(4));
    });
  }, [data]);

  return <svg ref={ref} width="100%" height={data.categories.length * 160} viewBox={`0 0 960 ${Math.ceil(data.categories.length / 2) * 320}`} />;
}
```

- `useEffect` 안에서 SVG를 직접 그리는 이유: React가 DOM을 관리하는 선언적 방식과 D3의 명령형 DOM 조작은 섞기 까다로워서, D3 파트는 컨테이너 `<svg>` ref 하나만 React에 맡기고 내부는 D3가 전담하는 게 표준 패턴이다. (React 컴포넌트 트리 안에 D3를 완전히 선언적으로 녹이는 라이브러리도 있지만 이 정도 규모에 과설계.)
- `forceSimulation`은 데이터가 바뀔 때만 재계산하면 되므로 `.tick(120)`으로 즉시 완료시키고 애니메이션은 안 건다 (정적 스냅샷이라 애니메이션 불필요 — 필요해지면 `d3.forceSimulation().on("tick", ...)` + `requestAnimationFrame`으로 전환).

### 5. 스타일

기존 `admin.module.css`의 `.section`, `.sectionHead` 등 클래스를 그대로 재사용 — 새 CSS 모듈 만들지 않는다. SVG 내부 색상만 다크/라이트 테마 대응이 필요하면 CSS 변수(`var(--ink)` 등 프로젝트 기존 토큰)를 `fill`에 연결.

## 체크리스트

- [ ] `chart.js`, `react-chartjs-2`, `d3`, `@types/d3` 설치
- [ ] `adminService.ts`에 `PriceModelMetrics`/`PriceDistribution` 타입 + `getPriceModelMetrics`/`getPriceDistribution` 함수 추가
- [ ] `AdminSectionPage.tsx`의 `getModel()` 호출을 새 서비스 함수로 교체
- [ ] `PriceModelSection.tsx`에 `MetricBar`(Chart.js) 추가해 R²/Hit@10/Hit@20/RMSE 전후 비교
- [ ] `PriceSwarmChart.tsx`(D3) 신규 작성, `PriceModelSection.tsx`에서 렌더
- [ ] `public/model-validation.json`, `public/analysis-data.json` 의존성 제거 여부 확인 — `/analysis` 페이지가 별도로 이 파일을 쓰고 있으면 그건 그대로 두고 이 섹션만 새 API로 전환
