"""User connection model for Book Buddy social features."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserConnection(Base):
    """
    User-to-user connections for Book Buddy feature.
    
    Stores compatibility scores and shared reading interests
    between users for social matching.
    """
    __tablename__ = "user_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    buddy_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Compatibility metrics
    compatibility_score = Column(Float, nullable=False)  # 0.0-1.0 cosine similarity
    shared_books = Column(Integer, default=0)  # Number of common books
    shared_genres = Column(Integer, default=0)  # Number of common genres
    
    # Connection status
    status = Column(
        String(20),
        default="suggested",
        nullable=False
    )  # suggested, connected, blocked
    
    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="connections")
    buddy = relationship("User", foreign_keys=[buddy_id])
    
    def __repr__(self):
        return (
            f"<UserConnection(user={self.user_id}, "
            f"buddy={self.buddy_id}, "
            f"score={self.compatibility_score:.2f})>"
        )
