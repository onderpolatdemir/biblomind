"""Book reviews API endpoints."""

from typing import Any, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
from datetime import datetime

from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.models.user import User
from app.models.book import Book
from app.models.review import Review

# User's schemas
from app.schemas.review import (
    ReviewCreate as UserReviewCreate, 
    ReviewUpdate as UserReviewUpdate, 
    ReviewResponse as UserReviewResponse, 
    ReviewListResponse, 
    UserReviewListResponse,
    ReviewEligibilityResponse
)
from app.services.review_service import ReviewService

router = APIRouter()

# ── User's Endpoints ────────────────────────────────────────────────────────

@router.get("/book/{book_id}", response_model=ReviewListResponse)
def get_book_reviews_user(
    book_id: UUID,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> Any:
    """
    Get all reviews for a specific book.
    """
    total, reviews = ReviewService.get_book_reviews(db, book_id=book_id, skip=skip, limit=limit)
    return {
        "total": total,
        "items": reviews,
        "page": (skip // limit) + 1,
        "size": limit
    }


@router.get("/book/{book_id}/eligibility", response_model=ReviewEligibilityResponse)
def check_review_eligibility(
    book_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Check if the current user is eligible to review a book.
    Returns whether they can review and if they already have an existing review.
    """
    can_review = ReviewService.check_user_bought_book(db, current_user.id, book_id)
    existing_review = ReviewService.get_user_review_for_book(db, current_user.id, book_id)
    
    return {
        "can_review": can_review,
        "has_reviewed": existing_review is not None,
        "existing_review": existing_review
    }


@router.get("/me", response_model=UserReviewListResponse)
def get_my_reviews_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100)
) -> Any:
    """
    Get all reviews written by the currently logged-in user.
    """
    total, formatted_reviews = ReviewService.get_user_reviews(
        db, 
        user_id=current_user.id, 
        skip=skip, 
        limit=limit
    )
    return {
        "total": total,
        "items": formatted_reviews,
        "page": (skip // limit) + 1,
        "size": limit
    }


@router.post("/book/{book_id}", response_model=UserReviewResponse)
def create_review(
    book_id: UUID,
    review_in: UserReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Add a review for a book.
    You must have purchased the book to review it.
    """
    return ReviewService.create_review(
        db, 
        user_id=current_user.id, 
        book_id=book_id, 
        review_in=review_in
    )


@router.put("/{review_id}", response_model=UserReviewResponse)
def update_review(
    review_id: UUID,
    review_in: UserReviewUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Update your own review.
    """
    return ReviewService.update_review(
        db, 
        review_id=review_id, 
        user_id=current_user.id, 
        review_in=review_in
    )


@router.delete("/{review_id}")
def delete_review_user(
    review_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Delete your own review.
    """
    ReviewService.delete_review(
        db, 
        review_id=review_id, 
        user_id=current_user.id
    )
    return {"message": "Review successfully deleted"}

# ── Kaan's Schemas ──────────────────────────────────────────────────────────

class ReviewCreateV2(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating 1-5")
    comment: Optional[str] = Field(None, max_length=2000)


class ReviewResponseV2(BaseModel):
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
    reviews: List[ReviewResponseV2]
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

# ── Kaan's Endpoints ────────────────────────────────────────────────────────

@router.get("/books/{book_id}/reviews", response_model=BookReviewsResponse)
async def get_book_reviews_v2(
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
        reviews=[ReviewResponseV2(**_to_response(r)) for r in reviews],
        total=total,
        average_rating=round(float(avg), 2),
        rating_distribution=dist,
    )


@router.post("/books/{book_id}/reviews", response_model=ReviewResponseV2, status_code=status.HTTP_201_CREATED)
async def upsert_review_v2(
    book_id: UUID,
    body: ReviewCreateV2,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create or update the current user's review for a book.
    Each user can only have one review per book (upsert).
    User must have purchased the book to review it.
    """
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    # Verify user has purchased the book
    if not ReviewService.check_user_bought_book(db, current_user.id, book_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only review books you have purchased"
        )

    existing = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.book_id == book_id,
    ).first()

    if existing:
        existing.rating = body.rating
        existing.comment = body.comment
        db.commit()
        db.refresh(existing)
        return ReviewResponseV2(**_to_response(existing))

    review = Review(
        user_id=current_user.id,
        book_id=book_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return ReviewResponseV2(**_to_response(review))


@router.delete("/books/{book_id}/reviews", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review_v2(
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


@router.get("/users/me/reviews", response_model=List[ReviewResponseV2])
async def get_my_reviews_v2(
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
    return [ReviewResponseV2(**_to_response(r)) for r in reviews]

