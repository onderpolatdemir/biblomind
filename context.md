# BiblioMind - Proje Durumu ve Yapılacaklar

**Proje:** AI Destekli Fotoğraftan Kitap Tanıma ve Öneri Platformu  
**Ekip:** Kaan (AI-Backend), Barış (Frontend), Önder (E-ticaret)  
**Başlangıç:** 13 Ocak 2026  
**Durum:** Planlama Tamamlandı ✅

---

## 🎯 Proje Vizyonu

BiblioMind, fiziksel kitaplıkları dijital keşif alanına dönüştüren AI platformu. Kullanıcı bir kitaplığın fotoğrafını çeker, yapay zeka o kitaplar arasından kullanıcıya en uygun olanları bulur ve **NEDEN** bu kitapları önerdiğini açıklar.

### Temel Özellikler
1. 📸 **Fotoğraftan Kitap Tanıma** (Google Cloud Vision)
2. 🤖 **Anlamsal Öneri Motoru** (OpenAI Embeddings + pgvector)
3. 💬 **Empatik Açıklamalar** (GPT-4o ile RAG)
4. 👥 **Sosyal Eşleştirme** (Book Buddy - benzer okuyucuları bul)
5. 🛒 **E-ticaret** (Sepet, Sipariş, Ödeme)

---

## 📊 Genel İlerleme

- [x] **Planlama:** Proje analizi ve görev dağılımı ✅ (13 Ocak)
- [ ] **Faz 1:** Altyapı (Hafta 1-4) - %0
- [ ] **Faz 2:** AI Entegrasyonu (Hafta 5-8) - %0
- [ ] **Faz 3:** E-ticaret & Polish (Hafta 9-12) - %0

---

## ✅ Tamamlanan Görevler

### Sprint 0: Planlama (13 Ocak 2026)
- [x] Proje dokümantasyonu hazırlandı
- [x] Ekip görev dağılımı yapıldı (`team-roles.md`)
- [x] Context tracking dosyası oluşturuldu
- [x] API contract belirlendi (`API-CONTRACT.md`)
- [x] Integration guide hazırlandı (`INTEGRATION.md`)
- [x] Teknoloji stack belirlendi
- [x] 12 haftalık roadmap çıkarıldı

---

## 🔄 Devam Eden Görevler

### Sprint 1: Hafta 1-2 (13-26 Ocak 2026)

#### 🔴 KAAN - Altyapı Kurulumu
- [ ] Docker Compose setup (PostgreSQL, Redis, Elasticsearch)
- [ ] Database schema & migration (Alembic)
- [ ] FastAPI core setup
- [ ] JWT authentication API

**Çıktı:** Auth API hazır → Barış entegre edebilir

#### 🔵 BARIŞ - Frontend Foundation
- [ ] Next.js + Tailwind setup
- [ ] Design system (shadcn/ui)
- [ ] Layout & navigation components
- [ ] Auth UI (mock API ile başla)

**Çıktı:** UI components hazır → Kaan API hazır olunca entegre et

#### 🟢 ÖNDER - E-ticaret Backend
- [ ] Cart API endpoints
- [ ] Order management models
- [ ] Payment service skeleton

**Çıktı:** E-ticaret API'leri hazır → Barış UI ekleyebilir

---

## 📋 Öncelikli Yapılacaklar (Bu Hafta)

### Kritik Path (Blocker) 🚨
1. **Kaan:** Docker ortamını ayağa kaldır (PostgreSQL + pgvector)
2. **Kaan:** Database migration'ları çalıştır
3. **Kaan:** Auth API'yi tamamla ve test et

### Paralel İşler
4. **Barış:** Next.js projesini başlat + Design system kur
5. **Barış:** Mock API service'leri oluştur (`lib/api/mock/`)
6. **Önder:** Cart/Order modellerini tasarla ve implement et

---

## 🗓️ Sprint Hedefleri

### Sprint 1 (Hafta 1-2): Temel Altyapı
**Hedef:** Temel altyapı ayağa kalkmalı, herkes kendi ortamında çalışabilmeli

**Deliverables:**
- ✅ Docker ortamı çalışır durumda
- ✅ Auth API + UI entegrasyonu tamamlandı
- ✅ Frontend skeleton hazır
- ✅ Cart API hazır

**Entegrasyon Noktası:** Kaan'ın Auth API'si hazır olunca Barış mock'tan gerçek API'ye geçecek

---

