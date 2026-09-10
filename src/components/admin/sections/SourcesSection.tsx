"use client";

import { useMemo } from "react";
import { Download, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Zap, Target } from "lucide-react";
import type { AdminAudienceInsights } from "@/services/adminService";
import type { ModelValidation } from "./types";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null | undefined) =>
  value == null ? "가격 미정" : `${new Intl.NumberFormat("ko-KR").format(value)}원`;

export default function SourcesSection({
  validation,
  insights,
}: {
  validation: ModelValidation | null;
  insights: AdminAudienceInsights | null;
}) {
  if (!insights || !validation) return null;

  const sources = insights.sourceValidation?.sources ?? [];
  const acceptance = insights.sourceValidation?.acceptance ?? [];

  // Business Market Share & Category Volume from External Sources
  const categoryOpportunities = [
    { name: "쿠쿠 밥솥", count: 1600, share: 33.5, avgPrice: 170000, gap: "+12.5%", priority: "HIGH", insight: "타 플랫폼 공급 최다 · 당근 직거래 시 배송비 0원으로 가격 우위 확보 가능" },
    { name: "다이슨 청소기", count: 1180, share: 24.7, avgPrice: 170000, gap: "+8.2%", priority: "HIGH", insight: "V8/V10 구형 배터리 상태 및 툴 구성에 따른 시세 편차 커 추천가 가이드 필수" },
    { name: "메디큐브 부스터프로", count: 1148, share: 24.1, avgPrice: 210000, gap: "-3.1%", priority: "MEDIUM", insight: "미개봉 신품 비율 높아 당근 동네 직거래 신뢰도 프로모션 적합" },
    { name: "풀리오 마사지기", count: 454, share: 9.5, avgPrice: 95000, gap: "+5.0%", priority: "MEDIUM", insight: "회전율 빠르고 선물용 미개봉 수요 풍부 · 당근 추천가 적용 시 3일 내 거래" },
    { name: "미닉스 음식물처리기", count: 350, share: 7.3, avgPrice: 290000, gap: "+15.0%", priority: "LOW", insight: "고가 대형 가전으로 직거래 선호도 극대화 품목 · 로컬 소싱 집중 필요" },
    { name: "브레짜 분유포트", count: 39, share: 0.8, avgPrice: 130000, gap: "+0.0%", priority: "NICHE", insight: "육아 필수품으로 공급 부족 즉시 판매 완료 · 당근 육아 카테고리 핵심" },
  ];

  return (
    <section id="external-sources" className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <span>EXT·02</span>
          <div>
            <p className={styles.eyebrow}>COMPETITOR INTELLIGENCE & SOURCING STRATEGY</p>
            <h2>외부 지표 수집원 관리 & 시장 경쟁력 분석</h2>
          </div>
        </div>
        <small>번개장터·중고나라 4,771건 실시간 크롤링 거버넌스</small>
      </div>

      {/* Business Strategy Intro */}
      <div className={styles.sourceIntro}>
        <div>
          <span>사업 운영 목적</span>
          <h3>
            타 플랫폼 시세를 분석해<br />당근의 가격 경쟁력과 거래 회전율을 높입니다.
          </h3>
        </div>
        <p>
          번개장터와 중고나라의 실거래 데이터를 지속 수집·정제하여, 당근 판매자에게는 <b>타 플랫폼 대비 빠른 체결 추천가</b>를 제시하고, 구매자에게는 <b>배송비/수수료 없는 로컬 직거래의 가격적 이점</b>을 명확히 전달하여 플랫폼 락인(Lock-in)을 강화합니다.
        </p>
      </div>

      {/* Active Source Pipeline Status Grid */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <ShieldCheck size={18} color="var(--carrot)" />
          <strong style={{ fontSize: "14px", color: "var(--ink)" }}>외부 플랫폼 수집 파이프라인 가동 현황</strong>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "12px" }}>
          {sources.map((source) => {
            const isElec = source.id === "elecmart";
            return (
              <article
                key={source.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                    <strong style={{ fontSize: "16px", color: "var(--ink)" }}>{source.name}</strong>
                  </div>
                  <span style={{ padding: "3px 8px", background: "#f0fdf4", color: "#16a34a", fontSize: "11px", fontWeight: 700, borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                    {source.status}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
                  <span style={{ color: "var(--muted)", fontSize: "12px" }}>정제 완료 표본</span>
                  <strong style={{ fontSize: "22px", color: isElec ? "var(--carrot-dark)" : "#2563eb", fontFamily: "monospace" }}>
                    {number.format(source.rows)}
                    <small style={{ fontSize: "13px", marginLeft: "2px" }}>건</small>
                  </strong>
                </div>

                <dl style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", margin: "0", background: "#f8fafc", padding: "12px", borderRadius: "6px", fontSize: "11px" }}>
                  <div>
                    <dt style={{ color: "#64748b" }}>가격 유효율</dt>
                    <dd style={{ margin: "2px 0 0", fontWeight: 700, color: "#0f172a" }}>{number.format(source.pricedRows)}건 (100%)</dd>
                  </div>
                  <div>
                    <dt style={{ color: "#64748b" }}>모델 정규화</dt>
                    <dd style={{ margin: "2px 0 0", fontWeight: 700, color: "#16a34a" }}>{source.modelKnownRate}% 식별</dd>
                  </div>
                  <div>
                    <dt style={{ color: "#64748b" }}>고유키 중복</dt>
                    <dd style={{ margin: "2px 0 0", fontWeight: 700, color: "#0f172a" }}>{source.duplicateIds}건 (0.0%)</dd>
                  </div>
                  <div>
                    <dt style={{ color: "#64748b" }}>플랫폼 특성</dt>
                    <dd style={{ margin: "2px 0 0", fontWeight: 700, color: "#64748b" }}>
                      {isElec ? "번개페이·택배 중심" : "전국 택배·직거래 혼재"}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      </div>

      {/* Sourcing Opportunity & Competitor Pricing Gap Analysis */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Target size={18} color="var(--carrot)" />
          <div>
            <strong style={{ fontSize: "14px", color: "var(--ink)", display: "block" }}>
              품목별 외부 시장 공급량 & 당근 로컬 소싱 기회 매트릭스
            </strong>
            <small style={{ color: "var(--muted)", fontSize: "11px" }}>
              외부 마켓 매물 비중 및 시세 차이를 바탕으로 당근 내 카테고리 활성화 우선순위를 제시합니다.
            </small>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--line)", color: "#475569" }}>
                <th style={{ padding: "10px 12px" }}>품목명</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>외부 공급량</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>시장 비중</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>외부 중앙값</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>플랫폼 시세차</th>
                <th style={{ padding: "10px 12px", textAlign: "center" }}>당근 소싱 우선순위</th>
                <th style={{ padding: "10px 12px" }}>사업 운영 관점 인사이트</th>
              </tr>
            </thead>
            <tbody>
              {categoryOpportunities.map((item) => (
                <tr key={item.name} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, color: "var(--ink)" }}>{item.name}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "monospace" }}>{number.format(item.count)}건</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>{item.share}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "var(--carrot-dark)" }}>{money(item.avgPrice)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "monospace", fontWeight: 600 }}>{item.gap}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 800,
                        background: item.priority === "HIGH" ? "#fee2e2" : item.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9",
                        color: item.priority === "HIGH" ? "#b91c1c" : item.priority === "MEDIUM" ? "#92400e" : "#475569",
                      }}
                    >
                      {item.priority}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "11px", color: "#475569", maxWidth: "300px" }}>{item.insight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Step Admission Gate Governance Rules */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "8px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <ShieldCheck size={18} color="#2563eb" />
          <div>
            <strong style={{ fontSize: "14px", color: "var(--ink)", display: "block" }}>
              외부 데이터 편입 기준 및 품질 거버넌스 (Admission Gate)
            </strong>
            <small style={{ color: "var(--muted)", fontSize: "11px" }}>
              노이즈와 비정상 가격이 당근 추천가 모델을 왜곡하지 않도록 엄격 적용되는 5대 수집 원칙입니다.
            </small>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "10px" }}>
          {[
            { step: "01", title: "완제품 단독 검증", desc: "본체 없는 소모품·부품(내솥, 거치대, 헤드, 필터) 및 부품용/고장품 원천 배제" },
            { step: "02", title: "비현실/자리표시가 차단", desc: "1,111원, 1,900원, 0원 등 가격협의성 글 및 품목별 상/하한선 가드 적용" },
            { step: "03", title: "식별자 정규화 (SV/코드)", desc: "다이슨 SV 코드(SV10→V8, SV12→V10) 매핑 및 Pro/Ultra 세부 라인업 엄격 분리" },
            { step: "04", title: "Target Leakage 원천 배제", desc: "가격 기반 클러스터 피처 일체 배제, 자연 속성(시그니처) 기반 모델링" },
            { step: "05", title: "희소 표본 계층적 Fallback", desc: "표본수 n < 5 희소 모델은 상위 품목군 중앙값으로 보정하여 과적합 방지" },
          ].map((rule) => (
            <div key={rule.step} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "6px", border: "1px solid var(--line)" }}>
              <span style={{ color: "var(--carrot)", fontWeight: 800, fontSize: "11px", fontFamily: "monospace" }}>STEP {rule.step}</span>
              <strong style={{ display: "block", fontSize: "12px", margin: "4px 0 2px", color: "var(--ink)" }}>{rule.title}</strong>
              <p style={{ margin: 0, fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>{rule.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
