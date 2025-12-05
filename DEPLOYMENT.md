# 🚀 DEPLOYMENT GUIDE — Развёртывание на Production

Этот документ содержит пошаговые инструкции для развёртывания DOKWORK.KZ на различные платформы.

---

## 📋 Требования перед deployment

- ✅ Код залит в GitHub репозиторий (public или private)
- ✅ Все переменные окружения подготовлены
- ✅ SSL сертификат (для HTTPS)
- ✅ Доменное имя зарегистрировано
- ✅ БД backup стратегия выбрана

---

## 🟦 Вариант 1: Heroku (быстро, $7–50/мес)

### Шаг 1: Установка Heroku CLI
```bash
# Windows (через chocolatey)
choco install heroku-cli

# Linux/macOS
curl https://cli-assets.heroku.com/install.sh | sh
```

### Шаг 2: Логин и создание приложения
```bash
heroku login
heroku create dokwork-api  # Создаст случайное имя если не указать
# или используйте свое имя:
heroku create my-dokwork-api
```

### Шаг 3: Добавление PostgreSQL БД
```bash
# Стандартный план
heroku addons:create heroku-postgresql:standard-0 -a dokwork-api

# или Free план (deprecated в новых акаунтах, но может быть доступен):
# heroku addons:create heroku-postgresql:hobby-dev -a dokwork-api

# Проверить переменную DATABASE_URL
heroku config -a dokwork-api | grep DATABASE_URL
```

### Шаг 4: Установка переменных окружения
```bash
heroku config:set JWT_SECRET="your-super-secret-key-here" -a dokwork-api
heroku config:set CORS_ORIGIN="https://dokwork-frontend.herokuapp.com" -a dokwork-api
heroku config:set NODE_ENV="production" -a dokwork-api
```

### Шаг 5: Deploy с GitHub автоматически или вручную
```bash
# Вариант A: GitHub интеграция (рекомендуется)
# 1) В Heroku Dashboard → Settings → GitHub
# 2) Connect GitHub repo
# 3) Enable Automatic Deploys с main ветки
# 4) Deploy main branch (первый раз вручную)

# Вариант B: Git push (вручную каждый раз)
git remote add heroku https://git.heroku.com/dokwork-api.git
git push heroku main
```

### Шаг 6: Проверка логов и миграций
```bash
# Запуск миграций (если требуется)
heroku run "cd backend && npx prisma migrate deploy" -a dokwork-api

# Seed данные
heroku run "cd backend && npm run seed" -a dokwork-api

# Проверить логи
heroku logs --tail -a dokwork-api

# Проверить health
curl https://dokwork-api.herokuapp.com/health
```

### Шаг 7: Deploy Frontend (GitHub Pages или Netlify)

**GitHub Pages (free)**:
```bash
# 1) В репо Settings → Pages
# 2) Выбрать branch и папку (например, frontend/)
# 3) После каждого push на main, фронтенд обновится автоматически
```

**Netlify (рекомендуется для фронтенда)**:
```bash
# 1) Залогиниться: https://app.netlify.com
# 2) Нажать "Connect from Git"
# 3) Выбрать GitHub репо
# 4) Build command: (оставить пусто, т.к. это static HTML)
# 5) Publish directory: frontend
# 6) Deploy!
```

**Стоимость**: Free (с Netlify бесплатно), Backend на Heroku Standard dyno ~$7/мес.

---

## 🚂 Вариант 2: Railway.app (простой, $5–100/мес)

Railway — это новая платформа от разработчиков Vercel, очень простая в использовании.

### Шаг 1: Создание проекта
```bash
# 1) Перейти на https://railway.app
# 2) Нажать "Start a New Project"
# 3) Выбрать "Deploy from GitHub"
# 4) Авторизоваться в GitHub
# 5) Выбрать репо
```

### Шаг 2: Добавление сервисов
```
В Railway Dashboard:
1) + Add Service
2) Выбрать PostgreSQL (добавится автоматически)
3) + Add Service → GitHub repo (backend)
4) Настроить build command: npm install
5) Настроить start command: cd backend && npm start
```

### Шаг 3: Установка переменных окружения
```
В Railway Dashboard → Variables:
- DATABASE_URL (автоматически от PostgreSQL)
- JWT_SECRET=your-secret
- CORS_ORIGIN=https://your-frontend-domain
- NODE_ENV=production
```

### Шаг 4: Deploy
```bash
# Достаточно нажать "Deploy" в Railway Dashboard
# Или через CLI:
npm i -g @railway/cli
railway login
railway up
```

**Стоимость**: Pay-as-you-go, ~$5–10/мес за backend + DB.

---

## ☁️ Вариант 3: Docker на AWS EC2 / DigitalOcean / Linode VPS

