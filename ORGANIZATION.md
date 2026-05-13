# 📁 Proje Organizasyon Yapısı

Bu dosya, BiblioMind projesinin organize edilmiş klasör yapısını açıklar.

**Son Güncelleme:** 22 Ocak 2026

---

## 🎯 Yeni Organizasyon Yapısı

### Backend Scripts (`backend/scripts/`)

Scriptler kategorilere ayrılmıştır:

```
scripts/
├── dev/              # Geliştirme scriptleri
│   ├── test_*.py     # Test scriptleri
│   └── benchmark_*.py # Benchmark scriptleri
├── db/               # Veritabanı scriptleri
│   ├── seed_books.py
│   ├── seed_interactions.py
│   └── create_admin.py
├── utils/            # Yardımcı scriptler
│   ├── start_server.sh
│   └── start_server.ps1
└── dangerous/        # ⚠️ Tehlikeli scriptler
    └── clear_books.py
```

**Kullanım:**
```bash
# Server başlatma
./scripts/utils/start_server.sh

# Seed data
python scripts/db/seed_books.py

# Test
python scripts/dev/test_vision_service.py
```

### Test Yapısı (`backend/tests/`)

```
tests/
├── results/          # Test sonuçları (JSON)
│   └── README.md
├── fixtures/        # Test verileri
│   └── test_images/
├── services/        # Servis testleri
└── *.py            # Integration testleri
```

### Dokümantasyon Yapısı

#### Proje Dokümantasyonu (`docs/`)

```
docs/
├── 01-QUICK-START.md
├── 02-ENVIRONMENT-SETUP.md
├── 03-TEAM-ROLES.md
├── 04-API-CONTRACT.md
├── 05-INTEGRATION-GUIDE.md
├── 06-PROJECT-STATUS.md
├── 07-FINAL-PRODUCT-VISION.md
├── README.md
├── archive/         # Arşivlenmiş raporlar
│   ├── reports/     # Eski görev raporları
└── scripts/         # Setup scriptleri
```

#### Backend Teknik Dokümantasyon (`backend/docs/`)

```
backend/docs/
├── QUICKSTART.md
├── SERVER_COMMANDS.md
├── OPENAI-SERVICE.md
├── VISION-SERVICE.md
├── RECOMMENDATION-ENGINE.md
├── CHATBOT-SERVICE.md
├── RAG-PIPELINE.md
├── GCP-VISION-SETUP.md
├── SHELF-MATCHING.md
└── README.md
```

---

## 📊 Değişiklik Özeti

### Taşınan Dosyalar

1. **Scripts:**
   - `test_*.py` → `scripts/dev/`
   - `benchmark_*.py` → `scripts/dev/`
   - `seed_*.py` → `scripts/db/`
   - `create_admin.py` → `scripts/db/`
   - `start_server.*` → `scripts/utils/`
   - `clear_books.py` → `scripts/dangerous/`

2. **Test Results:**
   - `test_results/*.json` → `tests/results/`
   - `test_results/README.md` → `tests/results/README.md`

3. **Arşiv:**
   - `docs/reports/*.md` → `docs/archive/reports/`
   - `backend/docs/PHASE-*.md` → `docs/archive/phases/`

### Silinen Klasörler

- `backend/test_results/` (boş klasör silindi)

### Oluşturulan README Dosyaları

- `backend/scripts/README.md` - Script kategorileri açıklaması
- `docs/archive/README.md` - Arşiv açıklaması
- `docs/README.md` - Güncellenmiş dokümantasyon indeksi
- `backend/docs/README.md` - Backend teknik dokümantasyon indeksi

---

## 🔄 Güncellenen Referanslar

Aşağıdaki dosyalardaki script path'leri güncellendi:

- `backend/README.md`
- `README.md` (proje kök dizini)

---

## ✅ Avantajlar

1. **Daha Organize:** Scriptler kategorilere ayrıldı
2. **Daha Temiz:** Eski raporlar arşivlendi
3. **Daha Anlaşılır:** Her klasörün amacı net
4. **Daha Güvenli:** Tehlikeli scriptler ayrı klasörde
5. **Daha Kolay:** README dosyaları ile hızlı erişim

---

## 📝 Notlar

- Tüm scriptler `backend/` klasöründen çalıştırılmalıdır
- Test sonuçları artık `tests/results/` klasöründe
- Eski raporlar `docs/archive/` klasöründe saklanıyor
- Güncel durum için `now-we-are-here.md` dosyasına bakın
