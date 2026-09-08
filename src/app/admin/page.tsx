"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  LogOut,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  AdminDataStatus,
  AdminProfile,
  getAdminDataStatus,
  getAdminProfile,
  loginAdmin,
  logoutAdmin,
} from "@/services/adminService";
import styles from "./admin.module.css";

type ValidationModel = {
  name: string;
  trainR2: number;
  cvR2Mean: number;
  cvR2Std: number;
  testR2: number;
  testMAE: number;
  overfitGap: number;
  overfitRisk: string;
};

type ModelValidation = {
  rows: number;
  selectedModel: string;
  split: { method: string; trainRows: number; testRows: number; trainUntil: string; testFrom: string };
  baseline: { name: string; testR2: number; testMAE: number };
  models: ValidationModel[];
  leakageGuard: string;
};

const number = new Intl.NumberFormat("ko-KR");
const money = (value: number | null) => (value == null ? "가격 미정" : `${number.format(value)}원`);
const dateTime = (value: string | null) =>
  value ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "수집 기록 없음";

export default function AdminPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<AdminDataStatus | null>(null);
  const [validation, setValidation] = useState<ModelValidation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const [admin, dataStatus, validationData] = await Promise.all([
      getAdminProfile(),
      getAdminDataStatus(),
      fetch("/model-validation.json").then((response) => {
        if (!response.ok) throw new Error("모델 검증 결과를 불러오지 못했습니다.");
        return response.json() as Promise<ModelValidation>;
      }),
    ]);
    setProfile(admin);
    setStatus(dataStatus);
    setValidation(validationData);
    setError("");
  }, []);

  useEffect(() => {
    void Promise.resolve()
      .then(loadDashboard)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [loadDashboard]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setError("");
    try {
      await loginAdmin(String(form.get("email")), String(form.get("password")));
      await loadDashboard();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    try {
      await loadDashboard();
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "새로고침에 실패했습니다.");
    } finally {
      setRefreshing(false);
    }
  }

  async function signOut() {
    await logoutAdmin();
    setProfile(null);
    setStatus(null);
  }

  const pricedRate = useMemo(() => {
    if (!status?.total_transactions) return 0;
    return Math.round((status.priced_transactions / status.total_transactions) * 100);
  }, [status]);

  if (loading && !profile) {
    return <main className={styles.centerState}><span className={styles.loader} /><p>관리자 콘솔을 준비하고 있습니다.</p></main>;
  }

  if (!profile || !status || !validation) {
    return (
      <main className={styles.loginPage}>
        <section className={styles.loginStory}>
          <div className={styles.brandMark}><Sparkles size={20} /> 가지</div>
          <div>
            <p className={styles.eyebrow}>GAJI MARKET · OPERATIONS</p>
            <h1>동네 거래를<br />더 정확하게 봅니다.</h1>
            <p>수집 정합성부터 가격 모델 검증까지, 가지 중고거래 운영을 위한 관리자 공간입니다.</p>
          </div>
          <div className={styles.storyMeta}><span>실거래 데이터</span><span>시간순 검증</span><span>관리자 전용</span></div>
        </section>
        <section className={styles.loginPanel}>
          <form className={styles.loginForm} onSubmit={handleLogin}>
            <div className={styles.loginIcon}><ShieldCheck size={24} /></div>
            <p className={styles.eyebrow}>ADMIN ACCESS</p>
            <h2>관리자 로그인</h2>
            <p>백엔드에 등록된 관리자 계정으로 접속해 주세요.</p>
            <label>이메일<input name="email" type="email" autoComplete="username" required placeholder="admin@gaji.kr" /></label>
            <label>비밀번호<input name="password" type="password" autoComplete="current-password" required placeholder="비밀번호 입력" /></label>
            {error && <p className={styles.formError} role="alert">{error}</p>}
            <button type="submit" disabled={loading}>{loading ? "확인 중…" : "관리자 콘솔 열기"}</button>
            <Link href="/carrot">사용자 서비스로 돌아가기</Link>
          </form>
        </section>
      </main>
    );
  }

  const selectedModel = validation.models.find((model) => model.name === validation.selectedModel) ?? validation.models[0];
  const maxRegionCount = Math.max(1, ...status.region_counts.map((region) => region.transaction_count));

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link className={styles.logo} href="/admin"><span><Sparkles size={17} /></span>가지 어드민</Link>
        <nav aria-label="관리자 메뉴">
          <a className={styles.navActive} href="#overview"><Activity size={17} />운영 개요</a>
          <a href="#integrity"><Database size={17} />데이터 정합성</a>
          <a href="#models"><BarChart3 size={17} />모델 검증</a>
        </nav>
        <div className={styles.sideFooter}>
          <div><span>{profile.nickname}</span><small>{profile.email}</small></div>
          <button type="button" onClick={signOut} aria-label="로그아웃"><LogOut size={17} /></button>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.topbar}>
          <div><p className={styles.eyebrow}>MARKET OPERATIONS</p><h1>중고거래 운영 센터</h1></div>
          <div className={styles.topActions}>
            <span><i /> API 연결됨</span>
            <button type="button" onClick={refresh} disabled={refreshing}><RefreshCw size={15} className={refreshing ? styles.spinning : ""} />새로고침</button>
          </div>
        </header>

        {error && <div className={styles.inlineError} role="alert">{error}</div>}

        <section id="overview" className={styles.section}>
          <div className={styles.sectionHead}><div><span>01</span><div><p className={styles.eyebrow}>LIVE OVERVIEW</p><h2>운영 현황</h2></div></div><small>마지막 수집 {dateTime(status.latest_collected_at)}</small></div>
          <div className={styles.metricGrid}>
            <article><Database size={18} /><span>전체 거래 원천 데이터</span><strong>{number.format(status.total_transactions)}</strong><small>백엔드 transactions 실시간 집계</small></article>
            <article><CheckCircle2 size={18} /><span>가격 유효 레코드</span><strong>{pricedRate}%</strong><small>{number.format(status.priced_transactions)}건 분석 가능</small></article>
            <article><MapPin size={18} /><span>연결 지역</span><strong>{number.format(status.region_count)}</strong><small>행정동 기준 운영 범위</small></article>
            <article className={styles.accentMetric}><BarChart3 size={18} /><span>선택 가격 모델</span><strong>{validation.selectedModel}</strong><small>테스트 R² {selectedModel.testR2.toFixed(3)}</small></article>
          </div>
        </section>

        <section id="integrity" className={styles.section}>
          <div className={styles.sectionHead}><div><span>02</span><div><p className={styles.eyebrow}>DATA INTEGRITY</p><h2>수집 정합성</h2></div></div><small>지역·카테고리·최근 유입 분리 집계</small></div>
          <div className={styles.integrityGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>지역별 거래 표본</h3><p>상위 12개 행정동</p></div><MapPin size={18} /></div>
              <div className={styles.regionList}>
                {status.region_counts.length ? status.region_counts.map((region) => (
                  <div key={region.region_name}><span>{region.region_name}</span><i><b style={{ width: `${(region.transaction_count / maxRegionCount) * 100}%` }} /></i><strong>{number.format(region.transaction_count)}</strong></div>
                )) : <p className={styles.empty}>지역이 연결된 거래 데이터가 없습니다.</p>}
              </div>
            </article>
            <article className={styles.panel}>
              <div className={styles.panelHead}><div><h3>카테고리 구성</h3><p>원천 데이터 기준</p></div><Database size={18} /></div>
              <div className={styles.categoryList}>
                {status.category_counts.map((category, index) => (
                  <div key={category.category}><span>{String(index + 1).padStart(2, "0")}</span><b>{category.category}</b><strong>{number.format(category.transaction_count)}건</strong></div>
                ))}
              </div>
            </article>
          </div>
          <div className={styles.tablePanel}>
            <div className={styles.panelHead}><div><h3>최근 수집 거래</h3><p>운영 점검용 최신 8건</p></div><span className={styles.healthy}><i /> 오류 {status.recent_errors.length}건</span></div>
            <div className={styles.tableScroll}><table><thead><tr><th>ID</th><th>상품명</th><th>카테고리</th><th>지역</th><th>등록가</th><th>상태</th><th>등록일</th></tr></thead><tbody>
              {status.recent_transactions.map((transaction) => <tr key={transaction.id}><td>#{transaction.id}</td><td><strong>{transaction.product_title}</strong></td><td>{transaction.category}</td><td>{transaction.region_name ?? "미매칭"}</td><td>{money(transaction.price)}</td><td><span className={styles.statusChip}>{transaction.status}</span></td><td>{transaction.listed_at}</td></tr>)}
            </tbody></table></div>
          </div>
        </section>

        <section id="models" className={styles.section}>
          <div className={styles.sectionHead}><div><span>03</span><div><p className={styles.eyebrow}>MODEL VALIDATION</p><h2>가격 예측 검증</h2></div></div><small>Optuna 20회 · 시간순 홀드아웃 · 결정계수(R²)</small></div>
          <div className={styles.modelIntro}>
            <div><span className={styles.modelBadge}>검증 완료</span><h3>모델을 맹신하지 않고<br />설명력을 운영 기준으로 씁니다.</h3></div>
            <p>{number.format(validation.rows)}개 정제 표본을 학습·테스트 시간순으로 분리했습니다. R²와 MAE, 교차검증 편차를 함께 확인하고 낮은 설명력 구간은 클러스터 중앙값을 우선합니다.</p>
          </div>
          <div className={styles.modelGrid}>
            {validation.models.map((model) => (
              <article key={model.name} className={model.name === validation.selectedModel ? styles.selectedModel : styles.modelCard}>
                <div className={styles.modelTitle}><div><span>{model.name === validation.selectedModel ? "SELECTED" : "CHALLENGER"}</span><h3>{model.name}</h3></div><b>{model.overfitRisk} 위험</b></div>
                <strong className={styles.r2}>R² {model.testR2.toFixed(3)}</strong>
                <div className={styles.r2Track}><i style={{ width: `${Math.max(0, Math.min(100, model.testR2 * 100))}%` }} /></div>
                <dl><div><dt>학습 R²</dt><dd>{model.trainR2.toFixed(3)}</dd></div><div><dt>CV R²</dt><dd>{model.cvR2Mean.toFixed(3)} ± {model.cvR2Std.toFixed(3)}</dd></div><div><dt>테스트 MAE</dt><dd>{money(model.testMAE)}</dd></div></dl>
              </article>
            ))}
            <article className={styles.baselineCard}>
              <div className={styles.modelTitle}><div><span>BASELINE</span><h3>{validation.baseline.name}</h3></div></div>
              <strong className={styles.r2}>R² {validation.baseline.testR2.toFixed(3)}</strong>
              <p>학습 중앙값만 사용한 기준선입니다. 선택 모델 대비 R² 차이 <b>{(selectedModel.testR2 - validation.baseline.testR2).toFixed(3)}</b></p>
              <small>{validation.leakageGuard}</small>
            </article>
          </div>
          <Link className={styles.analysisLink} href="/analysis"><span><b>상세 분석 리포트</b><small>플랫폼·품목·분기·가설검정 전체 보기</small></span><ArrowUpRight size={20} /></Link>
        </section>

        <footer>GAJI ADMIN · 거래 운영 데이터는 백엔드 원천 집계, 모델 지표는 검증 산출물을 사용합니다.</footer>
      </div>
    </main>
  );
}
