# 🚀 BiblioMind Backend - Hızlı Başlangıç

## Server Nasıl Çalıştırılır?

### 🪟 Windows (PowerShell)

```powershell
cd C:\Users\kaany\Desktop\bitirme\biblomind\backend
.\start_server.ps1
```

### 🐧 Git Bash / Linux / macOS

```bash
cd ~/Desktop/bitirme/biblomind/backend
./start_server.sh
```

### 📝 Manuel Başlatma (İhtiyaç halinde)

**Git Bash:**
```bash
cd ~/Desktop/bitirme/biblomind/backend
source venv/Scripts/activate
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bibliomind"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**PowerShell:**
```powershell
cd C:\Users\kaany\Desktop\bitirme\biblomind\backend
.\venv\Scripts\Activate.ps1
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bibliomind"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 🌐 Erişim URL'leri

Server başladıktan sonra:

- **API Root:** http://localhost:8000/
- **Swagger UI:** http://localhost:8000/docs ⭐
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/api/health

## 🛑 Server Nasıl Durdurulur?

Terminal'de `CTRL + C` tuşlarına bas.

## ⚙️ Ön Gereksinimler

Script otomatik kontrol eder, ama elle başlatırsan:

1. **Docker servisleri çalışıyor olmalı:**
   ```bash
   docker-compose up -d
   ```

2. **Python paketleri yüklü olmalı:**
   ```bash
   pip install -r requirements.txt
   ```

## 🐛 Sorun Giderme

### "ModuleNotFoundError" hatası alıyorsan:
```bash
source venv/Scripts/activate  # veya .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### "Address already in use" hatası alıyorsan:
```bash
# Port 8000'i kullanan process'i bul ve kapat
netstat -ano | findstr :8000
taskkill /PID [PROCESS_ID] /F
```

### Docker bağlantı hatası alıyorsan:
```bash
docker-compose restart postgres redis elasticsearch
```

## 📚 Daha Fazla Bilgi

- **Ana README:** `../README.md`
- **API Dokümantasyonu:** http://localhost:8000/docs
- **Görev Raporları:** `../docs/reports/`
