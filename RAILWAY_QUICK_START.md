# 🚀 Railway.app Deployment Guide (ПОД КЛЮЧ)

## Быстрый старт (5 минут)

### 1️⃣ Откройте https://railway.app

### 2️⃣ Нажмите "Sign in with GitHub"
- Авторизуйтесь через GitHub
- Railway получит доступ к вашим репо

### 3️⃣ Нажмите "New Project"

### 4️⃣ Выберите "Deploy from GitHub repo"
- Найдите `nabiedu/startup`
- Нажмите "Deploy"

### 5️⃣ Railway автоматически:
```
✅ Обнаружит Procfile (Node.js настройки)
✅ Создаст сервис
✅ Загрузит переменные из .env
✅ Начнёт deploy
```

### 6️⃣ Добавить PostgreSQL
- В Railway Dashboard нажмите "+ Add Service"
- Выберите "PostgreSQL"
- Railway автоматически создаст `DATABASE_URL`

### 7️⃣ Установить переменные окружения

**В Railway Dashboard → Variables:**

```
JWT_SECRET = <your-secret-key>
CORS_ORIGIN = https://your-frontend.com
NODE_ENV = production
API_PORT = 4000
```

### 8️⃣ Railway автоматически запустит приложение!

**Live URL будет в Dashboard:**
```
https://dokwork-api-production.railway.app
```

---

## ✅ Проверка после deploy

```bash
# Проверить здоровье
curl https://dokwork-api-production.railway.app/health
# Ответ: {"status":"ok","time":"2025-12-05T..."}

# Проверить метрики
curl https://dokwork-api-production.railway.app/metrics

# Проверить API
curl https://dokwork-api-production.railway.app/api/housing?page=1
```

---

## 🔄 Auto-deploy с GitHub

**Railway слышит каждый push и автоматически:**
1. Pulls новый код с GitHub
2. Builds Docker image
3. Deploys на production
4. Health check проходит
5. Трафик переводит на новую версию

**Просто push и готово!**
```bash
git add .
git commit -m "Update features"
git push origin main
# → Railway видит push → 30 сек → новая версия live!
```

---

## 📊 Мониторинг

**В Railway Dashboard:**
- ✅ Логи real-time
- ✅ CPU/Memory usage
- ✅ Restart history
- ✅ HTTP status codes
- ✅ Response times

---

## 🎯 Следующие шаги

1. ✅ Deploy бэкенда на Railway
2. ✅ Deploy фронтенда на Netlify или GitHub Pages
3. ✅ Обновить README с live URLs
4. ✅ Записать видео-демо
5. ✅ 100% готово!

---

## 💰 Стоимость

- **$5 кредит в месяц**: Достаточно для базового приложения
- **Сверху**: $0.15/hour за дополнительные ресурсы
- **Для вас**: Практически бесплатно первые месяцы

---

## 🆘 Если что-то не работает

**Railway Dashboard → Service → Logs:**
- Посмотрите логи в real-time
- Ищите ошибки в startup
- Проверьте переменные окружения

**Частые проблемы:**
- ❌ `DATABASE_URL not set` → Добавить PostgreSQL service
- ❌ `Port 4000 already in use` → Изменить в .env
- ❌ `Connection timeout` → Проверить firewall

