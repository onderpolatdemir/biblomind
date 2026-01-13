# BiblioMind - Hızlı Başlangıç Rehberi

**Ekip için ilk adım rehberi** 🚀

---

## 👥 Ekip Üyeleri

- **Kaan** - AI & Backend Lead
- **Barış** - Frontend UI/UX Developer
- **Önder** - E-ticaret & Admin Developer

---

## 📚 Önce Oku

1. **[context.md](./context.md)** - Proje durumu ve yapılacaklar
2. **[team-roles.md](./team-roles.md)** - Senin görevlerin
3. **[API-CONTRACT.md](./API-CONTRACT.md)** - API tanımları

---

## 🔧 Kaan - İlk Adımlar

### 1. Backend Setup
```bash
cd backend

# Virtual environment oluştur
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Paketleri yükle
pip install -r requirements.txt
```

### 2. Environment Variables
```bash
# backend/.env dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle:
# - DATABASE_URL
# - OPENAI_API_KEY
# - GOOGLE_APPLICATION_CREDENTIALS
# - SECRET_KEY (generate: python -c "import secrets; print(secrets.token_urlsafe(32))")
```

### 3. Docker Compose Oluştur
```yaml
# docker-compose.yml (kök dizinde)
version: '3.8'

services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: bibliomind
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

volumes:
  postgres_data:
  es_data:
```

### 4. Servisleri Başlat
```bash
# Docker servislerini başlat
docker-compose up -d

# Servislerin durumunu kontrol et
docker-compose ps

# Logları gör
docker-compose logs -f postgres
```

### 5. Database Migration
```bash
cd backend

# Alembic init (eğer yoksa)
alembic init alembic

# Migration oluştur
alembic revision --autogenerate -m "Initial schema"

# Migration çalıştır
alembic upgrade head
```

### 6. FastAPI Başlat
```bash
cd backend

# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Test et
curl http://localhost:8000/health

# Swagger UI
# http://localhost:8000/docs
```

### 7. İlk Görevler (team-roles.md'ye bak)
- [ ] Docker Compose tamamla
- [ ] Database schema oluştur
- [ ] FastAPI core setup
- [ ] Auth API endpoints

---

## 🎨 Barış - İlk Adımlar

### 1. Frontend Setup
```bash
cd frontend

# Paketleri yükle
npm install

# Development server başlat
npm run dev

# http://localhost:3000
```

### 2. Environment Variables
```bash
# frontend/.env.local dosyası oluştur
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK_API=true  # İlk başta mock ile çalış
```

### 3. shadcn/ui Setup
```bash
cd frontend

# shadcn/ui init
npx shadcn-ui@latest init

# Sorulara cevaplar:
# - TypeScript: Yes
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes
```

### 4. İlk Component'leri Ekle
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add toast
```

### 5. Mock API Klasörü Oluştur
```bash
cd frontend/src
mkdir -p lib/api/mock

# Mock auth service oluştur
touch lib/api/mock/auth.ts
```

**Mock örneği:**
```typescript
// frontend/src/lib/api/mock/auth.ts
export const mockLogin = async (email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network
  return {
    access_token: "mock-jwt-token",
    refresh_token: "mock-refresh-token",
    user: {
      id: "1",
      email: email,
      full_name: "Mock User"
    }
  };
};
```

### 6. İlk Görevler (team-roles.md'ye bak)
- [ ] Design system setup
- [ ] Layout & navigation
- [ ] Auth UI (mock ile)
- [ ] Mock API services

---

## 🛒 Önder - İlk Adımlar

### 1. Backend Ortamı (Kaan'ın kurduğunu kullan)
```bash
cd backend

# Kaan'ın virtual environment'ını aktive et
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

### 2. Cart Models Oluştur
```bash
cd backend/app/models

# cart.py dosyası oluştur
touch cart.py
```

**Model örneği:**
```python
# backend/app/models/cart.py
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.core.database import Base

class Cart(Base):
    __tablename__ = "carts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    items = relationship("CartItem", back_populates="cart")
    user = relationship("User", back_populates="cart")

class CartItem(Base):
    __tablename__ = "cart_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cart_id = Column(UUID(as_uuid=True), ForeignKey("carts.id"))
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"))
    quantity = Column(Integer, default=1)
    
    cart = relationship("Cart", back_populates="items")
    book = relationship("Book")
```

