import os
import sys
from sqlalchemy.orm import Session
# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.models.book import Book
from app.models.user import User
from app.models.user_interaction import UserInteraction

def verify():
    db = SessionLocal()
    try:
        book_count = db.query(Book).count()
        embedded_count = db.query(Book).filter(Book.embedding != None).count()
        interaction_count = db.query(UserInteraction).count()
        
        print(f"Total books: {book_count}")
        print(f"Books with embeddings: {embedded_count}")
        print(f"Total interactions: {interaction_count}")
        
        # Check users with interactions
        users_with_int = db.query(User).join(UserInteraction).distinct().all()
        print(f"Users with interactions: {len(users_with_int)}")
        
        for user in users_with_int:
            # Check how many of their interacted books have embeddings
            interacted_book_ids = db.query(UserInteraction.book_id).filter(UserInteraction.user_id == user.id).all()
            interacted_book_ids = [bid[0] for bid in interacted_book_ids]
            
            ready_books = db.query(Book).filter(Book.id.in_(interacted_book_ids), Book.embedding != None).count()
            print(f"User {user.email}: {ready_books}/{len(interacted_book_ids)} books are ready (have embeddings)")
            
    finally:
        db.close()

if __name__ == "__main__":
    verify()
