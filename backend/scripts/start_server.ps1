# ============================================================
# BiblioMind Server Başlatma Script'i (Windows PowerShell)
# ============================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   🚀 BiblioMind Server Başlatılıyor   ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

# Backend dizinine git
$BackendDir = Split-Path -Parent $PSScriptRoot
Set-Location $BackendDir

# Docker servislerini kontrol et
Write-Host "→ Docker servisleri kontrol ediliyor..." -ForegroundColor Yellow
$dockerPs = docker ps 2>$null | Select-String "bibliomind-postgres"
if (-not $dockerPs) {
    Write-Host "✗ PostgreSQL container çalışmıyor!" -ForegroundColor Red
    Write-Host "  Docker servisleri başlatılıyor..." -ForegroundColor Yellow
    Set-Location ..
    docker-compose up -d
    Set-Location backend
    Start-Sleep -Seconds 5
    Write-Host "✓ Docker servisleri başlatıldı" -ForegroundColor Green
} else {
    Write-Host "✓ Docker servisleri çalışıyor" -ForegroundColor Green
}

# venv'i kontrol et ve aktifleştir
Write-Host "→ Virtual environment aktifleştiriliyor..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host "✗ venv bulunamadı!" -ForegroundColor Red
    Write-Host "  venv oluşturuluyor..." -ForegroundColor Yellow
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    Write-Host "✓ venv oluşturuldu ve paketler yüklendi" -ForegroundColor Green
} else {
    .\venv\Scripts\Activate.ps1
    Write-Host "✓ Virtual environment aktif" -ForegroundColor Green
}

# Environment variable set et
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/bibliomind"
Write-Host "✓ Environment variables ayarlandı" -ForegroundColor Green

# Server'ı başlat
Write-Host ""
Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║         Server Başlatılıyor...        ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""
Write-Host "📍 Server URL:     " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:8000"
Write-Host "📚 Swagger UI:     " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:8000/docs"
Write-Host "📖 ReDoc:          " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:8000/redoc"
Write-Host "💚 Health Check:   " -NoNewline -ForegroundColor Green
Write-Host "http://localhost:8000/api/health"
Write-Host ""
Write-Host "Durdurmak için: CTRL + C" -ForegroundColor Yellow
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
