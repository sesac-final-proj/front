/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/comparison-data.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const { reviewComparisons, reconcileRadarCategories, toggleRadarCategory } = context.exports;
const row = (platform, median, extra = {}) => ({ category: '밥솥', platform, sample_count: 20, mean_price: median, std_price: 10, p25_price: median - 10, median_price: median, p75_price: median + 10, ...extra });
test('platform aliases and price gaps use carrot as denominator', () => {
  const result = reviewComparisons([row('daangn', 100), row('joonggonara', 150), row('elecmart', 80)]);
  assert.equal(result.comparable.length, 1);
  assert.equal(result.gaps.find(r => r.platform === '중고나라').percent, 50);
  assert.ok(Math.abs(result.gaps.find(r => r.platform === '번개장터').percent + 20) < 1e-9);
});
test('missing platforms are not invented; zero price never divides', () => {
  const result = reviewComparisons([row('daangn', 0, { p25_price: 0 }), row('bunjang', 80)]);
  assert.equal(result.comparable.length, 0); assert.equal(result.gaps.length, 0);
});
test('duplicate groups and invalid quartiles excluded, not silently averaged', () => {
  const result = reviewComparisons([row('daangn', 100), row('당근', 120), row('joonggonara', 100, { p25_price: 150 }), row('elecmart', 100, { sample_count: 0 })]);
  assert.equal(result.rows.length, 0); assert.equal(result.excluded, 4);
});
test('radar selection stays between three and six visible categories', () => {
  const available = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  assert.deepEqual([...reconcileRadarCategories(['A'], available)], ['A', 'B', 'C']);
  assert.deepEqual([...toggleRadarCategory(['A', 'B', 'C'], 'A', available)], ['A', 'B', 'C']);
  assert.deepEqual([...toggleRadarCategory(['A', 'B', 'C'], 'D', available)], ['A', 'B', 'C', 'D']);
  assert.deepEqual([...toggleRadarCategory(['A', 'B', 'C', 'D', 'E', 'F'], 'G', available)], ['A', 'B', 'C', 'D', 'E', 'F']);
});
