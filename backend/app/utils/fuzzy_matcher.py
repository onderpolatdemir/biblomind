"""Fuzzy string matching utilities for book name matching."""

import re
import logging
from typing import List, Tuple, Optional
from fuzzywuzzy import fuzz
from Levenshtein import distance as levenshtein_distance

logger = logging.getLogger(__name__)


def normalize_text(text: str) -> str:
    """
    Normalize text for better matching.
    
    Args:
        text: Input text
        
    Returns:
        Normalized text (lowercase, trimmed, special chars removed)
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Turkish character normalization (optional - keep Turkish chars)
    # text = text.replace('ı', 'i').replace('İ', 'i')
    # text = text.replace('ş', 's').replace('Ş', 's')
    # text = text.replace('ğ', 'g').replace('Ğ', 'g')
    # text = text.replace('ü', 'u').replace('Ü', 'u')
    # text = text.replace('ö', 'o').replace('Ö', 'o')
    # text = text.replace('ç', 'c').replace('Ç', 'c')
    
    # Remove special characters (keep letters, numbers, spaces)
    text = re.sub(r'[^a-zA-ZğüşıöçĞÜŞİÖÇ0-9\s]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def calculate_similarity(text1: str, text2: str, method: str = 'ratio') -> float:
    """
    Calculate similarity score between two texts.
    
    Args:
        text1: First text
        text2: Second text
        method: Similarity method ('ratio', 'partial', 'token_sort', 'levenshtein')
        
    Returns:
        Similarity score (0.0 to 1.0)
    """
    if not text1 or not text2:
        return 0.0
    
    # Normalize both texts
    text1_norm = normalize_text(text1)
    text2_norm = normalize_text(text2)
    
    if method == 'ratio':
        # Full string ratio
        score = fuzz.ratio(text1_norm, text2_norm) / 100.0
    elif method == 'partial':
        # Partial string matching (good for substrings)
        score = fuzz.partial_ratio(text1_norm, text2_norm) / 100.0
    elif method == 'token_sort':
        # Token sort ratio (good for different word orders)
        score = fuzz.token_sort_ratio(text1_norm, text2_norm) / 100.0
    elif method == 'levenshtein':
        # Levenshtein distance normalized
        max_len = max(len(text1_norm), len(text2_norm))
        if max_len == 0:
            return 1.0
        dist = levenshtein_distance(text1_norm, text2_norm)
        score = 1.0 - (dist / max_len)
    else:
        raise ValueError(f"Unknown method: {method}")
    
    return score


def fuzzy_match_books(
    query: str,
    candidates: List[str],
    threshold: float = 0.8,
    method: str = 'token_sort',
    limit: Optional[int] = None
) -> List[Tuple[str, float]]:
    """
    Find best matches for query in candidate list.
    
    Args:
        query: Search query
        candidates: List of candidate strings
        threshold: Minimum similarity score (0.0-1.0)
        method: Matching method
        limit: Max number of results (None = all above threshold)
        
    Returns:
        List of (candidate, score) tuples, sorted by score descending
    """
    if not query or not candidates:
        return []
    
    # Calculate scores for all candidates
    scored = []
    for candidate in candidates:
        score = calculate_similarity(query, candidate, method=method)
        if score >= threshold:
            scored.append((candidate, score))
    
    # Sort by score descending
    scored.sort(key=lambda x: x[1], reverse=True)
    
    # Apply limit
    if limit:
        scored = scored[:limit]
    
    logger.debug(
        f"Fuzzy match: '{query}' -> {len(scored)} matches "
        f"(threshold: {threshold}, method: {method})"
    )
    
    return scored


def find_best_match(
    query: str,
    candidates: List[str],
    threshold: float = 0.8
) -> Optional[Tuple[str, float]]:
    """
    Find single best match for query.
    
    Args:
        query: Search query
        candidates: List of candidate strings
        threshold: Minimum similarity score
        
    Returns:
        (best_candidate, score) or None if no match above threshold
    """
    matches = fuzzy_match_books(query, candidates, threshold=threshold, limit=1)
    return matches[0] if matches else None


def multi_method_score(text1: str, text2: str) -> float:
    """
    Calculate similarity using multiple methods and return weighted average.
    
    Args:
        text1: First text
        text2: Second text
        
    Returns:
        Weighted similarity score (0.0-1.0)
    """
    scores = {
        'ratio': calculate_similarity(text1, text2, 'ratio'),
        'partial': calculate_similarity(text1, text2, 'partial'),
        'token_sort': calculate_similarity(text1, text2, 'token_sort'),
    }
    
    # Weighted average (token_sort has more weight for book titles)
    weighted = (
        scores['ratio'] * 0.3 +
        scores['partial'] * 0.2 +
        scores['token_sort'] * 0.5
    )
    
    logger.debug(f"Multi-method scores: {scores} -> weighted: {weighted:.3f}")
    
    return weighted


def clean_detected_text(text: str) -> str:
    """
    Clean OCR-detected text for better matching.
    
    Args:
        text: Raw OCR text
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove common OCR artifacts
    text = text.replace('|', 'I')  # Pipe to I
    text = text.replace('0', 'O')  # Zero to O (in book titles)
    
    # Remove numbers (but keep if part of title like "1984")
    # Only remove standalone numbers
    text = re.sub(r'\b\d{1,3}\b', '', text)  # Remove 1-3 digit numbers
    
    # Remove common noise words
    noise_words = ['isbn', 'page', 'pp', 'vol', 'volume', 'edition', 'ed']
    for word in noise_words:
        text = re.sub(rf'\b{word}\b', '', text, flags=re.IGNORECASE)
    
    # Normalize and clean
    text = normalize_text(text)
    
    return text
