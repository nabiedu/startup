# DOKWORK.KZ — Starter project

Это стартовая структура для курса Advanced Backend & DevOps. В корне проекта находятся каталоги `frontend/` и `backend/`.

Короткая инструкция для локального запуска (Windows / PowerShell):

1) Установите Docker Desktop и Node.js (если хотите запускать локально без Docker).

2) Запуск через docker-compose:

```powershell
docker-compose up --build
```

После запуска:
- Frontend доступен по http://localhost:3000
- Backend API: http://localhost:4000

3) Локальный запуск backend без Docker:

```powershell
cd backend; npm install; npm run dev
```

4) Локальный запуск frontend (dev):

```powershell
cd frontend; npm install; npm start
```

Что добавлено сейчас:
- `frontend/index.html` — ваша страница
- `backend/` — минимальный Express API с файлами: `index.js`, `package.json`, `data.json`
- `docker-compose.yml`, Dockerfile для frontend и backend
- `.gitignore`, `README.md`

Дополнительно (Prisma + PostgreSQL):

1) В backend добавлены файлы Prisma (`prisma/schema.prisma`, `prisma/seed.js`) и пример `.env`.
2) В `docker-compose.yml` добавлен сервис `postgres`.

Миграции и генерация клиента (локально):

```powershell
cd backend
npm install
npx prisma generate
# Чтобы создать миграцию и применить (локально):
npx prisma migrate dev --name init
node prisma/seed.js
```

Если используете Docker Compose, запустите:

```powershell
docker-compose up --build
```

После запуска:
- backend: http://localhost:4000
- frontend: http://localhost:3000


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
