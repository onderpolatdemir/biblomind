"""
Social service for Book Buddy matching and recommendations.

Matches users based on reading preferences using pgvector similarity.
"""

from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, or_

from app.models.user import User
from app.models.user_connection import UserConnection
from app.models.user_interaction import UserInteraction
from app.models.book import Book
from app.core.logging import logger


class SocialService:
    """Service for social features and user matching."""
    
    def __init__(self, db: Session):
        """Initialize social service."""
        self.db = db
    
    def calculate_user_similarity(
        self,
        user_a: User,
        user_b: User
    ) -> float:
        """
        Calculate similarity between two users using preference vectors.
        
        Uses pgvector cosine similarity on preferences_vector.
        Returns 0.0 if either user doesn't have a preference vector.
        
        Args:
            user_a: First user
            user_b: Second user
        
        Returns:
            Similarity score (0.0-1.0)
        """
        # Both users must have preference vectors
        if not (user_a.preferences_vector and user_b.preferences_vector):
            return 0.0
        
        try:
            # Calculate cosine distance using pgvector
            # Similarity = 1 - cosine_distance (lower distance = more similar)
            distance = user_a.preferences_vector.cosine_distance(user_b.preferences_vector)
            similarity = 1.0 - float(distance)
            
            # Ensure similarity is in [0, 1] range
            similarity = max(0.0, min(1.0, similarity))
            
            logger.debug(
                f"User similarity calculated: {user_a.id} <-> {user_b.id} = {similarity:.3f}"
            )
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error calculating user similarity: {e}")
            return 0.0
    
    def find_book_buddies(
        self,
        user_id: UUID,
        limit: int = 10,
        min_interactions: int = 5,
        min_similarity: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Find users with similar reading preferences (Book Buddies).
        
        Args:
            user_id: Target user ID
            limit: Maximum number of buddies to return
            min_interactions: Minimum interactions required for matching
            min_similarity: Minimum similarity threshold (0.0-1.0)
        
        Returns:
            List of buddy matches with metadata
        """
        try:
            # Get target user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or not user.preferences_vector:
                logger.warning(f"User {user_id} has no preference vector")
                return []
            
            # Get users with preference vectors and sufficient interactions
            # Exclude self
            candidate_users = (
                self.db.query(User)
                .filter(
                    User.id != user_id,
                    User.preferences_vector.isnot(None)
                )
                .all()
            )
            
            # Calculate similarity for each candidate
            buddies = []
            for candidate in candidate_users:
                # Check interaction count
                interaction_count = (
                    self.db.query(UserInteraction)
                    .filter(UserInteraction.user_id == candidate.id)
                    .count()
                )
                
                if interaction_count < min_interactions:
                    continue
                
                # Calculate similarity using pgvector
                similarity = self.calculate_user_similarity(user, candidate)
                
                if similarity >= min_similarity:
                    # Count shared books (both users interacted with same book)
                    shared_books_count = (
                        self.db.query(func.count(UserInteraction.book_id.distinct()))
                        .filter(
                            or_(
                                and_(
                                    UserInteraction.user_id == user_id,
                                    UserInteraction.book_id.in_(
                                        self.db.query(UserInteraction.book_id)
                                        .filter(UserInteraction.user_id == candidate.id)
                                    )
                                )
                            )
                        )
                        .scalar() or 0
                    )
                    
                    buddies.append({
                        "user_id": candidate.id,
                        "email": candidate.email,
                        "full_name": candidate.full_name,
                        "compatibility_score": round(similarity, 3),
                        "shared_books": shared_books_count,
                        "total_interactions": interaction_count
                    })
            
            # Sort by compatibility score (descending)
            buddies.sort(key=lambda x: x["compatibility_score"], reverse=True)
            
            # Limit results
            buddies = buddies[:limit]
            
            logger.info(
                f"Found {len(buddies)} book buddies for user {user_id} "
                f"(min_similarity={min_similarity})"
            )
            
            return buddies
            
        except Exception as e:
            logger.error(f"Error finding book buddies for user {user_id}: {e}")
            return []
    
    def get_shared_interests(
        self,
        user_id: UUID,
        buddy_id: UUID
    ) -> Dict[str, Any]:
        """
        Get shared books and genres between two users.
        
        Args:
            user_id: First user ID
            buddy_id: Second user ID
        
        Returns:
            Dictionary with shared books and genres
        """
        try:
            # Get user interactions
            user_interactions = (
                self.db.query(UserInteraction)
                .filter(UserInteraction.user_id == user_id)
                .all()
            )
            
            buddy_interactions = (
                self.db.query(UserInteraction)
                .filter(UserInteraction.user_id == buddy_id)
                .all()
            )
            
            # Extract book IDs
            user_book_ids = {interaction.book_id for interaction in user_interactions}
            buddy_book_ids = {interaction.book_id for interaction in buddy_interactions}
            
            # Find shared book IDs
            shared_book_ids = user_book_ids & buddy_book_ids
            
            # Get shared books
            shared_books = []
            if shared_book_ids:
                books = (
                    self.db.query(Book)
                    .filter(Book.id.in_(shared_book_ids))
                    .all()
                )
                
                for book in books:
                    shared_books.append({
                        "id": book.id,
                        "title": book.title,
                        "author": book.author,
                        "genres": book.genres
                    })
            
            # Find shared genres
            user_genres = set()
            buddy_genres = set()
            
            for interaction in user_interactions:
                book = self.db.query(Book).filter(Book.id == interaction.book_id).first()
                if book and book.genres:
                    user_genres.update(book.genres)
            
            for interaction in buddy_interactions:
                book = self.db.query(Book).filter(Book.id == interaction.book_id).first()
                if book and book.genres:
                    buddy_genres.update(book.genres)
            
            shared_genres = list(user_genres & buddy_genres)
            
            return {
                "shared_books": shared_books,
                "shared_books_count": len(shared_books),
                "shared_genres": shared_genres,
                "shared_genres_count": len(shared_genres),
                "user_total_books": len(user_book_ids),
                "buddy_total_books": len(buddy_book_ids)
            }
            
        except Exception as e:
            logger.error(f"Error getting shared interests: {e}")
            return {
                "shared_books": [],
                "shared_books_count": 0,
                "shared_genres": [],
                "shared_genres_count": 0,
                "user_total_books": 0,
                "buddy_total_books": 0
            }
    
    def get_buddy_recommendations(
        self,
        user_id: UUID,
        buddy_id: UUID,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get book recommendations based on buddy's interactions.
        
        Returns books that buddy liked but user hasn't interacted with yet.
        
        Args:
            user_id: Target user ID
            buddy_id: Buddy user ID
            limit: Maximum recommendations
        
        Returns:
            List of book recommendations from buddy
        """
        try:
            # Get user's interacted books
            user_book_ids = {
                interaction.book_id 
                for interaction in self.db.query(UserInteraction)
                .filter(UserInteraction.user_id == user_id)
                .all()
            }
            
            # Get buddy's liked books (excluding user's books)
            buddy_interactions = (
                self.db.query(UserInteraction, Book)
                .join(Book, UserInteraction.book_id == Book.id)
                .filter(
                    UserInteraction.user_id == buddy_id,
                    UserInteraction.interaction_type.in_(['like', 'purchase']),
                    ~UserInteraction.book_id.in_(user_book_ids) if user_book_ids else True,
                    Book.stock > 0
                )
                .order_by(UserInteraction.created_at.desc())
                .limit(limit)
                .all()
            )
            
            recommendations = []
            for interaction, book in buddy_interactions:
                recommendations.append({
                    "id": book.id,
                    "title": book.title,
                    "author": book.author,
                    "genres": book.genres,
                    "description": book.description,
                    "price": float(book.price) if book.price else None,
                    "interaction_type": interaction.interaction_type,
                    "buddy_interaction_date": interaction.created_at
                })
            
            logger.info(
                f"Found {len(recommendations)} buddy recommendations "
                f"from {buddy_id} for {user_id}"
            )
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting buddy recommendations: {e}")
            return []
    
    def create_connection(
        self,
        user_id: UUID,
        buddy_id: UUID
    ) -> Optional[UserConnection]:
        """
        Create or update user connection.
        
        Args:
            user_id: User ID
            buddy_id: Buddy ID
        
        Returns:
            UserConnection object or None if failed
        """
        try:
            # Check if connection already exists
            existing = (
                self.db.query(UserConnection)
                .filter(
                    or_(
                        and_(
                            UserConnection.user_id == user_id,
                            UserConnection.buddy_id == buddy_id
                        ),
                        and_(
                            UserConnection.user_id == buddy_id,
                            UserConnection.buddy_id == user_id
                        )
                    )
                )
                .first()
            )
            
            if existing:
                # Update status to connected
                existing.status = "connected"
                self.db.commit()
                self.db.refresh(existing)
                logger.info(f"Updated connection: {user_id} <-> {buddy_id}")
                return existing
            
            # Get users
            user = self.db.query(User).filter(User.id == user_id).first()
            buddy = self.db.query(User).filter(User.id == buddy_id).first()
            
            if not user or not buddy:
                logger.warning(f"User or buddy not found: {user_id}, {buddy_id}")
                return None
            
            # Calculate compatibility
            similarity = self.calculate_user_similarity(user, buddy)
            
            # Count shared books
            shared_interests = self.get_shared_interests(user_id, buddy_id)
            
            # Create connection
            connection = UserConnection(
                user_id=user_id,
                buddy_id=buddy_id,
                compatibility_score=similarity,
                shared_books=shared_interests["shared_books_count"],
                shared_genres=shared_interests["shared_genres_count"],
                status="connected"
            )
            
            self.db.add(connection)
            self.db.commit()
            self.db.refresh(connection)
            
            logger.info(
                f"Created connection: {user_id} <-> {buddy_id} "
                f"(score: {similarity:.3f})"
            )
            
            return connection
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating connection: {e}")
            return None
