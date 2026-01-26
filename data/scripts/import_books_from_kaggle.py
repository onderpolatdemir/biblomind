#!/usr/bin/env python3
"""
Import books from Kaggle Goodreads dataset with cover images.

Recommended Dataset: 
https://www.kaggle.com/datasets/thedevastator/comprehensive-overview-of-52478-goodreads-best-b
(52,478 Goodreads Best Books)

Alternative: 
https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks
(10,000 books)

Usage:
    # data/ klasöründen çalıştır
    cd data
    python scripts/import_books_from_kaggle.py books.csv --limit 500
    
    # veya tam yol ile
    python scripts/import_books_from_kaggle.py data/books.csv --limit 500
"""

import sys
import os
import csv
import random
import argparse
import requests
from decimal import Decimal
from pathlib import Path
from typing import List, Dict, Any, Optional

# Backend path ekle (2 seviye yukarı: data/scripts -> data -> backend)
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.book import Book
from sqlalchemy import exists

# Open Library Cover URL template
OPENLIBRARY_COVER_URL = "https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"

# Genre mapping from Kaggle to our system
GENRE_MAPPING = {
    "fiction": ["Fiction"],
    "fantasy": ["Fantasy"],
    "science fiction": ["Science Fiction"],
    "mystery": ["Mystery"],
    "thriller": ["Thriller"],
    "romance": ["Romance"],
    "historical fiction": ["Historical Fiction"],
    "horror": ["Horror"],
    "young adult": ["Young Adult"],
    "children": ["Children's Literature"],
    "classics": ["Classic"],
    "biography": ["Biography"],
    "history": ["History", "Non-Fiction"],
    "philosophy": ["Philosophy", "Non-Fiction"],
    "poetry": ["Poetry"],
    "science": ["Science", "Non-Fiction"],
    "self-help": ["Self-Help", "Non-Fiction"],
    "business": ["Business", "Non-Fiction"],
}


def is_valid_isbn(isbn: str) -> bool:
    """
    Check if ISBN is valid (not a placeholder or invalid).
    
    Args:
        isbn: ISBN string
        
    Returns:
        True if valid, False otherwise
    """
    if not isbn:
        return False
    
    # Clean ISBN
    isbn_clean = isbn.replace('-', '').replace(' ', '').strip()
    
    # Check length (ISBN-10: 10 digits, ISBN-13: 13 digits)
    if len(isbn_clean) not in [10, 13]:
        return False
    
    # Check if all digits (or X for ISBN-10)
    if not isbn_clean.replace('X', '').replace('x', '').isdigit():
        return False
    
    # Reject placeholder/invalid ISBNs
    invalid_patterns = [
        '9999999999',      # 10-digit placeholder
        '9999999999999',   # 13-digit placeholder
        '0000000000',      # All zeros
        '0000000000000',
        '1111111111',      # Repeated digits
        '1111111111111',
    ]
    
    if isbn_clean in invalid_patterns:
        return False
    
    return True


def get_cover_url_from_isbn(isbn: str, download_covers: bool = False) -> Optional[str]:
    """
    Get book cover URL from Open Library using ISBN.
    
    Args:
        isbn: Book ISBN (10 or 13 digits)
        download_covers: If True, verify cover exists by making HEAD request
    
    Returns:
        Cover URL if available, None otherwise
    """
    if not isbn or not is_valid_isbn(isbn):
        return None
    
    # Clean ISBN (remove hyphens, spaces)
    isbn_clean = isbn.replace('-', '').replace(' ', '').strip()
    
    # Generate Open Library cover URL
    cover_url = OPENLIBRARY_COVER_URL.format(isbn=isbn_clean)
    
    # Optional: Verify cover exists (adds ~200ms per book)
    if download_covers:
        try:
            response = requests.head(cover_url, timeout=2)
            if response.status_code == 200:
                return cover_url
            else:
                return None  # Cover not found
        except:
            return None  # Network error
    
    # Return URL without verification (faster)
    return cover_url


def infer_genres(title: str, author: str) -> List[str]:
    """
    Infer genres based on title and author keywords.
    Fallback to Fiction if no match.
    """
    text = f"{title} {author}".lower()
    
    # Check for genre keywords
    for keyword, genres in GENRE_MAPPING.items():
        if keyword in text:
            return genres
    
    # Popular author genre mapping
    author_genres = {
        "tolkien": ["Fantasy", "Adventure"],
        "rowling": ["Fantasy", "Young Adult"],
        "orwell": ["Classic", "Political Fiction"],
        "christie": ["Mystery", "Crime"],
        "king": ["Horror", "Thriller"],
        "austen": ["Classic", "Romance"],
        "hemingway": ["Classic", "Literature"],
        "dan brown": ["Mystery", "Thriller"],
        "coelho": ["Fiction", "Philosophy"],
    }
    
    author_lower = author.lower()
    for author_key, genres in author_genres.items():
        if author_key in author_lower:
            return genres
    
    # Default
    return ["Fiction"]


