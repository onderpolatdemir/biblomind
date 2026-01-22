"""Seed database with sample book data."""

import sys
import os
from decimal import Decimal

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.book import Book
from datetime import datetime, timezone


def seed_books():
    """Seed database with sample books."""
    
    db = SessionLocal()
    
    try:
        # Check if books already exist
        existing_count = db.query(Book).count()
        if existing_count > 0:
            print(f"WARNING: Database already has {existing_count} books. Skipping seed.")
            return
        
        books_data = [
            {
                "title": "1984",
                "author": "George Orwell",
                "isbn": "9780451524935",
                "description": "A dystopian social science fiction novel and cautionary tale about the future.",
                "price": Decimal("45.00"),
                "stock": 15,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg",
                "genres": ["Dystopian", "Science Fiction", "Political Fiction"]
            },
            {
                "title": "To Kill a Mockingbird",
                "author": "Harper Lee",
                "isbn": "9780061120084",
                "description": "A gripping tale of racial injustice and childhood innocence in the American South.",
                "price": Decimal("42.00"),
                "stock": 20,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg",
                "genres": ["Classic", "Fiction", "Historical Fiction"]
            },
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "isbn": "9780743273565",
                "description": "The story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.",
                "price": Decimal("38.00"),
                "stock": 12,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
                "genres": ["Classic", "Fiction", "American Literature"]
            },
            {
                "title": "Pride and Prejudice",
                "author": "Jane Austen",
                "isbn": "9780141439518",
                "description": "A romantic novel of manners following the character development of Elizabeth Bennet.",
                "price": Decimal("40.00"),
                "stock": 18,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg",
                "genres": ["Classic", "Romance", "Fiction"]
            },
            {
                "title": "The Catcher in the Rye",
                "author": "J.D. Salinger",
                "isbn": "9780316769488",
                "description": "The story of teenage rebellion and alienation narrated by Holden Caulfield.",
                "price": Decimal("44.00"),
                "stock": 10,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780316769488-L.jpg",
                "genres": ["Classic", "Fiction", "Coming of Age"]
            },
            {
                "title": "The Hobbit",
                "author": "J.R.R. Tolkien",
                "isbn": "9780547928227",
                "description": "A fantasy novel about the quest of Bilbo Baggins to win treasure guarded by a dragon.",
                "price": Decimal("50.00"),
                "stock": 25,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780547928227-L.jpg",
                "genres": ["Fantasy", "Adventure", "Classic"]
            },
            {
                "title": "Harry Potter and the Philosopher's Stone",
                "author": "J.K. Rowling",
                "isbn": "9780747532699",
                "description": "The first novel in the Harry Potter series about a young wizard's journey.",
                "price": Decimal("55.00"),
                "stock": 30,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg",
                "genres": ["Fantasy", "Young Adult", "Magic"]
            },
            {
                "title": "The Lord of the Rings",
                "author": "J.R.R. Tolkien",
                "isbn": "9780544003415",
                "description": "An epic high-fantasy novel about the quest to destroy the One Ring.",
                "price": Decimal("85.00"),
                "stock": 8,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780544003415-L.jpg",
                "genres": ["Fantasy", "Adventure", "Epic"]
            },
            {
                "title": "Animal Farm",
                "author": "George Orwell",
                "isbn": "9780451526342",
                "description": "An allegorical novella about a group of farm animals who rebel against their farmer.",
                "price": Decimal("35.00"),
                "stock": 22,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780451526342-L.jpg",
                "genres": ["Classic", "Political Fiction", "Satire"]
            },
            {
                "title": "Brave New World",
                "author": "Aldous Huxley",
                "isbn": "9780060850524",
                "description": "A dystopian novel set in a futuristic World State of genetically modified citizens.",
                "price": Decimal("43.00"),
                "stock": 14,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780060850524-L.jpg",
                "genres": ["Dystopian", "Science Fiction", "Classic"]
            },
            {
                "title": "The Da Vinci Code",
                "author": "Dan Brown",
                "isbn": "9780307474278",
                "description": "A mystery thriller novel following symbologist Robert Langdon.",
                "price": Decimal("48.00"),
                "stock": 16,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780307474278-L.jpg",
                "genres": ["Mystery", "Thriller", "Fiction"]
            },
            {
                "title": "The Alchemist",
                "author": "Paulo Coelho",
                "isbn": "9780062315007",
                "description": "A philosophical novel about a young shepherd's journey to find treasure.",
                "price": Decimal("41.00"),
                "stock": 19,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780062315007-L.jpg",
                "genres": ["Fiction", "Philosophy", "Adventure"]
            },
            {
                "title": "The Book Thief",
                "author": "Markus Zusak",
                "isbn": "9780375842207",
                "description": "A historical novel about a young girl living in Nazi Germany who steals books.",
                "price": Decimal("46.00"),
                "stock": 11,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780375842207-L.jpg",
                "genres": ["Historical Fiction", "War", "Young Adult"]
            },
            {
                "title": "The Chronicles of Narnia",
                "author": "C.S. Lewis",
                "isbn": "9780066238500",
                "description": "A series of seven fantasy novels set in the magical land of Narnia.",
                "price": Decimal("75.00"),
                "stock": 7,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780066238500-L.jpg",
                "genres": ["Fantasy", "Children's Literature", "Adventure"]
            },
            {
                "title": "The Hunger Games",
                "author": "Suzanne Collins",
                "isbn": "9780439023481",
                "description": "A dystopian novel about a televised fight to the death in a post-apocalyptic nation.",
                "price": Decimal("47.00"),
                "stock": 24,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780439023481-L.jpg",
                "genres": ["Dystopian", "Young Adult", "Science Fiction"]
            },
            {
                "title": "Fahrenheit 451",
                "author": "Ray Bradbury",
                "isbn": "9781451673319",
                "description": "A dystopian novel about a future society where books are outlawed.",
                "price": Decimal("39.00"),
                "stock": 13,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9781451673319-L.jpg",
                "genres": ["Dystopian", "Science Fiction", "Classic"]
            },
            {
                "title": "The Kite Runner",
                "author": "Khaled Hosseini",
                "isbn": "9781594631931",
                "description": "A story of friendship, betrayal, and redemption set in Afghanistan.",
                "price": Decimal("44.00"),
                "stock": 17,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg",
                "genres": ["Historical Fiction", "Drama", "Contemporary"]
            },
            {
                "title": "Life of Pi",
                "author": "Yann Martel",
                "isbn": "9780156027328",
                "description": "A philosophical novel about a boy's survival on a lifeboat with a Bengal tiger.",
                "price": Decimal("42.00"),
                "stock": 15,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780156027328-L.jpg",
                "genres": ["Adventure", "Fiction", "Philosophy"]
            },
            {
                "title": "The Girl with the Dragon Tattoo",
                "author": "Stieg Larsson",
                "isbn": "9780307454546",
                "description": "A crime thriller about a journalist and a hacker investigating a disappearance.",
                "price": Decimal("49.00"),
                "stock": 9,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780307454546-L.jpg",
                "genres": ["Mystery", "Thriller", "Crime"]
            },
            {
                "title": "Gone Girl",
                "author": "Gillian Flynn",
                "isbn": "9780307588371",
                "description": "A psychological thriller about a wife's disappearance on her fifth wedding anniversary.",
                "price": Decimal("46.00"),
                "stock": 21,
                "cover_url": "https://covers.openlibrary.org/b/isbn/9780307588371-L.jpg",
                "genres": ["Thriller", "Mystery", "Psychological"]
            }
        ]
        
        # Create book objects
        books = []
        for book_data in books_data:
            book = Book(**book_data)
            books.append(book)
        
        # Bulk insert
        db.bulk_save_objects(books)
        db.commit()
        
        print(f"Successfully seeded {len(books)} books!")
        
        # Display summary
        print("\nSample books added:")
        for i, book_data in enumerate(books_data[:5], 1):
            print(f"  {i}. {book_data['title']} by {book_data['author']} - ${book_data['price']}")
        print(f"  ... and {len(books_data) - 5} more books")
        
    except Exception as e:
        db.rollback()
        print(f"ERROR seeding books: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Starting book seed process...")
    seed_books()
    print("\nSeed completed!")
