# API DOKWORK.KZ (краткая документация)

Base URL: http://localhost:4000

Auth:
- POST /auth/register { email, password, name } — регистрация
- POST /auth/login { email, password } — возврат access token (short) и установка refresh cookie
- POST /auth/refresh — вернуть новый access (использует refresh cookie)
- POST /auth/logout — выйти (ревокация refresh cookie)
- GET /auth/me — получить профиль (Authorization: Bearer <token>)

Housing:
- GET /housing?page=1&limit=10&city=Алматы&q=хостел — список с пагинацией
- POST /housing { type, city, price, contact } — создать (можно с auth)
- PUT /housing/:id — обновить (требуется owner или admin)
- DELETE /housing/:id — удалить (требуется owner или admin)

Jobs: аналогично housing (GET/POST/PUT/DELETE)

Docs (заявки):
- GET /docs
- POST /docs { type, name, phone, email, comment }
- PUT/DELETE /docs/:id (только владелец или admin)

Profiles (admin):
- GET /profiles (admin)
- PUT /profiles/:id (admin - смена роли/name)
- DELETE /profiles/:id (admin)

Metrics:
- GET /metrics — Prometheus metrics
