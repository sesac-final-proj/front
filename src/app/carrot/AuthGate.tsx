"use client";

import { useEffect, useState } from "react";
import { getMe, AuthRequiredError } from "@/services/authService";
import { AUTH_TOKEN_STORAGE_KEY } from "@/services/tradeService";
import { DaangnSplash } from "./components/common/DaangnSplash";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1200;

// 서비스 전체를 로그인해야만 쓸 수 있게 막는 게이트. 토큰이 없거나(비로그인)
// 만료/폐기됐으면(getMe 실패) 온보딩(로그인) 화면으로 보낸다 — 게스트 모드는
// 더 이상 지원하지 않는다.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);
  // 여러 번 재시도해도 계속 실패할 때만 보여준다 — 로그아웃은 아니고 그냥 재시도 UI.
  const [showRetry, setShowRetry] = useState(false);

  // 일반 함수 선언(호이스팅) — useCallback으로 감싸면 재시도 재귀 호출이 자기 자신을
  // 선언 전에 참조하는 모양이 돼서(react-hooks 린트가 막음) 그냥 함수 선언으로 둔다.
  function runCheck(attempt: number) {
    setShowRetry(false);
    const token = typeof window !== "undefined" ? window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;
    if (!token) {
      window.location.replace("/onboarding");
      return;
    }
    getMe()
      .then((me) => {
        if (!me.nicknameSet) {
          window.location.replace("/onboarding/profile");
          return;
        }
        setChecked(true);
      })
      .catch((error: unknown) => {
        // AuthRequiredError(토큰이 없거나 refresh까지 실패)일 때만 진짜 로그아웃 —
        // 그 외(네트워크 순단, 서버 일시 오류 등)까지 로그아웃 취급하면 새로고침 몇 번만에
        // 멀쩡한 세션이 로그인 화면으로 튕겨나가는 버그가 된다.
        if (error instanceof AuthRequiredError) {
          try {
            window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          } catch {
            // 스토리지 접근 자체가 막혀 있어도 리다이렉트는 그대로 진행한다.
          }
          window.location.replace("/onboarding");
          return;
        }
        if (attempt + 1 < MAX_ATTEMPTS) {
          window.setTimeout(() => runCheck(attempt + 1), RETRY_DELAY_MS);
        } else {
          console.error("로그인 확인에 실패했습니다.", error);
          setShowRetry(true);
        }
      });
  }

  useEffect(() => {
    runCheck(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 최초 마운트 때 한 번만.
  }, []);

  if (showRetry) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100dvh", gap: 12, padding: 24 }}>
        <p style={{ textAlign: "center", fontSize: 15, fontWeight: 600 }}>
          로그인 확인에 실패했어요.
          <br />
          네트워크 상태를 확인해주세요.
        </p>
        <button
          type="button"
          onClick={() => runCheck(0)}
          style={{
            height: 44,
            padding: "0 20px",
            borderRadius: 10,
            border: 0,
            background: "#ff8a3d",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }
  if (!checked) {
    return <DaangnSplash message="로그인 확인 중..." subMessage="당근과 함께 따뜻한 동네를 만들어요" />;
  }
  return <>{children}</>;
}
