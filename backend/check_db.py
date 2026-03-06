import asyncio
import os
import sys

# Add the app directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.book import Book
from app.models.user import User
from app.models.user_interaction import UserInteraction
from app.services.user_service import UserService

def check_db():
    db = SessionLocal()
    try:
        # 1. Check if Ben Hogan or Modern Fundamentals exist
        print("--- BOOK CHECK ---")
        books = db.query(Book).filter(Book.author.ilike("%Ben Hogan%")).all()
        print(f"Books by Ben Hogan: {len(books)}")
        for b in books: print(f" - {b.title} by {b.author}")
        
        books = db.query(Book).filter(Book.title.ilike("%Modern Fundamentals%")).all()
        print(f"Books with 'Modern Fundamentals' in title: {len(books)}")
        for b in books: print(f" - {b.title} by {b.author}")

        # 2. Check User Interactions
        print("\n--- USER INTERACTIONS ---")
        user = db.query(User).first()
        if not user:
            print("No users in DB.")
            return

        print(f"Checking for User: {user.email} (ID: {user.id})")
        
        interactions = db.query(UserInteraction).filter(UserInteraction.user_id == user.id).all()
        print(f"Total Interactions: {len(interactions)}")
        
        for i in interactions[:10]:
            book_title = i.book.title if i.book else "Unknown Book"
            print(f" - {i.interaction_type} on book: {book_title}")

    finally:
        db.close()

if __name__ == "__main__":
    check_db()
