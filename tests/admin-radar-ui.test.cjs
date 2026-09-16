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
    if (url.includes("/price-comparison/overview")) return route.fulfill({ json: {
      categories: [],
      regions: categories.flatMap((category, index) => ["송파구", "영등포구", "노원구"].map((gu, guIndex) => ({ category, gu, sample_count: 20 + index + guIndex, median_price: 78000 + index * 12000 + guIndex * 5000, completion_rate: 54 + guIndex * 7, avg_manner_temp: 36.5 + guIndex }))),
      detail_types: categories.flatMap(category => ["송파구", "영등포구", "노원구"].flatMap(gu => ["기본형", "고급형"].map((detail_type, index) => ({ category, gu, detail_type, sample_count: 12 + index, median_price: 90000, cv_price: 18 + index })))),
    } });
    if (url.includes("/external-comparison")) return route.fulfill({ json: { items, source: "검증 표본", period: "2026-09", caveat: "테스트 데이터" } });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.addInitScript(() => {
    localStorage.setItem("gaji_admin_access_token", "test");
    localStorage.setItem("gaji_admin_refresh_token", "test");
  });
  await page.goto("http://localhost:3000/admin/insights");
  await page.getByRole("heading", { name: "품목별 거래 기준 비교" }).waitFor();
  return page;
}

test("selected product controls one radar", async () => {
  const page = await openRadar(1440);
  assert.equal(await page.getByLabel("비교 기준").inputValue(), "external");
  assert.equal(await page.locator("[class*='radarCard']").count(), 1);
  assert.equal(await page.getByText("당근 = 100 기준").count(), 1);
  const productSelect = page.locator("label").filter({ hasText: /^품목/ }).locator("select");
  await productSelect.selectOption("청소기");
  await page.getByRole("heading", { name: "청소기", exact: true }).waitFor();
  await page.getByLabel("비교 기준").selectOption("regions");
  assert.equal(await page.getByText("3개 구 비교").count(), 1);
  assert.equal(await productSelect.inputValue(), "청소기");
  assert.equal(await page.locator("canvas").first().isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  await page.close();
});

test("radar section has no horizontal overflow on mobile", async () => {
  const page = await openRadar(390);
  await page.getByLabel("비교 기준").selectOption("regions");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
  assert.equal(await page.locator("[class*='radarCard']").count(), 1);
  await page.close();
});