### 3. Cart API Endpoints Oluştur
```bash
cd backend/app/api

# cart.py dosyası oluştur
touch cart.py
```

**API örneği:**
```python
# backend/app/api/cart.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User
from app.api.auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.post("/add")
async def add_to_cart(
    book_id: str,
    quantity: int = 1,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Implementation
    return {"message": "Added to cart"}

@router.get("/")
async def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Implementation
    return {"items": [], "total": 0}
```

### 4. API'yi main.py'ye ekle
```python
# backend/app/main.py
from app.api import cart

app.include_router(cart.router)
```

### 5. İlk Görevler (team-roles.md'ye bak)
- [ ] Cart models
- [ ] Cart API endpoints
- [ ] Order models
- [ ] Payment service skeleton

---

## 🔄 Haftalık Ritüel

### Pazartesi 10:00 - Sprint Planning
- context.md'yi incele
- Bu haftanın görevlerini belirle
- API Contract meeting (Kaan ne API hazırlayacak?)

### Çarşamba 15:00 - Entegrasyon Günü
- Hazır API'leri entegre et
- Mock → Real API geçişi
- Birlikte test et

### Cuma 17:00 - Demo & Retrospektif
- Haftalık ilerlemeyi göster
- Karşılaşılan sorunları paylaş
- Gelecek hafta için plan

---

## 📝 İlk Hafta Hedefleri

### Kaan
- [ ] Docker ortamı çalışıyor
- [ ] Database schema oluşturuldu
- [ ] Auth API hazır ve test edildi
- [ ] Swagger docs güncel

### Barış
- [ ] Next.js projesi çalışıyor
- [ ] Design system kuruldu
- [ ] Layout hazır
- [ ] Auth UI (mock ile) çalışıyor

### Önder
- [ ] Cart models tasarlandı
- [ ] Cart API endpoints başladı
- [ ] Order models tasarlandı
- [ ] API test edildi

---

## 🆘 Sorun Giderme

### Docker servisleri başlamıyor
```bash
# Portları kontrol et
docker-compose ps

# Logları incele
docker-compose logs -f

# Servisleri yeniden başlat
docker-compose restart

# Her şeyi sıfırla
docker-compose down -v
docker-compose up -d
```

### Import hatası (Python)
```bash
# Virtual environment aktif mi kontrol et
which python  # Linux/Mac
where python  # Windows

# Paketleri tekrar yükle
pip install -r requirements.txt
```

### npm install hataları
```bash
# Node modules sil
rm -rf node_modules package-lock.json

# Tekrar yükle
npm install

# Cache temizle
npm cache clean --force
```

### Database connection hatası
```bash
# PostgreSQL çalışıyor mu?
docker-compose ps postgres

# Connection string doğru mu?
# .env dosyasında DATABASE_URL kontrol et
```

---


### Blocker Durumunda
- Hemen bildir, bekleme!
- Ekip yardım edecektir

### API Değişikliği
- Mutlaka duyur
- API-CONTRACT.md'yi güncelle
- Bağımlı kişileri bilgilendir

---

## 🎯 Başarı Kriterleri

### Hafta 2 Sonu
- [ ] Docker ortamı herkes kullanabiliyor
- [ ] Auth API + UI entegre çalışıyor
- [ ] Herkes kendi alanında bağımsız çalışabiliyor

### Hafta 4 Sonu
- [ ] Kitap CRUD çalışıyor
- [ ] Cart UI + API entegre
- [ ] Search çalışıyor

### Hafta 8 Sonu (MVP)
- [ ] Fotoğraftan öneri çalışıyor ⭐
- [ ] End-to-end flow test edildi
- [ ] Demo hazır

---

## 📚 Faydalı Linkler

- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [pgvector](https://github.com/pgvector/pgvector)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Cloud Vision](https://cloud.google.com/vision/docs)

---

**Hazır mısınız? Hadi başlayalım! 🚀**

İlk olarak:
1. `context.md` dosyasını oku
2. `team-roles.md`'de kendi görevlerini bul
3. Yukarıdaki adımları takip et
4. Blocker olursa hemen iletişim!

**Son Güncelleme:** 13 Ocak 2026
