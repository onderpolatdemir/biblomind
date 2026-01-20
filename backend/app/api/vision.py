"""Vision API endpoints for OCR and book detection."""

import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.services.vision_service import VisionService
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/test", response_model=Dict[str, Any])
async def test_vision_ocr(
    file: UploadFile = File(..., description="Image file (JPG/PNG, max 10MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Test endpoint for Vision API OCR.
    
    Upload a bookshelf image and get:
    - Detected texts (OCR results)
    - Matched books from database
    - Similarity scores
    
    **Authentication required.**
    
    **Image requirements:**
    - Format: JPG or PNG
    - Max size: 10MB
    - Recommended: Clear, well-lit bookshelf photo
    
    **Example Response:**
    ```json
    {
      "detected_texts": ["1984", "George Orwell", "Brave New World"],
      "matched_books": [
        {
          "id": "...",
          "title": "1984",
          "author": "George Orwell",
          "similarity_score": 0.95
        }
      ],
      "total_detected": 3,
      "total_matched": 1,
      "processing_time_ms": 3500
    }
    ```
    """
    import time
    start_time = time.time()
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/jpg", "image/png"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only JPG/PNG supported."
        )
    
    try:
        # Read file
        image_bytes = await file.read()
        
        logger.info(
            f"Vision OCR test request from user {current_user.id}: "
            f"{file.filename} ({len(image_bytes)} bytes)"
        )
        
        # Initialize service
        vision_service = VisionService()
        
        # Analyze image
        result = await vision_service.analyze_bookshelf_image(image_bytes, db)
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        result["processing_time_ms"] = processing_time_ms
        
        logger.info(
            f"Vision OCR completed in {processing_time_ms}ms: "
            f"{result['total_detected']} detected, {result['total_matched']} matched"
        )
        
        return result
        
    except ValueError as e:
        # Image validation errors
        logger.warning(f"Invalid image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Vision API or other errors
        logger.error(f"Vision OCR failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )


@router.get("/health")
async def vision_health():
    """
    Check if Vision API credentials are configured.
    
    **No authentication required.**
    """
    try:
        vision_service = VisionService()
        
        return {
            "status": "healthy",
            "credentials_configured": bool(settings.GOOGLE_APPLICATION_CREDENTIALS),
            "credentials_path": settings.GOOGLE_APPLICATION_CREDENTIALS or None
        }
    except Exception as e:
        logger.error(f"Vision health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "credentials_configured": bool(settings.GOOGLE_APPLICATION_CREDENTIALS)
        }
