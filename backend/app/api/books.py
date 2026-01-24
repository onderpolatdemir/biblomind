from typing import Any, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.models.book import Book as BookModel
from app.schemas.book import Book

router = APIRouter()

@router.get("/", response_model=List[Book])
def read_books(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Retrieve books.
    """
    query = select(BookModel).offset(skip).limit(limit)
    books = db.execute(query).scalars().all()
    return books

@router.get("/{book_id}", response_model=Book)
def read_book(
    book_id: UUID,
    db: Session = Depends(get_db)
) -> Any:
    """
    Get book by ID.
    """
    query = select(BookModel).where(BookModel.id == book_id)
    book = db.execute(query).scalars().first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    return book
