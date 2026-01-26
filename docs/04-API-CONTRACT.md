# BiblioMind - API Contract (Sözleşmesi)

**Amaç:** Frontend ve Backend arasındaki API sözleşmesini tanımlar.  
**Kullanım:** Mock API'ler ve gerçek API'ler bu sözleşmeye göre geliştirilir.

**Base URL:** `http://localhost:8000`

---

## 📋 Genel Kurallar

### Authentication
Korumalı endpoint'ler için JWT token gereklidir:
```
Authorization: Bearer <access_token>
```

### Response Format
Tüm başarılı response'lar JSON formatında döner.

### Error Format
```json
{
  "detail": "Error message",
  "error_code": "ERROR_CODE",
  "status_code": 400
}
```

### Common Error Codes
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## 🔐 Auth Endpoints

### POST /api/auth/register
Yeni kullanıcı kaydı

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "created_at": "2026-01-13T10:00:00Z"
  }
}
```

**Errors:**
```json
// Email already exists
{
  "detail": "Email already registered",
  "error_code": "EMAIL_EXISTS",
  "status_code": 400
}

// Weak password
{
  "detail": "Password must be at least 8 characters",
  "error_code": "WEAK_PASSWORD",
  "status_code": 400
}
```

---

### POST /api/auth/login
Kullanıcı girişi

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Errors:**
```json
// Invalid credentials
{
  "detail": "Incorrect email or password",
  "error_code": "INVALID_CREDENTIALS",
  "status_code": 401
}
```

---

### GET /api/auth/me
Mevcut kullanıcı bilgisi (🔒 Requires Auth)

**Note:** Bu endpoint artık sadece temel bilgileri döner. 
Tercihler dahil detaylı bilgi için `GET /api/users/me` kullanın.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_admin": false,
  "created_at": "2026-01-13T10:00:00Z"
}
```

---

### POST /api/auth/refresh
Access token yenileme

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

## 📚 Books Endpoints

### GET /api/books
Kitap listesi (pagination + filter)

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 20, max: 100)
- `genre` (string, optional)
- `author` (string, optional)
- `min_price` (float, optional)
- `max_price` (float, optional)
- `sort_by` (enum: "title", "author", "price", "created_at", default: "created_at")
- `sort_order` (enum: "asc", "desc", default: "desc")

**Example Request:**
```
GET /api/books?page=1&page_size=20&genre=Science%20Fiction&sort_by=price&sort_order=asc
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "1984",
      "author": "George Orwell",
      "description": "Dystopian social science fiction novel...",
      "isbn": "9780451524935",
      "price": 45.00,
      "stock": 15,
      "cover_url": "https://covers.example.com/1984.jpg",
      "genres": ["Dystopian", "Science Fiction", "Political Fiction"],
      "created_at": "2026-01-10T08:00:00Z"
    }
  ],
  "total": 150,
  "page": 1,
  "page_size": 20,
  "total_pages": 8
}
```

---

