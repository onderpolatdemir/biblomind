# Phase 2.3: Recommendation Engine

**Başlangıç:** 21 Ocak 2026  
**Durum:** 🔵 Planlandı - Başlıyor  
**Sorumlu:** Kaan (AI-Backend Lead)

---

## 🎯 Amaç

Kullanıcılara kişiselleştirilmiş kitap önerileri yapan akıllı bir öneri motoru geliştirmek.

### Temel Özellikler:
1. **Embedding-based Similarity** - pgvector ile semantik benzerlik
2. **User Preference Vector** - Kullanıcı profil vektörü
3. **Collaborative Filtering** - Benzer kullanıcılar analizi
4. **Content-based Filtering** - Kitap özelliklerine göre öneri
5. **Hybrid Approach** - Karışık yaklaşım

---

## 📋 Yapılacaklar

### 1. Recommendation Service

**Dosya:** `backend/app/services/recommendation_service.py`

**Metodlar:**
- `generate_book_recommendations(user_id, limit=10)` - Ana öneri metodu
- `get_similar_books(book_id, limit=5)` - Benzer kitaplar
- `get_collaborative_recommendations(user_id)` - İşbirlikçi filtreleme
- `get_content_based_recommendations(user_id)` - İçerik tabanlı
- `update_user_preference_vector(user_id)` - Profil vektörünü güncelle
- `calculate_recommendation_score(user, book)` - Skor hesaplama

**Teknoloji:**
- OpenAI embeddings (kitap metadata → vector)
- pgvector cosine similarity
- User interaction history
- Weighted scoring

### 2. Preference Vector Management

**Kullanıcı profil vektörü nasıl oluşturulur:**

```python
# User'ın beğendiği kitapların embedding'lerinin ağırlıklı ortalaması
user_vector = weighted_average([
    book1.embedding * weight1,  # weight = interaction_type'a göre
    book2.embedding * weight2,
    ...
])

# Interaction weights:
# - purchase: 1.0 (en yüksek)
# - like: 0.8
# - cart: 0.5
# - view: 0.2
```

**Güncelleme:**
- Her yeni interaction'da user.preferences_vector güncellenir
- Async task (Celery) ile background'da çalışır
- Redis cache'de tutulur

### 3. Recommendation API Endpoints

**Dosya:** `backend/app/api/recommendations.py`

#### GET `/api/recommendations`
**Description:** Kullanıcıya özel kitap önerileri

**Query Parameters:**
- `limit` (default: 10) - Kaç kitap önerilsin
- `strategy` - "hybrid" | "collaborative" | "content" | "similar"
- `exclude_owned` (default: true) - Sahip olunan kitapları hariç tut

**Response:**
```json
{
  "recommendations": [
    {
      "book": {
        "id": "...",
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "cover_url": "...",
        "price": 45.0
      },
      "score": 0.92,
      "explanation": "1984'ü sevdiyseniz bu distopik klasiği de beğeneceksiniz",
      "match_reasons": ["similar_genre", "author_style", "user_preferences"]
    }
  ],
  "total": 10,
  "strategy": "hybrid"
}
```

#### GET `/api/books/{book_id}/similar`
**Description:** Bu kitaba benzer kitaplar

**Response:**
```json
{
  "book": {...},
  "similar_books": [
    {
      "id": "...",
      "title": "Fahrenheit 451",
      "similarity_score": 0.89,
      "reason": "Benzer tema: Sansür ve özgürlük"
    }
  ]
}
```

#### POST `/api/recommendations/refresh`
**Description:** Kullanıcı profil vektörünü yeniden hesapla

**Response:**
```json
{
  "message": "Profile updated successfully",
  "preferences_vector_updated": true,
  "total_interactions_processed": 42
}
```

### 4. Background Tasks (Celery)

**Dosya:** `backend/app/tasks/recommendation_tasks.py`

**Tasks:**
- `update_user_preferences_async(user_id)` - Profil vektörünü güncelle
- `precompute_recommendations(user_id)` - Önerileri önceden hesapla
- `update_book_embeddings_batch()` - Toplu embedding güncelleme

### 5. Database Updates

**User modeline ekleme:**
```python
class User(Base):
    # ...
    preferences_vector = Column(Vector(1536))  # OpenAI embedding dimension
    preferences_updated_at = Column(DateTime)
```

**Migration:**
```bash
alembic revision -m "add_preferences_vector_to_users"
alembic upgrade head
```

### 6. Schemas

**Dosya:** `backend/app/schemas/recommendation.py`

```python
class RecommendationResponse(BaseModel):
    book: BookResponse
    score: float
    explanation: str
    match_reasons: List[str]

class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationResponse]
    total: int
    strategy: str
```

### 7. Testing

**Unit Tests:** `backend/tests/services/test_recommendation_service.py`
- Test embedding calculations
- Test scoring algorithms
- Test collaborative filtering logic

**Integration Tests:** `backend/scripts/test_recommendations.py`
- Test full recommendation pipeline
- Test with real user data
- Performance benchmarks

### 8. Documentation

**Dosya:** `backend/docs/RECOMMENDATION-ENGINE.md`

**İçerik:**
- Recommendation strategies explained
- How user preference vectors work
- API usage examples
- Performance optimization tips
- Troubleshooting

---

## 🧪 Test Senaryoları

### Scenario 1: Yeni Kullanıcı
- Kullanıcının hiç interaction'ı yok
- **Beklenen:** Popular books + random selection
- **Fallback:** Trending books veya admin picks

### Scenario 2: Az Interaction
- Kullanıcının 1-5 interaction'ı var
- **Beklenen:** Content-based recommendations
- **Weight:** Genre + author similarity ağırlıklı

### Scenario 3: Aktif Kullanıcı
- Kullanıcının 10+ interaction'ı var
- **Beklenen:** Hybrid recommendations
- **Weight:** 60% content-based + 40% collaborative

### Scenario 4: Similar Book Request
- Belirli bir kitaba benzer kitaplar
- **Beklenen:** Top-5 most similar (cosine similarity)
- **Threshold:** Similarity > 0.7

---

## 📊 Metrikler

### Performance Targets:
- API response time: < 500ms (cached)
- Cold start: < 2s (first request)
- Accuracy: User acceptance > 70%

### Monitoring:
- Recommendation click-through rate
- Conversion rate (recommendation → purchase)
- User satisfaction scores

---

## 🔧 Implementation Order

1. ✅ **Day 1:** Recommendation service skeleton
2. ✅ **Day 2:** Embedding-based similarity
3. ✅ **Day 3:** User preference vector logic
4. ✅ **Day 4:** API endpoints
5. ✅ **Day 5:** Background tasks (Celery)
6. ✅ **Day 6:** Testing + Documentation
7. ✅ **Day 7:** Integration + Performance tuning

---

## 🎯 Success Criteria

- ✅ User can get personalized recommendations
- ✅ Recommendations are relevant (AI-verified)
- ✅ System handles cold start problem
- ✅ Performance meets targets
- ✅ Background tasks working
- ✅ Full documentation
- ✅ Test coverage > 80%

---

**Sonraki:** Phase 2.4 - LangChain Integration & RAG Pipeline
