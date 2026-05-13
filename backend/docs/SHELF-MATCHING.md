# Bookshelf Matching Feature

## 📚 Genel Bakış

Bookshelf Matching, kullanıcıların başkasının kitaplığındaki kitapları fotoğraflayarak, kendi okuma zevklerine uygun kitapları bulmalarını sağlayan akıllı bir eşleştirme sistemidir.

## 🎯 Kullanım Senaryosu

```
Ahmet (Kullanıcı):
  - Daha önce beğendiği kitaplar: Distopya, Politik, George Orwell
  - Arkadaşı Mehmet'in evine gidiyor

Mehmet'in Kitaplığı:
  - 50+ kitap var (1984, Simyacı, Aşk-ı Memnu, Nutuk, ...)

Sistem:
  1. Mehmet'in kitaplığının fotoğrafını Ahmet çekiyor
  2. OCR + AI ile kitaplar tespit ediliyor
  3. Ahmet'in profili ile eşleştiriliyor
  4. "Ahmet, bu kitaplıktan şu 3 kitabı ödünç alabilirsin!"
```

## 🏗️ Mimari

### 1. OCR + AI Temizleme

**Problem:** OCR sonuçları hatalı ve gürültülü
```
"fodiwiiiiiifizyoloji açisinda" ❌
"james arthur rat56o6985oo"      ❌
"556o89 8853oo"                  ❌
```

**Çözüm:** OpenAI ile düzeltme
```python
detected_books = await vision_service.detect_and_clean_books(
    image_bytes,
    openai_service
)
# [
#   {"title": "1984", "author": "George Orwell", "confidence": 0.95},
#   {"title": "Simyacı", "author": "Paulo Coelho", "confidence": 0.88}
# ]
```

### 2. Kullanıcı Profili

**Kullanıcının geçmiş etkileşimlerinden profil oluşturulur:**

```python
user_profile = await UserService.get_user_reading_profile(
    db,
    user_id,
    openai_service
)
# {
#   "favorite_genres": ["Distopya", "Politik"],
#   "favorite_authors": ["George Orwell"],
#   "themes": ["özgürlük", "toplum eleştirisi"],
#   "style_preferences": ["karanlık", "düşündürücü"],
#   "reading_level": "advanced"
# }
```

**Profil Kaynakları:**
- `like` interactions (beğenilen kitaplar)
- `purchase` interactions (satın alınan kitaplar)

### 3. Akıllı Eşleştirme

**AI ile kitaplar kullanıcı profiline göre skorlanır:**

```python
matching_result = await vision_service.match_books_to_user_profile(
    detected_books,
    user_profile,
    db,
    openai_service,
    limit=5
)
```

**Sonuç:**
```json
{
  "recommendations": [
    {
      "title": "1984",
      "author": "George Orwell",
      "match_score": 0.98,
      "reason": "Favori yazarınız ve distopya seviyorsunuz",
      "in_our_store": true,
      "book_id": "...",
      "price": 45.0,
      "cover_url": "..."
    }
  ],
  "shelf_analysis": {
    "dominant_genres": ["Klasik", "Felsefe", "Kişisel Gelişim"],
    "reading_style": "Karışık, çok yönlü okur",
    "user_compatibility": 0.75
  }
}
```

## 🔌 API Endpoint

### `POST /api/vision/match-shelf`

Kitaplık fotoğrafını yükleyip kullanıcıya öneriler al.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body:**
```
file: <bookshelf_image.jpg>
```

**Response:**
```json
{
  "user_profile": {
    "favorite_genres": ["Distopya", "Politik"],
    "favorite_authors": ["George Orwell"],
    "has_history": true
  },
  "total_books_in_shelf": 38,
  "detected_books": [
    {
      "title": "1984",
      "author": "George Orwell",
      "confidence": 0.95,
      "genres": ["Distopya", "Politik"]
    }
  ],
  "recommendations": [
    {
      "title": "1984",
      "author": "George Orwell",
      "match_score": 0.98,
      "reason": "George Orwell favori yazarınız ve distopya türünü seviyorsunuz",
      "in_our_store": true,
      "book_id": "ca9aed8a-d71e-4db8-ba68-d4b1eb870d72",
      "price": 45.0,
      "cover_url": "https://..."
    }
  ],
  "shelf_analysis": {
    "dominant_genres": ["Klasik", "Felsefe"],
    "reading_style": "Entelektüel, düşünce ağırlıklı okur",
    "user_compatibility": 0.85
  },
  "message": "Bu kitaplıktan size 3 kitap öneriyoruz!",
  "processing_time_ms": 4500
}
```

**Error Responses:**

