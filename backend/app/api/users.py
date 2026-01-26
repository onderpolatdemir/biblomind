"""User API endpoints for profile and preferences management."""

import logging
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.book import Book
from app.services.user_service import UserService
from app.services.recommendation_service import RecommendationService
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

logger = logging.getLogger(__name__)


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


async def _update_user_vector_background(db: Session, user_id: UUID):
    """
    Background task to update user's preference vector.
    
    This runs asynchronously after the interaction is saved,
    so the API response is not delayed.
    
    Args:
        db: Database session
        user_id: User UUID
    """
    try:
        logger.info(f"Background task: Updating preference vector for user {user_id}")
        
        rec_service = RecommendationService(db)
        result = await rec_service.update_user_preference_vector(user_id)
        await rec_service.close()
        
        logger.info(
            f"Background task completed: Vector updated={result['vector_updated']}, "
            f"Interactions processed={result['interactions_processed']}"
        )
    except Exception as e:
        logger.error(f"Background task failed: {e}")
        # Don't raise - background task failures shouldn't affect the main request


@router.post("/me/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def create_interaction(
    interaction: InteractionCreate,
    background_tasks: BackgroundTasks,
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
    
    **Background Processing:**
    After saving the interaction, the user's preference vector is automatically
    updated in the background. This ensures recommendations stay fresh without
    slowing down the API response.
    
    Note: For 'like' interactions, use POST /me/favorites/{book_id} endpoint instead.
    This endpoint is primarily for tracking 'view' events from the frontend.
    """
    # 1. Save interaction to database
    created_interaction = UserService.add_user_interaction(
        db,
        current_user.id,
        interaction.book_id,
        interaction.interaction_type
    )
    
    # 2. Schedule background task to update preference vector
    # Only update for meaningful interactions (not just views)
    if interaction.interaction_type in ['like', 'purchase', 'cart']:
        logger.info(
            f"Scheduling preference vector update for user {current_user.id} "
            f"(interaction type: {interaction.interaction_type})"
        )
        background_tasks.add_task(
            _update_user_vector_background,
            db=db,
            user_id=current_user.id
        )
    
    # 3. Return immediately (background task runs after response is sent)
    return created_interaction
