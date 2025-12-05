#!/usr/bin/env node

/**
 * ============================================================================
 * test-endpoints.js — Быстрая проверка всех API endpoints
 * Запуск: node test-endpoints.js
 * ============================================================================
 */

const http = require('http');
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const BASE_URL = 'http://localhost:4000';
let testsPassed = 0;
let testsFailed = 0;
let authToken = null;

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers,
          });
        } catch {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, method, path, expectedStatus, body = null) {
  try {
    const res = await makeRequest(method, path, body);
    const passed = res.status === expectedStatus;
    
    if (passed) {
      log(`✅ ${name}`, 'green');
      testsPassed++;
    } else {
      log(`❌ ${name} (expected ${expectedStatus}, got ${res.status})`, 'red');
      testsFailed++;
    }

    return res;
  } catch (e) {
    log(`❌ ${name} (${e.message})`, 'red');
    testsFailed++;
    return null;
  }
}

async function runTests() {
  log('\n================================', 'cyan');
  log('DOKWORK API Test Suite', 'cyan');
  log('================================\n', 'cyan');

  // 1. Health check
  log('📊 Checking server health...', 'yellow');
  const health = await test('GET /health', 'GET', '/health', 200);

  if (!health) {
    log('\n❌ Backend не запущен на localhost:4000', 'red');
    log('Запустите: npm run start:sqlite в папке backend', 'yellow');
    process.exit(1);
  }

  // 2. Metrics endpoint
  await test('GET /metrics (Prometheus)', 'GET', '/metrics', 200);

  // 3. Auth: Register
  log('\n🔐 Testing Auth...', 'yellow');
  const registerRes = await test('POST /auth/register (new user)', 'POST', '/auth/register', 201, {
    email: `test-${Date.now()}@dokwork.kz`,
    password: 'Test123456',
    name: 'Test User',
  });

  // 4. Auth: Login
  const loginRes = await test('POST /auth/login (valid credentials)', 'POST', '/auth/login', 200, {
    email: 'admin@dokwork.kz',
    password: 'admin123',
  });

  if (loginRes?.body?.token) {
    authToken = loginRes.body.token;
    log(`✅ Auth token obtained: ${authToken.substring(0, 20)}...`, 'green');
  }

  // 5. Me endpoint
  await test('GET /auth/me (current user)', 'GET', '/auth/me', 200);

  // 6. Housing CRUD
  log('\n🏠 Testing Housing CRUD...', 'yellow');

  const housingCreate = await test('POST /housing (create)', 'POST', '/housing', 201, {
    type: 'Квартира',
    city: 'Алматы',
    price: '50000',
    contact: '+7 700 000 0000',
  });

  await test('GET /housing (list)', 'GET', '/housing', 200);
  await test('GET /housing?limit=5&page=1 (with pagination)', 'GET', '/housing?limit=5&page=1', 200);

  // 7. Jobs CRUD
  log('\n💼 Testing Jobs CRUD...', 'yellow');

  const jobCreate = await test('POST /jobs (create)', 'POST', '/jobs', 201, {
    title: 'Строитель',
    city: 'Нур-Султан',
    salary: '150000',
    contact: '+7 700 000 0000',
  });

  await test('GET /jobs (list)', 'GET', '/jobs', 200);
  await test('GET /jobs?limit=5&page=1 (with pagination)', 'GET', '/jobs?limit=5&page=1', 200);

  // 8. Documents
  log('\n📄 Testing Document Requests...', 'yellow');

  await test('POST /docs (submit request)', 'POST', '/docs', 201, {
    type: 'Оформление разрешения',
    name: 'Иван Иванов',
    phone: '+7 700 000 0000',
    email: 'ivan@test.kz',
    comment: 'Нужна помощь с документами',
  });

  // 9. Profiles (admin only)
  log('\n👤 Testing Profiles (Admin)...', 'yellow');

  await test('GET /profiles (list users)', 'GET', '/profiles', 200);

  // 10. Invalid requests
  log('\n⚠️ Testing Error Handling...', 'yellow');

  await test('POST /auth/register (invalid email)', 'POST', '/auth/register', 400, {
    email: 'not-an-email',
    password: 'short',
  });

  await test('POST /auth/login (wrong credentials)', 'POST', '/auth/login', 401, {
    email: 'admin@dokwork.kz',
    password: 'wrongpassword',
  });

  await test('GET /nonexistent (404)', 'GET', '/nonexistent', 404);

  // Summary
  log('\n================================', 'cyan');
  log(`Results: ${testsPassed + testsFailed} tests`, 'cyan');
  log(`✅ Passed: ${testsPassed}`, 'green');
  if (testsFailed > 0) log(`❌ Failed: ${testsFailed}`, 'red');
  log('================================\n', 'cyan');

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests().catch(e => {
  log(`Fatal error: ${e.message}`, 'red');
  process.exit(1);
});
