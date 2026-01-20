"""User API endpoints for profile and preferences management."""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.book import Book
from app.services.user_service import UserService
from app.schemas.user import (
    UserResponse,
    UserWithPreferences,
    UserProfileUpdate,
    UserPreferences,
    UserPreferencesUpdate,
    InteractionCreate,
    InteractionResponse
)
from app.schemas.book import BookResponse


router = APIRouter()


@router.get("/me", response_model=UserWithPreferences)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile with preferences.
    
    Returns user information including derived preferences from interactions.
    """
    # Get user preferences (derived from favorites)
    preferences = UserService.get_user_preferences(db, current_user.id)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_admin": current_user.is_admin,
        "created_at": current_user.created_at,
        "preferences": preferences
    }


@router.put("/me/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile information.
    
    Currently supports updating:
    - full_name
    """
    updated_user = UserService.update_user_profile(
        db,
        current_user.id,
        profile_data
    )
    
    return updated_user


@router.get("/me/preferences", response_model=UserPreferences)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's preferences.
    
    Preferences are derived from user's favorite books:
    - favorite_genres: Genres from liked books
    - favorite_authors: Authors from liked books
    """
    preferences = UserService.get_user_preferences(db, current_user.id)
    return preferences


@router.put("/me/preferences", response_model=UserPreferences)
async def update_preferences(
    preferences: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current user's preferences.
    
    Note: This is a placeholder for Phase 2 AI integration.
    Currently, preferences are automatically derived from user interactions (favorites).
    In Phase 2, this will update the preferences_vector using AI embeddings.
    """
    updated_preferences = UserService.update_user_preferences(
        db,
        current_user.id,
        preferences
    )
    
    return updated_preferences


@router.get("/me/favorites", response_model=List[BookResponse])
async def get_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's favorite books.
    
    Returns all books that the user has marked as favorites (liked).
    """
    favorites = UserService.get_user_favorites(db, current_user.id)
    return favorites


@router.post("/me/favorites/{book_id}", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a book to favorites.
    
    Creates a 'like' interaction for the book.
    If already favorited, returns the book without error.
    """
    book = UserService.add_to_favorites(db, current_user.id, book_id)
    return book


@router.delete("/me/favorites/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_favorites(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a book from favorites.
    
    Deletes the 'like' interaction for the book.
    Returns 204 even if the book wasn't in favorites.
    """
    UserService.remove_from_favorites(db, current_user.id, book_id)
    return None


@router.get("/me/history", response_model=List[InteractionResponse])
async def get_interaction_history(
    interaction_type: Optional[str] = Query(None, description="Filter by type: view, like, cart, purchase"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's interaction history.
    
    Returns all user interactions (views, likes, cart additions, purchases).
    Can be filtered by interaction type.
    """
    # Validate interaction type if provided
    if interaction_type:
        valid_types = ["view", "like", "cart", "purchase"]
        if interaction_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid interaction type. Must be one of: {', '.join(valid_types)}"
            )
    
    interactions = UserService.get_user_interactions(
        db,
        current_user.id,
        interaction_type=interaction_type,
        limit=limit
    )
    
    return interactions


@router.post("/me/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    interaction: InteractionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a user interaction (track user behavior).
    
    Supported interaction types:
    - view: User viewed book details
    - like: User liked/favorited the book
    - cart: User added book to cart
    - purchase: User purchased the book
    
    Note: For 'like' interactions, use POST /me/favorites/{book_id} endpoint instead.
    This endpoint is primarily for tracking 'view' events from the frontend.
    """
    created_interaction = UserService.add_user_interaction(
        db,
        current_user.id,
        interaction.book_id,
        interaction.interaction_type
    )
    
    return created_interaction
