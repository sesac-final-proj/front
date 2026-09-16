const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function client(fetch) {
  const values = new Map([["gaji_admin_access_token", "old"], ["gaji_admin_refresh_token", "refresh"]]);
  const localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const redirects = [];
  const context = { exports: {}, process: { env: {} }, fetch, Headers, Response, URL, localStorage, window: { localStorage, location: { pathname: "/admin", replace: path => redirects.push(path) } } };
  const source = readFileSync("src/services/adminService.ts", "utf8");
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return { api: context.exports, values, redirects };
}
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

test("concurrent and delayed 401s share one refresh and retry with the new token", async () => {
  let refreshes = 0;
  let releaseRefresh;
  let releaseLate;
  const gate = new Promise(resolve => { releaseRefresh = resolve; });
  const late = new Promise(resolve => { releaseLate = resolve; });
  const c = client(async (path, init) => {
    if (path.includes("/refresh")) { refreshes++; await gate; return json({ access_token: "new", refresh_token: "rotated" }); }
    if (init.headers.get("Authorization") === "Bearer old") { if (path === "/late") await late; return json({}, 401); }
    assert.equal(init.headers.get("Authorization"), "Bearer new");
    return json({ ok: true });
  });
  const calls = [c.api.adminAuthorizedFetch("/one"), c.api.adminAuthorizedFetch("/two"), c.api.adminAuthorizedFetch("/late")];
  releaseRefresh();
  await Promise.all(calls.slice(0, 2));
  releaseLate();
  await Promise.all(calls);
  assert.equal(refreshes, 1);
  assert.equal(c.values.get("gaji_admin_refresh_token"), "rotated");
});
test("failed refresh clears both tokens and redirects to login", async () => {
  const c = client(async () => json({}, 401));
  await assert.rejects(c.api.adminAuthorizedFetch("/one"));
  assert.equal(c.values.size, 0);
  assert.deepEqual(c.redirects, ["/admin/login"]);
});
test("retry stops after one attempt", async () => {
  let requests = 0;
  const c = client(async path => { requests++; return path.includes("/refresh") ? json({ access_token: "new", refresh_token: "rotated" }) : json({}, 401); });
  await assert.rejects(c.api.adminAuthorizedFetch("/one"));
  assert.equal(requests, 3);
});
test("incorrect current password does not refresh or clear the session", async () => {
  let requests = 0;
  const c = client(async () => { requests++; return json({ detail: "현재 비밀번호가 올바르지 않습니다." }, 401); });
  await assert.rejects(c.api.changeAdminPassword("wrong", "new-password"));
  assert.equal(requests, 1);
  assert.equal(c.values.size, 2);
});
test("logout clears local tokens even when the server is unreachable", async () => {
  const c = client(async () => { throw new Error("offline"); });
  await assert.rejects(c.api.logoutAdmin());
  assert.equal(c.values.size, 0);
});
