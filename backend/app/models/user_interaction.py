"""User interaction tracking for recommendation improvement."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from app.core.database import Base


class UserInteraction(Base):
    """
    Tracks user interactions with books for preference learning.
    
    Interaction types:
    - view: User viewed book details
    - like: User liked/favorited the book
    - cart: User added book to cart
    - purchase: User purchased the book
    """
    __tablename__ = "user_interactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Interaction type: view, like, cart, purchase
    interaction_type = Column(String(50), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = relationship("User", back_populates="interactions")
    book = relationship("Book", back_populates="interactions")
    
    # Composite index for efficient queries
    __table_args__ = (
        Index('idx_user_book_interaction', 'user_id', 'book_id', 'interaction_type'),
    )
    
    def __repr__(self):
        return f"<UserInteraction(user_id={self.user_id}, book_id={self.book_id}, type={self.interaction_type})>"
