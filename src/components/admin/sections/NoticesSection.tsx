"use client";
import { BellRing, HeartHandshake } from "lucide-react";
import styles from "@/app/admin/admin.module.css";
export default function NoticesSection() {


return <>        {<section id="delivery" className={styles.section}>
          <div className={styles.sectionHead}><div><span>SYS·03</span><div><p className={styles.eyebrow}>SYSTEM READINESS</p><h2>공지·기부 준비 현황</h2></div></div><small>첨부 구현 현황 문서 반영</small></div>
          <div className={styles.readinessHero}>
            <div><span>운영 원칙</span><h3>연결되지 않은 기능은<br />숫자를 만들지 않습니다.</h3></div>
            <p>현재 저장소에 실제 API와 원장이 있는 기능만 운영 지표로 표시합니다. 화면만 있거나 로컬 상태인 기능은 연결 조건과 다음 작업을 명확히 구분했습니다.</p>
          </div>
          <div className={styles.readinessGrid}>
            <article>
              <div className={styles.readinessTitle}><span><BellRing size={18} />공지 관리</span><b>API 연결 필요</b></div>
              <p>공지 목록·작성·수정·삭제와 알림 생성 API가 현재 백엔드에 연결되지 않았습니다.</p>
              <dl><div><dt>현재 사용 가능</dt><dd>상태 스키마</dd></div><div><dt>운영 차단</dt><dd>실제 CRUD·DB 저장</dd></div></dl>
              <ul><li>공지 서비스 구분과 상태값 계약 확정</li><li>검색·필터·페이지네이션 추가</li><li>모든 경로에 관리자 권한 적용</li></ul>
            </article>
            <article>
              <div className={styles.readinessTitle}><span><HeartHandshake size={18} />기부·집행</span><b>원장 연결 필요</b></div>
              <p>시설 원천은 분석 가능하지만 기부액·참여자·집행 실적을 담는 원장이 아직 없습니다.</p>
              <dl><div><dt>현재 사용 가능</dt><dd>시설·지역 분포</dd></div><div><dt>운영 차단</dt><dd>기부·집행 성과</dd></div></dl>
              <ul><li>거래–기부 연결 키 설계</li><li>집행 검수 상태와 감사 로그 정의</li><li>지역상권 조달 데이터 모델 추가</li></ul>
            </article>
          </div>
          <div className={styles.nextWork}>
            <div><p className={styles.eyebrow}>IMPLEMENTATION ORDER</p><h3>다음 연결 순서</h3></div>
            <ol><li><span>01</span><b>공지 CRUD</b><small>실제 DB 저장과 상태 변경</small></li><li><span>02</span><b>기부 원장</b><small>기부·집행·검수 데이터 계약</small></li><li><span>03</span><b>운영 화면</b><small>검색·필터·페이지네이션</small></li></ol>
          </div>
        </section>}</>;
}
