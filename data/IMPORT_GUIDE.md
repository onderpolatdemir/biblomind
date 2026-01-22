# 📚 Kitap Verisi Import Kılavuzu

## 🎯 Hızlı Başlangıç

500 popüler kitabı kapak resimleriyle birlikte import et!

**Toplam Süre: ~15 dakika**

---

## 📥 ADIM 1: Kaggle'dan Dataset İndir

### 1.1 Kaggle'a Git
```
https://www.kaggle.com/datasets/thedevastator/comprehensive-overview-of-52478-goodreads-best-b
```

### 1.2 İndir
- Giriş yap (yoksa Google ile kayıt ol)
- Sağ üstte **"Download"** butonu
- ZIP dosyası inecek (~30 MB)

### 1.3 Çıkart ve Yerleştir
```powershell
# ZIP'i çıkart → books.csv dosyasını al

# CSV'yi şuraya kopyala:
# C:\Users\kaany\Desktop\bitirme\biblomind\data\books.csv
```

**Hedef Konum:**
```
biblomind/
  └── data/
      ├── books.csv         ← Buraya koy!
      ├── IMPORT_GUIDE.md
      └── scripts/
          ├── import_books_from_kaggle.py
          ├── generate_book_embeddings.py
          ├── index_books_to_es.py
          └── README.md
```

---

## 🚀 ADIM 2: Import Script'ini Çalıştır

### 2.1 Klasöre Git
```powershell
cd C:\Users\kaany\Desktop\bitirme\biblomind\data
```

### 2.2 Script'i Çalıştır

**HIZLI MOD (Önerilen - 2 dakika):**
```bash
python scripts/import_books_from_kaggle.py books.csv --limit 500
```

**GÜVENLİ MOD (Cover doğrulamalı - 5 dakika):**
```bash
python scripts/import_books_from_kaggle.py books.csv --limit 500 --download-covers
```

### 2.3 Beklenen Çıktı
```
==================================================================
KAGGLE GOODREADS DATASET IMPORT (WITH COVER IMAGES)
==================================================================
CSV Path: books.csv
Limit: 500 books
Cover Source: Open Library (covers.openlibrary.org)
==================================================================

Reading CSV: books.csv
  Parsed 100 books...
  Parsed 500 books...

Total books parsed: 500

Importing 500 books to database...
  Imported 50 books (skipped 0 duplicates)...
  Imported 100 books (skipped 0 duplicates)...

[SUCCESS] Import complete!
  Imported: 500 books
  Total in DB: 500 books

==================================================================
NEXT STEPS:
==================================================================
1. Generate embeddings:
   cd ../../backend
   python scripts/generate_book_embeddings.py

2. Index to Elasticsearch:
   python scripts/index_books_to_es.py
==================================================================
```

---

## 🔮 ADIM 3: AI Embeddings Oluştur

```powershell
# Aynı klasörde devam et (data/)
# Embeddings oluştur (OpenAI)
python scripts/generate_book_embeddings.py
```

**Süre:** ~5-10 dakika (OpenAI API)
**Maliyet:** ~$0.10 (500 kitap için)

---

## 🔍 ADIM 4: Elasticsearch'e Index

```bash
python scripts/index_books_to_es.py
```

**Süre:** ~2 dakika

---

## ✅ Doğrulama

### Database Kontrolü
```powershell
# PostgreSQL'e bağlan
docker exec -it bibliomind-postgres psql -U bibliomind -d bibliomind

# Kitap sayısı
SELECT COUNT(*) FROM books;
-- Beklenen: 500

# Cover URL'li kitaplar
SELECT COUNT(*) FROM books WHERE cover_url IS NOT NULL;
-- Beklenen: ~400-450 (ISBN'i olmayanlar yok)

# Örnek kitap
SELECT title, author, cover_url FROM books LIMIT 5;
```

### API Testi
```bash
# Backend'i başlat (başka terminal)
cd backend
python -m uvicorn app.main:app --reload

# Tarayıcıda:
http://localhost:8000/api/books?page=1&page_size=20
```

