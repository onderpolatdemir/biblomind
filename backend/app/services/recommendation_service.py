"""Recommendation service for personalized book suggestions."""

import logging
import random
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.book import Book
from app.models.user_interaction import UserInteraction
from app.services.openai_service import OpenAIService
from app.services.user_service import UserService

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
                logger.info(f"User {user_id} has no preference vector, attempting to build one...")
                update_res = await self.update_user_preference_vector(user_id)
                
                if update_res.get("vector_updated"):
                    # Reload user to get the new vector
                    self.db.refresh(user)
                    has_vector = user.preferences_vector is not None
            
            # Get user preferences for explanations
            user_prefs = UserService.get_user_preferences(self.db, user_id)
            
            if not has_vector:
                logger.info(f"User {user_id} still has no preference vector, using fallback")
                
                # Check if they have ANY interactions even if they don't have embeddings
                interaction_count = self.db.query(func.count(UserInteraction.id)).filter(
                    UserInteraction.user_id == user_id
                ).scalar() or 0
                
                recommendations = await self._get_popular_books(limit, excluded_book_ids, user_prefs)
                return {
                    "recommendations": recommendations,
                    "total": len(recommendations),
                    "strategy": "popular_fallback",
                    "user_has_history": interaction_count > 0,
                    "message": "We don't have enough data yet, so we're recommending popular books!"
                }
            
            # Generate recommendations based on strategy
            if strategy == "popular":
                recommendations = await self._get_popular_books(limit, excluded_book_ids, user_prefs)
            elif strategy == "content":
                recommendations = await self._get_content_based_recommendations(
                    user, limit, excluded_book_ids, user_prefs
                )
            else:  # hybrid (default)
                recommendations = await self._get_hybrid_recommendations(
                    user, limit, excluded_book_ids, user_prefs
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
        
        # Increase candidate pool to find more diverse matches (author/genre)
        results = query.order_by('distance').limit(limit * 10).all()
        
        # Format results
        recommendations = []
        for book, distance in results:
            content_score = 1 - distance  # Convert distance to similarity
            
            # Boost score based on explicit user preferences
            is_fav_author = False
            if user_prefs:
                fav_authors = user_prefs.get('favorite_authors', [])
                fav_genres = user_prefs.get('favorite_genres', [])
                
                if book.author and book.author in fav_authors:
                    content_score += 0.4  # Massive boost for favorite author
                    is_fav_author = True
                    
                if book.genres:
                    matching_genres = [g for g in book.genres if g in fav_genres]
                    if matching_genres:
                        content_score += 0.15  # Moderate boost for favorite genre

            content_score = min(1.0, content_score)
            
            # Only include if score is reasonable (or it's a favorite author)
            if content_score > 0.5 or is_fav_author:
                explanation = self._generate_rule_based_explanation(book, user_prefs, content_score=float(content_score))
                jitter = random.uniform(-0.04, 0.04)
                final = round(max(0.0, min(1.0, float(content_score) + jitter)), 3)
                
                recommendations.append({
                    "book": self._format_book(book),
                    "score": final,
                    "match_reasons": ["content_similarity"],
                    "explanation": explanation
                })

                if len(recommendations) >= limit * 2:
                    break

        # Re-sort after jitter so overall quality ordering is preserved
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]
    
    async def _get_hybrid_recommendations(
        self,
        user: User,
        limit: int,
        excluded_book_ids: List[UUID],
        user_prefs: Dict[str, Any] = None
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
        
        # Pulling more candidates ensures we can find authors even if baseline similarity is lower
        candidates = candidates_query.limit(limit * 10).all()
        
        # Calculate hybrid scores
        recommendations = []
        for book, distance in candidates:
            content_score = 1 - distance
            
            # Boost score based on explicit user preferences
            is_fav_author = False
            if user_prefs:
                fav_authors = user_prefs.get('favorite_authors', [])
                fav_genres = user_prefs.get('favorite_genres', [])
                
                if book.author and book.author in fav_authors:
                    content_score += 0.4  # Huge boost
                    is_fav_author = True
                if book.genres:
                    matching_genres = [g for g in book.genres if g in fav_genres]
                    if matching_genres:
                        content_score += 0.15  # Moderate boost
            
            content_score = min(1.0, content_score)
            
            # Skip low content similarity unless it's a favorite author match
            if content_score < 0.4 and not is_fav_author:
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
            if is_fav_author:
                match_reasons.append("favorite_author")
            
            explanation = self._generate_rule_based_explanation(book, user_prefs, content_score=float(content_score))
                
            recommendations.append({
                "book": self._format_book(book),
                "score": round(float(final_score), 3),
                "match_reasons": match_reasons,
                "explanation": explanation,
                "_debug": {
                    "content_score": round(float(content_score), 3),
                    "popularity_score": round(float(popularity_score), 3),
                    "recency_score": round(float(recency_score), 3)
                }
            })
        
        # Add small random jitter so order varies between calls while
        # still favouring high-scoring books (jitter ±5% of score range)
        for rec in recommendations:
            rec["score"] += random.uniform(-0.05, 0.05)
            rec["score"] = round(max(0.0, min(1.0, rec["score"])), 3)

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:limit]
    
    async def _get_popular_books(
        self,
        limit: int,
        excluded_book_ids: List[UUID],
        user_prefs: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """
        Get popular books as fallback for new users.
        
        Args:
            limit: Number of books to return
            excluded_book_ids: Books to exclude
            
        Returns:
            List of recommendation dicts
        """
        try:
            # We will collect multiple query results to ensure we get user's favorites
            candidates_dict = {}  # book_id -> {book, interaction_count, score_boost}
            
            # Fetch a larger pool so we can randomly sample from it if needed
            pool_size = max(limit * 4, 40)
            
            # Helper to run a query and add results
            def _add_to_candidates(base_query, boost_score):
                if excluded_book_ids:
                    base_query = base_query.filter(Book.id.notin_(excluded_book_ids))
                    
                results = base_query.group_by(Book.id).order_by(
                    func.count(UserInteraction.id).desc()
                ).limit(pool_size).all()
                
                for book, count in results:
                    if book.id not in candidates_dict:
                        candidates_dict[book.id] = {"book": book, "count": count, "boost": boost_score}
                    else:
                        candidates_dict[book.id]["boost"] = max(candidates_dict[book.id]["boost"], boost_score)

            # 1. Fetch by favorite authors
            fav_authors = user_prefs.get('favorite_authors', []) if user_prefs else []
            if fav_authors:
                q_authors = self.db.query(Book, func.count(UserInteraction.id).label('ic')).outerjoin(
                    UserInteraction, Book.id == UserInteraction.book_id
                ).filter(Book.stock > 0, Book.author.in_(fav_authors))
                _add_to_candidates(q_authors, boost_score=100)
                
            # 2. Fetch by favorite genres
            fav_genres = user_prefs.get('favorite_genres', []) if user_prefs else []
            if fav_genres:
                for g in fav_genres[:2]:
                    from sqlalchemy import cast, String
                    q_genres = self.db.query(Book, func.count(UserInteraction.id).label('ic')).outerjoin(
                        UserInteraction, Book.id == UserInteraction.book_id
                    ).filter(Book.stock > 0, cast(Book.genres, String).ilike(f'%{g}%'))
                    _add_to_candidates(q_genres, boost_score=50)

            # 3. Fetch globally popular books
            q_popular = self.db.query(Book, func.count(UserInteraction.id).label('ic')).outerjoin(
                UserInteraction, Book.id == UserInteraction.book_id
            ).filter(Book.stock > 0)
            _add_to_candidates(q_popular, boost_score=0)

            pool = list(candidates_dict.values())
            
            # Weighted random sample: more-popular books are more likely to appear
            # but order is never deterministic
            if len(pool) <= limit:
                selected = pool
            else:
                weights = [max(1, item["count"] + item["boost"]) for item in pool]
                sampled = random.choices(pool, weights=weights, k=limit * 2)
                # Deduplicate while preserving weighted randomness
                seen_ids = set()
                unique_selected = []
                for item in sampled:
                    bid = item["book"].id
                    if bid not in seen_ids:
                        seen_ids.add(bid)
                        unique_selected.append(item)
                    if len(unique_selected) >= limit:
                        break
                # If we still need more, fill from remaining pool
                if len(unique_selected) < limit:
                    remaining = [p for p in pool if p["book"].id not in seen_ids]
                    remaining.sort(key=lambda x: x["boost"] + x["count"], reverse=True)
                    unique_selected.extend(remaining[:limit - len(unique_selected)])
                selected = unique_selected

            # Format results
            recommendations = []
            for item in selected:
                book = item["book"]
                interaction_count = item["count"]
                is_popular = item["boost"] == 0
                
                explanation = self._generate_rule_based_explanation(book, user_prefs, is_popular=is_popular, interaction_count=interaction_count)
                recommendations.append({
                    "book": self._format_book(book),
                    "score": 0.8 + (item["boost"] / 1000.0),
                    "match_reasons": ["favorite_author"] if item["boost"] == 100 else (["favorite_genre"] if item["boost"] == 50 else ["popular"]),
                    "explanation": explanation
                })
            
            return recommendations
        except Exception as e:
            return [{
                "book": {
                    "id": "00000000-0000-0000-0000-000000000000",
                    "title": "ERROR: " + str(e),
                    "author": "System",
                    "price": 0.0,
                    "stock": 0,
                    "cover_url": "",
                    "genres": [],
                    "description": ""
                },
                "score": 0.0,
                "match_reasons": ["error"],
                "explanation": "Debugging error detail"
            }]
    
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

    def _generate_rule_based_explanation(self, book: Book, user_prefs: Dict[str, Any] = None, content_score: float = 0.0, is_popular: bool = False, interaction_count: int = 0) -> str:
        """
        Generates a personalized text explanation for a recommendation without requiring an LLM call per book.
        Uses randomized templates for natural variety.
        """
        import random
        
        if user_prefs:
            fav_authors = user_prefs.get('favorite_authors', [])
            fav_genres = user_prefs.get('favorite_genres', [])
            
            # 1. Author Match (Strongest explicit match)
            if book.author and book.author in fav_authors:
                templates = [
                    f"Recommended because it's from '{book.author}', an author you've previously engaged with.",
                    f"Since you already have works by '{book.author}' in your library, you'll likely love this one too.",
                    f"This book is signed by '{book.author}', one of your favorite authors — a perfect fit for you."
                ]
                return random.choice(templates)

            # 2. Genre Match
            if book.genres:
                matching_genres = [g for g in book.genres if g in fav_genres]
                if matching_genres:
                    genre_str = matching_genres[0]
                    templates = [
                        f"We picked this for you because it's a popular title in '{genre_str}', a genre you enjoy.",
                        f"A great alternative to the other '{genre_str}' books in your library.",
                        f"'{genre_str}' stands out among your favorites — this book should meet your expectations.",
                        f"Based on your past orders, here's a '{genre_str}' pick you'll breeze through."
                    ]
                    return random.choice(templates)

        # 3. High Content Similarity fallback
        if content_score > 0.85:
            templates = [
                "We found over 90% alignment with your reading history and favorite books!",
                "This book matches your taste almost perfectly — you should definitely give it a try.",
                "Our algorithm says this book is a perfect match for your reading profile."
            ]
            return random.choice(templates)

        elif content_score > 0.65:
            templates = [
                "We think you'll like this because it shares similar themes with books you've explored.",
                "It aligns closely with the style of books you've been interested in recently.",
                "Based on your profile, this book looks very close to your taste."
            ]
            return random.choice(templates)

        # 4. Pure Popularity fallback
        if is_popular:
            if interaction_count > 5:
                templates = [
                    f"One of the favorite books on the platform — chosen by {interaction_count} of our readers!",
                    f"Very popular right now! Our readers are showing great interest in this book.",
                    f"Approved by our wide reader base — a bestseller on our lists."
                ]
                return random.choice(templates)
            else:
                templates = [
                    "One of the standout new titles shining on our platform.",
                    "A popular book our readers have been adding to their libraries.",
                    "A successful work drawing attention from our general readership."
                ]
                return random.choice(templates)

        templates = [
            "We recommended this because we thought it might match your reading style.",
            "Our broad algorithm picked this book for you — worth taking a look!",
            "A special selection we believe will add color to your collection."
        ]
        return random.choice(templates)
    
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
            return "This book matches your interests!"
    
    async def close(self):
        """Close service connections."""
        await self.openai_service.close()
