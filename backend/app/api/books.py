"""Books API endpoints."""

import math
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin_user
from app.services.book_service import BookService
from app.schemas.book import BookCreate, BookUpdate, BookResponse, BookListResponse


router = APIRouter()


@router.get("", response_model=BookListResponse)
async def get_books(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    author: Optional[str] = Query(None, description="Filter by author (partial match)"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price"),
    sort_by: str = Query("created_at", pattern="^(title|author|price|created_at)$", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of books (public endpoint).
    
    Supports:
    - Pagination (page, page_size)
    - Filtering (genre, author, price range)
    - Sorting (title, author, price, created_at)
    """
    books, total = BookService.get_books(
        db=db,
        page=page,
        page_size=page_size,
        genre=genre,
        author=author,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    total_pages = math.ceil(total / page_size) if total > 0 else 0
    
    return BookListResponse(
        items=[BookResponse.model_validate(book) for book in books],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a single book by ID (public endpoint).
    """
    book = BookService.get_book_by_id(db, book_id)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    return BookResponse.model_validate(book)


@router.post("", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def create_book(
    book_data: BookCreate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Create a new book (admin only).
    
    Requires admin authentication.
    """
    # Check if ISBN already exists
    if book_data.isbn and BookService.check_isbn_exists(db, book_data.isbn):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book with this ISBN already exists"
        )
    
    book = BookService.create_book(db, book_data)
    
    return BookResponse.model_validate(book)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: UUID,
    book_data: BookUpdate,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Update a book (admin only).
    
    Requires admin authentication.
    """
    # Check if ISBN is being updated and already exists
    if book_data.isbn and BookService.check_isbn_exists(db, book_data.isbn, exclude_id=book_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book with this ISBN already exists"
        )
    
    book = BookService.update_book(db, book_id, book_data)
    
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    return BookResponse.model_validate(book)


@router.delete("/{book_id}", status_code=status.HTTP_200_OK)
async def delete_book(
    book_id: UUID,
    db: Session = Depends(get_db),
    admin_user = Depends(get_current_admin_user)
):
    """
    Delete a book (admin only).
    
    Requires admin authentication.
    """
    success = BookService.delete_book(db, book_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    return {"message": "Book deleted successfully"}
