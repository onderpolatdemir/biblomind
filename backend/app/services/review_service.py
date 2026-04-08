"""Review service."""

from typing import List, Optional
from uuid import UUID
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.review import Review
from app.models.book import Book
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.schemas.review import ReviewCreate, ReviewUpdate


class ReviewService:
    """Service for handling book reviews."""
    
    @staticmethod
    def check_user_bought_book(db: Session, user_id: UUID, book_id: UUID) -> bool:
        """
        Check if a user has bought a specific book.
        
        A user is considered to have bought a book if they have an order containing
        the book, and the order status is PAID, SHIPPED, or DELIVERED.
        """
        bought_order = db.query(Order).join(OrderItem).filter(
            Order.user_id == user_id,
            OrderItem.book_id == book_id,
            Order.status.in_([OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED])
        ).first()
        
        return bought_order is not None

    @staticmethod
    def get_review_by_id(db: Session, review_id: UUID) -> Optional[Review]:
        """Get a review by its ID."""
        return db.query(Review).filter(Review.id == review_id).first()

    @staticmethod
    def get_user_review_for_book(db: Session, user_id: UUID, book_id: UUID) -> Optional[Review]:
        """Get a user's review for a specific book."""
        return db.query(Review).filter(
            Review.user_id == user_id, 
            Review.book_id == book_id
        ).first()

    @staticmethod
    def get_book_reviews(db: Session, book_id: UUID, skip: int = 0, limit: int = 10) -> tuple[int, List[dict]]:
        """Get all reviews for a book with pagination, including user names."""
        query = db.query(Review, User).join(User, Review.user_id == User.id).filter(Review.book_id == book_id)
        total = query.count()
        results = query.order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
        
        formatted_reviews = []
        for review, user in results:
            formatted_reviews.append({
                "id": review.id,
                "user_id": review.user_id,
                "book_id": review.book_id,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
                "updated_at": review.updated_at,
                "user_name": user.full_name or user.email.split('@')[0] if user else "Anonymous"
            })
            
        return total, formatted_reviews

    @staticmethod
    def get_user_reviews(db: Session, user_id: UUID, skip: int = 0, limit: int = 10) -> tuple[int, List[dict]]:
        """Get all reviews submitted by a specific user, with book details."""
        query = db.query(Review, Book).join(Book, Review.book_id == Book.id).filter(Review.user_id == user_id)
        total = query.count()
        results = query.order_by(desc(Review.created_at)).offset(skip).limit(limit).all()
        
        formatted_reviews = []
        for review, book in results:
            formatted_reviews.append({
                "id": review.id,
                "book_id": review.book_id,
                "book_title": book.title,
                "book_author": book.author,
                "book_cover_url": book.cover_url,
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at,
                "updated_at": review.updated_at
            })
            
        return total, formatted_reviews

    @classmethod
    def create_review(cls, db: Session, user_id: UUID, book_id: UUID, review_in: ReviewCreate) -> Review:
        """
        Create a new review for a book.
        Verifies that the user has actually bought the book.
        """
        # Ensure book exists
        book = db.query(Book).filter(Book.id == book_id).first()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found"
            )

        # Ensure user has actually bought the book
        if not cls.check_user_bought_book(db, user_id, book_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only review books you have purchased"
            )
            
        # Check if user already reviewed this book
        existing_review = cls.get_user_review_for_book(db, user_id, book_id)
        if existing_review:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this book"
            )
            
        # Create new review
        db_review = Review(
            user_id=user_id,
            book_id=book_id,
            rating=review_in.rating,
            comment=review_in.comment
        )
        db.add(db_review)
        db.commit()
        db.refresh(db_review)
        return db_review

    @classmethod
    def update_review(cls, db: Session, review_id: UUID, user_id: UUID, review_in: ReviewUpdate) -> Review:
        """Update an existing review."""
        db_review = cls.get_review_by_id(db, review_id)
        if not db_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
            
        # Verify ownership
        if db_review.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this review"
            )
            
        # Update fields
        if review_in.rating is not None:
            db_review.rating = review_in.rating
        if review_in.comment is not None:
            db_review.comment = review_in.comment
            
        db.commit()
        db.refresh(db_review)
        return db_review

    @classmethod
    def delete_review(cls, db: Session, review_id: UUID, user_id: UUID) -> bool:
        """Delete a review."""
        db_review = cls.get_review_by_id(db, review_id)
        if not db_review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
            
        # Verify ownership
        if db_review.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this review"
            )
            
        db.delete(db_review)
        db.commit()
        return True
