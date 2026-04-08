"""Script to populate missing book embeddings in the database."""

import asyncio
import os
import sys
import logging
from typing import List

# Add the parent directory to sys.path to allow importing from 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.book import Book
from app.services.openai_service import OpenAIService
from app.core.config import settings

from sqlalchemy import select, and_
from app.models.user_interaction import UserInteraction

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def populate_book_embeddings(batch_size: int = 100):
    """Fetches all books without embeddings, prioritizing those with user interactions."""
    db = SessionLocal()
    openai_service = OpenAIService()
    
    try:
        # Step 1: Fetch books with interactions that lack embeddings
        interacted_books_query = db.query(Book).join(
            UserInteraction, Book.id == UserInteraction.book_id
        ).filter(Book.embedding == None).distinct()
        
        interacted_books = interacted_books_query.all()
        
        # Step 2: Fetch the rest of the books without embeddings
        # We'll process them after the interacted ones
        other_books = db.query(Book).filter(Book.embedding == None).all()
        
        # Merge lists, keeping interacted books first and avoiding duplicates
        interacted_ids = {b.id for b in interacted_books}
        books_to_update = interacted_books + [b for b in other_books if b.id not in interacted_ids]
        
        if not books_to_update:
            logger.info("No books found without embeddings.")
            return

        total_books = len(books_to_update)
        num_prioritized = len(interacted_books)
        logger.info(f"Total: {total_books} books. Prioritized (interacted): {num_prioritized}")
        logger.info(f"Starting generation in batches of {batch_size}...")

        for i in range(0, total_books, batch_size):

            batch_books = books_to_update[i:i + batch_size]
            batch_texts = []
            valid_indices = []

            for idx, book in enumerate(batch_books):
                content_parts = []
                if book.title: content_parts.append(book.title)
                if book.author: content_parts.append(f"yazar: {book.author}")
                if book.description: content_parts.append(book.description[:800]) # Limit description length
                if book.genres: content_parts.append(f"türler: {', '.join(book.genres)}")
                
                text = ". ".join(content_parts).strip()
                if text:
                    batch_texts.append(text)
                    valid_indices.append(idx)
                else:
                    logger.warning(f"Skipping book {book.id} - no content to embed.")

            if not batch_texts:
                continue

            try:
                logger.info(f"Processing batch {i//batch_size + 1}/{(total_books + batch_size - 1)//batch_size} ({len(batch_texts)} texts)")
                
                # Call OpenAI API directly for batching
                response = await openai_service.client.embeddings.create(
                    model=settings.OPENAI_EMBEDDING_MODEL,
                    input=batch_texts,
                    dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS
                )
                
                # Update book records
                for j, idx in enumerate(valid_indices):
                    batch_books[idx].embedding = response.data[j].embedding
                    db.add(batch_books[idx])
                
                # Commit after each batch
                db.commit()
                logger.info(f"Committed batch up to index {i + len(batch_books)}...")
                    
            except Exception as e:
                logger.error(f"Failed to generate embeddings for batch starting at {i}: {e}")
                db.rollback()
                # In case of batch failure, we might want to retry individually or skip
                continue

        logger.info("Successfully finished populating book embeddings.")

    except Exception as e:
        logger.error(f"An error occurred during process: {e}")
        db.rollback()
    finally:
        db.close()
        await openai_service.close()

if __name__ == "__main__":
    asyncio.run(populate_book_embeddings())
