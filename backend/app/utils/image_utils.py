"""Image processing utilities for Vision API."""

import io
import logging
from typing import Optional
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)


def validate_image(image_bytes: bytes, max_size_mb: int = 10) -> bool:
    """
    Validate image file.
    
    Args:
        image_bytes: Image file bytes
        max_size_mb: Maximum file size in MB
        
    Returns:
        True if valid, False otherwise
        
    Raises:
        ValueError: If image is invalid with reason
    """
    # Check size
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        raise ValueError(f"Image too large: {size_mb:.2f}MB (max: {max_size_mb}MB)")
    
    # Check if valid image
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()
        
        # Check format
        if img.format not in ['JPEG', 'PNG', 'JPG']:
            raise ValueError(f"Unsupported format: {img.format}. Only JPG/PNG supported.")
        
        logger.debug(f"Image validated: {img.format}, {img.size}, {size_mb:.2f}MB")
        return True
        
    except UnidentifiedImageError:
        raise ValueError("Invalid image file")
    except Exception as e:
        raise ValueError(f"Image validation failed: {e}")


def rotate_image(image_bytes: bytes, degrees: int) -> bytes:
    """
    Rotate image by specified degrees.
    
    Args:
        image_bytes: Original image bytes
        degrees: Rotation degrees (0, 90, 180, 270)
        
    Returns:
        Rotated image bytes
    """
    if degrees not in [0, 90, 180, 270]:
        raise ValueError(f"Invalid rotation: {degrees}. Must be 0, 90, 180, or 270")
    
    if degrees == 0:
        return image_bytes
    
    try:
        # Load image
        img = Image.open(io.BytesIO(image_bytes))
        
        # Rotate (counter-clockwise, so negate)
        rotated = img.rotate(-degrees, expand=True)
        
        # Save to bytes
        output = io.BytesIO()
        rotated.save(output, format=img.format or 'JPEG')
        output.seek(0)
        
        logger.debug(f"Image rotated {degrees} degrees")
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Image rotation failed: {e}")
        raise ValueError(f"Failed to rotate image: {e}")


def resize_if_large(image_bytes: bytes, max_dimension: int = 4096) -> bytes:
    """
    Resize image if width or height exceeds max dimension.
    Maintains aspect ratio.
    
    Args:
        image_bytes: Original image bytes
        max_dimension: Maximum width or height
        
    Returns:
        Resized image bytes (or original if not needed)
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        
        # Check if resize needed
        if width <= max_dimension and height <= max_dimension:
            logger.debug(f"Image size OK: {width}x{height}")
            return image_bytes
        
        # Calculate new size maintaining aspect ratio
        if width > height:
            new_width = max_dimension
            new_height = int(height * (max_dimension / width))
        else:
            new_height = max_dimension
            new_width = int(width * (max_dimension / height))
        
        # Resize
        resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = io.BytesIO()
        resized.save(output, format=img.format or 'JPEG', quality=95)
        output.seek(0)
        
        logger.info(f"Image resized: {width}x{height} -> {new_width}x{new_height}")
        return output.getvalue()
        
    except Exception as e:
        logger.error(f"Image resize failed: {e}")
        # Return original on error
        return image_bytes


def get_image_info(image_bytes: bytes) -> dict:
    """
    Get image metadata.
    
    Args:
        image_bytes: Image bytes
        
    Returns:
        Dict with format, size, mode info
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        return {
            "format": img.format,
            "mode": img.mode,
            "width": img.size[0],
            "height": img.size[1],
            "size_bytes": len(image_bytes),
            "size_mb": len(image_bytes) / (1024 * 1024)
        }
    except Exception as e:
        logger.error(f"Failed to get image info: {e}")
        return {}
