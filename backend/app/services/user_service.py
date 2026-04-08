"""User service for profile and preferences management."""

import json
import logging
from typing import Optional, List, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.user import User
from app.models.user_interaction import UserInteraction
from app.models.book import Book
from app.schemas.user import UserPreferencesUpdate, UserProfileUpdate

logger = logging.getLogger(__name__)


class UserService:
    """Service class for user operations."""
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: UUID) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            User object or None
        """
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def update_user_profile(
        db: Session,
        user_id: UUID,
        profile_data: UserProfileUpdate
    ) -> User:
        """
        Update user profile information.
        
        Args:
            db: Database session
            user_id: User ID
            profile_data: Profile update data
            
        Returns:
            Updated user object
            
        Raises:
            HTTPException: If user not found
        """
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update only provided fields
        if profile_data.full_name is not None:
            user.full_name = profile_data.full_name
        
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_user_preferences(db: Session, user_id: UUID) -> dict:
        """
        Get user preferences (favorite genres and authors).
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            Dictionary with favorite_genres and favorite_authors
        """
        # Get favorite books (liked books)
        favorite_books = UserService.get_user_favorites(db, user_id)
        
        # Extract genres and authors from favorite books
        genres = set()
        authors = set()
        
        for book in favorite_books:
            if book.genres:
                genres.update(book.genres)
            if book.author:
                authors.add(book.author)
        
        return {
            "favorite_genres": sorted(list(genres)),
            "favorite_authors": sorted(list(authors))
        }
    
    @staticmethod
    def update_user_preferences(
        db: Session,
        user_id: UUID,
        preferences: UserPreferencesUpdate
    ) -> dict:
        """
        Update user preferences.
        
        Note: This is a placeholder for Phase 2 AI integration.
        Currently, preferences are derived from user interactions (favorites).
        
        Args:
            db: Database session
            user_id: User ID
            preferences: Preference update data
            
        Returns:
            Updated preferences
        """
        # For now, this is a no-op since preferences are derived from interactions
        # In Phase 2, this will update the preferences_vector using AI
        
        user = UserService.get_user_by_id(db, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # TODO: Phase 2 - Update preferences_vector using OpenAI embeddings
        # For now, return current preferences
        return UserService.get_user_preferences(db, user_id)
    
    @staticmethod
    def get_user_interactions(
        db: Session,
        user_id: UUID,
        interaction_type: Optional[str] = None,
        limit: int = 50
    ) -> List[UserInteraction]:
        """
        Get user interactions (history).
        
        Args:
            db: Database session
            user_id: User ID
            interaction_type: Filter by interaction type (view, like, cart, purchase)
            limit: Maximum number of results
            
        Returns:
            List of user interactions
        """
        query = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id
        )
        
        if interaction_type:
            query = query.filter(UserInteraction.interaction_type == interaction_type)
        
        return query.order_by(UserInteraction.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def add_user_interaction(
        db: Session,
        user_id: UUID,
        book_id: UUID,
        interaction_type: str
    ) -> UserInteraction:
        """
        Add a user interaction.
        
        Args:
            db: Database session
            user_id: User ID
            book_id: Book ID
            interaction_type: Type (view, like, cart, purchase)
            
        Returns:
            Created interaction
            
        Raises:
            HTTPException: If book not found or invalid interaction type
        """
        # Validate interaction type
        valid_types = ["view", "like", "cart", "purchase"]
        if interaction_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid interaction type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Check if book exists
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
        
        # Check if interaction already exists (for like type, prevent duplicates)
        if interaction_type == "like":
            existing = db.query(UserInteraction).filter(
                UserInteraction.user_id == user_id,
                UserInteraction.book_id == book_id,
                UserInteraction.interaction_type == "like"
            ).first()
            
            if existing:
                # Already liked, return existing
                return existing
        
        # Create interaction
        interaction = UserInteraction(
            user_id=user_id,
            book_id=book_id,
            interaction_type=interaction_type
        )
        
        db.add(interaction)
        
        # Reset preference vector to force dynamic regeneration
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.preferences_vector = None
            
        db.commit()
        db.refresh(interaction)
        
        return interaction
    
    @staticmethod
    def get_user_favorites(db: Session, user_id: UUID) -> List[Book]:
        """
        Get user's favorite books (books they liked).
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of favorite books
        """
        # Get books that user has liked
        favorites = db.query(Book).join(
            UserInteraction,
            Book.id == UserInteraction.book_id
        ).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.interaction_type == "like"
        ).all()
        
        return favorites
    
    @staticmethod
    def add_to_favorites(db: Session, user_id: UUID, book_id: UUID) -> Book:
        """
        Add a book to user's favorites.
        
        Args:
            db: Database session
            user_id: User ID
            book_id: Book ID
            
        Returns:
            The favorited book
            
        Raises:
            HTTPException: If book not found
        """
        # This creates a 'like' interaction
        UserService.add_user_interaction(db, user_id, book_id, "like")
        
        # Return the book
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )
        
        return book
    
    @staticmethod
    def remove_from_favorites(db: Session, user_id: UUID, book_id: UUID) -> bool:
        """
        Remove a book from user's favorites.
        
        Args:
            db: Database session
            user_id: User ID
            book_id: Book ID
            
        Returns:
            True if removed, False if not found
        """
        # Find and delete the 'like' interaction
        interaction = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.book_id == book_id,
            UserInteraction.interaction_type == "like"
        ).first()
        
        if interaction:
            db.delete(interaction)
            
            # Reset preference vector to force dynamic regeneration
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.preferences_vector = None
                
            db.commit()
            return True
        
        return False
    
    @staticmethod
    async def get_user_reading_profile(
        db: Session,
        user_id: UUID,
        openai_service
    ) -> Dict[str, Any]:
        """
        Kullanıcının okuma geçmişinden AI ile profil oluştur.
        
        Args:
            db: Database session
            user_id: User ID
            openai_service: OpenAI service instance
            
        Returns:
            Dict with user reading profile (favorite genres, authors, themes, style)
        """
        logger.info(f"Creating reading profile for user {user_id}")
        
        # Kullanıcının beğendiği/okuduğu kitapları al
        liked_interactions = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id,
            UserInteraction.interaction_type.in_(['like', 'purchase'])
        ).limit(50).all()
        
        if not liked_interactions:
            # Eğer hiç interaction yoksa, default profil döndür
            logger.warning(f"No interactions found for user {user_id}, returning default profile")
            return {
                "favorite_genres": [],
                "favorite_authors": [],
                "themes": [],
                "style_preferences": [],
                "reading_level": "intermediate",
                "has_history": False
            }
        
        # Kitap bilgilerini topla
        books = []
        for interaction in liked_interactions:
            if interaction.book:
                books.append({
                    "title": interaction.book.title,
                    "author": interaction.book.author,
                    "genres": interaction.book.genres or [],
                    "description": interaction.book.description[:200] if interaction.book.description else ""
                })
        
        if not books:
            logger.warning(f"No books found for user {user_id}, returning default profile")
            return {
                "favorite_genres": [],
                "favorite_authors": [],
                "themes": [],
                "style_preferences": [],
                "reading_level": "intermediate",
                "has_history": False
            }
        
        logger.info(f"Found {len(books)} books for user profile analysis")
        
        # Build user profile with OpenAI
        prompt = f"""Books the user liked / purchased:
{json.dumps(books[:20], ensure_ascii=False, indent=2)}

