# BiblioMind - Ekip Görev Dağılımı

**Proje Tipi:** AI Destekli Kitap Keşif Platformu  
**Ekip:** 3 Kişi (Kaan, Barış, Önder)  
**Süre:** 12 Hafta  
**Güncelleme:** 13 Ocak 2026

---

## 🎯 Görev Dağılım Prensibi

```
┌─────────────────────────────────────────────┐
│  Kaan (AI-Backend Lead)        │    50%    │
│  Barış (Frontend UI/UX)        │    25%    │
│  Önder (E-ticaret & Admin)     │    25%    │
└─────────────────────────────────────────────┘
```

### Bağımsızlık İlkesi 🔓
- Her ekip üyesi **kendi görevlerinde bağımsız** çalışabilmeli
- Mock data ve dummy API'lerle **paralel geliştirme**
- Haftalık **entegrasyon noktaları** belirlendi
- Blocker durumunda **hemen iletişim**

---

## 👨‍💻 KAAN - AI & Backend Lead (50%)

**Uzmanlık:** AI/ML, Backend Architecture, Vektör Sistemleri  
**Teknolojiler:** FastAPI, PostgreSQL, pgvector, OpenAI, Google Vision, LangChain

### 📊 Sorumluluk Alanları
1. 🤖 AI/ML sistemleri (OpenAI, Google Vision, LangChain)
2. 🔧 FastAPI backend core ve API design
3. 📊 Vektör veritabanı (pgvector) ve embedding sistemleri
4. 🔐 Authentication & Authorization
5. 🐳 Docker & DevOps kurulumu
6. 🔍 Search (Elasticsearch) ve öneri algoritmaları

---

## 📋 KAAN'IN GÖREVLERİ

### PHASE 1: Altyapı (Hafta 1-4)

#### ✅ 1.1 Docker & Database Setup [3 gün]
**Öncelik:** 🔴 Kritik - Blocker  
**Durum:** ✅ **TAMAMLANDI** (13 Ocak 2026)

**Görevler:**
- [x] `docker-compose.yml` oluştur:
  ```yaml
  services:
    - postgres (pgvector extension ile)
    - redis
    - elasticsearch
    - backend (FastAPI)
  ```
- [ ] `.env` ve `.env.example` dosyaları
- [ ] PostgreSQL pgvector extension kurulumu
- [ ] Tüm servislerin health check'leri
- [ ] `docker-compose up` ile test

**Çıktı:** Docker ortamı çalışır durumda  
**Entegrasyon:** Barış ve Önder local'de kullanabilir

---

#### ✅ 1.2 Database Schema & Models [4 gün]
**Öncelik:** 🔴 Kritik  
**Durum:** ✅ **TAMAMLANDI** (13 Ocak 2026)

**Görevler:**
- [x] SQLAlchemy Base model setup
- [x] Models oluştur:
  - [x] `User` (preferences_vector: vector(1536))
  - [x] `Book` (embedding: vector(1536))
  - [x] `UserInteraction`
  - [x] `PhotoScan` (detected_books, recommendations)
  - [x] `Cart`, `CartItem`
  - [x] `Order`, `OrderItem`