---

## 📋 Klasör Yapısı

```
biblomind/
├── data/
│   ├── books.csv                          ← Kaggle CSV'si (sen ekle)
│   ├── IMPORT_GUIDE.md                    ← Bu dosya
│   └── scripts/
│       ├── README.md
│       ├── import_books_from_kaggle.py    ← Import script
│       ├── generate_book_embeddings.py    ← AI embeddings
│       └── index_books_to_es.py           ← Elasticsearch index
│
└── backend/
    ├── app/                               ← API kodu
    └── scripts/                           ← Backend yönetim scriptleri
```

---

## 🎨 Cover Resimleri Nasıl Çalışır?

### Open Library API
Script her kitap için otomatik cover URL oluşturur:

```
https://covers.openlibrary.org/b/isbn/{ISBN}-L.jpg
```

**Örnek:**
```
# 1984 by George Orwell
ISBN: 0451524934
Cover: https://covers.openlibrary.org/b/isbn/0451524934-L.jpg

# Harry Potter
ISBN: 0439708184
Cover: https://covers.openlibrary.org/b/isbn/0439708184-L.jpg
```

**Boyutlar:**
- `-S.jpg` → Small (küçük)
- `-M.jpg` → Medium (orta)
- `-L.jpg` → Large (büyük) ← **Kullanılan**

**Beklenti:**
- ~80-90% kitapta cover URL olur
- ISBN'i olmayan kitaplarda cover yok (normal)

---

## 🔧 Sorun Giderme

### ❌ ModuleNotFoundError
```bash
# Backend dependencies kur
cd ../../backend
pip install -r requirements.txt
```

### ❌ Database connection failed
```bash
# PostgreSQL'i başlat
docker-compose up -d postgres

# Kontrol et
docker ps | grep postgres
```

### ❌ CSV file not found
```bash
# Doğru konumda olduğundan emin ol
ls books.csv

# Yoksa doğru yere kopyala
# Hedef: data/data/books.csv
```

### ❌ No books parsed
```bash
# CSV formatını kontrol et
head -5 books.csv

# Gerekli kolonlar: title, authors, isbn veya isbn13
```

---

## 💡 İpuçları

### 1. İlk Testte Az Kitap Dene
```bash
python scripts/import_books_from_kaggle.py books.csv --limit 50
```

### 2. Hızlı Import
- `--download-covers` kullanma (cover doğrulaması yavaşlatır)
- Varsayılan mod zaten cover URL ekler

### 3. Tekrar Çalıştırma Güvenli
- Script duplicate check yapar
- Aynı kitap tekrar eklenmez

### 4. Cover URL Manuel Test
```bash
# Tarayıcıda aç
https://covers.openlibrary.org/b/isbn/0451524934-L.jpg

# Çalışıyorsa kapak görünür
```

### 5. Tüm Scriptler Aynı Yerde
- Artık tüm data scriptleri `data/scripts/` klasöründe
- Backend'e geçmeye gerek yok
- Daha organize ve temiz yapı

---

## 📊 Beklenen Sonuçlar

| Metrik | Değer |
|--------|-------|
| Toplam kitap | 500 |
| Cover URL'li | ~400-450 (%80-90) |
| Import süresi | ~2 dakika |
| Embeddings süresi | ~5-10 dakika |
| ES indexing | ~2 dakika |
| **TOPLAM** | **~15-20 dakika** |

---

## 🎉 Tamamlandı mı?

Import başarılı olduğunda:
- ✅ 500 popüler kitap database'de
- ✅ Çoğunda kapak resmi URL'si var
- ✅ AI embeddings hazır (öneri için)
- ✅ Elasticsearch'te aranabilir

**API'niz artık tam dolu bir kitap kataloğuna sahip! 🚀**

---

## 📞 Destek

Sorun mu yaşıyorsun?
1. Bu dosyayı tekrar oku
2. Terminal çıktısını kontrol et
3. Backend loglarına bak
4. Docker container'ları kontrol et (`docker ps`)