def parse_kaggle_csv(csv_path: str, limit: int = 500, download_covers: bool = False) -> List[Dict[str, Any]]:
    """
    Parse Kaggle Goodreads CSV file and select MOST POPULAR books.
    
    Selection criteria:
    1. Sort by numRatings/ratings_count (most popular first)
    2. Only English books
    3. Must have: title, author, ISBN
    4. Uses existing description or generates Turkish one
    
    Supported CSV formats:
    Format 1 (Best Books Ever):
    - bookId, title, author, rating, description, language, isbn, 
      genres, pages, publisher, numRatings
    
    Format 2 (Standard Goodreads):
    - bookID, title, authors, average_rating, isbn, isbn13,
      language_code, num_pages, ratings_count
    """
    print(f"Reading CSV: {csv_path}")
    print("Step 1: Loading and filtering books with complete data...")
    
    all_books = []
    skipped_no_data = 0
    skipped_language = 0
    seen_isbns = set()  # Track ISBNs to avoid duplicates in CSV
    
    # UTF-8 encoding with BOM support to prevent character corruption
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader):
            # Skip non-English books
            # CSV has 'language' column (not 'language_code')
            language = row.get('language', row.get('language_code', 'English')).strip()
            if language.lower() not in ['english', 'eng', 'en-us', 'en-gb', 'en']:
                skipped_language += 1
                continue
            
            # Extract fields
            # CSV has 'author' (not 'authors')
            title = row.get('title', '').strip()
            authors = row.get('author', row.get('authors', '')).strip()
            isbn_raw = row.get('isbn', '').strip()
            
            # Validate ISBN (reject placeholders like 9999999999999)
            isbn = isbn_raw if is_valid_isbn(isbn_raw) else None
            
            # Skip if ISBN is duplicate in CSV (multiple editions)
            if isbn and isbn in seen_isbns:
                skipped_no_data += 1
                continue
            
            if isbn:
                seen_isbns.add(isbn)
            
            # Get rating and review counts for popularity sorting
            # CSV has 'numRatings' (not 'ratings_count') and 'rating' (not 'average_rating')
            try:
                ratings_count = int(row.get('numRatings', row.get('ratings_count', 0)) or 0)
                avg_rating = float(row.get('rating', row.get('average_rating', 0)) or 0)
            except:
                ratings_count = 0
                avg_rating = 0.0
            
            # Get genres from CSV (multiple genres separated by |, brackets, etc.)
            genres_raw = row.get('genres', '').strip()
            
            if genres_raw:
                # Parse genres: can be like "['Fantasy', 'Young Adult']" or "Fantasy|Young Adult"
                genres_raw = genres_raw.replace('[', '').replace(']', '').replace("'", '').replace('"', '')
                genres_list = [g.strip() for g in genres_raw.split('|') if g.strip()]
                
                # If no genres parsed, try comma separation
                if not genres_list:
                    genres_list = [g.strip() for g in genres_raw.split(',') if g.strip()]
                
                # Use parsed genres if valid
                if genres_list:
                    genres = genres_list[:3]  # Max 3 genres
                else:
                    # Fallback to inference
                    genres = infer_genres(title, authors)
            else:
                # Infer genres from title/author
                genres = infer_genres(title, authors)
            
            # Get existing description if available
            existing_description = row.get('description', '').strip()
            
            # STRICT VALIDATION: Must have title, author, description, ISBN
            # Cover URL will be added if ISBN exists
            if not title or not authors or not existing_description or not isbn:
                skipped_no_data += 1
                continue
            
            # Get number of pages (CSV has 'pages' column)
            num_pages = row.get('pages', row.get('  num_pages', '0')).strip()
            try:
                num_pages_int = int(num_pages) if num_pages else 0
            except:
                num_pages_int = 0
            
            # Use description from CSV (limit length for DB)
            description = existing_description[:500]  # Limit to 500 chars
            
            # Store book with popularity metrics
            all_books.append({
                "title": title,
                "author": authors,
                "isbn": isbn,
                "description": description,
                "genres": genres,
                "ratings_count": ratings_count,  # For sorting
                "avg_rating": avg_rating,
            })
            
            if (i + 1) % 1000 == 0:
                print(f"  Processed {i + 1} rows... Found {len(all_books)} valid books")
    
    print(f"\nStep 2: Filtering complete!")
    print(f"  Valid books: {len(all_books)}")
    print(f"  Skipped (no data): {skipped_no_data}")
    print(f"  Skipped (language): {skipped_language}")
    
    # Sort by popularity (ratings_count DESC, then avg_rating DESC)
    print(f"\nStep 3: Sorting by popularity (ratings_count)...")
    all_books.sort(key=lambda x: (x['ratings_count'], x['avg_rating']), reverse=True)
    
    # Select top N books
    selected_books = all_books[:limit]
    
    print(f"\nStep 4: Selected TOP {len(selected_books)} most popular books")
    if selected_books:
        print(f"  #1 Most popular: '{selected_books[0]['title']}' ({selected_books[0]['ratings_count']:,} ratings)")
        if len(selected_books) >= 10:
            print(f"  #10: '{selected_books[9]['title']}' ({selected_books[9]['ratings_count']:,} ratings)")
        print(f"  #{len(selected_books)}: '{selected_books[-1]['title']}' ({selected_books[-1]['ratings_count']:,} ratings)")
    
    # Add price, stock, and cover URL to selected books
    print(f"\nStep 5: Adding price, stock, and cover URLs...")
    final_books = []
    for i, book in enumerate(selected_books, 1):
        # Generate random price and stock
        price = round(random.uniform(25.0, 120.0), 2)
        stock = random.randint(3, 40)
        
        # Get cover URL from Open Library
        cover_url = get_cover_url_from_isbn(book['isbn'], download_covers=download_covers)
        
        final_books.append({
            "title": book['title'],
            "author": book['author'],
            "isbn": book['isbn'],
            "description": book['description'],
            "genres": book['genres'],
            "price": Decimal(str(price)),
            "stock": stock,
            "cover_url": cover_url
        })
        
        if i % 100 == 0:
            print(f"  Processed {i}/{len(selected_books)} books...")
    
    print(f"\nTotal books ready for import: {len(final_books)}")
    print("=" * 70)
    return final_books