- [x] Alembic migration setup
- [x] İlk migration: `alembic revision --autogenerate -m "Initial schema"`
- [x] pgvector extension aktif edildi
- [ ] pgvector indeksleri (opsiyonel - data eklenince)
- [ ] Seed data script (Görev 5'te yapılacak)

**Çıktı:** ✅ Database schema hazır, migration uygulandı  
**Entegrasyon:** ✅ **Önder cart/order modelleri kullanabilir**  
**Test:** pgAdmin ile bağlantı test edildi ✅  
**Rapor:** `docs/reports/TASK-02-DATABASE-SETUP.md`

---

#### ✅ 1.3 FastAPI Core Setup [3 gün]
**Öncelik:** 🔴 Kritik  
**Durum:** ✅ **TAMAMLANDI** (13 Ocak 2026)

**Görevler:**
- [x] `backend/app/main.py` FastAPI app oluştur
- [x] CORS middleware (frontend için)
- [x] `backend/app/core/config.py` (Pydantic Settings)
- [x] Database session dependency
- [x] Global exception handler
- [x] Logging setup (console only)
- [x] Request logging middleware
- [x] `/api/health` endpoint
- [x] Swagger UI aktif
- [x] Server başlatma scriptleri (`start_server.sh` & `.ps1`)

**Çıktı:** ✅ FastAPI app çalışıyor, Swagger erişilebilir  
**Test:** `http://localhost:8000/docs` ✅  
**Rapor:** `docs/reports/TASK-03-FASTAPI-CORE.md`

---

#### ✅ 1.4 Authentication System [4 gün]
**Öncelik:** 🔴 Kritik - Barış'a blocker  
**Durum:** ✅ **TAMAMLANDI** (13 Ocak 2026) 🎉

**Görevler:**
- [x] `backend/app/services/auth_service.py`:
  - [x] Password hashing (bcrypt)
  - [x] JWT token generation (access + refresh)
  - [x] Token validation and decoding
  - [x] User authentication
  - [x] User creation
- [x] `backend/app/schemas/auth.py`:
  - [x] UserCreate, UserLogin schemas
  - [x] UserResponse, Token, TokenRefresh schemas
- [x] `backend/app/api/auth.py` endpoints:
  - [x] `POST /api/auth/register` - Yeni kullanıcı kaydı
  - [x] `POST /api/auth/login` - Kullanıcı girişi
  - [x] `GET /api/auth/me` - Mevcut kullanıcı bilgisi
  - [x] `POST /api/auth/refresh` - Token yenileme
- [x] `backend/app/api/deps.py`:
  - [x] JWT middleware dependency (`get_current_user`)
  - [x] Optional auth dependency (`get_current_user_optional`)
  - [x] HTTP Bearer authentication
- [x] Security:
  - [x] bcrypt password hashing
  - [x] HS256 JWT signing
  - [x] Access token: 60 dakika
  - [x] Refresh token: 7 gün
  - [x] Email uniqueness check
- [ ] Rate limiting (opsiyonel - ileri aşama)
- [ ] Unit tests (opsiyonel - ileri aşama)

**Çıktı:** ✅ **Auth API hazır ve test edildi**  
**Entegrasyon:** ✅ **BLOCKER KALDIRILDI! Barış auth UI'yi bağlayabilir!** 🚀  
**Test:** Swagger UI'de tüm endpoint'ler test edilebilir  
**Rapor:** `docs/reports/TASK-04-AUTHENTICATION.md`

**API Contract Onaylandı:**
```json
POST /api/auth/register ✅
POST /api/auth/login ✅
GET /api/auth/me ✅
POST /api/auth/refresh ✅
```

---

#### ✅ 1.5 Books API (CRUD) [3 gün]
**Öncelik:** 🔴 Kritik - Barış ve Önder'e blocker  
**Durum:** ✅ **TAMAMLANDI** (20 Ocak 2026)

**Görevler:**
- [x] Admin permission sistemi:
  - [x] `User.is_admin` field (Boolean)
  - [x] Migration: `b3a2c94e5f12_add_is_admin`
  - [x] `get_current_admin_user` dependency (403 Forbidden)
- [x] `backend/app/schemas/book.py`:
  - [x] BookBase, BookCreate, BookUpdate
  - [x] BookResponse, BookListResponse
- [x] `backend/app/services/book_service.py`:
  - [x] `get_books()` - Pagination + filters + sorting
  - [x] `get_book_by_id()` - Single book
  - [x] `create_book()`, `update_book()`, `delete_book()`
  - [x] `check_isbn_exists()` - Uniqueness validation
- [x] `backend/app/api/books.py` endpoints:
  - [x] `GET /api/books` - Public list
  - [x] `GET /api/books/{id}` - Public detail
  - [x] `POST /api/books` - Admin create
  - [x] `PUT /api/books/{id}` - Admin update
  - [x] `DELETE /api/books/{id}` - Admin delete
- [x] Features:
  - [x] Pagination (page, page_size, total_pages)
  - [x] Filters (genre, author, price range)
  - [x] Sorting (title, author, price, created_at)
  - [x] ISBN uniqueness check
- [x] Seed data: `scripts/seed_books.py` (20 kitap)
- [x] Router registration eklendi

**Çıktı:** ✅ **Books API hazır ve test edildi**  
**Entegrasyon:** ✅ **BLOCKER KALDIRILDI!**
- **Barış:** Books list/detail pages yapabilir 📚
- **Önder:** Cart API için book availability check yapabilir 🛒

**Test:** Swagger UI'de 5 endpoint test edilebilir  
**Rapor:** `docs/reports/TASK-05-BOOKS-API.md`  
**Branch:** `kaan/feature/books-api`

**API Contract Onaylandı:**
```json
GET /api/books ✅ (pagination + filters + sorting)
GET /api/books/{id} ✅
POST /api/books ✅ (admin only)
PUT /api/books/{id} ✅ (admin only)
DELETE /api/books/{id} ✅ (admin only)
```

---

### PHASE 2: AI/ML Entegrasyonu (Hafta 5-8) ⭐

#### 🤖 2.1 OpenAI Services [5 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor (Phase 1 tamamlanmalı)

**Görevler:**
- [ ] `backend/app/services/openai_service.py`:
  - `generate_embedding(text: str) -> List[float]`
  - `generate_explanation(user_profile, book, context) -> str`
  - Token usage tracking
  - Error handling & retry logic
- [ ] Cost optimization:
  - Embedding cache (Redis)
  - Batch processing
  - Max token limit enforcement
- [ ] LangChain setup için base
- [ ] Unit tests (mock OpenAI responses)

**Çıktı:** OpenAI servis hazır  
**Kullanım:** Book data embedding'leri için

---

#### 🤖 2.2 Google Cloud Vision Integration [4 gün]
**Öncelik:** 🔴 Kritik - Core feature  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] GCP project setup + Vision API enable
- [ ] Service account JSON key
- [ ] `backend/app/services/vision_service.py`:
  - `detect_text_from_image(image_bytes) -> List[str]`
  - 4-direction rotation OCR
  - Object detection (kitap sırtları)
  - Confidence filtering (> 0.7)
  - Text cleaning (regex)
