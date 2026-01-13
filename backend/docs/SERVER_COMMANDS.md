# 🚀 BiblioMind Server Komutları

## ⚡ Hızlı Başlatma (Önerilen)

### Git Bash
```bash
cd ~/Desktop/bitirme/biblomind/backend
./start_server.sh
```

### PowerShell
```powershell
cd C:\Users\kaany\Desktop\bitirme\biblomind\backend
.\start_server.ps1
```

---

## 📝 Manuel Komutlar

Eğer script çalışmazsa veya manuel kontrol istiyorsan:

### Git Bash / Linux / macOS
```bash
# 1. Backend dizinine git
cd ~/Desktop/bitirme/biblomind/backend

# 2. venv aktifleştir
source venv/Scripts/activate

# 3. Environment variable
export DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bibliomind"

# 4. Server başlat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Windows PowerShell
```powershell
# 1. Backend dizinine git
cd C:\Users\kaany\Desktop\bitirme\biblomind\backend

# 2. venv aktifleştir
.\venv\Scripts\Activate.ps1

# 3. Environment variable
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bibliomind"

# 4. Server başlat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🌐 Erişim Adresleri

Server çalıştıktan sonra:

| Endpoint | URL | Açıklama |
|----------|-----|----------|
| **Root** | http://localhost:8000/ | API ana sayfa |
| **Swagger UI** | http://localhost:8000/docs | İnteraktif API dokümantasyonu |
| **ReDoc** | http://localhost:8000/redoc | Alternatif API dokümantasyonu |
| **Health Check** | http://localhost:8000/api/health | Sistem sağlık kontrolü |

---

## 🛑 Server Durdurma

Terminal'de:
```
CTRL + C
```

---

## 🔧 Sorun Giderme

### Docker servisleri başlatma
```bash
cd ~/Desktop/bitirme/biblomind
docker-compose up -d
```

### Paket kurulumu
```bash
cd backend
source venv/Scripts/activate  # Git Bash
# veya
.\venv\Scripts\Activate.ps1   # PowerShell

pip install -r requirements.txt
```

### Port çakışması (8000 portunda başka bir şey çalışıyor)
```powershell
# Windows
netstat -ano | findstr :8000
taskkill /PID [PROCESS_ID] /F
```

```bash
# Linux/Mac
lsof -ti:8000 | xargs kill -9
```

---

## 💡 İpuçları

- ✅ Script'ler Docker'ı otomatik kontrol eder ve başlatır
- ✅ venv yoksa otomatik oluşturur
- ✅ Her değişiklikte otomatik reload aktif
- ✅ Logs `backend/logs/` klasöründe
- ✅ Debug mode açık (development)
