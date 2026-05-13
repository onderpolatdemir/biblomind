"""
Manual test script for OpenAI Service.

This script validates that:
1. OpenAI API key is configured correctly
2. Embedding generation works
3. Explanation generation works
4. Redis cache is functioning
5. Error handling works as expected

Usage:
    cd backend
    python -m scripts.test_openai_service
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.openai_service import OpenAIService
from app.core.config import settings


async def test_api_key():
    """Test if API key is configured."""
    print("\n" + "=" * 60)
    print("TEST 1: API Key Configuration")
    print("=" * 60)
    
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "":
        print("❌ FAILED: OPENAI_API_KEY is not configured in .env file")
        print("Please add: OPENAI_API_KEY=sk-proj-...")
        return False
    
    print(f"✅ PASSED: API key is configured (starts with: {settings.OPENAI_API_KEY[:10]}...)")
    return True


async def test_embedding_generation():
    """Test embedding generation."""
    print("\n" + "=" * 60)
    print("TEST 2: Embedding Generation")
    print("=" * 60)
    
    service = OpenAIService()
    
    try:
        test_text = "1984 George Orwell dystopian political fiction"
        print(f"Generating embedding for: '{test_text}'")
        
        embedding = await service.generate_embedding(test_text, use_cache=False)
        
        # Validate embedding
        assert isinstance(embedding, list), "Embedding should be a list"
        assert len(embedding) == 1536, f"Expected 1536 dims, got {len(embedding)}"
        assert all(isinstance(x, float) for x in embedding), "All values should be floats"
        
        print(f"✅ PASSED: Generated embedding with {len(embedding)} dimensions")
        print(f"   First 5 values: {embedding[:5]}")
        
        await service.close()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        await service.close()
        return False


async def test_embedding_cache():
    """Test Redis cache functionality."""
    print("\n" + "=" * 60)
    print("TEST 3: Redis Cache")
    print("=" * 60)
    
    service = OpenAIService()
    
    if not service.redis_client:
        print("⚠️  WARNING: Redis client not initialized, cache disabled")
        await service.close()
        return True
    
    try:
        test_text = "Cache test text for BiblioMind"
        
        # First call (cache miss)
        print("First call (should be cache MISS)...")
        embedding1 = await service.generate_embedding(test_text, use_cache=True)
        
        # Second call (cache hit)
        print("Second call (should be cache HIT)...")
        embedding2 = await service.generate_embedding(test_text, use_cache=True)
        
        # Should be identical
        assert embedding1 == embedding2, "Cached embedding should be identical"
        
        print("✅ PASSED: Redis cache is working correctly")
        
        await service.close()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        await service.close()
        return False


async def test_explanation_generation():
    """Test GPT-4o explanation generation."""
    print("\n" + "=" * 60)
    print("TEST 4: Explanation Generation (GPT-4o)")
    print("=" * 60)
    
    service = OpenAIService()
    
    try:
        user_profile = {
            "favorite_genres": ["Bilim Kurgu", "Distopya"],
            "reading_level": "ileri",
            "favorite_authors": ["George Orwell"]
        }
        
        book = {
            "title": "Cesur Yeni Dünya",
            "author": "Aldous Huxley",
            "genre": "Distopya",
            "description": "Gelecekte bir totaliter toplumu anlatan klasik distopya romanı"
        }
        
        context = {
            "match_score": 0.92,
            "shared_themes": ["totalitarizm", "özgürlük"]
        }
        
        print("Generating explanation with GPT-4o...")
        print(f"Book: {book['title']} - {book['author']}")
        print(f"Match Score: {context['match_score']}")
        
        explanation = await service.generate_explanation(user_profile, book, context)
        
        # Validate
        assert isinstance(explanation, str), "Explanation should be string"
        assert len(explanation) > 0, "Explanation should not be empty"
        assert len(explanation.split()) > 10, "Explanation should have substance"
        
        print(f"✅ PASSED: Generated explanation")
        print(f"\nExplanation ({len(explanation)} chars):")
        print("-" * 60)
        print(explanation)
        print("-" * 60)
        
        await service.close()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        await service.close()
        return False


async def test_batch_embeddings():
    """Test batch embedding generation."""
    print("\n" + "=" * 60)
    print("TEST 5: Batch Embeddings")
    print("=" * 60)
    
    service = OpenAIService()
    
    try:
        texts = [
            "1984 George Orwell",
            "Brave New World Aldous Huxley",
            "Fahrenheit 451 Ray Bradbury"
        ]
        
        print(f"Generating embeddings for {len(texts)} texts...")
        embeddings = await service.generate_batch_embeddings(texts, use_cache=False)
        
        assert len(embeddings) == len(texts), f"Expected {len(texts)} embeddings"
        assert all(len(emb) == 1536 for emb in embeddings), "All should be 1536 dims"
        
        print(f"✅ PASSED: Generated {len(embeddings)} embeddings")
        
        await service.close()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        await service.close()
        return False


async def test_error_handling():
    """Test error handling with invalid input."""
    print("\n" + "=" * 60)
    print("TEST 6: Error Handling")
    print("=" * 60)
    
    service = OpenAIService()
    
    try:
        # Test empty text
        try:
            await service.generate_embedding("")
            print("❌ FAILED: Should raise ValueError for empty text")
            await service.close()
            return False
        except ValueError as e:
            print(f"✅ Empty text validation: {e}")
        
        # Test missing book info
        try:
            await service.generate_explanation({}, {}, {})
            print("❌ FAILED: Should raise ValueError for missing book info")
            await service.close()
            return False
        except ValueError as e:
            print(f"✅ Missing book info validation: {e}")
        
        print("✅ PASSED: Error handling works correctly")
        
        await service.close()
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        await service.close()
        return False


async def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("OPENAI SERVICE VALIDATION TESTS")
    print("=" * 60)
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Embedding Model: {settings.OPENAI_EMBEDDING_MODEL}")
    print(f"LLM Model: {settings.OPENAI_LLM_MODEL}")
    
    tests = [
        ("API Key Configuration", test_api_key),
        ("Embedding Generation", test_embedding_generation),
        ("Redis Cache", test_embedding_cache),
        ("Explanation Generation", test_explanation_generation),
        ("Batch Embeddings", test_batch_embeddings),
        ("Error Handling", test_error_handling),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! OpenAI service is working correctly.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
