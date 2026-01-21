# 📚 BiblioMind - Dokümantasyon

**Proje:** AI Destekli Fotoğraftan Kitap Tanıma ve Öneri Platformu  
**Son Güncelleme:** 21 Ocak 2026 (Phase 2.3 Tamamlandı)

---

## 📖 Dokümantasyon İndeksi

### 🚀 Başlangıç Rehberleri

#### [01. Hızlı Başlangıç](./01-QUICK-START.md)
İlk kurulum ve her ekip üyesi için adım adım rehber
- **Kim için:** Kaan, Barış, Önder (tüm ekip)
- **Ne zaman:** Projeye ilk başladığında
- **İçerik:** Docker, Backend, Frontend kurulum adımları

#### [02. Environment Setup](./02-ENVIRONMENT-SETUP.md)
Environment variables ve API key'leri kurulum rehberi
- **Kim için:** Tüm ekip
- **Ne zaman:** İlk kurulumda `.env` dosyaları oluştururken
- **İçerik:** API key'ler, güvenlik, production notları

---

### 👥 Ekip ve Görevler

#### [03. Ekip Görev Dağılımı](./03-TEAM-ROLES.md)
Kişi bazında detaylı görev listesi ve sorumluluklar
- **Kim için:** Kaan (AI-Backend), Barış (Frontend), Önder (E-ticaret)
- **Ne zaman:** Her sprint başında
- **İçerik:** 
  - Kaan: AI/ML, Backend API, Vektör sistemleri
  - Barış: UI/UX, Component library, Responsive design
  - Önder: E-ticaret, Admin panel, Data management

---

### 🔧 Teknik Dökümanlar

#### [04. API Contract](./04-API-CONTRACT.md)
Tüm API endpoint'leri, request/response formatları, mock data
- **Kim için:** Tüm ekip (özellikle Frontend-Backend entegrasyonu)
- **Ne zaman:** API geliştirirken veya entegre ederken
- **İçerik:**
  - 40+ endpoint tanımı
  - Request/Response örnekleri
  - Error kodları
  - Mock data şablonları

#### [05. Integration Guide](./05-INTEGRATION-GUIDE.md)
Mock API'den gerçek API'ye entegrasyon adımları
- **Kim için:** Barış (Frontend) ve Önder (E-ticaret UI)
- **Ne zaman:** Her entegrasyon gününde (Çarşamba)
- **İçerik:**
  - 4 ana entegrasyon noktası
  - Mock → Real API geçiş adımları
  - Test senaryoları
  - Yaygın sorunlar ve çözümler

---

### 📊 Proje Yönetimi

#### [06. Proje Durumu](./06-PROJECT-STATUS.md)
Güncel proje durumu, yapılacaklar, sprint hedefleri
- **Kim için:** Tüm ekip
- **Ne zaman:** Her gün sonu, sprint başı/sonu
- **İçerik:**
  - Tamamlanan görevler
  - Devam eden görevler
  - Sprint hedefleri
  - Blocker'lar ve riskler

#### [00. Proje Genel Bakış](./00-PROJECT-OVERVIEW.md)
Detaylı proje tanıtımı, sistem mimarisi, teknik analiz
- **Kim için:** Tüm ekip, proje paydaşları
- **Ne zaman:** Projeye başlarken veya genel bakış için
- **İçerik:**
  - Proje vizyonu ve hedefleri
  - Sistem mimarisi (Mermaid diyagramlar)
  - Veri akış şemaları
  - 12 haftalık detaylı roadmap
  - Teknoloji kararları

---

## 📄 Görev Raporları

### [reports/](./reports/)
Tamamlanan görevlerin detaylı raporları

#### Phase 1 - Infrastructure ✅
- [Görev 1: Docker & Database Setup](./reports/TASK-01-DOCKER-SETUP.md) - 13 Ocak 2026
- [Görev 2: Database Schema](./reports/TASK-02-DATABASE-SETUP.md) - 13 Ocak 2026
- [Görev 3: FastAPI Core](./reports/TASK-03-FASTAPI-CORE.md) - 13 Ocak 2026
- [Görev 4: Authentication API](./reports/TASK-04-AUTHENTICATION.md) - 13 Ocak 2026
- [Görev 5: Books API](./reports/TASK-05-BOOKS-API.md) - 13 Ocak 2026
- [Görev 6: Elasticsearch Integration](./reports/TASK-06-ELASTICSEARCH.md) - 13 Ocak 2026
- [Görev 7-8: User & Admin APIs](./reports/TASK-07-08-USER-ADMIN-APIS.md) - 13 Ocak 2026

