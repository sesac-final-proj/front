import styles from "./OnboardingScreen.module.css";

type Avatar = { color: string; face?: boolean };

// row-major 5x4 grid; positions match the onboarding illustration mock
const AVATARS: Avatar[] = Array.from({ length: 20 }, (): Avatar => ({ color: "" }));
AVATARS[4] = { color: "#ffc870", face: true }; // row1 col5
AVATARS[8] = { color: "#ffa7a8", face: true }; // row2 col4
AVATARS[10] = { color: "#7537c5", face: true }; // row3 col1 (brand accent)
AVATARS[17] = { color: "#5cc9ff", face: true }; // row4 col3

function Face() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="5" cy="7" r="1.4" fill="rgba(0,0,0,0.55)" />
      <circle cx="13" cy="7" r="1.4" fill="rgba(0,0,0,0.55)" />
      <path
        d="M5 11c1 1.6 6 1.6 7 0"
        stroke="rgba(0,0,0,0.55)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function KakaoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2C5.03 2 1 5.14 1 9c0 2.42 1.62 4.56 4.06 5.8-.18.65-.65 2.35-.75 2.72-.12.46.17.45.36.33.15-.1 2.36-1.6 3.32-2.25.32.04.66.06 1.01.06 4.97 0 9-3.14 9-7S14.97 2 10 2z"
        fill="rgba(0,0,0,0.85)"
      />
    </svg>
  );
}

export default function OnboardingScreen() {
  return (
    <div className={styles.stage}>
      <div className={styles.phoneShell}>
        <div className={styles.content}>
          <section className={styles.onboarding}>
            <div className={styles.hero}>
              <h1 className={styles.title}>
                동네 거래, 이제 가볍게
                <br />
                <span className={styles.highlight}>가지마켓</span>으로 한 번에
              </h1>

              <div className={styles.illustration}>
                {AVATARS.map((avatar, i) =>
                  avatar.face ? (
                    <div
                      key={i}
                      className={`${styles.avatar} ${styles.avatarAccent}`}
                      style={{ background: avatar.color }}
                    >
                      <Face />
                    </div>
                  ) : (
                    <div key={i} className={styles.avatar} />
                  )
                )}
              </div>
            </div>

            <div className={styles.dots}>
              <span className={`${styles.dot} ${styles.dotActive}`} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </section>

          <div className={styles.actions}>
            {/* TODO: 로그인 모듈 붙일 때 카카오/네이버 OAuth 연동 */}
            <button
              type="button"
              className={`${styles.socialButton} ${styles.kakaoButton}`}
            >
              <KakaoMark />
              <span>3초만에 카카오로 시작하기</span>
            </button>
            <button
              type="button"
              className={`${styles.socialButton} ${styles.naverButton}`}
            >
              <span className={styles.naverMark}>N</span>
              <span>3초만에 네이버로 시작하기</span>
            </button>
          </div>

          <p className={styles.helper}>
            문제가 발생했나요?
            <br />
            <a href="#">오류 신고 및 문의는 여기를 눌러주세요.</a>
          </p>
        </div>
      </div>
    </div>
  );
}
