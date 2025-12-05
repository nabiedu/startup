# ============================================================================
# start-local-dev.ps1 — Локальный запуск проекта (SQLite fallback)
# Windows PowerShell скрипт для запуска backend + frontend dev-сервера
# ============================================================================

Write-Host "================================" -ForegroundColor Green
Write-Host "DOKWORK — Локальный dev-запуск" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""

# Проверка Node.js
$node = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js не установлен. Пожалуйста, установите Node.js v16+." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js: $node" -ForegroundColor Green

# Переход в backend
Set-Location "$PSScriptRoot\backend"

# Установка зависимостей (если node_modules не существует)
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Установка npm-зависимостей backend..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install failed" -ForegroundColor Red
        exit 1
    }
}

# Генерация Prisma client для SQLite
Write-Host "🔧 Генерация Prisma client (SQLite)..." -ForegroundColor Yellow
npm run prisma:generate:sqlite
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma generate failed" -ForegroundColor Red
    exit 1
}

# Применение миграций
Write-Host "📊 Применение миграций БД (SQLite)..." -ForegroundColor Yellow
npm run prisma:migrate:sqlite -- --skip-generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Prisma migrate failed" -ForegroundColor Red
    exit 1
}

# Seed БД (если нужно; может быть пропущено если уже есть данные)
Write-Host "🌱 Загрузка примеров данных (seed)..." -ForegroundColor Yellow
npm run seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seed failed (это OK если уже есть данные)" -ForegroundColor Yellow
}

# Запуск backend в фоне
Write-Host "🚀 Запуск backend на порту 4000..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $args[0]
    npm run start:sqlite
} -ArgumentList (Get-Location)

# Ждём старта сервера
Write-Host "⏳ Ожидание старта сервера..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Проверка доступности backend
$retries = 0
$maxRetries = 10
$backendReady = $false

while ($retries -lt $maxRetries) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4000/health" -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ Backend запущен: $($response | ConvertTo-Json)" -ForegroundColor Green
        break
    }
    catch {
        $retries++
        if ($retries -lt $maxRetries) {
            Write-Host "⏳ Ожидание backend ($retries/$maxRetries)..." -ForegroundColor Cyan
            Start-Sleep -Seconds 1
        }
    }
}

if (!$backendReady) {
    Write-Host "❌ Backend не запустился за 10 секунд" -ForegroundColor Red
    Write-Host "Попробуйте запустить вручную: cd backend && npm run start:sqlite" -ForegroundColor Yellow
    exit 1
}

# Проверка /metrics endpoint
Write-Host "📊 Проверка метрик..." -ForegroundColor Cyan
try {
    $metrics = Invoke-RestMethod -Uri "http://localhost:4000/metrics" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Prometheus /metrics доступна" -ForegroundColor Green
}
catch {
    Write-Host "⚠️  /metrics недоступна (это OK)" -ForegroundColor Yellow
}

# Открыть frontend в браузере
Write-Host ""
Write-Host "🌐 Открытие фронтенда в браузере..." -ForegroundColor Green
$frontendPath = Convert-Path "$PSScriptRoot\frontend\index.html"
Start-Process $frontendPath

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "✅ Проект готов к работе!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend:  file:///$frontendPath" -ForegroundColor Cyan
Write-Host "📍 Backend:   http://localhost:4000" -ForegroundColor Cyan
Write-Host "📍 Health:    http://localhost:4000/health" -ForegroundColor Cyan
Write-Host "📍 Metrics:   http://localhost:4000/metrics" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Тестовые учётные данные:" -ForegroundColor Yellow
Write-Host "   Email:    admin@dokwork.kz" -ForegroundColor Gray
Write-Host "   Password: admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "⏹️  Для остановки backend: exit" -ForegroundColor Yellow
Write-Host ""

# Ждём завершения backend
Receive-Job -Job $backendJob -Wait
