"""
Test script for Bookshelf Matching Feature.

Tests the complete flow:
1. Upload bookshelf image
2. Detect and clean books with AI
3. Match books to user profile
4. Get personalized recommendations

Usage:
    cd backend
    python -m scripts.test_shelf_matching --image path/to/bookshelf.jpg
"""

import asyncio
import sys
import json
from pathlib import Path
import argparse

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.vision_service import VisionService
from app.services.openai_service import OpenAIService
from app.services.user_service import UserService
from app.core.database import SessionLocal
from app.core.config import settings


async def test_shelf_matching(image_path: Path):
    """Test complete shelf matching flow."""
    
    print("\n" + "=" * 70)
    print("BOOKSHELF MATCHING TEST")
    print("=" * 70)
    print(f"Image: {image_path}")
    print(f"Environment: {settings.ENVIRONMENT}")
    print("=" * 70)
    
    if not image_path.exists():
        print(f"❌ Image not found: {image_path}")
        return
    
    # Read image
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    print(f"\n📸 Image loaded: {len(image_bytes)} bytes")
    
    # Initialize services
    print("\n🔧 Initializing services...")
    vision_service = VisionService()
    openai_service = OpenAIService()
    db = SessionLocal()
    
    try:
        # Step 1: Detect and clean books
        print("\n" + "=" * 70)
        print("STEP 1: OCR + AI Book Detection")
        print("=" * 70)
        
        detected_books = await vision_service.detect_and_clean_books(
            image_bytes,
            openai_service
        )
        
        if not detected_books:
            print("❌ No books detected!")
            return
        
        print(f"✅ Detected {len(detected_books)} books:")
        print("-" * 70)
        for i, book in enumerate(detected_books[:10], 1):
            print(f"{i:2d}. {book['title']:40s} by {book.get('author', 'Unknown'):20s}")
            print(f"    Confidence: {book['confidence']:.2f} | Genres: {', '.join(book.get('genres', []))}")
        if len(detected_books) > 10:
            print(f"    ... and {len(detected_books) - 10} more")
        print("-" * 70)
        
        # Step 2: Create mock user profile (for testing without real user)
        print("\n" + "=" * 70)
        print("STEP 2: User Profile (Mock)")
        print("=" * 70)
        
        # Mock profile for testing
        mock_profile = {
            "favorite_genres": ["Distopya", "Politik", "Bilim Kurgu"],
            "favorite_authors": ["George Orwell", "Isaac Asimov"],
            "themes": ["özgürlük", "teknoloji", "toplum eleştirisi"],
            "style_preferences": ["karanlık", "düşündürücü"],
            "reading_level": "advanced",
            "has_history": True
        }
        
        print("📚 Mock User Profile:")
        print(json.dumps(mock_profile, indent=2, ensure_ascii=False))
        
        # Step 3: Match books to profile
        print("\n" + "=" * 70)
        print("STEP 3: AI-Powered Matching")
        print("=" * 70)
        
        matching_result = await vision_service.match_books_to_user_profile(
            detected_books,
            mock_profile,
            db,
            openai_service,
            limit=5
        )
        
        recommendations = matching_result['recommendations']
        shelf_analysis = matching_result['shelf_analysis']
        
        # Display recommendations
        print(f"\n📖 Top {len(recommendations)} Recommendations:")
        print("-" * 70)
        for i, rec in enumerate(recommendations, 1):
            print(f"\n{i}. {rec['title']} by {rec['author']}")
            print(f"   Match Score: {rec['match_score']:.2%}")
            print(f"   Reason: {rec['reason']}")
            if rec.get('in_our_store'):
                print(f"   💰 In Store: Yes (${rec.get('price', 0):.2f})")
            else:
                print(f"   💰 In Store: No")
        print("-" * 70)
        
        # Display shelf analysis
        print("\n" + "=" * 70)
        print("STEP 4: Shelf Analysis")
        print("=" * 70)
        print(f"\n📊 Shelf Characteristics:")
        print(f"   Dominant Genres: {', '.join(shelf_analysis.get('dominant_genres', []))}")
        print(f"   Reading Style: {shelf_analysis.get('reading_style', 'N/A')}")
        print(f"   User Compatibility: {shelf_analysis.get('user_compatibility', 0):.2%}")
        
        # Summary
        print("\n" + "=" * 70)
        print("TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Books Detected: {len(detected_books)}")
        print(f"✅ Recommendations Generated: {len(recommendations)}")
        print(f"✅ Books in Our Store: {sum(1 for r in recommendations if r.get('in_our_store'))}")
        print(f"✅ Average Match Score: {sum(r['match_score'] for r in recommendations) / len(recommendations):.2%}")
        print("=" * 70)
        
        print("\n🎉 Test completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


async def main():
    """Run test."""
    parser = argparse.ArgumentParser(description='Test Shelf Matching')
    parser.add_argument(
        '--image',
        type=str,
        help='Path to bookshelf image',
        default=None
    )
    args = parser.parse_args()
    
    # Determine image path
    if args.image:
        image_path = Path(args.image)
    else:
        # Try default test image
        image_path = backend_dir / "tests" / "fixtures" / "test_images" / "bookshelf.jpeg"
    
    await test_shelf_matching(image_path)


if __name__ == "__main__":
    asyncio.run(main())