```json
// No books detected
{
  "total_books_in_shelf": 0,
  "message": "Kitaplıkta kitap tespit edilemedi. Daha net bir fotoğraf yükleyin."
}

// Invalid file type
{
  "detail": "Invalid file type: image/webp. Only JPG/PNG supported."
}
```

## 🧪 Test Etme

### Manuel Test Script

```bash
cd backend

# Varsayılan resimle
python -m scripts.test_shelf_matching

# Özel resimle
python -m scripts.test_shelf_matching --image path/to/bookshelf.jpg
```

### cURL ile Test

```bash
# 1. Login
ACCESS_TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.access_token')

# 2. Match Shelf
curl -X POST http://localhost:8000/api/vision/match-shelf \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@bookshelf.jpg"
```

### Python ile Test

```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/api/auth/login",
    json={"email": "user@example.com", "password": "password"}
)
token = response.json()["access_token"]

# Match Shelf
with open("bookshelf.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/api/vision/match-shelf",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": f}
    )

result = response.json()
print(f"Detected: {result['total_books_in_shelf']} books")
print(f"Recommended: {len(result['recommendations'])} books")
```

## 📊 Özellikler

### ✅ Ek Özellik 1: Satın Alma Linki

Her önerilen kitap için DB kontrolü yapılır:

```json
{
  "title": "1984",
  "in_our_store": true,    // ✅ DB'de var
  "book_id": "...",         // Store'da satın alma için ID
  "price": 45.0,            // Fiyat bilgisi
  "cover_url": "..."        // Kapak resmi
}
```

**Frontend Kullanımı:**
```javascript
if (book.in_our_store) {
  return <BuyButton bookId={book.book_id} price={book.price} />
} else {
  return <NotAvailable />
}
```

### ✅ Ek Özellik 3: Raf Analizi

Her kitaplık için detaylı analiz:

```json
{
  "shelf_analysis": {
    "dominant_genres": ["Klasik Edebiyat", "Felsefe", "Kişisel Gelişim"],
    "reading_style": "Entelektüel, karışık okur. Klasik ve modern dengesi iyi.",
    "user_compatibility": 0.75  // Kullanıcı ile raf uyumluluğu (0-1)
  }
}
```

**UI Kullanımı:**
- Compatibility badge göster
- "Bu kütüphane size %75 uyumlu!" mesajı
- Dominant genres ile ilgili öneriler

## 🔧 Servisler

### VisionService

**Yeni Metodlar:**

```python
# OCR + AI temizleme
detected_books = await vision_service.detect_and_clean_books(
    image_bytes,
    openai_service
)

# Kullanıcı profili ile eşleştirme
matching_result = await vision_service.match_books_to_user_profile(
    detected_books,
    user_profile,
    db,
    openai_service,
    limit=5
)
```

### UserService

**Yeni Metod:**

```python
# AI ile okuma profili oluşturma
user_profile = await UserService.get_user_reading_profile(
    db,
    user_id,
    openai_service
)
```

## 📈 Performans

**Örnek Süre Dağılımı:**

```
Total: ~4-6 saniye
├─ OCR (Vision API): 2-3s
├─ AI Temizleme: 1-2s
├─ Profil Çıkarma: 0.5s
└─ Eşleştirme: 1-2s
```

**Optimizasyon:**
- Redis cache (OpenAI sonuçları)
- Parallel OCR (4 yön)
- Batch processing (çok kitap varsa)

## 🐛 Troubleshooting

### Problem: "No books detected"

**Sebep:** OCR hiç text bulamadı veya AI hepsini reddetti

**Çözüm:**
1. Daha net fotoğraf
2. İyi ışıklandırma
3. Yakından çekim
4. Kitap sırtlarının görünür olması

### Problem: "Low match scores"

**Sebep:** Kullanıcı profili ile raf uyumsuz

**Çözüm:**
- Normal, bazı kitaplıklar bazı kullanıcılara uymuyor
- Compatibility score'a bak
- Farklı kitaplık dene

### Problem: "Slow response"

**Sebep:** OpenAI API yavaş veya çok kitap var

**Çözüm:**
- İlk 30-50 kitap işleniyor (varsayılan)
- Redis cache kullanılıyor
- Async işlemler paralel

## 🚀 Next Steps

1. **Collaborative Filtering:** Benzer kullanıcıların kitaplıkları
2. **Bookshelf Social:** Kitaplık paylaşma özelliği
3. **QR Code:** Kitaplık sahibi QR kodu paylaşır
4. **Mobile App:** Kameradan direkt tarama

---

**Dokümantasyon Güncellenme:** 2026-01-21
