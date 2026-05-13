"""RAG (Retrieval Augmented Generation) service for chatbot context."""

import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from fuzzywuzzy import fuzz

from app.models.book import Book
from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)


class RAGService:
    """Service for RAG pipeline: book detection, retrieval, and context building."""
    
    def __init__(self, db: Session):
        """
        Initialize RAG service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.openai_service = OpenAIService()
    
    async def detect_book_mentions(
        self,
        message: str,
        threshold: float = 0.70
    ) -> List[Book]:
        """
        Detect book mentions in user message using fuzzy string matching.
        
        This prevents GPT hallucinations by finding actual books in database
        when user mentions specific book titles.
        
        Args:
            message: User's message
            threshold: Fuzzy matching threshold (0.0-1.0), default 0.70
            
        Returns:
            List of detected books
        """
        try:
            # Get all book titles from database
            all_books = self.db.query(Book).filter(Book.stock > 0).all()
            
            detected_books = []
            message_lower = message.lower()
            
            for book in all_books:
                # Calculate fuzzy match score for title
                title_score = fuzz.partial_ratio(book.title.lower(), message_lower) / 100.0
                
                # Also check author name
                author_score = 0.0
                if book.author:
                    author_score = fuzz.partial_ratio(book.author.lower(), message_lower) / 100.0
                
                # If either title or author matches above threshold
                if title_score >= threshold or author_score >= threshold:
                    detected_books.append(book)
                    logger.info(
                        f"Detected book mention: '{book.title}' "
                        f"(title_score={title_score:.2f}, author_score={author_score:.2f})"
                    )
            
            logger.info(f"Detected {len(detected_books)} book mentions in message")
            return detected_books
            
        except Exception as e:
            logger.error(f"Error detecting book mentions: {e}")
            return []
    
    async def retrieve_relevant_books(
        self,
        query: str,
        limit: int = 3,
        exclude_ids: Optional[List[UUID]] = None,
        similarity_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant books using semantic search (pgvector).
        
        Args:
            query: Search query
            limit: Maximum number of books to return
            exclude_ids: Book IDs to exclude (e.g., already detected books)
            similarity_threshold: Minimum cosine similarity (0.0-1.0)
            
        Returns:
            List of books with similarity scores
        """
        try:
            # Generate embedding for query
            query_embedding = await self.openai_service.generate_embedding(query)
            
            # Build query
            query_filter = and_(
                Book.embedding.isnot(None),
                Book.stock > 0
            )
            
            # Exclude specified book IDs
            if exclude_ids:
                query_filter = and_(query_filter, ~Book.id.in_(exclude_ids))
            
            # Perform vector similarity search
            # Using <=> operator for cosine distance (lower = more similar)
            books = (
                self.db.query(
                    Book,
                    (1 - Book.embedding.cosine_distance(query_embedding)).label("similarity")
                )
                .filter(query_filter)
                .order_by(Book.embedding.cosine_distance(query_embedding))
                .limit(limit * 2)  # Get more results to filter by threshold
                .all()
            )
            
            # Filter by similarity threshold and format results
            results = []
            for book, similarity in books:
                if similarity >= similarity_threshold:
                    results.append({
                        "id": book.id,
                        "title": book.title,
                        "author": book.author,
                        "genre": book.genres,
                        "description": book.description,
                        "price": float(book.price) if book.price else None,
                        "similarity_score": float(similarity)
                    })
                    
                    if len(results) >= limit:
                        break
            
            logger.info(
                f"Retrieved {len(results)} relevant books "
                f"(query length: {len(query)}, threshold: {similarity_threshold})"
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error retrieving relevant books: {e}")
            return []
    
    async def get_popular_books(
        self,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get popular books for new users (fallback strategy).
        
        Based on interaction count and stock availability.
        
        Args:
            limit: Maximum number of books to return
            
        Returns:
            List of popular books
        """
        try:
            from app.models.user_interaction import UserInteraction
            
            # Get books with most interactions
            popular_books = (
                self.db.query(
                    Book,
                    func.count(UserInteraction.id).label("interaction_count")
                )
                .outerjoin(UserInteraction, Book.id == UserInteraction.book_id)
                .filter(Book.stock > 0)
                .group_by(Book.id)
                .order_by(func.count(UserInteraction.id).desc())
                .limit(limit)
                .all()
            )
            
            results = []
            for book, interaction_count in popular_books:
                results.append({
                    "id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "genre": book.genres,
                    "description": book.description,
                    "price": float(book.price) if book.price else None,
                    "interaction_count": interaction_count
                })
            
            logger.info(f"Retrieved {len(results)} popular books")
            return results
            
        except Exception as e:
            logger.error(f"Error getting popular books: {e}")
            return []
    
    def build_context(
        self,
        books: List[Dict[str, Any]],
        max_books: int = 3
    ) -> str:
        """
        Build context string from books for LLM prompt.
        
        Format: Compact and token-efficient.
        
        Args:
            books: List of book dictionaries
            max_books: Maximum number of books to include
            
        Returns:
            Formatted context string
        """
        if not books:
            return "Context: No relevant books were found in the database."

        # Limit books
        books = books[:max_books]

        context_lines = ["RELEVANT BOOKS:"]

        for i, book in enumerate(books, 1):
            # Format: Number. Title - Author (Genre)
            book_line = f"{i}. {book['title']} - {book['author']}"

            if book.get('genre'):
                book_line += f" ({book['genre']})"

            # Add similarity score if available
            if 'similarity_score' in book:
                score_percent = int(book['similarity_score'] * 100)
                book_line += f" [Match: {score_percent}%]"

            context_lines.append(book_line)

            # Add description (truncated)
            if book.get('description'):
                desc = book['description'][:150]
                if len(book['description']) > 150:
                    desc += "..."
                context_lines.append(f"   Description: {desc}")

            # Add price if available
            if book.get('price'):
                context_lines.append(f"   Price: ${book['price']}")
        
        context = "\n".join(context_lines)
        
        logger.debug(f"Built context with {len(books)} books ({len(context)} chars)")
        
        return context
    
    def build_book_references(
        self,
        books: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Build book reference metadata for response.
        
        Args:
            books: List of book dictionaries
            
        Returns:
            List of book reference objects for API response
        """
        references = []
        
        for book in books:
            ref = {
                "id": str(book['id']),
                "title": book['title'],
                "author": book['author']
            }
            
            if 'similarity_score' in book:
                ref['similarity_score'] = book['similarity_score']
            
            references.append(ref)
        
        return references
    
    async def close(self):
        """Close OpenAI service connections."""
        await self.openai_service.close()
