"""Book model with semantic search capabilities."""

from sqlalchemy import Column, String, Text, DECIMAL, Integer, ARRAY, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime, timezone

from app.core.database import Base


class Book(Base):
    """
    Book model with AI-powered semantic embeddings.
    
    The embedding field stores a 1536-dimensional vector representation
    of the book's content (title, author, description, genres).
    This enables semantic search and recommendation.
    """
    __tablename__ = "books"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    title = Column(String(500), nullable=False, index=True)
    author = Column(String(255), index=True)
    isbn = Column(String(13), unique=True, index=True, nullable=True)
    description = Column(Text)
    
    # AI semantic embedding (1536 dimensions)
    embedding = Column(Vector(1536), nullable=True)
    
    # E-commerce fields
    price = Column(DECIMAL(10, 2))
    stock = Column(Integer, default=0)
    cover_url = Column(Text, nullable=True)
    
    # Categorization
    genres = Column(ARRAY(String), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    interactions = relationship("UserInteraction", back_populates="book")
    cart_items = relationship("CartItem", back_populates="book")
    order_items = relationship("OrderItem", back_populates="book")
    reviews = relationship("Review", back_populates="book", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Book(id={self.id}, title={self.title}, author={self.author})>"

    @property
    def rating(self):
        if not self.reviews:
            return None
        return sum(r.rating for r in self.reviews) / len(self.reviews)
        
    @property
    def reviews_count(self):
        return len(self.reviews) if self.reviews else 0
