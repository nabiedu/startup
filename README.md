# DOKWORK.KZ — Полнофункциональный стартовый проект

**Статус**: ✅ **100% готов к использованию**

Это полнофункциональный проект для помощи мигрантам из Кыргызстана, Узбекистана и Таджикистана:
- 📱 **Frontend**: Single-Page App (Vanilla JS) с авторизацией, поиском жилья, вакансиями, оформлением документов
- 🔧 **Backend**: Express.js REST API с JWT auth, Prisma ORM, ролевыми правами (admin/user)
- 📊 **Мониторинг**: Prometheus + Grafana + Loki/Promtail
- 🧪 **Тесты**: Jest + Supertest интеграционные тесты (✅ все проходят)
- 🐳 **Docker**: docker-compose для полного стека + SQLite fallback для локальной разработки

---

## 🚀 Быстрый старт (3 минуты)

### Windows (PowerShell)
```powershell
# Способ 1: Быстрый запуск (рекомендуется)
.\start-local-dev.ps1

# Способ 2: Вручную
cd backend
npm install
npm run prisma:generate:sqlite
npm run prisma:migrate:sqlite -- --skip-generate
npm run seed
npm run start:sqlite
# В отдельном терминале:
# Откройте: frontend/index.html в браузере
```

### Linux/macOS
```bash
# Способ 1: Быстрый запуск
bash start-local-dev.sh

# Способ 2: Вручную (аналогично Windows выше)
```

---

## 📖 Полная документация

### Локальная разработка (SQLite)

**Требования**: Node.js v16+

**Установка и запуск**:
```powershell
cd backend
npm install
```

**Первый запуск** (создание БД и миграции):
```powershell
npm run prisma:generate:sqlite    # Генерация Prisma Client
npm run prisma:migrate:sqlite -- --skip-generate  # Создание schema
npm run seed                      # Загрузка примеров
npm run start:sqlite              # Запуск сервера на :4000
```

**Последующие запуски**:
```powershell
npm run start:sqlite
```

**Отладка**:
- Backend логи: `npm run start:sqlite`
- Frontend: Откройте `frontend/index.html` в браузере (F12 для DevTools)
- API Health check: `curl http://localhost:4000/health`
- Metrics: `curl http://localhost:4000/metrics`

---

### Docker Compose (полный стек)

**Требования**: Docker Desktop

```powershell
# Запуск всех сервисов (backend, frontend, postgres, prometheus, grafana, loki)
docker-compose up --build

# После старта:
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Loki: http://localhost:3100

```powershell
# Остановить все сервисы
docker-compose down

# Удалить всё включая БД
docker-compose down -v
```

---

### Тестирование

**Интеграционные тесты** (используют sqlite test.db):
```powershell
cd backend
npm run test:integration
```

Ожидаемый результат:
```
Test Suites: 2 passed, 2 total
Tests:       2 passed, 2 total
✅ PASS  tests/integration/auth.integration.test.js
✅ PASS  tests/integration/crud.integration.test.js
```

---

## 🔑 Тестовые учётные данные

После `npm run seed` доступны:

| Email | Пароль | Роль |
|-------|--------|------|
| admin@dokwork.kz | admin123 | admin (полный доступ) |
| user@dokwork.kz | user123 | user (ограниченный доступ) |

---

## 📁 Структура проекта

```
STARTUP/
├── backend/                          # Express.js API
│   ├── app.js                        # Express приложение
│   ├── index.js                      # Точка входа сервера
│   ├── package.json                  # npm зависимости + скрипты
│   ├── .env.example                  # Пример переменных окружения
│   ├── prisma/
│   │   ├── schema.prisma             # PostgreSQL schema
│   │   ├── schema.sqlite.prisma      # SQLite schema (для локал. разработки)
│   │   ├── migrations/               # Миграции БД
│   │   └── seed.js                   # Примеры данных
│   ├── tests/
│   │   └── integration/              # Jest + Supertest интеграционные тесты
│   ├── scripts/
│   │   ├── setupTestDb.js            # Подготовка тестовой БД
│   │   └── runIntegrationTests.js    # Запуск тестов
│   └── jest.config.js                # Jest конфигурация
│
├── frontend/                         # Single-Page App
│   ├── index.html                    # Главная страница + Vanilla JS
│   └── package.json                  # (если нужна сборка)
│
├── docker-compose.yml                # Оркестрация всех сервисов
├── .github/
│   └── workflows/
│       ├── ci.yml                    # GitHub Actions CI (тесты)
│       └── publish.yml               # GitHub Actions CD (Docker push)
│
├── monitoring/                       # Конфиги мониторинга
│   ├── prometheus.yml                # Prometheus config
│   ├── loki-config.yaml              # Loki config
│   ├── promtail.yml                  # Promtail config
│   ├── grafana/
│   │   ├── provisioning/             # Grafana provisioning
│   │   └── dashboards/               # JSON dashboard
│
├── start-local-dev.ps1               # PowerShell скрипт для Windows
├── start-local-dev.sh                # Bash скрипт для Linux/macOS
├── README.md                         # Этот файл
└── .gitignore

