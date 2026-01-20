# BiblioMind - Final Product Vision (Hedef Sistem)

**Amaç:** Tüm ekip üyelerinin görevlerini %100 tamamladığında sistemin sahip olacağı özellikleri açıklar.  
**Kullanım:** Proje sonunda nereye ulaşacağımızı gösterir.  
**Güncelleme:** 20 Ocak 2026

---

## 🎯 PROJE VİZYONU

BiblioMind, fiziksel kitaplıkları dijital keşif alanına dönüştüren AI platformu. Kullanıcı bir kitaplığın fotoğrafını çeker, yapay zeka o kitaplar arasından kullanıcıya en uygun olanları bulur ve **NEDEN** bu kitapları önerdiğini açıklar.

---

## 📊 GENEL BAKIŞ

### Tamamlanmış Sistem İçerecek:
- ✅ **20+ Ana Özellik**
- ✅ **40+ API Endpoint**
- ✅ **25+ UI Sayfası/Component**
- ✅ **9 Database Model**
- ✅ **4 AI/ML Servisi**
- ✅ **Full E-ticaret Sistemi**
- ✅ **Admin Panel**
- ✅ **Mobile-optimized + PWA**

---

## 🚀 CORE FEATURES (Ana Özellikler)

### 1. 📸 Fotoğraftan Kitap Tanıma ve AI Öneri Sistemi ⭐

**Sorumluluk:** Kaan (AI-Backend Lead)

**Teknoloji Stack:**
- Google Cloud Vision API (OCR + Object Detection)
- OpenAI GPT-4o (açıklama üretimi, max 500 token)
- OpenAI text-embedding-3-large (1536 boyut)
- pgvector (cosine similarity)
- LangChain (RAG pipeline)

