"""Chat service for conversation management and hybrid recommendations."""

import logging
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.models.conversation import Conversation, ConversationMessage
from app.models.user import User
from app.models.book import Book
from app.services.rag_service import RAGService
from app.services.langchain_helper import LangChainHelper
from app.services.recommendation_service import RecommendationService

logger = logging.getLogger(__name__)

# Maximum active conversations per user
MAX_CONVERSATIONS_PER_USER = 5

# Message history limit for context
MAX_HISTORY_MESSAGES = 50


class ChatService:
    """Service for chatbot conversations with hybrid recommendation strategy."""
    
    def __init__(self, db: Session):
        """
        Initialize chat service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.rag_service = RAGService(db)
        self.langchain_helper = LangChainHelper()
        self.rec_service = RecommendationService(db)
    
    async def send_message(
        self,
        user_id: UUID,
        message: str,
        conversation_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Send a message and get AI response with hybrid recommendation strategy.
        
        Workflow:
        1. Check conversation limit (max 5 active)
        2. Create or get conversation
        3. HYBRID strategy: Decide RAG vs Recommendation Engine
        4. Retrieve books using chosen strategy
        5. Generate response with LangChain
        6. Save messages to database
        
        Args:
            user_id: User UUID
            message: User's message
            conversation_id: Existing conversation ID (None for new)
            
        Returns:
            Response with message, AI reply, and book references
        """
        try:
            # Get user
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError(f"User {user_id} not found")
            
            # Get or create conversation
            if conversation_id:
                conversation = self.db.query(Conversation).filter(
                    Conversation.id == conversation_id,
                    Conversation.user_id == user_id
                ).first()
                
                if not conversation:
                    raise ValueError(f"Conversation {conversation_id} not found or access denied")
                
                is_new_conversation = False
            else:
                # Check conversation limit before creating new
                await self.check_and_enforce_conversation_limit(user_id)
                
                # Create new conversation (title will be generated after first response)
                conversation = Conversation(
                    user_id=user_id,
                    title="Yeni Sohbet"  # Temporary, will be updated
                )
                self.db.add(conversation)
                self.db.flush()  # Get ID without committing
                
                is_new_conversation = True
                logger.info(f"Created new conversation {conversation.id} for user {user_id}")
            
            # Decide recommendation strategy and get books
            strategy, books, context = await self.decide_recommendation_strategy(
                message=message,
                user=user,
                conversation=conversation
            )
            
            logger.info(
                f"Using strategy '{strategy}' - Found {len(books)} books "
                f"for conversation {conversation.id}"
            )
            
            # Get conversation history (for context)
            history = await self.get_conversation_history(
                conversation_id=conversation.id,
                limit=MAX_HISTORY_MESSAGES
            )
            
            # Generate AI response with RAG context
            ai_response = await self.langchain_helper.generate_rag_response(
                user_message=message,
                context=context,
                conversation_history=history
            )
            
            # Save user message
            user_msg = ConversationMessage(
                conversation_id=conversation.id,
                role="user",
                content=message
            )
            self.db.add(user_msg)
            
            # Save assistant response with book context
            book_references = self.rag_service.build_book_references(books)
            assistant_msg = ConversationMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=ai_response,
                book_context={
                    "strategy": strategy,
                    "books": book_references,
                    "book_count": len(books)
                }
            )
            self.db.add(assistant_msg)
            
            # Update conversation timestamp
            conversation.updated_at = datetime.now(timezone.utc)
            
            # Generate title for new conversation
            if is_new_conversation:
                title = await self.langchain_helper.generate_conversation_title(message)
                conversation.title = title
                logger.info(f"Generated title for conversation {conversation.id}: '{title}'")
            
            # Commit all changes
            self.db.commit()
            
            logger.info(
                f"Message exchange completed for conversation {conversation.id} "
                f"(strategy: {strategy}, books: {len(books)})"
            )
            
            return {
                "id": assistant_msg.id,
                "conversation_id": conversation.id,
                "message": message,
                "response": ai_response,
                "book_references": book_references,
                "strategy": strategy,
                "created_at": assistant_msg.created_at
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error in send_message: {e}", exc_info=True)
            raise
    
    async def decide_recommendation_strategy(
        self,
        message: str,
        user: User,
        conversation: Conversation
    ) -> Tuple[str, List[Dict[str, Any]], str]:
        """
        HYBRID strategy: Decide between RAG, Recommendation Engine, or both.
        
        Decision Logic:
        1. Detect specific book mentions → Use detected books + RAG similar
        2. Check if message asks for recommendations:
           a. Has user preference vector? → Recommendation Engine
           b. New user? → Popular books
        3. General question → RAG semantic search
        
        Args:
            message: User's message
            user: User object
            conversation: Conversation object
            
        Returns:
            Tuple of (strategy_name, books, context_string)
        """
        try:
            # Step 1: Detect specific book mentions (fuzzy matching)
            detected_books = await self.rag_service.detect_book_mentions(message)
            
            if detected_books:
                # User mentioned specific books - use RAG to find similar
                logger.info(f"Detected {len(detected_books)} specific books")
                
                # Convert detected books to dict format
                detected_dicts = [
                    {
                        "id": book.id,
                        "title": book.title,
                        "author": book.author,
                        "genre": book.genres,
                        "description": book.description,
                        "price": float(book.price) if book.price else None
                    }
                    for book in detected_books
                ]
                
                # Also get similar books
                exclude_ids = [book.id for book in detected_books]
                similar_books = await self.rag_service.retrieve_relevant_books(
                    query=message,
                    limit=2,
                    exclude_ids=exclude_ids
                )
                
                all_books = detected_dicts + similar_books
                context = self.rag_service.build_context(all_books)
                
                return ("book_detection", all_books, context)
            
            # Step 2: Check if asking for recommendations
            recommendation_keywords = [
                "öner", "öneri", "tavsiye", "kitap bul", "ne okuyayım",
                "okumak istiyorum", "kitap arıyorum", "suggest", "recommend"
            ]
            
            is_asking_recommendation = any(
                keyword in message.lower() 
                for keyword in recommendation_keywords
            )
            
            if is_asking_recommendation:
                # User wants recommendations
                if user.preferences_vector is not None:
                    # Use Recommendation Engine (personalized)
                    logger.info("Using Recommendation Engine (user has preferences)")
                    
                    rec_result = await self.rec_service.generate_recommendations(
                        user_id=user.id,
                        limit=5,
                        strategy="hybrid",
                        exclude_owned=True
                    )
                    
                    books = []
                    for rec in rec_result.get("recommendations", []):
                        books.append({
                            "id": rec["id"],
                            "title": rec["title"],
                            "author": rec["author"],
                            "genre": rec.get("genre"),
                            "description": rec.get("description"),
                            "price": rec.get("price"),
                            "similarity_score": rec.get("score")
                        })
                    
                    context = self.rag_service.build_context(books)
                    return ("recommendation_engine", books, context)
                else:
                    # New user - use popular books
                    logger.info("Using popular books (new user)")
                    books = await self.rag_service.get_popular_books(limit=5)
                    context = self.rag_service.build_context(books)
                    return ("popular_books", books, context)
            
            # Step 3: General question - use RAG semantic search
            logger.info("Using RAG semantic search (general question)")
            books = await self.rag_service.retrieve_relevant_books(
                query=message,
                limit=3
            )
            
            context = self.rag_service.build_context(books) if books else ""
            strategy = "rag_semantic" if books else "no_books"
            
            return (strategy, books, context)
            
        except Exception as e:
            logger.error(f"Error in decide_recommendation_strategy: {e}")
            # Fallback: no books
            return ("error_fallback", [], "")
    
    async def get_conversation_history(
        self,
        conversation_id: UUID,
        limit: int = MAX_HISTORY_MESSAGES
    ) -> List[Dict[str, str]]:
        """
        Get conversation history in LangChain format.
        
        Args:
            conversation_id: Conversation UUID
            limit: Maximum number of messages to retrieve
            
        Returns:
            List of messages in format [{"role": "user/assistant", "content": "..."}]
        """
        try:
            messages = (
                self.db.query(ConversationMessage)
                .filter(ConversationMessage.conversation_id == conversation_id)
                .order_by(ConversationMessage.created_at.desc())
                .limit(limit)
                .all()
            )
            
            # Reverse to get chronological order
            messages = list(reversed(messages))
            
            history = []
            for msg in messages:
                history.append({
                    "role": msg.role,
                    "content": msg.content
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Error getting conversation history: {e}")
            return []
    
    async def check_and_enforce_conversation_limit(
        self,
        user_id: UUID
    ) -> None:
        """
        Check conversation limit and delete oldest if exceeded.
        
        Enforces maximum of MAX_CONVERSATIONS_PER_USER active conversations.
        
        Args:
            user_id: User UUID
            
        Raises:
            None (auto-deletes oldest conversation if limit exceeded)
        """
        try:
            # Count user's conversations
            conv_count = (
                self.db.query(func.count(Conversation.id))
                .filter(Conversation.user_id == user_id)
                .scalar()
            )
            
            if conv_count >= MAX_CONVERSATIONS_PER_USER:
                # Delete oldest conversation
                oldest_conv = (
                    self.db.query(Conversation)
                    .filter(Conversation.user_id == user_id)
                    .order_by(Conversation.updated_at.asc())
                    .first()
                )
                
                if oldest_conv:
                    logger.info(
                        f"Deleting oldest conversation {oldest_conv.id} "
                        f"for user {user_id} (limit: {MAX_CONVERSATIONS_PER_USER})"
                    )
                    self.db.delete(oldest_conv)
                    self.db.commit()
                    
        except Exception as e:
            logger.error(f"Error checking conversation limit: {e}")
            self.db.rollback()
    
    def list_user_conversations(
        self,
        user_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        List user's conversations with pagination.
        
        Args:
            user_id: User UUID
            page: Page number (1-indexed)
            page_size: Items per page
            
        Returns:
            Paginated conversation list with metadata
        """
        try:
            # Get total count
            total = (
                self.db.query(func.count(Conversation.id))
                .filter(Conversation.user_id == user_id)
                .scalar()
            )
            
            # Get conversations
            offset = (page - 1) * page_size
            conversations = (
                self.db.query(Conversation)
                .filter(Conversation.user_id == user_id)
                .order_by(Conversation.updated_at.desc())
                .offset(offset)
                .limit(page_size)
                .all()
            )
            
            # Format response
            conversation_list = []
            for conv in conversations:
                # Get message count
                msg_count = (
                    self.db.query(func.count(ConversationMessage.id))
                    .filter(ConversationMessage.conversation_id == conv.id)
                    .scalar()
                )
                
                # Get last message
                last_msg = (
                    self.db.query(ConversationMessage)
                    .filter(ConversationMessage.conversation_id == conv.id)
                    .order_by(ConversationMessage.created_at.desc())
                    .first()
                )
                
                last_message_preview = None
                if last_msg:
                    preview = last_msg.content[:100]
                    if len(last_msg.content) > 100:
                        preview += "..."
                    last_message_preview = preview
                
                conversation_list.append({
                    "id": conv.id,
                    "title": conv.title,
                    "message_count": msg_count,
                    "last_message": last_message_preview,
                    "created_at": conv.created_at,
                    "updated_at": conv.updated_at
                })
            
            total_pages = (total + page_size - 1) // page_size
            
            return {
                "conversations": conversation_list,
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages
            }
            
        except Exception as e:
            logger.error(f"Error listing conversations: {e}")
            raise
    
    def get_conversation_detail(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """
        Get conversation with full message history.
        
        Args:
            conversation_id: Conversation UUID
            user_id: User UUID (for access control)
            
        Returns:
            Conversation with messages or None if not found
        """
        try:
            conversation = self.db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            
            if not conversation:
                return None
            
            # Get all messages
            messages = (
                self.db.query(ConversationMessage)
                .filter(ConversationMessage.conversation_id == conversation_id)
                .order_by(ConversationMessage.created_at.asc())
                .all()
            )
            
            message_list = []
            for msg in messages:
                message_list.append({
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "book_context": msg.book_context,
                    "created_at": msg.created_at
                })
            
            return {
                "id": conversation.id,
                "title": conversation.title,
                "messages": message_list,
                "created_at": conversation.created_at,
                "updated_at": conversation.updated_at
            }
            
        except Exception as e:
            logger.error(f"Error getting conversation detail: {e}")
            raise
    
    def delete_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Delete a conversation.
        
        Args:
            conversation_id: Conversation UUID
            user_id: User UUID (for access control)
            
        Returns:
            True if deleted, False if not found
        """
        try:
            conversation = self.db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            
            if not conversation:
                return False
            
            self.db.delete(conversation)
            self.db.commit()
            
            logger.info(f"Deleted conversation {conversation_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting conversation: {e}")
            self.db.rollback()
            raise
    
    def update_conversation_title(
        self,
        conversation_id: UUID,
        user_id: UUID,
        new_title: str
    ) -> bool:
        """
        Update conversation title.
        
        Args:
            conversation_id: Conversation UUID
            user_id: User UUID (for access control)
            new_title: New title
            
        Returns:
            True if updated, False if not found
        """
        try:
            conversation = self.db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            
            if not conversation:
                return False
            
            conversation.title = new_title
            conversation.updated_at = datetime.now(timezone.utc)
            self.db.commit()
            
            logger.info(f"Updated title for conversation {conversation_id}: '{new_title}'")
            return True
            
        except Exception as e:
            logger.error(f"Error updating conversation title: {e}")
            self.db.rollback()
            raise
    
    async def close(self):
        """Close service connections."""
        await self.rag_service.close()
        await self.rec_service.close()
