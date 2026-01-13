"""Photo scan history and recommendations storage."""

from sqlalchemy import Column, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone

from app.core.database import Base


class PhotoScan(Base):
    """
    Stores photo scan history and AI-generated recommendations.
    
    This is the core feature: user uploads a photo of a bookshelf,
    AI detects books and generates personalized recommendations.
    """
    __tablename__ = "photo_scans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Image storage (URL or base64)
    image_url = Column(Text, nullable=True)
    
    # Google Vision API results
    detected_books = Column(JSONB, nullable=True)
    # Example: ["1984", "Brave New World", "Fahrenheit 451"]
    
    # AI-generated recommendations
    recommendations = Column(JSONB, nullable=True)
    # Example: [{"book_id": "...", "match_score": 0.92, "explanation": "..."}]
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    user = relationship("User", back_populates="photo_scans")
    
    def __repr__(self):
        return f"<PhotoScan(id={self.id}, user_id={self.user_id}, detected={len(self.detected_books or [])})>"
