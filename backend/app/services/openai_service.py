"""OpenAI API integration service for embeddings and text generation."""

import hashlib
import json
import logging
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI, OpenAIError, RateLimitError, APIConnectionError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type
)
import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for OpenAI API operations (embeddings, completions)."""
    
    def __init__(self):
        """Initialize OpenAI client and Redis cache."""
        # Validate API key
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your-openai-api-key":
            logger.error("OPENAI_API_KEY not configured!")
            raise ValueError("OPENAI_API_KEY must be configured in .env file")
        
        # Initialize async OpenAI client with timeout
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=30.0,  # 30 second timeout
            max_retries=2
        )
        
        # Initialize Redis client for caching
        self.redis_client: Optional[redis.Redis] = None
        self._init_redis()
    
    def _init_redis(self):
        """Initialize Redis connection."""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis client initialized for OpenAI service")
        except Exception as e:
            logger.warning(f"Redis initialization failed: {e}. Cache will be disabled.")
            self.redis_client = None
    
    @staticmethod
    def _get_cache_key(prefix: str, content: str) -> str:
        """
        Generate a consistent cache key using hash.
        
        Args:
            prefix: Cache key prefix (e.g., 'embedding', 'completion')
            content: Content to hash
            
        Returns:
            Cache key string
        """
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        return f"{settings.CACHE_PREFIX}:{prefix}:{content_hash}"
    
    async def _get_from_cache(self, key: str) -> Optional[Any]:
        """
        Get value from Redis cache.
        
        Args:
            key: Cache key
            
        Returns:
            Cached value or None
        """
        if not self.redis_client:
            return None
        
        try:
            value = await self.redis_client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None
    
    async def _set_cache(self, key: str, value: Any, ttl: int = None):
        """
        Set value in Redis cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds (default: from settings)
        """
        if not self.redis_client:
            return
        
        try:
            ttl = ttl or settings.CACHE_TTL_SECONDS
            await self.redis_client.setex(
                key,
                ttl,
                json.dumps(value)
            )
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.error(f"Redis set error: {e}")
    
    @staticmethod
    async def _track_token_usage(model: str, input_tokens: int, output_tokens: int = 0):
        """
        Track token usage for monitoring and cost analysis.
        
        Args:
            model: Model name
            input_tokens: Number of input tokens used
            output_tokens: Number of output tokens generated
        """
        total_tokens = input_tokens + output_tokens
        logger.info(
            f"OpenAI API usage - Model: {model}, "
            f"Input: {input_tokens}, Output: {output_tokens}, "
            f"Total: {total_tokens} tokens"
        )
        # TODO: Store in database for cost monitoring dashboard
    
    @retry(
        retry=retry_if_exception_type((RateLimitError, APIConnectionError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def generate_embedding(
        self,
        text: str,
        use_cache: bool = True
    ) -> List[float]:
        """
        Generate embedding vector for given text using OpenAI API.
        
        Args:
            text: Text to generate embedding for
            use_cache: Whether to use cache (default: True)
            
        Returns:
            List of floats representing the embedding vector (1536 dimensions)
            
        Raises:
            OpenAIError: If API call fails after retries
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Check cache first
        if use_cache:
            cache_key = self._get_cache_key("embedding", text)
            cached_embedding = await self._get_from_cache(cache_key)
            if cached_embedding:
                return cached_embedding
        
        try:
            # Call OpenAI API
            logger.debug(f"Generating embedding for text (length: {len(text)})")
            response = await self.client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=text,
                dimensions=settings.OPENAI_EMBEDDING_DIMENSIONS
            )
            
            # Extract embedding
            embedding = response.data[0].embedding
            
            # Track token usage
            await self._track_token_usage(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input_tokens=response.usage.total_tokens
            )
            
            # Cache the result (30 days TTL for embeddings)
            if use_cache:
                await self._set_cache(cache_key, embedding, ttl=30 * 24 * 60 * 60)
            
            logger.info(f"Successfully generated embedding ({len(embedding)} dimensions)")
            return embedding
            
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise
        except APIConnectionError as e:
            logger.error(f"OpenAI API connection error: {e}")
            raise
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error generating embedding: {e}")
            raise
    
    @retry(
        retry=retry_if_exception_type((RateLimitError, APIConnectionError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 1000,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Generate a text completion using GPT-4o.
        
        Args:
            prompt: User prompt/question
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0-2)
            system_prompt: Optional system prompt
            
        Returns:
            Generated text response
            
        Raises:
            OpenAIError: If API call fails after retries
        """
        try:
            # Build messages
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            logger.debug(f"Generating completion (max_tokens={max_tokens}, temp={temperature})")
            
            # Call OpenAI API
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_LLM_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            # Extract completion
            completion = response.choices[0].message.content.strip()
            
            # Track token usage
            await self._track_token_usage(
                model=settings.OPENAI_LLM_MODEL,
                input_tokens=response.usage.prompt_tokens,
                output_tokens=response.usage.completion_tokens
            )
            
            logger.info(
                f"Successfully generated completion "
                f"({len(completion)} chars, {response.usage.total_tokens} tokens)"
            )
            
            return completion
            
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise
        except APIConnectionError as e:
            logger.error(f"OpenAI API connection error: {e}")
            raise
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def generate_explanation(
        self,
        user_profile: Dict[str, Any],
        book: Dict[str, Any],
        context: Dict[str, Any]
    ) -> str:
        """
        Generate personalized book recommendation explanation using GPT-4o.
        
        Args:
            user_profile: User preferences and reading history
                Example: {
                    "favorite_genres": ["Sci-Fi", "Dystopia"],
                    "reading_level": "advanced",
                    "favorite_authors": ["George Orwell"]
                }
            book: Book metadata
                Example: {
                    "title": "Brave New World",
                    "author": "Aldous Huxley",
                    "genre": "Dystopia",
                    "description": "..."
                }
            context: Recommendation context
                Example: {
                    "match_score": 0.92,
                    "shared_themes": ["totalitarianism", "surveillance"],
                    "reason": "similar_to_favorites"
                }
                
        Returns:
            Personalized explanation text (2-3 sentences in Turkish)
            
        Raises:
            OpenAIError: If API call fails after retries
        """
        # Validate inputs
        if not book.get("title") or not book.get("author"):
            raise ValueError("Book must have title and author")
        
        # Build system prompt
        system_prompt = """You are the BiblioMind AI assistant. You make book recommendations to users.
Your task is to explain, briefly, clearly, and empathetically, why a book is being recommended.
Explanations should be 2-3 sentences, warm, and personalized.
You must write in English."""

        # Build user prompt with context
        user_genres = ", ".join(user_profile.get("favorite_genres", ["various"]))
        match_score_percent = int(context.get("match_score", 0) * 100)

        user_prompt = f"""User profile:
- Favorite genres: {user_genres}
- Reading level: {user_profile.get("reading_level", "intermediate")}

Recommended book:
- Title: {book.get("title")}
- Author: {book.get("author")}
- Genre: {book.get("genre", "General")}
- Match score: {match_score_percent}%

Explain to the user why you're recommending this book. Keep it short and friendly."""
        
        try:
            # Call OpenAI API
            logger.debug(f"Generating explanation for book: {book.get('title')}")
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=settings.OPENAI_MAX_TOKENS,
                temperature=settings.OPENAI_TEMPERATURE
            )
            
            # Extract explanation
            explanation = response.choices[0].message.content.strip()
            
            # Track token usage
            await self._track_token_usage(
                model=settings.OPENAI_LLM_MODEL,
                input_tokens=response.usage.prompt_tokens,
                output_tokens=response.usage.completion_tokens
            )
            
            logger.info(
                f"Successfully generated explanation "
                f"({len(explanation)} chars, {response.usage.total_tokens} tokens)"
            )
            return explanation
            
        except RateLimitError as e:
            logger.error(f"OpenAI rate limit exceeded: {e}")
            raise
        except APIConnectionError as e:
            logger.error(f"OpenAI API connection error: {e}")
            raise
        except OpenAIError as e:
            logger.error(f"OpenAI API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error generating explanation: {e}")
            raise
    
    async def generate_batch_embeddings(
        self,
        texts: List[str],
        use_cache: bool = True
    ) -> List[List[float]]:
        """
        Generate embeddings for multiple texts (batch processing).
        
        Args:
            texts: List of texts to generate embeddings for
            use_cache: Whether to use cache (default: True)
            
        Returns:
            List of embedding vectors
            
        Note:
            This is a simple implementation that calls generate_embedding
            for each text. For better performance with large batches,
            consider using OpenAI's batch API.
        """
        embeddings = []
        for text in texts:
            try:
                embedding = await self.generate_embedding(text, use_cache)
                embeddings.append(embedding)
            except Exception as e:
                logger.error(f"Failed to generate embedding for text: {e}")
                # Append zero vector on error
                embeddings.append([0.0] * settings.OPENAI_EMBEDDING_DIMENSIONS)
        
        return embeddings
    
    async def close(self):
        """Close connections gracefully."""
        if self.redis_client:
            await self.redis_client.close()
            logger.info("Redis connection closed")
