"use client";
import { Network } from "lucide-react";
import type { AdminAudienceInsights } from "@/services/adminService";
import styles from "@/app/admin/admin.module.css";
export default function SystemSection({insights}: {insights: AdminAudienceInsights | null}) {


return <>        {<section id="architecture" className={styles.section}>
          <div className={styles.sectionHead}><div><span>SYS·01</span><div><p className={styles.eyebrow}>SYSTEM MAP</p><h2>현재 기술 아키텍처</h2></div></div><small>첨부 문서와 현재 구현 교차 확인</small></div>
          <div className={styles.architectureFlow} aria-label="관리자 데이터 흐름">
            <article><span>01 · SOURCE</span><h3>중고나라 · 번개장터</h3><p>수집 CSV와 상세 페이지 보강 데이터</p></article>
            <i aria-hidden="true" />
            <article><span>02 · PIPELINE</span><h3>Python 분석 파이프라인</h3><p>완제품 필터 · 중복 제거 · 모델/용량/연식 클러스터 · 통계·ML 검증</p></article>
            <i aria-hidden="true" />
            <article><span>03 · BACKEND</span><h3>FastAPI 관리자 API</h3><p>JWT + require_admin · 데이터 상태 · 독자 관점 분석 응답</p></article>
            <i aria-hidden="true" />
            <article><span>04 · FRONTEND</span><h3>Next.js 관리자 콘솔</h3><p>인증 상태 · 섹션 전환 · 실제 관측값과 해석 표시</p></article>
          </div>
          <div className={styles.architectureGrid}>
            <article><p className={styles.eyebrow}>AUTHENTICATION</p><h3>관리자 인증</h3><ul><li>Access/Refresh JWT 발급</li><li>UserRole.ADMIN 검증</li><li>관리자 API 공통 보호</li></ul><b>실제 연결</b></article>
            <article><p className={styles.eyebrow}>ANALYTICS</p><h3>가격 분석</h3><ul><li>중앙값·IQR·Welch 검정</li><li>LightGBM·RandomForest·Optuna</li><li>시간순 홀드아웃과 R²/MAE</li></ul><b>실제 데이터</b></article>
            <article><p className={styles.eyebrow}>SEMANTIC AI</p><h3>LLM 의미 계층</h3><ul><li>OmniRoute 모델 호출</li><li>집계값 기반 카테고리 라벨</li><li>가격 계산과 LLM 해석 분리</li></ul><b>{insights?.llm.model ?? "연결 대기"}</b></article>
            <article className={styles.architectureGap}><p className={styles.eyebrow}>KNOWN GAPS</p><h3>남은 운영 API</h3><ul><li>공지 CRUD와 알림</li><li>기부·집행 조회</li><li>세부 리소스 권한</li><li>감사 로그와 운영 이력</li></ul><b>문서 기준 미구현</b></article>
          </div>
          <div className={styles.architectureDecision}><div><Network size={20} /><h3>통합 원칙</h3></div><p>별도 mock 관리자 백엔드를 늘리지 않고 기존 <code>back</code>의 인증·API 경계를 기준으로 확장합니다. 현재 추가한 분석 API도 같은 <code>require_admin</code> 보호 경로를 사용합니다.</p></div>
        </section>}</>;
}

