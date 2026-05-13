"""LangChain helpers for RAG and conversation management."""

import logging
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


class LangChainHelper:
    """Helper class for LangChain operations."""

    def __init__(self):
        """Initialize LangChain components."""
        # Validate API key
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-openai-api-key":
            logger.error("OPENAI_API_KEY not configured!")
            raise ValueError("OPENAI_API_KEY must be configured in .env file")

        # Initialize ChatOpenAI for conversations with timeout
        self.chat_model = ChatOpenAI(
            model=settings.OPENAI_LLM_MODEL,
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            openai_api_key=settings.OPENAI_API_KEY,
            timeout=30,  # 30 second timeout
            max_retries=2
        )

        # Initialize OpenAI embeddings with timeout
        self.embeddings = OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
            openai_api_key=settings.OPENAI_API_KEY,
            timeout=30,  # 30 second timeout
            max_retries=2
        )

        logger.info("LangChain helper initialized")
    
    @staticmethod
    def create_recommendation_prompt() -> ChatPromptTemplate:
        """
        Create a prompt template for book recommendations.
        
        Returns:
            ChatPromptTemplate for recommendations
        """
        system_template = """You are the BiblioMind AI assistant. You make book recommendations to users.
Your task is to explain, briefly, clearly, and empathetically, why a book is being recommended.
Explanations should be 2-3 sentences, warm, and personalized.
You must write in English.

Consider the user's profile and preferences.
Match the book's features with the user's interests.
Give specific examples — do not speak in generalities."""

        human_template = """User profile:
- Favorite genres: {favorite_genres}
- Reading level: {reading_level}
- Favorite authors: {favorite_authors}

Recommended book:
- Title: {book_title}
- Author: {book_author}
- Genre: {book_genre}
- Description: {book_description}
- Match score: {match_score}%

Explain to the user why you're recommending this book. Keep it short and friendly."""
        
        system_message = SystemMessagePromptTemplate.from_template(system_template)
        human_message = HumanMessagePromptTemplate.from_template(human_template)
        
        return ChatPromptTemplate.from_messages([system_message, human_message])
    
    @staticmethod
    def create_chatbot_system_prompt() -> str:
        """
        Create system prompt for chatbot conversations.
        
        Returns:
            System prompt string
        """
        return """You are the BiblioMind AI assistant, making book recommendations to users.
Your traits:
- Warm and helpful
- Knowledgeable about books
- Attentive to user preferences
- Gives specific, clear recommendations
- Speaks English

Answer the user's questions, recommend books, and help them improve their reading habits.
Keep answers short and concise (2-3 sentences)."""
    
    async def generate_chat_response(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generate chatbot response using conversation history.
        
        Args:
            message: User's message
            conversation_history: Previous messages (optional)
                Format: [{"role": "user"/"assistant", "content": "..."}]
        
        Returns:
            AI assistant's response
        """
        try:
            # Build messages list
            messages = [SystemMessage(content=self.create_chatbot_system_prompt())]
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history:
                    if msg["role"] == "user":
                        messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        messages.append(AIMessage(content=msg["content"]))
            
            # Add current message
            messages.append(HumanMessage(content=message))
            
            # Generate response
            response = await self.chat_model.agenerate([messages])
            
            # Extract text
            response_text = response.generations[0][0].text
            
            logger.info(f"Generated chat response (length: {len(response_text)})")
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating chat response: {e}")
            return "Sorry, something went wrong. Please try again."
    
    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for text using LangChain.
        
        Args:
            text: Text to embed
            
        Returns:
            Embedding vector
        """
        try:
            embedding = await self.embeddings.aembed_query(text)
            logger.debug(f"Generated embedding via LangChain ({len(embedding)} dims)")
            return embedding
        except Exception as e:
            logger.error(f"Error generating embedding via LangChain: {e}")
            raise
    
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for multiple documents.
        
        Args:
            texts: List of texts to embed
            
        Returns:
            List of embedding vectors
        """
        try:
            embeddings = await self.embeddings.aembed_documents(texts)
            logger.info(f"Generated {len(embeddings)} embeddings via LangChain")
            return embeddings
        except Exception as e:
            logger.error(f"Error generating document embeddings: {e}")
            raise
    
    @staticmethod
    def create_rag_system_prompt() -> str:
        """
        Create system prompt for RAG-based chatbot responses.
        
        Returns:
            System prompt string optimized for RAG context
        """
        return """You are the BiblioMind AI book assistant. You recommend books to users and answer their questions.

YOUR BEHAVIOR:
- Primary focus: Book recommendations and Q&A about books
- Try to steer conversations toward books, but not forcefully
- You may answer off-topic questions too (limited general chat)
- Guide the user toward discovering books

YOUR RULES:
- Mention books from the context (if any)
- Recommend specific books — do not speak in generalities
- Keep answers short and clear (2-3 paragraphs max)
- Speak in English
- Do not hallucinate — if not in context, say "I don't know" or suggest an alternative"""
    
    async def generate_rag_response(
        self,
        user_message: str,
        context: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        user_context: Optional[str] = None
    ) -> str:
        """
        Generate chatbot response with RAG context.
        
        This method combines RAG context (retrieved books) with conversation
        history to generate context-aware responses.
        
        Args:
            user_message: Current user message
            context: RAG context string (formatted book information)
            conversation_history: Previous messages (optional)
                Format: [{"role": "user"/"assistant", "content": "..."}]
        
        Returns:
            AI assistant's response
        """
        try:
            # Build messages list
            messages = []
            
            # System prompt with RAG behavior
            system_content = self.create_rag_system_prompt()
            messages.append(SystemMessage(content=system_content))

            # Inject user profile so the LLM can personalize its response
            if user_context:
                messages.append(SystemMessage(content=f"USER PROFILE:\n{user_context}"))

            # Add RAG context as a system message
            if context:
                context_message = f"\n\n{context}"
                messages.append(SystemMessage(content=context_message))
            
            # Add conversation history
            if conversation_history:
                for msg in conversation_history:
                    if msg["role"] == "user":
                        messages.append(HumanMessage(content=msg["content"]))
                    elif msg["role"] == "assistant":
                        messages.append(AIMessage(content=msg["content"]))
            
            # Add current user message
            messages.append(HumanMessage(content=user_message))
            
            # Generate response
            response = await self.chat_model.agenerate([messages])
            
            # Extract text
            response_text = response.generations[0][0].text
            
            logger.info(
                f"Generated RAG response (length: {len(response_text)}, "
                f"context: {len(context)} chars, history: {len(conversation_history or [])} msgs)"
            )
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating RAG response: {e}")
            return "Sorry, something went wrong. Please try again."
    
    async def generate_conversation_title(
        self,
        first_message: str,
        max_length: int = 50
    ) -> str:
        """
        Generate a concise conversation title from the first message.
        
        Args:
            first_message: First message in the conversation
            max_length: Maximum title length (default 50 chars)
            
        Returns:
            Generated title (3-5 words)
        """
        try:
            prompt = f"""Generate a short, concise title from the user message below.
The title must be at most 3-5 words and summarize the topic.
Write only the title — nothing else.

User message: "{first_message}"

Title:"""
            
            # Generate title
            response = await self.chat_model.agenerate([[HumanMessage(content=prompt)]])
            title = response.generations[0][0].text.strip()
            
            # Clean up title (remove quotes, etc.)
            title = title.strip('"\'')
            
            # Truncate if too long
            if len(title) > max_length:
                title = title[:max_length].rsplit(' ', 1)[0] + "..."
            
            logger.info(f"Generated conversation title: '{title}'")
            return title
            
        except Exception as e:
            logger.error(f"Error generating conversation title: {e}")
            # Fallback: use first few words of message
            words = first_message.split()[:4]
            return " ".join(words) + ("..." if len(first_message.split()) > 4 else "")


# Example usage functions for Phase 2.4

async def generate_recommendation_explanation(
    user_profile: Dict[str, Any],
    book: Dict[str, Any],
    match_score: float
) -> str:
    """
    Generate personalized recommendation explanation using LangChain.
    
    Args:
        user_profile: User preferences
        book: Book metadata
        match_score: Similarity score (0.0-1.0)
        
    Returns:
        Explanation text
    """
    helper = LangChainHelper()
    prompt_template = helper.create_recommendation_prompt()
    
    # Format prompt
    messages = prompt_template.format_messages(
        favorite_genres=", ".join(user_profile.get("favorite_genres", [])),
        reading_level=user_profile.get("reading_level", "intermediate"),
        favorite_authors=", ".join(user_profile.get("favorite_authors", [])),
        book_title=book.get("title", ""),
        book_author=book.get("author", ""),
        book_genre=book.get("genre", ""),
        book_description=book.get("description", "")[:200],  # Limit description
        match_score=int(match_score * 100)
    )
    
    # Generate response
    response = await helper.chat_model.agenerate([messages])
    return response.generations[0][0].text.strip()


async def chat_with_context(
    message: str,
    user_context: Dict[str, Any],
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> str:
    """
    Chat with user using context (for Phase 3.2 - Chatbot).
    
    Args:
        message: User's message
        user_context: User preferences and reading history
        conversation_history: Previous messages
        
    Returns:
        AI response
    """
    helper = LangChainHelper()
    
    # Enhance system prompt with user context
    context_info = f"""
About the user:
- Favorite genres: {', '.join(user_context.get('favorite_genres', []))}
- Recently read books: {', '.join(user_context.get('recent_books', [])[:3])}
"""

    # Prepend context to first message if no history
    if not conversation_history:
        enhanced_message = f"{context_info}\n\nUser: {message}"
    else:
        enhanced_message = message
    
    return await helper.generate_chat_response(enhanced_message, conversation_history)
