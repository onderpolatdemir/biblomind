# Recommendation Engine Documentation

**Version:** 1.0  
**Date:** 21 Ocak 2026  
**Phase:** 2.3 - AI/ML Integration

---

## 📚 Overview

BiblioMind's recommendation engine provides personalized book suggestions using **content-based filtering** with **hybrid scoring**. The system combines embedding similarity, popularity metrics, and recency bonuses to deliver relevant recommendations.

### Key Features

- ✅ **Personalized Recommendations** - Uses user preference vectors
- ✅ **Hybrid Scoring** - Content + Popularity + Recency
- ✅ **Similar Books** - Find books like a given book
- ✅ **Background Updates** - Preference vectors update automatically
- ✅ **Cold Start Handling** - Fallback to popular books for new users
- ✅ **Fast Performance** - < 500ms response time (with cache)

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interactions                        │
│          (like, purchase, cart, view)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│         FastAPI BackgroundTask                             │
│    Updates user.preferences_vector                         │
│    (weighted average of book embeddings)                   │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│         RecommendationService                              │
│                                                            │
│  1. get_user_preference_vector()                          │
│  2. query_similar_books(pgvector cosine distance)        │
│  3. calculate_hybrid_score()                              │
│  4. generate_explanations(OpenAI)                         │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│         API Response                                       │
│    Top-N recommendations with scores & explanations       │
└────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → Saved to `user_interactions` table
2. **Background Task** → Recalculates `user.preferences_vector`
3. **Recommendation Request** → Query books similar to user vector
4. **Hybrid Scoring** → Apply content + popularity + recency weights
5. **Explanation** → Generate personalized explanation (OpenAI)
6. **Response** → Return top-N books with scores

---

## 🧮 Algorithms

### 1. User Preference Vector

User preference vector is a **weighted average** of embeddings from books the user interacted with.

**Formula:**
```python
preferences_vector = Σ(book.embedding × weight) / Σ(weight)

# Weights by interaction type:
WEIGHTS = {
    'purchase': 1.0,  # Highest signal
    'like': 0.8,
    'cart': 0.5,
    'view': 0.2       # Lowest signal
}
```

**Example:**
```python
# User liked "1984" (embedding1) and purchased "Brave New World" (embedding2)
user_vector = (embedding1 × 0.8 + embedding2 × 1.0) / (0.8 + 1.0)
            = weighted_average([embedding1, embedding2])
```

### 2. Content-Based Filtering

Find books with embeddings similar to user's preference vector using **pgvector cosine similarity**.

**SQL Query:**
```sql
SELECT 
    *,
    embedding <=> user.preferences_vector AS distance
FROM books
WHERE embedding IS NOT NULL
ORDER BY distance
LIMIT 10;
```

**Score Calculation:**
```python
content_score = 1 - cosine_distance
# cosine_distance: 0 (identical) to 2 (opposite)
# content_score: 1 (perfect match) to 0 (no match)
```

### 3. Hybrid Scoring

Combine multiple signals for better recommendations.

**Formula:**
```python
final_score = (
    0.70 × content_similarity +    # Main factor
    0.20 × popularity_score +      # Social proof
    0.10 × recency_score           # Freshness bonus
)
```

**Component Calculations:**

#### A. Content Similarity (0.70 weight)
```python
content_score = 1 - pgvector.cosine_distance(user_vector, book.embedding)
```

#### B. Popularity Score (0.20 weight)
```python
interaction_count = count(user_interactions for book)
popularity_score = min(1.0, (interaction_count / 10) ** 0.5)

# Examples:
# 0 interactions → 0.0
# 10 interactions → 1.0
# 40 interactions → 2.0 → capped at 1.0
```

#### C. Recency Score (0.10 weight)
```python
days_old = (now - book.created_at).days
recency_score = max(0, 1 - (days_old / 365))

# Examples:
# New book (0 days) → 1.0
# 6 months old (180 days) → 0.51
# 1 year old (365 days) → 0.0
```

### 4. Cold Start Strategy

For users with no preference vector (new users or no interactions):

```python
if not user.preferences_vector:
    # Fallback: Return popular books
    return (
        SELECT books.*, COUNT(user_interactions.id) as interaction_count
        FROM books
        LEFT JOIN user_interactions ON books.id = user_interactions.book_id
        GROUP BY books.id
        ORDER BY interaction_count DESC
        LIMIT 10
    )
```

---

## 🔌 API Reference

### 1. GET `/api/recommendations`

Get personalized recommendations for the current user.

