"""API endpoints for book reviews."""

from typing import Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.review import (
    ReviewCreate, ReviewUpdate, ReviewResponse, 
    ReviewListResponse, UserReviewListResponse,
    ReviewEligibilityResponse
)
from app.services.review_service import ReviewService

router = APIRouter()


@router.get("/book/{book_id}", response_model=ReviewListResponse)
def get_book_reviews(
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
    # Check if they bought the book
    can_review = ReviewService.check_user_bought_book(db, current_user.id, book_id)
    
    # Check if they already reviewed it
    existing_review = ReviewService.get_user_review_for_book(db, current_user.id, book_id)
    
    return {
        "can_review": can_review,
        "has_reviewed": existing_review is not None,
        "existing_review": existing_review
    }


@router.get("/me", response_model=UserReviewListResponse)
def get_my_reviews(
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


@router.post("/book/{book_id}", response_model=ReviewResponse)
def create_review(
    book_id: UUID,
    review_in: ReviewCreate,
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


@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: UUID,
    review_in: ReviewUpdate,
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
def delete_review(
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
