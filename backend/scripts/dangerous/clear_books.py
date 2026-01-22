"""Clear all books from database."""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.book import Book


def main():
    """Clear all books from database."""
    
    db = SessionLocal()
    
    try:
        # Count books
        book_count = db.query(Book).count()
        
        if book_count == 0:
            print("[INFO] Database is already empty!")
            return
        
        print(f"[WARNING] Found {book_count} books in database")
        print("Are you sure you want to DELETE ALL books? (yes/no): ", end='')
        
        confirmation = input().strip().lower()
        
        if confirmation != 'yes':
            print("[CANCELLED] No books deleted.")
            return
        
        # Delete all books
        print(f"\nDeleting {book_count} books...")
        deleted = db.query(Book).delete()
        db.commit()
        
        print(f"\n[SUCCESS] Deleted {deleted} books!")
        print(f"  Books remaining: {db.query(Book).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Failed to delete books: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()
