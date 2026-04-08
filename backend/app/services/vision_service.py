"""Google Cloud Vision API service for OCR and text detection."""

import os
import logging
import asyncio
import json
from typing import List, Dict, Any, Tuple, Optional
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
        min_confidence: float = None,
        as_blocks: bool = False
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
            self._rotate_and_detect(image_bytes, rotation, min_confidence, as_blocks)
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
        if as_blocks:
            cleaned_texts = [text for text in unique_texts if text.strip()]
        else:
            cleaned_texts = [clean_detected_text(text) for text in unique_texts]
            cleaned_texts = [text for text in cleaned_texts if text]  # Remove empty
        
        logger.info(f"OCR complete: {len(cleaned_texts)} unique texts detected")
        return cleaned_texts
    
    async def _rotate_and_detect(
        self,
        image_bytes: bytes,
        rotation: int,
        min_confidence: float,
        as_blocks: bool = False
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
                
                if as_blocks:
                    # Keep the text block intact to preserve multi-line book structures
                    detected_texts = [full_text.strip()]
                else:
                    # Split by newlines to get individual text segments
                    # This captures book titles that span multiple lines
                    text_lines = [line.strip() for line in full_text.strip().split('\n')]
                    detected_texts = [line for line in text_lines if line]
                
                logger.debug(
                    f"Rotation {rotation}°: {len(detected_texts)} text units detected"
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
    
    async def detect_and_clean_books(
        self,
        image_bytes: bytes,
        openai_service
    ) -> List[Dict[str, Any]]:
        """
        Tespit edilen kitapları OCR + AI ile temizle ve normalize et.
        
        Args:
            image_bytes: Image file bytes
            openai_service: OpenAI service instance
            
        Returns:
            List of cleaned book information with confidence scores
        """
        # Step 1: OCR ile text tespit et (bloklar halinde)
        raw_texts = await self.detect_text_from_image(image_bytes, as_blocks=True)
        
        if not raw_texts:
            logger.warning("No text detected from image")
            return []
        
        logger.info(f"Detected {len(raw_texts)} raw texts from OCR")
        
        # Step 2: OpenAI ile kitap isimlerini düzelt ve normalize et
        prompt = f"""Aşağıdaki OCR sonuçları bir kitap rafından 4 farklı açıdan (0, 90, 180, 270 derece) alınmıştır.
Aynı kitaplar farklı yönlerde tekrar edebilir veya tek bir kitap ismi birden fazla satıra bölünmüş olabilir (örn: 'The Modern\\nFundamentals of Golf').
Tüm metni bütüncül olarak analiz et ve GERÇEKTEN BİR KİTAP ADI veya YAZAR İSMİ olanları benzersiz (tekrarsız) bir liste olarak çıkar.

LÜTFEN 'genres' ALANINI AŞAĞIDAKİ GEÇERLİ İNGİLİZCE KATEGORİLERDEN BİR VEYA BİRKAÇI İLE DOLDUR (Türkçe KULLANMA):
[Action, Adventure, Fiction, Non Fiction, Science Fiction, Fantasy, Crime, Mythology, Dystopia, Mystery, Thriller, Romance, Biography, History, Science, Self Help, Poetry, Children, Young Adult, Classics, Suspense]

OCR Sonuçları:
{chr(10).join(raw_texts)}

Her tespit edilen benzersiz kitap için şu formatta JSON döndür:
{{
  "title": "Kitap Adı",
  "author": "Yazar Adı (eğer tespit edildiyse)",
  "confidence": 0.9,
  "genres": ["Fantasy", "Classics"],
  "original_ocr": "orijinal OCR text"
}}

Önemli:
- Kitap adları iki satıra bölünmüşse onları akıllıca birleştir.
- Aynı kitap OCR dizilerinde birkaç kez geçse bile JSON'da sadece BİR KERE yer almalı (en doğru yazılışı seç).
- Kitap adı değilse (barkod, numara, yayınevi logosu vb.), dahil etme.
- Sadece JSON array döndür, başka açıklama yapma.

JSON array:"""
        
        try:
            response = await openai_service.generate_completion(
                prompt=prompt,
                max_tokens=4000,
                temperature=0.3
            )
            
            # Clean response (remove markdown code blocks if present)
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]  # Remove ```json
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]  # Remove ```
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]  # Remove trailing ```
            cleaned_response = cleaned_response.strip()
            
            # Parse JSON response
            detected_books = json.loads(cleaned_response)
            
            # Filter by confidence
            filtered_books = [
                book for book in detected_books 
                if isinstance(book, dict) and book.get('confidence', 0) > 0.6
            ]
            
            logger.info(f"AI cleaned books: {len(filtered_books)} valid books found")
            
            return filtered_books
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            logger.error(f"Response was: {response[:500]}")
            return []
        except Exception as e:
            logger.error(f"Error in detect_and_clean_books: {e}")
            return []
    
    async def match_books_to_user_profile(
        self,
        detected_books: List[Dict[str, Any]],
        user_profile: Dict[str, Any],
        db: Session,
        openai_service,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Tespit edilen kitapları kullanıcı profili ile eşleştir ve öner.
        
        Args:
            detected_books: Raftaki tespit edilen kitaplar
            user_profile: Kullanıcının okuma profili
            db: Database session
            openai_service: OpenAI service instance
            limit: Maksimum öneri sayısı
            
        Returns:
            Dict with recommendations and shelf analysis
        """
        if not detected_books:
            return {
                "recommendations": [],
                "shelf_analysis": {},
                "total_analyzed": 0
            }
        
        logger.info(f"Matching {len(detected_books)} books to user profile")
        
        # Step 1: OpenAI ile kitapları kullanıcı profiline göre skorla
        prompt = f"""Kullanıcı Okuma Profili: {json.dumps(user_profile, ensure_ascii=False, indent=2)}
Kitaplıktaki Kitaplar: {json.dumps(detected_books[:30], ensure_ascii=False, indent=2)}

Senden iki şey bekliyorum:
1) Rafa bakarak raf sahibinin okuma analizi
2) Eğer Kullanıcı Okuma Profilinde 'has_history': true ise, bu kitaplıktan kullanıcıya BAŞKA KİTAPLAR öner (match_score ve reason ile). Eğer 'has_history': false ise, YANİ kullanıcının profil geçmişi yoksa KESİNLİKLE hiçbir kitap önerme (recommendations listesi BOŞ OLSUN []). Geçmişi olmayan kullanıcıya kitaba göre öneri yapamayız.

