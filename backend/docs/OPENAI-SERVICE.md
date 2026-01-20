# OpenAI Service Documentation

**Tarih:** 20 Ocak 2026  
**Görev:** Phase 2.1 - OpenAI Services  
**Durum:** ✅ Tamamlandı

---

## 📋 Özet

OpenAI API entegrasyonu tamamlandı. Text embedding generation (1536-dim vectors) ve GPT-4o ile açıklama üretimi hazır. Redis cache ile cost optimization yapıldı.

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd backend
pip install -r requirements.txt
```

Yeni eklenen paketler:
- `tenacity>=8.0.0` - Retry logic
- `pytest>=8.0.0` - Unit testing
- `pytest-asyncio>=0.23.0` - Async test support
- `pytest-mock>=3.12.0` - Mock support

### 2. Environment Variables

`.env` dosyasına OpenAI API key ekle:

```env
OPENAI_API_KEY=sk-proj-your-key-here
```

**Not:** API key'i https://platform.openai.com/api-keys adresinden alabilirsin.

## 📁 Oluşturulan Dosyalar

### Ana Servisler

1. **`app/services/openai_service.py`** (380 satır)
   - `OpenAIService` class
   - `generate_embedding()` - Text → vector (1536 dim)
   - `generate_explanation()` - GPT-4o ile açıklama
   - `generate_batch_embeddings()` - Toplu embedding
   - Redis cache entegrasyonu
   - Error handling & retry logic
   - Token usage tracking

2. **`app/services/langchain_helper.py`** (230 satır)
   - `LangChainHelper` class
   - ChatOpenAI wrapper
   - OpenAIEmbeddings wrapper
   - Prompt templates
   - Chatbot helper fonksiyonlar
   - **Kullanım:** Phase 2.4 (Recommendation Engine) ve Phase 3.2 (Chatbot)

### Test Dosyaları

3. **`tests/services/test_openai_service.py`**
   - 10 unit test
   - Mock-based testing
   - Cache, error handling, batch processing testleri

4. **`scripts/test_openai_service.py`**
   - Manuel validation script
   - 6 integration test
   - API key, embedding, cache, explanation testleri

## 🧪 Test Etme

### Unit Tests (Mock)

```bash
cd backend
pytest tests/services/test_openai_service.py -v
```

**Çıktı örneği:**
```
test_openai_service.py::test_generate_embedding_success PASSED
test_openai_service.py::test_generate_embedding_cache_hit PASSED
test_openai_service.py::test_generate_explanation_success PASSED
...
```

### Manuel Validation (Gerçek API)

**Önemli:** Bu test gerçek OpenAI API kullanır ve token harcar!

```bash
cd backend
python -m scripts.test_openai_service
```

**Çıktı örneği:**
```
============================================================
OPENAI SERVICE VALIDATION TESTS
============================================================

TEST 1: API Key Configuration
✅ PASSED: API key is configured

TEST 2: Embedding Generation
Generating embedding for: '1984 George Orwell dystopian political fiction'
✅ PASSED: Generated embedding with 1536 dimensions

TEST 3: Redis Cache
First call (should be cache MISS)...
Second call (should be cache HIT)...
✅ PASSED: Redis cache is working correctly

TEST 4: Explanation Generation (GPT-4o)
------------------------------------------------------------
Bu kitabı sana öneriyorum çünkü distopya türüne olan ilgin
ve George Orwell gibi yazarları sevmen, Aldous Huxley'in
totaliter toplum eleştirisini kesinlikle beğeneceğini gösteriyor.
------------------------------------------------------------
✅ PASSED: Generated explanation

TEST SUMMARY
============================================================
✅ PASSED: API Key Configuration
✅ PASSED: Embedding Generation
✅ PASSED: Redis Cache
✅ PASSED: Explanation Generation
✅ PASSED: Batch Embeddings
✅ PASSED: Error Handling

Total: 6/6 tests passed
🎉 All tests passed! OpenAI service is working correctly.
```

## 💡 Kullanım Örnekleri

### Embedding Generation

```python
from app.services.openai_service import OpenAIService

service = OpenAIService()

# Single embedding
embedding = await service.generate_embedding(
    text="1984 George Orwell dystopian political fiction"
)
print(f"Embedding: {len(embedding)} dimensions")  # 1536

