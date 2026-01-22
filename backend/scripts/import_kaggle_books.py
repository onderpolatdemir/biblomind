#!/usr/bin/env python3
"""
Import books from Kaggle Goodreads dataset.

Dataset: https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks
File: books.csv (~11MB, 10,000 books)

Usage:
    python scripts/import_kaggle_books.py path/to/books.csv --limit 500
"""

import sys
import os
import csv
import random
import argparse
from decimal import Decimal
from pathlib import Path
from typing import List, Dict, Any

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.book import Book
from sqlalchemy import exists


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


def parse_kaggle_csv(csv_path: str, limit: int = 500) -> List[Dict[str, Any]]:
    """
    Parse Kaggle Goodreads CSV file.
    
    Expected columns:
    - bookID, title, authors, average_rating, isbn, isbn13
    - language_code, num_pages, ratings_count, text_reviews_count
    - publication_date, publisher
    """
    books = []
    
    print(f"Reading CSV: {csv_path}")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for i, row in enumerate(reader):
            if i >= limit:
                break
            
            # Skip non-English books (optional filter)
            language = row.get('language_code', 'eng')
            if language not in ['eng', 'en-US', 'en-GB', 'eng-US']:
                continue
            
            # Extract fields
            title = row.get('title', '').strip()
            authors = row.get('authors', '').strip()
            isbn = row.get('isbn', '').strip() or row.get('isbn13', '').strip()
            
            # Skip if missing critical fields
            if not title or not authors:
                continue
            
            # Generate Turkish-like description (simplified)
            avg_rating = row.get('average_rating', '0')
            num_pages = row.get('  num_pages', '0').strip()
            
            description = (
                f"{title}, {authors} tarafından yazılmış "
                f"bir kitaptır. "
            )
            
            if avg_rating and float(avg_rating) > 0:
                description += f"Ortalama {avg_rating} puan almış. "
            
            if num_pages and int(num_pages) > 0:
                description += f"{num_pages} sayfa. "
            
            # Infer genres
            genres = infer_genres(title, authors)
            
            # Generate random price and stock
            price = round(random.uniform(25.0, 120.0), 2)
            stock = random.randint(3, 40)
            
            books.append({
                "title": title,
                "author": authors,
                "isbn": isbn if isbn else None,
                "description": description,
                "genres": genres,
                "price": Decimal(str(price)),
                "stock": stock,
                "cover_url": None  # Will be generated from ISBN if available
            })
            
            if (i + 1) % 100 == 0:
                print(f"  Parsed {i + 1} books...")
    
    print(f"\nTotal books parsed: {len(books)}")
    return books


def import_books(books_data: List[Dict[str, Any]], skip_duplicates: bool = True):
    """Import books to database with duplicate checking."""
    
    db = SessionLocal()
    
    try:
        print(f"\nImporting {len(books_data)} books to database...")
        
        imported = 0
        skipped = 0
        
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
            
            # Create book
            book = Book(**book_data)
            db.add(book)
            imported += 1
            
            # Commit in batches
            if (i + 1) % 50 == 0:
                db.commit()
                print(f"  Imported {imported} books (skipped {skipped} duplicates)...")
        
        # Final commit
        db.commit()
        
        print(f"\n[SUCCESS] Import complete!")
        print(f"  Imported: {imported} books")
        print(f"  Skipped: {skipped} duplicates")
        print(f"  Total in DB: {db.query(Book).count()} books")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Import failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description='Import books from Kaggle Goodreads dataset')
    parser.add_argument('csv_path', help='Path to books.csv file')
    parser.add_argument('--limit', type=int, default=500, help='Maximum books to import (default: 500)')
    parser.add_argument('--skip-duplicates', action='store_true', default=True, help='Skip duplicate books')
    
    args = parser.parse_args()
    
    # Validate CSV exists
    if not Path(args.csv_path).exists():
        print(f"[ERROR] CSV file not found: {args.csv_path}")
        print("\nPlease download the dataset from:")
        print("https://www.kaggle.com/datasets/jealousleopard/goodreadsbooks")
        sys.exit(1)
    
    print("=" * 70)
    print("KAGGLE GOODREADS DATASET IMPORT")
    print("=" * 70)
    print(f"CSV Path: {args.csv_path}")
    print(f"Limit: {args.limit} books")
    print(f"Skip Duplicates: {args.skip_duplicates}")
    print("=" * 70)
    
    # Parse CSV
    books_data = parse_kaggle_csv(args.csv_path, limit=args.limit)
    
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
