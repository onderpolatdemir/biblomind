# BiblioMind - Environment Setup Script (PowerShell/Windows)

Write-Host "BiblioMind Environment Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (Test-Path "backend\.env") {
    Write-Host "[OK] backend\.env already exists" -ForegroundColor Green
} else {
    Write-Host "[*] Creating backend\.env from template..." -ForegroundColor Yellow
    Copy-Item ".env.backend.example" "backend\.env"
    
    # Generate SECRET_KEY
    Write-Host "[*] Generating SECRET_KEY..." -ForegroundColor Yellow
    $SECRET_KEY = python -c "import secrets; print(secrets.token_urlsafe(32))"
    
    # Replace SECRET_KEY in .env file
    $envContent = Get-Content "backend\.env" -Raw
    $envContent = $envContent -replace "SECRET_KEY=your-secret-key-change-this-min-32-chars-REPLACE-THIS", "SECRET_KEY=$SECRET_KEY"
    Set-Content "backend\.env" $envContent
    
    Write-Host "[OK] backend\.env created with generated SECRET_KEY" -ForegroundColor Green
}

Write-Host ""
Write-Host "[*] Starting Docker services..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "[*] Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "[*] Testing PostgreSQL connection..." -ForegroundColor Cyan
docker exec bibliomind-postgres pg_isready -U postgres

Write-Host ""
Write-Host "[*] Creating pgvector extension..." -ForegroundColor Cyan
docker exec bibliomind-postgres psql -U postgres -d bibliomind -c "CREATE EXTENSION IF NOT EXISTS vector;"

Write-Host ""
Write-Host "[*] Testing Redis connection..." -ForegroundColor Cyan
docker exec bibliomind-redis redis-cli ping

Write-Host ""
Write-Host "[*] Testing Elasticsearch connection..." -ForegroundColor Cyan
curl http://localhost:9200/_cluster/health

Write-Host ""
Write-Host "[OK] All services are up and running!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: localhost:5432"
Write-Host "   Redis: localhost:6379"
Write-Host "   Elasticsearch: http://localhost:9200"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. cd backend"
Write-Host "   2. python -m venv venv"
Write-Host "   3. venv\Scripts\activate"
Write-Host "   4. pip install -r requirements.txt"
Write-Host ""
