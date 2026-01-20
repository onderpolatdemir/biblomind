"""Elasticsearch service for full-text search."""

import logging
from typing import List, Dict, Any, Optional
from elasticsearch import Elasticsearch, NotFoundError
from uuid import UUID

from app.core.config import settings
from app.models.book import Book

logger = logging.getLogger(__name__)


class ElasticsearchService:
    """Service for Elasticsearch operations on books."""
    
    def __init__(self):
        """Initialize Elasticsearch client."""
        self.client = Elasticsearch(
            hosts=[settings.ELASTICSEARCH_URL],
            verify_certs=False,
            ssl_show_warn=False
        )
        self.index_name = settings.ELASTICSEARCH_INDEX
    
    def ping(self) -> bool:
        """
        Check if Elasticsearch is available.
        
        Returns:
            True if connected, False otherwise
        """
        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"Elasticsearch ping failed: {e}")
            return False
    
    def create_index(self) -> bool:
        """
        Create books index with mappings.
        
        Returns:
            True if index created or already exists
        """
        try:
            if self.client.indices.exists(index=self.index_name):
                logger.info(f"Index '{self.index_name}' already exists")
                return True
            
            # Index mapping with boosted fields for relevance
            mapping = {
                "mappings": {
                    "properties": {
                        "title": {
                            "type": "text",
                            "analyzer": "standard",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "author": {
                            "type": "text",
                            "analyzer": "standard",
                            "fields": {
                                "keyword": {"type": "keyword"}
                            }
                        },
                        "description": {
                            "type": "text",
                            "analyzer": "standard"
                        },
                        "genres": {
                            "type": "keyword"
                        },
                        "price": {
                            "type": "float"
                        },
                        "isbn": {
                            "type": "keyword"
                        },
                        "stock": {
                            "type": "integer"
                        },
                        "cover_url": {
                            "type": "keyword",
                            "index": False
                        },
                        "created_at": {
                            "type": "date"
                        }
                    }
                }
            }
            
            self.client.indices.create(index=self.index_name, body=mapping)
            logger.info(f"Created index '{self.index_name}' with mappings")
            return True
            
        except Exception as e:
            logger.error(f"Failed to create index: {e}")
            return False
    
    def index_book(self, book: Book) -> bool:
        """
        Index a single book.
        
        Args:
            book: Book model instance
            
        Returns:
            True if indexed successfully
        """
        try:
            document = {
                "title": book.title,
                "author": book.author,
                "description": book.description,
                "genres": book.genres or [],
                "price": float(book.price) if book.price else 0.0,
                "isbn": book.isbn,
                "stock": book.stock,
                "cover_url": book.cover_url,
                "created_at": book.created_at.isoformat() if book.created_at else None
            }
            
            self.client.index(
                index=self.index_name,
                id=str(book.id),
                document=document
            )
            logger.info(f"Indexed book: {book.id} - {book.title}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to index book {book.id}: {e}")
            return False
    
    def bulk_index_books(self, books: List[Book]) -> Dict[str, int]:
        """
        Bulk index multiple books.
        
        Args:
            books: List of Book model instances
            
        Returns:
            Dictionary with success and failure counts
        """
        success_count = 0
        failure_count = 0
        
        try:
            # Prepare bulk operations
            bulk_data = []
            for book in books:
                # Index operation
                bulk_data.append({
                    "index": {
                        "_index": self.index_name,
                        "_id": str(book.id)
                    }
                })
                # Document data
                bulk_data.append({
                    "title": book.title,
                    "author": book.author,
                    "description": book.description,
                    "genres": book.genres or [],
                    "price": float(book.price) if book.price else 0.0,
                    "isbn": book.isbn,
                    "stock": book.stock,
                    "cover_url": book.cover_url,
                    "created_at": book.created_at.isoformat() if book.created_at else None
                })
            
            if bulk_data:
                response = self.client.bulk(operations=bulk_data, refresh=True)
                
                # Count successes and failures
                if response.get("errors"):
                    for item in response.get("items", []):
                        if "index" in item:
                            if item["index"].get("status") in [200, 201]:
                                success_count += 1
                            else:
                                failure_count += 1
                else:
                    success_count = len(books)
                
                logger.info(f"Bulk indexed {success_count} books, {failure_count} failures")
            
        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}")
            failure_count = len(books)
        
        return {
            "success": success_count,
            "failure": failure_count,
            "total": len(books)
        }
    
    def update_book(self, book_id: UUID, book: Book) -> bool:
        """
        Update a book in the index.
        
        Args:
            book_id: Book UUID
            book: Updated Book model instance
            
        Returns:
            True if updated successfully
        """
        try:
            document = {
                "title": book.title,
                "author": book.author,
                "description": book.description,
                "genres": book.genres or [],
                "price": float(book.price) if book.price else 0.0,
                "isbn": book.isbn,
                "stock": book.stock,
                "cover_url": book.cover_url,
                "created_at": book.created_at.isoformat() if book.created_at else None
            }
            
            self.client.update(
                index=self.index_name,
                id=str(book_id),
                doc=document
            )
            logger.info(f"Updated book in ES: {book_id}")
            return True
            
        except NotFoundError:
            # If not in index, index it
            logger.warning(f"Book {book_id} not found in ES, indexing instead")
            return self.index_book(book)
        except Exception as e:
            logger.error(f"Failed to update book {book_id} in ES: {e}")
            return False
    
    def delete_book(self, book_id: UUID) -> bool:
        """
        Delete a book from the index.
        
        Args:
            book_id: Book UUID
            
        Returns:
            True if deleted successfully
        """
        try:
            self.client.delete(
                index=self.index_name,
                id=str(book_id)
            )
            logger.info(f"Deleted book from ES: {book_id}")
            return True
            
        except NotFoundError:
            logger.warning(f"Book {book_id} not found in ES, already deleted")
            return True
        except Exception as e:
            logger.error(f"Failed to delete book {book_id} from ES: {e}")
            return False
    
    def search_books(
        self,
        query: str,
        page: int = 1,
        page_size: int = 20,
        genre: Optional[str] = None,
        author: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Search books with fuzzy matching and filters.
        
        Args:
            query: Search query string
            page: Page number (1-indexed)
            page_size: Results per page
            genre: Filter by genre
            author: Filter by author
            min_price: Minimum price filter
            max_price: Maximum price filter
            
        Returns:
            Dictionary with hits, total, and pagination info
        """
        try:
            # Calculate offset
            offset = (page - 1) * page_size
            
            # Build query
            must_clauses = []
            
            # Multi-field search with boosting and fuzzy matching
            if query:
                must_clauses.append({
                    "multi_match": {
                        "query": query,
                        "fields": ["title^3", "author^2", "description"],
                        "fuzziness": "AUTO",  # Typo tolerance
                        "prefix_length": 1,
                        "operator": "or"
                    }
                })
            else:
                # Match all if no query
                must_clauses.append({"match_all": {}})
            
            # Build filters
            filter_clauses = []
            
            if genre:
                filter_clauses.append({"term": {"genres": genre}})
            
            if author:
                filter_clauses.append({
                    "match": {
                        "author": {
                            "query": author,
                            "fuzziness": "AUTO"
                        }
                    }
                })
            
            if min_price is not None or max_price is not None:
                price_range = {}
                if min_price is not None:
                    price_range["gte"] = min_price
                if max_price is not None:
                    price_range["lte"] = max_price
                filter_clauses.append({"range": {"price": price_range}})
            
            # Combine must and filter clauses
            bool_query = {
                "bool": {
                    "must": must_clauses
                }
            }
            
            if filter_clauses:
                bool_query["bool"]["filter"] = filter_clauses
            
            # Execute search
            response = self.client.search(
                index=self.index_name,
                body={
                    "query": bool_query,
                    "from": offset,
                    "size": page_size,
                    "sort": [
                        {"_score": {"order": "desc"}},
                        {"created_at": {"order": "desc"}}
                    ]
                }
            )
            
            # Extract results
            hits = response["hits"]["hits"]
            total = response["hits"]["total"]["value"]
            
            results = []
            for hit in hits:
                source = hit["_source"]
                source["id"] = hit["_id"]
                source["relevance_score"] = hit["_score"]
                results.append(source)
            
            return {
                "hits": results,
                "total": total,
                "page": page,
                "page_size": page_size
            }
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {
                "hits": [],
                "total": 0,
                "page": page,
                "page_size": page_size
            }
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get index statistics.
        
        Returns:
            Dictionary with index stats
        """
        try:
            stats = self.client.indices.stats(index=self.index_name)
            doc_count = stats["indices"][self.index_name]["total"]["docs"]["count"]
            size = stats["indices"][self.index_name]["total"]["store"]["size_in_bytes"]
            
            return {
                "index_name": self.index_name,
                "document_count": doc_count,
                "size_bytes": size,
                "connected": True
            }
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {
                "index_name": self.index_name,
                "connected": False,
                "error": str(e)
            }


# Singleton instance
es_service = ElasticsearchService()