- [ ] Fuzzy matching için helper:
  - `match_book_names(detected: List[str]) -> List[Book]`
  - Levenshtein distance
- [ ] Test suite (örnek kitaplık fotoğrafları)

**Çıktı:** Vision API entegrasyonu çalışıyor  
**Test:** Manuel test için `/api/vision/test` endpoint

---

#### 🤖 2.3 Book Data Pipeline [5 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor (2.1'e bağımlı)

**Görevler:**
- [ ] `data/scripts/download_dataset.py`:
  - Goodreads dataset indir
  - CSV temizleme ve validation
- [ ] `data/scripts/generate_embeddings.py`:
  - Batch embedding generation
  - Progress bar (tqdm)
  - Error handling & resume capability
  - Save to PostgreSQL
- [ ] `data/scripts/index_elasticsearch.py`:
  - Bulk indexing
  - Turkish analyzer setup
- [ ] İlk 10,000 kitap yükle
- [ ] Verification script

**Çıktı:** 10K+ kitap embedding'leriyle DB'de  
**Entegrasyon:** Recommendation engine kullanabilir

---

#### 🤖 2.4 Recommendation Engine [6 gün] ⭐ CORE FEATURE
**Öncelik:** 🔴 Kritik  
**Durum:** ⏳ Bekliyor (2.2 + 2.3'e bağımlı)

**Görevler:**
- [ ] `backend/app/services/recommendation_service.py`:
  - `create_user_profile_vector(user: User) -> List[float]`
  - `recommend_from_photo(user_id, image) -> List[Recommendation]`
  - Cosine similarity query (pgvector)
  - Top-K selection (K=5)
- [ ] RAG pipeline (LangChain):
  - User context retrieval
  - Book metadata injection
  - GPT-4o prompt engineering
- [ ] `backend/app/api/vision.py`:
  - `POST /api/vision/analyze` (multipart/form-data)
  - Background task (Celery alternative: BackgroundTasks)
  - Response format:
    ```json
    {
      "detected_books": ["1984", "..."],
      "recommendations": [
        {
          "book": {...},
          "match_score": 0.92,
          "explanation": "Bu kitabı seçtim çünkü..."
        }
      ]
    }
    ```
- [ ] Redis caching strategy
- [ ] Performance optimization (< 5 saniye hedef)

**Çıktı:** ✅ **Fotoğraftan öneri API hazır**  
**Entegrasyon:** ✅ **Barış Discovery UI'yi bağlayabilir**

---

### PHASE 3: Advanced Features (Hafta 9-12)

#### 🔍 3.1 Search & Discovery API [3 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `backend/app/api/books.py`:
  - `GET /api/books` (pagination, filters)
  - `GET /api/books/{id}`
  - `GET /api/books/search?q=...` (Elasticsearch)
- [ ] Hybrid search (semantic + keyword)
- [ ] Filter by genre, author, price
- [ ] Sort options

**Çıktı:** Kitap CRUD API'leri hazır  
**Entegrasyon:** Barış kitap listeleme sayfası yapabilir

---

#### 💬 3.2 Chatbot & Memory System [5 gün]
**Öncelik:** 🟢 Düşük  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `backend/app/services/chatbot_service.py`
- [ ] LangChain ConversationBufferMemory
- [ ] Redis session storage
- [ ] API endpoints:
  - `POST /api/chat/message`
  - `GET /api/chat/history`

**Çıktı:** Chatbot API hazır

---

#### 👥 3.3 Social Features (Book Buddy) [4 gün]
**Öncelik:** 🟢 Düşük  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] User similarity algorithm
- [ ] `GET /api/social/find-buddies`
- [ ] `GET /api/social/shared-interests/{user_id}`

