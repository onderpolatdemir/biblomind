# Chatbot Service Documentation

**Tarih:** 22 Ocak 2026  
**Görev:** Phase 2.4 - LangChain Integration  
**Durum:** ✅ Tamamlandı

---

## 📋 Özet

BiblioMind AI Chatbot sistemi tamamlandı. HYBRID recommendation strategy (RAG + Recommendation Engine) ile kullanıcılarla doğal dilde sohbet edebilen, kitap önerileri yapabilen ve context-aware cevaplar verebilen tam fonksiyonel bir chatbot.

## 🚀 Özellikler

### ✅ Tamamlanan Özellikler

1. **HYBRID Recommendation Strategy**
   - Otomatik kitap ismi tespiti (fuzzy matching)
   - RAG semantic search
   - Recommendation Engine entegrasyonu
   - Akıllı strateji seçimi

2. **Conversation Management**
   - Maksimum 5 aktif conversation per user
   - Otomatik başlık üretimi (GPT-4o)
   - Conversation history (max 50 mesaj)
   - CRUD operasyonları

3. **Context-Aware Responses**
   - RAG pipeline ile kitap context'i
   - Conversation history tracking
   - Book reference metadata
   - Hallüsinasyon önleme

4. **Chatbot Davranışı**
   - Kitap odaklı yardımcı
   - Out-of-topic sorulara cevap verebilir
   - Kullanıcıyı kitap keşfine yönlendirir
   - Kısa ve net cevaplar (2-3 paragraf)

## 📁 Dosya Yapısı

### Database Models
- `backend/app/models/conversation.py`
  - `Conversation` - Sohbet container
  - `ConversationMessage` - Her mesaj

### Services
- `backend/app/services/chat_service.py` - Ana chatbot logic
- `backend/app/services/rag_service.py` - RAG pipeline
- `backend/app/services/langchain_helper.py` - LangChain integration

### API Endpoints
- `backend/app/api/chat.py` - 5 REST endpoint

### Schemas
- `backend/app/schemas/chat.py` - Request/Response modelleri

### Scripts
- `backend/scripts/test_chatbot.py` - Manuel test script

## 🔗 API Endpoints

### 1. POST `/api/chat/message`

Mesaj gönder ve AI cevabı al.

**Request:**
```json
{
  "message": "1984 kitabını okumak istiyorum",
  "conversation_id": null  // null = yeni sohbet
}
```

**Response:**
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "message": "1984 kitabını okumak istiyorum",
  "response": "1984, George Orwell'ın totaliter rejimleri...",
  "book_references": [
    {
      "id": "uuid",
      "title": "1984",
      "author": "George Orwell",
      "similarity_score": 0.95
    }
  ],
  "strategy": "book_detection",
  "created_at": "2026-01-22T10:00:00Z"
}
```

**Stratejiler:**
- `book_detection` - Kitap ismi tespit edildi
- `rag_semantic` - Semantic search
- `recommendation_engine` - Kişiselleştirilmiş öneriler
- `popular_books` - Popüler kitaplar (yeni kullanıcı)

### 2. GET `/api/chat/conversations`

Kullanıcının tüm sohbetlerini listele.

**Query Params:**
- `page` (int): Sayfa numarası (default: 1)
- `page_size` (int): Sayfa başına öğe (default: 20)

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "1984 Kitap Önerisi",
      "message_count": 5,
      "last_message": "Teşekkür ederim...",
      "created_at": "2026-01-22T10:00:00Z",
      "updated_at": "2026-01-22T10:15:00Z"
    }
  ],
  "total": 3,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

### 3. GET `/api/chat/conversations/{conversation_id}`

Sohbet detayı ve tüm mesajları getir.

**Response:**
```json
{
  "id": "uuid",
  "title": "1984 Kitap Önerisi",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "1984 kitabını okumak istiyorum",
      "book_context": null,
      "created_at": "2026-01-22T10:00:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "1984, George Orwell'ın...",
      "book_context": {
        "strategy": "book_detection",
        "books": [...],
        "book_count": 2
      },
      "created_at": "2026-01-22T10:00:05Z"
    }
  ],
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:15:00Z"
}
```

### 4. DELETE `/api/chat/conversations/{conversation_id}`

Sohbeti sil (cascade: tüm mesajlar silinir).

**Response:**
```json
{
  "success": true,
  "message": "Conversation deleted successfully",
  "conversation_id": "uuid"
}
```

### 5. POST `/api/chat/conversations/{conversation_id}/title`

Sohbet başlığını güncelle.

**Request:**
```json
{
  "title": "Distopya Kitapları"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Distopya Kitapları",
  "message_count": 5,
  "last_message": "...",
  "created_at": "2026-01-22T10:00:00Z",
  "updated_at": "2026-01-22T10:20:00Z"
}
```

## 🧪 Test Etme

### Manuel Test Script

```bash
cd backend
python -m scripts.test_chatbot
```

**Test Senaryoları:**
1. ✅ Yeni sohbet oluşturma
2. ✅ Kitap ismi tespiti (fuzzy matching)
3. ✅ Conversation history ile devam
4. ✅ HYBRID strateji (RAG + Rec Engine)
5. ✅ Out-of-topic soru
6. ✅ Sohbet listesi
7. ✅ Sohbet detayı
8. ✅ Sohbet silme

### Swagger UI

```
http://localhost:8000/docs
```

**Test Akışı:**
1. `/api/auth/register` - Kullanıcı oluştur
2. `/api/auth/login` - Token al
3. `/api/chat/message` - Mesaj gönder (Authorize ile token ekle)
4. `/api/chat/conversations` - Listeyi kontrol et

## 💡 Kullanım Örnekleri

### Python (httpx)

```python
import httpx