### GET /api/books/{id}
Kitap detayı

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "1984",
  "author": "George Orwell",
  "description": "Winston Smith works for the Ministry of Truth in London...",
  "isbn": "9780451524935",
  "price": 45.00,
  "stock": 15,
  "cover_url": "https://covers.example.com/1984.jpg",
  "genres": ["Dystopian", "Science Fiction"],
  "embedding": null,  // Hidden from client
  "created_at": "2026-01-10T08:00:00Z",
  "related_books": [
    {
      "id": "...",
      "title": "Brave New World",
      "author": "Aldous Huxley",
      "cover_url": "..."
    }
  ]
}
```

**Errors:**
```json
// Book not found
{
  "detail": "Book not found",
  "error_code": "BOOK_NOT_FOUND",
  "status_code": 404
}
```

---

### GET /api/books/search
Kitap arama (Elasticsearch)

**Query Parameters:**
- `q` (string, required) - Arama terimi
- `page` (int, default: 1)
- `page_size` (int, default: 20)

**Example Request:**
```
GET /api/books/search?q=dystopian&page=1
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "...",
      "title": "1984",
      "author": "George Orwell",
      "description": "...",
      "price": 45.00,
      "cover_url": "...",
      "relevance_score": 0.95  // Elasticsearch score
    }
  ],
  "total": 12,
  "page": 1,
  "page_size": 20
}
```

---

## 📸 Vision & Recommendation Endpoints

### POST /api/vision/analyze
Fotoğraftan kitap tanıma ve öneri (🔒 Requires Auth) ⭐ CORE FEATURE

**Request (multipart/form-data):**
```
file: <image file> (jpg, png, max 10MB)
```

**Response (200):**
```json
{
  "detected_books": [
    "1984",
    "Brave New World",
    "Fahrenheit 451",
    "The Handmaid's Tale"
  ],
  "recommendations": [
    {
      "book": {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "title": "Animal Farm",
        "author": "George Orwell",
        "description": "...",
        "price": 35.00,
        "cover_url": "https://covers.example.com/animal-farm.jpg",
        "genres": ["Political Fiction", "Satire"]
      },
      "match_score": 0.92,
      "explanation": "Bu kitabı seçtim çünkü kitaplığınızda gördüğüm 1984'ün distopik atmosferi ve toplumsal eleştirisi sizin ilgi alanınıza çok uygun. Animal Farm da aynı yazarın politik alegori tarzını yansıtıyor ve totaliter rejimlere dair güçlü bir eleştiri sunuyor."
    },
    {
      "book": {
        "id": "...",
        "title": "We",
        "author": "Yevgeny Zamyatin",
        "price": 40.00,
        "cover_url": "..."
      },
      "match_score": 0.88,
      "explanation": "Kitaplığınızdaki distopik klasiklere bakarak, 1984'e ilham kaynağı olan bu eseri sevebilirsiniz..."
    }
  ],
  "processing_time_ms": 4523
}
```

**Errors:**
```json
// Invalid file type
{
  "detail": "File must be an image (jpg, png)",
  "error_code": "INVALID_FILE_TYPE",
  "status_code": 400
}

// File too large
{
  "detail": "File size must be less than 10MB",
  "error_code": "FILE_TOO_LARGE",
  "status_code": 400
}

// No books detected
{
  "detail": "Could not detect any books in the image",
  "error_code": "NO_BOOKS_DETECTED",
  "status_code": 422
}
```

---

### POST /api/recommendations/by-preferences
Kullanıcı tercihlerine göre öneri (🔒 Requires Auth)

**Request:**
```json
{
  "favorite_genres": ["Science Fiction", "Mystery"],
  "favorite_authors": ["Agatha Christie", "Isaac Asimov"],
  "limit": 5
}
```

**Response (200):**
```json
{
  "recommendations": [
    {
      "book": {...},
      "match_score": 0.89,
      "explanation": "..."
    }
  ]
}
```

---

### GET /api/recommendations/for-me
Benim için öneriler (kullanıcı geçmişine göre) (🔒 Requires Auth)

**Query Parameters:**
- `limit` (int, default: 10)

**Response (200):**
```json
{
  "recommendations": [
    {
      "book": {...},
      "match_score": 0.85,
      "reason": "based_on_purchase_history"  // or "based_on_likes", "based_on_views"
    }
  ]
}
```

---

## 👤 User Endpoints (NEW - Phase 1 ✅)

### GET /api/users/me
Kullanıcı profili ve tercihleri (🔒 Requires Auth)

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_admin": false,
  "created_at": "2026-01-13T10:00:00Z",
  "preferences": {
    "favorite_genres": ["Science Fiction", "Mystery"],
    "favorite_authors": ["Agatha Christie", "Isaac Asimov"]
  }
}
```

---

### PUT /api/users/me/profile
Profil güncelleme (🔒 Requires Auth)

**Request:**
```json
{
  "full_name": "John Smith"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "full_name": "John Smith",
  "is_admin": false,
  "created_at": "2026-01-13T10:00:00Z"
}
```

---

### GET /api/users/me/preferences
Kullanıcı tercihleri (🔒 Requires Auth)

**Response (200):**
```json
{
  "favorite_genres": ["Science Fiction", "Mystery", "Dystopian"],
  "favorite_authors": ["George Orwell", "Agatha Christie", "Isaac Asimov"]
}
```

**Note:** Tercihler, kullanıcının favori kitaplarından otomatik olarak türetilir.

---

### PUT /api/users/me/preferences
Tercih güncelleme (🔒 Requires Auth)

**Request:**
```json
{
  "favorite_genres": ["Horror", "Thriller"],
  "favorite_authors": ["Stephen King"]
}
```

