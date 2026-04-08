import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.user_interaction import UserInteraction
from app.services.recommendation_service import RecommendationService

async def refresh_all():
    db = SessionLocal()
    recommendation_service = RecommendationService(db)
    try:
        # Get all users who have at least 1 interaction
        users = db.query(User).join(UserInteraction).distinct().all()
        print(f"Found {len(users)} users with interactions.")
        
        for user in users:
            print(f"Updating preference vector for {user.email}...")
            try:
                # Note: RecommendationService.update_user_preference_vector 
                # takes user_id and optionally a list of interactions
                # Looking at recommendation_service.py, it seems it handles the db within.
                success = await recommendation_service.update_user_preference_vector(user.id)
                
                if success.get("vector_updated"):
                    print(f"✅ Success: {user.email} updated.")
                else:
                    print(f"ℹ️ Info: {user.email} not updated (reason: {success.get('reason') or 'Unknown'})")
            except Exception as e:
                print(f"❌ Error updating {user.email}: {e}")
            
    finally:
        db.close()
        await recommendation_service.close()

if __name__ == "__main__":
    asyncio.run(refresh_all())
