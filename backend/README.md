# BiblioMind Backend

FastAPI backend for BiblioMind - AI-powered book discovery platform.

## 🚀 Hızlı Başlangıç

### Otomatik Başlatma (Önerilen)

**Git Bash / Linux / macOS:**
```bash
./scripts/start_server.sh
```

**Windows PowerShell:**
```powershell
.\scripts\start_server.ps1
```

### Manuel Başlatma

**Git Bash:**
```bash
source venv/Scripts/activate
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bibliomind"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bibliomind"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📚 Dokümantasyon

- **[Hızlı Başlangıç](docs/QUICKSTART.md)** - Detaylı başlangıç kılavuzu
- **[Server Komutları](docs/SERVER_COMMANDS.md)** - Tüm komut referansı
- **[API Dokümantasyonu](http://localhost:8000/docs)** - Swagger UI (server çalışırken)

## 🌐 API Endpoints

Server başladıktan sonra:

| Endpoint | URL |
|----------|-----|
| Swagger UI | http://localhost:8000/docs |
| ReDoc | http://localhost:8000/redoc |
| Health Check | http://localhost:8000/api/health |

## 📁 Proje Yapısı

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── __init__.py   # Router registry
│   │   └── health.py     # Health check
│   ├── core/             # Core modules
│   │   ├── config.py     # Configuration
│   │   ├── database.py   # Database connection
│   │   ├── logging.py    # Logging setup
│   │   └── middleware.py # Custom middlewares
│   ├── models/           # SQLAlchemy models
│   │   ├── user.py
│   │   ├── book.py
│   │   ├── cart.py
│   │   └── order.py
│   └── main.py           # FastAPI application
├── alembic/              # Database migrations
├── scripts/              # Utility scripts
│   ├── start_server.sh   # Bash başlatma scripti
│   └── start_server.ps1  # PowerShell başlatma scripti
├── docs/                 # Backend dokümantasyonu
├── logs/                 # Application logs
├── .env                  # Environment variables
├── requirements.txt      # Python dependencies
└── README.md            # Bu dosya
```

## 🔧 Geliştirme

### Ön Gereksinimler

- Python 3.11+
- PostgreSQL (Docker ile)
- Redis (Docker ile)
- Elasticsearch (Docker ile)

### Kurulum

1. **Virtual environment oluştur:**
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Git Bash
   # veya
   .\venv\Scripts\Activate.ps1   # PowerShell
   ```

2. **Paketleri yükle:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Docker servislerini başlat:**
   ```bash
   cd ..
   docker-compose up -d
   cd backend
   ```

4. **Environment variables ayarla:**
   - `.env` dosyasını oluştur
   - Gerekli değişkenleri ekle (DATABASE_URL, SECRET_KEY, vb.)

5. **Database migration:**
   ```bash
   alembic upgrade head
   ```

### Yeni Migration Oluşturma

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

## 🧪 Test

```bash
pytest tests/
```

## 📝 Notlar

- **Port:** 8000
- **Database Port:** 5433 (5432 yerine, yerel PostgreSQL çakışmasını önlemek için)
- **Auto-reload:** Development modunda aktif
- **Logs:** `logs/` klasöründe

## 🆘 Yardım

Sorun yaşıyorsan:
1. [QUICKSTART.md](docs/QUICKSTART.md) dosyasını kontrol et
2. [SERVER_COMMANDS.md](docs/SERVER_COMMANDS.md) referansına bak
3. `logs/` klasöründeki log dosyalarını incele
