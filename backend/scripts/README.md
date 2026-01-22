# 📜 Backend Scripts

Bu klasör, backend geliştirme ve yönetim scriptlerini içerir.

## 📁 Klasör Yapısı

### `dev/` - Geliştirme Scriptleri
Test ve benchmark scriptleri:
- `test_*.py` - Servis test scriptleri
- `benchmark_*.py` - Performans ölçüm scriptleri

**Kullanım:**
```bash
python scripts/dev/test_vision_service.py
python scripts/dev/benchmark_phase3.py
```

### `db/` - Veritabanı Scriptleri
Veritabanı yönetim ve seed scriptleri:
- `seed_books.py` - Kitap seed data
- `seed_interactions.py` - Kullanıcı etkileşim seed data
- `create_admin.py` - Admin kullanıcı oluşturma

**Kullanım:**
```bash
python scripts/db/seed_books.py
python scripts/db/create_admin.py
```

### `utils/` - Yardımcı Scriptler
Günlük kullanım scriptleri:
- `start_server.sh` - Linux/Mac server başlatma
- `start_server.ps1` - Windows PowerShell server başlatma

**Kullanım:**
```bash
# Linux/Mac
./scripts/utils/start_server.sh

# Windows
.\scripts\utils\start_server.ps1
```

### `dangerous/` - Tehlikeli Scriptler ⚠️
**DİKKAT:** Bu scriptler veritabanını değiştirebilir veya veri silebilir!

- `clear_books.py` - Tüm kitapları siler (DİKKAT!)

**Kullanım:**
```bash
# SADECE GEREKTİĞİNDE KULLANIN!
python scripts/dangerous/clear_books.py
```

---

## 📝 Notlar

- Tüm scriptler `backend/` klasöründen çalıştırılmalıdır
- Environment variables (.env) ayarlanmış olmalıdır
- Database migration'ları uygulanmış olmalıdır
