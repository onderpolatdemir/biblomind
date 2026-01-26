# Google Cloud Vision API Setup Guide

**Görev:** Phase 2.2 - Google Cloud Vision API Kurulumu  
**Süre:** ~15 dakika  
**Maliyet:** İlk 1,000 request/ay ÜCRETSİZ

---

## 📋 Gereksinimler

- Google hesabı (Gmail)
- Kredi kartı (API enable için - ücret alınmayacak, sadece doğrulama)

---

## 🚀 Adım Adım Kurulum

### 1. Google Cloud Project Oluştur

1. **Google Cloud Console'a git:**
   - https://console.cloud.google.com/

2. **Yeni proje oluştur:**
   - Üst bar'da proje seçiciyi aç
   - "NEW PROJECT" butonuna tıkla
   - **Project name:** `bibliomind`
   - **Location:** Organization yok ise "No organization"
   - "CREATE" butonuna tıkla

3. **Projeyi seç:**
   - Proje oluşturulduktan sonra üst bar'dan `bibliomind` projesini seç

**Not:** Mevcut bir proje varsa onu da kullanabilirsin.

---

### 2. Billing Aktif Et (Gerekli)

Vision API kullanmak için billing hesabı gerekli (Free tier için bile).

1. **Billing menüsüne git:**
   - Sol menü > Billing

2. **Billing hesabı bağla:**
   - Eğer yoksa "CREATE ACCOUNT" ile yeni hesap oluştur
   - Kredi kartı bilgilerini gir (doğrulama için)
   - **Önemli:** Free tier limitler içinde kalırsan ücret alınmaz

3. **Free tier limitleri:**
   - İlk 1,000 request/ay: **ÜCRETSİZ**
   - Sonrası: $1.50 per 1,000 requests

---

### 3. Vision API'yi Enable Et

1. **APIs & Services > Library'ye git:**
   - Sol menü > APIs & Services > Library
   - Veya: https://console.cloud.google.com/apis/library

2. **Vision API'yi bul:**
   - Search bar'a "Cloud Vision API" yaz
   - "Cloud Vision API" seç

3. **Enable et:**
   - "ENABLE" butonuna tıkla
   - ~30 saniye bekle

**Doğrulama:**
- "API enabled" mesajını gördüysen başarılı! ✅

---

### 4. Service Account Oluştur

Service account, uygulamanın Vision API'yi kullanmasını sağlayan kimlik.

1. **IAM & Admin > Service Accounts'a git:**
   - Sol menü > IAM & Admin > Service Accounts
   - Veya: https://console.cloud.google.com/iam-admin/serviceaccounts

2. **Service account oluştur:**
   - "+ CREATE SERVICE ACCOUNT" butonuna tıkla

3. **Service account details:**
   - **Service account name:** `bibliomind-vision`
   - **Service account ID:** (otomatik oluşur: `bibliomind-vision@...`)
   - **Description:** "BiblioMind Vision API service account"
   - "CREATE AND CONTINUE" tıkla

4. **Grant permissions:**
   - **Select a role** dropdown'u aç
   - Ara: "Cloud Vision"
   - **Cloud Vision API User** seç
   - "CONTINUE" tıkla

5. **Grant users access:**
   - Bu adımı atla (optional)
   - "DONE" tıkla

---

### 5. JSON Key İndir

1. **Service Accounts listesinde:**
   - Az önce oluşturduğun `bibliomind-vision@...` satırını bul
   - Sağdaki ⋮ (üç nokta) menüsüne tıkla
   - "Manage keys" seç

2. **Yeni key oluştur:**
   - "ADD KEY" > "Create new key"
   - **Key type:** JSON seç (önemli!)
   - "CREATE" tıkla

3. **Key otomatik indirilir:**
   - Dosya adı: `bibliomind-xxxxxx.json`
   - **ÖNEMLİ:** Bu dosyayı GÜVENLİ bir yerde sakla!
   - **ASLA** public repo'ya commit etme!

---

### 6. Credentials Dosyasını Yerleştir

1. **Backend klasöründe `credentials` klasörü oluştur:**
   ```bash
   cd backend
   mkdir credentials
   ```

2. **İndirilen JSON dosyasını yeniden adlandır ve kopyala:**
   ```bash
   # İndirilen dosyayı şu şekilde taşı:
   # bibliomind-xxxxxx.json -> backend/credentials/google-vision-key.json
   ```

3. **Windows (PowerShell):**
   ```powershell
   # Downloads klasöründen kopyala
   Copy-Item "$env:USERPROFILE\Downloads\bibliomind-*.json" "credentials\google-vision-key.json"
   ```

4. **Git Bash (Windows/Mac/Linux):**
   ```bash
   # Downloads klasöründen kopyala
   cp ~/Downloads/bibliomind-*.json credentials/google-vision-key.json
   ```