**Response (200):**
```json
{
  "favorite_genres": ["Horror", "Thriller"],
  "favorite_authors": ["Stephen King"]
}
```

**Note:** Phase 2'de AI ile preferences_vector güncellenecek.

---

### GET /api/users/me/favorites
Favori kitaplar (🔒 Requires Auth)

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "1984",
    "author": "George Orwell",
    "description": "...",
    "isbn": "9780451524935",
    "price": 45.00,
    "stock": 15,
    "cover_url": "https://covers.example.com/1984.jpg",
    "genres": ["Dystopian", "Science Fiction"],
    "created_at": "2026-01-10T08:00:00Z"
  }
]
```

---

### POST /api/users/me/favorites/{book_id}
Favoriye ekle (🔒 Requires Auth)

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "1984",
  "author": "George Orwell",
  "price": 45.00,
  ...
}
```

---

### DELETE /api/users/me/favorites/{book_id}
Favoriden kaldır (🔒 Requires Auth)

**Response (204):** No Content

---

### GET /api/users/me/history
Etkileşim geçmişi (🔒 Requires Auth)

**Query Parameters:**
- `interaction_type` (optional): view, like, cart, purchase
- `limit` (optional, default: 50, max: 100)

**Response (200):**
```json
[
  {
    "id": "interaction-uuid",
    "user_id": "user-uuid",
    "book_id": "book-uuid",
    "interaction_type": "view",
    "created_at": "2026-01-20T10:00:00Z"
  }
]
```

---

### POST /api/users/me/interactions
Etkileşim kaydet (🔒 Requires Auth)

**Request:**
```json
{
  "book_id": "550e8400-e29b-41d4-a716-446655440001",
  "interaction_type": "view"
}
```

**Response (201):**
```json
{
  "id": "interaction-uuid",
  "user_id": "user-uuid",
  "book_id": "book-uuid",
  "interaction_type": "view",
  "created_at": "2026-01-20T10:00:00Z"
}
```

**Valid interaction types:**
- `view` - Kitap detayı görüntülendi
- `like` - Kitap beğenildi (favoriye ekleme için `POST /favorites/{book_id}` kullanın)
- `cart` - Sepete eklendi
- `purchase` - Satın alındı

---

## 🛒 Cart Endpoints

### POST /api/cart/add
Sepete ekle (🔒 Requires Auth)

**Request:**
```json
{
  "book_id": "550e8400-e29b-41d4-a716-446655440001",
  "quantity": 2
}
```

**Response (200):**
```json
{
  "cart": {
    "id": "...",
    "user_id": "...",
    "items": [
      {
        "id": "cart-item-id",
        "book": {
          "id": "...",
          "title": "1984",
          "author": "George Orwell",
          "price": 45.00,
          "cover_url": "..."
        },
        "quantity": 2,
        "subtotal": 90.00
      }
    ],
    "total_items": 2,
    "total_price": 90.00,
    "updated_at": "2026-01-13T12:00:00Z"
  }
}
```

**Errors:**
```json
// Book out of stock
{
  "detail": "Book is out of stock",
  "error_code": "OUT_OF_STOCK",
  "status_code": 422
}

// Insufficient stock
{
  "detail": "Only 3 items available",
  "error_code": "INSUFFICIENT_STOCK",
  "status_code": 422
}
```

---

### GET /api/cart
Sepeti görüntüle (🔒 Requires Auth)

**Response (200):**
```json
{
  "id": "...",
  "items": [
    {
      "id": "cart-item-id-1",
      "book": {
        "id": "...",
        "title": "1984",
        "author": "George Orwell",
        "price": 45.00,
        "cover_url": "...",
        "stock": 15
      },
      "quantity": 2,
      "subtotal": 90.00
    },
    {
      "id": "cart-item-id-2",
      "book": {
        "id": "...",
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "price": 40.00,
        "cover_url": "...",
        "stock": 8
      },
      "quantity": 1,
      "subtotal": 40.00
    }
  ],
  "total_items": 3,
  "total_price": 130.00,
  "updated_at": "2026-01-13T12:00:00Z"
}
```

---

### PUT /api/cart/item/{item_id}
Sepetteki ürün miktarını güncelle (🔒 Requires Auth)

**Request:**
```json
{
  "quantity": 3
}
```

**Response (200):**
```json
{
  "cart": {
    "items": [...],
    "total_items": 4,
    "total_price": 175.00
  }
}
```

