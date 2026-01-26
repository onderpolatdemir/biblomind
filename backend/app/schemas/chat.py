"""Pydantic schemas for chatbot and conversations."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field


# ============================================================================
# Request Schemas
# ============================================================================

class ChatMessageRequest(BaseModel):
    """Request schema for sending a chat message."""
    
    message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    conversation_id: Optional[UUID] = Field(None, description="Conversation ID (None for new conversation)")
    
    model_config = {"from_attributes": True}


class ConversationTitleUpdate(BaseModel):
    """Request schema for updating conversation title."""
    
    title: str = Field(..., min_length=1, max_length=200, description="New conversation title")
    
    model_config = {"from_attributes": True}


# ============================================================================
# Response Schemas
# ============================================================================

class BookReference(BaseModel):
    """Book reference from RAG context."""
    
    id: UUID
    title: str
    author: str
    similarity_score: Optional[float] = None
    
    model_config = {"from_attributes": True}


class ChatMessageResponse(BaseModel):
    """Response schema for a chat message exchange."""
    
    id: UUID = Field(..., description="Message ID")
    conversation_id: UUID = Field(..., description="Conversation ID")
    message: str = Field(..., description="User's message")
    response: str = Field(..., description="AI assistant's response")
    book_references: List[BookReference] = Field(default_factory=list, description="Books used for context")
    strategy: Optional[str] = Field(None, description="Recommendation strategy used (RAG/RecEngine/Hybrid)")
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ConversationMessageDetail(BaseModel):
    """Detailed message for conversation history."""
    
    id: UUID
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")
    book_context: Optional[Dict[str, Any]] = Field(None, description="RAG context metadata")
    created_at: datetime
    
    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    """Response schema for conversation summary."""
    
    id: UUID
    title: str
    message_count: int = Field(..., description="Total number of messages")
    last_message: Optional[str] = Field(None, description="Preview of last message")
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    """Response schema for conversation with full message history."""
    
    id: UUID
    title: str
    messages: List[ConversationMessageDetail] = Field(..., description="Full message history")
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    """Response schema for paginated conversation list."""
    
    conversations: List[ConversationResponse]
    total: int = Field(..., description="Total number of conversations")
    page: int
    page_size: int
    total_pages: int
    
    model_config = {"from_attributes": True}


class ConversationDeleteResponse(BaseModel):
    """Response schema for conversation deletion."""
    
    success: bool
    message: str
    conversation_id: UUID
    
    model_config = {"from_attributes": True}
