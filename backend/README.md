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

### Mevcut Endpoints (Phase 1 & 2.1-2.3):

**Authentication (4 endpoint):**
- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi (JWT token)
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi (🔒)
- `POST /api/auth/refresh` - Token yenileme

**Books (6 endpoint):**
- `GET /api/books` - Kitap listesi (pagination, filters)
- `GET /api/books/search` - Full-text search (Elasticsearch) 🔍
- `GET /api/books/{id}` - Tek kitap detayı
- `POST /api/books` - Yeni kitap ekle (🔒 Admin)
- `PUT /api/books/{id}` - Kitap güncelle (🔒 Admin)
- `DELETE /api/books/{id}` - Kitap sil (🔒 Admin)

**User Preferences (9 endpoint):**
- `GET /api/me/favorites` - Favori kitaplar (🔒)
- `POST /api/me/favorites/{book_id}` - Favorilere ekle (🔒)
- `DELETE /api/me/favorites/{book_id}` - Favorilerden çıkar (🔒)
- `GET /api/me/cart` - Sepet (🔒)
- `POST /api/me/cart/{book_id}` - Sepete ekle (🔒)
- `DELETE /api/me/cart/{book_id}` - Sepetten çıkar (🔒)
- `GET /api/me/interactions` - Etkileşim geçmişi (🔒)
- `POST /api/me/interactions` - Yeni etkileşim (🔒)
- `GET /api/me/purchased` - Satın alınan kitaplar (🔒)

**Admin Panel (6 endpoint):**
- `GET /api/admin/users` - Tüm kullanıcılar (🔒 Admin)
- `GET /api/admin/users/{id}` - Kullanıcı detayı (🔒 Admin)
- `PUT /api/admin/users/{id}` - Kullanıcı güncelle (🔒 Admin)
- `DELETE /api/admin/users/{id}` - Kullanıcı sil (🔒 Admin)
- `GET /api/admin/stats` - İstatistikler (🔒 Admin)
- `POST /api/admin/seed` - Test data yükle (🔒 Admin)

**Vision API (3 endpoint):**
- `GET /api/vision/health` - Vision service health check
- `POST /api/vision/test` - OCR testi (base64 image) (🔒)
- `POST /api/vision/match-shelf` - Akıllı kitaplık eşleştirme (🔒) 🤖

**Recommendations (3 endpoint):**
- `GET /api/recommendations` - Kişiselleştirilmiş öneriler (🔒) 🤖
- `GET /api/recommendations/similar/{book_id}` - Benzer kitaplar (🔒) 🤖
- `POST /api/recommendations/refresh` - Tercih vektörü güncelle (🔒) 🤖

🔒 = Authentication gerekli  
🔍 = Elasticsearch search  
🤖 = AI-powered

**TOPLAM: 34 API ENDPOINT**

**Search Examples:**
```bash
# Basic search
GET /api/books/search?q=1984

# Fuzzy search (typo tolerance)
GET /api/books/search?q=Orwel  # Finds "Orwell"

# Search with filters
GET /api/books/search?q=fiction&genre=Science Fiction&max_price=50
```

## 📁 Proje Yapısı

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── __init__.py   # Router registry
│   │   ├── auth.py       # ✅ Auth (4 endpoints)
│   │   ├── books.py      # ✅ Books (6 endpoints)
│   │   ├── users.py      # ✅ User Preferences (9 endpoints)
│   │   ├── admin.py      # ✅ Admin Panel (6 endpoints)
│   │   ├── vision.py     # ✅ Vision API (3 endpoints)
│   │   ├── recommendations.py # ✅ Recommendations (3 endpoints)
│   │   ├── deps.py       # Auth dependencies
│   │   └── health.py     # Health check
│   ├── core/             # Core modules
│   │   ├── config.py     # Configuration
│   │   ├── database.py   # Database connection (pgvector)
│   │   ├── logging.py    # Logging setup
│   │   └── middleware.py # Custom middlewares
│   ├── models/           # SQLAlchemy models
│   │   ├── user.py       # ✅ User + preferences_vector
│   │   ├── book.py       # ✅ Book + embedding (1536-dim)
│   │   ├── cart.py       # ✅ Shopping cart
│   │   ├── order.py      # ✅ Orders
│   │   ├── user_interaction.py # ✅ Interactions (like/view/cart/purchase)
│   │   └── photo_scan.py # ✅ Vision scans
│   ├── schemas/          # Pydantic schemas
│   │   ├── auth.py       # ✅ Auth schemas
│   │   ├── book.py       # ✅ Book schemas
│   │   ├── user.py       # ✅ User schemas
│   │   ├── admin.py      # ✅ Admin schemas
│   │   └── recommendation.py # ✅ Recommendation schemas
│   ├── services/         # Business logic
│   │   ├── auth_service.py  # ✅ JWT & password hashing
│   │   ├── book_service.py  # ✅ Book CRUD
│   │   ├── user_service.py  # ✅ User interactions
│   │   ├── admin_service.py # ✅ Admin operations
│   │   ├── elasticsearch_service.py # ✅ Full-text search
│   │   ├── openai_service.py # ✅ Embeddings + GPT-4o (Phase 2.1)
│   │   ├── vision_service.py # ✅ OCR + Book detection (Phase 2.2)
│   │   └── recommendation_service.py # ✅ Recommendations (Phase 2.3)
│   └── main.py           # FastAPI application
├── alembic/              # Database migrations
│   └── versions/
│       ├── 4251afb851f4_initial_schema.py
│       └── b3a2c94e5f12_add_is_admin.py
├── scripts/              # Utility scripts
│   ├── start_server.sh   # ✅ Bash server başlatma
│   ├── start_server.ps1  # ✅ PowerShell server başlatma
│   ├── create_admin.py   # ✅ Admin kullanıcı oluşturma
│   ├── seed_books.py     # ✅ 20 kitap seed data
│   ├── index_books_to_es.py # ✅ Elasticsearch indexing
│   ├── generate_book_embeddings.py # ✅ Book embeddings (Phase 2.3)
│   ├── seed_interactions.py # ✅ Test user interactions (Phase 2.3)
│   └── test_recommendations.py # ✅ Recommendation tests (Phase 2.3)
├── docs/                 # Backend dokümantasyonu
│   ├── QUICKSTART.md
│   ├── SERVER_COMMANDS.md
│   ├── OPENAI-SERVICE.md # ✅ Phase 2.1 docs
│   ├── GCP-VISION-SETUP.md # ✅ Phase 2.2 docs
│   ├── VISION-SERVICE.md # ✅ Phase 2.2 docs
│   ├── SHELF-MATCHING.md # ✅ Phase 2.2 docs
│   └── RECOMMENDATION-ENGINE.md # ✅ Phase 2.3 docs
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
- ✅ **Görev 6:** Elasticsearch Search (fuzzy matching + auto-sync)

**Sıradaki:** Görev 7 - User Preferences System veya Phase 2 (AI/ML)

## 🆘 Yardım

Sorun yaşıyorsan:
1. [QUICKSTART.md](docs/QUICKSTART.md) dosyasını kontrol et
2. [SERVER_COMMANDS.md](docs/SERVER_COMMANDS.md) referansına bak
3. `logs/` klasöründeki log dosyalarını incele
