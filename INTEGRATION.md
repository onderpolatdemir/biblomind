# BiblioMind - Entegrasyon Rehberi

**Amaç:** Ekip üyelerinin bağımsız çalıştıktan sonra birbirleriyle nasıl entegre olacağını açıklar.  
**Strateji:** Mock-First Development → API Contract → Real Integration

---

## 🎯 Entegrasyon Felsefesi

### Paralel Geliştirme
- Her ekip üyesi **kendi görevlerinde bağımsız** çalışır
- Frontend **mock API'lerle** başlar
- Backend **gerçek API'leri** geliştirir
- Belirli zamanlarda **entegrasyon** yapılır

### Entegrasyon Günleri
Her sprint'in **Çarşamba günü** entegrasyon günüdür:
- ✅ Hazır API'ler duyurulur
- 🔄 Mock → Real geçişi yapılır
- 🧪 Birlikte test edilir
- 🐛 Bulunan buglar çözülür

---

## 📅 Entegrasyon Takvimi

### Entegrasyon 1: Auth System (Hafta 2 Sonu)
**Tarih:** ~24 Ocak 2026  
**Kim → Kime:** Barış → Kaan  
**Ne:** Login/Register akışı

---

### Entegrasyon 2: Cart System (Hafta 4 Sonu)
**Tarih:** ~7 Şubat 2026  
**Kim → Kime:** Barış → Önder  
**Ne:** Sepet işlemleri

---

### Entegrasyon 3: Vision & Recommendation (Hafta 6 Sonu) ⭐ MAJOR
**Tarih:** ~21 Şubat 2026  
**Kim → Kime:** Barış → Kaan  
**Ne:** Fotoğraftan öneri (core feature)

---

### Entegrasyon 4: Checkout & Payment (Hafta 8 Sonu)
**Tarih:** ~7 Mart 2026  
**Kim → Kime:** Barış → Önder  
**Ne:** Ödeme akışı

---

## 🔄 Entegrasyon 1: Auth System

### Durum: Hafta 2 Sonu
**Kaan'ın Sorumluluğu:** Auth API hazır  
**Barış'ın Sorumluluğu:** Mock'tan gerçeğe geçiş

---

### ADIM 1: Kaan - API'yi Hazırla ve Test Et

#### 1.1 API Endpoints (Kaan)
```python
# backend/app/api/auth.py

@router.post("/register")
async def register(data: RegisterRequest):
    # Implementation
    return {
        "access_token": "...",
        "refresh_token": "...",
        "user": {
            "id": "...",
            "email": "...",
            "full_name": "..."
        }
    }

@router.post("/login")
async def login(data: LoginRequest):
    # Implementation
    return {
        "access_token": "...",
        "refresh_token": "...",
        "user": {...}
    }

@router.get("/me")
async def get_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh")
async def refresh_token(refresh_token: str):
    # Implementation
    return {"access_token": "..."}
```

#### 1.2 Test (Kaan)
```bash
# Test auth endpoints
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","full_name":"Test User"}'
```