### Sprint 2 (Hafta 3-4): CRUD & Search
**Hedef:** Kitap CRUD + Search çalışmalı

**Deliverables:**
- ✅ Kitap listeleme API & UI
- ✅ Basic search functionality (Elasticsearch)
- ✅ Cart UI + Backend entegrasyonu

**Entegrasyon Noktası:** Önder'in Cart API'si hazır olunca Barış UI'yi bağlayacak

---

### Sprint 3 (Hafta 5-6): CORE FEATURE ⭐
**Hedef:** Fotoğraftan öneri özelliği çalışmalı

**Deliverables:**
- ✅ Vision API entegrasyonu (Kaan)
- ✅ Recommendation engine (Kaan)
- ✅ Discovery page UI (Barış)
- ✅ Mock → Real API entegrasyonu

**Entegrasyon Noktası:** 
1. Kaan Vision API'yi tamamlıyor → Barış mock'u gerçeğe çeviriyor
2. Kaan recommendation engine'i bitiriyor → Frontend tam çalışır hale geliyor

---

### Sprint 4 (Hafta 7-8): AI Polish
**Hedef:** AI özellikleri stabil ve hızlı

**Deliverables:**
- ✅ Chatbot backend + UI
- ✅ Book data embeddings (10,000+ kitap)
- ✅ Checkout flow (Önder + Barış)

---

### Sprint 5 (Hafta 9-10): E-ticaret Tamamlama
**Hedef:** Ödeme ve sipariş yönetimi çalışmalı

**Deliverables:**
- ✅ Payment integration (İyzico)
- ✅ Order management UI
- ✅ Admin panel backend (Önder)

---

### Sprint 6 (Hafta 11-12): Polish & Deploy
**Hedef:** Production ready

**Deliverables:**
- ✅ Admin panel UI (Önder)
- ✅ Mobile optimization (Barış)
- ✅ Performance tuning (Kaan)
- ✅ Deployment

---

## 🚧 Bilinen Sorunlar ve Riskler

### Teknik Riskler
- ⚠️ **OCR Dikey Yazı Sorunu:** 4 yönde döndürme + fuzzy matching ile çözülecek
- ⚠️ **Vision API Maliyet:** İlk 1000 istek/ay ücretsiz, sonrası cache
- ⚠️ **Embedding Maliyeti:** Batch processing ile optimize edilecek
- ⚠️ **pgvector Index Performansı:** 10K+ kitap olunca test edilmeli

### Ekip Riski
- ⚠️ **API Bağımlılığı:** Barış ve Önder, Kaan'ın API'lerine bağımlı
- ✅ **Çözüm:** Mock-first approach, haftalık API contract meeting

### Çözüm Stratejisi
- Her Sprint başında **API Contract Meeting** (Pazartesi 10:00)
- Kaan, tamamlanacak endpoint'leri bildirir
- Barış/Önder mock'larla paralel çalışır
- Entegrasyon günleri: Sprint ortası (Çarşamba)

---

## 📝 Teknik Kararlar

### AI/ML Stack
- **Embedding Model:** OpenAI text-embedding-3-large (1536 dim)
- **LLM:** GPT-4o (açıklama üretimi, max 500 token)
- **Vision:** Google Cloud Vision API
- **RAG Framework:** LangChain

### Database
- **Primary DB:** PostgreSQL 16 + pgvector extension
- **Search:** Elasticsearch 8.11+
- **Cache:** Redis 7

### Authentication
- **Method:** JWT (cookie-based)
- **Hashing:** bcrypt
- **Token TTL:** Access 1h, Refresh 7d
- **Storage:** HttpOnly cookies

### Frontend State Management
- **Global State:** Zustand
- **Server State:** React Query (TanStack Query)
- **Form State:** React Hook Form + Zod

---

## 📚 Önemli Dökümanlar

### Proje Yönetimi
- `context.md` ← BU DOSYA (güncel durum ve yapılacaklar)
- `team-roles.md` - Ekip görev dağılımı (kişi bazlı detaylı)
- `INTEGRATION.md` - Entegrasyon rehberi (mock→real geçişi)
- `API-CONTRACT.md` - API sözleşmesi ve mock responses

### Teknik Dökümanlar
- `README.md` - Proje özeti ve kurulum
- `bibliomin_plan.md` - Orijinal teknik analiz
- `.env.example` - Environment variables şablonu
- `docker-compose.yml` - Servis tanımları

---

## 🎯 Milestone Hedefleri