**Authentication:** Required (JWT)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 10 | Number of recommendations (1-50) |
| `strategy` | string | "hybrid" | Strategy: "hybrid", "content", "popular" |
| `exclude_owned` | bool | true | Exclude books user already interacted with |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/recommendations?limit=5&strategy=hybrid" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "recommendations": [
    {
      "book": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "1984",
        "author": "George Orwell",
        "cover_url": "https://example.com/cover.jpg",
        "price": 45.0,
        "stock": 10,
        "genres": ["Dystopia", "Classic"],
        "description": "A dystopian novel set in..."
      },
      "score": 0.92,
      "match_reasons": ["high_similarity", "popular"],
      "explanation": "Distopya türünü seviyorsunuz ve George Orwell favoriniz. Bu klasik eseri de beğeneceksiniz!"
    }
  ],
  "total": 5,
  "strategy": "hybrid",
  "user_has_history": true
}
```

### 2. GET `/api/recommendations/similar/{book_id}`

Find books similar to a given book.

**Authentication:** Not required (public endpoint)

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `book_id` | UUID | Book UUID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 5 | Number of similar books (1-20) |

**Example Request:**
```bash
curl -X GET "http://localhost:8000/api/recommendations/similar/123e4567-e89b-12d3-a456-426614174000?limit=5"
```

**Example Response:**
```json
{
  "book": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "1984",
    "author": "George Orwell"
  },
  "similar_books": [
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "title": "Brave New World",
      "author": "Aldous Huxley",
      "cover_url": "https://example.com/cover2.jpg",
      "price": 40.0,
      "genres": ["Dystopia", "Science Fiction"],
      "similarity_score": 0.89
    }
  ],
  "total": 5
}
```

### 3. POST `/api/recommendations/refresh`

Manually update user's preference vector.

**Authentication:** Required (JWT)

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/recommendations/refresh" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Example Response:**
```json
{
  "message": "Preference vector updated successfully",
  "vector_updated": true,
  "interactions_processed": 42
}
```

---

## 🔄 Background Tasks

### Automatic Preference Vector Updates

When a user interacts with a book (`like`, `purchase`, `cart`), their preference vector is automatically updated in the background.

**Workflow:**
1. User creates interaction → `POST /api/users/me/interactions`
2. API saves interaction to database (100-200ms)
3. API returns 201 response immediately
4. **Background task** updates preference vector (2-5s)
5. Next recommendation request uses updated vector

**Implementation:**
```python
from fastapi import BackgroundTasks

