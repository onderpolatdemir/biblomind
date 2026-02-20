import csv
import ast
import sys
import os
from decimal import Decimal
import random

# Add the parent directory to sys.path to allow importing app modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from app.models.book import Book

def import_books():
    # Path to the CSV file
    csv_file_path = os.path.join(os.path.dirname(__file__), '../../data/books_1.Best_Books_Ever.csv')
    
    session = SessionLocal()
    
    try:
        # Clear existing books first
        print("Clearing existing books...")
        try:
            deleted_count = session.query(Book).delete()
            print(f"Deleted {deleted_count} existing books.")
            session.commit()
        except Exception as e:
            session.rollback()
            print(f"Delete failed (possibly Foreign Keys): {e}")

        seen_isbns = set()

        with open(csv_file_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            count = 0
            for row in reader:
                try:
                    # Parse fields
                    title = row.get('title')
                    if not title: continue
                    
                    author = row.get('author')
                    description = row.get('description')

                    # ... ISBN parsing ...
                    isbn = row.get('isbn')
                    if isbn:
                        isbn = ''.join(c for c in isbn if c.isalnum())
                        if len(isbn) > 13: isbn = isbn[:13]
                    
                    if not isbn or len(isbn) < 10:
                        isbn = f"FAKE{count:09d}"

                    if isbn in seen_isbns:
                        continue
                    seen_isbns.add(isbn)
                    
                    # ... rest ...

                    # Parse Price
                    price_str = row.get('price', '')
                    try:
                        # Remove currency symbols and clean
                        clean_price = ''.join(c for c in price_str if c.isdigit() or c == '.')
                        if clean_price:
                            price = Decimal(clean_price)
                        else:
                            raise ValueError
                    except:
                        price = Decimal(random.uniform(9.99, 49.99)).quantize(Decimal("0.01"))
                        
                    # Parse Genres
                    genres_str = row.get('genres')
                    genres = []
                    if genres_str:
                        try:
                            genres = ast.literal_eval(genres_str)
                            # Ensure it's a list
                            if not isinstance(genres, list):
                                genres = []
                        except:
                            genres = []

                    # Cover URL
                    cover_url = row.get('coverImg')
                    
                    # Create Book Object
                    book = Book(
                        title=title[:255], # Truncate title if too long
                        author=author[:255] if author else "Unknown",
                        isbn=isbn,
                        description=description,
                        price=price,
                        stock=random.randint(0, 100),
                        cover_url=cover_url,
                        genres=genres
                    )
                    
                    session.add(book)
                    count += 1
                    
                    # Batch commit every 1000 items
                    if count % 1000 == 0:
                        try:
                            session.commit()
                            print(f"Committed batch up to {count}...")
                        except Exception as e:
                            session.rollback()
                            print(f"Error committing batch at {count}: {e}")
                            # Re-add items? No, that's complicated with session invalidation.
                            # With rollback, the objects in the session are expired.
                            # We accept losing this batch.
                        
                except Exception as e:
                    # print(f"Skipping row due to error: {e}")
                    continue
            
            # Final commit
            try:
                session.commit()
                print(f"Successfully imported {count} books total (processed).")
            except Exception as e:
                session.rollback()
                print(f"Error on final commit: {e}")
            
    except FileNotFoundError:
        print(f"Error: CSV file not found at {csv_file_path}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    import_books()
