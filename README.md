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


## 🚀 Kurulum

### Gereksinimler

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Google Cloud Platform hesabı
- OpenAI API key

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

### ✅ Faz 1: Altyapı (Hafta 1-4)
- [x] Docker environment setup ✅ (13 Ocak 2026)
- [x] PostgreSQL + pgvector kurulumu ✅ (13 Ocak 2026)
- [ ] FastAPI temel yapı
- [ ] Next.js frontend skeleton
- [ ] JWT authentication

### 🔄 Faz 2: AI Entegrasyonu (Hafta 5-8)
- [ ] Google Cloud Vision API
- [ ] Kitap veri seti import
- [ ] OpenAI embedding oluşturma
- [ ] RAG pipeline kurulumu

### 📋 Faz 3: E-ticaret & UX (Hafta 9-12)
- [ ] Sepet ve sipariş sistemi
- [ ] Ödeme entegrasyonu (İyzico/Stripe)
- [ ] Responsive UI
- [ ] Optimizasyonlar (Redis, Celery)

## 🎨 Ekran Görüntüleri

_Geliştirme aşamasında eklenecek_

## 📊 Sistem Mimarisi

graph TB
    User[Kullanıcı] --> NextJS[Next.js Frontend]
    NextJS --> FastAPI[FastAPI Backend]
    FastAPI --> PostgreSQL[(PostgreSQL + pgvector)]
    FastAPI --> Redis[(Redis Cache)]
    FastAPI --> OpenAI[OpenAI API]
    FastAPI --> GoogleVision[Google Cloud Vision]## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.



