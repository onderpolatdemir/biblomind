import sys
import os
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.book import Book

def reduce_genres():
    db = SessionLocal()
    try:
        books = db.query(Book).all()
        updated_count = 0
        
        for book in books:
            if book.genres:
                # Flatten the genres into a list of strings
                flattened_genres = []
                for g_str in book.genres:
                    for part in g_str.split(","):
                        genre = part.strip()
                        if genre and genre not in flattened_genres:
                            flattened_genres.append(genre)
                
                # If there are more than 3 genres, truncate to the first 3
                if len(flattened_genres) > 3:
                    book.genres = flattened_genres[:3]
                    updated_count += 1
                elif flattened_genres != book.genres:
                    # Also update if it just needed cleaning up / flattening
                    book.genres = flattened_genres
                    updated_count += 1

        db.commit()
        print(f"Successfully processed {len(books)} books.")
        print(f"Updated genres for {updated_count} books.")
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reduce_genres()