**Çıktı:** Social API hazır

---

#### ⚡ 3.4 Performance Optimization [3 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] Redis caching stratejisi
- [ ] Database query optimization
- [ ] Connection pooling tuning
- [ ] Rate limiting
- [ ] Sentry integration (error tracking)

**Çıktı:** Production ready backend

---

## 📊 KAAN - İş Yükü Özeti

| Phase | Görev Sayısı | Tahmini Süre | Öncelik |
|-------|-------------|--------------|---------|
| Phase 1 (Altyapı) | 4 task | 14 gün | 🔴 Kritik |
| Phase 2 (AI/ML) | 4 task | 20 gün | 🔴 Kritik |
| Phase 3 (Advanced) | 4 task | 15 gün | 🟡 Orta |
| **TOPLAM** | **12 task** | **49 gün** | - |

---

## 🎨 BARIŞ - Frontend UI/UX Developer (25%)

**Uzmanlık:** React, Next.js, UI/UX Design  
**Teknolojiler:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

### 📊 Sorumluluk Alanları
1. 🎨 Next.js frontend development
2. 🖼️ Component library & design system
3. 📱 Responsive design & PWA
4. 🔄 State management (Zustand, React Query)
5. 🎯 UX optimization ve accessibility

---

## 📋 BARIŞ'IN GÖREVLERİ

### PHASE 1: Foundation (Hafta 1-4)

#### ✅ 1.1 Next.js Project Setup [2 gün]
**Öncelik:** 🔴 Kritik  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] Next.js 14 kurulumu (App Router)
- [ ] TypeScript configuration
- [ ] Tailwind CSS + PostCSS setup
- [ ] ESLint + Prettier
- [ ] Folder structure:
  ```
  src/
  ├── app/           # Pages (App Router)
  ├── components/    # React components
  ├── lib/           # Utilities
  │   ├── api/       # API clients
  │   └── mock/      # Mock data & services
  ├── hooks/         # Custom hooks
  └── types/         # TypeScript types
  ```

**Çıktı:** Next.js projesi çalışıyor (`npm run dev`)

---

#### ✅ 1.2 Design System & Components [5 gün]
**Öncelik:** 🔴 Kritik  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] shadcn/ui setup (`npx shadcn-ui@latest init`)
- [ ] Theme configuration (colors, fonts)
- [ ] Base components:
  - `Button` (variants: primary, secondary, ghost)
  - `Input`, `Textarea`, `Select`
  - `Card`, `Modal`, `Dialog`
  - `Badge`, `Avatar`, `Skeleton`
- [ ] Layout components:
  - `Navbar` (responsive, mobile menu)
  - `Footer`
  - `Sidebar` (admin için)
- [ ] Loading states:
  - `Spinner`, `Progress Bar`
  - Page skeletons
- [ ] Toast notifications (sonner)
- [ ] Dark mode toggle

