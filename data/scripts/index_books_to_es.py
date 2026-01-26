"""
Script to index all books from PostgreSQL to Elasticsearch.

Usage: 
    cd data
    python scripts/index_books_to_es.py
"""

import sys
import os
from pathlib import Path

# Add backend directory to Python path (2 levels up: data/scripts -> data -> backend)
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.config import settings
from app.models.book import Book
from app.services.elasticsearch_service import es_service


def main():
    """Index all books to Elasticsearch."""
    
    print("\n" + "="*60)
    print("  ELASTICSEARCH BOOK INDEXING SCRIPT")
    print("="*60 + "\n")
    
    # Check Elasticsearch connection
    print("[1/5] Checking Elasticsearch connection...")
    if not es_service.ping():
        print("[X] Elasticsearch is not available!")
        print(f"    URL: {settings.ELASTICSEARCH_URL}")
        print("    Make sure Elasticsearch container is running:")
        print("    docker-compose up -d elasticsearch")
        return False
    
    print(f"[+] Connected to Elasticsearch: {settings.ELASTICSEARCH_URL}")
    
    # Create index
    print("\n[2/5] Creating index...")
    if es_service.create_index():
        print(f"[+] Index '{settings.ELASTICSEARCH_INDEX}' ready")
    else:
        print("[X] Failed to create index!")
        return False
    
    # Fetch books from database
    print("\n[3/5] Fetching books from PostgreSQL...")
    db = SessionLocal()
    try:
        books = db.query(Book).all()
        book_count = len(books)
        
        if book_count == 0:
            print("[!] No books found in database!")
            print("    Run import script first:")
            print("    python scripts/import_books_from_kaggle.py books.csv --limit 500")
            return False
        
        print(f"[+] Found {book_count} books in database")
        
        # Bulk index books
        print(f"\n[4/5] Indexing {book_count} books to Elasticsearch...")
        result = es_service.bulk_index_books(books)
        
        print(f"[+] Bulk indexing complete:")
        print(f"    Success: {result['success']}")
        print(f"    Failure: {result['failure']}")
        print(f"    Total:   {result['total']}")
        
        # Get index stats
        print("\n[5/5] Verifying index...")
        stats = es_service.get_index_stats()
        
        if stats.get("connected"):
            print(f"[+] Index verification:")
            print(f"    Index name: {stats['index_name']}")
            print(f"    Documents:  {stats['document_count']}")
            print(f"    Size:       {stats['size_bytes']} bytes")
        else:
            print(f"[X] Failed to get index stats: {stats.get('error')}")
        
        print("\n" + "="*60)
        if result['failure'] == 0:
            print("  ✅ SUCCESS! All books indexed to Elasticsearch")
        else:
            print(f"  ⚠️ PARTIAL SUCCESS! {result['failure']} books failed to index")
        print("="*60 + "\n")
        
        print("📚 NEXT STEPS:")
        print("1. Start backend: cd ../backend && python -m uvicorn app.main:app --reload")
        print("2. Test search in Swagger UI: http://localhost:8000/docs")
        print("3. Try: GET /api/books/search?q=1984")
        print("4. Test fuzzy: GET /api/books/search?q=Orwel")
        print()
        
        return result['failure'] == 0
        
    except Exception as e:
        print(f"\n[X] Error occurred: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