---

### DELETE /api/cart/item/{item_id}
Sepetten ürün çıkar (🔒 Requires Auth)

**Response (200):**
```json
{
  "cart": {
    "items": [...],
    "total_items": 2,
    "total_price": 85.00
  }
}
```

---

### POST /api/cart/clear
Sepeti temizle (🔒 Requires Auth)

**Response (200):**
```json
{
  "message": "Cart cleared successfully"
}
```

---

## 📦 Orders Endpoints

### POST /api/orders/create
Sipariş oluştur (sepetten) (🔒 Requires Auth)

**Request:**
```json
{
  "shipping_address": {
    "full_name": "John Doe",
    "address_line1": "123 Main St",
    "address_line2": "Apt 4B",
    "city": "Istanbul",
    "postal_code": "34000",
    "phone": "+90 555 123 4567"
  },
  "notes": "Please deliver in the morning"
}
```

**Response (201):**
```json
{
  "order": {
    "id": "order-uuid",
    "user_id": "...",
    "items": [
      {
        "id": "...",
        "book": {
          "id": "...",
          "title": "1984",
          "author": "George Orwell",
          "cover_url": "..."
        },
        "quantity": 2,
        "price": 45.00,
        "subtotal": 90.00
      }
    ],
    "subtotal": 130.00,
    "shipping_cost": 15.00,
    "total_price": 145.00,
    "status": "PENDING",
    "shipping_address": {...},
    "notes": "...",
    "created_at": "2026-01-13T12:30:00Z"
  }
}
```

**Errors:**
```json
// Empty cart
{
  "detail": "Cart is empty",
  "error_code": "EMPTY_CART",
  "status_code": 422
}
```

---

### GET /api/orders
Siparişlerim (🔒 Requires Auth)

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 10)
- `status` (enum: "PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED", optional)

**Response (200):**
```json
{
  "items": [
    {
      "id": "order-uuid",
      "total_price": 145.00,
      "status": "SHIPPED",
      "items_count": 3,
      "created_at": "2026-01-13T12:30:00Z",
      "updated_at": "2026-01-14T09:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "page_size": 10
}
```

---

### GET /api/orders/{id}
Sipariş detayı (🔒 Requires Auth)

**Response (200):**
```json
{
  "id": "order-uuid",
  "user_id": "...",
  "items": [
    {
      "id": "...",
      "book": {
        "id": "...",
        "title": "1984",
        "author": "George Orwell",
        "cover_url": "..."
      },
      "quantity": 2,
      "price": 45.00,
      "subtotal": 90.00
    }
  ],
  "subtotal": 130.00,
  "shipping_cost": 15.00,
  "total_price": 145.00,
  "status": "SHIPPED",
  "status_history": [
    {
      "status": "PENDING",
      "timestamp": "2026-01-13T12:30:00Z"
    },
    {
      "status": "PAID",
      "timestamp": "2026-01-13T12:35:00Z"
    },
    {
      "status": "SHIPPED",
      "timestamp": "2026-01-14T09:00:00Z"
    }
  ],
  "shipping_address": {
    "full_name": "John Doe",
    "address_line1": "123 Main St",
    "city": "Istanbul",
    "postal_code": "34000",
    "phone": "+90 555 123 4567"
  },
  "notes": "...",
  "created_at": "2026-01-13T12:30:00Z",
  "updated_at": "2026-01-14T09:00:00Z"
}
```

---

## 💳 Payment Endpoints

### POST /api/payment/initialize
Ödeme başlat (🔒 Requires Auth)

**Request:**
```json
{
  "order_id": "order-uuid"
}
```

**Response (200):**
```json
{
  "payment_url": "https://sandbox-api.iyzipay.com/payment/iyzipos/checkoutform/...",
  "payment_token": "payment-token",
  "expires_at": "2026-01-13T13:00:00Z"
}
```

---

### POST /api/payment/callback
İyzico webhook (Public, no auth)

**Request (from İyzico):**
```json
{
  "payment_token": "...",
  "status": "success",
  "order_id": "...",
  "transaction_id": "..."
}
```

**Response (200):**
```json
{
  "success": true
}
```

---

### GET /api/payment/status/{order_id}
Ödeme durumu (🔒 Requires Auth)