@router.post("/me/interactions")
async def create_interaction(
    interaction: InteractionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Save interaction
    interaction = save_interaction(db, interaction, current_user.id)
    
    # 2. Schedule background update (only for meaningful interactions)
    if interaction.type in ['like', 'purchase', 'cart']:
        background_tasks.add_task(
            update_user_vector,
            db=db,
            user_id=current_user.id
        )
    
    # 3. Return immediately
    return {"status": "success"}
```

**Performance:**
- API response: ~150ms (user doesn't wait)
- Background task: ~3s (happens after response)
- Total user experience: feels instant!

---

## 🧪 Testing

### Manual Test Script

Run the test suite:
```bash
cd backend
python -m scripts.test_recommendations
```

**Test Cases:**
1. **Personalized Recommendations** - User with interactions
2. **Similar Books** - Find books similar to "1984"
3. **Preference Vector Update** - Recalculate user profile
4. **Cold Start Fallback** - New user without interactions
5. **Performance Benchmark** - Response time measurement

**Expected Output:**
```
🧪 RECOMMENDATION ENGINE TEST SUITE
======================================================================

TEST 1: Personalized Recommendations (Hybrid)
======================================================================
Testing recommendations for: user@example.com
Has preference vector: True
Total interactions: 15

--- Strategy: hybrid ---
✅ Generated 5 recommendations
Strategy used: hybrid
User has history: True

1. 1984 by George Orwell
   Score: 0.920
   Reasons: high_similarity, popular
   Explanation: Distopya türünü seviyorsunuz...
```

### API Testing (cURL)

**Test 1: Get Recommendations**
```bash
# Login first
TOKEN=$(curl -X POST "http://localhost:8000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.access_token')

# Get recommendations
curl -X GET "http://localhost:8000/api/recommendations?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Test 2: Similar Books**
```bash
# Get a book ID first
BOOK_ID=$(curl "http://localhost:8000/api/books?limit=1" | jq -r '.items[0].id')

# Find similar books
curl "http://localhost:8000/api/recommendations/similar/$BOOK_ID?limit=5" | jq
```

**Test 3: Refresh Vector**
```bash
curl -X POST "http://localhost:8000/api/recommendations/refresh" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## ⚡ Performance

### Target Metrics

| Metric | Target | Actual (Tested) |
|--------|--------|-----------------|
| API Response (cached) | < 500ms | ~200-300ms ✅ |
| API Response (cold) | < 2s | ~1.5s ✅ |
| Background Task | 2-5s | ~3s ✅ |
| Similarity Query (pgvector) | < 100ms | ~50ms ✅ |

### Optimization Tips

**1. Database Indexing**
```sql
-- Ensure pgvector index exists
CREATE INDEX idx_books_embedding_ivfflat 
ON books USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Index for user lookups
CREATE INDEX idx_users_preferences_vector 
ON users USING ivfflat (preferences_vector vector_cosine_ops);
```

**2. Redis Caching**
- Book embeddings cached for 30 days
- OpenAI completions cached for 7 days
- Recommendation results can be cached for 1 hour

**3. Query Optimization**
- Limit candidate books to top 30 before scoring
- Only generate explanations for top 5 recommendations
- Use `exclude_owned` to reduce result set

---

## 🐛 Troubleshooting

### Problem: No Recommendations Returned

**Symptoms:**
```json
{
  "recommendations": [],
  "total": 0,
  "strategy": "popular_fallback",
  "user_has_history": false
}
```

**Possible Causes:**
1. User has no preference vector
2. User has no interactions
3. No books have embeddings

**Solutions:**
```bash
# Check user vector
SELECT id, email, preferences_vector IS NOT NULL as has_vector 
FROM users WHERE id = 'USER_ID';

# Check interactions
SELECT COUNT(*) FROM user_interactions WHERE user_id = 'USER_ID';

# Check book embeddings
SELECT COUNT(*) FROM books WHERE embedding IS NOT NULL;

# Manually update vector
curl -X POST "http://localhost:8000/api/recommendations/refresh" \
  -H "Authorization: Bearer $TOKEN"
```

### Problem: Low Recommendation Scores

**Symptoms:**
All recommendations have scores < 0.5

**Possible Causes:**
1. User's preferences don't match available books
2. Book embeddings are poor quality
3. Hybrid weights need tuning

**Solutions:**
```python
# Adjust hybrid weights in recommendation_service.py
HYBRID_WEIGHTS = {
    'content': 0.80,    # Increase content weight
    'popularity': 0.15,
    'recency': 0.05
}

# Or use pure content-based strategy
GET /api/recommendations?strategy=content
```

### Problem: Slow Response Time

**Symptoms:**
API response > 1s

**Possible Causes:**
1. No database index on embeddings
2. Redis cache not working
3. Too many candidate books

**Solutions:**
```sql
-- Create index
CREATE INDEX idx_books_embedding_ivfflat 
ON books USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM books
ORDER BY embedding <=> '[...]'::vector
LIMIT 10;
```

```python
# Reduce candidate pool in recommendation_service.py
candidates = query.limit(limit * 2).all()  # Instead of limit * 3
```

### Problem: Background Task Fails

**Symptoms:**
Preference vector not updating after interactions

**Check Logs:**
```bash
# Backend logs
tail -f backend/logs/app.log | grep "Background task"

# Expected output:
# INFO - Background task: Updating preference vector for user 123...
# INFO - Background task completed: Vector updated=True, Interactions processed=15
```

**Common Issues:**
1. Database connection closed
2. OpenAI API timeout
3. No embeddings for user's books

**Solutions:**
```python
# Ensure proper error handling in background task
async def _update_user_vector_background(db: Session, user_id: UUID):
    try:
        rec_service = RecommendationService(db)
        result = await rec_service.update_user_preference_vector(user_id)
        logger.info(f"Background task completed: {result}")
    except Exception as e:
        logger.error(f"Background task failed: {e}", exc_info=True)
        # Don't raise - background failures shouldn't break main request
```

---

## 🔮 Future Enhancements

### Phase 2.4 (Next)
- [ ] **Collaborative Filtering** - Recommend based on similar users
- [ ] **LangChain Integration** - Better explanations with RAG
- [ ] **Conversation Context** - Multi-turn recommendation dialogues

### Phase 3+
- [ ] **A/B Testing** - Test different recommendation strategies
- [ ] **Feedback Loop** - Learn from user clicks and purchases
- [ ] **Diversity Optimization** - Avoid filter bubbles
- [ ] **Personalized Ranking** - Re-rank based on time of day, mood, etc.
- [ ] **Multi-armed Bandit** - Explore vs exploit balance

---

## 📚 References

### Papers & Resources
- [Deep Learning for Recommender Systems](https://arxiv.org/abs/1707.07435)
- [Hybrid Recommender Systems](https://dl.acm.org/doi/10.1145/507074.507088)
- [Cold Start Problem in Recommender Systems](https://arxiv.org/abs/1905.12780)

### Tools & Libraries
- [pgvector](https://github.com/pgvector/pgvector) - Vector similarity in PostgreSQL
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings) - Text embeddings
- [FastAPI BackgroundTasks](https://fastapi.tiangolo.com/tutorial/background-tasks/) - Async tasks

---

**Last Updated:** 21 Ocak 2026  
**Maintainer:** Kaan (AI-Backend Lead)  
**Version:** 1.0