Extract this user's reading profile and return it as JSON:
{{
  "favorite_genres": ["Genre1", "Genre2", "Genre3"],
  "favorite_authors": ["Author1", "Author2"],
  "themes": ["theme1", "theme2", "theme3"],
  "style_preferences": ["dark", "thought-provoking", "action-packed"],
  "reading_level": "beginner|intermediate|advanced"
}}

All textual values must be in English.
Return only the JSON — no other explanation:"""
        
        try:
            response = await openai_service.generate_completion(
                prompt=prompt,
                max_tokens=800,
                temperature=0.4
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
            
            profile = json.loads(cleaned_response)
            profile['has_history'] = True
            
            logger.info(f"Successfully created reading profile for user {user_id}")
            return profile
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI profile response: {e}")
            logger.error(f"Response was: {response[:500]}")
            # Fallback: basit profil oluştur
            genres = set()
            authors = set()
            for book in books:
                if book.get('genres'):
                    genres.update(book['genres'])
                if book.get('author'):
                    authors.add(book['author'])
            
            return {
                "favorite_genres": list(genres)[:5],
                "favorite_authors": list(authors)[:5],
                "themes": [],
                "style_preferences": [],
                "reading_level": "intermediate",
                "has_history": True
            }
        except Exception as e:
            logger.error(f"Error creating reading profile: {e}")
            return {
                "favorite_genres": [],
                "favorite_authors": [],
                "themes": [],
                "style_preferences": [],
                "reading_level": "intermediate",
                "has_history": False
            }