**Response (200):**
```json
{
  "order_id": "...",
  "payment_status": "PAID",  // or "PENDING", "FAILED"
  "payment_method": "credit_card",
  "transaction_id": "...",
  "paid_at": "2026-01-13T12:35:00Z"
}
```

---

## 💬 Chat Endpoints

### POST /api/chat/message
Chatbot'a mesaj gönder (🔒 Requires Auth)

**Request:**
```json
{
  "message": "Bana polisiye kitap önerir misin?"
}
```

**Response (200):**
```json
{
  "response": "Tabii! Senin profilini inceledim ve şu polisiye kitapları çok sevebilirsin...",
  "suggested_books": [
    {
      "id": "...",
      "title": "And Then There Were None",
      "author": "Agatha Christie"
    }
  ]
}
```

---

### GET /api/chat/history
Sohbet geçmişi (🔒 Requires Auth)

**Query Parameters:**
- `limit` (int, default: 50)

**Response (200):**
```json
{
  "messages": [
    {
      "id": "...",
      "role": "user",
      "content": "Bana polisiye kitap önerir misin?",
      "timestamp": "2026-01-13T14:00:00Z"
    },
    {
      "id": "...",
      "role": "assistant",
      "content": "Tabii! ...",
      "timestamp": "2026-01-13T14:00:03Z"
    }
  ]
}
```

---

## 👥 Social Endpoints

### GET /api/social/find-buddies
Benzer okuyucular bul (🔒 Requires Auth)

**Query Parameters:**
- `limit` (int, default: 10)

**Response (200):**
```json
{
  "buddies": [
    {
      "user": {
        "id": "...",
        "full_name": "Jane Smith",
        "avatar_url": null
      },
      "similarity_score": 0.87,
      "shared_interests": ["Science Fiction", "Mystery"],
      "mutual_favorite_books": [
        {
          "id": "...",
          "title": "1984"
        }
      ]
    }
  ]
}
```

---

### GET /api/social/shared-interests/{user_id}
Ortak ilgi alanları (🔒 Requires Auth)

**Response (200):**
```json
{
  "user": {
    "id": "...",
    "full_name": "Jane Smith"
  },
  "shared_genres": ["Science Fiction", "Mystery"],
  "shared_authors": ["George Orwell", "Agatha Christie"],
  "recommended_books": [
    {
      "id": "...",
      "title": "Foundation",
      "reason": "Jane also loved this book"
    }
  ]
}
```

---

## 👤 Admin Endpoints (UPDATED - Phase 1 ✅)

### GET /api/admin/stats
Dashboard istatistikleri (🔒 Requires Admin)

**Response (200):**
```json
{
  "total_users": 1523,
  "total_books": 10234,
  "total_orders": 456,
  "total_revenue": 45678.90,
  "orders_by_status": {
    "PENDING": 12,
    "PAID": 34,
    "SHIPPED": 28,
    "DELIVERED": 382,
    "CANCELLED": 5
  }
}
```

**Note:** Total revenue sadece PAID, SHIPPED ve DELIVERED siparişlerden hesaplanır.

---

### GET /api/admin/users
Kullanıcı listesi (🔒 Requires Admin)

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 20, max: 100)
- `search` (string, optional) - Email veya isim araması

**Response (200):**
```json
{
  "items": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "full_name": "John Doe",
      "is_admin": false,
      "created_at": "2026-01-10T10:00:00Z",
      "total_orders": 5,
      "total_spent": 450.00
    }
  ],
  "total": 1523,
  "page": 1,
  "page_size": 20,
  "total_pages": 77
}
```

---

### GET /api/admin/users/{user_id}
Kullanıcı detayı (🔒 Requires Admin)

