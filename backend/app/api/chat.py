"""Chat API endpoints for conversational AI."""

import logging
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.chat_service import ChatService
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationResponse,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationTitleUpdate,
    ConversationDeleteResponse
)
from app.core.rate_limit import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/message",
    response_model=ChatMessageResponse,
    status_code=status.HTTP_200_OK,
    summary="Send chat message",
    description="""
    Send a message to the AI chatbot and get a response.
    
    **Features:**
    - HYBRID recommendation strategy (RAG + Recommendation Engine)
    - Automatic book detection (fuzzy matching)
    - Context-aware responses with conversation history
    - Max 5 active conversations per user (auto-cleanup)
    
    **Strategy Selection:**
    - Specific book mention → Book detection + RAG
    - "Recommend books" → Recommendation Engine (personalized)
    - General question → RAG semantic search
    - New user → Popular books
    
    **Usage:**
    - conversation_id: null → Creates new conversation
    - conversation_id: UUID → Continues existing conversation
    """
)
@limiter.limit("10/minute")
async def send_message(
    http_request: Request,
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Send a chat message and receive AI response.
    
    Args:
        request: Message request with content and optional conversation_id
        db: Database session
        current_user: Authenticated user
        
    Returns:
        ChatMessageResponse with AI reply and book references
    """
    try:
        logger.info(
            f"POST /api/chat/message - User: {current_user.id}, "
            f"Conversation: {request.conversation_id}, Message length: {len(request.message)}"
        )
        
        # Initialize chat service
        chat_service = ChatService(db)
        
        # Send message and get response
        result = await chat_service.send_message(
            user_id=current_user.id,
            message=request.message,
            conversation_id=request.conversation_id
        )
        
        # Close connections
        await chat_service.close()
        
        logger.info(
            f"Successfully processed message - Conversation: {result['conversation_id']}, "
            f"Strategy: {result['strategy']}"
        )
        
        return result
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing chat message: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )


@router.get(
    "/conversations",
    response_model=ConversationListResponse,
    summary="List user conversations",
    description="""
    Get paginated list of user's conversations.
    
    **Features:**
    - Sorted by last updated (newest first)
    - Shows message count and last message preview
    - Pagination support
    
    **Max:** 5 active conversations per user
    """
)
async def list_conversations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all conversations for the current user.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Paginated list of conversations
    """
    try:
        logger.info(
            f"GET /api/chat/conversations - User: {current_user.id}, "
            f"Page: {page}, Size: {page_size}"
        )
        
        chat_service = ChatService(db)
        
        result = chat_service.list_user_conversations(
            user_id=current_user.id,
            page=page,
            page_size=page_size
        )
        
        logger.info(
            f"Retrieved {len(result['conversations'])} conversations "
            f"(total: {result['total']})"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error listing conversations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list conversations"
        )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationDetailResponse,
    summary="Get conversation detail",
    description="""
    Get a specific conversation with full message history.
    
    **Includes:**
    - All messages (user + assistant)
    - Book context metadata (RAG references)
    - Timestamps
    
    **Access Control:** User can only access their own conversations
    """
)
async def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get conversation detail with full message history.
    
    Args:
        conversation_id: Conversation UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Conversation with all messages
    """
    try:
        logger.info(
            f"GET /api/chat/conversations/{conversation_id} - "
            f"User: {current_user.id}"
        )
        
        chat_service = ChatService(db)
        
        result = chat_service.get_conversation_detail(
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found or access denied"
            )
        
        logger.info(
            f"Retrieved conversation {conversation_id} "
            f"with {len(result['messages'])} messages"
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get conversation"
        )


@router.delete(
    "/conversations/{conversation_id}",
    response_model=ConversationDeleteResponse,
    summary="Delete conversation",
    description="""
    Delete a conversation and all its messages.
    
    **Cascade Delete:** All messages are automatically deleted
    **Access Control:** User can only delete their own conversations
    """
)
async def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a conversation.
    
    Args:
        conversation_id: Conversation UUID
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Deletion confirmation
    """
    try:
        logger.info(
            f"DELETE /api/chat/conversations/{conversation_id} - "
            f"User: {current_user.id}"
        )
        
        chat_service = ChatService(db)
        
        deleted = chat_service.delete_conversation(
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found or access denied"
            )
        
        logger.info(f"Successfully deleted conversation {conversation_id}")
        
        return {
            "success": True,
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation"
        )


@router.post(
    "/conversations/{conversation_id}/title",
    response_model=ConversationResponse,
    summary="Update conversation title",
    description="""
    Manually update the conversation title.
    
    **Default:** Titles are auto-generated from first message
    **Max Length:** 200 characters
    **Access Control:** User can only update their own conversations
    """
)
async def update_conversation_title(
    conversation_id: UUID,
    request: ConversationTitleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update conversation title.
    
    Args:
        conversation_id: Conversation UUID
        request: New title
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Updated conversation summary
    """
    try:
        logger.info(
            f"POST /api/chat/conversations/{conversation_id}/title - "
            f"User: {current_user.id}, New title: '{request.title}'"
        )
        
        chat_service = ChatService(db)
        
        updated = chat_service.update_conversation_title(
            conversation_id=conversation_id,
            user_id=current_user.id,
            new_title=request.title
        )
        
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found or access denied"
            )
        
        # Get updated conversation
        result = chat_service.get_conversation_detail(
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        logger.info(f"Successfully updated title for conversation {conversation_id}")
        
        # Return summary (without messages)
        return {
            "id": result["id"],
            "title": result["title"],
            "message_count": len(result["messages"]),
            "last_message": result["messages"][-1]["content"][:100] if result["messages"] else None,
            "created_at": result["created_at"],
            "updated_at": result["updated_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating conversation title: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update conversation title"
        )