async def chat_example():
    async with httpx.AsyncClient() as client:
        # Login
        login_response = await client.post(
            "http://localhost:8000/api/auth/login",
            json={"email": "user@example.com", "password": "password"}
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Send message
        chat_response = await client.post(
            "http://localhost:8000/api/chat/message",
            json={"message": "Bana bilim kurgu kitap öner"},
            headers=headers
        )
        
        result = chat_response.json()
        print(f"AI: {result['response']}")
        print(f"Strategy: {result['strategy']}")
        print(f"Books: {len(result['book_references'])}")
```

### JavaScript (fetch)

```javascript
// Login
const loginRes = await fetch('http://localhost:8000/api/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password'
  })
});
const {access_token} = await loginRes.json();

// Send message
const chatRes = await fetch('http://localhost:8000/api/chat/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${access_token}`
  },
  body: JSON.stringify({
    message: 'Bana bilim kurgu kitap öner'
  })
});

const result = await chatRes.json();
console.log('AI:', result.response);
console.log('Strategy:', result.strategy);
```

## 🎯 HYBRID Strategy Detayları

### Karar Ağacı

```
User Message
    |
    ├─> Kitap ismi tespit edildi mi? (Fuzzy > 0.85)
    |   └─> YES: Book Detection Strategy
    |       - Tespit edilen kitapları context'e ekle
    |       - Benzer kitaplar ara (RAG)
    |       - Tümünü birleştir
    |
    ├─> "Öneri" kelimesi var mı?
    |   ├─> User preference_vector var mı?
    |   |   └─> YES: Recommendation Engine Strategy
    |   |       - Kişiselleştirilmiş öneriler
    |   |       - Hybrid scoring
    |   |
    |   └─> NO: Popular Books Strategy
    |       - Yeni kullanıcı
    |       - En popüler kitaplar
    |
    └─> Genel soru: RAG Semantic Search
        - Query'yi embed et
        - pgvector similarity search
        - Context oluştur
```

### Strateji Örnekleri

**1. Book Detection**
- User: "1984 okumak istiyorum"
- Tespit: "1984" (fuzzy score: 1.0)
- Action: 1984 + benzer kitaplar (Brave New World, Fahrenheit 451)

**2. Recommendation Engine**
- User: "Bana kitap öner"
- Check: user.preferences_vector != None
- Action: RecommendationService.generate_recommendations()

**3. RAG Semantic**
- User: "Distopya romanları hakkında bilgi"
- Action: Embed query → pgvector search → context

**4. Popular Books**
- User: "Ne okuyayım?" (yeni kullanıcı)
- Check: user.preferences_vector == None
- Action: En çok etkileşim alan kitaplar

## 🔒 Güvenlik

### Access Control
- Tüm endpoint'ler authentication gerektiriyor (`get_current_user`)
- User sadece kendi conversation'larına erişebilir
- Conversation ID + User ID ile access control

### Rate Limiting
- OpenAI API: Retry logic (3 attempt, exponential backoff)
- Redis cache: Embedding sonuçları cache'leniyor

### Conversation Limit
- Max 5 aktif conversation per user
- 6. conversation'da en eski otomatik silinir
- Spam önleme

## 📊 Performans

### Benchmark Sonuçları

**Test Ortamı:** Local development
- **Message latency:** ~2-3 saniye (hedef: <3s) ✅
- **Fuzzy matching:** ~50ms (20 kitap)
- **pgvector search:** ~100ms
- **GPT-4o response:** ~1.5s
- **Total pipeline:** ~2s

### Optimization

**Cache Stratejisi:**
- Embeddings: 30 gün TTL
- Fuzzy match sonuçları: Session cache

**Database:**
- Indexler: user_id, conversation_id, created_at
- pgvector IVFFLAT index (gelecekte 10K+ kitap için)

## 🐛 Troubleshooting

### "Conversation not found"
**Sebep:** conversation_id yanlış veya başka kullanıcıya ait  
**Çözüm:** GET /api/chat/conversations ile ID'leri kontrol et

### "Failed to generate response"
**Sebep:** OpenAI API hatası veya timeout  
**Çözüm:** 
- OpenAI API key kontrolü
- Network connection
- Log'ları kontrol et: `backend/logs/`

### "Book detection not working"
**Sebep:** Fuzzy matching threshold çok yüksek  
**Çözüm:** `detect_book_mentions(threshold=0.80)` ile test et

### Slow response times
**Sebep:** pgvector index yok veya büyük veri seti  
**Çözüm:**
```sql
CREATE INDEX book_embedding_idx ON books 
USING ivfflat (embedding vector_cosine_ops);
```

## 📈 Sonraki Adımlar (Future)

### Phase 3 İyileştirmeler
1. **Streaming Responses** - SSE ile real-time typing effect
2. **Voice Input** - Speech-to-text entegrasyonu
3. **Image Understanding** - Kitap kapağı upload + vision
4. **Multi-language** - İngilizce destek
5. **Conversation Analytics** - User behavior tracking

### Optimizasyon
1. **Celery Background Tasks** - Async preference vector update
2. **Redis Pub/Sub** - Real-time notifications
3. **PostgreSQL Full-Text Search** - Hybrid search (ES + pgvector)

## 📞 Destek

**Sorular için:** Kaan (AI-Backend Lead)

---

**Son Güncelleme:** 22 Ocak 2026  
**Durum:** ✅ Production Ready  
**Test Durumu:** ✅ All tests passing  
**Sonraki:** Frontend integration
