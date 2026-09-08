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
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  AdminAudienceInsights,
  AdminDataStatus,
  AdminProfile,
  getAdminAudienceInsights,
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
  const [insights, setInsights] = useState<AdminAudienceInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const [admin, dataStatus, validationData, audienceInsights] = await Promise.all([
      getAdminProfile(),
      getAdminDataStatus(),
      fetch("/model-validation.json").then((response) => {
        if (!response.ok) throw new Error("모델 검증 결과를 불러오지 못했습니다.");
        return response.json() as Promise<ModelValidation>;
      }),
      getAdminAudienceInsights(),
    ]);
    setProfile(admin);
    setStatus(dataStatus);
    setValidation(validationData);
    setInsights(audienceInsights);
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

  if (!profile || !status || !validation || !insights) {
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
          <a href="#interpretation"><MessageSquareText size={17} />해석 브리핑</a>
          <a href="#keywords"><Tags size={17} />LLM·키워드</a>
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

        <section id="interpretation" className={styles.section}>
          <div className={styles.sectionHead}><div><span>02</span><div><p className={styles.eyebrow}>READER-FIRST ANALYSIS</p><h2>관리자 해석 브리핑</h2></div></div><small>정제 표본 {number.format(insights.population.rows)}건 · 2개 플랫폼</small></div>
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
        </section>

        <section id="keywords" className={styles.section}>
          <div className={styles.sectionHead}><div><span>03</span><div><p className={styles.eyebrow}>SEMANTIC LAYER</p><h2>키워드와 LLM 카테고리</h2></div></div><small>{insights.llm.provider} · {insights.llm.model}</small></div>
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
        </section>

        <section id="integrity" className={styles.section}>
          <div className={styles.sectionHead}><div><span>04</span><div><p className={styles.eyebrow}>DATA INTEGRITY</p><h2>수집 정합성</h2></div></div><small>지역·카테고리·최근 유입 분리 집계</small></div>
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
          <div className={styles.sectionHead}><div><span>05</span><div><p className={styles.eyebrow}>MODEL VALIDATION</p><h2>가격 예측 검증</h2></div></div><small>Optuna 20회 · 시간순 홀드아웃 · 결정계수(R²)</small></div>
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