### Шаг 1: Создание VPS

**DigitalOcean**:
```bash
# Создать Droplet:
# 1) https://cloud.digitalocean.com/droplets
# 2) Ubuntu 22.04 LTS, $4–5/мес
# 3) Выбрать SSH key
# 4) Deploy
```

**AWS EC2**:
```bash
# 1) AWS Console → Instances
# 2) Launch → Ubuntu 22.04 LTS
# 3) t2.micro (free tier) или t3.small ($5–10/мес)
```

### Шаг 2: SSH и установка Docker
```bash
# SSH на сервер
ssh -i key.pem ubuntu@your-ip

# Установка Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Шаг 3: Клонирование репо и настройка
```bash
git clone https://github.com/your-org/dokwork.git
cd dokwork

# Создать .env для production
cat > .env << 'EOF'
DB_PASSWORD=your-secure-db-password
JWT_SECRET=your-super-secret-jwt-key
GRAFANA_PASSWORD=your-grafana-password
CORS_ORIGIN=https://your-domain.com
EOF

# Создать .env для backend (альтернативно)
cat > backend/.env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://dokwork_user:your-secure-db-password@postgres:5432/dokwork_prod
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-domain.com
EOF
```

### Шаг 4: Запуск Production Docker Compose
```bash
# Для production стека используйте docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Проверить статус
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f backend

# Запустить миграции
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:migrate:sqlite
docker-compose -f docker-compose.prod.yml exec backend npm run seed
```

### Шаг 5: Установка SSL (Let's Encrypt) и Reverse Proxy

**Через Certbot + Nginx**:
```bash
# Установить Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Получить сертификат
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Скопировать в Docker volume
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./certs/
sudo chown 1000:1000 ./certs/*
```

**Раскомментировать в nginx.prod.conf**:
```nginx
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

И перезагрузить Docker:
```bash
docker-compose -f docker-compose.prod.yml restart frontend
```

### Шаг 6: Автоматические обновления сертификата
```bash
# Добавить в crontab
sudo crontab -e

# Добавить строку:
0 3 * * * certbot renew --quiet && docker-compose -f /path/to/docker-compose.prod.yml restart frontend
```

**Стоимость**: DigitalOcean $4–6/мес за VPS, дополнительно за БД резервные копии.

---

## 🟪 Вариант 4: Render.com (новая альтернатива, free на тесты)

### Шаг 1: Создание сервиса
```bash
# 1) https://render.com
# 2) Sign up → Connect GitHub
# 3) New → Web Service
# 4) Выбрать репо, выбрать branch main
```

### Шаг 2: Конфигурация
```
Build Command: cd backend && npm install
Start Command: cd backend && npm start
Environment: production
```

### Шаг 3: Добавление PostgreSQL
```
1) New → PostgreSQL
2) Скопировать Internal Database URL в переменные окружения Web Service
```

**Стоимость**: Free для первого Web Service + PostgreSQL ($7/мес).

---

## 📊 Сравнение платформ

| Платформа | Цена | Простота | Масштабируемость | Мониторинг |
|-----------|------|----------|------------------|-----------|
| **Heroku** | $7–50/мес | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Railway** | $5–30/мес | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Render** | Free–$7/мес | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Docker на VPS** | $4–20/мес | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **AWS/GCP/Azure** | $5–100+/мес | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔐 Чеклист перед production

- [ ] Все secrets в переменных окружения (не в коде!)
- [ ] JWT_SECRET минимум 32 символа
- [ ] HTTPS/SSL сертификат установлен
- [ ] БД резервная копия настроена
- [ ] Мониторинг (Prometheus/Grafana) работает
- [ ] Логи собираются (Loki/ELK)
- [ ] CORS правильно настроен
- [ ] Rate limiting включен
- [ ] Health check endpoint доступен
- [ ] Frontend и Backend версии синхронизированы

---

## 🆘 Troubleshooting

| Проблема | Решение |
|----------|---------|
| `Connection refused on port 4000` | Проверьте что backend контейнер запущен: `docker ps` |
| `DATABASE_URL not set` | Убедитесь что переменная окружения установлена в платформе |
| `CORS error from frontend` | Проверьте CORS_ORIGIN в .env и nginx конфиге |
| `SSL certificate expired` | Запустите `certbot renew` или используйте автоматическое обновление |
| `Out of disk space` | Очистьте Docker: `docker system prune` |
| `502 Bad Gateway` | Проверьте логи backend: `docker logs <container-id>` |

---

## 📞 Support

Для вопросов по deployment:
- 📧 Email: hello@dokwork.kz
- 📱 Телефон: +7 700 000 0000

---

**Last Updated**: 5 декабря 2025
