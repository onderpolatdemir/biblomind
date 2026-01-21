"""Recommendation service for personalized book suggestions."""

import logging
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.book import Book
from app.models.user_interaction import UserInteraction
from app.services.openai_service import OpenAIService

logger = logging.getLogger(__name__)

# Interaction type weights for preference calculation
INTERACTION_WEIGHTS = {
    'purchase': 1.0,  # Highest weight
    'like': 0.8,
    'cart': 0.5,
    'view': 0.2
}

# Hybrid scoring weights
HYBRID_WEIGHTS = {
    'content': 0.70,    # Content similarity (main factor)
    'popularity': 0.20,  # Book popularity
    'recency': 0.10     # Recently published books
}


class RecommendationService:
    """Service for generating personalized book recommendations."""
    
    def __init__(self, db: Session):
        """
        Initialize recommendation service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.openai_service = OpenAIService()
    
    async def generate_recommendations(
        self,
        user_id: UUID,
        limit: int = 10,
        strategy: str = "hybrid",
        exclude_owned: bool = True
    ) -> Dict[str, Any]:
        """
        Generate personalized book recommendations for a user.
        
        Args:
            user_id: User UUID
            limit: Number of recommendations to return
            strategy: Recommendation strategy ("hybrid", "content", "popular")
            exclude_owned: Whether to exclude books user already interacted with
            
        Returns:
            Dict with recommendations list and metadata
        """
        try:
            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            logger.info(f"Generating {strategy} recommendations for user {user_id}")
            
            # Get user's interacted books (to exclude if needed)
            excluded_book_ids = []
            if exclude_owned:
                excluded_book_ids = [
                    interaction.book_id 
                    for interaction in self.db.query(UserInteraction.book_id)
                    .filter(UserInteraction.user_id == user_id)
                    .distinct()
                    .all()
                ]
            
            # Check if user has preference vector
            has_vector = user.preferences_vector is not None
            
            if not has_vector:
                logger.info(f"User {user_id} has no preference vector, using fallback")
                recommendations = await self._get_popular_books(limit, excluded_book_ids)
                return {
                    "recommendations": recommendations,
                    "total": len(recommendations),
                    "strategy": "popular_fallback",
                    "user_has_history": False,
                    "message": "Henüz yeterli veriye sahip değiliz, size popüler kitapları öneriyoruz!"
                }
            
            # Generate recommendations based on strategy
            if strategy == "popular":
                recommendations = await self._get_popular_books(limit, excluded_book_ids)
            elif strategy == "content":
                recommendations = await self._get_content_based_recommendations(
                    user, limit, excluded_book_ids
                )
            else:  # hybrid (default)
                recommendations = await self._get_hybrid_recommendations(
                    user, limit, excluded_book_ids
                )
            
            # Generate explanations for top recommendations (optional, can be slow)
            # Only generate if explicitly needed to avoid performance issues
            # for rec in recommendations[:3]:  # Only for top 3 to save API calls
            #     rec["explanation"] = await self._generate_explanation(user, rec["book"])
            
            return {
                "recommendations": recommendations,
                "total": len(recommendations),
                "strategy": strategy,
                "user_has_history": True
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            raise
    
    async def get_similar_books(
        self,
        book_id: UUID,
        limit: int = 5
    ) -> Dict[str, Any]:
        """
        Get books similar to a given book using embedding similarity.
        
        Args:
            book_id: Book UUID
            limit: Number of similar books to return
            
        Returns:
            Dict with source book and similar books list
        """
        try:
            # Get source book
            book = self.db.query(Book).filter(Book.id == book_id).first()
            if not book:
                raise ValueError(f"Book {book_id} not found")
            
            if book.embedding is None:
                raise ValueError(f"Book {book_id} has no embedding")
            
            logger.info(f"Finding similar books for: {book.title}")
            
            # Query similar books using pgvector cosine distance
            similar_books = self.db.query(
                Book,
                Book.embedding.cosine_distance(book.embedding).label('distance')
            ).filter(
                and_(
                    Book.id != book_id,
                    Book.embedding.isnot(None),
                    Book.stock > 0  # Only in-stock books
                )
            ).order_by(
                'distance'
            ).limit(limit).all()
            
            # Format results
            results = []
            for similar_book, distance in similar_books:
                similarity_score = 1 - distance  # Convert distance to similarity
                results.append({
                    "id": str(similar_book.id),
                    "title": similar_book.title,
                    "author": similar_book.author,
                    "cover_url": similar_book.cover_url,
                    "price": float(similar_book.price) if similar_book.price else None,
                    "genres": similar_book.genres or [],
                    "similarity_score": round(float(similarity_score), 3)
                })
            
            logger.info(f"Found {len(results)} similar books")
            
            return {
                "book": {
                    "id": str(book.id),
                    "title": book.title,
                    "author": book.author
                },
                "similar_books": results,
                "total": len(results)
            }
            
        except Exception as e:
            logger.error(f"Error finding similar books: {e}")
            raise
    
    async def update_user_preference_vector(
        self,
        user_id: UUID
    ) -> Dict[str, Any]:
        """
        Update user's preference vector based on their interactions.
        This should be called as a background task.
        
        Args:
            user_id: User UUID
            
        Returns:
            Dict with update status and metadata
        """
        try:
            logger.info(f"Updating preference vector for user {user_id}")
            
            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Get user's interactions with books that have embeddings
            interactions = self.db.query(
                UserInteraction, Book
            ).join(
                Book, UserInteraction.book_id == Book.id
            ).filter(
                and_(
                    UserInteraction.user_id == user_id,
                    Book.embedding.isnot(None)
                )
            ).all()
            
            if not interactions:
                logger.warning(f"No interactions with embeddings for user {user_id}")
                return {
                    "vector_updated": False,
                    "interactions_processed": 0,
                    "message": "No interactions found"
                }
            
            # Calculate weighted average of book embeddings
            weighted_vectors = []
            weights = []
            
            for interaction, book in interactions:
                weight = INTERACTION_WEIGHTS.get(interaction.interaction_type, 0.1)
                weighted_vectors.append([val * weight for val in book.embedding])
                weights.append(weight)
            
            # Calculate weighted average
            total_weight = sum(weights)
            num_dims = len(weighted_vectors[0])
            
            preference_vector = [
                sum(vec[i] for vec in weighted_vectors) / total_weight
                for i in range(num_dims)
            ]
            
            # Update user's preference vector
            user.preferences_vector = preference_vector
            self.db.commit()
            
            logger.info(
                f"Successfully updated preference vector for user {user_id} "
                f"({len(interactions)} interactions processed)"
            )
            
            return {
                "vector_updated": True,
                "interactions_processed": len(interactions),
                "message": "Preference vector updated successfully"
            }
            
        except Exception as e:
            logger.error(f"Error updating user preference vector: {e}")
            self.db.rollback()
            raise
    
    async def _get_content_based_recommendations(
        self,
        user: User,
        limit: int,
        excluded_book_ids: List[UUID]
    ) -> List[Dict[str, Any]]:
        """
        Get content-based recommendations using user preference vector.
        
        Args:
            user: User object
            limit: Number of recommendations
            excluded_book_ids: Books to exclude
            
        Returns:
            List of recommendation dicts
        """
        # Query books similar to user's preference vector
        query = self.db.query(
            Book,
            Book.embedding.cosine_distance(user.preferences_vector).label('distance')
        ).filter(
            and_(
                Book.embedding.isnot(None),
                Book.stock > 0
            )
        )
        
        # Exclude owned books
        if excluded_book_ids:
            query = query.filter(Book.id.notin_(excluded_book_ids))
        
        results = query.order_by('distance').limit(limit * 2).all()  # Get more for filtering
        
        # Format results
        recommendations = []
        for book, distance in results:
            content_score = 1 - distance  # Convert distance to similarity
            
            # Only include if score is reasonable
            if content_score > 0.5:
                recommendations.append({
                    "book": self._format_book(book),
                    "score": round(float(content_score), 3),
                    "match_reasons": ["content_similarity"],
                    "explanation": ""  # Will be filled later
                })
                
                if len(recommendations) >= limit:
                    break
        
        return recommendations
    
    async def _get_hybrid_recommendations(
        self,
        user: User,
        limit: int,
        excluded_book_ids: List[UUID]
    ) -> List[Dict[str, Any]]:
        """
        Get hybrid recommendations (content + popularity + recency).
        
        Args:
            user: User object
            limit: Number of recommendations
            excluded_book_ids: Books to exclude
            
        Returns:
            List of recommendation dicts
        """
        # Get candidate books with content similarity
        candidates_query = self.db.query(
            Book,
            Book.embedding.cosine_distance(user.preferences_vector).label('distance')
        ).filter(
            and_(
                Book.embedding.isnot(None),
                Book.stock > 0
            )
        )
        
        if excluded_book_ids:
            candidates_query = candidates_query.filter(Book.id.notin_(excluded_book_ids))
        
        candidates = candidates_query.limit(limit * 3).all()  # Get more candidates
        
        # Calculate hybrid scores
        recommendations = []
        for book, distance in candidates:
            content_score = 1 - distance
            
            # Skip low content similarity
            if content_score < 0.4:
                continue
            
            # Calculate popularity score (based on interactions)
            interaction_count = self.db.query(func.count(UserInteraction.id)).filter(
                UserInteraction.book_id == book.id
            ).scalar() or 0
            
            # Normalize popularity (log scale)
            popularity_score = min(1.0, (interaction_count / 10) ** 0.5)
            
            # Calculate recency score (newer books get bonus)
            if book.created_at:
                days_old = (datetime.now(timezone.utc) - book.created_at).days
                recency_score = max(0, 1 - (days_old / 365))  # Decay over 1 year
            else:
                recency_score = 0.5
            
            # Calculate final hybrid score
            final_score = self._calculate_hybrid_score(
                content_score,
                popularity_score,
                recency_score
            )
            
            # Determine match reasons
            match_reasons = []
            if content_score > 0.7:
                match_reasons.append("high_similarity")
            if popularity_score > 0.5:
                match_reasons.append("popular")
            if recency_score > 0.7:
                match_reasons.append("new_release")
            
            recommendations.append({
                "book": self._format_book(book),
                "score": round(float(final_score), 3),
                "match_reasons": match_reasons,
                "explanation": "",
                "_debug": {
                    "content_score": round(float(content_score), 3),
                    "popularity_score": round(float(popularity_score), 3),
                    "recency_score": round(float(recency_score), 3)
                }
            })
        
        # Sort by final score and return top N
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]
    
    async def _get_popular_books(
        self,
        limit: int,
        excluded_book_ids: List[UUID]
    ) -> List[Dict[str, Any]]:
        """
        Get popular books as fallback for new users.
        
        Args:
            limit: Number of books to return
            excluded_book_ids: Books to exclude
            
        Returns:
            List of recommendation dicts
        """
        # Query most popular books (by interaction count)
        query = self.db.query(
            Book,
            func.count(UserInteraction.id).label('interaction_count')
        ).outerjoin(
            UserInteraction, Book.id == UserInteraction.book_id
        ).filter(
            Book.stock > 0
        ).group_by(Book.id)
        
        if excluded_book_ids:
            query = query.filter(Book.id.notin_(excluded_book_ids))
        
        popular_books = query.order_by(
            func.count(UserInteraction.id).desc()
        ).limit(limit).all()
        
        # Format results
        recommendations = []
        for book, interaction_count in popular_books:
            recommendations.append({
                "book": self._format_book(book),
                "score": 0.8,  # Default score for popular books
                "match_reasons": ["popular"],
                "explanation": f"Bu kitap platformumuzda çok beğeniliyor! {interaction_count} etkileşim."
            })
        
        return recommendations
    
    def _calculate_hybrid_score(
        self,
        content_score: float,
        popularity_score: float,
        recency_score: float
    ) -> float:
        """
        Calculate hybrid recommendation score.
        
        Args:
            content_score: Content similarity score (0-1)
            popularity_score: Popularity score (0-1)
            recency_score: Recency score (0-1)
            
        Returns:
            Final hybrid score (0-1)
        """
        return (
            HYBRID_WEIGHTS['content'] * content_score +
            HYBRID_WEIGHTS['popularity'] * popularity_score +
            HYBRID_WEIGHTS['recency'] * recency_score
        )
    
    def _format_book(self, book: Book) -> Dict[str, Any]:
        """
        Format book object for API response.
        
        Args:
            book: Book model instance
            
        Returns:
            Formatted book dict
        """
        return {
            "id": str(book.id),
            "title": book.title,
            "author": book.author,
            "cover_url": book.cover_url,
            "price": float(book.price) if book.price else None,
            "stock": book.stock,
            "genres": book.genres or [],
            "description": book.description[:200] if book.description else None
        }
    
    async def _generate_explanation(
        self,
        user: User,
        book: Dict[str, Any]
    ) -> str:
        """
        Generate personalized explanation for a recommendation.
        
        Args:
            user: User object
            book: Book dict
            
        Returns:
            Explanation text
        """
        try:
            # Get user's interaction history for context
            recent_interactions = self.db.query(
                Book
            ).join(
                UserInteraction, Book.id == UserInteraction.book_id
            ).filter(
                and_(
                    UserInteraction.user_id == user.id,
                    UserInteraction.interaction_type.in_(['like', 'purchase'])
                )
            ).limit(5).all()
            
            # Build user profile context
            favorite_genres = set()
            favorite_authors = set()
            for interaction_book in recent_interactions:
                if interaction_book.genres:
                    favorite_genres.update(interaction_book.genres)
                if interaction_book.author:
                    favorite_authors.add(interaction_book.author)
            
            user_profile = {
                "favorite_genres": list(favorite_genres)[:3],
                "favorite_authors": list(favorite_authors)[:3],
                "reading_level": "intermediate"  # Could be inferred from data
            }
            
            # Use OpenAI to generate explanation
            explanation = await self.openai_service.generate_explanation(
                user_profile=user_profile,
                book={
                    "title": book["title"],
                    "author": book["author"],
                    "genre": book["genres"][0] if book["genres"] else "Genel"
                },
                context={
                    "match_score": 0.9,  # Placeholder
                    "reason": "content_based"
                }
            )
            
            return explanation
            
        except Exception as e:
            logger.error(f"Error generating explanation: {e}")
            return "Bu kitap ilgi alanlarınıza uygun!"
    
    async def close(self):
        """Close service connections."""
        await self.openai_service.close()
