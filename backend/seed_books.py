import uuid
import sys
import os

# Add backend directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine
from app.models.book import Book

def seed_books():
    print("🌱 Seeding database with sample books...")
    
    # Sample Books Data
    sample_books = [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald",
            "isbn": "9780743273565",
            "description": "A novel set in the Jazz Age.",
            "price": 10.99,
            "stock": 50,
            "cover_url": "https://example.com/gatsby.jpg",
            "genres": ["Classic", "Fiction", "Romance"]
        },
        {
            "title": "1984",
            "author": "George Orwell",
            "isbn": "9780451524935",
            "description": "A dystopian social science fiction novel.",
            "price": 8.99,
            "stock": 100,
            "cover_url": "https://example.com/1984.jpg",
            "genres": ["Fiction", "Dystopian"]
        },
        {
            "title": "The Hobbit",
            "author": "J.R.R. Tolkien",
            "isbn": "9780547928227",
            "description": "A fantasy novel about the adventures of Bilbo Baggins.",
            "price": 12.50,
            "stock": 25,
            "cover_url": "https://example.com/hobbit.jpg",
            "genres": ["Fantasy", "Adventure"]
        },
         {
            "title": "Harry Potter and the Sorcerer's Stone",
            "author": "J.K. Rowling",
            "isbn": "9780590353427",
            "description": "A young wizard discovers his magical heritage.",
            "price": 14.99,
            "stock": 60,
            "cover_url": "https://example.com/harry_potter.jpg",
            "genres": ["Fantasy", "Young Adult"]
        },
         {
            "title": "Pride and Prejudice",
            "author": "Jane Austen",
            "isbn": "9780141439518",
            "description": "A romantic novel of manners.",
            "price": 6.99,
            "stock": 40,
            "cover_url": "https://example.com/pride.jpg",
            "genres": ["Classic", "Romance"]
        }
    ]

    session = SessionLocal()
    try:
        inserted_count = 0
        for book_data in sample_books:
            # Check if book exists (by ISBN)
            existing_book = session.query(Book).filter(Book.isbn == book_data["isbn"]).first()
            if existing_book:
                print(f"   Skipping {book_data['title']} (Already exists)")
                continue

            # Create Book Object
            new_book = Book(
                id=uuid.uuid4(),
                title=book_data["title"],
                author=book_data["author"],
                isbn=book_data["isbn"],
                description=book_data["description"],
                price=book_data["price"],
                stock=book_data["stock"],
                cover_url=book_data["cover_url"],
                genres=book_data["genres"]
            )
            session.add(new_book)
            inserted_count += 1
        
        session.commit()
        print(f"✅ Successfully added {inserted_count} new books to the database!")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error Seeding Database: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_books()
