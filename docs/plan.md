# План проекта — DOKWORK.KZ

Коротко: веб-приложение для помощи мигрантам в Казахстане — оформление документов, объявления по жилью и вакансиям.

Основные компоненты:
- Frontend: статическая страница (HTML/CSS/JS), в будущем — React/Vite.
- Backend: Node.js + Express + Prisma + PostgreSQL.
- БД: PostgreSQL (модели: User, Housing, Job, DocRequest, RefreshToken).
- CI/CD: GitHub Actions (тесты, build), контейнеры Docker.
- Мониторинг: Prometheus metrics endpoint (+ Grafana готовность).

Распределение ролей в команде (пример):
- Backend / DevOps (миграции, CI/CD, деплой): Студент A
- Frontend / UX: Студент B
- Тестирование / Мониторинг / Документация: Студент C

Минимальный набор фич по неделям (см. README) — уже реализованы первые 6 недель функционала.