#### Phase 2 - AI Integration ✅ (3/4 tamamlandı)
- [Phase 2.1: OpenAI Services](./reports/PHASE-2.1-OPENAI-SERVICES.md) - 20 Ocak 2026
- [Phase 2.2: Vision API + Bookshelf](./reports/PHASE-2.2-COMPLETED.md) - 21 Ocak 2026
- [Phase 2.3: Recommendation Engine](./reports/PHASE-2.3-COMPLETED.md) - 21 Ocak 2026 ✅

---

## 🛠️ Scripts

### [scripts/](./scripts/)
Kurulum ve yardımcı script'ler

#### [setup_env.ps1](./scripts/setup_env.ps1)
Windows için otomatik kurulum scripti
- Environment dosyası oluşturma
- SECRET_KEY generate
- Docker servisleri başlatma
- Health check'ler

---

## 📋 Döküman Kullanım Rehberi

### İlk Gün (Projeye Başlarken)
1. **[01. Hızlı Başlangıç](./01-QUICK-START.md)** - Kurulum yap
2. **[02. Environment Setup](./02-ENVIRONMENT-SETUP.md)** - API key'leri al
3. **[03. Ekip Görev Dağılımı](./03-TEAM-ROLES.md)** - Kendi görevlerini öğren

### Her Sprint Başında (Pazartesi)
1. **[06. Proje Durumu](./06-PROJECT-STATUS.md)** - Bu hafta ne yapılacak?
2. **[03. Ekip Görev Dağılımı](./03-TEAM-ROLES.md)** - Kendi görevlerine bak
3. **[04. API Contract](./04-API-CONTRACT.md)** - Hangi API'ler hazır?

### Entegrasyon Günü (Çarşamba)
1. **[05. Integration Guide](./05-INTEGRATION-GUIDE.md)** - Adım adım takip et
2. **[04. API Contract](./04-API-CONTRACT.md)** - Endpoint'leri kontrol et
3. Test et ve güncelle!

### Her Gün Sonu
1. **[06. Proje Durumu](./06-PROJECT-STATUS.md)** - Tamamlanan görevleri işaretle
2. Blocker varsa ekle

---

## 🔍 Hızlı Arama

### Sorun: "Docker nasıl kurarım?"
→ [01. Hızlı Başlangıç](./01-QUICK-START.md) → Kaan - İlk Adımlar

### Sorun: "API key'leri nereden alırım?"
→ [02. Environment Setup](./02-ENVIRONMENT-SETUP.md) → API Keys Nasıl Alınır?

### Sorun: "Görevlerim neler?"
→ [03. Ekip Görev Dağılımı](./03-TEAM-ROLES.md) → Kendi adına git

### Sorun: "Login API'si nasıl çalışır?"
→ [04. API Contract](./04-API-CONTRACT.md) → Auth Endpoints

### Sorun: "Mock API'yi nasıl gerçeğe çeviririm?"
→ [05. Integration Guide](./05-INTEGRATION-GUIDE.md) → Entegrasyon 1: Auth System

### Sorun: "Proje ne durumda?"
→ [06. Proje Durumu](./06-PROJECT-STATUS.md)

---

## 📌 Önemli Linkler

- **Ana README:** [../README.md](../README.md)
- **Docker Compose:** [../docker-compose.yml](../docker-compose.yml)
- **Backend Kodu:** [../backend/](../backend/)
- **Frontend Kodu:** [../frontend/](../frontend/)

---

## 🔄 Güncelleme Kuralları

### Kim Ne Zaman Günceller?

| Dosya | Kim Günceller | Ne Zaman |
|-------|---------------|----------|
| 06-PROJECT-STATUS.md | Herkes | Her gün sonu, görev tamamlandığında |
| 03-TEAM-ROLES.md | Kaan (Lead) | Görev dağılımı değiştiğinde |
| 04-API-CONTRACT.md | Kaan/Önder | API değişikliği olduğunda |
| 05-INTEGRATION-GUIDE.md | Tüm ekip | Entegrasyon sonrası notlar için |
| reports/TASK-XX.md | Görev sahibi | Görev tamamlandığında |

---

## 💡 İpuçları

1. **Markdown Preview:** VS Code'da `Ctrl+Shift+V` ile önizle
2. **Linkler:** Dökümanlar arası linklerle hızlıca gezin
3. **Arama:** `Ctrl+F` ile dosya içinde ara
4. **TODO'lar:** `[ ]` ve `[x]` ile işaretle
5. **Emoji:** Görsellik için kullan, ama abartma

---

**Son Güncelleme:** 21 Ocak 2026  
**Güncelleyen:** AI Assistant  
**Son Eklenen:** Phase 2.3 Recommendation Engine Tamamlandı

**Not:** Bu klasör sürekli güncellenir. Her zaman en son haline bak!