# Batch embeddings
texts = ["Book 1", "Book 2", "Book 3"]
embeddings = await service.generate_batch_embeddings(texts)
print(f"Generated {len(embeddings)} embeddings")

await service.close()
```

### Explanation Generation

```python
from app.services.openai_service import OpenAIService

service = OpenAIService()

explanation = await service.generate_explanation(
    user_profile={
        "favorite_genres": ["Sci-Fi", "Dystopia"],
        "reading_level": "advanced",
        "favorite_authors": ["George Orwell"]
    },
    book={
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "genre": "Dystopia",
        "description": "..."
    },
    context={
        "match_score": 0.92,
        "shared_themes": ["totalitarianism", "surveillance"]
    }
)

print(explanation)
# Output: "Bu kitabı sana öneriyorum çünkü..."

await service.close()
```

### LangChain Helper

```python
from app.services.langchain_helper import LangChainHelper

helper = LangChainHelper()

# Chatbot response
response = await helper.generate_chat_response(
    message="Bilim kurgu kitap önerir misin?",
    conversation_history=[
        {"role": "user", "content": "Merhaba"},
        {"role": "assistant", "content": "Merhaba! Sana nasıl yardımcı olabilirim?"}
    ]
)
print(response)
```

## 🎯 Özellikler

### ✅ Tamamlananlar

- [x] OpenAI API entegrasyonu (AsyncOpenAI)
- [x] Text embedding generation (text-embedding-3-large, 1536 dim)
- [x] GPT-4o açıklama üretimi (max 500 token)
- [x] Redis cache (30 gün TTL for embeddings)
- [x] Error handling & retry logic (tenacity, 3 retry, exponential backoff)
- [x] Token usage tracking & logging
- [x] Batch embedding processing
- [x] LangChain base setup (ChatOpenAI, OpenAIEmbeddings wrappers)
- [x] Unit tests (10 test, mock-based)
- [x] Manuel validation script (6 integration test)

### 🔧 Teknik Detaylar

**Retry Logic:**
- RateLimitError: 3 retry, exponential backoff (2-10 saniye)
- APIConnectionError: 3 retry, exponential backoff
- Diğer hatalar: Doğrudan raise

**Redis Cache:**
- Key format: `bibliomind:embedding:{sha256_hash[:16]}`
- TTL: 30 gün (embeddingler değişmez)
- Graceful degradation: Redis yoksa cache disabled

**Token Tracking:**
- Her API call'da input/output token loglanıyor
- Future: Database'e kaydedilip cost dashboard'da gösterilecek

## 📊 Cost Estimates

**OpenAI Pricing (Ocak 2026):**
- text-embedding-3-large: ~$0.13 per 1M tokens
- GPT-4o: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens

**Örnek Kullanım:**
- 10,000 kitap embedding: ~$0.50
- 1,000 açıklama generation: ~$5.00

**Cache Optimization:**
- Duplicate embedding requests: %95 cache hit rate bekleniyor
- Estimated cost reduction: %80-90

## 🔐 Güvenlik

- API key `.env` dosyasında (`.gitignore`'da)
- Production'da environment variables kullan
- Rate limiting config'den kontrol ediliyor
- Token limit enforcement (max 500 token)

## 📈 Sonraki Adımlar (Phase 2.2-2.4)

1. **Phase 2.2:** Google Cloud Vision API (OCR)
2. **Phase 2.3:** Book Data Pipeline (10K+ kitap embedding)
3. **Phase 2.4:** Recommendation Engine (OpenAIService kullanacak)

## 🐛 Troubleshooting

### "OpenAI API key is not configured"
**Çözüm:** `.env` dosyasına `OPENAI_API_KEY=sk-proj-...` ekle

### "Redis connection failed"
**Çözüm:** Redis container çalışıyor mu kontrol et: `docker-compose ps`
- Service cache disabled ama çalışmaya devam eder

### "Rate limit exceeded"
**Çözüm:** Birkaç dakika bekle veya API key limitlerini kontrol et

### Import hatası
**Çözüm:** Requirements'ı yükle: `pip install -r requirements.txt`

## 📞 İletişim

Sorular için: Kaan (AI-Backend Lead)

---

**Son Güncelleme:** 20 Ocak 2026  
**Durum:** ✅ Production Ready  
**Sonraki:** Phase 2.2 - Google Cloud Vision Integration
