# 🌐 SCENARIO A - STEP 2: Deploy Frontend на Netlify

## ⏱️ Время: 5 минут

---

## 🎯 ЧТО НУЖНО

- ✅ GitHub аккаунт (у вас: nabiedu)
- ✅ GitHub репо (готов: nabiedu/startup)
- ✅ Netlify аккаунт (создаём через GitHub)
- ✅ Backend URL от Step 1 (например: `https://dokwork-api-production.railway.app`)

---

## 📋 ИНСТРУКЦИЯ (5 шагов)

### **Шаг 1: Откройте https://app.netlify.com**

Просто откройте в браузере:
```
https://app.netlify.com
```

### **Шаг 2: Нажмите "Sign in with GitHub"**

Или "Log in" → "Continue with GitHub"

**Авторизация:**
- GitHub login
- Дайте Netlify доступ к репо

### **Шаг 3: На Dashboard нажмите "Add new site"**

Кнопка в верхнем левом или "Add new site" → "Import an existing project"

### **Шаг 4: Выберите GitHub репо**

Netlify покажет список ваших GitHub репо.

Найдите: **`nabiedu/startup`**

Нажмите на неё.

### **Шаг 5: Настройки Deploy**

Netlify покажет форму с вопросами:

```
Build settings:
  - Branch to deploy: main ✓
  - Build command: (оставить пусто)
  - Publish directory: frontend
  - Environment variables: (ниже)
```

**Важно: Publish directory = `frontend`**

**Добавить Environment Variable:**
```
Key: REACT_APP_API_URL
Value: <Backend URL from Step 1>

Example:
REACT_APP_API_URL = https://dokwork-api-production.railway.app
```

Нажмите **"Deploy site"**

**Ждите 1-2 минуты...**

---

## ✅ ПРОВЕРКА: Frontend Live!

Когда Netlify покажет зелёный статус:

**В Netlify Dashboard:**
1. Найдите section "Site overview"
2. Там будет live URL (что-то вроде):
```
https://dokwork-frontend-abc123.netlify.app
```

3. Нажмите на URL → откроется фронтенд в браузере

**Проверьте:**
- ✅ HTML загружается (видно стили)
- ✅ Форма login видна
- ✅ Кнопки кликаются
- ✅ JavaScript работает (console без ошибок)

**Если всё работает → ШАГ 2 УСПЕШЕН! ✅**

---

## 🔗 Если Frontend НЕ подключается к Backend

**Возможная проблема:**
- CORS заблокирован
- Backend URL неправильный в коде

**Проверка:**
1. Откройте DevTools (F12)
2. Console (Консоль)
3. Попробуйте залогиниться
4. Должны быть ошибки в консоли
5. Проверьте Network tab

**Решение:**
Если проблема с CORS:
1. Обновите `.env` в backend
2. Добавьте: `CORS_ORIGIN=https://ваш-netlify-url`
3. Deploy backend еще раз на Railway
4. Refresh фронтенда

---

## 📊 РЕЗУЛЬТАТ ШАГ 2

```
✅ Frontend deployed на Netlify
✅ Live URL получен
✅ HTML загружается
✅ JavaScript работает
✅ Подключено к Backend

Пример URL:
https://dokwork-frontend.netlify.app
```

**СОХРАНИТЕ ЭТ URL!** Понадобится для Step 3.

---

## 🎯 ВЫ ПОЛУЧИЛИ:

```
Backend:  https://dokwork-api-production.railway.app
Frontend: https://dokwork-frontend.netlify.app

Оба LIVE и подключены! ✅
```

---

## ⏭️ СЛЕДУЮЩИЙ ШАГ

Когда ШАГ 2 успешен:
→ Переходите на **ШАГ 3: Update README** (5 минут) = **100% ГОТОВО!** 🎉

