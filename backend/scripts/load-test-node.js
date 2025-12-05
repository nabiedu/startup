#!/usr/bin/env node
/**
 * Load Testing Script (Node.js версия k6)
 * Проверяет performance endpoints при нагрузке
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const SCENARIOS = [
  { name: 'Health Check', path: '/health', method: 'GET', body: null },
  { name: 'Metrics', path: '/metrics', method: 'GET', body: null },
  { name: 'Register User', path: '/api/auth/register', method: 'POST', body: JSON.stringify({ email: `test${Date.now()}@example.com`, password: 'password123' }) },
  { name: 'Get Housing', path: '/api/housing', method: 'GET', body: null },
  { name: 'Get Jobs', path: '/api/jobs', method: 'GET', body: null },
  { name: 'Get Documents', path: '/api/documents', method: 'GET', body: null },
];

const VIRTUAL_USERS = 10;
const ITERATIONS = 100;

let results = {
  total: 0,
  passed: 0,
  failed: 0,
  times: [],
  errors: {},
};

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 5000,
    };

    if (body && method === 'POST') {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const startTime = Date.now();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        resolve({ status: res.statusCode, duration, data });
      });
    });

    req.on('error', (err) => {
      const duration = Date.now() - startTime;
      reject({ error: err.message, duration });
    });

    req.on('timeout', () => {
      req.destroy();
      const duration = Date.now() - startTime;
      reject({ error: 'TIMEOUT', duration });
    });

    if (body && method === 'POST') {
      req.write(body);
    }
    req.end();
  });
}

async function runLoadTest() {
  console.log('🔥 Load Testing Started');
  console.log(`📊 Virtual Users: ${VIRTUAL_USERS}`);
  console.log(`🔄 Iterations: ${ITERATIONS}`);
  console.log(`📍 Scenarios: ${SCENARIOS.length}`);
  console.log('---');

  const promises = [];
  let completed = 0;
  let errors = 0;

  for (let vu = 0; vu < VIRTUAL_USERS; vu++) {
    for (let iter = 0; iter < ITERATIONS; iter++) {
      for (const scenario of SCENARIOS) {
        const promise = (async () => {
          try {
            const result = await makeRequest(scenario.path, scenario.method, scenario.body);
            results.total++;
            results.times.push(result.duration);

            if (result.status >= 200 && result.status < 300) {
              results.passed++;
            } else {
              results.failed++;
              results.errors[scenario.name] = (results.errors[scenario.name] || 0) + 1;
            }

            completed++;
            if (completed % 50 === 0) {
              console.log(`  ✓ ${completed}/${VIRTUAL_USERS * ITERATIONS * SCENARIOS.length} requests completed`);
            }
          } catch (err) {
            results.total++;
            results.failed++;
            errors++;
            results.errors[scenario.name + ' (ERROR)'] = (results.errors[scenario.name + ' (ERROR)'] || 0) + 1;
          }
        })();

        promises.push(promise);
      }
    }
  }

  await Promise.all(promises);

  // Calculate stats
  const sorted = results.times.sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = results.times.reduce((a, b) => a + b, 0) / results.times.length;
  const max = Math.max(...results.times);
  const min = Math.min(...results.times);

  const failureRate = (results.failed / results.total) * 100;

  // Results
  console.log('\n📈 Load Test Results:');
  console.log('---');
  console.log(`✅ Passed: ${results.passed}/${results.total} (${((results.passed / results.total) * 100).toFixed(2)}%)`);
  console.log(`❌ Failed: ${results.failed}/${results.total} (${failureRate.toFixed(2)}%)`);
  console.log('');
  console.log('⏱️  Response Times:');
  console.log(`  - Min: ${min}ms`);
  console.log(`  - Avg: ${avg.toFixed(2)}ms`);
  console.log(`  - P50: ${p50}ms`);
  console.log(`  - P95: ${p95}ms`);
  console.log(`  - P99: ${p99}ms`);
  console.log(`  - Max: ${max}ms`);
  console.log('');
  console.log('🎯 Threshold Results:');
  console.log(`  - P95 < 500ms: ${p95 < 500 ? '✅ PASS' : '❌ FAIL'} (${p95}ms)`);
  console.log(`  - P99 < 1000ms: ${p99 < 1000 ? '✅ PASS' : '❌ FAIL'} (${p99}ms)`);
  console.log(`  - Failure Rate < 10%: ${failureRate < 10 ? '✅ PASS' : '❌ FAIL'} (${failureRate.toFixed(2)}%)`);
  
  if (Object.keys(results.errors).length > 0) {
    console.log('');
    console.log('⚠️  Error Summary:');
    for (const [key, count] of Object.entries(results.errors)) {
      console.log(`  - ${key}: ${count}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  
  // Final verdict
  const allThresholdsPassed = p95 < 500 && p99 < 1000 && failureRate < 10;
  if (allThresholdsPassed && results.failed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log('⚠️  Some tests did not pass all thresholds');
  }
  console.log('='.repeat(50));

  process.exit(allThresholdsPassed && results.failed === 0 ? 0 : 1);
}

// Run
console.log('');
runLoadTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
