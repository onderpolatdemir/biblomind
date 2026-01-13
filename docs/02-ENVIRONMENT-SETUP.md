# Environment Variables Setup Guide

Bu dosya, `.env` dosyalarınızı oluşturmanız için gerekli tüm bilgileri içerir.

---

## 📦 Backend Environment Variables

`backend/.env` dosyası oluşturun:

```bash
# ===== Application Settings =====
APP_NAME=BiblioMind
APP_VERSION=0.1.0
DEBUG=True
ENVIRONMENT=development

# ===== Server Settings =====
HOST=0.0.0.0
PORT=8000

# ===== Database Settings =====
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bibliomind
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# ===== Redis Settings =====
REDIS_URL=redis://localhost:6379/0

# ===== Elasticsearch Settings =====
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=books

# ===== JWT Settings =====
# Generate SECRET_KEY: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=your-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ===== CORS Settings =====
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_ALLOW_CREDENTIALS=True

# ===== OpenAI Settings =====
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_EMBEDDING_DIMENSIONS=1536
OPENAI_LLM_MODEL=gpt-4o
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# ===== Google Cloud Vision Settings =====
# Place your JSON key file in backend/credentials/
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-vision-key.json
GOOGLE_VISION_CONFIDENCE_THRESHOLD=0.7

# ===== Payment Gateway (İyzico) =====
# Get from: https://sandbox-merchant.iyzipay.com/
IYZICO_API_KEY=your-iyzico-api-key
IYZICO_SECRET_KEY=your-iyzico-secret-key
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# ===== Email Settings =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-email-app-password
SMTP_FROM_EMAIL=noreply@bibliomind.com
SMTP_FROM_NAME=BiblioMind

# ===== File Upload Settings =====
MAX_UPLOAD_SIZE_MB=10
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg

# ===== Cache Settings =====
CACHE_TTL_SECONDS=3600
CACHE_PREFIX=bibliomind

# ===== Rate Limiting =====
RATE_LIMIT_PER_MINUTE=60
VISION_API_RATE_LIMIT_PER_DAY=1000

# ===== Logging =====
LOG_LEVEL=INFO
LOG_FORMAT=json

# ===== Admin Settings =====
ADMIN_EMAIL=admin@bibliomind.com
ADMIN_PASSWORD=change-this-in-production

# ===== Feature Flags =====
ENABLE_CHATBOT=True
ENABLE_SOCIAL_FEATURES=True
ENABLE_ADMIN_PANEL=True
```

---

## 🎨 Frontend Environment Variables

`frontend/.env.local` dosyası oluşturun:

```bash
# ===== API Settings =====
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# ===== App Settings =====
NEXT_PUBLIC_APP_NAME=BiblioMind
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== Mock Mode (Development) =====
# İlk başta true yapın, backend hazır olunca false
NEXT_PUBLIC_USE_MOCK_API=true

# ===== Feature Flags =====
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_SOCIAL_FEATURES=true
NEXT_PUBLIC_ENABLE_PWA=true

# ===== Image Settings =====
NEXT_PUBLIC_MAX_IMAGE_SIZE_MB=10
NEXT_PUBLIC_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/jpg

# ===== Payment Settings =====
NEXT_PUBLIC_IYZICO_SANDBOX=true

# ===== Analytics (Optional) =====
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 🔑 API Keys Nasıl Alınır?

### OpenAI API Key
1. https://platform.openai.com/ adresine git
2. Sign up / Login
3. Sol menüden "API keys" seç
4. "Create new secret key" tıkla
5. Key'i kopyala ve `OPENAI_API_KEY` değişkenine yapıştır

**Not:** OpenAI API ücretlidir. İlk kayıt bonus kredisi verebilir.

### Google Cloud Vision API
1. https://console.cloud.google.com/ adresine git
2. Yeni proje oluştur (BiblioMind)
3. "APIs & Services" > "Library" git
4. "Cloud Vision API" ara ve enable et
5. "Credentials" sayfasına git
6. "Create Credentials" > "Service Account" seç
7. JSON key indir
8. `backend/credentials/google-vision-key.json` olarak kaydet

**Not:** İlk 1000 istek/ay ücretsizdir.

### İyzico API (Opsiyonel - Ödeme için)
1. https://sandbox-merchant.iyzipay.com/ adresine git (test ortamı)
2. Kayıt ol
3. Dashboard'dan API ve Secret Key'i al
4. `.env` dosyasına ekle

**Not:** Production için https://merchant.iyzipay.com/ kullanılacak.

---

## 🔒 Güvenlik Notları

### SECRET_KEY Oluşturma
```bash
# Python ile random key oluştur
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### .env Dosyalarını Koruma
```bash
# .gitignore dosyasında olduğundan emin ol:
*.env
.env.local
.env*.local
credentials/
```

**ASLA** `.env` dosyalarını Git'e commit etme!

---

## 📁 Credentials Klasörü

Google Vision key için:

```bash
mkdir -p backend/credentials
# google-vision-key.json dosyasını buraya koy
```

`.gitignore` içinde:
```
credentials/
*.json
```

---

## ✅ Environment Variables Kontrolü

### Backend Test
```bash
cd backend
python -c "from app.core.config import settings; print(settings.OPENAI_API_KEY[:10] + '...')"
```

### Frontend Test
```bash
cd frontend
npm run dev
# Browser console'da:
console.log(process.env.NEXT_PUBLIC_API_URL)
```

---

## 🚨 Yaygın Hatalar

### "OPENAI_API_KEY not found"
- `.env` dosyası doğru yerde mi? (`backend/.env`)
- Key doğru formatta mı? (`sk-...` ile başlamalı)
- Virtual environment aktif mi?

### "Database connection failed"
- Docker PostgreSQL çalışıyor mu? (`docker-compose ps`)
- `DATABASE_URL` doğru mu?
- Port 5432 kullanımda mı başka bir servis tarafından?

### "CORS error" (Frontend)
- `CORS_ORIGINS` içinde frontend URL var mı?
- Backend çalışıyor mu?
- URL'ler tam olarak eşleşiyor mu? (trailing slash yok)

---

## 📝 Production Notları

Production'a deploy ederken:

```bash
# Backend
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=<strong-random-key>
DATABASE_URL=<production-db-url>
IYZICO_BASE_URL=https://api.iyzipay.com  # Sandbox değil!

# Frontend
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_API_URL=https://api.bibliomind.com
```

---

**Son Güncelleme:** 13 Ocak 2026  
**Güncelleyen:** AI Assistant