def import_books(books_data: List[Dict[str, Any]], skip_duplicates: bool = True):
    """Import books to database with duplicate checking."""
    
    db = SessionLocal()
    
    try:
        print(f"\nImporting {len(books_data)} books to database...")
        
        imported = 0
        skipped = 0
        skipped_isbn = 0
        
        for i, book_data in enumerate(books_data):
            # Check for duplicates (by title + author)
            if skip_duplicates:
                exists_query = db.query(exists().where(
                    Book.title == book_data['title'],
                    Book.author == book_data['author']
                )).scalar()
                
                if exists_query:
                    skipped += 1
                    continue
            
            # Check for duplicate ISBN (if ISBN exists)
            if book_data.get('isbn'):
                isbn_exists = db.query(exists().where(
                    Book.isbn == book_data['isbn']
                )).scalar()
                
                if isbn_exists:
                    # Skip this book - duplicate ISBN
                    skipped_isbn += 1
                    continue
            
            # Create book
            book = Book(**book_data)
            db.add(book)
            imported += 1
            
            # Commit in batches
            if (i + 1) % 50 == 0:
                db.commit()
                print(f"  Imported {imported} books (skipped {skipped} duplicates, {skipped_isbn} duplicate ISBNs)...")
        
        # Final commit
        db.commit()
        
        print(f"\n[SUCCESS] Import complete!")
        print(f"  Imported: {imported} books")
        print(f"  Skipped (duplicate title/author): {skipped}")
        print(f"  Skipped (duplicate ISBN): {skipped_isbn}")
        print(f"  Total in DB: {db.query(Book).count()} books")
        
        # Stats about ISBNs
        books_with_isbn = db.query(Book).filter(Book.isbn.isnot(None)).count()
        print(f"  Books with valid ISBN: {books_with_isbn}/{db.query(Book).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Import failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Import books from Kaggle Goodreads dataset with covers')
    parser.add_argument('csv_path', help='Path to books.csv file')
    parser.add_argument('--limit', type=int, default=500, help='Maximum books to import (default: 500)')
    parser.add_argument('--skip-duplicates', action='store_true', default=True, help='Skip duplicate books')
    parser.add_argument('--download-covers', action='store_true', help='Verify cover images exist (slower but safer)')
    
    args = parser.parse_args()
    
    # Validate CSV exists
    csv_path = Path(args.csv_path)
    if not csv_path.exists():
        print(f"[ERROR] CSV file not found: {csv_path}")
        print("\nPlease download one of these datasets:")
        print("1. Goodreads Best Books (52K - RECOMMENDED):")
        print("   https://www.kaggle.com/datasets/thedevastator/comprehensive-overview-of-52478-goodreads-best-b")
        print()
        print("2. Goodreads Books (10K):")
        print("   https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks")
        print()
        print("Then place books.csv in: data/books.csv")
        sys.exit(1)
    
    print("=" * 70)
    print("KAGGLE GOODREADS DATASET IMPORT (WITH COVER IMAGES)")
    print("=" * 70)
    print(f"CSV Path: {csv_path}")
    print(f"Limit: {args.limit} books")
    print(f"Skip Duplicates: {args.skip_duplicates}")
    print(f"Verify Covers: {args.download_covers}")
    print(f"Cover Source: Open Library (covers.openlibrary.org)")
    print("=" * 70)
    
    # Parse CSV
    download_covers = getattr(args, 'download_covers', False)
    books_data = parse_kaggle_csv(str(csv_path), limit=args.limit, download_covers=download_covers)
    
    if not books_data:
        print("\n[ERROR] No books parsed from CSV!")
        sys.exit(1)
    
    # Import to database
    import_books(books_data, skip_duplicates=args.skip_duplicates)
    
    print("\n" + "=" * 70)
    print("NEXT STEPS:")
    print("=" * 70)
    print("1. Generate embeddings:")
    print("   python scripts/generate_book_embeddings.py")
    print()
    print("2. Index to Elasticsearch:")
    print("   python scripts/index_books_to_es.py")
    print("=" * 70)


if __name__ == "__main__":
    main()