**Backend Fonksiyonlar:**
- Fotoğraf yükleme endpoint (`POST /api/vision/analyze`)
- 4 yönlü OCR (dikey yazıları algılama)
- Fuzzy matching (benzer kitap isimlerini bulma)
- Kullanıcı profil vektörü oluşturma (preferences_vector)
- Top-5 kişiselleştirilmiş öneri (cosine similarity)
- Her öneri için GPT-4o destekli açıklama ("Bu kitabı NEDEN öneriyorum")
- Match score hesaplama (0.0-1.0)
- Öneri geçmişi kaydetme (PhotoScan modeli)
- Redis caching (embedding'ler)
- Token usage tracking
- Error handling & retry logic

**Frontend UI - Discovery Page (`/discover`):**
- Hero section (açıklama + örnek görsel + CTA)
- Photo uploader component:
  - Drag & drop zone (react-dropzone)
  - Kamera butonu (mobil cihazlar için)
  - Image preview + crop tool
  - File validation (jpg/png, max 10MB)
  - Error messages (file too large, wrong type)
- Loading states (multi-step):
  - "Fotoğraf yükleniyor..." (0-30%)
  - "Kitaplar tanınıyor..." (30-70% - progress bar)
  - "Öneriler hazırlanıyor..." (70-100%)
- Results section:
  - Detected books listesi (colorful badges)
  - Recommendation cards (5 adet):
    - Book cover image (responsive)
    - Title, author, genre badges
    - Match score (progress ring veya yıldız gösterimi)
    - Explanation text (collapsible accordion)
    - Price ve stock info
    - "Add to cart" butonu (instant feedback)
    - "Learn more" butonu (→ book detail)
  - Share butonu (link kopyalama)
  - "Try another photo" butonu
- Smooth animations (framer-motion)
- Responsive (mobile, tablet, desktop)

**Performans Hedefleri:**
- API response time: < 5 saniye
- OCR accuracy: > 70%
- Recommendation relevance: User feedback > 4/5

---

### 2. 🔍 Anlamsal Kitap Arama ve Keşif

**Sorumluluk:** Kaan (Backend), Barış (Frontend UI)

**Teknoloji Stack:**
- Elasticsearch 8.11 (full-text search)
- pgvector (semantic search)
- Hybrid search (keyword + embedding)

**Backend Fonksiyonlar:**
- Text-based arama (`GET /api/books/search?q=...`)
- Elasticsearch fuzzy matching
- Turkish analyzer support
- Semantic search (embedding-based similarity)
- Hybrid search scoring (keyword + semantic)
- Auto-sync (her CRUD işleminde Elasticsearch güncellenir)
- Filter: genre, author, price range
- Sort: price, popularity, newest, title, author
- Pagination (page, page_size)

**Frontend UI - Books List Page (`/books`):**
- Search bar (autocomplete, debounced)
- Filter sidebar (sticky):
  - Genre multi-select (checkboxes)
  - Price range slider (min-max)
  - Author autocomplete (async search)
  - "Clear filters" butonu
- Sort dropdown (price↑↓, newest, popular, A-Z)
- View toggle (grid/list icons)
- Book cards grid (responsive 1-2-3-4 columns):
  - Cover image (lazy loading)
  - Title, author
  - Price, discount badge
  - Stock status (In Stock/Out of Stock)
  - Genre badges (max 2 visible)
  - Quick "Add to cart" butonu
  - Heart icon (add to favorites)
- Pagination controls (prev/next + page numbers)
- Empty state ("No books found" + suggestions)
- Loading skeletons

**Frontend UI - Book Detail Page (`/books/[id]`):**
- Left column (sticky):
  - Large cover image (zoomable)
  - Image gallery (if multiple)
- Right column:
  - Title (H1)
  - Author (link → author page)
  - Genre badges (clickable → filter)
  - Rating stars + review count
  - Full description (expandable)
  - ISBN, publisher, year
  - Stock status
  - Price (original + discounted)
  - Quantity selector (+/- buttons)
  - "Add to cart" butonu (sticky on scroll)
  - "Add to favorites" butonu
- Bottom sections:
  - Related books carousel (horizontal scroll)
  - Reviews section (opsiyonel)
  - "Frequently bought together" (opsiyonel)
- Breadcrumb navigation
- Share buttons (social media)

---

### 3. 💬 Akıllı Chatbot (Book Buddy Chat)

**Sorumluluk:** Kaan (Backend), Barış (Frontend UI)

**Teknoloji Stack:**
- LangChain ConversationBufferMemory
- GPT-4o (conversational AI)
- Redis (session storage)
- RAG (Retrieval Augmented Generation)
- WebSocket (real-time messaging - opsiyonel)

**Backend Fonksiyonlar:**
- `POST /api/chat/message` - Mesaj gönderme
- `GET /api/chat/history` - Sohbet geçmişi
- Conversation memory (son 10 mesaj)
- Context retrieval (kullanıcı profili + kitap veritabanı)
- Quick reply suggestions (AI-generated)
- Kitap önerileri (inline book cards)
- Session timeout (30 dakika)
- Rate limiting (abuse prevention)

**Frontend UI - Floating Chat Widget:**
- Bottom-right floating buton (badge: unread count)
- Chat window (açılır/kapanır, 400px width):
  - Header (title + minimize/close butonları)
  - Message bubbles (user/bot):
    - Avatar + name
    - Timestamp
    - Message text (markdown support)
    - Inline book cards (cover + quick add to cart)
  - Typing indicator (3 dots animation)
  - Quick reply buttons (suggestions)
  - Input field (textarea, auto-resize)
  - Send butonu (Enter to send)
  - Emoji picker (opsiyonel)
- Bottom actions:
  - "Clear conversation" butonu
  - "End chat" butonu
- Auto-scroll to bottom (new messages)
- Toast notifications (yeni mesaj geldiğinde)
- Responsive (mobile: full screen overlay)

---

### 4. 👥 Sosyal Eşleştirme (Book Buddy Finder)

**Sorumluluk:** Kaan (Backend Algorithm), Barış (Frontend UI)

**Teknoloji Stack:**
- User similarity algorithm (cosine similarity)
- Shared preferences analysis (vector-based)
- pgvector

**Backend Fonksiyonlar:**
- `GET /api/social/find-buddies?limit=10`
- User vector similarity computation
- Shared genres, authors detection
- Mutual favorite books
- Similarity score (0.0-1.0)
- Privacy settings (who can find me)

**Frontend UI - Book Buddies Page (`/book-buddies`):**
- Hero section ("Find your reading soulmates")
- User match cards grid (2-3 columns):
  - Avatar (fallback: initials)
  - Full name
  - Similarity score (% with color ring)
  - Shared interests (genre badges, max 3)
  - Mutual favorite books (covers, max 3)
  - "Connect" butonu
  - "View profile" link
- Filter sidebar:
  - Similarity threshold slider
  - Shared genre filter
- Sort dropdown (similarity, newest)
- Pagination
- Empty state ("No buddies found yet")
- Privacy toggle ("Allow others to find me")

**Frontend UI - Shared Interests Page (`/social/shared-interests/[user_id]`):**
- User comparison view (side-by-side):
  - Your profile | Their profile
  - Shared genres (Venn diagram - opsiyonel)
  - Shared authors (list)
  - Mutual favorite books (grid)
- Recommended books section:
  - "Books [name] loved that you might like"
  - Book cards (standard format)

---

## 🛒 E-TİCARET ÖZELLİKLERİ

### 5. Alışveriş Sepeti

**Sorumluluk:** Önder (Backend), Barış (Frontend UI)

**Backend Fonksiyonlar:**
- `POST /api/cart/add` - Sepete ekleme
- `GET /api/cart` - Sepeti görüntüleme
- `PUT /api/cart/item/{id}` - Quantity update
- `DELETE /api/cart/item/{id}` - Item kaldırma
- `POST /api/cart/clear` - Sepeti temizleme
- Stock validation (add/update sırasında)
- Real-time total price calculation
- Session-based cart (guest users - opsiyonel)
- Cart merge (guest → logged in)

**Frontend UI - Cart Page (`/cart`):**
- Cart header (item count + "Continue shopping" link)
- Cart items list:
  - Book info (cover thumbnail + title + author)
  - Price (unit price + subtotal)
  - Quantity selector (+/- buttons, direct input)
  - Stock warning (if low stock)
  - Remove butonu (trash icon + confirmation)
  - "Save for later" butonu (opsiyonel)
- Cart summary (sticky sidebar on desktop):
  - Subtotal
  - Shipping cost (free over 150 TL)
  - Tax (KDV)
  - Total (bold, large font)
  - "Proceed to checkout" butonu (primary CTA)
  - "Apply coupon" field (opsiyonel)
- Empty cart state:
  - Illustration
  - "Your cart is empty" message
  - "Browse books" butonu
- Cart badge (navbar):
  - Item count bubble
  - Dropdown mini-cart (hover - opsiyonel)

---

### 6. Checkout ve Ödeme

**Sorumluluk:** Önder (Backend + Payment Integration), Barış (Frontend UI)

**Teknoloji Stack:**
- İyzico Payment Gateway (sandbox + production)
- SMTP (order confirmation emails)

**Backend Fonksiyonlar:**
- `POST /api/orders/create` - Sipariş oluşturma
- `POST /api/payment/initialize` - İyzico payment başlatma
- `POST /api/payment/callback` - İyzico webhook
- `GET /api/payment/status/{order_id}` - Ödeme durumu
- Order status workflow (PENDING → PAID → SHIPPED → DELIVERED)
- Email notifications:
  - Order confirmation
  - Shipping notification
  - Delivery confirmation
- Transaction logging
- Fraud detection (basic)

**Frontend UI - Checkout Page (`/checkout`):**
- Progress stepper (1. Address → 2. Payment → 3. Review)
- **Step 1: Shipping Address**
  - Form fields:
    - Full name
    - Phone number
    - Address line 1 & 2
    - City (dropdown)
    - Postal code
    - Country (default: Turkey)
  - "Save this address" checkbox
  - Saved addresses dropdown (returning users)
  - "Use billing address" toggle
  - "Continue to payment" butonu
  - Form validation (real-time + on submit)
- **Step 2: Payment Method**
  - İyzico payment iframe (embedded)
  - Test card info (sandbox mode)
  - Security badges (SSL, PCI-DSS)
  - "Back" + "Pay now" butonları
- **Step 3: Order Summary**
  - Items list (compact view)
  - Shipping address (editable link)
  - Payment method
  - Total breakdown
  - Terms & conditions checkbox
  - "Place order" butonu (loading state)
- Mobile: Accordion view (one step at a time)
- Auto-save (form data in localStorage)

**Frontend UI - Order Success Page (`/checkout/success?order_id=...`):**
- Success icon (checkmark animation)
- "Order confirmed!" message
- Order ID (copyable)
- Estimated delivery date
- Order summary (items + total)
- "Track order" butonu
- "Continue shopping" butonu
- Email confirmation notice

**Frontend UI - Order Error Page (`/checkout/error`):**
- Error icon
- Error message (from payment gateway)
- Order details (if order was created)
- "Try again" butonu
- "Contact support" link

---

### 7. Sipariş Yönetimi

**Sorumluluk:** Önder (Backend), Barış (Frontend UI)

**Backend Fonksiyonlar:**
- `GET /api/orders?page=1&status=SHIPPED` - Kullanıcı siparişleri
- `GET /api/orders/{id}` - Sipariş detayı
- `PUT /api/orders/{id}/status` - Status güncelleme (admin only)
- Status tracking (timeline)
- Email notifications (status changes)
- Invoice generation (PDF - opsiyonel)

**Frontend UI - Orders Page (`/orders`):**
- Page header ("My Orders")
- Filter tabs (All, Pending, Shipped, Delivered, Cancelled)
- Order cards list (timeline view):
  - Order ID + date
  - Status badge (color-coded: yellow=pending, blue=shipped, green=delivered)
  - Items preview (thumbnails, max 3 + count)
  - Total price
  - "View details" butonu
  - "Track order" butonu (if shipped)
- Pagination
- Empty state ("No orders yet")

**Frontend UI - Order Detail Modal/Page:**
- Header (Order ID + status badge)
- Status timeline (progress bar):
  - PENDING → PAID → SHIPPED → DELIVERED
  - Timestamps for each step
- Order items list (expandable):
  - Cover + title + author
  - Quantity + price
- Shipping info:
  - Address
  - Shipping method
  - Tracking number (if available)
- Payment info:
  - Payment method
  - Transaction ID
  - Date
- Total breakdown (subtotal + shipping + tax + total)
- Actions:
  - "Download invoice" (PDF)
  - "Cancel order" (if pending)
  - "Return order" (opsiyonel)
  - "Contact support"
- Close button

---

## 👤 KULLANICI YÖNETİMİ

### 8. Authentication System

**Sorumluluk:** Kaan (Backend - ✅ TAMAMLANDI), Barış (Frontend UI)

**Backend Fonksiyonlar (✅ Tamamlandı):**
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş
- `GET /api/auth/me` - Mevcut kullanıcı
- `POST /api/auth/refresh` - Token yenileme
- JWT (access + refresh tokens)
- bcrypt password hashing
- Email uniqueness validation
- Token expiry: Access 60 min, Refresh 7 days

**Frontend UI - Auth Pages:**
- **Login Page (`/auth/login`):**
  - Email + password fields
  - "Remember me" checkbox
  - "Forgot password?" link
  - "Login" butonu (loading state)
  - Social login buttons (Google, Facebook - opsiyonel)
  - "Don't have an account? Sign up" link
  - Form validation (react-hook-form + zod)
  - Error toast (wrong credentials)
- **Register Page (`/auth/register`):**
  - Full name field
  - Email field
  - Password field (strength indicator)
  - Confirm password field
  - Terms & conditions checkbox
  - "Sign up" butonu
  - "Already have an account? Login" link
  - Email verification notice (after signup)
- **Forgot Password Page (`/auth/forgot-password`):** (opsiyonel)
  - Email field
  - "Send reset link" butonu
- Protected route wrapper
- Auto-redirect (logged in → home, logged out → login)

---

### 9. User Profile ve Preferences

**Sorumluluk:** Kaan (Backend), Barış (Frontend UI)

**Backend Fonksiyonlar:**
- `GET /api/users/me` - Profile bilgisi
- `PUT /api/users/me` - Profile güncelleme
- `PUT /api/users/me/password` - Şifre değiştirme
- `POST /api/users/me/preferences` - Tercihler güncelleme
- `GET /api/users/me/history` - Reading/scan history
- `POST /api/users/me/favorites` - Favorilere ekleme
- `DELETE /api/users/me/favorites/{book_id}` - Favoriden kaldırma
- Avatar upload (file storage)
- User vector güncelleme (preferences değişince)

**Frontend UI - Profile Page (`/profile`):**
- Tabs navigation:
  - Profile
  - Preferences
  - History
  - Favorites
  - Security
- **Profile Tab:**
  - Avatar upload (crop + preview)
  - Name field (editable)
  - Email field (editable + verification)
  - "Save changes" butonu
- **Preferences Tab:**
  - Favorite genres (multi-select, badges)
  - Favorite authors (autocomplete + tags)
  - Reading interests (checkboxes)
  - Language preference
  - Email notification settings
- **History Tab:**
  - Photo scan history (cards):
    - Thumbnail + date
    - Detected books
    - "View recommendations" link
  - Reading history (opsiyonel)
  - Purchase history → Orders page
- **Favorites Tab:**
  - Favorite books grid (same as books list)
  - "Remove from favorites" butonu
  - Empty state
- **Security Tab:**
  - Change password form
  - Two-factor authentication (opsiyonel)
  - Active sessions (opsiyonel)
  - "Logout all devices" butonu

---

## 🔧 ADMIN PANEL

### 10. Admin Dashboard

**Sorumluluk:** Önder (Backend + Frontend)

**Backend Fonksiyonlar:**
- `GET /api/admin/stats` - Dashboard statistics
- Role-based access control (is_admin check)
- Admin middleware

**Frontend UI - Admin Layout (`/admin`):**
- Sidebar navigation (sticky):
  - Dashboard (icon + label)
  - Books
  - Orders
  - Users
  - Import/Export
  - Settings
  - Logout
- Header (breadcrumb + user menu)
- Protected route (redirect if not admin)
- Dark mode toggle

**Frontend UI - Admin Dashboard (`/admin/dashboard`):**
- Stats cards grid (4 columns):
  - Total users (icon + count + growth %)
  - Total books (icon + count)
  - Total orders (icon + count + today's count)
  - Total revenue (icon + amount + this month)
- Charts section:
  - Sales chart (line chart, last 7 days)
  - Orders by status (pie chart)
  - Top selling books (bar chart, top 5)
- Recent orders table (last 10):
  - Order ID, user, date, total, status
  - Quick actions (view, update status)
- Activity log (opsiyonel)

---

### 11. Kitap Yönetimi (Admin)

**Sorumluluk:** Önder (Backend), Kaan (Books API - ✅ TAMAMLANDI)

**Backend Fonksiyonlar (✅ Kaan tarafından tamamlandı):**
- `GET /api/admin/books` - Admin kitap listesi
- `POST /api/admin/books` - Yeni kitap ekleme
- `PUT /api/admin/books/{id}` - Kitap güncelleme
- `DELETE /api/admin/books/{id}` - Kitap silme
- Bulk operations (multiple update/delete)
- ISBN uniqueness check

**Frontend UI - Books Management Page (`/admin/books`):**
- Header ("Books Management" + "Add book" butonu)
- DataTable (shadcn/ui):
  - Columns:
    - Cover (thumbnail)
    - Title (sortable)
    - Author (sortable)
    - Price (sortable)
    - Stock (color-coded)
    - Status (Active/Inactive)
    - Actions (edit/delete)
  - Row selection (checkboxes)
  - Bulk actions dropdown (delete, update stock)
- Search bar (title/author/ISBN)
- Filter dropdowns (genre, status)
- Pagination (10/20/50 per page)

**Frontend UI - Add/Edit Book Modal:**
- Form fields:
  - Title (required)
  - Author (required)
  - ISBN (required, unique validation)
  - Description (textarea)
  - Price (number)
  - Stock (number)
  - Cover URL (text input + preview)
  - Genres (multi-select)
  - Publisher, year (opsiyonel)
- "Save" + "Cancel" butonları
- Form validation
- Success toast (book created/updated)

---

### 12. Sipariş Yönetimi (Admin)

**Sorumluluk:** Önder (Backend + Frontend)

**Backend Fonksiyonlar:**
- `GET /api/admin/orders` - Tüm siparişler
- `PUT /api/admin/orders/{id}/status` - Status güncelleme
- Filter by status, date range, user
- Export to CSV

**Frontend UI - Orders Management Page (`/admin/orders`):**
- Header ("Order Management")
- Filter sidebar:
  - Status filter (All, Pending, Paid, Shipped, etc.)
  - Date range picker
  - User search
  - "Export CSV" butonu
- Orders table:
  - Order ID
  - User (name + email)
  - Date
  - Total
  - Status (badge)
  - Actions:
    - View details (modal)
    - Update status (dropdown)
    - Send notification (email)
- Pagination
- Real-time updates (opsiyonel)

**Frontend UI - Update Status Dropdown:**
- Current status (disabled)
- Available transitions:
  - PENDING → PAID (manual mark)
  - PAID → SHIPPED (add tracking number)
  - SHIPPED → DELIVERED
  - ANY → CANCELLED
- Confirmation dialog (critical actions)
- Email notification toggle

---

### 13. Data Import/Export

**Sorumluluk:** Önder (Backend + Frontend)

**Backend Fonksiyonlar:**
- `POST /api/admin/import/books` - CSV upload
- `GET /api/admin/export/books` - CSV download
- `GET /api/admin/export/orders` - CSV download
- CSV parser & validator
- Column mapping
- Batch insert (chunks)
- Progress tracking
- Error reporting (row-by-row)

**Frontend UI - Import Page (`/admin/import`):**
- Upload section:
  - Drag & drop zone (CSV only)
  - File validation (size, type)
  - "Download template" link
- Column mapping UI:
  - Source columns → Target fields (dropdowns)
  - Preview (first 5 rows)
  - "Map automatically" butonu
- Import button:
  - "Start import" (disabled until mapped)
  - Progress bar (real-time)
  - Success/error count
- Results section:
  - Total imported
  - Errors table (row, error message)
  - "Download error report" butonu
- Export section:
  - "Export all books" butonu (CSV download)
  - "Export orders" butonu (with date filter)

---

## 🎨 GENEL UI/UX ÖZELLİKLERİ

### 14. Design System

**Sorumluluk:** Barış (Frontend UI/UX)

**Teknoloji Stack:**
- shadcn/ui (component library)
- Tailwind CSS
- Radix UI (headless components)
- framer-motion (animations)

**Components Library:**
- **Buttons:**
  - Variants: primary, secondary, outline, ghost, destructive, link
  - Sizes: sm, md, lg
  - States: default, hover, active, disabled, loading
- **Form Elements:**
  - Input (text, email, password, number, with icons)
  - Textarea (auto-resize)
  - Select (native + custom dropdown)
  - Checkbox, Radio
  - Switch (toggle)
- **Data Display:**
  - Card (header, content, footer)
  - Badge (variants: default, success, warning, error)
  - Avatar (image + fallback initials)
  - Skeleton (loading placeholders)
  - DataTable (sortable, filterable, pagination)
- **Feedback:**
  - Toast (success, error, info, warning)
  - Modal/Dialog (with backdrop)
  - Alert (inline messages)
  - Progress bar
  - Spinner/Loader
- **Navigation:**
  - Tabs
  - Breadcrumb
  - Pagination
  - Dropdown menu
- **Overlays:**
  - Tooltip
  - Popover
  - Sheet (slide-in panel)

**Layout Components:**
- **Navbar (Responsive):**
  - Logo (clickable → home)
  - Search bar (expandable on mobile)
  - Navigation links (Home, Discover, Books, About)
  - User menu (dropdown):
    - Profile
    - Orders
    - Favorites
    - Settings
    - Logout
  - Cart icon (badge: item count)
  - Mobile hamburger menu (slide-in drawer)
- **Footer:**
  - Company info
  - Links (About, Contact, Privacy, Terms)
  - Social media icons
  - Newsletter signup (opsiyonel)
  - Copyright
- **Protected Route Wrapper:**
  - Auth check
  - Redirect to login (with return URL)
  - Loading state
- **Error Pages:**
  - 404 (Not Found) - illustration + "Go home" butonu
  - 500 (Server Error) - error message + "Try again"
  - 403 (Forbidden) - access denied message

**Theme System:**
- Color palette:
  - Primary (brand color)
  - Secondary
  - Accent
  - Neutral (grays)
  - Semantic (success, warning, error, info)
- Typography:
  - Font family (Inter, system-ui fallback)
  - Scale (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)
  - Weights (normal, medium, semibold, bold)
- Spacing system (Tailwind: 0.5, 1, 2, 4, 8, 12, 16...)
- Border radius (sm, md, lg, xl, full)
- Shadows (sm, md, lg, xl)
- Dark mode:
  - Toggle component (navbar)
  - Dark variants for all components
  - System preference detection
  - Persisted in localStorage

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support (ARIA labels)
- Focus indicators
- Color contrast ratio > 4.5:1

---

### 15. Mobile Optimization ve PWA

**Sorumluluk:** Barış (Frontend UI)

**Fonksiyonlar:**
- Mobile-first responsive design
- Touch gestures:
  - Swipe (carousel, drawer)
  - Pinch zoom (images)
  - Pull to refresh (opsiyonel)
- PWA features:
  - manifest.json (app name, icons, theme color)
  - Service worker (offline fallback)
  - Add to home screen prompt
  - Push notifications (opsiyonel)
  - Offline mode (cached pages)
- Performance optimizations:
  - Image optimization (next/image)
  - Lazy loading (images, components)
  - Code splitting (route-based)
  - Prefetching (next/link)
  - Compression (gzip/brotli)

**Target Metrics:**
- Lighthouse Performance: > 90
- First Contentful Paint: < 2s
- Time to Interactive: < 4s
- Bundle size: < 300KB (initial)

---

## 📊 TEKNİK ALTYAPI

### 16. Backend API Architecture

**Sorumluluk:** Kaan (AI-Backend Lead)

**Framework:** FastAPI (Python 3.11+)

**API Endpoints (40+):**

**Auth (4) - ✅ TAMAMLANDI:**
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- POST `/api/auth/refresh`

**Books (6) - ✅ TAMAMLANDI:**
- GET `/api/books` (pagination, filters, sort)
- GET `/api/books/{id}`
- GET `/api/books/search` (Elasticsearch - ✅ TAMAMLANDI)
- POST `/api/books` (admin)
- PUT `/api/books/{id}` (admin)
- DELETE `/api/books/{id}` (admin)

**Vision & Recommendations (3):**
- POST `/api/vision/analyze` (fotoğraf upload)
- GET `/api/recommendations/for-me`
- POST `/api/recommendations/by-preferences`

**Cart (5):**
- GET `/api/cart`
- POST `/api/cart/add`
- PUT `/api/cart/item/{id}`
- DELETE `/api/cart/item/{id}`
- POST `/api/cart/clear`

**Orders (4):**
- POST `/api/orders/create`
- GET `/api/orders`
- GET `/api/orders/{id}`
- PUT `/api/orders/{id}/status` (admin)

**Payment (3):**
- POST `/api/payment/initialize`
- POST `/api/payment/callback` (webhook)
- GET `/api/payment/status/{order_id}`

**Chat (2):**
- POST `/api/chat/message`
- GET `/api/chat/history`

**Social (2):**
- GET `/api/social/find-buddies`
- GET `/api/social/shared-interests/{user_id}`

**Admin (6+):**
- GET `/api/admin/stats`
- GET/POST/PUT/DELETE `/api/admin/books`
- POST `/api/admin/import/books`
- GET `/api/admin/export/books`
- GET `/api/admin/orders`
- GET `/api/admin/users`

**Health (2) - ✅ TAMAMLANDI:**
- GET `/api/health`
- GET `/api/health/db`

**Toplam:** 40+ endpoint

---

### 17. Database Schema

**Sorumluluk:** Kaan (Backend Lead)

**Teknoloji:** PostgreSQL 16 + pgvector

**Models (9) - ✅ TAMAMLANDI:**

1. **users** - Kullanıcı bilgileri
   - id (UUID, PK)
   - email (unique)
   - full_name
   - password_hash
   - is_admin (Boolean)
   - preferences_vector (vector(1536)) - AI için
   - created_at, updated_at

2. **books** - Kitap metadata
   - id (UUID, PK)
   - title
   - author
   - description
   - isbn (unique)
   - price (Decimal)
   - stock (Integer)
   - cover_url
   - genres (ARRAY)
   - embedding (vector(1536)) - AI için
   - created_at, updated_at

3. **user_interactions** - Kullanıcı-kitap etkileşimleri
   - id (UUID, PK)
   - user_id (FK → users)
   - book_id (FK → books)
   - interaction_type (ENUM: view, like, purchase, favorite)
   - created_at

4. **photo_scans** - Fotoğraf tarama geçmişi
   - id (UUID, PK)
   - user_id (FK → users)
   - image_url
   - detected_books (JSONB)
   - recommendations (JSONB)
   - created_at

5. **carts** - Sepet
   - id (UUID, PK)
   - user_id (FK → users, unique)
   - created_at, updated_at

6. **cart_items** - Sepet öğeleri
   - id (UUID, PK)
   - cart_id (FK → carts)
   - book_id (FK → books)
   - quantity (Integer)

7. **orders** - Siparişler
   - id (UUID, PK)
   - user_id (FK → users)
   - status (ENUM: PENDING, PAID, SHIPPED, DELIVERED, CANCELLED)
   - total_price (Decimal)
   - shipping_address (JSONB)
   - notes (Text)
   - created_at, updated_at

8. **order_items** - Sipariş detayları
   - id (UUID, PK)
   - order_id (FK → orders)
   - book_id (FK → books)
   - quantity (Integer)
   - price (Decimal) - snapshot at purchase time

**Elasticsearch:**
- **books** index - Full-text search
  - Synced with PostgreSQL
  - Turkish analyzer
  - Fuzzy matching

**Redis:**
- Session cache (user sessions)
- Embedding cache (OpenAI embeddings)
- Rate limiting counters
- TTL: 3600s (1 hour)

---

### 18. AI/ML Services

**Sorumluluk:** Kaan (AI-Backend Lead)

**Services (4):**

**1. openai_service.py:**
- `generate_embedding(text: str) -> List[float]`
  - OpenAI text-embedding-3-large
  - 1536 dimensions
  - Batch processing (cost optimization)
  - Cache in Redis (TTL: 30 days)
- `generate_explanation(user, book, context) -> str`
  - GPT-4o
  - Max 500 tokens
  - Temperature: 0.7
  - Cost tracking
- `batch_embeddings(texts: List[str]) -> List[List[float]]`
- Error handling & retry logic (3 attempts)

**2. vision_service.py:**
- `detect_books_from_image(image_bytes) -> List[str]`
  - Google Cloud Vision API
  - OCR + Object Detection
  - 4-direction rotation (0°, 90°, 180°, 270°)
  - Confidence threshold: > 0.7
  - Text cleaning (regex)
- `match_book_names(detected: List[str]) -> List[Book]`
  - Fuzzy matching (Levenshtein distance)
  - Title similarity > 0.8
  - Author matching (if available)
- Cost tracking (API calls)

**3. recommendation_service.py:**
- `create_user_profile_vector(user: User) -> List[float]`
  - Aggregate from interactions
  - Weighted average (purchase > like > view)
  - Update on new interaction
- `recommend_from_photo(user_id, image) -> List[Recommendation]`
  - Main workflow:
    1. Detect books (vision_service)
    2. Get user vector
    3. Cosine similarity (pgvector)
    4. Top-K selection (K=5)
    5. Generate explanations (GPT-4o)
  - RAG pipeline (LangChain)
  - Context: user preferences + detected books
  - Response time target: < 5s
- `recommend_by_preferences(user_id, prefs) -> List[Book]`
- Caching strategy (Redis)

**4. chatbot_service.py:**
- LangChain setup:
  - ConversationBufferMemory (last 10 messages)
  - GPT-4o chat model
  - System prompt (Book expert persona)
- `send_message(user_id, message) -> str`
  - Context retrieval (user profile + book DB)
  - Quick reply suggestions
  - Inline book recommendations
- Session management (Redis)
- Session timeout: 30 minutes

**5. elasticsearch_service.py - ✅ TAMAMLANDI:**
- `index_book(book: Book)` - Elasticsearch'e kitap ekleme
- `update_book_index(book: Book)` - Index güncelleme
- `delete_book_index(book_id: str)` - Index'ten silme
- `search_books(query: str) -> List[Book]` - Full-text search
- Auto-sync (CRUD operations sırasında)
- Fuzzy matching
- Relevance scoring

---

## 🎯 PERFORMANS ve KALİTE

### 19. Non-Functional Requirements

**Performance Targets:**
- API response time (avg): < 500ms
- API response time (p95): < 2s
- Recommendation API: < 5s
- OCR accuracy: > 70%
- Frontend Lighthouse score: > 90
- Time to First Byte: < 200ms
- First Contentful Paint: < 2s

**Scalability:**
- Support 1000+ concurrent users
- Database connection pooling (10-20 connections)
- Redis caching (hit ratio > 80%)
- CDN for static assets

**Security:**
- HTTPS (TLS 1.3)
- JWT authentication (secure tokens)
- bcrypt password hashing (cost factor: 12)
- CORS protection (allowed origins only)
- Rate limiting:
  - Auth: 5 requests/minute
  - API: 100 requests/minute
  - Vision: 10 requests/hour
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF protection
- Security headers (helmet.js equivalent)

**Monitoring:**
- Structured logging (JSON format)
- Log levels: DEBUG, INFO, WARNING, ERROR
- Error tracking (Sentry integration - opsiyonel)
- Health checks (database, Redis, Elasticsearch)
- Uptime monitoring (opsiyonel)
- Performance metrics (opsiyonel)

**Testing:**
- Unit tests (backend): > 70% coverage
- Integration tests (API endpoints)
- E2E tests (critical flows - opsiyonel)
- Load testing (opsiyonel)

**Reliability:**
- Database backups (daily)
- Disaster recovery plan
- Error handling (graceful degradation)
- Retry logic (transient failures)
- Circuit breaker pattern (opsiyonel)

---

## 📦 DATA MANAGEMENT

### 20. Initial Data & Seeding

**Sorumluluk:** Kaan (Data Pipeline), Önder (Import Tools)

**Books Dataset:**
- Source: Goodreads dataset
- Target: 10,000+ books
- Data pipeline:
  1. Download CSV
  2. Data cleaning & validation
  3. Generate embeddings (batch)
  4. Insert to PostgreSQL
  5. Index to Elasticsearch
- Progress tracking (resume capability)
- Error handling & logging

**Seed Data (Development):**
- 20 classic/popular books (✅ TAMAMLANDI)
- 1 admin user (email: admin@bibliomind.com)
- Sample users (testing)
- Sample interactions (user history)

**Data Scripts:**
- `backend/scripts/seed_books.py` - ✅ TAMAMLANDI
- `data/scripts/download_dataset.py`
- `data/scripts/generate_embeddings.py`
- `data/scripts/index_elasticsearch.py`
- `backend/scripts/create_admin.py`

---

## 🚀 DEPLOYMENT

### 21. Production Environment

**Infrastructure:**
- **Backend:**
  - FastAPI app (uvicorn + gunicorn)
  - Docker container
  - Auto-scaling (opsiyonel)
- **Frontend:**
  - Next.js app
  - Vercel / Self-hosted
  - CDN integration
- **Database:**
  - PostgreSQL (managed service)
  - Automated backups
  - Read replicas (opsiyonel)
- **Cache:**
  - Redis (managed service)
- **Search:**
  - Elasticsearch (managed service / self-hosted)
- **Reverse Proxy:**
  - Nginx
  - Load balancing (opsiyonel)
- **SSL:**
  - Let's Encrypt (auto-renewal)
  - HTTPS redirect

**Environment Variables:**
- Separate `.env` files (dev, staging, production)
- Secrets management (encrypted)
- CI/CD pipeline (GitHub Actions - opsiyonel)

**Domain & DNS:**
- Domain: bibliomind.com (example)
- API subdomain: api.bibliomind.com
- Admin subdomain: admin.bibliomind.com (opsiyonel)

---

## 📱 SON KULLANICI AKILIŞLARI

### Senaryo 1: Yeni Kullanıcı - Discovery Journey
1. **Landing page** → "Start discovering" CTA
2. **Register** (/auth/register) → Email + password → Success
3. **Preferences setup** → Select favorite genres → Save
4. **Discover page** (/discover) → Upload kitaplık fotoğrafı
5. **AI Processing** → 4-5 saniye bekleme (animated loading)
6. **Recommendations** → 5 kitap + açıklamalar
7. **Book detail** → "Add to cart"
8. **Cart** → Review → "Checkout"
9. **Checkout** → Address → Payment (İyzico)
10. **Success** → Order confirmation

### Senaryo 2: Returning User - Quick Purchase
1. **Login** (/auth/login)
2. **Home** → "For You" recommendations (kişiselleştirilmiş)
3. **Book detail** → "Add to cart"
4. **Cart** (navbar badge) → "Checkout"
5. **Checkout** → Saved address → Payment → Success

### Senaryo 3: Social Discovery
1. **Book Buddies** (/book-buddies) → Find similar readers
2. **View buddy profile** → Shared interests
3. **Recommended books** → "Books [name] loved"
4. **Chat with bot** → "Recommend me mystery books"
5. **Bot response** → Book cards + quick add to cart

### Senaryo 4: Admin - Book Management
1. **Admin login** → Redirect to /admin/dashboard
2. **Dashboard** → View stats (orders, revenue)
3. **Books** (/admin/books) → "Add book" → Form → Save
4. **Orders** (/admin/orders) → Update status → Email sent
5. **Import** (/admin/import) → Upload CSV → Import 100 books

---

## ✅ PROJE TAMAMLANMA KRİTERLERİ

### Phase 1: Altyapı (Hafta 1-4)
**Durum:** %100 (Kaan'ın tüm Phase 1 görevleri tamamlandı!) 🎉

**Kaan (Backend) - 8/8 ✅:** (**TAMAMLANDI!** 🎉)
- [x] Docker & Database Setup
- [x] Database Schema & Models
- [x] FastAPI Core Setup
- [x] Authentication API
- [x] Books API (CRUD)
- [x] Elasticsearch Search
- [x] User Preferences System
- [x] Admin Panel Backend

**Barış (Frontend) - 0/4:**
- [ ] Next.js + Tailwind setup
- [ ] Design system (shadcn/ui)
- [ ] Layout & navigation
- [ ] Auth UI (mock → real)

**Önder (E-ticaret) - 0/3:**
- [ ] Cart API
- [ ] Order API
- [ ] Payment service skeleton

---

### Phase 2: AI/ML Entegrasyonu (Hafta 5-8) ⭐
**Durum:** %0

**Kaan (AI/ML) - 0/4:**
- [ ] OpenAI Services
- [ ] Google Cloud Vision Integration
- [ ] Book Data Pipeline (10K+ books)
- [ ] Recommendation Engine ⭐

**Barış (Frontend) - 0/3:**
- [ ] Discovery UI (Photo upload + Results)
- [ ] Recommendation Cards
- [ ] Book Catalog UI

---

### Phase 3: E-ticaret & Polish (Hafta 9-12)
**Durum:** %0

**Önder (E-ticaret) - 0/6:**
- [ ] Cart UI
- [ ] Checkout Flow
- [ ] Order History UI
- [ ] Admin Panel Backend
- [ ] Admin Panel Frontend
- [ ] Data Import/Export

**Barış (Advanced UI) - 0/4:**
- [ ] User Profile & Preferences
- [ ] Chatbot UI
- [ ] Social Features UI
- [ ] Mobile Optimization + PWA

**Kaan (Advanced) - 0/4:**
- [ ] Chatbot Backend
- [ ] Social Features Backend
- [ ] Performance Optimization
- [ ] Production Deployment

---

## 📊 GENEL İLERLEME

| Ekip Üyesi | Toplam Görev | Tamamlanan | İlerleme | Durum |
|-----------|-------------|-----------|----------|--------|
| **Kaan** | 8 (Phase 1) | 8 | **100%** | 🎉 Phase 1 Tamamlandı! |
| **Barış** | 11 | 0 | **0%** | 🔴 Başlamadı |
| **Önder** | 9 | 0 | **0%** | 🔴 Başlamadı |
| **TOPLAM** | **28** | **8** | **29%** | 🟡 Phase 1 Backend Tamamlandı |

---

## 🎉 %100 TAMAMLANDIĞINDA SİSTEM:

✅ **Full-stack AI destekli e-ticaret platformu**
✅ **20+ Ana özellik**
✅ **40+ API endpoint**
✅ **25+ UI sayfası**
✅ **10,000+ kitap (embeddings ile)**
✅ **Fotoğraftan öneri (core feature)**
✅ **Full e-ticaret (sepet, ödeme, sipariş)**
✅ **Admin panel (CRUD, import/export)**
✅ **Chatbot (AI-powered)**
✅ **Sosyal eşleştirme (Book Buddy)**
✅ **Mobile-optimized + PWA**
✅ **Production-ready deployment**

---

## 💡 SONRAKİ ADIMLAR

### Acil (Bu Hafta):
1. **Barış:** Next.js projesini başlat + shadcn/ui kur
2. **Barış:** Auth UI'yi yap + Kaan'ın API'sine bağla (✅ BLOCKER KALDIRILDI)
3. **Önder:** Cart API'yi implement et (modeller hazır)
4. **Kaan:** Elasticsearch entegrasyonunu tamamla (sırada)

### Orta Vadeli (2-4 Hafta):
1. **Kaan:** OpenAI + Vision API entegrasyonu
2. **Barış:** Discovery UI (mock ile başla)
3. **Önder:** Order + Payment API

### Uzun Vadeli (5-12 Hafta):
1. **Core feature:** Fotoğraftan öneri çalışıyor ⭐
2. **E-ticaret:** End-to-end satın alma akışı
3. **Admin panel:** Full CRUD + import
4. **Production:** Deploy ve launch

---

**Son Güncelleme:** 20 Ocak 2026  
**Güncelleyen:** AI Assistant  
**Versiyon:** 1.0

**Not:** Bu döküman proje vizyonunu gösterir. Gerçek ilerleme için `06-PROJECT-STATUS.md` dosyasına bakın.
