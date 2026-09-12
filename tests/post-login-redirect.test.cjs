const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");

const read = path => readFileSync(path, "utf8");

// 결제 QR(/carrot?pay=<id>) 같은 딥링크로 비로그인 상태에서 들어오면 AuthGate가
// /onboarding으로 풀 페이지 이동하면서 쿼리스트링을 잃어버리던 버그 — 목적지를
// localStorage에 남겨뒀다가 로그인 완료 후 되돌아오는지 각 단계별로 확인.

test("AuthGate saves the redirect target before bouncing to onboarding", () => {
  const source = read("src/app/carrot/AuthGate.tsx");

  assert.match(source, /function saveRedirectTarget/);
  assert.match(source, /POST_LOGIN_REDIRECT_STORAGE_KEY/);
  // 토큰 없음, AuthRequiredError 두 경로 모두 온보딩으로 보내기 전에 저장해야 한다.
  const onboardingRedirects = [...source.matchAll(/window\.location\.replace\("\/onboarding"\)/g)];
  assert.ok(onboardingRedirects.length >= 2, "onboarding으로 보내는 경로가 최소 2곳 있어야 한다");
  for (const match of onboardingRedirects) {
    const before = source.slice(Math.max(0, match.index - 120), match.index);
    assert.match(before, /saveRedirectTarget\(\);/, "onboarding으로 보내기 직전에 saveRedirectTarget 호출이 있어야 한다");
  }
});

test("auth callback and onboarding profile consume the saved redirect instead of hardcoding /carrot", () => {
  const callback = read("src/app/auth/callback/page.tsx");
  assert.match(callback, /consumePostLoginRedirect\(\) \?\? "\/carrot"/);

  const profile = read("src/app/onboarding/profile/page.tsx");
  const consumeCalls = [...profile.matchAll(/consumePostLoginRedirect\(\) \?\? "\/carrot"/g)];
  assert.ok(consumeCalls.length >= 2, "이미 닉네임 설정됨 / 저장 완료 두 경로 모두 redirect를 소비해야 한다");
});
