/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const context = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/components/admin/comparison-data.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const { reviewComparisons, reconcileRadarSeries, toggleRadarSeries, normalizedRadarValues, carrotBenchmarkValues, regionRadarValues, comparisonDecisions } = context.exports;
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
test('radar selection stays between two and three comparison series', () => {
  const available = ['A', 'B', 'C', 'D'];
  assert.deepEqual([...reconcileRadarSeries(['A'], available)], ['A', 'B']);
  assert.deepEqual([...toggleRadarSeries(['A', 'B'], 'A', available)], ['A', 'B']);
  assert.deepEqual([...toggleRadarSeries(['A', 'B'], 'C', available)], ['A', 'B', 'C']);
  assert.deepEqual([...toggleRadarSeries(['A', 'B', 'C'], 'D', available)], ['A', 'B', 'C']);
});
test('radar metrics normalize per axis and equal values stay neutral', () => {
  const values = normalizedRadarValues([row('daangn', 100), row('joonggonara', 150)]);
  assert.equal(values[0].length, 6);
  assert.equal(values[0][0], 50);
  assert.equal(values[0][1], 0);
  assert.equal(values[1][1], 100);
});
test('external radar uses carrot as the fixed 100 benchmark', () => {
  const values = carrotBenchmarkValues([row('daangn', 100), row('joonggonara', 150)]);
  assert.deepEqual([...values[0]], [100, 100, 100, 100, 100, 100]);
  assert.equal(values[1][1], 150);
  assert.equal(values[1][4], 150);
});
test('regional radar derives six dimensions from regional and detail statistics', () => {
  const values = regionRadarValues([
    { category: '밥솥', gu: 'A구', sample_count: 20, median_price: 100, completion_rate: 60, avg_manner_temp: 40 },
    { category: '밥솥', gu: 'B구', sample_count: 10, median_price: 120, completion_rate: 70, avg_manner_temp: 38 },
  ], [{ category: '밥솥', gu: 'A구', detail_type: '기본', sample_count: 10, median_price: 100, cv_price: 20 }], 100);
  assert.equal(values[0].length, 6);
  assert.equal(values[0][0], 100);
  assert.equal(values[1][0], 120);
  assert.equal(values[0][1], 100);
});
test('operational decisions rank material price gaps and retain sample context', () => {
  const result = comparisonDecisions([
    row('daangn', 100, { sample_count: 30 }), row('joonggonara', 150, { sample_count: 40 }), row('elecmart', 130, { sample_count: 50 }),
  ]);
  assert.equal(result.totalSamples, 120);
  assert.equal(result.coverage, 100);
  assert.equal(result.decisions[0].priority, '높음');
  assert.equal(result.decisions[0].action, '가격 경쟁력 홍보');
  assert.ok(Math.abs(result.decisions[0].gapPercent - 40) < 1e-9);
  assert.equal(result.decisions[0].externalSamples, 90);
});
