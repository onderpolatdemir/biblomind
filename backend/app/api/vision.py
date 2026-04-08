"""Vision API endpoints for OCR and book detection."""

import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.shelf_analysis import ShelfAnalysis
from app.models.photo_scan import PhotoScan
from app.services.vision_service import VisionService
from app.services.openai_service import OpenAIService
from app.services.user_service import UserService
from app.core.config import settings
import os
import uuid
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/vision", tags=["vision"])


@router.post("/match-shelf", response_model=Dict[str, Any])
async def match_bookshelf_to_user(
    file: UploadFile = File(..., description="Bookshelf image (JPG/PNG/WEBP, max 10MB)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Bir kitaplık fotoğrafındaki kitapları kullanıcı profili ile eşleştir.
    
    **Use Case:**
    - Kullanıcı arkadaşının kitaplığını fotoğraflar
    - Sistem OCR ile kitapları tespit eder
    - AI ile kitap isimlerini düzeltir
    - Kullanıcının okuma profili ile karşılaştırır
    - "Bu kitaplıktan sana şu kitapları öneriyoruz" der
    
    **Authentication required.**
    
    **Response includes:**
    - `user_profile`: Kullanıcının okuma profili (favorite genres, authors, themes)
    - `detected_books`: Kitaplıkta tespit edilen tüm kitaplar
    - `recommendations`: Kullanıcıya önerilen kitaplar (match score ile)
    - `shelf_analysis`: Raf analizi (dominant genres, user compatibility)
    
    **Example Response:**
    ```json
    {
      "user_profile": {
        "favorite_genres": ["Distopya", "Politik"],
        "favorite_authors": ["George Orwell"],
        "has_history": true
      },
      "total_books_in_shelf": 38,
      "detected_books": [
        {"title": "1984", "author": "George Orwell", "confidence": 0.95}
      ],
      "recommendations": [
        {
          "title": "1984",
          "author": "George Orwell",
          "match_score": 0.98,
          "reason": "Favori yazarınız ve distopya seviyorsunuz",
          "in_our_store": true,
          "book_id": "...",
          "price": 45.0
        }
      ],
      "shelf_analysis": {
        "dominant_genres": ["Klasik", "Felsefe"],
        "reading_style": "Karışık okur",
        "user_compatibility": 0.75
      }
    }
    ```
    """
    import time
    start_time = time.time()
    
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/jpg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type: {file.content_type}. Only JPG/PNG/WEBP supported."
        )
    
    try:
        # Read file
        image_bytes = await file.read()
        
        logger.info(
            f"Bookshelf matching request from user {current_user.id}: "
            f"{file.filename} ({len(image_bytes)} bytes)"
        )

        # Save the file locally for the Gallery
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        upload_dir = os.path.join("static", "uploads", "shelves")
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        # The URL that the frontend will use to access the image
        image_url = f"/static/uploads/shelves/{unique_filename}"
        
        # Initialize services
        vision_service = VisionService()
        openai_service = OpenAIService()
        
        # Step 1: Kitapları tespit et ve temizle (OCR + AI)
        logger.info("Step 1: Detecting and cleaning books from image")
        detected_books = await vision_service.detect_and_clean_books(
            image_bytes,
            openai_service
        )
        
        if not detected_books:
            logger.warning("No books detected in image")
            return {
                "user_profile": {},
                "total_books_in_shelf": 0,
                "detected_books": [],
                "recommendations": [],
                "shelf_analysis": {},
                "message": "No books were detected in the shelf. Please upload a clearer photo.",
                "processing_time_ms": int((time.time() - start_time) * 1000)
            }
        
        logger.info(f"Detected {len(detected_books)} books")
        
        # Step 2: Kullanıcının okuma profilini al
        logger.info("Step 2: Getting user reading profile")
        user_profile = await UserService.get_user_reading_profile(
            db,
            current_user.id,
            openai_service
        )
        
        # Step 3: Kitapları kullanıcı profiline göre eşleştir
        logger.info("Step 3: Matching books to user profile")
        matching_result = await vision_service.match_books_to_user_profile(
            detected_books,
            user_profile,
            db,
            openai_service,
            limit=5
        )
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Save scan history to photo_scans table
        try:
            photo_scan = PhotoScan(
                user_id=current_user.id,
                detected_books=detected_books,
                recommendations=[
                    {
                        "title": r.get("title"),
                        "match_score": r.get("match_score"),
                        "in_our_store": r.get("in_our_store", False),
                        "book_id": r.get("book_id"),
                    }
                    for r in matching_result['recommendations']
                ],
            )
            db.add(photo_scan)
            db.commit()
            logger.info(f"PhotoScan saved for user {current_user.id}")
        except Exception as scan_err:
            db.rollback()
            logger.warning(f"Failed to save photo scan: {scan_err}")

        # Prepare response
        response = {
            "user_profile": user_profile,
            "total_books_in_shelf": len(detected_books),
            "detected_books": detected_books,
            "recommendations": matching_result['recommendations'],
            "shelf_analysis": matching_result['shelf_analysis'],
            "message": f"We recommend {len(matching_result['recommendations'])} books from this shelf!",
            "processing_time_ms": processing_time_ms
        }

        # Save to ShelfAnalysis DB
        analysis_record = ShelfAnalysis(
            user_id=current_user.id,
            image_path=image_url,
            result_json=response
        )
        db.add(analysis_record)
        db.commit()
        db.refresh(analysis_record)

        # Include the DB ID in the response so the frontend can redirect to it
        response["analysis_id"] = str(analysis_record.id)
        logger.info(
            f"Bookshelf matching completed in {processing_time_ms}ms: "
            f"{len(detected_books)} detected, {len(matching_result['recommendations'])} recommended"
        )

        return response
        
    except ValueError as e:
        # Image validation errors
        logger.warning(f"Invalid image: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Vision API or other errors
        logger.error(f"Bookshelf matching failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failed: {str(e)}"
        )

@router.get("/shelf-analyses", response_model=List[Dict[str, Any]])
async def get_user_shelf_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the history of bookshelf analyses for the current user.
    """
    analyses = db.query(ShelfAnalysis).filter(
        ShelfAnalysis.user_id == current_user.id
    ).order_by(ShelfAnalysis.created_at.desc()).all()

    # Format the response
    return [
        {
            "id": str(analysis.id),
            "image_path": analysis.image_path,
            "created_at": analysis.created_at.isoformat(),
            "total_books": len(analysis.result_json.get("detected_books", [])),
            "total_recommendations": len(analysis.result_json.get("recommendations", [])),
            "shelf_analysis": analysis.result_json.get("shelf_analysis", {})
        }
        for analysis in analyses
    ]

@router.get("/shelf-analyses/{analysis_id}", response_model=Dict[str, Any])
async def get_shelf_analysis_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific bookshelf analysis detail by ID.
    """
    analysis = db.query(ShelfAnalysis).filter(
        ShelfAnalysis.id == analysis_id,
        ShelfAnalysis.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")

    result = analysis.result_json
    result["analysis_id"] = str(analysis.id)
    result["image_path"] = analysis.image_path
    return result



@router.get("/scans", response_model=List[Dict[str, Any]])
async def get_scan_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's bookshelf scan history.

    Returns all photo scans ordered by newest first,
    including detected books and recommendations for each scan.
    """
    scans = (
        db.query(PhotoScan)
        .filter(PhotoScan.user_id == current_user.id)
        .order_by(PhotoScan.created_at.desc())
        .limit(limit)
        .all()
    )

    return [
        {
            "id": str(s.id),
            "detected_books": s.detected_books or [],
            "recommendations": s.recommendations or [],
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in scans
    ]


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
