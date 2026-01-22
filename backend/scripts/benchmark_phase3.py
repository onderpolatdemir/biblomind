#!/usr/bin/env python3
"""
Performance benchmark for Phase 3 features.

Measures response times for critical operations.
"""

import sys
import time
import asyncio
from pathlib import Path
from statistics import mean, median

backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.user import User
from app.models.book import Book
from app.services.social_service import SocialService
from app.services.recommendation_service import RecommendationService
from app.core.cache import cache_service


def benchmark(func, name: str, iterations: int = 10):
    """Run benchmark and print results."""
    times = []
    
    for i in range(iterations):
        start = time.time()
        result = func()
        duration = (time.time() - start) * 1000  # ms
        times.append(duration)
        
        if (i + 1) % 5 == 0:
            print(f"  {i+1}/{iterations}... avg: {mean(times):.2f}ms")
    
    avg_time = mean(times)
    median_time = median(times)
    min_time = min(times)
    max_time = max(times)
    
    print(f"\n{name}:")
    print(f"  Average: {avg_time:.2f}ms")
    print(f"  Median:  {median_time:.2f}ms")
    print(f"  Min:     {min_time:.2f}ms")
    print(f"  Max:     {max_time:.2f}ms")
    print()
    
    return avg_time


def main():
    print("=" * 70)
    print("PHASE 3 PERFORMANCE BENCHMARK")
    print("=" * 70)
    print()
    
    db = SessionLocal()
    
    try:
        # 1. Book List Query
        print("1. Book List Query (without cache)")
        def query_books():
            return db.query(Book).limit(20).all()
        
        book_query_time = benchmark(query_books, "Book List (20 items)", iterations=10)
        
        # 2. Book List Query (with cache)
        if cache_service.enabled:
            print("2. Book List Query (with cache)")
            cache_service.set("benchmark:books", ["cached"], ttl=60)
            
            def query_books_cached():
                return cache_service.get("benchmark:books")
            
            cached_query_time = benchmark(query_books_cached, "Book List (cached)", iterations=10)
            speedup = book_query_time / cached_query_time
            print(f"  Cache speedup: {speedup:.1f}x faster\n")
        
        # 3. Social Matching
        print("3. Social Matching (Book Buddy)")
        user = db.query(User).filter(User.preferences_vector.isnot(None)).first()
        
        if user:
            def find_buddies():
                service = SocialService(db)
                return service.find_book_buddies(user.id, limit=10)
            
            social_time = benchmark(find_buddies, "Find Book Buddies", iterations=5)
        else:
            print("  [SKIP] No user with preference vector\n")
        
        # 4. Recommendations
        print("4. Personalized Recommendations")
        if user:
            async def get_recs():
                service = RecommendationService(db)
                return await service.generate_recommendations(
                    user_id=user.id,
                    limit=5,
                    strategy="hybrid"
                )
            
            def run_recs():
                return asyncio.run(get_recs())
            
            rec_time = benchmark(run_recs, "Hybrid Recommendations", iterations=5)
        else:
            print("  [SKIP] No user for testing\n")
        
        # Summary
        print("=" * 70)
        print("BENCHMARK SUMMARY")
        print("=" * 70)
        print()
        print("Performance Targets:")
        print(f"  Book list (uncached):  < 100ms  {'✓' if book_query_time < 100 else '✗'} ({book_query_time:.2f}ms)")
        
        if cache_service.enabled:
            print(f"  Book list (cached):    < 50ms   {'✓' if cached_query_time < 50 else '✗'} ({cached_query_time:.2f}ms)")
        
        if user:
            print(f"  Social matching:       < 500ms  {'✓' if social_time < 500 else '✗'} ({social_time:.2f}ms)")
            print(f"  Recommendations:       < 500ms  {'✓' if rec_time < 500 else '✗'} ({rec_time:.2f}ms)")
        
        print()
        print("=" * 70)
        
    except Exception as e:
        print(f"\n[ERROR] Benchmark failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup cache
        if cache_service.enabled:
            cache_service.delete("benchmark:books")
        
        db.close()


if __name__ == "__main__":
    main()