**Çıktı:** Component library hazır  
**Test:** Storybook benzeri örnek sayfa

---

#### ✅ 1.3 Layout & Navigation [3 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `app/layout.tsx` (root layout)
- [ ] Responsive navbar:
  - Logo
  - Search bar
  - User menu (authenticated)
  - Cart icon (item count)
  - Mobile hamburger menu
- [ ] Footer (links, social media)
- [ ] Protected route HOC
- [ ] 404 page
- [ ] Error boundary

**Çıktı:** Layout hazır, tüm sayfalarda kullanılabilir

---

#### ✅ 1.4 Authentication UI [4 gün]
**Öncelik:** 🟡 Yüksek - Kaan'ın API'sine bağımlı  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/auth/login` page
- [ ] `/auth/register` page
- [ ] Form validation (react-hook-form + zod)
- [ ] `lib/api/mock/auth.ts` (mock API):
  ```typescript
  export const mockLogin = async (email, password) => {
    return { token: "mock-jwt", user: { id: 1, email } };
  };
  ```
- [ ] Zustand store (`stores/authStore.ts`):
  - `user`, `token`
  - `login()`, `logout()`, `register()`
- [ ] Axios client setup (`lib/api/client.ts`):
  - Base URL
  - Auth interceptor (token ekleme)
  - Error interceptor
- [ ] Protected route wrapper

**Çıktı:** Auth UI mock ile çalışıyor  
**Entegrasyon:** ✅ Kaan Auth API hazır olunca `lib/api/auth.ts` oluştur ve mock'u değiştir

---

### PHASE 2: Core Features UI (Hafta 5-8)

#### 🎨 2.1 Photo Upload & Discovery UI [6 gün] ⭐ CORE FEATURE
**Öncelik:** 🔴 Kritik  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/discover` page
- [ ] `components/PhotoUploader.tsx`:
  - Drag & drop zone (react-dropzone)
  - Camera capture button (mobil için)
  - Image preview & crop
  - File validation (type, size)
- [ ] Upload flow:
  - File select → Preview → Upload → Processing
  - Progress bar (0% → 100%)
  - Loading states:
    * "Fotoğraf yükleniyor..."
    * "Kitaplar tanınıyor..."
    * "Öneriler hazırlanıyor..."
- [ ] `lib/api/mock/vision.ts`:
  ```typescript
  export const mockAnalyzePhoto = async (file: File) => {
    await sleep(2000); // Simulate processing
    return {
      detected_books: ["1984", "Brave New World"],
      recommendations: [...]
    };
  };
  ```
- [ ] Error handling (file too large, unsupported type)

**Çıktı:** Discovery UI mock ile çalışıyor  
**Entegrasyon:** ✅ Kaan Vision API hazır olunca bağla

---

#### 🎨 2.2 Recommendation Cards [4 gün]
**Öncelik:** 🔴 Kritik  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `components/RecommendationCard.tsx`:
  - Book cover image
  - Title, author, genre
  - Match score (0.0-1.0 → yıldız/yüzde)
  - Explanation text (collapsible)
  - "Add to cart" button
  - "Learn more" button
- [ ] Match score visualization:
  - Progress ring veya stars
  - Color coding (green: high, yellow: medium)
- [ ] Book details modal:
  - Full description
  - Reviews (opsiyonel)
  - Price, stock info
- [ ] Share button (copy link)
- [ ] Animations (framer-motion)

**Çıktı:** Recommendation kartları hazır

---

#### 🎨 2.3 Book Catalog UI [5 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/books` page:
  - Grid view (responsive: 1-2-3-4 columns)
  - List view (opsiyonel)
- [ ] `/books/[id]` page:
  - Book details
  - Add to cart
  - Related books
- [ ] `components/BookCard.tsx`:
  - Cover, title, author, price
  - Stock status
  - Quick add to cart
- [ ] Filter sidebar:
  - Genre (multi-select)
  - Price range (slider)
  - Author (autocomplete)
- [ ] Sort dropdown (price, popularity, newest)
- [ ] Pagination component
- [ ] Search bar with autocomplete
- [ ] Mock data (50 kitap)

**Çıktı:** Kitap listeleme ve detay sayfaları hazır

