"""Pydantic schemas for recommendation endpoints."""

from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


class BookRecommendation(BaseModel):
    """Book information in recommendation response."""
    
    id: str = Field(..., description="Book UUID")
    title: str = Field(..., description="Book title")
    author: Optional[str] = Field(None, description="Book author")
    cover_url: Optional[str] = Field(None, description="Cover image URL")
    price: Optional[float] = Field(None, description="Book price")
    stock: int = Field(..., description="Available stock")
    genres: List[str] = Field(default_factory=list, description="Book genres")
    description: Optional[str] = Field(None, description="Book description (truncated)")


class RecommendationResponse(BaseModel):
    """Single recommendation with score and explanation."""
    
    book: BookRecommendation = Field(..., description="Recommended book")
    score: float = Field(..., ge=0.0, le=1.0, description="Match score (0-1)")
    match_reasons: List[str] = Field(
        default_factory=list,
        description="Reasons for recommendation (e.g., 'high_similarity', 'popular')"
    )
    explanation: str = Field(
        default="",
        description="Personalized explanation for this recommendation"
    )


class RecommendationsListResponse(BaseModel):
    """List of personalized recommendations."""
    
    recommendations: List[RecommendationResponse] = Field(
        ...,
        description="List of recommended books"
    )
    total: int = Field(..., description="Total number of recommendations")
    strategy: str = Field(
        ...,
        description="Recommendation strategy used (hybrid, content, popular, popular_fallback)"
    )
    user_has_history: bool = Field(
        ...,
        description="Whether user has interaction history"
    )
    message: Optional[str] = Field(
        None,
        description="Optional message to user"
    )


class SimilarBookItem(BaseModel):
    """Single similar book with similarity score."""
    
    id: str = Field(..., description="Book UUID")
    title: str = Field(..., description="Book title")
    author: Optional[str] = Field(None, description="Book author")
    cover_url: Optional[str] = Field(None, description="Cover image URL")
    price: Optional[float] = Field(None, description="Book price")
    genres: List[str] = Field(default_factory=list, description="Book genres")
    similarity_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Similarity score to source book (0-1)"
    )


class SourceBook(BaseModel):
    """Source book in similar books response."""
    
    id: str = Field(..., description="Book UUID")
    title: str = Field(..., description="Book title")
    author: Optional[str] = Field(None, description="Book author")


class SimilarBooksResponse(BaseModel):
    """Response for similar books query."""
    
    book: SourceBook = Field(..., description="Source book")
    similar_books: List[SimilarBookItem] = Field(
        ...,
        description="List of similar books"
    )
    total: int = Field(..., description="Total number of similar books found")


class PreferenceVectorUpdateResponse(BaseModel):
    """Response for preference vector update operation."""
    
    message: str = Field(..., description="Status message")
    vector_updated: bool = Field(..., description="Whether vector was updated")
    interactions_processed: int = Field(
        ...,
        description="Number of interactions processed"
    )


class RecommendationDebugInfo(BaseModel):
    """Debug information for recommendation (optional)."""
    
    content_score: float = Field(..., description="Content similarity score")
    popularity_score: float = Field(..., description="Popularity score")
    recency_score: float = Field(..., description="Recency score")
