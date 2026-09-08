"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin } from "lucide-react";
import { AUTH_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY } from "@/services/tradeService";
import styles from "./OnboardingScreen.module.css";

// carrot/GajiMarketApp.tsx와 동일한 패턴 (NEXT_PUBLIC_API_BASE_URL 비어있으면 상대경로).
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
function apiUrl(path: string) {
  return API_BASE_URL ? new URL(path, API_BASE_URL).toString() : path;
}

async function startSocialLogin(provider: "kakao" | "naver") {
  try {
    const res = await fetch(apiUrl(`/api/v1/auth/login/${provider}`));
    if (!res.ok) {
      alert(`${provider} 로그인 URL 생성 실패. 백엔드 설정을 확인해주세요.`);
      return;
    }
    const { auth_url: authUrl } = (await res.json()) as { auth_url: string };
    window.location.href = authUrl;
  } catch (err) {
    alert("백엔드 서버(8000포트) 연결에 실패했습니다.");
  }
}

type AccentIcon = "face" | "map" | "heart";

type Feature = {
  key: string;
  line1: string;
  highlight: string;
  line2Suffix: string;
  avatarBg: string;
  icon: AccentIcon;
  accents: Record<number, string>; // grid index -> color
};

// same 5x4 grid positions reused across slides for a consistent rhythm
const FEATURES: Feature[] = [
  {
    key: "market-start",
    line1: "중고거래의 시작",
    highlight: "당근",
    line2Suffix: "으로 가볍게",
    avatarBg: "#fff1df",
    icon: "face",
    accents: { 4: "#ffb347", 8: "#ff8a5b", 10: "#ff6f0f", 17: "#ffc870" },
  },
  {
    key: "neighborhood-info",
    line1: "동네 정보, 이제 든든하게",
    highlight: "우리 동네",
    line2Suffix: "를 한눈에",
    avatarBg: "#ffe9d8",
    icon: "map",
    accents: { 4: "#ff9d4d", 8: "#ff7b54", 10: "#ff6f0f", 17: "#f2c14d" },
  },
  {
    key: "dream-gaji",
    line1: "기부는 함께",
    highlight: "꿈가지",
    line2Suffix: "로 이어져요",
    avatarBg: "#fff3eb",
    icon: "heart",
    accents: { 4: "#ff8e45", 8: "#ff6f0f", 10: "#ffb056", 17: "#ffc36a" },
  },
];

function AccentGlyph({ icon }: { icon: AccentIcon }) {
  if (icon === "map") return <MapPin size={16} color="rgba(0,0,0,0.55)" strokeWidth={2.4} />;
  if (icon === "heart") return <Heart size={16} color="rgba(0,0,0,0.55)" strokeWidth={2.4} />;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="5" cy="7" r="1.4" fill="rgba(0,0,0,0.55)" />
      <circle cx="13" cy="7" r="1.4" fill="rgba(0,0,0,0.55)" />
      <path d="M5 11c1 1.6 6 1.6 7 0" stroke="rgba(0,0,0,0.55)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FeatureGrid({ feature }: { feature: Feature }) {
  return (
    <div className={styles.illustration}>
      {Array.from({ length: 20 }, (_, i) => {
        const accentColor = feature.accents[i];
        if (!accentColor) {
          return <div key={i} className={styles.avatar} style={{ background: feature.avatarBg }} />;
        }
        return (
          <div
            key={i}
            className={`${styles.avatar} ${styles.avatarAccent}`}
            style={{ background: accentColor }}
          >
            <AccentGlyph icon={feature.icon} />
          </div>
        );
      })}
    </div>
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

const AUTOPLAY_MS = 4000;

function FeatureCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const [active, setActive] = useState(0);

  const goTo = (index: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.clientWidth, behavior: "smooth" });
  };

  const startAutoplay = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const current = Math.round(el.scrollLeft / el.clientWidth);
      goTo((current + 1) % FEATURES.length);
    }, AUTOPLAY_MS);
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => clearInterval(timerRef.current);
  }, [startAutoplay]);

  // ponytail: pause autoplay while the user is dragging, resume shortly after they let go
  const pause = () => clearInterval(timerRef.current);

  const handleScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      <div
        ref={trackRef}
        className={styles.carousel}
        onScroll={handleScroll}
        onPointerDown={pause}
        onPointerUp={startAutoplay}
        onPointerLeave={startAutoplay}
      >
        {FEATURES.map((feature) => (
          <div className={styles.slide} key={feature.key}>
            <h1 className={styles.title}>
              {feature.line1}
              <br />
              <span className={styles.highlight}>{feature.highlight}</span>
              {feature.line2Suffix}
            </h1>
            <FeatureGrid feature={feature} />
          </div>
        ))}
      </div>

      <div className={styles.dots}>
        {FEATURES.map((feature, i) => (
          <button
            key={feature.key}
            type="button"
            aria-label={`${feature.key} 슬라이드로 이동`}
            aria-current={active === i}
            className={`${styles.dot} ${active === i ? styles.dotActive : ""}`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();

  const handleDevLogin = async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "test@test.com", password: "test1234" }),
      });
      if (!res.ok) {
        alert("테스트 계정 로그인 실패: 백엔드 응답 오류");
        return;
      }
      const data = await res.json();
      localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refresh_token);
      router.push("/carrot");
    } catch {
      alert("백엔드 서버(8000포트) 연결에 실패했습니다.");
    }
  };

  return (
    <div className={styles.stage}>
      <div className={styles.phoneShell}>
        <div className={styles.content}>
          <section className={styles.onboarding}>
            <FeatureCarousel />
          </section>

          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.socialButton} ${styles.kakaoButton}`}
              onClick={() => startSocialLogin("kakao")}
            >
              <KakaoMark />
              <span>3초만에 카카오로 시작하기</span>
            </button>
            <button
              type="button"
              className={`${styles.socialButton} ${styles.naverButton}`}
              onClick={() => startSocialLogin("naver")}
            >
              <span className={styles.naverMark}>N</span>
              <span>3초만에 네이버로 시작하기</span>
            </button>
            <button
              type="button"
              className={styles.socialButton}
              style={{ background: "#4B5563", color: "#ffffff", marginTop: "4px" }}
              onClick={handleDevLogin}
            >
              ⚡ 개발용 테스트 계정 1초 로그인
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
