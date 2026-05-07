"""
Social features API endpoints (Book Buddy).

Endpoints for finding similar readers and getting social recommendations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.social_service import SocialService
from app.schemas.social import (
    BookBuddyListResponse,
    BookBuddyMatch,
    SharedInterestsResponse,
    BuddyRecommendationsResponse,
    BuddyRecommendation,
    ConnectionResponse,
    MyConnectionsResponse,
    MyConnectionItem,
    BlockResponse,
    UserSearchResult,
    UserSearchResponse,
)
from app.core.logging import logger


router = APIRouter()


@router.get("/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=1, max_length=50, description="Username to search for"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search users by username (partial match, case-insensitive).
    Returns up to 10 results, excludes the current user.
    """
    results = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            User.username.isnot(None),
            User.username.ilike(f"%{q}%"),
        )
        .limit(10)
        .all()
    )

    return UserSearchResponse(
        results=[
            UserSearchResult(
                user_id=u.id,
                username=u.username,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
            )
            for u in results
        ],
        total=len(results),
    )


@router.get("/find-buddies", response_model=BookBuddyListResponse)
async def find_book_buddies(
    limit: int = Query(10, ge=1, le=50, description="Maximum number of buddies to return"),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0, description="Minimum similarity threshold"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Find book buddies with similar reading preferences.
    
    Matches users based on cosine similarity of preference vectors.
    Requires user to have at least 5 interactions.
    
    **Returns:**
    - List of similar users ranked by compatibility
    - Compatibility score (0.0-1.0)
    - Number of shared books
    - Total interactions
    
    **Algorithm:**
    - Uses pgvector cosine similarity on user preference vectors
    - Filters users with minimum 5 interactions
    - Ranks by compatibility score (descending)
    """
    service = SocialService(db)
    
    buddies = service.find_book_buddies(
        user_id=current_user.id,
        limit=limit,
        min_similarity=min_similarity
    )
    
    logger.info(
        f"User {current_user.id} found {len(buddies)} book buddies "
        f"(limit={limit}, min_similarity={min_similarity})"
    )
    
    return BookBuddyListResponse(
        buddies=[BookBuddyMatch(**buddy) for buddy in buddies],
        total=len(buddies)
    )


@router.get("/buddies/{buddy_id}/shared-interests", response_model=SharedInterestsResponse)
async def get_shared_interests(
    buddy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get shared books and genres between you and a buddy.
    
    **Returns:**
    - List of books both users have interacted with
    - Shared genres
    - Statistics (total books for each user)
    
    **Use Case:**
    - Before connecting, see what you have in common
    - Conversation starters ("I see we both loved 1984!")
    """
    # Check buddy exists
    buddy = db.query(User).filter(User.id == buddy_id).first()
    if not buddy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buddy not found"
        )
    
    service = SocialService(db)
    shared_interests = service.get_shared_interests(
        user_id=current_user.id,
        buddy_id=buddy_id
    )
    
    logger.info(
        f"Retrieved shared interests: {current_user.id} <-> {buddy_id} "
        f"({shared_interests['shared_books_count']} books, "
        f"{shared_interests['shared_genres_count']} genres)"
    )
    
    return SharedInterestsResponse(**shared_interests)


