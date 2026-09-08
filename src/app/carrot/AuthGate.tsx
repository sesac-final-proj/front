"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/services/authService";
import { AUTH_TOKEN_STORAGE_KEY } from "@/services/tradeService";

// 서비스 전체를 로그인해야만 쓸 수 있게 막는 게이트. 토큰이 없거나(비로그인)
// 만료/폐기됐으면(getMe 실패) 온보딩(로그인) 화면으로 보낸다 — 게스트 모드는
// 더 이상 지원하지 않는다.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
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
      .catch(() => {
        try {
          window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        } catch {}
        window.location.replace("/onboarding");
      });
  }, [router]);

  if (!checked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f8f9fa" }}>
        <p style={{ color: "#868b94", fontSize: "15px", fontWeight: 500 }}>로그인 확인 중...</p>
      </div>
    );
  }
  return <>{children}</>;
}
