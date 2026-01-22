# 📚 BiblioMind - AI-Powered Book Discovery Platform

> Yapay zeka destekli, fotoğraftan kitap tanıma ve kişiselleştirilmiş öneri sistemi

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 🎯 Proje Özeti

BiblioMind, kullanıcıların **kitaplık fotoğraflarından** yapay zeka ile kitap keşfetmesini sağlayan yeni nesil bir e-ticaret platformudur. Google Cloud Vision API ile görsel tanıma, OpenAI ile anlamsal öneri motoru ve RAG (Retrieval Augmented Generation) mimarisi kullanır.

### Ana Özellikler

- 📸 **Fotoğraftan Kitap Tanıma** - Kitaplık fotoğrafı çek, AI sana uygun kitapları bulsun
- 🤖 **Kişiselleştirilmiş Öneriler** - Vektör tabanlı kullanıcı profilleme
- 💬 **Akıllı Açıklamalar** - "Bu kitabı NEDEN öneriyorum?" GPT-4o destekli
- 🛒 **E-ticaret Entegrasyonu** - Sepet, sipariş, ödeme sistemi
- 🔍 **Anlamsal Arama** - Elasticsearch + pgvector ile güçlü arama

## 🏗️ Teknoloji Stack

### Backend
- **FastAPI** (Python 3.11+)
- **PostgreSQL** + **pgvector** (vektör veritabanı)
- **Elasticsearch** (full-text search)
- **Redis** (caching)
- **SQLAlchemy** (ORM)

### AI/ML
- **OpenAI API** (GPT-4o, text-embedding-3-large)
- **Google Cloud Vision API** (OCR + Object Detection)
- **LangChain** (RAG pipeline)

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **React Query**

### DevOps
- **Docker** + **Docker Compose**
- **PostgreSQL 16** (with pgvector extension)
- **Nginx** (reverse proxy)

## 📁 Proje Yapısı
bibliomind/
├── backend/
│ ├── app/
│ │ ├── api/ # API endpoints
│ │ ├── models/ # SQLAlchemy models
│ │ ├── services/ # Business logic
│ │ ├── core/ # Config & dependencies
│ │ └── main.py # FastAPI app
│ ├── requirements.txt
│ └── Dockerfile
├── frontend/
│ ├── src/
│ │ ├── app/ # Next.js pages
│ │ ├── components/ # React components
│ │ ├── lib/ # Utilities
│ │ └── hooks/ # Custom hooks
│ ├── package.json
│ └── next.config.js
├── data/
│ └── scripts/ # Data import scripts
├── docker-compose.yml
└── README.md


## 🚀 Hızlı Başlangıç

### ⚡ Backend Başlatma (Hazır!)

```bash
# 1. Docker servislerini başlat
docker-compose up -d

# 2. Backend'e git ve server'ı başlat
cd backend
./scripts/utils/start_server.sh          # Git Bash / Linux / macOS
# veya
.\scripts\utils\start_server.ps1          # Windows PowerShell

# 3. Tarayıcıda aç
# http://localhost:8000/docs
```

**✅ Tamamlanan:**

**Phase 1 - Infrastructure (%100):**
- Docker & Database Setup
- Auth API (JWT) - 4 endpoint
- Books API (CRUD + pagination + search) - 6 endpoint  
- User Preferences API - 9 endpoint
- Admin Panel API - 6 endpoint
- Elasticsearch Search Integration
- 20 kitap seed data
- **Toplam: 25 API endpoint**

**Phase 2 - AI Integration (%100):**
- OpenAI Services + LangChain Integration
- Google Vision API + Bookshelf Matching - 2 endpoint
- Recommendation Engine - 3 endpoint
- RAG-Powered Chatbot - 5 endpoint
- **Phase 2 Toplam: 10 API endpoint**
**Phase 3 Toplam: 4 API endpoint (social features)**
- **GENEL TOPLAM: 39 API endpoint**

**Phase 2.1 - OpenAI Services (%100):**
- OpenAI text embeddings (1536 dimensions)
- GPT-4o personalized explanations
- Redis caching + token tracking
- LangChain integration
- **Docs:** `backend/docs/OPENAI-SERVICE.md`

**Phase 2.2 - Vision API + Bookshelf Matching (%100):**
- Google Cloud Vision OCR (4-direction rotation)
- AI-powered book detection (OCR error correction)
- Smart bookshelf matching system
- User reading profile generation (AI-based)
- Shelf analysis + compatibility scoring
- **2 new endpoints:** `/api/vision/match-shelf`, `/api/vision/test`
- **Docs:** `backend/docs/SHELF-MATCHING.md`

**Phase 2.3 - Recommendation Engine (%100):**
- Content-based filtering with pgvector (cosine similarity)
- Hybrid scoring (content 0.7 + popularity 0.2 + recency 0.1)
- User preference vector (weighted average of interactions)
- Cold start strategy (popular fallback)
- Background tasks for async vector updates
- **3 new endpoints:** `/api/recommendations`, `/api/recommendations/similar/{id}`, `/api/recommendations/refresh`
- **Performance:** <150ms (hedef 500ms)
- **Docs:** `backend/docs/RECOMMENDATION-ENGINE.md`