**Response (200):**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_admin": false,
  "created_at": "2026-01-10T10:00:00Z",
  "total_orders": 5,
  "total_spent": 450.00
}
```

---

### GET /api/admin/orders
Sipariş listesi (🔒 Requires Admin)

**Query Parameters:**
- `page` (int, default: 1)
- `page_size` (int, default: 20, max: 100)
- `status` (string, optional) - PENDING, PAID, SHIPPED, DELIVERED, CANCELLED

**Response (200):**
```json
{
  "items": [
    {
      "id": "order-uuid",
      "user_id": "user-uuid",
      "user_email": "user@example.com",
      "status": "SHIPPED",
      "total_price": 145.00,
      "shipping_address": {...},
      "notes": "...",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-16T09:00:00Z",
      "items_count": 3
    }
  ],
  "total": 456,
  "page": 1,
  "page_size": 20,
  "total_pages": 23
}
```

---

### GET /api/admin/orders/{order_id}
Sipariş detayı (🔒 Requires Admin)

**Response (200):**
```json
{
  "id": "order-uuid",
  "user_id": "user-uuid",
  "user_email": "user@example.com",
  "status": "SHIPPED",
  "total_price": 145.00,
  "shipping_address": {
    "full_name": "John Doe",
    "address_line1": "123 Main St",
    "city": "Istanbul",
    "postal_code": "34000",
    "phone": "+90 555 123 4567"
  },
  "notes": "Please deliver in the morning",
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-01-16T09:00:00Z",
  "items_count": 3,
  "items": [
    {
      "id": "item-uuid",
      "book_id": "book-uuid",
      "book_title": "1984",
      "book_author": "George Orwell",
      "quantity": 2,
      "price": 45.00
    }
  ]
}
```

---

### PUT /api/admin/orders/{order_id}/status
Sipariş durumu güncelleme (🔒 Requires Admin)

**Request:**
```json
{
  "status": "SHIPPED"
}
```

**Valid statuses:**
- `PENDING` - Ödeme bekleniyor
- `PAID` - Ödeme alındı
- `SHIPPED` - Kargoya verildi
- `DELIVERED` - Teslim edildi
- `CANCELLED` - İptal edildi

**Response (200):**
```json
{
  "id": "order-uuid",
  "user_id": "user-uuid",
  "user_email": "user@example.com",
  "status": "SHIPPED",
  "total_price": 145.00,
  ...
}
```

**Errors:**
```json
// Invalid status
{
  "detail": "Invalid status. Must be one of: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED",
  "status_code": 400
}
```

---

### Admin Books Endpoints

**Note:** Admin kitap yönetimi endpoint'leri `/api/books` altında bulunur (admin-only):

- `POST /api/books` - Yeni kitap ekle (🔒 Admin)
- `PUT /api/books/{id}` - Kitap güncelle (🔒 Admin)
- `DELETE /api/books/{id}` - Kitap sil (🔒 Admin)

Detaylar için Books Endpoints bölümüne bakın.

---

### POST /api/admin/import/books
CSV ile kitap import (🔒 Requires Admin)

**Request (multipart/form-data):**
```
file: <CSV file>
```

**CSV Format:**
```csv
title,author,isbn,description,price,stock,genres
"1984","George Orwell","9780451524935","...","45.00","15","Dystopian|Science Fiction"
```

**Response (200):**
```json
{
  "imported": 150,
  "failed": 5,
  "errors": [
    {
      "row": 23,
      "error": "ISBN already exists"
    }
  ]
}
```

---

## 📊 Mock Data for Frontend Development

### Mock Users
```typescript
export const MOCK_USERS = [
  {
    id: "user-1",
    email: "test@example.com",
    full_name: "Test User",
    password: "password123"  // Only for mock
  }
];
```

### Mock Books
```typescript
export const MOCK_BOOKS = [
  {
    id: "book-1",
    title: "1984",
    author: "George Orwell",
    description: "Dystopian social science fiction novel...",
    isbn: "9780451524935",
    price: 45.00,
    stock: 15,
    cover_url: "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
    genres: ["Dystopian", "Science Fiction", "Political Fiction"]
  },
  {
    id: "book-2",
    title: "Brave New World",
    author: "Aldous Huxley",
    price: 40.00,
    stock: 10,
    cover_url: "...",
    genres: ["Dystopian", "Science Fiction"]
  },
  // ... daha fazla kitap
];
```

### Mock Recommendations
```typescript
export const MOCK_RECOMMENDATIONS = [
  {
    book: MOCK_BOOKS[0],
    match_score: 0.92,
    explanation: "Bu kitabı seçtim çünkü fotoğrafınızdaki distopik eserlere olan ilginiz açık..."
  }
];
```

---

## 🧪 Testing Endpoints

### Health Check
```
GET /health
Response: { "status": "ok", "timestamp": "..." }
```

### Database Check
```
GET /health/db
Response: { "database": "ok" }
```

---

**Son Güncelleme:** 13 Ocak 2026  
**Güncelleyen:** AI Assistant

**Not:** API değişikliği yapıldığında bu dosyayı güncelleyin!
