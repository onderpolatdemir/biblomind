"""
Admin kullanici olusturma scripti
Usage: python scripts/create_admin.py
"""

import sys
import os
from pathlib import Path

# Backend dizinini Python path'e ekle
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.services.auth_service import AuthService
from app.core.config import settings

def create_admin_user(
    db: Session,
    email: str = "admin@gmail.com",
    password: str = "adminpassword",
    full_name: str = "Admin User"
):
    """Admin kullanici olustur."""
    
    # Mevcut kullanici var mi kontrol et
    existing_user = db.query(User).filter(User.email == email).first()
    
    if existing_user:
        print(f"\n[!] Bu email zaten kayitli: {email}")
        
        # Admin degilse admin yap
        if not existing_user.is_admin:
            existing_user.is_admin = True
            db.commit()
            print(f"[+] Kullanici admin olarak guncellendi!")
        else:
            print(f"[i] Kullanici zaten admin.")
        
        return existing_user
    
    # Yeni admin kullanici olustur
    hashed_password = AuthService.get_password_hash(password)
    
    admin_user = User(
        email=email,
        password_hash=hashed_password,
        full_name=full_name,
        is_admin=True  # Admin olarak isaretlendi
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print(f"\n[+] Admin kullanici basariyla olusturuldu!")
    print(f"    Email: {email}")
    print(f"    Password: {password}")
    print(f"    Admin: {admin_user.is_admin}")
    
    return admin_user


def main():
    """Ana fonksiyon."""
    print("\n" + "="*60)
    print("  ADMIN KULLANICI OLUSTURMA SCRIPTI")
    print("="*60)
    
    # Database baglantisi
    db = SessionLocal()
    
    try:
        # Admin kullanici olustur
        admin = create_admin_user(
            db=db,
            email="admin@gmail.com",
            password="adminpassword",
            full_name="BiblioMind Admin"
        )
        
        print("\n" + "-"*60)
        print("  SWAGGER UI'DA NASIL KULLANILIR?")
        print("-"*60)
        print("\n1. Swagger UI'a git: http://localhost:8000/docs")
        print("\n2. POST /api/auth/login endpoint'ini ac")
        print("\n3. 'Try it out' tikla")
        print("\n4. Body'e su bilgileri gir:")
        print("   {")
        print('     "email": "admin@gmail.com",')
        print('     "password": "adminpassword"')
        print("   }")
        print("\n5. 'Execute' tikla")
        print("\n6. Response'dan 'access_token' kopyala")
        print("\n7. Sag ustteki 'Authorize' butonuna tikla")
        print("\n8. Token'i yapistir (Bearer kelimesi OLMADAN)")
        print("\n9. 'Authorize' tikla, 'Close' tikla")
        print("\n10. Artik tum admin endpoint'leri kullanabilirsin!")
        print("\n" + "="*60 + "\n")
        
    except Exception as e:
        print(f"\n[X] Hata olustu: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