---

### 7. .env Dosyasını Güncelle

1. **`backend/.env` dosyasını aç**

2. **GOOGLE_APPLICATION_CREDENTIALS ekle:**
   ```env
   # Google Cloud Vision API
   GOOGLE_APPLICATION_CREDENTIALS=credentials/google-vision-key.json
   ```

**Not:** Path relative (göreceli), `backend/` klasörüne göre.

---

### 8. Credentials Güvenliği

`credentials/` klasörünün `.gitignore`'da olduğundan emin ol:

**Dosya:** `backend/credentials/.gitignore`
```
# Tüm JSON dosyalarını ignore et
*.json

# Ama .gitignore'u kendisi ignore etme
!.gitignore
```

**Kontrol et:**
```bash
cd backend
git status

# credentials/*.json dosyaları GÖRÜNMEMELİ
# Eğer görünüyorsa:
git rm --cached credentials/*.json
```

---

## ✅ Kurulum Testi

### 1. Python Test

```bash
cd backend
python
```

```python
from google.cloud import vision
import os

# Credentials yolu
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'credentials/google-vision-key.json'

# Client oluştur
client = vision.ImageAnnotatorClient()

print("✅ Vision API bağlantısı başarılı!")
```

**Beklenen çıktı:**
```
✅ Vision API bağlantısı başarılı!
```

**Hata alırsan:**
- `FileNotFoundError`: JSON dosyası yolu yanlış
- `DefaultCredentialsError`: .env doğru yapılandırılmamış
- `PermissionDenied`: Service account rolü eksik

---

## 📊 Free Tier Limitleri

**Aylık Limitler:**
| Özellik | Limit | Ücret |
|---------|-------|-------|
| İlk 1,000 request | ✅ FREE | $0 |
| Sonraki her 1,000 | ❌ Ücretli | $1.50 |

**BiblioMind Kullanımı:**
- Her fotoğraf = 4 request (4 rotation)
- 250 fotoğraf/ay = 1,000 request = **ÜCRETSİZ**
- 500 fotoğraf/ay = 2,000 request = **$1.50/ay**

**Limit Takibi:**
- Console > IAM & Admin > Quotas
- "Cloud Vision API" filtresi

---

## 🔐 Güvenlik Best Practices

1. **JSON key'i ASLA paylaşma:**
   - Public repo'ya commit etme
   - Screenshot'larda gizle
   - Email/Slack'te gönderme

2. **Credentials rotation:**
   - Düzenli olarak (6 ayda bir) yeni key oluştur
   - Eski key'i sil

3. **Least privilege:**
   - Sadece gerekli rolü ver (Cloud Vision API User)
   - Owner/Editor rolü VERME

4. **Environment variables:**
   - Production'da `.env` kullanma
   - Secret manager kullan (Google Secret Manager, AWS Secrets Manager)

---

## 🐛 Troubleshooting

### "The caller does not have permission"
**Çözüm:** Service account'a "Cloud Vision API User" rolü ver

### "API not enabled"
**Çözüm:** Vision API'yi enable et (Adım 3)

### "Billing account required"
**Çözüm:** Billing hesabı bağla (Adım 2)

### "Could not load the default credentials"
**Çözüm:** 
1. .env dosyasında `GOOGLE_APPLICATION_CREDENTIALS` doğru mu?
2. JSON dosyası `backend/credentials/` klasöründe mi?
3. JSON dosyası valid mi? (metin editörde aç, valid JSON olmalı)

### "Daily limit exceeded"
**Çözüm:** 
- Günlük limit aşılmış, yarın dene
- Veya billing hesabında limit artır

---

## 📞 Destek

**Google Cloud Dokümanları:**
- Vision API: https://cloud.google.com/vision/docs
- Service Accounts: https://cloud.google.com/iam/docs/service-accounts

**BiblioMind Ekip:**
- Kaan (Backend Lead)

---

## ✅ Checklist

Setup tamamlandı mı?

- [ ] Google Cloud Project oluşturuldu
- [ ] Billing hesabı aktif
- [ ] Vision API enable edildi
- [ ] Service account oluşturuldu (Cloud Vision API User rolü ile)
- [ ] JSON key indirildi
- [ ] `backend/credentials/google-vision-key.json` dosyası yerleştirildi
- [ ] `.env` dosyasında `GOOGLE_APPLICATION_CREDENTIALS` eklendi
- [ ] `credentials/*.json` gitignore'da
- [ ] Python test başarılı

**Hepsi ✅ ise:**
```bash
python -m scripts.test_vision_service
```

---

**Son Güncelleme:** 20 Ocak 2026  
**Durum:** Ready for Setup  
**Sonraki Adım:** VisionService implementation