```

---

## 🔐 API Endpoints

### Auth
- `POST /auth/register` — Регистрация (email, password, name)
- `POST /auth/login` — Вход (email, password) → returns JWT token
- `POST /auth/refresh` — Обновление токена (используется cookie refresh_token)
- `GET /auth/me` — Текущий пользователь (requires JWT)

### Housing (объявления жилья)
- `GET /housing` — Список объявлений (pagination: page, limit, search)
- `POST /housing` — Добавить объявление (type, city, price, contact)
- `PUT /housing/:id` — Обновить (only owner или admin)
- `DELETE /housing/:id` — Удалить (only owner или admin)

### Jobs (вакансии)
- `GET /jobs` — Список вакансий (pagination: page, limit, search)
- `POST /jobs` — Добавить вакансию
- `PUT /jobs/:id` — Обновить
- `DELETE /jobs/:id` — Удалить

### Documents (заявки на помощь)
- `POST /docs` — Создать заявку (type, name, phone, email, comment)
- `GET /docs` — Список заявок (admin only)

### Profiles (управление пользователями)
- `GET /profiles` — Список пользователей (admin only)
- `PUT /profiles/:id` — Обновить профиль (admin or self)
- `DELETE /profiles/:id` — Удалить пользователя (admin only)

### Monitoring
- `GET /health` — Health check (status: ok)
- `GET /metrics` — Prometheus метрики (формат: text/plain)

---

## 📊 Backend особенности

✅ **Безопасность**:
- JWT auth с access (15м) + refresh tokens (7д)
- bcrypt хеширование паролей
- Helmet middleware (CSP, X-Frame-Options, и т.д.)
- Rate limiting (200 req/15min)
- HttpOnly cookies для refresh token
- CORS configured

✅ **Валидация**:
- express-validator на входе
- Server-side sanitization строк (удаление HTML)
- DOMPurify на frontend (client-side sanitization)

✅ **Ролевая модель**:
- `user` — может создавать собственные объявления (только edit/delete свои)
- `admin` — полный доступ (все CRUD операции, управление пользователями)

✅ **Мониторинг**:
- Prometheus метрики (/metrics endpoint)
- Winston логирование (console output)
- HTTP request counter + duration histogram

✅ **БД**:
- Prisma ORM для type-safety queries
- PostgreSQL в production (docker-compose)
- SQLite в разработке (легко поднять без setup)
- Миграции (prisma migrate)
- Seed скрипт с примерами

---

## 🌐 Frontend особенности

✅ **Функции**:
- Авторизация (login/register) + refresh при истечении токена
- Поиск по объявлениям (housing/jobs) с фильтрацией
- Pagination для длинных списков
- Форма для заявок на помощь (documents)
- Admin panel: управление профилями, удаление объявлений
- Оффлайн очередь (localStorage) — если API недоступен, данные сохраняются локально и отправляются при восстановлении связи

✅ **Безопасность**:
- DOMPurify CDN интеграция (sanitization HTML от XSS)
- JWT token в localStorage (в production — рассмотреть httpOnly cookie)
- CSP headers (content-security-policy)

---

## 🚢 Production Deployment

### Опция 1: Heroku

```bash
# 1) Установить Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# 2) Login и создать приложение
heroku login
heroku create dokwork-api

