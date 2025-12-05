# 🌐 Deploy Frontend на Netlify (5 минут)

## Вариант A: Автоматический Deploy (рекомендуется)

### Шаг 1: Откройте https://app.netlify.com

### Шаг 2: Нажмите "Add new site" → "Import an existing project"

### Шаг 3: Выберите GitHub → `nabiedu/startup`

### Шаг 4: Настройки Build
```
Build command: (оставить пусто - это static HTML)
Publish directory: frontend
```

### Шаг 5: Переменные окружения (если нужны)
```
Environment Variables:
  REACT_APP_API_URL = https://dokwork-api-production.railway.app
```

### Шаг 6: Deploy!
- Нажмите "Deploy site"
- Netlify создаст live URL за 30 сек
- Получите что-то вроде: `https://dokwork-frontend.netlify.app`

### Шаг 7: Auto-deploy
- Каждый push в `main` ветку = автоматический deploy
- Статус в Netlify Dashboard

---

## Вариант B: GitHub Pages (Free, но медленнее)

### Шаг 1: В GitHub репо → Settings → Pages

### Шаг 2: Выбрать
```
Source: Deploy from branch
Branch: main
Folder: /frontend
```

### Шаг 3: Save
- GitHub Pages создаст URL: `https://nabiedu.github.io/startup/`

### Минусы:
- Медленнее чем Netlify (5-10 мин на deploy)
- Сложнее настроить переменные окружения

---

## ✅ Финальная проверка

После deploy:

```bash
# Открыть в браузере
https://dokwork-frontend.netlify.app

# Проверить:
- ✅ HTML загружается
- ✅ Стили применяются
- ✅ JavaScript работает
- ✅ Форма login видна
- ✅ Кнопки кликаются
```

---

## 🔗 Обновить URL в коде

**frontend/index.html:**
```javascript
// Заменить localhost на production URL:
const API_BASE = 'https://dokwork-api-production.railway.app';

// Вместо:
// const API_BASE = 'http://localhost:4000';
```

---

## 📊 Итоговые URLs

```
Backend:   https://dokwork-api-production.railway.app
Frontend:  https://dokwork-frontend.netlify.app
Grafana:   https://grafana.dokwork-production.railway.app (если добавили)
```

---

## 💡 Совет

**Используйте Netlify** для фронтенда:
- Бесплатный HTTPS
- Автоматический deploy
- CDN глобально
- Нет нужно в configuration