@router.get("/buddies/{buddy_id}/recommendations", response_model=BuddyRecommendationsResponse)
async def get_buddy_recommendations(
    buddy_id: UUID,
    limit: int = Query(10, ge=1, le=50, description="Maximum recommendations"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get book recommendations based on buddy's reading history.
    
    Returns books that your buddy liked but you haven't read yet.
    
    **Returns:**
    - Books buddy liked (but you haven't interacted with)
    - Interaction type (like, purchase)
    - When buddy interacted with the book
    
    **Use Case:**
    - Discover books through friends' recommendations
    - "Your buddy loved these books"
    """
    # Check buddy exists
    buddy = db.query(User).filter(User.id == buddy_id).first()
    if not buddy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buddy not found"
        )
    
    service = SocialService(db)
    recommendations = service.get_buddy_recommendations(
        user_id=current_user.id,
        buddy_id=buddy_id,
        limit=limit
    )
    
    logger.info(
        f"Retrieved {len(recommendations)} buddy recommendations "
        f"from {buddy_id} for {current_user.id}"
    )
    
    return BuddyRecommendationsResponse(
        recommendations=[BuddyRecommendation(**rec) for rec in recommendations],
        total=len(recommendations),
        buddy_id=buddy_id
    )


@router.post("/connect/{buddy_id}", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def connect_with_buddy(
    buddy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a connection with a book buddy.
    
    **Effect:**
    - Creates UserConnection record
    - Calculates compatibility score
    - Counts shared books and genres
    - Sets status to 'connected'
    
    **Returns:**
    - Connection details with compatibility metrics
    
    **Note:**
    - Cannot connect with yourself
    - Duplicate connections are updated to 'connected' status
    """
    # Validate not self-connection
    if current_user.id == buddy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot connect with yourself"
        )
    
    # Check buddy exists
    buddy = db.query(User).filter(User.id == buddy_id).first()
    if not buddy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Buddy not found"
        )
    
    service = SocialService(db)
    connection = service.create_connection(
        user_id=current_user.id,
        buddy_id=buddy_id
    )
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create connection"
        )
    
    logger.info(
        f"User {current_user.id} connected with {buddy_id} "
        f"(score: {connection.compatibility_score:.3f})"
    )
    
    return ConnectionResponse(
        connection_id=connection.id,
        user_id=connection.user_id,
        buddy_id=connection.buddy_id,
        compatibility_score=connection.compatibility_score,
        shared_books=connection.shared_books,
        shared_genres=connection.shared_genres,
        status=connection.status,
        created_at=connection.created_at
    )


@router.get("/my-connections", response_model=MyConnectionsResponse)
async def get_my_connections(
    conn_status: str = Query("connected", alias="status", description="Filter by status: connected, suggested, blocked"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List current user's connections filtered by status.

    - **connected**: Users you have explicitly connected with
    - **suggested**: Users auto-discovered by find-buddies (not yet connected)
    - **blocked**: Users you have blocked
    """
    if conn_status not in ("connected", "suggested", "blocked"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="status must be one of: connected, suggested, blocked"
        )

    service = SocialService(db)
    connections = service.get_my_connections(user_id=current_user.id, status=conn_status)

    logger.info(
        f"User {current_user.id} fetched {len(connections)} '{conn_status}' connections"
    )

    return MyConnectionsResponse(
        connections=[MyConnectionItem(**c) for c in connections],
        total=len(connections),
    )


@router.post("/block/{buddy_id}", response_model=BlockResponse, status_code=status.HTTP_200_OK)
async def block_user(
    buddy_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Block a user.

    - Creates or updates a UserConnection row with **status='blocked'**
    - Blocked users will not appear in future find-buddies results
    - The action is reversible only by manually unblocking (not yet exposed)
    """
    if current_user.id == buddy_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot block yourself"
        )

    buddy = db.query(User).filter(User.id == buddy_id).first()
    if not buddy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    service = SocialService(db)
    connection = service.block_user(user_id=current_user.id, buddy_id=buddy_id)

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to block user"
        )

    logger.info(f"User {current_user.id} blocked {buddy_id}")

    return BlockResponse(
        connection_id=connection.id,
        blocked_user_id=buddy_id,
        status="blocked",
        message=f"User has been blocked successfully",
    )


@router.post("/connections/{connection_id}/accept", response_model=ConnectionResponse)
async def accept_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Accept a pending connection request.

    Only the recipient (buddy_id on the connection) can accept.
    Creates a mutual connection and notifies the requester.
    """
    service = SocialService(db)
    connection = service.accept_connection(current_user.id, connection_id)

    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection request not found or you cannot accept it"
        )

    logger.info(f"User {current_user.id} accepted connection {connection_id}")

    return ConnectionResponse(
        connection_id=connection.id,
        user_id=connection.user_id,
        buddy_id=connection.buddy_id,
        compatibility_score=connection.compatibility_score,
        shared_books=connection.shared_books,
        shared_genres=connection.shared_genres,
        status=connection.status,
        created_at=connection.created_at
    )


@router.post("/connections/{connection_id}/reject")
async def reject_connection(
    connection_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Reject a pending connection request.

    Only the recipient (buddy_id on the connection) can reject.
    Deletes the connection row entirely.
    """
    service = SocialService(db)
    success = service.reject_connection(current_user.id, connection_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection request not found or you cannot reject it"
        )

    logger.info(f"User {current_user.id} rejected connection {connection_id}")
    return {"ok": True, "message": "Connection request rejected"}

