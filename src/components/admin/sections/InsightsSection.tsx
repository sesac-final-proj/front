"use client";
import { BarChart3, MessageSquareText, Sparkles, Tags } from "lucide-react";
import type { AdminAudienceInsights } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";
const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;
export default function InsightsSection({insights}: {insights: AdminAudienceInsights | null}) {


return <>        {insights && <section id="external-interpretation" className={styles.section}>
          <div className={styles.sectionHead}><div><span>EXT·01</span><div><p className={styles.eyebrow}>EXTERNAL MARKET ONLY</p><h2>타 플랫폼 비교 브리핑</h2></div></div><small>중고나라·번개장터 정제 표본 {number.format(insights.population.rows)}건</small></div>
          <div className={styles.briefHero}>
            <div><span>핵심 해석</span><h3>{insights.interpretation.finding}</h3></div>
            <div><b>운영 제안</b><p>{insights.interpretation.action}</p><small>{insights.interpretation.caveat}</small></div>
          </div>
          <div className={styles.guideGrid}>
            {insights.readerGuide.map((guide, index) => <article key={guide.question}><span>0{index + 1}</span><h3>{guide.question}</h3><p>{guide.answer}</p></article>)}
          </div>
          <div className={styles.methodPanel}>
            <div><p className={styles.eyebrow}>WHY THESE LISTINGS</p><h3>이 표본을 선정한 이유</h3></div>
            <ol>{insights.selectionReasons.map((reason) => <li key={reason}>{reason}</li>)}</ol>
          </div>
          <div className={styles.distributionPanel}>
            <div className={styles.panelHead}><div><h3>품목별 가격 분포</h3><p>막대는 Q1~Q3, 점은 중앙값 · 이상치는 IQR 1.5배 밖의 비율</p></div><BarChart3 size={18} /></div>
            <div className={styles.distributionList}>
              {insights.distributions.map((row) => {
                const maxPrice = Math.max(...insights.distributions.map((item) => item.q3));
                return <div key={row.item} className={styles.distributionRow}>
                  <div><b>{row.item}</b><small>n={number.format(row.count)} · 이상치 {row.outlierRate}%</small></div>
                  <div className={styles.rangeTrack}><i style={{ left: `${row.q1 / maxPrice * 100}%`, width: `${Math.max(2, (row.q3 - row.q1) / maxPrice * 100)}%` }} /><b style={{ left: `${row.median / maxPrice * 100}%` }} /></div>
                  <strong>{money(row.median)}</strong>
                  <p>{row.interpretation}</p>
                </div>;
              })}
            </div>
          </div>
        </section>}

        {insights && <section id="external-keywords" className={`${styles.section} ${styles.continuedSection}`}>
          <div className={styles.sectionHead}><div><span>EXT·02</span><div><p className={styles.eyebrow}>EXTERNAL SEMANTIC LAYER</p><h2>타 플랫폼 키워드와 LLM 카테고리</h2></div></div><small>{insights.llm.provider} · {insights.llm.model}</small></div>
          <div className={styles.llmNote}><Sparkles size={18} /><p><b>역할을 분리했습니다.</b> 가격·분포·빈도는 통계 코드가 계산하고, LLM은 집계 결과와 실제 제목을 읽어 의미 카테고리와 검수 관점을 붙였습니다. {insights.llm.guardrail}</p></div>
          <div className={styles.semanticGrid}>
            {insights.llmCategories.map((category) => <article key={category.name}>
              <span>LLM CATEGORY</span><h3>{category.name}</h3><p>{category.definition}</p>
              <div>{category.signals.slice(0, 6).map((signal) => <b key={signal}>{signal}</b>)}</div>
              <dl><dt>관리 활용</dt><dd>{category.adminUse}</dd><dt>주의</dt><dd>{category.caution}</dd></dl>
            </article>)}
          </div>
          <div className={styles.keywordPanel}>
            <div className={styles.panelHead}><div><h3>제목 키워드 실제 관측</h3><p>등장 매물 수 · 전체 중앙값 대비 가격지수 · 관측 완료상태 비율</p></div><Tags size={18} /></div>
            <div className={styles.keywordGrid}>{insights.keywords.map((keyword) => <div key={keyword.keyword}><b>{keyword.keyword}</b><span>{number.format(keyword.count)}건</span><strong>가격지수 {keyword.medianIndex}</strong><small>완료상태 {keyword.completionRate}%</small></div>)}</div>
            <p className={styles.dataCaveat}>키워드는 제목에 함께 등장한 상관 신호입니다. 특정 단어가 가격이나 판매 완료를 유발한다고 해석하지 않습니다.</p>
          </div>
          <div className={styles.examplePanel}>
            <div className={styles.panelHead}><div><h3>실제 데이터로 확인</h3><p>품목 중앙값에 가까운 양 플랫폼 대표 사례</p></div><MessageSquareText size={18} /></div>
            <div className={styles.exampleGrid}>{insights.examples.map((example) => <a key={`${example.platform}-${example.title}`} href={example.url} target="_blank" rel="noreferrer"><span>{example.item} · {example.platform}</span><h4>{example.title}</h4><b>{money(example.price)}</b><small>{example.model} · {example.status}</small><p>{example.reason}</p></a>)}</div>
          </div>
        </section>}</>;
}
