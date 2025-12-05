import http from 'k6/http';
import { check, group, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '10s', target: 10 },   // Ramp-up: 0 to 10 VUs
    { duration: '30s', target: 50 },   // Ramp-up: 10 to 50 VUs
    { duration: '30s', target: 100 },  // Spike: 50 to 100 VUs
    { duration: '10s', target: 0 },    // Ramp-down: 100 to 0 VUs
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% of requests < 500ms
    http_req_failed: ['rate<0.1'],                     // < 10% failures
  },
};

const BASE_URL = 'http://localhost:4000';
let authToken = '';

export default function() {
  // 1. Health Check
  group('Health Check', function() {
    let res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response time < 100ms': (r) => r.timings.duration < 100,
    });
  });

  // 2. Metrics Endpoint
  group('Metrics', function() {
    let res = http.get(`${BASE_URL}/metrics`);
    check(res, {
      'metrics status is 200': (r) => r.status === 200,
      'metrics contains text/plain': (r) => r.headers['Content-Type'].includes('text/plain'),
    });
  });

  // 3. Auth: Register
  group('Auth - Register', function() {
    let email = `user-${Math.random()}@test.kz`;
    let payload = JSON.stringify({
      email: email,
      password: 'TestPassword123',
      name: 'Load Test User',
    });

    let params = {
      headers: { 'Content-Type': 'application/json' },
    };

    let res = http.post(`${BASE_URL}/auth/register`, payload, params);
    check(res, {
      'register status is 201': (r) => r.status === 201,
      'register has user id': (r) => r.json('id'),
    });
  });

  // 4. Auth: Login
  group('Auth - Login', function() {
    let payload = JSON.stringify({
      email: 'admin@dokwork.kz',
      password: 'admin123',
    });

    let params = {
      headers: { 'Content-Type': 'application/json' },
    };

    let res = http.post(`${BASE_URL}/auth/login`, payload, params);
    check(res, {
      'login status is 200': (r) => r.status === 200,
      'login has token': (r) => r.json('token'),
    });

    if (res.status === 200) {
      authToken = res.json('token');
    }
  });

  // 5. Get Current User (requires auth)
  if (authToken) {
    group('Auth - Get Current User', function() {
      let params = {
        headers: { 'Authorization': `Bearer ${authToken}` },
      };

      let res = http.get(`${BASE_URL}/auth/me`, params);
      check(res, {
        'me status is 200': (r) => r.status === 200,
        'me has user email': (r) => r.json('email'),
      });
    });
  }

  // 6. Housing - List
  group('Housing - List', function() {
    let res = http.get(`${BASE_URL}/housing?limit=10&page=1`);
    check(res, {
      'housing list status is 200': (r) => r.status === 200,
      'housing list has items': (r) => r.json('items') !== undefined,
    });
  });

  // 7. Housing - Create (requires auth)
  if (authToken) {
    group('Housing - Create', function() {
      let payload = JSON.stringify({
        type: 'Квартира',
        city: 'Алматы',
        price: `${Math.floor(Math.random() * 100000 + 10000)}`,
        contact: '+7 700 000 0000',
      });

      let params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      };

      let res = http.post(`${BASE_URL}/housing`, payload, params);
      check(res, {
        'housing create status is 201': (r) => r.status === 201,
        'housing create has id': (r) => r.json('id'),
      });
    });
  }

  // 8. Jobs - List
  group('Jobs - List', function() {
    let res = http.get(`${BASE_URL}/jobs?limit=10&page=1`);
    check(res, {
      'jobs list status is 200': (r) => r.status === 200,
      'jobs list has items': (r) => r.json('items') !== undefined,
    });
  });

  // 9. Jobs - Create (requires auth)
  if (authToken) {
    group('Jobs - Create', function() {
      let payload = JSON.stringify({
        title: 'Строитель',
        city: 'Нур-Султан',
        salary: `${Math.floor(Math.random() * 200000 + 50000)}`,
        contact: '+7 700 000 0000',
      });

      let params = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      };

      let res = http.post(`${BASE_URL}/jobs`, payload, params);
      check(res, {
        'jobs create status is 201': (r) => r.status === 201,
        'jobs create has id': (r) => r.json('id'),
      });
    });
  }

  // 10. Documents - Create
  group('Documents - Create', function() {
    let payload = JSON.stringify({
      type: 'Оформление разрешения',
      name: 'Иван Иванов',
      phone: '+7 700 000 0000',
      email: `test-${Math.random()}@test.kz`,
      comment: 'Нужна помощь с документами',
    });

    let params = {
      headers: { 'Content-Type': 'application/json' },
    };

    let res = http.post(`${BASE_URL}/docs`, payload, params);
    check(res, {
      'docs create status is 201': (r) => r.status === 201,
    });
  });

  // 11. Profiles - List (requires auth)
  if (authToken) {
    group('Profiles - List', function() {
      let params = {
        headers: { 'Authorization': `Bearer ${authToken}` },
      };

      let res = http.get(`${BASE_URL}/profiles`, params);
      check(res, {
        'profiles list status is 200': (r) => r.status === 200,
      });
    });
  }

  sleep(1);
}
