# 📚 Data Import Scripts

Bu klasör kitap verilerini import etmek için scriptleri içerir.

## 📋 Mevcut Scriptler

### `import_books_from_kaggle.py`
Kaggle Goodreads dataset'inden **EN POPÜLER** kitapları import eder. **Open Library'den otomatik kapak resimleri ekler.**

**Seçim Kriterleri:**
- 📊 En çok rating alan kitaplar (ratings_count'a göre sıralı)
- ✅ Sadece İngilizce kitaplar
- ✅ Tüm gerekli veriler dolu: title, author, ISBN, description, genres
- 🎯 Database'de eksik kolon kalmaz

**Kullanım:**
```bash
# CSV'yi data/ klasörüne koy
# data/books.csv

# Script'i çalıştır
cd data
python scripts/import_books_from_kaggle.py books.csv --limit 500

# Cover doğrulamalı (yavaş ama güvenli)
python scripts/import_books_from_kaggle.py books.csv --limit 500 --download-covers
```

**Özellikler:**
- ✅ Open Library cover URL'leri (ISBN'den otomatik)
- ✅ Genre inference (title/author'dan tahmin)
- ✅ Duplicate checking
- ✅ Türkçe açıklama oluşturma
- ✅ Batch import (50'li gruplar)

**Gereksinimler:**
- PostgreSQL çalışıyor olmalı
- Backend dependencies kurulu olmalı (`pip install -r backend/requirements.txt`)

## 📥 Dataset İndirme

### Önerilen: Goodreads Best Books (52K kitap)
```
https://www.kaggle.com/datasets/thedevastator/comprehensive-overview-of-52478-goodreads-best-b
```

### Alternatif: Goodreads Books (10K kitap)
```
https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks
```

**Adımlar:**
1. Kaggle'a giriş yap
2. Dataset'i indir (ZIP)
3. `books.csv` dosyasını çıkart
4. `data/books.csv` olarak kaydet

## 🚀 Hızlı Başlangıç

```bash
# 1. CSV'yi yerleştir
# data/books.csv

# 2. Import et
cd data
python scripts/import_books_from_kaggle.py books.csv --limit 500

# 3. Embeddings oluştur
python scripts/generate_book_embeddings.py

# 4. Elasticsearch'e index et
python scripts/index_books_to_es.py
```

## 📊 Sonraki Adımlar

Import işleminden sonra aynı klasördeki diğer scriptleri çalıştır:
- `scripts/generate_book_embeddings.py` - AI embeddings
- `scripts/index_books_to_es.py` - Full-text search

