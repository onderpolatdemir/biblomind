# BiblioMind Backend

FastAPI backend for BiblioMind - AI-powered book discovery platform.

## 🚀 Hızlı Başlangıç

### Ön Hazırlık

1. **Docker servislerini başlat:**
   ```bash
   cd ..
   docker-compose up -d
   cd backend
   ```

2. **Database migration uygula (ilk seferinde):**
   ```bash
   source venv/Scripts/activate  # Git Bash
   # veya
   .\venv\Scripts\Activate.ps1   # PowerShell
   
   alembic upgrade head
   ```

3. **Seed data ekle (opsiyonel, 20 kitap):**
   ```bash
   python scripts/seed_books.py
   ```

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

**Çıktı:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Application startup complete.
```

✅ Server hazır: **http://localhost:8000/docs**

## 📚 Dokümantasyon

- **[Hızlı Başlangıç](docs/QUICKSTART.md)** - Detaylı başlangıç kılavuzu
- **[Server Komutları](docs/SERVER_COMMANDS.md)** - Tüm komut referansı
- **[API Dokümantasyonu](http://localhost:8000/docs)** - Swagger UI (server çalışırken)

## 🌐 API Endpoints

Server başladıktan sonra:

| Endpoint | URL | Auth |
|----------|-----|------|
| **Swagger UI** | http://localhost:8000/docs | - |
| **ReDoc** | http://localhost:8000/redoc | - |
| **Health Check** | http://localhost:8000/api/health | - |

### Mevcut Endpoints (Görev 5'e kadar):

**Authentication (4 endpoint):**
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi (🔒)
- `POST /api/auth/refresh` - Token yenileme

**Books (5 endpoint):**
- `GET /api/books` - Kitap listesi (pagination, filters)
- `GET /api/books/{id}` - Tek kitap detayı
- `POST /api/books` - Yeni kitap ekle (🔒 Admin)
- `PUT /api/books/{id}` - Kitap güncelle (🔒 Admin)
- `DELETE /api/books/{id}` - Kitap sil (🔒 Admin)

🔒 = Authentication gerekli

## 📁 Proje Yapısı

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── __init__.py   # Router registry
│   │   ├── auth.py       # ✅ Auth endpoints (Görev 4)
│   │   ├── books.py      # ✅ Books endpoints (Görev 5)
│   │   ├── deps.py       # Auth dependencies
│   │   └── health.py     # Health check
│   ├── core/             # Core modules
│   │   ├── config.py     # Configuration
│   │   ├── database.py   # Database connection
│   │   ├── logging.py    # Logging setup
│   │   └── middleware.py # Custom middlewares
│   ├── models/           # SQLAlchemy models (9 model)
│   │   ├── user.py       # ✅ is_admin eklendi
│   │   ├── book.py
│   │   ├── cart.py
│   │   ├── order.py
│   │   └── ...
│   ├── schemas/          # Pydantic schemas
│   │   ├── auth.py       # ✅ Auth schemas
│   │   └── book.py       # ✅ Book schemas (Görev 5)
│   ├── services/         # Business logic
│   │   ├── auth_service.py  # ✅ JWT & password hashing
│   │   └── book_service.py  # ✅ Books CRUD (Görev 5)
│   └── main.py           # FastAPI application
├── alembic/              # Database migrations
│   └── versions/
│       ├── 4251afb851f4_initial_schema.py
│       └── b3a2c94e5f12_add_is_admin.py  # ✅ Görev 5
├── scripts/              # Utility scripts
│   ├── start_server.sh   # ✅ Bash başlatma scripti (düzeltildi)
│   ├── start_server.ps1  # PowerShell başlatma scripti
│   └── seed_books.py     # ✅ 20 kitap seed data (Görev 5)
├── docs/                 # Backend dokümantasyonu
│   ├── QUICKSTART.md
│   └── SERVER_COMMANDS.md
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

### Kurulum (İlk Sefer)

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
   - `.env` dosyasını oluştur (`.env.example` kullanabilirsin)
   - Gerekli değişkenleri ekle:
     ```env
     DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bibliomind
     SECRET_KEY=your-secret-key-here
     ```

5. **Database migration uygula:**
   ```bash
   alembic upgrade head
   ```

6. **Seed data ekle (opsiyonel):**
   ```bash
   python scripts/seed_books.py
   ```
   → 20 kitap eklenir (1984, Pride and Prejudice, vb.)

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

- **Server Port:** 8000
- **Database Port:** 5433 (5432 yerine, yerel PostgreSQL çakışmasını önlemek için)
- **Auto-reload:** Development modunda aktif (dosya değişikliklerini otomatik algılar)
- **Logs:** Console'da gösterilir
- **Seed Data:** 20 klasik ve popüler kitap mevcut

## 🎯 Tamamlanan Görevler

- ✅ **Görev 1:** Docker & Database Setup
- ✅ **Görev 2:** Database Schema & Models (9 model)
- ✅ **Görev 3:** FastAPI Core Setup
- ✅ **Görev 4:** Authentication System (JWT + bcrypt)
- ✅ **Görev 5:** Books API (CRUD + pagination + filters)

**Sıradaki:** Görev 6 - Elasticsearch Search Integration

## 🆘 Yardım

Sorun yaşıyorsan:
1. [QUICKSTART.md](docs/QUICKSTART.md) dosyasını kontrol et
2. [SERVER_COMMANDS.md](docs/SERVER_COMMANDS.md) referansına bak
3. `logs/` klasöründeki log dosyalarını incele
