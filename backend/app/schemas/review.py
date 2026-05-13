"""Pydantic schemas for reviews."""

from typing import Optional, List
from pydantic import BaseModel, Field, conint
from datetime import datetime
from uuid import UUID


class ReviewBase(BaseModel):
    """Base review schema."""
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional text review")


class ReviewCreate(ReviewBase):
    """Schema for creating a review."""
    pass


class ReviewUpdate(BaseModel):
    """Schema for updating a review."""
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1 to 5")
    comment: Optional[str] = Field(None, max_length=1000, description="Optional text review")


class ReviewResponse(ReviewBase):
    """Schema for review response."""
    id: UUID
    user_id: UUID
    book_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BookReviewResponse(ReviewResponse):
    """Schema for a review shown in book details, including username."""
    user_name: str


class ReviewListResponse(BaseModel):
    """Schema for a paginated list of reviews."""
    total: int
    items: List[BookReviewResponse]
    page: int
    size: int


class UserReviewResponse(BaseModel):
    """Schema for a review shown in user profile."""
    id: UUID
    book_id: UUID
    book_title: str
    book_author: Optional[str] = None
    book_cover_url: Optional[str] = None
    rating: int
    comment: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserReviewListResponse(BaseModel):
    """Schema for a paginated list of user reviews."""
    total: int
    items: List[UserReviewResponse]
    page: int
    size: int


class ReviewEligibilityResponse(BaseModel):
    """Schema for checking if a user can review a book."""
    can_review: bool
    has_reviewed: bool
    existing_review: Optional[ReviewResponse] = None
