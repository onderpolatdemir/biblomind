import sys
import os
import logging

# Disable sqlalchemy logs
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

# Add the parent directory to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from app.models.book import Book

def verify_books():
    session = SessionLocal()
    try:
        count = session.query(Book).count()
        print(f"Total books in database: {count}")
        
        if count > 0:
            print("\nFirst 5 books:")
            books = session.query(Book).limit(5).all()
            for book in books:
                print(f"- {book.title} (ISBN: {book.isbn})")
    except Exception as e:
        print(f"Error checking existing books: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    verify_books()
