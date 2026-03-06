import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.services.social_service import SocialService

async def test_buddies(email: str):
    db = SessionLocal()
    social_service = SocialService(db)
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found")
            return
        
        print(f"Testing buddies for {user.email}...")
        buddies = social_service.find_book_buddies(user.id, limit=5, min_interactions=1)
        
        print(f"Found {len(buddies)} potential buddies.")
        for i, buddy in enumerate(buddies, 1):
            print(f"{i}. {buddy['full_name']} ({buddy['email']})")
            print(f"   Compatibility Score: {buddy['compatibility_score']}")
            print(f"   Shared Books: {buddy['shared_books']}")
            print(f"   Shared Genres: {buddy['shared_genres_count']}")
            print("-" * 20)
            
    finally:
        db.close()

if __name__ == "__main__":
    email = "yeni@gmail.com"
    asyncio.run(test_buddies(email))