# 3) Установить переменные окружения
heroku config:set JWT_SECRET="your-secret-key-here" --app dokwork-api
heroku config:set DATABASE_URL="postgresql://user:pass@host:port/db" --app dokwork-api

# 4) Подключить GitHub repo для auto-deploy
# https://devcenter.heroku.com/articles/github-integration

# 5) Deploy (если Procfile есть)
git push heroku main

# Или через docker:
heroku container:push web -a dokwork-api
heroku container:release web -a dokwork-api
```

**Procfile** (создать в корне если нужен обычный Node deploy):
```
web: cd backend && npm install && npm start
```

### Опция 2: Railway.app

```bash
# 1) Установить Railway CLI
# https://docs.railway.app/

# 2) Login и создать проект
railway login
railway init

# 3) Выбрать Node.js + PostgreSQL
# 4) Установить переменные в Railway dashboard

# 5) Deploy
git push

# Frontend: свой Railway сервис или GitHub Pages
```

### Опция 3: Docker на VPS (AWS EC2, DigitalOcean, Linode)

```bash
# 1) Скопировать репо на сервер
ssh user@your-vps
git clone https://github.com/your-org/dokwork.git
cd dokwork

# 2) Установить Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3) Создать .env для production
cat > .env << EOF
DATABASE_URL=postgresql://user:pass@postgres:5432/dokwork
JWT_SECRET=your-secure-secret-key
NODE_ENV=production
EOF

# 4) Запустить
docker-compose up -d

# 5) Настроить Nginx как reverse proxy (опционально)
# Скопировать SSL сертификат (Let's Encrypt)
```

### Переменные окружения для production

```bash
# backend/.env (production)
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://user:pass@host:5432/dokwork
JWT_SECRET=<generate-secure-random-string>
CORS_ORIGIN=https://your-frontend-domain.com

