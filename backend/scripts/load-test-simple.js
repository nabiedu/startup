#!/usr/bin/env node
/**
 * Load Testing Script using Axios
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';
const VUS = 5;
const ITERATIONS = 20;

const scenarios = [
  { name: 'Health', url: '/health' },
  { name: 'Metrics', url: '/metrics' },
  { name: 'Housing', url: '/api/housing' },
  { name: 'Jobs', url: '/api/jobs' },
  { name: 'Documents', url: '/api/documents' },
];

let stats = {
  total: 0,
  success: 0,
  failed: 0,
  times: [],
};

async function runTest() {
  console.log('\n🔥 Load Test Started');
  console.log(`  VUs: ${VUS}, Iterations: ${ITERATIONS}, Scenarios: ${scenarios.length}`);
  console.log(`  Total requests: ${VUS * ITERATIONS * scenarios.length}`);
  console.log('');

  const start = Date.now();

  for (let vu = 0; vu < VUS; vu++) {
    for (let iter = 0; iter < ITERATIONS; iter++) {
      const promises = scenarios.map(async (scenario) => {
        const reqStart = Date.now();
        try {
          const res = await axios.get(BASE_URL + scenario.url, { timeout: 5000 });
          const duration = Date.now() - reqStart;
          stats.total++;
          stats.success++;
          stats.times.push(duration);
        } catch (err) {
          const duration = Date.now() - reqStart;
          stats.total++;
          stats.failed++;
          stats.times.push(duration);
        }
      });
      await Promise.all(promises);
    }

    process.stdout.write(`\r  Progress: ${(((vu + 1) * ITERATIONS / (VUS * ITERATIONS)) * 100).toFixed(0)}%`);
  }

  const totalTime = Date.now() - start;

  // Analyze
  stats.times.sort((a, b) => a - b);
  const p50 = stats.times[Math.floor(stats.times.length * 0.5)];
  const p95 = stats.times[Math.floor(stats.times.length * 0.95)];
  const p99 = stats.times[Math.floor(stats.times.length * 0.99)];
  const avg = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
  const min = Math.min(...stats.times);
  const max = Math.max(...stats.times);

  const failRate = (stats.failed / stats.total) * 100;
  const rps = (stats.total / (totalTime / 1000)).toFixed(2);

  console.log('\n\n📊 Results:\n');
  console.log(`✅ Success: ${stats.success}/${stats.total}`);
  console.log(`❌ Failed: ${stats.failed}/${stats.total}`);
  console.log(`📈 Failure Rate: ${failRate.toFixed(2)}%`);
  console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`🚀 RPS: ${rps}`);
  console.log('');
  console.log('Response Times:');
  console.log(`  min: ${min}ms, avg: ${avg.toFixed(0)}ms, p50: ${p50}ms`);
  console.log(`  p95: ${p95}ms, p99: ${p99}ms, max: ${max}ms`);
  console.log('');
  console.log('Thresholds:');
  console.log(`  p95 < 500ms: ${p95 < 500 ? '✅ PASS' : '❌ FAIL'} (${p95}ms)`);
  console.log(`  p99 < 1000ms: ${p99 < 1000 ? '✅ PASS' : '❌ FAIL'} (${p99}ms)`);
  console.log(`  failure rate < 10%: ${failRate < 10 ? '✅ PASS' : '❌ FAIL'} (${failRate.toFixed(2)}%)`);
  console.log('');

  const passed = p95 < 500 && p99 < 1000 && failRate < 10;
  console.log(passed ? '🎉 ALL THRESHOLDS PASSED!\n' : '⚠️  Some thresholds not met\n');

  process.exit(passed ? 0 : 1);
}

runTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
