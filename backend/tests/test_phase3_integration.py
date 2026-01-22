"""
Integration tests for Phase 3 features.

Tests social features, caching, rate limiting, and dataset import.
"""

import pytest
import asyncio
from uuid import UUID
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.user import User
from app.models.book import Book
from app.models.user_interaction import UserInteraction
from app.services.social_service import SocialService
from app.core.cache import cache_service


class TestSocialFeatures:
    """Test Book Buddy social matching features."""
    
    @pytest.fixture
    def db(self):
        """Database session fixture."""
        db = SessionLocal()
        yield db
        db.close()
    
    def test_calculate_user_similarity(self, db: Session):
        """Test user similarity calculation with preference vectors."""
        # Get two users with preference vectors
        users = db.query(User).filter(User.preferences_vector.isnot(None)).limit(2).all()
        
        if len(users) < 2:
            pytest.skip("Need at least 2 users with preference vectors")
        
        service = SocialService(db)
        similarity = service.calculate_user_similarity(users[0], users[1])
        
        assert isinstance(similarity, float)
        assert 0.0 <= similarity <= 1.0
        print(f"User similarity: {similarity:.3f}")
    
    def test_find_buddies_with_preferences(self, db: Session):
        """Test finding book buddies for user with preferences."""
        # Get user with preference vector
        user = db.query(User).filter(User.preferences_vector.isnot(None)).first()
        
        if not user:
            pytest.skip("Need user with preference vector")
        
        service = SocialService(db)
        buddies = service.find_book_buddies(
            user_id=user.id,
            limit=5,
            min_similarity=0.3
        )
        
        assert isinstance(buddies, list)
        print(f"Found {len(buddies)} buddies for user {user.email}")
        
        for buddy in buddies:
            assert "user_id" in buddy
            assert "compatibility_score" in buddy
            assert 0.0 <= buddy["compatibility_score"] <= 1.0
    
    def test_shared_interests_calculation(self, db: Session):
        """Test shared interests between users."""
        # Get two users
        users = db.query(User).limit(2).all()
        
        if len(users) < 2:
            pytest.skip("Need at least 2 users")
        
        service = SocialService(db)
        shared = service.get_shared_interests(
            user_id=users[0].id,
            buddy_id=users[1].id
        )
        
        assert "shared_books" in shared
        assert "shared_genres" in shared
        assert "shared_books_count" in shared
        assert "shared_genres_count" in shared
        
        print(f"Shared interests: {shared['shared_books_count']} books, {shared['shared_genres_count']} genres")
    
    def test_buddy_recommendations(self, db: Session):
        """Test getting recommendations from buddy."""
        # Get two users
        users = db.query(User).limit(2).all()
        
        if len(users) < 2:
            pytest.skip("Need at least 2 users")
        
        service = SocialService(db)
        recommendations = service.get_buddy_recommendations(
            user_id=users[0].id,
            buddy_id=users[1].id,
            limit=5
        )
        
        assert isinstance(recommendations, list)
        print(f"Buddy recommendations: {len(recommendations)} books")


class TestCaching:
    """Test Redis caching functionality."""
    
    def test_cache_basic_operations(self):
        """Test cache set, get, delete operations."""
        if not cache_service.enabled:
            pytest.skip("Redis cache not enabled")
        
        # Set value
        cache_service.set("test:key", {"data": "test_value"}, ttl=60)
        
        # Get value
        cached = cache_service.get("test:key")
        assert cached is not None
        assert cached["data"] == "test_value"
        
        # Delete value
        cache_service.delete("test:key")
        cached_after = cache_service.get("test:key")
        assert cached_after is None
        
        print("[OK] Cache basic operations working")
    
    def test_cache_ttl_expiration(self):
        """Test cache TTL expiration."""
        if not cache_service.enabled:
            pytest.skip("Redis cache not enabled")
        
        import time
        
        # Set with short TTL
        cache_service.set("test:ttl", {"data": "expires_soon"}, ttl=2)
        
        # Should exist immediately
        cached = cache_service.get("test:ttl")
        assert cached is not None
        
        # Wait for expiration
        time.sleep(3)
        
        # Should be expired
        cached_after = cache_service.get("test:ttl")
        assert cached_after is None
        
        print("[OK] Cache TTL expiration working")
    
    def test_cache_pattern_deletion(self):
        """Test deleting cache keys by pattern."""
        if not cache_service.enabled:
            pytest.skip("Redis cache not enabled")
        
        # Set multiple keys
        cache_service.set("test:books:1", {"id": 1}, ttl=60)
        cache_service.set("test:books:2", {"id": 2}, ttl=60)
        cache_service.set("test:other:1", {"id": 3}, ttl=60)
        
        # Delete pattern
        cache_service.delete_pattern("test:books:*")
        
        # Check deletion
        assert cache_service.get("test:books:1") is None
        assert cache_service.get("test:books:2") is None
        assert cache_service.get("test:other:1") is not None  # Not deleted
        
        # Cleanup
        cache_service.delete("test:other:1")
        
        print("[OK] Cache pattern deletion working")


class TestDatasetImport:
    """Test dataset import functionality."""
    
    @pytest.fixture
    def db(self):
        """Database session fixture."""
        db = SessionLocal()
        yield db
        db.close()
    
    def test_books_count(self, db: Session):
        """Test that books are imported."""
        book_count = db.query(Book).count()
        
        assert book_count >= 20, f"Expected at least 20 books, found {book_count}"
        print(f"[OK] Found {book_count} books in database")
    
    def test_books_have_embeddings(self, db: Session):
        """Test that books have embeddings generated."""
        books_with_embeddings = db.query(Book).filter(Book.embedding.isnot(None)).count()
        total_books = db.query(Book).count()
        
        coverage = (books_with_embeddings / total_books * 100) if total_books > 0 else 0
        
        assert books_with_embeddings > 0, "No books have embeddings"
        print(f"[OK] {books_with_embeddings}/{total_books} books have embeddings ({coverage:.1f}%)")
    
    def test_books_have_valid_data(self, db: Session):
        """Test that imported books have valid data."""
        books = db.query(Book).limit(10).all()
        
        for book in books:
            assert book.title, f"Book {book.id} missing title"
            assert book.author, f"Book {book.id} missing author"
            assert book.genres and len(book.genres) > 0, f"Book {book.id} missing genres"
            assert book.stock > 0, f"Book {book.id} has no stock"
            assert book.price > 0, f"Book {book.id} has invalid price"
        
        print(f"[OK] Validated {len(books)} books have required fields")


class TestPerformance:
    """Test system performance metrics."""
    
    @pytest.fixture
    def db(self):
        """Database session fixture."""
        db = SessionLocal()
        yield db
        db.close()
    
    def test_book_query_performance(self, db: Session):
        """Test book query performance."""
        import time
        
        start = time.time()
        books = db.query(Book).limit(20).all()
        duration = (time.time() - start) * 1000  # ms
        
        assert duration < 100, f"Book query too slow: {duration:.2f}ms"
        print(f"[OK] Book query: {duration:.2f}ms (< 100ms target)")
    
    def test_social_matching_performance(self, db: Session):
        """Test social matching performance."""
        import time
        
        user = db.query(User).filter(User.preferences_vector.isnot(None)).first()
        if not user:
            pytest.skip("Need user with preference vector")
        
        service = SocialService(db)
        
        start = time.time()
        buddies = service.find_book_buddies(user.id, limit=10)
        duration = (time.time() - start) * 1000  # ms
        
        assert duration < 1000, f"Social matching too slow: {duration:.2f}ms"
        print(f"[OK] Social matching: {duration:.2f}ms (< 1000ms target)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