# Для GitHub Actions publish (GHCR):
# Добавить секреты в GitHub Settings → Secrets:
# - REGISTRY_USERNAME: ваш GitHub username
# - REGISTRY_TOKEN: GitHub Personal Access Token (PAT) с write:packages
```

---

## 🛠️ Troubleshooting

| Ошибка | Решение |
|--------|---------|
| `Cannot find module 'dotenv'` | Выполните: `cd backend && npm install` |
| `EADDRINUSE: port 4000 already in use` | Закройте процесс: `lsof -i :4000` и `kill -9 <PID>` (или используйте другой PORT=5000) |
| `SQLite file permission denied` | Проверьте права: `chmod 755 backend/` |
| `Prisma Client out of date` | Выполните: `npm run prisma:generate:sqlite` |
| Frontend не видит Backend | Убедитесь, что backend запущен на :4000 и CORS разрешён |

---

## 📈 Статус проекта

- ✅ Backend REST API (100% готов)
- ✅ Frontend SPA (100% готов)
- ✅ Auth (JWT + refresh token)
- ✅ Prisma ORM + миграции
- ✅ Тесты (интеграционные)
- ✅ CI/CD (GitHub Actions template)
- ✅ Мониторинг (Prometheus + Grafana)
- ✅ Docker + docker-compose
- ✅ SQLite fallback для локальной разработки
- 🟡 Production deployment (требуется выбор платформы + конфиг)

---

## 📞 Контакты

- Email: hello@dokwork.kz
- Горячая линия: +7 700 000 0000

Успехов в разработке! 🚀

Если используете Docker Compose, запустите:

```powershell
docker-compose up --build
```

После запуска:
- backend: http://localhost:4000
- frontend: http://localhost:3000

Локальный sqlite fallback (быстрый запуск)
---------------------------------
Если Docker недоступен или вы хотите быстро запустить без контейнеров, используйте sqlite fallback в `backend`:

```powershell
cd backend
npm ci
npm run prisma:generate:sqlite
npm run prisma:migrate:sqlite
# необязательно: заполнить образцы данных
npm run seed
# запустить интеграционные тесты (создает/удаляет test.db автоматически)
npm run test:integration
# запустить сервер
npm run start:sqlite
```

Мониторинг и логи
-----------------
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (пароль администратора по умолчанию установлен на `admin` в compose для локальной разработки)
- Loki: внутренний на :3100, Promtail настроен на отправку `/var/log/*.log` в Loki (локальный compose).

Устранение неполадок
-------------------
- Если `npm ci` не удается: убедитесь, что Node.js и npm правильно установлены и вы выполняете команды из папки `backend`.
- Если `prisma generate` не удается: убедитесь, что `prisma` установлен (devDependency) и выполните `npx prisma generate` или `npm run prisma:generate:sqlite`.
- Если Docker Desktop на Windows не запускается: попробуйте перезапустить Docker Desktop, проверьте функции WSL/Hyper-V, убедитесь, что в Windows включена виртуализация, или используйте вышеуказанный sqlite fallback.

Если хотите, я могу добавить более подробные шаги по устранению неполадок для Docker Desktop на Windows — скажите мне, и я добавлю их.


Следующие шаги (предложение плана работы):
- Перевести хранение данных на PostgreSQL + ORM (Prisma/TypeORM)
- Реализовать аутентификацию (JWT), роли, админ-панель
- Написать unit и integration тесты
- Настроить CI (GitHub Actions) и мониторинг (Prometheus/Grafana)

Если хотите — могу сразу:
- Инициализировать git в `STARTUP`, сделать initial commit и помочь создать репозиторий GitHub (требуется токен у вас),
- Поставить PostgreSQL и подключить его, миграции и ORM,
- Добавить аутентификацию и REST API для CRUD,
- Настроить GitHub Actions workflow.

Deploy & publishing notes
-------------------------

1) Build and publish Docker images to GitHub Container Registry (GHCR)

Prepare secrets in GitHub: `CR_PAT` (personal access token with packages:write scope), `GHCR_OWNER` (your org/user), `IMAGE_NAME` (e.g., dokwork/backend).

Example workflow snippet (build & push backend image):

```yaml
# build and push backend image
- name: Build and push
	run: |
		echo ${{ secrets.CR_PAT }} | docker login ghcr.io -u ${{ secrets.GHCR_OWNER }} --password-stdin
		docker build -t ghcr.io/${{ secrets.GHCR_OWNER }}/${{ secrets.IMAGE_NAME }}:latest -f backend/Dockerfile .
		docker push ghcr.io/${{ secrets.GHCR_OWNER }}/${{ secrets.IMAGE_NAME }}:latest
```

2) Deploy to Render (example)

- Create two services on Render: Backend (Docker) and Static Site (Frontend). Use the GHCR image or connect the GitHub repo and let Render build.
- Set environment variables in Render: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`.
- Important: Render provisions HTTPS automatically for services.

3) Secure cookies & HTTPS (refresh-token)

- In `backend/app.js` cookies are set with `secure: process.env.NODE_ENV === 'production'` and `sameSite: 'lax'`.
- For production you *must* run over HTTPS so secure cookies are sent by browsers. Ensure `NODE_ENV=production` in the environment at the host (Render, Heroku, etc.).

Local testing note: when testing cookies on `localhost` over HTTP, `secure` must be false (default in dev). Use the provided `docker-compose` or set `NODE_ENV=development` locally.

If you'd like, I can prepare a complete GitHub Actions workflow (build+push images, run tests, and optionally deploy to Render) — tell me which registry and deploy target you prefer.
