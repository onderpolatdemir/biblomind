import sys
import asyncio
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.book import Book
from app.services.recommendation_service import RecommendationService
import traceback

async def run_test():
    db = SessionLocal()
    try:
        book = db.query(Book).first()
        print(f"Testing with Book ID: {book.id}")
        service = RecommendationService(db)
        try:
            res = await service.get_checkout_recommendations([book.id])
            print("Success!")
            print(res)
        except Exception as e:
            print("ERROR CAUGHT IN SERVICE CALL!")
            traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_test())
