# 📊 Load Testing Guide — k6 нагрузочное тестирование

## 🚀 Быстрый старт (3 минуты)

### 1. Установка k6

**Windows (Chocolatey)**:
```powershell
choco install k6
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get install -y apt-transport-https
curl https://dl.k6.io/key.gpg | sudo apt-key add -
echo "deb https://dl.k6.io/deb releases main" | sudo tee /etc/apt/sources.list.d/k6-releases.list
sudo apt-get update
sudo apt-get install k6
```

**macOS (Homebrew)**:
```bash
brew install k6
```

### 2. Запуск backend и load-тестов

**Терминал 1** (backend):
```bash
cd backend
npm run start:sqlite
# ✅ Server listening on 4000
```

**Терминал 2** (load test):
```bash
cd backend
k6 run scripts/load-test.k6.js
```

### 3. Ожидаемый результат

```
          /\      |‾‾| /‾‾/‾‾ /‾‾/‾‾‾‾‾‾‾ /‾‾/
         /  \     |  |/  / /  / /  ___   / /  /
        / /\ \    |     (  (  (  (  /_  / (  (
       / /  \ \   |  |\ \ \ \ \ \ \_/ / \  \
      /_/    \_\  |__| \_\_\_\_\_\___/   \_\_\

  execution: local
     script: load-test.k6.js
     output: -

  scenarios: (100.00%) 1 scenario, max 100 VUs, 1m30s total

✓ Health Check
✓ Metrics
✓ Auth - Register
✓ Auth - Login
✓ Auth - Get Current User
✓ Housing - List
✓ Housing - Create
✓ Jobs - List
✓ Jobs - Create
✓ Documents - Create
✓ Profiles - List

     checks........................: 100.00% ✓ 1200 ✗ 0
     data_received..................: 245 kB
     data_sent.......................: 156 kB
     http_req_blocked...............: avg=10ms   min=1ms    med=2ms    max=120ms   p(90)=45ms   p(95)=65ms   p(99)=120ms
     http_req_connecting............: avg=8ms    min=0s     med=0s     max=88ms    p(90)=25ms   p(95)=45ms   p(99)=88ms
     http_req_duration..............: avg=145ms  min=5ms    med=85ms   max=2s      p(90)=300ms  p(95)=450ms  p(99)=1s
     ├─ { expected_response:true }...: avg=145ms  min=5ms    med=85ms   max=2s      p(90)=300ms  p(95)=450ms  p(99)=1s
     http_req_failed................: 0.00% ✓ 0 ✗ 1200
     http_req_receiving.............: avg=10ms   min=1ms    med=5ms    max=200ms   p(90)=25ms   p(95)=35ms   p(99)=145ms
     http_req_sending...............: avg=5ms    min=0s     med=2ms    max=50ms    p(90)=15ms   p(95)=25ms   p(99)=45ms
     http_req_tls_handshaking.......: avg=0s     min=0s     med=0s     max=0s      p(90)=0s     p(95)=0s     p(99)=0s
     http_req_waiting...............: avg=130ms  min=2ms    med=75ms   max=1s      p(90)=280ms  p(95)=425ms  p(99)=950ms
     http_reqs.......................: 1200    40.000/s
     iteration_duration.............: avg=2.60s  min=2.01s  med=2.35s  max=8.50s   p(90)=3.45s  p(95)=4.10s  p(99)=6.80s
     iterations......................: 100     3.333/s
     vus............................: 0       min=0      max=100
     vus_max.........................: 100     min=100    max=100

PASS ✅
```

---

## 📈 Что тестируется

Load test включает:

1. **Health Check** — Проверка доступности сервера
2. **Metrics Endpoint** — Prometheus метрики
3. **Auth - Register** — Создание новых пользователей
4. **Auth - Login** — Вход с существующим пользователем
5. **Auth - Get Current User** — Получение данных текущего пользователя
6. **Housing - List** — Получение списка объявлений жилья
7. **Housing - Create** — Создание нового объявления жилья
8. **Jobs - List** — Получение списка вакансий
9. **Jobs - Create** — Создание новой вакансии
10. **Documents - Create** — Создание заявки на помощь
11. **Profiles - List** — Список пользователей (admin)

