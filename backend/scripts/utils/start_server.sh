#!/bin/bash

# ============================================================
# BiblioMind Server Başlatma Script'i
# ============================================================

# Renk kodları
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 BiblioMind Server Başlatılıyor   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Backend dizinine git (scriptin iki üst dizini)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/../.."

# Docker servislerini kontrol et
echo -e "${YELLOW}→ Docker servislerini kontrol ediliyor...${NC}"
if ! docker ps | grep -q "bibliomind-postgres"; then
    echo -e "${RED}✗ PostgreSQL container çalışmıyor!${NC}"
    echo -e "${YELLOW}  Docker servisleri başlatılıyor...${NC}"
    # Backend dizinindeyiz, bir üst dizine git (proje root)
    PROJECT_ROOT="$(cd .. && pwd)"
    cd "$PROJECT_ROOT"
    docker-compose up -d
    cd backend
    sleep 5
    echo -e "${GREEN}✓ Docker servisleri başlatıldı${NC}"
else
    echo -e "${GREEN}✓ Docker servisleri çalışıyor${NC}"
fi

# venv'i aktifleştir
echo -e "${YELLOW}→ Virtual environment aktifleştiriliyor...${NC}"
if [ ! -d "venv" ]; then
    echo -e "${RED}✗ venv bulunamadı! Backend dizininde venv oluştur.${NC}"
    exit 1
else
    source venv/Scripts/activate
    echo -e "${GREEN}✓ Virtual environment aktif${NC}"
fi

# Environment variable set et
export DATABASE_URL="postgresql://postgres:postgres@localhost:5440/bibliomind"
echo -e "${GREEN}✓ Environment variables ayarlandı${NC}"

# Server'ı başlat
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Server Başlatılıyor...        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📍 Server URL:     ${NC}http://localhost:8000"
echo -e "${GREEN}📚 Swagger UI:     ${NC}http://localhost:8000/docs"
echo -e "${GREEN}📖 ReDoc:          ${NC}http://localhost:8000/redoc"
echo -e "${GREEN}💚 Health Check:   ${NC}http://localhost:8000/api/health"
echo ""
echo -e "${YELLOW}Durdurmak için: CTRL + C${NC}"
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