---

### PHASE 3: Advanced UI & Polish (Hafta 9-12)

#### 🎨 3.1 User Profile & Preferences [4 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/profile` page:
  - User info edit
  - Preference settings (favorite genres, authors)
  - Reading history
  - Photo scan history
  - Favorite books
- [ ] React Query integration (cache)

**Çıktı:** Profile sayfası hazır

---

#### 💬 3.2 Chatbot UI [3 gün]
**Öncelik:** 🟢 Düşük  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] Floating chat widget (bottom-right)
- [ ] `components/Chatbot.tsx`:
  - Message bubbles (user/bot)
  - Typing indicator
  - Quick reply buttons
  - Chat history scroll
- [ ] Mock chatbot responses

**Çıktı:** Chatbot UI hazır

---

#### 👥 3.3 Social Features UI [3 gün]
**Öncelik:** 🟢 Düşük  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/book-buddies` page
- [ ] User match cards
- [ ] Shared interests display
- [ ] Connect button

**Çıktı:** Social UI hazır

---

#### 📱 3.4 Mobile Optimization & PWA [4 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] Mobile-first responsive review
- [ ] Touch gestures (swipe, pinch)
- [ ] PWA manifest.json
- [ ] Service worker (offline fallback)
- [ ] Image optimization (next/image)
- [ ] Lazy loading
- [ ] Performance audit (Lighthouse)

**Çıktı:** Mobile-optimized, PWA ready

---

## 📊 BARIŞ - İş Yükü Özeti

| Phase | Görev Sayısı | Tahmini Süre | Öncelik |
|-------|-------------|--------------|---------|
| Phase 1 (Foundation) | 4 task | 14 gün | 🔴 Kritik |
| Phase 2 (Core UI) | 3 task | 15 gün | 🔴 Kritik |
| Phase 3 (Advanced) | 4 task | 14 gün | 🟡 Orta |
| **TOPLAM** | **11 task** | **43 gün** | - |

**Bağımsızlık Stratejisi:**
- İlk 2 hafta: Tamamen bağımsız (mock data)
- 3-4. hafta: Auth API entegrasyonu
- 5-8. hafta: Vision API entegrasyonu (mock→real)

---

## 🛒 ÖNDER - E-ticaret & Data Manager (25%)

**Uzmanlık:** Backend Development, Admin Tools, Data Management  
**Teknolojiler:** FastAPI, PostgreSQL, React (Admin UI)

### 📊 Sorumluluk Alanları
1. 🛍️ E-ticaret backend (cart, orders, payment)
2. 💳 Ödeme entegrasyonu (İyzico)
3. 👤 Admin panel (backend + frontend)
4. 📦 Sipariş yönetimi
5. 📊 Data import/export tools

---

## 📋 ÖNDER'İN GÖREVLERİ

### PHASE 1: E-ticaret Backend (Hafta 1-4)

#### ✅ 1.1 Cart API [4 gün]
**Öncelik:** 🟡 Yüksek - Barış'a bağımlı değil  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `backend/app/models/cart.py`:
  - `Cart` model (user_id, created_at, updated_at)
  - `CartItem` model (cart_id, book_id, quantity)
- [ ] `backend/app/api/cart.py`:
  - `POST /api/cart/add` (book_id, quantity)
  - `GET /api/cart` (user'ın sepeti)
  - `PUT /api/cart/item/{id}` (quantity update)
  - `DELETE /api/cart/item/{id}` (remove item)
  - `POST /api/cart/clear` (empty cart)
- [ ] Redis session management (optional)
- [ ] Total price calculation
- [ ] Stock validation
- [ ] Unit tests

**Çıktı:** Cart API hazır  
**Entegrasyon:** ✅ Barış cart UI yapabilir

**API Contract:**
```json
POST /api/cart/add
Request: { "book_id": "...", "quantity": 1 }
Response: { "cart": {...}, "total_items": 3, "total_price": 150.50 }
```

---

#### ✅ 1.2 Order Management API [5 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `backend/app/models/order.py`:
  - `Order` model (user_id, total_price, status, shipping_address)
  - `OrderItem` model (order_id, book_id, quantity, price)
  - Order status enum: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
- [ ] `backend/app/api/orders.py`:
  - `POST /api/orders/create` (cart → order)
  - `GET /api/orders` (user'ın siparişleri)
  - `GET /api/orders/{id}` (order detail)
  - `PUT /api/orders/{id}/status` (admin için)
- [ ] Order workflow:
  1. Cart → Order (sepeti dondur)
  2. Payment → Status update
  3. Shipping → Email notification
- [ ] Email service (basic SMTP):
  - Order confirmation
  - Shipping notification
- [ ] Unit tests

**Çıktı:** Order API hazır

---

#### ✅ 1.3 Payment Integration [5 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] İyzico API research
- [ ] `backend/app/services/payment_service.py`:
  - `initialize_payment(order_id) -> payment_url`
  - `verify_payment(callback_data) -> success`
  - Sandbox/test mode
- [ ] `backend/app/api/payment.py`:
  - `POST /api/payment/initialize` → payment iframe URL
  - `POST /api/payment/callback` (İyzico webhook)
  - `GET /api/payment/status/{order_id}`
- [ ] Order status update after payment
- [ ] Transaction logging
- [ ] Test payment flow

**Çıktı:** Payment integration hazır (test mode)

---

### PHASE 2: E-ticaret Frontend (Hafta 5-8)

#### 🛒 2.1 Shopping Cart UI [4 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor (1.1'e bağımlı)

**Görevler:**
- [ ] `/cart` page
- [ ] `components/CartItem.tsx`:
  - Book info (cover, title, author)
  - Price (unit + total)
  - Quantity selector (+/-)
  - Remove button
- [ ] Cart summary:
  - Subtotal
  - Shipping (sabit veya hesaplanan)
  - Total
- [ ] "Proceed to checkout" button
- [ ] Empty cart state
- [ ] React Query integration

**Çıktı:** Cart UI hazır  
**Entegrasyon:** Backend API'ye bağlı

---

#### 🛒 2.2 Checkout Flow [5 gün]
**Öncelik:** 🟡 Yüksek  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/checkout` page (multi-step)
- [ ] Step 1: Shipping address form
  - Address, city, postal code, phone
  - Save address option
