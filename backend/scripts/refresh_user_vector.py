import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.services.recommendation_service import RecommendationService

async def refresh_user(email: str):
    db = SessionLocal()
    recommendation_service = RecommendationService()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found")
            return
        
        print(f"Updating preference vector for {user.email}...")
        success = await recommendation_service.update_user_preference_vector(db, user.id)
        
        if success:
            db.refresh(user)
            has_vector = user.preferences_vector is not None
            print(f"Success! User {user.email} has vector: {has_vector}")
            if has_vector:
                print(f"Vector length: {len(user.preferences_vector)}")
        else:
            print(f"Failed to update preference vector for {user.email}")
            
    finally:
        db.close()

if __name__ == "__main__":
    email = "yeni@gmail.com"
    asyncio.run(refresh_user(email))
