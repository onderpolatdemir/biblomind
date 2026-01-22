# Vision Service Test Results

Bu klasör, Vision Service testlerinin sonuçlarını içerir.

## 📁 Dosya Formatı

Her test çalıştığında otomatik olarak bir JSON dosyası oluşturulur:

```
vision_results_{resim_adı}_{tarih_saat}.json
```

## 📊 JSON İçeriği

```json
{
  "timestamp": "Test zamanı (ISO format)",
  "image_path": "Test edilen resmin yolu",
  "image_name": "Resim dosya adı",
  "detected_texts": [
    "Tespit edilen text 1",
    "Tespit edilen text 2",
    ...
  ],
  "matched_books": [
    {
      "id": "Kitap ID",
      "title": "Kitap başlığı",
      "author": "Yazar",
      "genres": ["Tür1", "Tür2"],
      "price": 99.99,
      "cover_image": "Kapak resmi URL",
      "similarity_score": 0.95
    }
  ],
  "total_detected": 58,
  "total_matched": 2
}
```

## 🎯 Kullanım

### Test Çalıştırma

```bash
# Varsayılan resimle test
python -m scripts.test_vision_service

# Özel resimle test
python -m scripts.test_vision_service --image path/to/bookshelf.jpg
```

### Sonuçları İnceleme

Her test sonrası `test_results/` klasöründe yeni bir JSON dosyası oluşur. Bu dosyalar:

1. **Tespit edilen tüm textleri** gösterir (OCR sonuçları)
2. **Eşleşen kitapları** ve benzerlik skorlarını listeler
3. **İstatistikleri** sunar (kaç text bulundu, kaç kitap eşleşti)

## 📈 Örnek Sonuçlar

### bookshelf.jpeg
- ✅ **58 text** tespit edildi
- ✅ **2 kitap** eşleştirildi
  - Animal Farm - George Orwell (100%)
  - 1984 - George Orwell (84%)

### bookshelf2.jpeg
- ✅ **38 text** tespit edildi
- ⚠️ **0 kitap** eşleştirildi (database'de Türkçe kitap yok)

## 🔍 Not

Eşleşme oranı düşükse veya hiç eşleşme yoksa:
1. Database'e kitap ekleyin: `python -m scripts.seed_books`
2. Türkçe kitaplar için özel seed scripti yazın
3. Fuzzy matching threshold'unu ayarlayın (varsayılan: 0.75)

## 🗑️ Temizleme

Eski test sonuçlarını silmek için:

```bash
rm test_results/vision_results_*.json
```

---

**Son güncelleme:** 2026-01-21
