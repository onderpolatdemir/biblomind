"""API endpoints for personalized recommendations."""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.recommendation_service import RecommendationService
from app.schemas.recommendation import (
    RecommendationsListResponse,
    SimilarBooksResponse,
    PreferenceVectorUpdateResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get(
    "",
    response_model=RecommendationsListResponse,
    summary="Get personalized recommendations",
    description="""
    Get personalized book recommendations based on user's reading preferences.
    
    **Strategies:**
    - `hybrid` (default): Content similarity + popularity + recency
    - `content`: Pure content-based filtering (embedding similarity)
    - `popular`: Most popular books on the platform
    
    **Features:**
    - Excludes books user already interacted with (can be disabled)
    - Generates AI-powered explanations for top recommendations
    - Falls back to popular books for new users
    """
)
async def get_recommendations(
    limit: int = Query(
        default=10,
        ge=1,
        le=50,
        description="Number of recommendations to return"
    ),
    strategy: str = Query(
        default="hybrid",
        pattern="^(hybrid|content|popular)$",
        description="Recommendation strategy"
    ),
    exclude_owned: bool = Query(
        default=True,
        description="Exclude books user already interacted with"
    ),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get personalized book recommendations for the current user.
    
    Args:
        limit: Number of recommendations (1-50)
        strategy: Recommendation strategy (hybrid, content, popular)
        exclude_owned: Whether to exclude user's books
        db: Database session
        current_user: Authenticated user
        
    Returns:
        RecommendationsListResponse with personalized recommendations
    """
    try:
        logger.info(
            f"GET /api/recommendations - User: {current_user.id}, "
            f"Strategy: {strategy}, Limit: {limit}"
        )
        
        # Initialize recommendation service
        rec_service = RecommendationService(db)
        
        # Generate recommendations
        result = await rec_service.generate_recommendations(
            user_id=current_user.id,
            limit=limit,
            strategy=strategy,
            exclude_owned=exclude_owned
        )
        
        # Close OpenAI service connections
        await rec_service.close()
        
        logger.info(
            f"Successfully generated {result['total']} recommendations "
            f"(strategy: {result['strategy']})"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error generating recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate recommendations"
        )


@router.get(
    "/similar/{book_id}",
    response_model=SimilarBooksResponse,
    summary="Get similar books",
    description="""
    Find books similar to a given book using embedding similarity.
    
    **Use cases:**
    - "Customers who liked this also liked..."
    - "More books like this"
    - Related recommendations on book detail page
    
    **Similarity calculation:**
    - Uses pgvector cosine similarity on book embeddings
    - Only returns in-stock books
    - Sorted by similarity score (highest first)
    """
)
async def get_similar_books(
    book_id: UUID,
    limit: int = Query(
        default=5,
        ge=1,
        le=20,
        description="Number of similar books to return"
    ),
    db: Session = Depends(get_db)
):
    """
    Get books similar to a specific book.
    
    Args:
        book_id: UUID of the source book
        limit: Number of similar books to return (1-20)
        db: Database session
        
    Returns:
        SimilarBooksResponse with source book and similar books
    """
    try:
        logger.info(f"GET /api/recommendations/similar/{book_id} - Limit: {limit}")
        
        # Initialize recommendation service
        rec_service = RecommendationService(db)
        
        # Get similar books
        result = await rec_service.get_similar_books(
            book_id=book_id,
            limit=limit
        )
        
        # Close OpenAI service connections
        await rec_service.close()
        
        logger.info(f"Found {result['total']} similar books")
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error finding similar books: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to find similar books"
        )


@router.post(
    "/refresh",
    response_model=PreferenceVectorUpdateResponse,
    summary="Refresh user preference vector",
    description="""
    Manually trigger an update of the user's preference vector.
    
    **When to use:**
    - After bulk importing user's reading history
    - When testing recommendation quality
    - Force recalculation of user profile
    
    **Note:** This is normally done automatically in the background
    when users interact with books.
    """
)
async def refresh_preference_vector(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Manually update the current user's preference vector.
    
    This recalculates the user's preference vector based on all their
    interactions (likes, purchases, cart additions, views).
    
    Args:
        db: Database session
        current_user: Authenticated user
        
    Returns:
        PreferenceVectorUpdateResponse with update status
    """
    try:
        logger.info(f"POST /api/recommendations/refresh - User: {current_user.id}")
        
        # Initialize recommendation service
        rec_service = RecommendationService(db)
        
        # Update preference vector
        result = await rec_service.update_user_preference_vector(
            user_id=current_user.id
        )
        
        # Close OpenAI service connections
        await rec_service.close()
        
        logger.info(
            f"Preference vector update completed - "
            f"Updated: {result['vector_updated']}, "
            f"Interactions: {result['interactions_processed']}"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error updating preference vector: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update preference vector"
        )
