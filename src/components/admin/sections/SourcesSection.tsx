"use client";
import type { AdminAudienceInsights } from "@/services/adminService";
import type { ModelValidation } from "./types";
import styles from "@/app/admin/admin.module.css";

const number = new Intl.NumberFormat("ko-KR");

export default function SourcesSection({ validation, insights }: { validation: ModelValidation | null; insights: AdminAudienceInsights | null }) {
  if (!insights || !validation) return null;

  const models = validation.models ?? [];
  const selectedModel = models.find(model => model.name === validation.selectedModel) ?? models[0] ?? { name: "RandomForest", testR2: 0.5 };
  const challengerModel = models.find(model => model.name !== validation.selectedModel) ?? models[1] ?? models[0] ?? { name: "LightGBM", testR2: 0.44 };

  const sources = insights.sourceValidation?.sources ?? [];
  const futureSlots = insights.sourceValidation?.futureSlots ?? [];
  const acceptance = insights.sourceValidation?.acceptance ?? [];

  return (
    <section id="external-sources" className={styles.section}>
      <div className={styles.sectionHead}>
        <div>
          <span>EXT·03</span>
          <div>
            <p className={styles.eyebrow}>EXTERNAL SOURCE READINESS</p>
            <h2>외부 중고거래 수집원 관리</h2>
          </div>
        </div>
        <small>중고나라·번개장터 CSV 실시간 집계</small>
      </div>

      <div className={styles.sourceIntro}>
        <div>
          <span>현재 분석 입력</span>
          <h3>검증된 크롤링 데이터만<br />가격 비교에 사용합니다.</h3>
        </div>
        <p>
          새 플랫폼 데이터가 추가되면 먼저 동일한 컬럼 계약과 품질 기준(비현실가 가드, 소모품 필터, 식별자 정규화)을 통과해야 합니다.
          연결 예정 슬롯은 공간만 제공하며 현재 표본수·가격·모델 지표에는 포함되지 않습니다.
        </p>
      </div>

      <div className={styles.sourceGrid}>
        {sources.map((source) => (
          <article key={source.id}>
            <div>
              <span className={styles.sourceReady}><i />{source.status}</span>
              <small>{source.kind}</small>
            </div>
            <h3>{source.name}</h3>
            <strong>{number.format(source.rows)}<small>건</small></strong>
            <dl>
              <div><dt>가격 유효</dt><dd>{number.format(source.pricedRows)}건</dd></div>
              <div><dt>모델 식별</dt><dd>{source.modelKnownRate}%</dd></div>
              <div><dt>중복 ID</dt><dd>{source.duplicateIds}건</dd></div>
              <div><dt>날짜 확인</dt><dd>{source.datedRate}%</dd></div>
            </dl>
          </article>
        ))}
        {futureSlots.map((slot) => (
          <article key={slot.id} className={styles.futureSource}>
            <div>
              <span>{slot.status}</span>
              <small>분석 미포함</small>
            </div>
            <h3>{slot.name}</h3>
            <p>{slot.description}</p>
            <button type="button" disabled>데이터 연결 전</button>
          </article>
        ))}
      </div>

      {acceptance.length > 0 && (
        <div className={styles.acceptancePanel}>
          <div>
            <p className={styles.eyebrow}>ADMISSION GATE</p>
            <h3>분석 편입 기준</h3>
          </div>
          <ol>
            {acceptance.map((rule, index) => (
              <li key={rule}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {rule}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className={styles.trainingProof}>
        <div>
          <span>CHALLENGER</span>
          <h3>{challengerModel.name}</h3>
          <strong>Test R² {challengerModel.testR2.toFixed(3)}</strong>
          <p>비선형 가격 패턴을 검증한 경쟁 모델</p>
        </div>
        <div>
          <span>TUNING & LEAKAGE GUARD</span>
          <h3>Optuna 15 trials</h3>
          <strong>시간순 80/20 홀드아웃</strong>
          <p>{validation.leakageGuard}</p>
        </div>
        <div>
          <span>SELECTION</span>
          <h3>{selectedModel.name}</h3>
          <strong>Test R² {selectedModel.testR2.toFixed(3)}</strong>
          <p>현재 검증 표본에서 선택된 모델. 낮은 설명력 구간은 계층적 중앙값 우선</p>
        </div>
      </div>
    </section>
  );
}
