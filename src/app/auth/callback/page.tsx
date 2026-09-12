"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_TOKEN_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY, consumePostLoginRedirect } from "@/services/tradeService";
import { getMe } from "@/services/authService";
import { DaangnSplash } from "@/app/carrot/components/common/DaangnSplash";

// 백엔드 /auth/callback/{provider}(app/api/v1/auth/router.py)가 소셜 로그인
// 완료 후 토큰을 쿼리스트링에 담아 여기로 리다이렉트한다.
function AuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const errorMsg = params?.get("error");
    if (errorMsg) {
      alert(errorMsg);
      router.replace("/onboarding");
      return;
    }

    const accessToken = params?.get("access_token");
    const refreshToken = params?.get("refresh_token");

    if (!accessToken || !refreshToken) {
      router.replace("/onboarding");
      return;
    }

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);

    // 닉네임(+전화번호) 설정을 아직 안 끝냈으면 홈으로 보내지 않고 이어서 받는다 —
    // 이 경우 결제 QR 등 원래 목적지는 onboarding/profile이 이어서 소비하도록 남겨둔다.
    getMe()
      .then((me) => router.replace(me.nicknameSet ? consumePostLoginRedirect() ?? "/carrot" : "/onboarding/profile"))
      .catch(() => router.replace("/onboarding/profile"));
  }, [params, router]);

  return <DaangnSplash message="로그인 처리 중..." subMessage="당근 계정 정보를 안전하게 연결하고 있어요" />;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<DaangnSplash message="로그인 처리 중..." subMessage="당근 계정 정보를 안전하게 연결하고 있어요" />}>
      <AuthCallbackInner />
    </Suspense>
  );
}
