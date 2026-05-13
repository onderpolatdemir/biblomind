"""
Redis caching utilities for performance optimization.

Provides decorator-based caching for expensive operations.
"""

import json
import hashlib
import functools
from typing import Any, Optional, Callable
from redis import Redis

from app.core.config import settings
from app.core.logging import logger


class CacheService:
    """Redis cache service with decorator pattern."""
    
    def __init__(self):
        """Initialize Redis connection."""
        self.redis_client: Optional[Redis] = None
        self.enabled = settings.REDIS_CACHE_ENABLED if hasattr(settings, 'REDIS_CACHE_ENABLED') else False
        
        if self.enabled:
            try:
                self.redis_client = Redis(
                    host=settings.REDIS_HOST,
                    port=settings.REDIS_PORT,
                    db=1,  # Use DB 1 for caching (DB 0 for OpenAI service)
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5
                )
                # Test connection
                self.redis_client.ping()
                logger.info("Cache service initialized with Redis")
            except Exception as e:
                logger.warning(f"Redis cache unavailable: {e}")
                self.enabled = False
    
    def _generate_cache_key(self, prefix: str, *args, **kwargs) -> str:
        """
        Generate unique cache key from function arguments.
        
        Args:
            prefix: Cache key prefix (e.g., 'books:list')
            *args, **kwargs: Function arguments to hash
        
        Returns:
            Unique cache key
        """
        # Create deterministic hash from arguments
        arg_str = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
        arg_hash = hashlib.md5(arg_str.encode()).hexdigest()[:12]
        
        return f"{prefix}:{arg_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None if not found/expired
        """
        if not self.enabled or not self.redis_client:
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                logger.debug(f"Cache HIT: {key}")
                return json.loads(value)
            else:
                logger.debug(f"Cache MISS: {key}")
                return None
        except Exception as e:
            logger.warning(f"Cache get error for {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 300):
        """
        Set value in cache with TTL.
        
        Args:
            key: Cache key
            value: Value to cache (must be JSON serializable)
            ttl: Time to live in seconds (default: 5 minutes)
        """
        if not self.enabled or not self.redis_client:
            return
        
        try:
            serialized = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized)
            logger.debug(f"Cache SET: {key} (TTL: {ttl}s)")
        except Exception as e:
            logger.warning(f"Cache set error for {key}: {e}")
    
    def delete(self, key: str):
        """Delete key from cache."""
        if not self.enabled or not self.redis_client:
            return
        
        try:
            self.redis_client.delete(key)
            logger.debug(f"Cache DELETE: {key}")
        except Exception as e:
            logger.warning(f"Cache delete error for {key}: {e}")
    
    def delete_pattern(self, pattern: str):
        """
        Delete all keys matching pattern.
        
        Args:
            pattern: Redis key pattern (e.g., 'books:*')
        """
        if not self.enabled or not self.redis_client:
            return
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logger.debug(f"Cache DELETE pattern: {pattern} ({len(keys)} keys)")
        except Exception as e:
            logger.warning(f"Cache delete pattern error for {pattern}: {e}")
    
    def invalidate_books_cache(self):
        """Invalidate all book-related caches."""
        self.delete_pattern("books:*")
        self.delete_pattern("search:*")
        logger.info("Invalidated books cache")
    
    def invalidate_recommendations_cache(self, user_id: str = None):
        """Invalidate recommendation caches."""
        if user_id:
            self.delete_pattern(f"recommendations:{user_id}:*")
        else:
            self.delete_pattern("recommendations:*")
        logger.info(f"Invalidated recommendations cache{' for user ' + user_id if user_id else ''}")


# Global cache instance
cache_service = CacheService()


def cache_result(prefix: str, ttl: int = 300):
    """
    Decorator to cache function results.
    
    Usage:
        @cache_result(prefix="books:list", ttl=300)
        async def get_books(page: int):
            # Expensive operation
            return books
    
    Args:
        prefix: Cache key prefix
        ttl: Time to live in seconds
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache_service._generate_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached = cache_service.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            cache_service.set(cache_key, result, ttl=ttl)
            
            return result
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = cache_service._generate_cache_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached = cache_service.get(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache_service.set(cache_key, result, ttl=ttl)
            
            return result
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# Import asyncio for coroutine check
import asyncio
