"""Google Cloud Vision API service for OCR and text detection."""

import os
import logging
import asyncio
from typing import List, Dict, Any, Tuple
from google.cloud import vision
from google.api_core import exceptions as google_exceptions
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.config import settings
from app.models.book import Book
from app.utils.image_utils import validate_image, rotate_image, resize_if_large
from app.utils.fuzzy_matcher import (
    fuzzy_match_books,
    calculate_similarity,
    clean_detected_text,
    multi_method_score
)

logger = logging.getLogger(__name__)


class VisionService:
    """Google Cloud Vision API integration for book detection."""
    
    def __init__(self):
        """Initialize Vision API client."""
        # Set credentials path from config
        if settings.GOOGLE_APPLICATION_CREDENTIALS:
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = settings.GOOGLE_APPLICATION_CREDENTIALS
        
        # Initialize client
        try:
            self.client = vision.ImageAnnotatorClient()
            logger.info("Google Cloud Vision client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Vision client: {e}")
            raise
    
    async def detect_text_from_image(
        self,
        image_bytes: bytes,
        min_confidence: float = None
    ) -> List[str]:
        """
        Detect text from image using OCR with 4-direction rotation.
        
        Args:
            image_bytes: Image file bytes
            min_confidence: Minimum confidence threshold (default: from config)
            
        Returns:
            List of detected text strings (unique, cleaned)
            
        Raises:
            ValueError: If image is invalid
            google_exceptions.GoogleAPIError: If Vision API fails
        """
        # Validate image
        validate_image(image_bytes, max_size_mb=settings.MAX_UPLOAD_SIZE_MB)
        
        # Resize if too large
        image_bytes = resize_if_large(image_bytes, max_dimension=4096)
        
        # Use config threshold if not provided
        if min_confidence is None:
            min_confidence = settings.GOOGLE_VISION_CONFIDENCE_THRESHOLD
        
        # Detect text in all 4 rotations (parallel)
        logger.info("Starting OCR with 4-direction rotation")
        
        tasks = [
            self._rotate_and_detect(image_bytes, rotation, min_confidence)
            for rotation in [0, 90, 180, 270]
        ]
        
        # Run in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Combine results
        all_texts = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Rotation {i*90}° failed: {result}")
            else:
                all_texts.extend(result)
        
        # Remove duplicates and clean
        unique_texts = list(set(all_texts))
        cleaned_texts = [clean_detected_text(text) for text in unique_texts]
        cleaned_texts = [text for text in cleaned_texts if text]  # Remove empty
        
        logger.info(f"OCR complete: {len(cleaned_texts)} unique texts detected")
        return cleaned_texts
    
    async def _rotate_and_detect(
        self,
        image_bytes: bytes,
        rotation: int,
        min_confidence: float
    ) -> List[str]:
        """
        Rotate image and detect text.
        
        Args:
            image_bytes: Original image bytes
            rotation: Rotation degrees (0, 90, 180, 270)
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of detected texts
        """
        try:
            # Rotate image
            if rotation > 0:
                rotated_bytes = rotate_image(image_bytes, rotation)
            else:
                rotated_bytes = image_bytes
            
            # Prepare image for Vision API
            image = vision.Image(content=rotated_bytes)
            
            # Detect text (run in thread pool to avoid blocking)
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                self.client.text_detection,
                image
            )
            
            # Check for errors
            if response.error.message:
                raise google_exceptions.GoogleAPIError(
                    f"Vision API error: {response.error.message}"
                )
            
            # Extract detected text
            detected_texts = []
            
            # text_annotations[0] contains the full text detection (most reliable)
            # text_annotations[1:] contain individual words/phrases
            if response.text_annotations:
                # Use full text from first annotation
                full_text = response.text_annotations[0].description
                
                # Split by newlines to get individual text segments
                # This captures book titles that span multiple lines
                text_lines = [line.strip() for line in full_text.strip().split('\n')]
                detected_texts = [line for line in text_lines if line]
                
                logger.debug(
                    f"Rotation {rotation}°: {len(detected_texts)} text lines detected"
                )
            else:
                logger.debug(f"Rotation {rotation}°: No text detected")
            
            return detected_texts
            
        except Exception as e:
            logger.error(f"OCR failed at rotation {rotation}°: {e}")
            return []
    
    async def match_book_names(
        self,
        detected_texts: List[str],
        db: Session,
        threshold: float = 0.75,
        max_results: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Match detected texts with books in database using fuzzy matching.
        
        Args:
            detected_texts: List of text strings from OCR
            db: Database session
            threshold: Similarity threshold (0.0-1.0)
            max_results: Maximum number of results
            
        Returns:
            List of matched books with similarity scores
        """
        if not detected_texts:
            return []
        
        logger.info(f"Matching {len(detected_texts)} detected texts with database")
        
        # Get all books from database
        books = db.query(Book).all()
        
        if not books:
            logger.warning("No books in database to match")
            return []
        
        # Create candidate list (titles and authors)
        book_map = {}  # normalized_text -> book
        for book in books:
            # Add title
            if book.title:
                book_map[book.title.lower()] = book
            
            # Add author
            if book.author:
                book_map[book.author.lower()] = book
            
            # Add title + author combo
            if book.title and book.author:
                combo = f"{book.title} {book.author}".lower()
                book_map[combo] = book
        
        candidates = list(book_map.keys())
        
        # Match each detected text
        matched_books = {}  # book_id -> (book, best_score)
        
        for detected_text in detected_texts:
            if not detected_text:
                continue
            
            # Find matches
            matches = fuzzy_match_books(
                detected_text,
                candidates,
                threshold=threshold,
                method='token_sort',
                limit=5  # Top 5 per detected text
            )
            
            for matched_text, score in matches:
                book = book_map[matched_text]
                book_id = book.id
                
                # Keep best score for each book
                if book_id not in matched_books or score > matched_books[book_id][1]:
                    matched_books[book_id] = (book, score)
        
        # Format results
        results = []
        for book, score in matched_books.values():
            results.append({
                "id": str(book.id),
                "title": book.title,
                "author": book.author,
                "genres": book.genres,  # Fixed: was 'genre', should be 'genres'
                "price": float(book.price) if book.price else None,
                "cover_image": book.cover_url,  # Fixed: was 'cover_image', should be 'cover_url'
                "similarity_score": round(score, 3)
            })
        
        # Sort by similarity score descending
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Limit results
        results = results[:max_results]
        
        logger.info(f"Matched {len(results)} books (threshold: {threshold})")
        
        return results
    
    @staticmethod
    def _calculate_similarity(text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts.
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score (0.0-1.0)
        """
        return multi_method_score(text1, text2)
    
    async def analyze_bookshelf_image(
        self,
        image_bytes: bytes,
        db: Session
    ) -> Dict[str, Any]:
        """
        Complete pipeline: OCR + Matching.
        
        Args:
            image_bytes: Image file bytes
            db: Database session
            
        Returns:
            Dict with detected_texts and matched_books
        """
        # Step 1: OCR
        detected_texts = await self.detect_text_from_image(image_bytes)
        
        # Step 2: Match with database
        matched_books = await self.match_book_names(detected_texts, db)
        
        return {
            "detected_texts": detected_texts,
            "matched_books": matched_books,
            "total_detected": len(detected_texts),
            "total_matched": len(matched_books)
        }