---

## 🎯 Параметры нагрузки

В `load-test.k6.js` настроены следующие stages:

```javascript
stages: [
  { duration: '10s', target: 10 },    // Ramp-up: 0 → 10 пользователей
  { duration: '30s', target: 50 },    // Ramp-up: 10 → 50 пользователей
  { duration: '30s', target: 100 },   // Spike: 50 → 100 пользователей
  { duration: '10s', target: 0 },     // Ramp-down: 100 → 0 пользователей
]
```

**Итого**: 1 минута 30 секунд нагрузочного тестирования с максимум 100 одновременных пользователей.

---

## 📊 Threshold (пороги успеха)

Тест считается **успешным**, если:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95% запросов < 500ms
  http_req_failed: ['rate<0.1'],                     // < 10% неудачных запросов
}
```

Это означает:
- ✅ 95% запросов должны занимать менее 500ms
- ✅ 99% запросов должны занимать менее 1 секунды
- ✅ Не более 10% запросов могут завершиться ошибкой

---

## 🔧 Расширенные сценарии

### Custom VU Load Test

Если нужна более интенсивная нагрузка, создайте `load-test-custom.k6.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 500,           // 500 одновременных пользователей
  duration: '5m',     // 5 минут
};

export default function() {
  let res = http.get('http://localhost:4000/housing');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
```

Запуск:
```bash
k6 run load-test-custom.k6.js
```

### Stress Test

```javascript
export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '5m', target: 300 },
    { duration: '10m', target: 0 },
  ],
};
```

---

## 📚 Команды k6

```bash
# Запуск базового теста
k6 run scripts/load-test.k6.js

# Вывод результатов в JSON
k6 run scripts/load-test.k6.js --out json=results.json

# Вывод в CSV
k6 run scripts/load-test.k6.js --out csv=results.csv

# Интерпретация результатов
k6 run scripts/load-test.k6.js --vus 10 --duration 30s

# Запуск с InfluxDB (если установлен)
k6 run --out influxdb=http://localhost:8086/k6 scripts/load-test.k6.js
```

---

## 🎬 Интеграция с CI/CD

### GitHub Actions

Добавьте в `.github/workflows/ci.yml`:

```yaml
- name: Load Testing (k6)
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  run: |
    npm install -g k6
    cd backend
    npm run start:sqlite &
    sleep 3
    k6 run scripts/load-test.k6.js --out json=load-test-results.json
  timeout-minutes: 5

- name: Upload Load Test Results
  uses: actions/upload-artifact@v2
  with:
    name: load-test-results
    path: backend/load-test-results.json
```

---

## 📊 Интерпретация результатов

| Метрика | Значение | Интерпретация |
|---------|----------|---------------|
| `http_req_duration` | avg=145ms | Среднее время отклика 145ms (хорошо) |
| `p(95)<500` | Passed ✅ | 95% запросов быстрее 500ms |
| `http_req_failed` | 0.00% | Нет ошибок (отлично) |
| `http_reqs` | 1200/40s | 1200 HTTP запросов за 30+ секунд |
| `iterations` | 100 | 100 полных циклов теста |

---

## 🐛 Troubleshooting

| Проблема | Решение |
|----------|---------|
| `Error: Failed to resolve: http://localhost:4000` | Убедитесь, что backend запущен на :4000 |
| `Connection refused` | Запустите `npm run start:sqlite` в отдельном терминале |
| `k6: command not found` | Установите k6: `brew install k6` (macOS) или `choco install k6` (Windows) |
| `Too many open files` | Увеличьте лимит: `ulimit -n 65535` (Linux/macOS) |

---

## 📈 Ожидаемые результаты для production-ready

- ✅ `http_req_duration p(95) < 500ms`
- ✅ `http_req_duration p(99) < 1000ms`
- ✅ `http_req_failed rate < 1%`
- ✅ CPU использование < 80%
- ✅ Memory использование < 70%

---

## 📞 Support

Для вопросов:
- 📧 hello@dokwork.kz
- 📚 k6 documentation: https://k6.io/docs

---

**Happy Load Testing! 🚀**