- [ ] Step 2: Payment method
  - İyzico payment iframe
  - Credit card info (iframe içinde)
- [ ] Step 3: Order summary
  - Review items, shipping, total
  - Place order button
- [ ] `/checkout/success` page
- [ ] `/checkout/error` page
- [ ] Form validation (zod)
- [ ] Loading states

**Çıktı:** Checkout flow hazır

---

#### 📦 2.3 Order History UI [3 gün]
**Öncelik:** 🟢 Düşük  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/orders` page (order list)
- [ ] `components/OrderCard.tsx`:
  - Order ID, date, total
  - Status badge (color-coded)
  - "View details" button
- [ ] Order detail modal:
  - Items list
  - Shipping info
  - Status timeline
  - Invoice download (opsiyonel)
- [ ] Filter by status

**Çıktı:** Order history UI hazır

---

### PHASE 3: Admin Panel & Tools (Hafta 9-12)

#### 👤 3.1 Admin Panel Backend [5 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] Role-based access control (RBAC):
  - User roles: USER, ADMIN
  - Admin middleware
- [ ] `backend/app/api/admin.py`:
  - `GET /api/admin/books` (list, paginated)
  - `POST /api/admin/books` (create)
  - `PUT /api/admin/books/{id}` (update)
  - `DELETE /api/admin/books/{id}`
  - `GET /api/admin/orders` (all orders)
  - `PUT /api/admin/orders/{id}/status`
  - `GET /api/admin/users` (list)
  - `GET /api/admin/stats` (dashboard data)
- [ ] Bulk operations:
  - Bulk book update
  - Bulk order status change
- [ ] Admin audit log (optional)

**Çıktı:** Admin backend API hazır

---

#### 👤 3.2 Admin Panel Frontend [6 gün]
**Öncelik:** 🟡 Orta  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/admin` layout (sidebar navigation)
- [ ] `/admin/dashboard`:
  - Stats cards (total users, orders, revenue)
  - Recent orders
  - Simple charts (recharts)
- [ ] `/admin/books`:
  - Books table (DataTable)
  - CRUD operations
  - Search & filter
  - Bulk actions