Raf analizi için şunları dikkate al:
- Raftaki genel türler neler?
- Raf sahibinin okuma tarzı nasıl?
- Kullanıcı ile raf uyumluluğu ne kadar? (geçmiş yoksa 0.5 ver)
ÖNEMLİ: 'dominant_genres' listesi, SADECE AŞAĞIDAKİ İNGİLİZCE LİSTEDEN SEÇİLEN türleri içermelidir:
[Action, Adventure, Fiction, Non Fiction, Science Fiction, Fantasy, Crime, Mythology, Dystopia, Mystery, Thriller, Romance, Biography, History, Science, Self Help, Poetry, Children, Young Adult, Classics, Suspense]

JSON formatında döndür:
{{
  "recommendations": [
    {{
      "title": "Kitap Adı",
      "author": "Yazar",
      "match_score": 0.95,
      "reason": "Neden öneriliyor açıklama"
    }}
  ],
  "shelf_analysis": {{
    "dominant_genres": ["Fantasy", "Classics"],
    "reading_style": "Raf sahibinin okuma tarzı açıklaması",
    "user_compatibility": 0.5
  }}
}}

Tekrar Ediyorum: Profil 'has_history': false ise "recommendations": [] olmalı.
Sadece match_score > 0.6 olanları dahil et ve score'a göre sıralı döndür. Sadece JSON döndür:"""
        
        try:
            response = await openai_service.generate_completion(
                prompt=prompt,
                max_tokens=2000,
                temperature=0.5
            )
            
            # Clean response (remove markdown code blocks if present)
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            cleaned_response = cleaned_response.strip()
            
            result = json.loads(cleaned_response)
            recommendations = result.get('recommendations', [])[:limit]
            shelf_analysis = result.get('shelf_analysis', {})
            
            # Step 2: DB'de bu kitapları kontrol et (satın alma linki için)
            enriched_recommendations = []
            for rec in recommendations:
                title = rec.get('title', '')
                author = rec.get('author', '')
                
                # DB'de kitabı ara
                book_in_db = None
                if title:
                    book_in_db = db.query(Book).filter(
                        Book.title.ilike(f"%{title}%")
                    ).first()
                
                enriched_rec = {
                    **rec,
                    "in_our_store": book_in_db is not None,
                    "book_id": str(book_in_db.id) if book_in_db else None,
                    "price": float(book_in_db.price) if book_in_db and book_in_db.price else None,
                    "cover_url": book_in_db.cover_url if book_in_db else None
                }
                
                enriched_recommendations.append(enriched_rec)
            
            logger.info(f"Generated {len(enriched_recommendations)} recommendations")
            
            return {
                "recommendations": enriched_recommendations,
                "shelf_analysis": shelf_analysis,
                "total_analyzed": len(detected_books)
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI matching response: {e}")
            return {
                "recommendations": [],
                "shelf_analysis": {},
                "total_analyzed": len(detected_books)
            }
        except Exception as e:
            logger.error(f"Error in match_books_to_user_profile: {e}")
            return {
                "recommendations": [],
                "shelf_analysis": {},
                "total_analyzed": len(detected_books)
            }