### Milestone 1: MVP Backend (Hafta 4)
**Tarih:** 9 Şubat 2026  
**Hedef:** Auth + CRUD + Search çalışıyor

**Kabul Kriterleri:**
- [ ] Docker ortamı ayağa kalkıyor
- [ ] Kullanıcı kayıt/giriş yapabiliyor
- [ ] Kitap listeleme ve arama çalışıyor
- [ ] API documentation güncel (Swagger)

---

### Milestone 2: AI Core (Hafta 8) ⭐
**Tarih:** 9 Mart 2026  
**Hedef:** Fotoğraftan öneri çalışıyor

**Kabul Kriterleri:**
- [ ] Fotoğraf yüklenebiliyor
- [ ] OCR en az %70 doğrulukla kitap ismi çıkarıyor
- [ ] Recommendation engine öneriler üretiyor
- [ ] Açıklamalar anlamlı ve kişiselleştirilmiş
- [ ] End-to-end test başarılı

---

### Milestone 3: Production Ready (Hafta 12)
**Tarih:** 6 Nisan 2026  
**Hedef:** Tüm özellikler tamamlandı, deploy edilebilir

**Kabul Kriterleri:**
- [ ] E-ticaret akışı çalışıyor (sepet→ödeme→sipariş)
- [ ] Admin panel hazır
- [ ] Mobile responsive
- [ ] Performance metrikleri hedeflerde
- [ ] Production environment'a deploy edildi

---

## 🔍 Metrikler ve KPI'lar

### Teknik Metrikler (Hedefler)
- ✅ API Response Time: < 3 saniye (recommendation endpoint)
- ✅ OCR Accuracy: > %70
- ✅ Frontend Lighthouse Score: > 90
- ✅ Test Coverage: > %70 (backend)

### İş Metrikleri (Launch Sonrası)
- 📊 Recommendation Click Rate: > %30
- 📊 Cart Conversion: > %10
- 📊 User Retention (7 gün): > %40
- 📊 Average Session Time: > 5 dakika

---

## 💬 İletişim ve Sync

### Haftalık Ritüel
- **Pazartesi 10:00:** Sprint planning + API contract meeting
- **Çarşamba 15:00:** Mid-week sync + blocker check + integration
- **Cuma 17:00:** Demo + retrospektif

### Acil Durum
- Slack: `#bibliomind-dev`
- Blocker varsa hemen bildir, bekletme!
- API değişikliği yapılacaksa mutlaka duyur

### Entegrasyon Günleri
Her sprint'in **Çarşamba günü** entegrasyon günüdür:
- Kaan: Hazır endpoint'leri duyurur
- Barış/Önder: Mock'tan gerçek API'ye geçerler
- Birlikte test ederler

---

## 🔄 Dosya Güncelleme Kuralları

### Bu dosyayı kim günceller?
- **Her gün sonu:** Son durumu güncelleyin
- **Task tamamlandığında:** ✅ işaretleyin
- **Blocker olduğunda:** 🚧 ekleyin ve açıklayın
- **Sprint bittiğinde:** Sonraki sprint hedeflerini ekleyin

### Güncelleme Formatı
```markdown
## Sprint X Güncelleme (TARİH)

### Tamamlanan
- [x] Task adı (Kaan)
- [x] Task adı (Barış)

### Blocker
- [ ] Problem açıklaması (Önder) 🚧

### Notlar
- Önemli karar veya bulgu
```

---

## 📌 Hızlı Linkler

- [Görev Dağılımı](./team-roles.md) - Kişi bazında detaylı görevler
- [Entegrasyon Rehberi](./INTEGRATION.md) - Mock→Real geçiş adımları
- [API Sözleşmesi](./API-CONTRACT.md) - Endpoint tanımları ve örnekler
- [Teknik Doküman](./bibliomin_plan.md) - Detaylı sistem tasarımı

---

**Son Güncelleme:** 13 Ocak 2026  
**Bir Sonraki Sprint:** Sprint 1 (13-26 Ocak)  
**Güncelleyen:** AI Assistant

---

## 🚀 Hemen Başla

### Kaan için ilk adımlar:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
# docker-compose.yml oluştur ve çalıştır
```

### Barış için ilk adımlar:
```bash
cd frontend
npm install
npm run dev
# Mock API services oluştur: lib/api/mock/
```

### Önder için ilk adımlar:
```bash
cd backend/app/api
# cart.py ve orders.py dosyalarını oluştur
# API-CONTRACT.md'ye göre endpoint'leri implement et
```