**Phase 2.4 - LangChain Integration & RAG Chatbot (%100):**
- RAG (Retrieval Augmented Generation) pipeline
- Fuzzy book detection (threshold: 0.70)
- HYBRID strategy (book_detection / recommendation_engine / popular_books / no_books)
- Conversation management (max 5 per user)
- Auto-generated conversation titles (GPT-4o)
- Semantic search with pgvector (cosine distance)
- **5 new endpoints:** `/api/chat/message`, `/api/chat/conversations`, `/api/chat/conversations/{id}`, etc.
- **Test Suite:** 8 scenarios, all passing ✅
- **Docs:** `backend/docs/CHATBOT-SERVICE.md`, `backend/docs/RAG-PIPELINE.md`, `backend/docs/PHASE-2.4-COMPLETED.md`

**Phase 3 - Advanced Backend Features (%100):**
- **Dataset Import:** 1000 popüler kitap (Kaggle + Open Library Covers API)
- **Social Features:** Book Buddy matching (4 endpoints) - cosine similarity based
- **Redis Caching:** 32.4x speedup (0.70ms vs 22.71ms)
- **Database Optimization:** Performance indexes (IVFFLAT, GIN, B-tree)
- **Rate Limiting:** slowapi integration (per-user/IP limits)
- **Sentry Monitoring:** Error tracking + performance monitoring
- **Enhanced Logging:** Structured JSON logging + request ID tracking
- **Integration Tests:** 5/5 passing ✅
- **Load Testing:** Locust configuration (98.9% success rate)
- **Performance:** Health endpoint 32x faster (16ms), all targets met ✅
- **Docs:** `docs/reports/PHASE-3-COMPLETED.md`

**🚀 Sırada:** Phase 4 - Frontend Integration

**📚 Detaylı backend kurulumu:** [backend/README.md](backend/README.md)

---

## 🛠️ Kurulum (İlk Sefer)

### Gereksinimler

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Google Cloud Platform hesabı (Phase 2'de gerekli)
- OpenAI API key (Phase 2'de gerekli)

### 1. Repository'yi klonlayın

git clone https://github.com/KULLANICI_ADIN/bibliomind.git
cd bibliomind### 2. Environment variables oluşturun

# Backend .env dosyası
cp backend/.env.example backend/.env
# OpenAI, Google Cloud credentials ekleyin### 3. Docker ile başlatın

docker-compose up -d### 4. Database migration

docker exec -it bibliomind-backend alembic upgrade head### 5. Uygulamayı açın

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📚 Proje Dokümantasyonu

**Tüm dökümanlar [`docs/`](./docs/) klasöründe organize edilmiştir.**

### 🚀 Hızlı Başlangıç
- **[Hızlı Başlangıç Rehberi](./docs/01-QUICK-START.md)** - İlk kurulum ve adım adım rehber
- **[Environment Setup](./docs/02-ENVIRONMENT-SETUP.md)** - API key'leri ve yapılandırma
- **[Proje Durumu](./docs/06-PROJECT-STATUS.md)** - Güncel durum ve yapılacaklar

### 👥 Ekip ve Görevler
- **[Ekip Görev Dağılımı](./docs/03-TEAM-ROLES.md)** - Kaan, Barış, Önder görevleri
- **[Proje Genel Bakış](./docs/00-PROJECT-OVERVIEW.md)** - Detaylı proje tanıtımı

### 🔧 Teknik Dökümanlar
- **[API Contract](./docs/04-API-CONTRACT.md)** - Tüm API endpoint'leri ve örnekler
- **[Integration Guide](./docs/05-INTEGRATION-GUIDE.md)** - Mock→Real API entegrasyonu

### 📊 Raporlar
- **[Görev Raporları](./docs/reports/)** - Tamamlanan görevlerin detaylı raporları

**Detaylı döküman indeksi için:** [`docs/README.md`](./docs/README.md)

## 🗺️ Geliştirme Yol Haritası

### ✅ Faz 1: Altyapı (Hafta 1-4) - TAMAMLANDI

**Backend (Kaan):**
- [x] **Görev 1:** Docker & Database Setup ✅ (20 Ocak 2026)
- [x] **Görev 2:** Database Schema & Models (9 model) ✅ (20 Ocak 2026)
- [x] **Görev 3:** FastAPI Core Setup ✅ (20 Ocak 2026)
- [x] **Görev 4:** Authentication System (JWT + bcrypt) ✅ (20 Ocak 2026)
- [x] **Görev 5:** Books API (CRUD + pagination) ✅ (20 Ocak 2026)
- [x] **Görev 6:** Elasticsearch Search (fuzzy matching + auto-sync) ✅ (20 Ocak 2026)

**Frontend (Barış):**
- [ ] Next.js frontend skeleton
- [ ] UI Components (shadcn/ui)
- [ ] Auth sayfaları

**E-commerce (Önder):**
- [ ] Ödeme entegrasyonu araştırması
- [ ] Sepet/Order UI tasarımı

### 🔄 Faz 2: AI Entegrasyonu (Hafta 5-8)
- [x] Google Cloud Vision API
- [x] Kitap veri seti import
- [x] OpenAI embedding oluşturma
- [x] RAG pipeline kurulumu

### 📋 Faz 3: E-ticaret & UX (Hafta 9-12)
- [ ] Sepet ve sipariş sistemi
- [ ] Ödeme entegrasyonu (İyzico/Stripe)
- [ ] Responsive UI
- [ ] Optimizasyonlar (Redis, Celery)


## 📊 Sistem Mimarisi

graph TB
    User[Kullanıcı] --> NextJS[Next.js Frontend]
    NextJS --> FastAPI[FastAPI Backend]
    FastAPI --> PostgreSQL[(PostgreSQL + pgvector)]
    FastAPI --> Redis[(Redis Cache)]
    FastAPI --> OpenAI[OpenAI API]
    FastAPI --> GoogleVision[Google Cloud Vision]## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b your-name/feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin your-name/feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.



