const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { chromium } = require("C:/Users/concr/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const browserPromise = chromium.launch({ headless: true });
after(async () => (await browserPromise).close());

const overview = {
  summary: { total_transactions: 13239, price_eligible_transactions: 12757, price_eligible_rate: 96.4, active_regions: 83, average_listing_price: 108621 },
  collection_trend: Array.from({ length: 14 }, (_, index) => ({ date: `2026-09-${String(index + 1).padStart(2, "0")}`, transaction_count: index * 17 })),
  trade_status: [{ status: "거래완료", transaction_count: 8063 }, { status: "거래중", transaction_count: 4413 }],
  region_ranking: [{ region_name: "영등포구 양평제1동", transaction_count: 978 }],
  price_distribution: [{ label: "5만원 미만", transaction_count: 3270 }, { label: "5–10만원", transaction_count: 4891 }],
  source: { name: "당근 수집 거래", status: "available", last_collected_at: "2026-09-07T01:51:03Z" },
  recent_transactions: [],
};

for (const viewport of [{ name: "desktop", width: 1440, columns: 4 }, { name: "tablet", width: 900, columns: 4 }, { name: "mobile", width: 390, columns: 1 }]) {
  test(`${viewport.name} dashboard layout`, async () => {
    const browser = await browserPromise;
    const page = await browser.newPage({ viewport: { width: viewport.width, height: 900 } });
    await page.route("http://localhost:8000/**", route => {
      const url = route.request().url();
      if (url.includes("/auth/admin/me")) return route.fulfill({ json: { id: 1, email: "admin@example.com", nickname: "운영자", role: "admin" } });
      if (url.includes("/dashboard/overview")) return route.fulfill({ json: overview });
      return route.fulfill({ status: 404, json: {} });
    });
    await page.addInitScript(() => {
      localStorage.setItem("gaji_admin_access_token", "test");
      localStorage.setItem("gaji_admin_refresh_token", "test");
    });
    await page.goto(process.env.ADMIN_TEST_URL ?? "http://localhost:3000/admin");
    await page.getByText("13,239건").waitFor();
    await page.getByText("중고거래 가격 분포").waitFor();
    const columns = await page.locator('[class*="metrics"]').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
    assert.equal(columns, viewport.columns);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), false);
    const nav = page.locator('nav[aria-label="관리자 메뉴"]');
    if (viewport.width < 1024) {
      assert.equal(await nav.isVisible(), false);
      await page.getByLabel("관리자 메뉴 열기").click();
      assert.equal(await nav.isVisible(), true);
    } else {
      assert.equal(await nav.isVisible(), true);
    }
    await page.close();
  });
}

test("small tablet uses two KPI columns", async () => {
  const browser = await browserPromise;
  const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
  await page.route("http://localhost:8000/**", route => route.request().url().includes("/auth/admin/me")
    ? route.fulfill({ json: { id: 1, email: "admin@example.com", nickname: "운영자", role: "admin" } })
    : route.fulfill({ json: overview }));
  await page.addInitScript(() => { localStorage.setItem("gaji_admin_access_token", "test"); localStorage.setItem("gaji_admin_refresh_token", "test"); });
  await page.goto(process.env.ADMIN_TEST_URL ?? "http://localhost:3000/admin");
  await page.getByText("13,239건").waitFor();
  const columns = await page.locator('[class*="metrics"]').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  assert.equal(columns, 2);
  await page.close();
});

test("every sidebar destination has its own route", async () => {
  const browser = await browserPromise;
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route("http://localhost:8000/**", route => route.request().url().includes("/auth/admin/me")
    ? route.fulfill({ json: { id: 1, email: "admin@example.com", nickname: "운영자", role: "admin" } })
    : route.fulfill({ status: 503, json: { detail: "test unavailable" } }));
  await page.addInitScript(() => { localStorage.setItem("gaji_admin_access_token", "test"); localStorage.setItem("gaji_admin_refresh_token", "test"); });
  const destinations = [
    ["/admin/trades", "거래 데이터 탐색"], ["/admin/quality", "수집 품질"],
    ["/admin/insights", "비교 인사이트"], ["/admin/sources", "수집원 관리"],
    ["/admin/price-model", "가격 모델"], ["/admin/donations", "꿈가지 분석"],
    ["/admin/notices", "공지·기부"], ["/admin/system", "구현 현황"],
    ["/admin/settings", "환경설정"],
  ];
  for (const [path, heading] of destinations) {
    await page.goto(`http://localhost:3000${path}`);
    await page.getByRole("heading", { name: heading, exact: true }).first().waitFor();
    assert.equal(new URL(page.url()).pathname, path);
  }
  await page.goto("http://localhost:3000/admin/analysis");
  await page.waitForURL("**/admin/quality");
  await page.close();
});
