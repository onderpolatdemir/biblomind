"""Unit tests for OpenAI service."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.openai_service import OpenAIService


@pytest.fixture
def openai_service():
    """Create OpenAI service instance for testing."""
    with patch('app.services.openai_service.redis.from_url') as mock_redis:
        # Mock Redis client
        mock_redis.return_value = AsyncMock()
        service = OpenAIService()
        return service


@pytest.mark.asyncio
async def test_generate_embedding_success(openai_service):
    """Test successful embedding generation."""
    # Mock OpenAI API response
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
    mock_response.usage = MagicMock(total_tokens=10)
    
    with patch.object(openai_service.client.embeddings, 'create', return_value=mock_response):
        # Test embedding generation
        embedding = await openai_service.generate_embedding(
            text="Test text",
            use_cache=False  # Disable cache for testing
        )
        
        # Assertions
        assert embedding is not None
        assert len(embedding) == 1536
        assert all(isinstance(x, float) for x in embedding)


@pytest.mark.asyncio
async def test_generate_embedding_cache_hit(openai_service):
    """Test embedding cache hit scenario."""
    # Mock cached embedding
    cached_embedding = [0.2] * 1536
    
    with patch.object(openai_service, '_get_from_cache', return_value=cached_embedding):
        # Test cache hit
        embedding = await openai_service.generate_embedding(
            text="Cached text",
            use_cache=True
        )
        
        # Should return cached value
        assert embedding == cached_embedding


@pytest.mark.asyncio
async def test_generate_embedding_empty_text(openai_service):
    """Test embedding generation with empty text."""
    with pytest.raises(ValueError, match="Text cannot be empty"):
        await openai_service.generate_embedding("")


@pytest.mark.asyncio
async def test_generate_explanation_success(openai_service):
    """Test successful explanation generation."""
    # Mock OpenAI API response
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content="Bu kitabı sana öneriyorum çünkü..."))
    ]
    mock_response.usage = MagicMock(
        prompt_tokens=100,
        completion_tokens=50,
        total_tokens=150
    )
    
    with patch.object(openai_service.client.chat.completions, 'create', return_value=mock_response):
        # Test explanation generation
        explanation = await openai_service.generate_explanation(
            user_profile={
                "favorite_genres": ["Sci-Fi"],
                "reading_level": "advanced"
            },
            book={
                "title": "1984",
                "author": "George Orwell",
                "genre": "Dystopia"
            },
            context={
                "match_score": 0.92,
                "shared_themes": ["totalitarianism"]
            }
        )
        
        # Assertions
        assert explanation is not None
        assert isinstance(explanation, str)
        assert len(explanation) > 0


@pytest.mark.asyncio
async def test_generate_explanation_missing_book_info(openai_service):
    """Test explanation generation with missing book info."""
    with pytest.raises(ValueError, match="Book must have title and author"):
        await openai_service.generate_explanation(
            user_profile={},
            book={},  # Missing title and author
            context={}
        )


@pytest.mark.asyncio
async def test_batch_embeddings(openai_service):
    """Test batch embedding generation."""
    # Mock embedding response
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
    mock_response.usage = MagicMock(total_tokens=10)
    
    with patch.object(openai_service.client.embeddings, 'create', return_value=mock_response):
        texts = ["Text 1", "Text 2", "Text 3"]
        embeddings = await openai_service.generate_batch_embeddings(texts, use_cache=False)
        
        # Assertions
        assert len(embeddings) == 3
        assert all(len(emb) == 1536 for emb in embeddings)


@pytest.mark.asyncio
async def test_cache_key_generation():
    """Test cache key generation is consistent."""
    key1 = OpenAIService._get_cache_key("test", "same content")
    key2 = OpenAIService._get_cache_key("test", "same content")
    key3 = OpenAIService._get_cache_key("test", "different content")
    
    # Same content should generate same key
    assert key1 == key2
    # Different content should generate different key
    assert key1 != key3


def test_openai_service_init():
    """Test OpenAI service initialization."""
    with patch('app.services.openai_service.redis.from_url') as mock_redis:
        mock_redis.return_value = AsyncMock()
        service = OpenAIService()
        
        assert service.client is not None
        assert service.redis_client is not None


@pytest.mark.asyncio
async def test_redis_failure_graceful_degradation(openai_service):
    """Test that service works even if Redis fails."""
    # Simulate Redis failure
    openai_service.redis_client = None
    
    # Mock OpenAI response
    mock_response = MagicMock()
    mock_response.data = [MagicMock(embedding=[0.1] * 1536)]
    mock_response.usage = MagicMock(total_tokens=10)
    
    with patch.object(openai_service.client.embeddings, 'create', return_value=mock_response):
        # Should still work without cache
        embedding = await openai_service.generate_embedding("test", use_cache=True)
        assert embedding is not None
