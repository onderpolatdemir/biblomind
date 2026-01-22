"""
Manual test script for recommendation system.

This script tests the recommendation engine with various scenarios:
1. User with interactions -> Personalized recommendations
2. New user (no interactions) -> Popular books fallback
3. Similar books query
4. Preference vector update

Usage:
    python -m scripts.test_recommendations
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models.user import User
from app.models.book import Book
from app.models.user_interaction import UserInteraction
from app.services.recommendation_service import RecommendationService
from app.services.openai_service import OpenAIService
import json


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70 + "\n")


async def test_recommendations_for_user(db: Session, user_id: str):
    """
    Test recommendation generation for a user.
    
    Args:
        db: Database session
        user_id: User UUID as string
    """
    print_section("TEST 1: Personalized Recommendations (Hybrid)")
    
    try:
        rec_service = RecommendationService(db)
        
        # Get user info
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"❌ User {user_id} not found!")
            return
        
        print(f"Testing recommendations for: {user.email}")
        print(f"Has preference vector: {user.preferences_vector is not None}")
        
        # Get user's interactions
        interaction_count = db.query(UserInteraction).filter(
            UserInteraction.user_id == user_id
        ).count()
        print(f"Total interactions: {interaction_count}")
        
        # Test different strategies
        strategies = ["hybrid", "content", "popular"]
        
        for strategy in strategies:
            print(f"\n--- Strategy: {strategy} ---")
            
            result = await rec_service.generate_recommendations(
                user_id=user_id,
                limit=5,
                strategy=strategy,
                exclude_owned=True
            )
            
            print(f"✅ Generated {result['total']} recommendations")
            print(f"Strategy used: {result['strategy']}")
            print(f"User has history: {result['user_has_history']}")
            
            if result.get('message'):
                print(f"Message: {result['message']}")
            
            # Show top 3 recommendations
            for i, rec in enumerate(result['recommendations'][:3], 1):
                book = rec['book']
                print(f"\n{i}. {book['title']} by {book['author']}")
                print(f"   Score: {rec['score']:.3f}")
                print(f"   Reasons: {', '.join(rec['match_reasons'])}")
                if rec.get('explanation'):
                    print(f"   Explanation: {rec['explanation'][:100]}...")
                if rec.get('_debug'):
                    debug = rec['_debug']
                    print(f"   Debug: content={debug['content_score']:.3f}, "
                          f"popularity={debug['popularity_score']:.3f}, "
                          f"recency={debug['recency_score']:.3f}")
        
        await rec_service.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


async def test_similar_books(db: Session):
    """
    Test similar books query.
    
    Args:
        db: Database session
    """
    print_section("TEST 2: Similar Books")
    
    try:
        # Get a random book with embedding
        book = db.query(Book).filter(
            Book.embedding.isnot(None)
        ).first()
        
        if not book:
            print("❌ No books with embeddings found!")
            return
        
        print(f"Finding books similar to: {book.title} by {book.author}")
        
        rec_service = RecommendationService(db)
        
        result = await rec_service.get_similar_books(
            book_id=book.id,
            limit=5
        )
        
        print(f"\n✅ Found {result['total']} similar books:")
        
        for i, similar in enumerate(result['similar_books'], 1):
            print(f"\n{i}. {similar['title']} by {similar['author']}")
            print(f"   Similarity: {similar['similarity_score']:.3f}")
            print(f"   Genres: {', '.join(similar['genres'])}")
            print(f"   Price: ${similar['price']:.2f}" if similar['price'] else "   Price: N/A")
        
        await rec_service.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


async def test_preference_vector_update(db: Session, user_id: str):
    """
    Test preference vector update.
    
    Args:
        db: Database session
        user_id: User UUID as string
    """
    print_section("TEST 3: Preference Vector Update")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"❌ User {user_id} not found!")
            return
        
        print(f"Updating preference vector for: {user.email}")
        print(f"Current vector exists: {user.preferences_vector is not None}")
        
        rec_service = RecommendationService(db)
        
        result = await rec_service.update_user_preference_vector(user_id)
        
        print(f"\n✅ Update completed!")
        print(f"Vector updated: {result['vector_updated']}")
        print(f"Interactions processed: {result['interactions_processed']}")
        print(f"Message: {result['message']}")
        
        # Verify update
        db.refresh(user)
        print(f"\nVector now exists: {user.preferences_vector is not None}")
        if user.preferences_vector is not None:
            print(f"Vector dimensions: {len(user.preferences_vector)}")
        
        await rec_service.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


async def test_new_user_fallback(db: Session):
    """
    Test recommendations for a user with no interactions.
    
    Args:
        db: Database session
    """
    print_section("TEST 4: New User Fallback (Popular Books)")
    
    try:
        # Find a user with no interactions
        users = db.query(User).all()
        new_user = None
        
        for user in users:
            interaction_count = db.query(UserInteraction).filter(
                UserInteraction.user_id == user.id
            ).count()
            if interaction_count == 0:
                new_user = user
                break
        
        if not new_user:
            print("⚠️ No users without interactions found. Skipping test.")
            return
        
        print(f"Testing fallback for new user: {new_user.email}")
        
        rec_service = RecommendationService(db)
        
        result = await rec_service.generate_recommendations(
            user_id=new_user.id,
            limit=5,
            strategy="hybrid",
            exclude_owned=False
        )
        
        print(f"\n✅ Generated {result['total']} recommendations")
        print(f"Strategy used: {result['strategy']}")
        print(f"User has history: {result['user_has_history']}")
        
        if result.get('message'):
            print(f"Message: {result['message']}")
        
        # Show recommendations
        for i, rec in enumerate(result['recommendations'][:3], 1):
            book = rec['book']
            print(f"\n{i}. {book['title']} by {book['author']}")
            print(f"   Explanation: {rec['explanation'][:80]}...")
        
        await rec_service.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


async def test_performance(db: Session, user_id: str):
    """
    Test recommendation performance.
    
    Args:
        db: Database session
        user_id: User UUID as string
    """
    print_section("TEST 5: Performance Benchmark")
    
    try:
        import time
        
        rec_service = RecommendationService(db)
        
        # Test 1: Cold start (no cache)
        start = time.time()
        result1 = await rec_service.generate_recommendations(
            user_id=user_id,
            limit=10,
            strategy="hybrid"
        )
        duration1 = (time.time() - start) * 1000
        
        # Test 2: Warm start (with cache)
        start = time.time()
        result2 = await rec_service.generate_recommendations(
            user_id=user_id,
            limit=10,
            strategy="hybrid"
        )
        duration2 = (time.time() - start) * 1000
        
        print(f"Cold start: {duration1:.0f}ms ({result1['total']} recommendations)")
        print(f"Warm start: {duration2:.0f}ms ({result2['total']} recommendations)")
        print(f"Speedup: {duration1/duration2:.1f}x")
        
        # Target: < 500ms
        if duration2 < 500:
            print(f"\n✅ Performance target met! ({duration2:.0f}ms < 500ms)")
        else:
            print(f"\n⚠️ Performance target missed! ({duration2:.0f}ms > 500ms)")
        
        await rec_service.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()


async def main():
    """Main test runner."""
    print("\n" + "=" * 70)
    print("  🧪 RECOMMENDATION ENGINE TEST SUITE")
    print("=" * 70)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Get a test user with interactions
        user_with_interactions = db.query(User).join(
            UserInteraction, User.id == UserInteraction.user_id
        ).first()
        
        if not user_with_interactions:
            print("\n❌ No users with interactions found!")
            print("Please run seed_books.py first and create some test interactions.")
            return
        
        test_user_id = str(user_with_interactions.id)
        
        # Run all tests
        await test_recommendations_for_user(db, test_user_id)
        await test_similar_books(db)
        await test_preference_vector_update(db, test_user_id)
        await test_new_user_fallback(db)
        await test_performance(db, test_user_id)
        
        print_section("✅ ALL TESTS COMPLETED")
        
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
