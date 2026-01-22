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
        # Initialize ChatOpenAI for conversations
        self.chat_model = ChatOpenAI(
            model=settings.OPENAI_LLM_MODEL,
            temperature=settings.OPENAI_TEMPERATURE,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model=settings.OPENAI_EMBEDDING_MODEL,
            dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS,
            openai_api_key=settings.OPENAI_API_KEY
        )
        
        logger.info("LangChain helper initialized")
    
    @staticmethod
    def create_recommendation_prompt() -> ChatPromptTemplate:
        """
        Create a prompt template for book recommendations.
        
        Returns:
            ChatPromptTemplate for recommendations
        """
        system_template = """Sen BiblioMind AI asistanısın. Kullanıcılara kitap önerileri yapıyorsun.
Görevin, neden bir kitabı önerdiğini kısa, net ve empatik bir şekilde açıklamak.
Açıklamalar 2-3 cümle olmalı, samimi ve kişiselleştirilmiş olmalı.
Türkçe yazmalısın.

Kullanıcı profili ve tercihlerini dikkate al.
Kitabın özellikleriyle kullanıcının ilgi alanlarını eşleştir.
Spesifik örnekler ver ve genel konuşma."""
        
        human_template = """Kullanıcı profili:
- Sevdiği türler: {favorite_genres}
- Okuma seviyesi: {reading_level}
- Favori yazarlar: {favorite_authors}

Önerilen kitap:
- Başlık: {book_title}
- Yazar: {book_author}
- Tür: {book_genre}
- Açıklama: {book_description}
- Eşleşme skoru: %{match_score}

Bu kitabı neden önerdiğini kullanıcıya açıkla. Kısa ve samimi ol."""
        
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
        return """Sen BiblioMind AI asistanısın, kullanıcılara kitap önerileri yapıyorsun.
Özelliklerin:
- Samimi ve yardımsever
- Kitaplar hakkında bilgili
- Kullanıcı tercihlerini dinleyen
- Spesifik ve net öneriler veren
- Türkçe konuşan

Kullanıcının sorularını yanıtla, kitap öner ve okuma alışkanlıklarını geliştirmesine yardımcı ol.
Kısa ve öz cevaplar ver (2-3 cümle)."""
    
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
            return "Üzgünüm, şu an bir hata oluştu. Lütfen tekrar deneyin."
    
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
        return """Sen BiblioMind AI kitap asistanısın. Kullanıcılara kitap önerir ve sorularını yanıtlarsın.

DAVRANIŞLARIN:
- Ana odak: Kitap önerileri ve kitaplar hakkında Q&A
- Konuyu kitaplara çekmeye çalış ama zorla değil
- Out-of-topic sorulara da cevap verebilirsin (kısıtlı genel sohbet)
- Kullanıcıyı kitap keşfine yönlendir

KURALLARI:
- Context'teki kitaplardan bahset (varsa)
- Spesifik kitap öner, genel konuşma
- Kısa ve net cevaplar (2-3 paragraf max)
- Türkçe konuş
- Hallüsinasyon yapma, context'te yoksa "bilmiyorum" de veya alternatif öner"""
    
    async def generate_rag_response(
        self,
        user_message: str,
        context: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
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
            return "Üzgünüm, şu an bir hata oluştu. Lütfen tekrar deneyin."
    
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
            prompt = f"""Aşağıdaki kullanıcı mesajından kısa ve öz bir başlık oluştur.
Başlık en fazla 3-5 kelime olmalı ve konuyu özetlemeli.
Sadece başlığı yaz, başka bir şey ekleme.

Kullanıcı mesajı: "{first_message}"

Başlık:"""
            
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
        reading_level=user_profile.get("reading_level", "orta"),
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
Kullanıcı hakkında:
- Favori türler: {', '.join(user_context.get('favorite_genres', []))}
- Son okunan kitaplar: {', '.join(user_context.get('recent_books', [])[:3])}
"""
    
    # Prepend context to first message if no history
    if not conversation_history:
        enhanced_message = f"{context_info}\n\nKullanıcı: {message}"
    else:
        enhanced_message = message
    
    return await helper.generate_chat_response(enhanced_message, conversation_history)
