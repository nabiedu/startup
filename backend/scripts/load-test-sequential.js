#!/usr/bin/env node
/**
 * Simple Sequential Load Test
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:4000';

const delay = (ms) => new Promise(r => setTimeout(r, ms));

const tests = [
  { name: 'GET /health', url: '/health' },
  { name: 'GET /metrics', url: '/metrics' },
  { name: 'GET /api/housing', url: '/api/housing?page=1' },
  { name: 'GET /api/jobs', url: '/api/jobs?page=1' },
  { name: 'GET /api/documents', url: '/api/documents?page=1' },
];

async function runTest() {
  console.log('\n✅ API Endpoints Load Test (Sequential)\n');
  
  let passed = 0;
  let failed = 0;
  let totalTime = 0;

  for (let i = 0; i < 10; i++) {
    console.log(`Round ${i + 1}/10:`);
    
    for (const test of tests) {
      const start = Date.now();
      try {
        const res = await axios.get(BASE_URL + test.url, { 
          timeout: 5000,
          validateStatus: () => true,
        });
        const time = Date.now() - start;
        totalTime += time;
        
        if (res.status >= 200 && res.status < 300) {
          console.log(`  ✅ ${test.name} - ${time}ms`);
          passed++;
        } else {
          console.log(`  ❌ ${test.name} - ${res.status} (${time}ms)`);
          failed++;
        }
      } catch (err) {
        const time = Date.now() - start;
        totalTime += time;
        console.log(`  ❌ ${test.name} - ERROR: ${err.message}`);
          failed++;
      }
      await delay(100); // Rate limit friendly
    }
  }  const total = passed + failed;
  const failureRate = (failed / total) * 100;
  const avgTime = totalTime / total;

  console.log('\n📊 Summary:');
  console.log(`  Total: ${total}, Passed: ${passed}, Failed: ${failed}`);
  console.log(`  Failure Rate: ${failureRate.toFixed(2)}%`);
  console.log(`  Avg Response Time: ${avgTime.toFixed(0)}ms`);
  console.log('');
  console.log('🎯 Thresholds:');
  console.log(`  Failure Rate < 5%: ${failureRate < 5 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Avg Time < 200ms: ${avgTime < 200 ? '✅ PASS' : '❌ FAIL'}`);
  console.log('');

  const result = failureRate < 5 && avgTime < 200;
  console.log(result ? '🎉 LOAD TEST PASSED\n' : '⚠️  Load test did not meet thresholds\n');

  process.exit(result ? 0 : 1);
}

runTest().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
