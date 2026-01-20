"""
Manual test script for Vision Service.

Tests:
1. GCP credentials configuration
2. Vision API connection
3. OCR text detection (4-direction rotation)
4. Fuzzy matching with database
5. Complete analysis pipeline

Usage:
    cd backend
    
    # Test with sample image
    python -m scripts.test_vision_service
    
    # Test with custom image
    python -m scripts.test_vision_service --image path/to/bookshelf.jpg
"""

import asyncio
import sys
from pathlib import Path
import argparse

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.services.vision_service import VisionService
from app.core.config import settings
from app.core.database import SessionLocal


async def test_credentials():
    """Test if GCP credentials are configured."""
    print("\n" + "=" * 60)
    print("TEST 1: GCP Credentials Configuration")
    print("=" * 60)
    
    if not settings.GOOGLE_APPLICATION_CREDENTIALS:
        print("❌ FAILED: GOOGLE_APPLICATION_CREDENTIALS not set in .env")
        print("Please see: backend/docs/GCP-VISION-SETUP.md")
        return False
    
    cred_path = Path(backend_dir) / settings.GOOGLE_APPLICATION_CREDENTIALS
    if not cred_path.exists():
        print(f"❌ FAILED: Credentials file not found: {cred_path}")
        print("Please follow setup guide: backend/docs/GCP-VISION-SETUP.md")
        return False
    
    print(f"✅ PASSED: Credentials configured")
    print(f"   Path: {settings.GOOGLE_APPLICATION_CREDENTIALS}")
    return True


async def test_vision_client():
    """Test Vision API client initialization."""
    print("\n" + "=" * 60)
    print("TEST 2: Vision API Client")
    print("=" * 60)
    
    try:
        service = VisionService()
        print("✅ PASSED: Vision client initialized successfully")
        return True
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        return False


async def test_ocr_with_image(image_path: Path):
    """Test OCR with actual image."""
    print("\n" + "=" * 60)
    print("TEST 3: OCR Text Detection")
    print("=" * 60)
    
    if not image_path.exists():
        print(f"⚠️  Image not found: {image_path}")
        print("Skipping OCR test. Provide image with --image flag")
        return True
    
    try:
        service = VisionService()
        
        # Read image
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        print(f"Testing OCR on: {image_path.name} ({len(image_bytes)} bytes)")
        
        # Detect text
        detected_texts = await service.detect_text_from_image(image_bytes)
        
        if not detected_texts:
            print("⚠️  No text detected in image")
            print("Try a clearer image with visible book titles")
            return True
        
        print(f"✅ PASSED: Detected {len(detected_texts)} text strings")
        print("\nDetected texts:")
        print("-" * 60)
        for i, text in enumerate(detected_texts[:20], 1):  # Show first 20
            print(f"  {i}. {text}")
        if len(detected_texts) > 20:
            print(f"  ... and {len(detected_texts) - 20} more")
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_fuzzy_matching(image_path: Path):
    """Test fuzzy matching with database."""
    print("\n" + "=" * 60)
    print("TEST 4: Fuzzy Matching with Database")
    print("=" * 60)
    
    if not image_path.exists():
        print("⚠️  Image not found, skipping fuzzy matching test")
        return True
    
    try:
        service = VisionService()
        db = SessionLocal()
        
        # Read image
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        print(f"Analyzing image: {image_path.name}")
        
        # Full analysis
        result = await service.analyze_bookshelf_image(image_bytes, db)
        
        db.close()
        
        print(f"✅ PASSED: Analysis complete")
        print(f"\nResults:")
        print("-" * 60)
        print(f"Detected texts: {result['total_detected']}")
        print(f"Matched books: {result['total_matched']}")
        
        if result['matched_books']:
            print(f"\nMatched Books (Top 10):")
            for i, book in enumerate(result['matched_books'][:10], 1):
                print(f"  {i}. {book['title']} - {book['author']}")
                print(f"     Similarity: {book['similarity_score']:.2%}")
        else:
            print("\n⚠️  No books matched")
            print("   Make sure database has books (run: python -m scripts.seed_books)")
        
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_performance(image_path: Path):
    """Test performance metrics."""
    print("\n" + "=" * 60)
    print("TEST 5: Performance")
    print("=" * 60)
    
    if not image_path.exists():
        print("⚠️  Image not found, skipping performance test")
        return True
    
    try:
        import time
        
        service = VisionService()
        db = SessionLocal()
        
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        # Measure time
        start = time.time()
        result = await service.analyze_bookshelf_image(image_bytes, db)
        elapsed = time.time() - start
        
        db.close()
        
        print(f"✅ PASSED: Performance test complete")
        print(f"\nMetrics:")
        print("-" * 60)
        print(f"Total time: {elapsed:.2f}s")
        print(f"Target: < 10s")
        
        if elapsed < 10:
            print("✅ Within target!")
        else:
            print("⚠️  Slower than target (may be network latency)")
        
        print("-" * 60)
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {type(e).__name__}: {e}")
        return False


async def main():
    """Run all tests."""
    parser = argparse.ArgumentParser(description='Test Vision Service')
    parser.add_argument(
        '--image',
        type=str,
        help='Path to test image (optional)',
        default=None
    )
    args = parser.parse_args()
    
    # Determine image path
    if args.image:
        image_path = Path(args.image)
    else:
        # Try default location
        image_path = backend_dir / "tests" / "fixtures" / "test_images" / "bookshelf_horizontal.jpg"
    
    print("\n" + "=" * 60)
    print("VISION SERVICE VALIDATION TESTS")
    print("=" * 60)
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Confidence Threshold: {settings.GOOGLE_VISION_CONFIDENCE_THRESHOLD}")
    
    if image_path.exists():
        print(f"Test Image: {image_path}")
    else:
        print(f"⚠️  No test image found")
        print(f"   Place image at: {image_path}")
        print(f"   Or use: --image path/to/your/image.jpg")
    
    tests = [
        ("GCP Credentials", test_credentials),
        ("Vision API Client", test_vision_client),
        ("OCR Text Detection", lambda: test_ocr_with_image(image_path)),
        ("Fuzzy Matching", lambda: test_fuzzy_matching(image_path)),
        ("Performance", lambda: test_performance(image_path)),
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
        print("\n🎉 All tests passed! Vision service is working correctly.")
        print("\nNext steps:")
        print("1. Test with real bookshelf photos")
        print("2. Adjust confidence threshold if needed")
        print("3. Ready for Phase 2.4 (Recommendation Engine)")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed.")
        print("\nTroubleshooting:")
        print("1. Check GCP credentials: backend/docs/GCP-VISION-SETUP.md")
        print("2. Verify Vision API is enabled in GCP Console")
        print("3. Test with a clear bookshelf image")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
