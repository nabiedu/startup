#!/bin/bash
# ============================================================================
# start-local-dev.sh — Локальный запуск проекта (SQLite fallback)
# Bash скрипт для запуска backend + frontend dev-сервера (Linux/macOS)
# ============================================================================

set -e

echo "================================"
echo "DOKWORK — Локальный dev-запуск"
echo "================================"
echo ""

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Пожалуйста, установите Node.js v16+"
    exit 1
fi
echo "✅ Node.js: $(node --version)"

# Переход в backend
cd "$(dirname "$0")/backend"

# Установка зависимостей (если node_modules не существует)
if [ ! -d "node_modules" ]; then
    echo "📦 Установка npm-зависимостей backend..."
    npm install
fi

# Генерация Prisma client для SQLite
echo "🔧 Генерация Prisma client (SQLite)..."
npm run prisma:generate:sqlite

# Применение миграций
echo "📊 Применение миграций БД (SQLite)..."
npm run prisma:migrate:sqlite -- --skip-generate

# Seed БД
echo "🌱 Загрузка примеров данных (seed)..."
npm run seed || echo "⚠️  Seed пропущен (может быть уже выполнен)"

# Запуск backend в фоне
echo "🚀 Запуск backend на порту 4000..."
npm run start:sqlite &
BACKEND_PID=$!

# Ждём старта сервера
echo "⏳ Ожидание старта сервера..."
sleep 3

# Проверка доступности backend
retries=0
max_retries=10
backend_ready=false

while [ $retries -lt $max_retries ]; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        backend_ready=true
        echo "✅ Backend запущен"
        break
    fi
    retries=$((retries + 1))
    if [ $retries -lt $max_retries ]; then
        echo "⏳ Ожидание backend ($retries/$max_retries)..."
        sleep 1
    fi
done

if [ "$backend_ready" = false ]; then
    echo "❌ Backend не запустился за 10 секунд"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Проверка /metrics endpoint
echo "📊 Проверка метрик..."
if curl -s http://localhost:4000/metrics > /dev/null 2>&1; then
    echo "✅ Prometheus /metrics доступна"
else
    echo "⚠️  /metrics недоступна (это OK)"
fi

# Открыть frontend в браузере
echo ""
echo "🌐 Открытие фронтенда в браузере..."
FRONTEND_PATH="$(cd "$(dirname "$0")" && pwd)/frontend/index.html"
if command -v xdg-open &> /dev/null; then
    xdg-open "file://$FRONTEND_PATH" &
elif command -v open &> /dev/null; then
    open "file://$FRONTEND_PATH" &
fi

echo ""
echo "================================"
echo "✅ Проект готов к работе!"
echo "================================"
echo ""
echo "📍 Frontend:  file://$FRONTEND_PATH"
echo "📍 Backend:   http://localhost:4000"
echo "📍 Health:    http://localhost:4000/health"
echo "📍 Metrics:   http://localhost:4000/metrics"
echo ""
echo "💡 Тестовые учётные данные:"
echo "   Email:    admin@dokwork.kz"
echo "   Password: admin123"
echo ""
echo "⏹️  Для остановки backend: Ctrl+C"
echo ""

# Ждём завершения backend
wait $BACKEND_PID
