"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 백엔드 /auth/callback/{provider}(app/api/v1/auth/router.py)가 소셜 로그인
// 완료 후 토큰을 쿼리스트링에 담아 여기로 리다이렉트한다.
function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const accessToken = params?.get("access_token");
    const refreshToken = params?.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/onboarding");
      return;
    }

    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    router.replace("/carrot");
  }, [params, router]);

  return <p style={{ padding: 24 }}>로그인 처리 중...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p style={{ padding: 24 }}>로그인 처리 중...</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
