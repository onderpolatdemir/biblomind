"""Generate embeddings for all books in the database."""

import sys
import os
import asyncio
from pathlib import Path

# Add backend directory to path (2 levels up: data/scripts -> data -> backend)
backend_dir = Path(__file__).parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.book import Book
from app.services.openai_service import OpenAIService


async def generate_embeddings():
    """Generate embeddings for all books without embeddings."""
    
    db = SessionLocal()
    openai_service = OpenAIService()
    
    try:
        print("=" * 70)
        print("  🤖 GENERATING BOOK EMBEDDINGS")
        print("=" * 70 + "\n")
        
        # Get books without embeddings
        books_without_embeddings = db.query(Book).filter(
            Book.embedding.is_(None)
        ).all()
        
        if not books_without_embeddings:
            print("✅ All books already have embeddings!")
            return
        
        print(f"Found {len(books_without_embeddings)} books without embeddings\n")
        
        success_count = 0
        failed_count = 0
        
        for i, book in enumerate(books_without_embeddings, 1):
            try:
                # Create text representation for embedding
                # Combine title, author, description, and genres
                text_parts = [
                    f"Title: {book.title}",
                    f"Author: {book.author or 'Unknown'}",
                ]
                
                if book.description:
                    text_parts.append(f"Description: {book.description[:300]}")
                
                if book.genres:
                    text_parts.append(f"Genres: {', '.join(book.genres)}")
                
                embedding_text = "\n".join(text_parts)
                
                print(f"[{i}/{len(books_without_embeddings)}] Processing: {book.title}")
                print(f"   Author: {book.author}")
                print(f"   Text length: {len(embedding_text)} chars")
                
                # Generate embedding
                embedding = await openai_service.generate_embedding(
                    text=embedding_text,
                    use_cache=True
                )
                
                # Update book
                book.embedding = embedding
                db.add(book)
                
                print(f"   ✅ Embedding generated ({len(embedding)} dimensions)\n")
                success_count += 1
                
                # Commit every 5 books to avoid losing progress
                if i % 5 == 0:
                    db.commit()
                    print(f"   💾 Saved batch (checkpoint at {i} books)\n")
                
            except Exception as e:
                print(f"   ❌ Failed: {e}\n")
                failed_count += 1
                continue
        
        # Final commit
        db.commit()
        
        print("\n" + "=" * 70)
        print("  ✅ EMBEDDING GENERATION COMPLETED!")
        print("=" * 70 + "\n")
        
        print("📊 SUMMARY:")
        print(f"  • Total processed: {len(books_without_embeddings)}")
        print(f"  • Success: {success_count}")
        print(f"  • Failed: {failed_count}")
        
        # Verify
        total_with_embeddings = db.query(Book).filter(
            Book.embedding.isnot(None)
        ).count()
        total_books = db.query(Book).count()
        
        print(f"\n📈 DATABASE STATUS:")
        print(f"  • Books with embeddings: {total_with_embeddings}/{total_books}")
        
        if total_with_embeddings == total_books:
            print("\n🎉 All books now have embeddings!")
            print("\n📚 NEXT STEP:")
            print("  python scripts/index_books_to_es.py")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        await openai_service.close()
        db.close()


if __name__ == "__main__":
    asyncio.run(generate_embeddings())
