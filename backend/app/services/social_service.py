"""
Social service for Book Buddy matching and recommendations.

Matches users based on reading preferences using pgvector similarity.
"""

from typing import List, Dict, Any, Optional
from uuid import UUID
import numpy as np
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
        Calculate cosine similarity between two users' preference vectors.

        Uses pure-Python / numpy calculation on the list values loaded from
        the DB (pgvector's SQLAlchemy .cosine_distance() is a query builder
        expression and cannot be called on fetched Python lists).

        Returns 0.0 if either user doesn't have a preference vector.
        """
        if user_a.preferences_vector is None or user_b.preferences_vector is None:
            return 0.0

        try:
            vec_a = np.array(user_a.preferences_vector, dtype=np.float32)
            vec_b = np.array(user_b.preferences_vector, dtype=np.float32)

            norm_a = np.linalg.norm(vec_a)
            norm_b = np.linalg.norm(vec_b)

            if norm_a == 0.0 or norm_b == 0.0:
                return 0.0

            similarity = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
            similarity = max(0.0, min(1.0, similarity))

            logger.debug(
                f"User similarity: {user_a.id} <-> {user_b.id} = {similarity:.3f}"
            )
            return similarity

        except Exception as e:
            logger.error(f"Error calculating user similarity: {e}")
            return 0.0
    
    def find_book_buddies(
        self,
        user_id: UUID,
        limit: int = 10,
        min_interactions: int = 1,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Find users with similar reading preferences (Book Buddies).

        Calculates live similarity, upserts results into user_connections
        as status='suggested' for caching, then returns top matches.
        Blocked users are excluded.
        """
        try:
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user or user.preferences_vector is None:
                logger.warning(f"User {user_id} has no preference vector")
                return []

            # Exclude users already blocked in either direction
            blocked_ids = {
                c.buddy_id if c.user_id == user_id else c.user_id
                for c in self.db.query(UserConnection).filter(
                    or_(
                        UserConnection.user_id == user_id,
                        UserConnection.buddy_id == user_id
                    ),
                    UserConnection.status == "blocked"
                ).all()
            }

            candidate_users = (
                self.db.query(User)
                .filter(
                    User.id != user_id,
                    User.preferences_vector.isnot(None),
                    ~User.id.in_(blocked_ids) if blocked_ids else True
                )
                .all()
            )

            buddies = []
            for candidate in candidate_users:
                interaction_count = (
                    self.db.query(UserInteraction)
                    .filter(UserInteraction.user_id == candidate.id)
                    .count()
                )
                if interaction_count < min_interactions:
                    continue

                similarity = self.calculate_user_similarity(user, candidate)
                if similarity < min_similarity:
                    continue

                shared_books_count = (
                    self.db.query(func.count(UserInteraction.book_id.distinct()))
                    .filter(
                        and_(
                            UserInteraction.user_id == user_id,
                            UserInteraction.book_id.in_(
                                self.db.query(UserInteraction.book_id)
                                .filter(UserInteraction.user_id == candidate.id)
                            )
                        )
                    )
                    .scalar() or 0
                )

                # Count shared genres
                user_books = (
                    self.db.query(Book)
                    .join(UserInteraction, Book.id == UserInteraction.book_id)
                    .filter(UserInteraction.user_id == user_id)
                    .all()
                )
                cand_books = (
                    self.db.query(Book)
                    .join(UserInteraction, Book.id == UserInteraction.book_id)
                    .filter(UserInteraction.user_id == candidate.id)
                    .all()
                )
                def _flat(books):
                    s = set()
                    for b in books:
                        for g_str in (b.genres or []):
                            for part in g_str.split(","):
                                t = part.strip()
                                if t:
                                    s.add(t)
                    return s

                user_genres = _flat(user_books)
                cand_genres = _flat(cand_books)
                shared_genres_count = len(user_genres & cand_genres)

                buddies.append({
                    "user_id": candidate.id,
                    "email": candidate.email,
                    "full_name": candidate.full_name,
                    "compatibility_score": round(similarity, 3),
                    "shared_books": shared_books_count,
                    "shared_genres_count": shared_genres_count,
                    "total_interactions": interaction_count,
                })

                # Upsert into user_connections as 'suggested'
                self._upsert_connection(
                    user_id=user_id,
                    buddy_id=candidate.id,
                    compatibility_score=similarity,
                    shared_books=shared_books_count,
                    shared_genres=shared_genres_count,
                    status="suggested",
                )

            try:
                self.db.commit()
            except Exception:
                self.db.rollback()

            buddies.sort(key=lambda x: x["compatibility_score"], reverse=True)
            buddies = buddies[:limit]

            logger.info(
                f"Found {len(buddies)} book buddies for user {user_id} "
                f"(min_similarity={min_similarity})"
            )
            return buddies

        except Exception as e:
            logger.error(f"Error finding book buddies for user {user_id}: {e}")
            return []

    def _upsert_connection(
        self,
        user_id: UUID,
        buddy_id: UUID,
        compatibility_score: float,
        shared_books: int,
        shared_genres: int,
        status: str,
    ) -> None:
        """
        Insert or update a UserConnection row.
        Never downgrades a 'connected' record back to 'suggested'.
        Never overwrites a 'blocked' record.
        """
        existing = (
            self.db.query(UserConnection)
            .filter(
                or_(
                    and_(UserConnection.user_id == user_id, UserConnection.buddy_id == buddy_id),
                    and_(UserConnection.user_id == buddy_id, UserConnection.buddy_id == user_id),
                )
            )
            .first()
        )
        if existing:
            # Only update metadata if not already connected/blocked
            if existing.status not in ("connected", "blocked"):
                existing.status = status
                existing.compatibility_score = compatibility_score
                existing.shared_books = shared_books
                existing.shared_genres = shared_genres
        else:
            self.db.add(UserConnection(
                user_id=user_id,
                buddy_id=buddy_id,
                compatibility_score=compatibility_score,
                shared_books=shared_books,
                shared_genres=shared_genres,
                status=status,
            ))
    
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
            
            # Find shared genres — each book.genres element may be a comma-separated
            # string (e.g. "Fiction, Fantasy, Adventure"), so we split and strip.
            def _extract_genres(books):
                genres = set()
                for b in books:
                    for g_str in (b.genres or []):
                        for part in g_str.split(","):
                            t = part.strip()
                            if t:
                                genres.add(t)
                return genres

            user_books_all = (
                self.db.query(Book)
                .join(UserInteraction, Book.id == UserInteraction.book_id)
                .filter(UserInteraction.user_id == user_id)
                .all()
            )
            buddy_books_all = (
                self.db.query(Book)
                .join(UserInteraction, Book.id == UserInteraction.book_id)
                .filter(UserInteraction.user_id == buddy_id)
                .all()
            )

            user_genres = _extract_genres(user_books_all)
            buddy_genres = _extract_genres(buddy_books_all)

            # Count how many times each shared genre appears across both users' books
            # (more appearances = more important shared interest)
            shared_set = user_genres & buddy_genres
            genre_counts: dict[str, int] = {}
            for b in user_books_all + buddy_books_all:
                for g_str in (b.genres or []):
                    for part in g_str.split(","):
                        t = part.strip()
                        if t in shared_set:
                            genre_counts[t] = genre_counts.get(t, 0) + 1

            shared_genres = sorted(shared_set, key=lambda g: genre_counts.get(g, 0), reverse=True)
            
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
    
    def get_my_connections(
        self,
        user_id: UUID,
        status: Optional[str] = "connected"
    ) -> List[Dict[str, Any]]:
        """
        Return all connections for a user filtered by status.
        Works bidirectionally (user may appear in either user_id or buddy_id).
        """
        try:
            rows = (
                self.db.query(UserConnection)
                .filter(
                    or_(
                        UserConnection.user_id == user_id,
                        UserConnection.buddy_id == user_id,
                    ),
                    UserConnection.status == status,
                )
                .all()
            )

            results = []
            for conn in rows:
                other_id = conn.buddy_id if conn.user_id == user_id else conn.user_id
                other = self.db.query(User).filter(User.id == other_id).first()
                if not other:
                    continue
                interaction_count = (
                    self.db.query(UserInteraction)
                    .filter(UserInteraction.user_id == other_id)
                    .count()
                )
                results.append({
                    "connection_id": conn.id,
                    "user_id": other.id,
                    "email": other.email,
                    "full_name": other.full_name,
                    "compatibility_score": round(conn.compatibility_score, 3),
                    "shared_books": conn.shared_books,
                    "shared_genres_count": conn.shared_genres,
                    "total_interactions": interaction_count,
                    "status": conn.status,
                    "connected_at": conn.updated_at,
                })
            return results
        except Exception as e:
            logger.error(f"Error fetching connections for user {user_id}: {e}")
            return []

    def block_user(
        self,
        user_id: UUID,
        buddy_id: UUID
    ) -> Optional[UserConnection]:
        """
        Block a user. Creates or updates the connection row with status='blocked'.
        """
        try:
            existing = (
                self.db.query(UserConnection)
                .filter(
                    or_(
                        and_(UserConnection.user_id == user_id, UserConnection.buddy_id == buddy_id),
                        and_(UserConnection.user_id == buddy_id, UserConnection.buddy_id == user_id),
                    )
                )
                .first()
            )
            if existing:
                existing.status = "blocked"
                # Normalise direction so blocker is always user_id
                existing.user_id = user_id
                existing.buddy_id = buddy_id
                self.db.commit()
                self.db.refresh(existing)
                return existing

            user = self.db.query(User).filter(User.id == user_id).first()
            buddy = self.db.query(User).filter(User.id == buddy_id).first()
            if not user or not buddy:
                return None

            similarity = self.calculate_user_similarity(user, buddy)
            shared = self.get_shared_interests(user_id, buddy_id)

            conn = UserConnection(
                user_id=user_id,
                buddy_id=buddy_id,
                compatibility_score=similarity,
                shared_books=shared["shared_books_count"],
                shared_genres=shared["shared_genres_count"],
                status="blocked",
            )
            self.db.add(conn)
            self.db.commit()
            self.db.refresh(conn)
            logger.info(f"User {user_id} blocked {buddy_id}")
            return conn
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error blocking user {buddy_id} by {user_id}: {e}")
            return None

    def create_connection(
        self,
        user_id: UUID,
        buddy_id: UUID
    ) -> Optional[UserConnection]:
        """
        Send a connection request to a buddy.

        Sets status to 'pending' and creates a buddy_request notification
        for the target user. If a connection already exists the behaviour
        depends on its current status:
        - pending / connected → return as-is (no duplicate)
        - suggested → upgrade to pending + notify
        - blocked → return as-is (cannot override block)
        """
        try:
            from app.models.notification import Notification

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
                if existing.status in ("connected", "pending", "blocked"):
                    return existing
                # 'suggested' → upgrade to pending request
                existing.status = "pending"
                existing.user_id = user_id
                existing.buddy_id = buddy_id
                self._send_buddy_request_notification(user_id, buddy_id, existing.id)
                self.db.commit()
                self.db.refresh(existing)
                logger.info(f"Upgraded suggested → pending: {user_id} → {buddy_id}")
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

            # Create connection with pending status
            connection = UserConnection(
                user_id=user_id,
                buddy_id=buddy_id,
                compatibility_score=similarity,
                shared_books=shared_interests["shared_books_count"],
                shared_genres=shared_interests["shared_genres_count"],
                status="pending"
            )

            self.db.add(connection)
            self.db.flush()

            # Send buddy_request notification to the target user
            self._send_buddy_request_notification(user_id, buddy_id, connection.id)

            self.db.commit()
            self.db.refresh(connection)

            logger.info(
                f"Created pending connection request: {user_id} → {buddy_id} "
                f"(score: {similarity:.3f})"
            )

            return connection

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating connection: {e}")
            return None

    def accept_connection(self, user_id: UUID, connection_id: UUID) -> Optional[UserConnection]:
        """
        Accept a pending connection request.
        Only the buddy (recipient) can accept.
        """
        try:
            from app.models.notification import Notification

            conn = self.db.query(UserConnection).filter(UserConnection.id == connection_id).first()
            if not conn:
                return None
            if conn.buddy_id != user_id:
                return None  # only the recipient can accept
            if conn.status != "pending":
                return conn  # already processed

            conn.status = "connected"

            # Remove the buddy_request notification
            self.db.query(Notification).filter(
                Notification.entity_id == connection_id,
                Notification.type == "buddy_request",
            ).delete(synchronize_session=False)

            # Notify the requester that their request was accepted
            actor = self.db.query(User).filter(User.id == user_id).first()
            name = actor.full_name or actor.username or "Someone"
            self.db.add(Notification(
                user_id=conn.user_id,
                actor_id=user_id,
                type="buddy_accepted",
                entity_id=connection_id,
                message=f"{name} accepted your connection request",
            ))

            self.db.commit()
            self.db.refresh(conn)
            logger.info(f"Connection accepted: {conn.user_id} <-> {conn.buddy_id}")
            return conn
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error accepting connection {connection_id}: {e}")
            return None

    def reject_connection(self, user_id: UUID, connection_id: UUID) -> bool:
        """
        Reject a pending connection request.
        Only the buddy (recipient) can reject. Deletes the connection row.
        """
        try:
            from app.models.notification import Notification

            conn = self.db.query(UserConnection).filter(UserConnection.id == connection_id).first()
            if not conn:
                return False
            if conn.buddy_id != user_id:
                return False
            if conn.status != "pending":
                return False

            # Remove related notification
            self.db.query(Notification).filter(
                Notification.entity_id == connection_id,
                Notification.type == "buddy_request",
            ).delete(synchronize_session=False)

            self.db.delete(conn)
            self.db.commit()
            logger.info(f"Connection rejected and deleted: {connection_id}")
            return True
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error rejecting connection {connection_id}: {e}")
            return False

    def _send_buddy_request_notification(self, sender_id: UUID, recipient_id: UUID, connection_id):
        """Create a buddy_request notification for the recipient."""
        try:
            from app.models.notification import Notification
            actor = self.db.query(User).filter(User.id == sender_id).first()
            name = actor.full_name or actor.username or "Someone"
            self.db.add(Notification(
                user_id=recipient_id,
                actor_id=sender_id,
                type="buddy_request",
                entity_id=connection_id,
                message=f"{name} wants to connect with you",
            ))
        except Exception:
            pass
