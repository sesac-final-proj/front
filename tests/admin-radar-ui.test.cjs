/* eslint-disable @typescript-eslint/no-require-imports */
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { chromium } = require("C:/Users/concr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const browserPromise = chromium.launch({ headless: true });
after(async () => (await browserPromise).close());

const categories = ["밥솥", "청소기", "마사지기", "분유포트", "음식물처리기", "뷰티기기", "공기청정기"];
const platforms = ["당근", "중고나라", "번개장터"];
const items = categories.flatMap((category, categoryIndex) => platforms.map((platform, platformIndex) => {
  const median = 80000 + categoryIndex * 12000 + platformIndex * 9000;
  return {
    category,
    platform,
    sample_count: 20 + categoryIndex + platformIndex,
    mean_price: median,
    std_price: 5000,
    p25_price: median - 10000,
    median_price: median,
    p75_price: median + 10000,
  };
}));

async function openRadar(width) {
  const browser = await browserPromise;
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.route("http://localhost:8000/**", route => {
    const url = route.request().url();
    if (url.includes("/auth/admin/me")) return route.fulfill({ json: { id: 1, email: "admin@example.com", nickname: "운영자", role: "admin" } });
    if (url.includes("/external-comparison")) return route.fulfill({ json: { items, source: "검증 표본", period: "2026-09", caveat: "테스트 데이터" } });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.addInitScript(() => {
    localStorage.setItem("gaji_admin_access_token", "test");
    localStorage.setItem("gaji_admin_refresh_token", "test");
  });
  await page.goto("http://localhost:3000/admin/insights");
  await page.getByRole("heading", { name: "플랫폼별 품목 가격 지수" }).waitFor();
  return page;
}

test("radar picker and plot stay coherent on desktop", async () => {
  const page = await openRadar(1440);
  assert.equal(await page.getByRole("checkbox").count(), 7);
  assert.equal(await page.getByRole("checkbox").evaluateAll(inputs => inputs.filter(input => input.checked).length), 6);
  assert.equal(await page.getByText("선택 6 / 6").isVisible(), true);
  await page.getByRole("checkbox", { name: "밥솥" }).uncheck();
  await page.getByRole("checkbox", { name: "청소기" }).check();
  assert.equal(await page.getByText("선택 6 / 6").isVisible(), true);
  assert.equal(await page.locator("canvas").first().isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  await page.screenshot({ path: "test-results/admin-radar-desktop.png", fullPage: true });
  await page.close();
});

test("radar section has no horizontal overflow on mobile", async () => {
  const page = await openRadar(390);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.equal(await page.getByRole("checkbox").first().evaluate(input => getComputedStyle(input.closest("label")).minHeight), "44px");
  await page.close();
});
