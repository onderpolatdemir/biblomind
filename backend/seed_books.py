import sys
import os
import uuid
from decimal import Decimal

# Add backend directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.book_service import BookService
from app.schemas.book import BookCreate

def seed_books():
    print("🌱 Seeding database with sample books via BookService...")
    
    # Sample Books Data (Schema compliant)
    sample_books = [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "9780743273565",
            "description": "A novel set in the Jazz Age.",
            "price": Decimal("10.99"),
            "stock": 50,
            "cover_url": "https://example.com/gatsby.jpg",
            "genres": ["Classic", "Fiction", "Romance"]
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "9780451524935",
            "description": "A dystopian social science fiction novel.",
            "price": Decimal("8.99"),
            "stock": 100,
            "cover_url": "https://example.com/1984.jpg",
            "genres": ["Fiction", "Dystopian"]
        },
        {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "isbn": "9780547928227",
            "description": "A fantasy novel about the adventures of Bilbo Baggins.",
            "price": Decimal("12.50"),
            "stock": 25,
            "cover_url": "https://example.com/hobbit.jpg",
            "genres": ["Fantasy", "Adventure"]
        },
         {
            "title": "Harry Potter and the Sorcerer's Stone",
            "author": "J.K. Rowling",
            "isbn": "9780590353427",
            "description": "A young wizard discovers his magical heritage.",
            "price": Decimal("14.99"),
            "stock": 60,
            "cover_url": "https://example.com/harry_potter.jpg",
            "genres": ["Fantasy", "Young Adult"]
        },
         {
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "isbn": "9780141439518",
            "description": "A romantic novel of manners.",
            "price": Decimal("6.99"),
            "stock": 40,
            "cover_url": "https://example.com/pride.jpg",
            "genres": ["Classic", "Romance"]
        }
    ]

    session = SessionLocal()
    try:
        inserted_count = 0
        for book_data in sample_books:
            # Check if book exists (by ISBN) using Service
            if BookService.check_isbn_exists(session, book_data["isbn"]):
                print(f"   Skipping {book_data['title']} (Already exists)")
                continue

            # Create Book using BookCreate Schema
            new_book_schema = BookCreate(**book_data)
            
            # Use Service to create (handles indexing etc if configured)
            BookService.create_book(session, new_book_schema)
            inserted_count += 1
        
        print(f"✅ Successfully added {inserted_count} new books to the database!")
        
    except Exception as e:
        print(f"❌ Error Seeding Database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

if __name__ == "__main__":
    seed_books()