- [ ] `/admin/orders`:
  - Orders table
  - Status update dropdown
  - Filter by status, date
- [ ] `/admin/users`:
  - Users table
  - User details modal
- [ ] Protected admin routes

**Çıktı:** Admin panel UI hazır

---

#### 📊 3.3 Data Import Tools [4 gün]
**Öncelik:** 🟢 Düşük  
**Durum:** ⏳ Bekliyor

**Görevler:**
- [ ] `/admin/import` page
- [ ] CSV upload component:
  - Drag & drop CSV
  - File validation
  - Column mapping UI
- [ ] `backend/app/api/admin.py`:
  - `POST /api/admin/import/books` (CSV upload)
  - CSV parser & validator
  - Progress tracking (WebSocket veya polling)
  - Error reporting
- [ ] Bulk book add/update
- [ ] Export functionality:
  - `GET /api/admin/export/books` → CSV download
  - `GET /api/admin/export/orders` → CSV download

**Çıktı:** Import/export tools hazır

---

## 📊 ÖNDER - İş Yükü Özeti

| Phase | Görev Sayısı | Tahmini Süre | Öncelik |
|-------|-------------|--------------|---------|
| Phase 1 (Backend) | 3 task | 14 gün | 🟡 Yüksek |
| Phase 2 (Frontend) | 3 task | 12 gün | 🟡 Yüksek |
| Phase 3 (Admin) | 3 task | 15 gün | 🟡 Orta |
| **TOPLAM** | **9 task** | **41 gün** | - |

**Bağımsızlık Stratejisi:**
- İlk 4 hafta: Tamamen bağımsız (kendi API'leri)
- 5-8. hafta: Frontend geliştirme (kendi API'lerine bağlı)
- 9-12. hafta: Admin panel (bağımsız)

---

## 🔄 Entegrasyon Noktaları

### Hafta 2 Sonu: Auth Integration
**Kim → Kime:** Barış → Kaan
- Kaan Auth API tamamlandı ✅
- Barış mock'u gerçek API'ye çevirir
- Test: Login/Register flow

---

### Hafta 4 Sonu: Cart Integration
**Kim → Kime:** Barış → Önder
- Önder Cart API tamamlandı ✅
- Barış Cart UI'yi bağlar
- Test: Add to cart, update quantity

---

### Hafta 6 Sonu: Vision Integration ⭐ MAJOR
**Kim → Kime:** Barış → Kaan
- Kaan Vision + Recommendation API tamamlandı ✅
- Barış Discovery UI'yi bağlar
- Test: Fotoğraf yükle → Öneriler geldi

---

### Hafta 8 Sonu: Checkout Integration
**Kim → Kime:** Barış → Önder
- Önder Payment API tamamlandı ✅
- Barış Checkout flow'u bağlar
- Test: End-to-end purchase

---

## 📅 Haftalık Sprint Özeti

| Hafta | Kaan | Barış | Önder |
|-------|------|-------|-------|
| 1-2 | Docker + DB + Auth API | Next.js + Design System | Cart API |
| 3-4 | Books API + Search | Auth UI + Books UI | Order API |
| 5-6 | OpenAI + Vision API ⭐ | Discovery UI (mock) | Payment Integration |
| 7-8 | Recommendation Engine | Discovery Integration | Cart/Checkout UI |
| 9-10 | Chatbot + Social | Chatbot/Social UI | Admin Backend |
| 11-12 | Performance Tuning | Mobile + PWA | Admin Frontend |

---

## 🎯 Her Ekip Üyesi İçin İlk Adımlar

### Kaan - İlk Gün
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Docker Compose oluştur
# Database migration setup
# FastAPI test çalıştır
```

### Barış - İlk Gün
```bash
cd frontend
npm install
npm run dev

# shadcn/ui setup
# Mock API klasörü oluştur: lib/api/mock/
# İlk component: Button
```

### Önder - İlk Gün
```bash
cd backend
# Kaan'ın ortamını kullan (aynı backend)
# Cart models oluştur
# Cart API endpoints başlat
```

---

**Son Güncelleme:** 13 Ocak 2026  
**Güncelleyen:** AI Assistant

**Not:** Her görev tamamlandığında bu dosyayı güncelleyin! ✅
