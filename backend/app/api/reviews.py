"""Book reviews API endpoints."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from datetime import datetime

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.book import Book
from app.models.review import Review


router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    comment: Optional[str] = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    rating: int
    comment: Optional[str]
    reviewer_name: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookReviewsResponse(BaseModel):
    reviews: List[ReviewResponse]
    total: int
    average_rating: float
    rating_distribution: dict  # {1: count, 2: count, ...}


# ── Helpers ──────────────────────────────────────────────────────────

def _to_response(review: Review) -> dict:
    return {
        "id": review.id,
        "user_id": review.user_id,
        "book_id": review.book_id,
        "rating": review.rating,
        "comment": review.comment,
        "reviewer_name": review.user.full_name if review.user else None,
        "created_at": review.created_at,
        "updated_at": review.updated_at,
    }


# ── Endpoints ────────────────────────────────────────────────────────

@router.get("/books/{book_id}/reviews", response_model=BookReviewsResponse)
async def get_book_reviews(
    book_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """Get all reviews for a book (public)."""
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    q = db.query(Review).filter(Review.book_id == book_id)
    total = q.count()

    reviews = (
        q.order_by(Review.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    avg = db.query(func.avg(Review.rating)).filter(Review.book_id == book_id).scalar() or 0.0
    dist = {}
    for star in range(1, 6):
        dist[star] = db.query(func.count(Review.id)).filter(
            Review.book_id == book_id, Review.rating == star
        ).scalar() or 0

    return BookReviewsResponse(
        reviews=[ReviewResponse(**_to_response(r)) for r in reviews],
        total=total,
        average_rating=round(float(avg), 2),
        rating_distribution=dist,
    )


@router.post("/books/{book_id}/reviews", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def upsert_review(
    book_id: UUID,
    body: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create or update the current user's review for a book.
    Each user can only have one review per book (upsert).
    """
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.book_id == book_id,
    ).first()

    if existing:
        existing.rating = body.rating
        existing.comment = body.comment
        db.commit()
        db.refresh(existing)
        return ReviewResponse(**_to_response(existing))

    review = Review(
        user_id=current_user.id,
        book_id=book_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewResponse(**_to_response(review))


@router.delete("/books/{book_id}/reviews", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete the current user's review for a book."""
    review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.book_id == book_id,
    ).first()

    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    db.delete(review)
    db.commit()


@router.get("/users/me/reviews", response_model=List[ReviewResponse])
async def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all reviews written by the current user."""
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [ReviewResponse(**_to_response(r)) for r in reviews]