#### 1.3 Entegrasyon Hazırlığı (Kaan)
- [ ] API documentation güncel (Swagger)
- [ ] CORS ayarları yapıldı (frontend URL'i izin listesinde)
- [ ] Error responses standardize edildi
- [ ] Barış'a bilgi verildi: "Auth API hazır!"

---

### ADIM 2: Barış - Mock'tan Real API'ye Geçiş

#### 2.1 Mevcut Durum (Barış - Hafta 1-2)
```typescript
// frontend/src/lib/api/mock/auth.ts
export const mockLogin = async (email: string, password: string) => {
  await sleep(500); // Simulate network
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

export const mockRegister = async (data: RegisterData) => {
  await sleep(500);
  return mockLogin(data.email, data.password);
};
```

#### 2.2 Real API Client (Barış - Hafta 2 Sonu)
```typescript
// frontend/src/lib/api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', data.access_token);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return axios(error.config);
        } catch {
          // Refresh failed, logout
          localStorage.clear();
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
```

#### 2.3 Real Auth Service (Barış - Hafta 2 Sonu)
```typescript
// frontend/src/lib/api/auth.ts
import { apiClient } from './client';

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};
```

#### 2.4 Zustand Store Güncelleme (Barış)
```typescript
// frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { authApi, type AuthResponse } from '@/lib/api/auth';

// MOCK IMPORT'U KALDIR:
// import { mockLogin, mockRegister } from '@/lib/api/mock/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      // ESKİ: const data = await mockLogin(email, password);
      // YENİ:
      const data = await authApi.login({ email, password });
      
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      // ESKİ: const response = await mockRegister(data);
      // YENİ:
      const response = await authApi.register(data);
      
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const user = await authApi.getCurrentUser();
      set({ user, isAuthenticated: true });
    } catch {
      authApi.logout();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
```

#### 2.5 Environment Variables (Barış)
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### ADIM 3: Birlikte Test

#### 3.1 Test Checklist
- [ ] **Register:** Yeni kullanıcı kayıt olabiliyor mu?
- [ ] **Login:** Kayıtlı kullanıcı giriş yapabiliyor mu?
- [ ] **Token Storage:** Token'lar localStorage'a kaydediliyor mu?
- [ ] **Protected Routes:** `/profile` gibi korumalı sayfalar çalışıyor mu?
- [ ] **Logout:** Çıkış yapınca token temizleniyor mu?
- [ ] **Token Refresh:** Token expire olunca otomatik yenileniyor mu?
- [ ] **Error Handling:** Yanlış şifre durumunda hata mesajı gösteriliyor mu?

#### 3.2 Test Senaryoları
```
1. Happy Path:
   - Register → Success → Redirected to /
   - Logout → Login → Success

2. Error Cases:
   - Register with existing email → Error
   - Login with wrong password → Error
   - Access protected route without token → Redirect to /auth/login

3. Edge Cases:
   - Token expires → Auto refresh → Request succeeds
   - Refresh token expires → Logout → Redirect to login
```

---

## 🔄 Entegrasyon 2: Cart System

### Durum: Hafta 4 Sonu
**Önder'in Sorumluluğu:** Cart API hazır  
**Barış'ın Sorumluluğu:** Mock'tan gerçeğe geçiş

---

### ADIM 1: Önder - API'yi Hazırla

#### 1.1 API Endpoints (Önder)
```python
# backend/app/api/cart.py

@router.post("/add")
async def add_to_cart(
    book_id: UUID,
    quantity: int = 1,
    current_user: User = Depends(get_current_user)
):
    # Implementation
    return {
        "cart": {...},
        "total_items": 3,
        "total_price": 150.50
    }

@router.get("/")
async def get_cart(current_user: User = Depends(get_current_user)):
    return {
        "items": [
            {
                "id": "...",
                "book": {...},
                "quantity": 2,
                "subtotal": 100.00
            }
        ],
        "total_items": 3,
        "total_price": 150.50
    }

@router.put("/item/{item_id}")
async def update_quantity(item_id: UUID, quantity: int):
    # Implementation
    pass

@router.delete("/item/{item_id}")
async def remove_item(item_id: UUID):
    # Implementation
    pass
```

#### 1.2 Test (Önder)
```bash
curl -X POST http://localhost:8000/api/cart/add \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"book_id":"...","quantity":1}'
```

---

### ADIM 2: Barış - Mock'tan Real API'ye Geçiş

#### 2.1 Mevcut Mock (Barış - Hafta 3-4)
```typescript
// frontend/src/lib/api/mock/cart.ts
export const mockAddToCart = async (bookId: string, quantity: number) => {
  await sleep(300);
  return {
    cart: { items: [...] },
    total_items: 3,
    total_price: 150.50
  };
};
```

#### 2.2 Real Cart API (Barış - Hafta 4 Sonu)
```typescript
// frontend/src/lib/api/cart.ts
import { apiClient } from './client';

export const cartApi = {
  getCart: async () => {
    const response = await apiClient.get('/api/cart');
    return response.data;
  },

  addToCart: async (bookId: string, quantity: number = 1) => {
    const response = await apiClient.post('/api/cart/add', {
      book_id: bookId,
      quantity,
    });
    return response.data;
  },

  updateQuantity: async (itemId: string, quantity: number) => {
    const response = await apiClient.put(`/api/cart/item/${itemId}`, {
      quantity,
    });
    return response.data;
  },

  removeItem: async (itemId: string) => {
    await apiClient.delete(`/api/cart/item/${itemId}`);
  },

  clearCart: async () => {
    await apiClient.post('/api/cart/clear');
  },
};
```

#### 2.3 React Query Hook (Barış)
```typescript
// frontend/src/hooks/useCart.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '@/lib/api/cart';

export const useCart = () => {
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const addToCart = useMutation({
    mutationFn: ({ bookId, quantity }: { bookId: string; quantity: number }) =>
      cartApi.addToCart(bookId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      cartApi.updateQuantity(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItem = useMutation({
    mutationFn: (itemId: string) => cartApi.removeItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cart,
    isLoading,
    addToCart,
    updateQuantity,
    removeItem,
  };
};
```

---

### ADIM 3: Test
- [ ] Add to cart çalışıyor
- [ ] Quantity update çalışıyor
- [ ] Remove item çalışıyor
- [ ] Cart badge güncelleniyor (navbar'da)
- [ ] Total price doğru hesaplanıyor

---

## 🔄 Entegrasyon 3: Vision & Recommendation ⭐

### Durum: Hafta 6 Sonu (MAJOR MILESTONE)
**Kaan'ın Sorumluluğu:** Vision + Recommendation API  
**Barış'ın Sorumluluğu:** Discovery UI entegrasyonu

---

### ADIM 1: Kaan - Vision API'yi Hazırla

#### 1.1 API Endpoint (Kaan)
```python
# backend/app/api/vision.py

@router.post("/analyze")
async def analyze_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks,
):
    # 1. Google Vision OCR
    detected_books = await vision_service.detect_books_from_image(file)
    
    # 2. Recommendation engine
    recommendations = await recommendation_service.recommend_from_photo(
        user_id=current_user.id,
        detected_books=detected_books
    )
    
    # 3. Save scan history
    background_tasks.add_task(save_photo_scan, current_user.id, detected_books, recommendations)
    
    return {
        "detected_books": detected_books,
        "recommendations": recommendations
    }
```

**Response Format:**
```json
{
  "detected_books": ["1984", "Brave New World", "Fahrenheit 451"],
  "recommendations": [
    {
      "book": {
        "id": "...",
        "title": "Animal Farm",
        "author": "George Orwell",
        "cover_url": "...",
        "price": 45.00
      },
      "match_score": 0.92,
      "explanation": "Bu kitabı seçtim çünkü 1984'ün distopik atmosferi ve toplumsal eleştirisi senin ilgi alanına çok uygun. Animal Farm da aynı yazarın politik alegori tarzını yansıtıyor."
    }
  ]
}
```

#### 1.2 Test (Kaan)
```bash
curl -X POST http://localhost:8000/api/vision/analyze \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test_library.jpg"
```

---

### ADIM 2: Barış - Discovery UI Entegrasyonu

#### 2.1 Mevcut Mock (Barış - Hafta 5-6)
```typescript
// frontend/src/lib/api/mock/vision.ts
export const mockAnalyzePhoto = async (file: File) => {
  await sleep(3000); // Simulate processing
  return {
    detected_books: ["1984", "Brave New World"],
    recommendations: [...]
  };
};
```

#### 2.2 Real Vision API (Barış - Hafta 6 Sonu)
```typescript
// frontend/src/lib/api/vision.ts
import { apiClient } from './client';

export interface AnalyzePhotoResponse {
  detected_books: string[];
  recommendations: Recommendation[];
}

export const visionApi = {
  analyzePhoto: async (file: File): Promise<AnalyzePhotoResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/vision/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Long timeout for image processing
      timeout: 30000,
    });

    return response.data;
  },
};
```

#### 2.3 Discovery Page Update (Barış)
```typescript
// frontend/src/app/discover/page.tsx
'use client';

import { useState } from 'react';
import { visionApi } from '@/lib/api/vision';
// KALDIR: import { mockAnalyzePhoto } from '@/lib/api/mock/vision';

export default function DiscoverPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = async (file: File) => {
    setIsAnalyzing(true);
    try {
      // ESKİ: const data = await mockAnalyzePhoto(file);
      // YENİ:
      const data = await visionApi.analyzePhoto(file);
      setResults(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      // Show error toast
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <PhotoUploader onUpload={handleUpload} />
      {isAnalyzing && <LoadingStates />}
      {results && <RecommendationResults data={results} />}
    </div>
  );
}
```

---

### ADIM 3: Test (ÇOK ÖNEMLİ!)
- [ ] Fotoğraf yükleniyor
- [ ] OCR kitap isimlerini çıkarıyor (%70+ doğruluk)
- [ ] Öneriler geliyor (5 kitap)
- [ ] Açıklamalar anlamlı ve kişiselleştirilmiş
- [ ] Match score gösteriliyor
- [ ] Add to cart çalışıyor (Önder'in API'si)
- [ ] End-to-end test: Fotoğraf → Öneriler → Sepet → Checkout

---

## 🔄 Entegrasyon 4: Checkout & Payment

### Durum: Hafta 8 Sonu
**Önder'in Sorumluluğu:** Payment API + Order API  
**Barış'ın Sorumluluğu:** Checkout UI

---

### ADIM 1: Önder - Payment API

```python
# backend/app/api/payment.py

@router.post("/initialize")
async def initialize_payment(order_id: UUID):
    # İyzico payment initialization
    payment_url = await payment_service.initialize_payment(order_id)
    return {"payment_url": payment_url}

@router.post("/callback")
async def payment_callback(data: PaymentCallbackData):
    # İyzico webhook
    success = await payment_service.verify_payment(data)
    if success:
        # Update order status
        pass
    return {"success": success}
```

---

### ADIM 2: Barış - Checkout UI

```typescript
// frontend/src/app/checkout/page.tsx

const handleCheckout = async () => {
  // 1. Create order
  const order = await ordersApi.createOrder();
  
  // 2. Initialize payment
  const { payment_url } = await paymentApi.initializePayment(order.id);
  
  // 3. Redirect to payment iframe or page
  window.location.href = payment_url;
};
```

---

### ADIM 3: Test
- [ ] Order oluşturuluyor
- [ ] İyzico payment sayfası açılıyor
- [ ] Test card ile ödeme yapılabiliyor
- [ ] Callback sonrası order status güncelleniyor
- [ ] Success page gösteriliyor

---

## 🛠️ Genel Entegrasyon Kuralları

### 1. API Contract First
Her sprint başında **API Contract Meeting**:
- Endpoint URL'leri
- Request/Response formatları
- Error codes
- Authentication requirements

### 2. Mock Data Quality
Mock'lar **gerçekçi** olmalı:
- Gerçek data formatları
- Gerçekçi gecikme (network latency)
- Error scenarios

### 3. Error Handling
Her iki tarafta da error handling:
- Backend: Standardize error responses
- Frontend: User-friendly error messages

### 4. Documentation
- API değişikliği → Swagger güncelle
- Frontend değişikliği → Component docs güncelle

### 5. Testing
Entegrasyon sonrası **mutlaka test**:
- Happy path
- Error cases
- Edge cases

---

## 📝 Entegrasyon Checklist Template

Her entegrasyon için bu checklist'i kullanın:

```markdown
## Entegrasyon: [ÖZELLIK ADI]

### Ön Hazırlık
- [ ] API contract belirlendi
- [ ] Mock data hazırlandı
- [ ] Backend API tamamlandı ve test edildi
- [ ] Frontend mock ile çalışıyor

### Entegrasyon
- [ ] Real API client oluşturuldu
- [ ] Mock import'ları kaldırıldı
- [ ] Environment variables ayarlandı
- [ ] Error handling eklendi

### Test
- [ ] Happy path test edildi
- [ ] Error cases test edildi
- [ ] Edge cases test edildi
- [ ] Performance kabul edilebilir

### Dokümantasyon
- [ ] API docs güncellendi
- [ ] README güncellendi
- [ ] context.md güncellendi
```

---

## 🚨 Yaygın Sorunlar ve Çözümler

### CORS Hatası
**Sorun:** Frontend API'ye istek atamıyor  
**Çözüm:**
```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 401 Unauthorized
**Sorun:** Token gönderilmiyor  
**Çözüm:** Axios interceptor'ı kontrol et

### 500 Internal Server Error
**Sorun:** Backend'de hata  
**Çözüm:** Backend logs'u kontrol et

### Network Error
**Sorun:** Backend çalışmıyor  
**Çözüm:** `docker-compose ps` ile servisleri kontrol et

---

## 📞 Entegrasyon Günü İletişim Protokolü

### Sabah 10:00 - Durum Toplantısı
- Kaan: Hangi API'ler hazır?
- Barış: Hangi UI'ler entegre edilecek?
- Önder: Hangi API'ler hazır?

### 10:30-12:00 - Entegrasyon Çalışması
- Paralel çalışma
- Slack'te sürekli iletişim
- Blocker varsa hemen bildir

### 12:00-13:00 - Öğle Arası

### 13:00-15:00 - Test & Debug
- Birlikte test
- Bug fix
- Edge case handling

### 15:00-16:00 - Dokümantasyon
- API docs güncelle
- context.md güncelle
- Next sprint için notlar

### 16:00 - Retrospektif
- Ne iyi gitti?
- Ne zorlandık?
- Gelecek entegrasyonda ne değiştirelim?

---

**Son Güncelleme:** 13 Ocak 2026  
**Günceleyen:** AI Assistant

**Önemli:** Her entegrasyon sonrası bu dosyayı güncelleyin! ✅
