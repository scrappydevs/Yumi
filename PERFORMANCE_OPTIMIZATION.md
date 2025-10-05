# Performance Optimization for iOS Discover & Search Endpoints

## Current Performance Analysis

### Bottlenecks Identified:
1. **Gemini LLM Call** (5-15 seconds) - Main bottleneck
2. Database queries (~0.5-1s)
3. Prompt size affects LLM latency

### Current State:
- Using `gemini-2.5-flash` (already fast model)
- iOS endpoints limited to 10 candidates (good)
- Timeout set to 8 seconds on iOS

## Recommended Optimizations

### 1. ⚡️ **Use Faster Model** (Easiest, ~30-50% faster)
```python
# In services/gemini_service.py
def __init__(self, model_name: str = 'gemini-2.5-flash-lite'):  # Change from 'gemini-2.5-flash'
```

**Impact**: 30-50% faster responses
**Trade-off**: Slightly less accurate recommendations

### 2. 🎯 **Reduce Candidates to 5** (Quick win, ~20-30% faster)
```python
# In main.py discover-ios and search-ios
results = await search_service.search_restaurants(
    query=query,
    user_id=user_id,
    latitude=latitude,
    longitude=longitude,
    max_candidates=5  # Change from 10
)
```

**Impact**: Smaller prompt → 20-30% faster LLM
**Trade-off**: Less variety (but still 5 good options)

### 3. 📝 **Simplify Prompt** (Moderate effort, ~15-25% faster)
The current prompt is 2000+ characters. Reduce to ~800 characters:

```python
# Simplified prompt in restaurant_search_service.py
prompt = f"""Select TOP 3 restaurants matching the query from the list below.

QUERY: "{query}"
USER LIKES: {', '.join(cuisines_list[:2])} | {', '.join(atmospheres_list[:2])}

RESTAURANTS:
{restaurants_text}

RANKING: Query match (40%) + Rating quality (40%) + Review count (20%)

Return JSON only:
{{
  "top_restaurants": [
    {{"name": "...", "cuisine": "...", "rating": 4.5, "user_ratings_total": 250, "address": "...", "price_level": 2, "match_score": 0.92, "reasoning": "Best match"}}
  ]
}}
"""
```

**Impact**: 15-25% faster due to shorter prompt
**Trade-off**: Less detailed reasoning

### 4. 🚀 **Pre-rank Before LLM** (Best long-term, ~40% faster)
```python
# Pre-sort restaurants by quality score before sending to LLM
quality_scores = []
for r in restaurants:
    rating_score = r['rating'] / 5.0
    review_score = min(r.get('user_ratings_total', 0) / 500.0, 1.0)
    quality_score = (rating_score * 0.6) + (review_score * 0.4)
    quality_scores.append((r, quality_score))

# Sort and take top 5
quality_scores.sort(key=lambda x: x[1], reverse=True)
top_restaurants = [r for r, score in quality_scores[:5]]

# Send only top 5 to LLM for final ranking
```

**Impact**: Send only best 5 → 40% faster
**Trade-off**: None (improves quality)

### 5. ⏱️ **Use Streaming Response** (Advanced, better UX)
```python
# In restaurant_search_service.py
response = model.generate_content(prompt, stream=True)
chunks = []
for chunk in response:
    chunks.append(chunk.text)
full_response = ''.join(chunks)
```

**Impact**: Perceived 50% faster (shows progress)
**Trade-off**: More complex implementation

### 6. 💾 **Server-side Caching** (Easiest for repeated queries)
```python
import functools
from cachetools import TTLCache

# Cache for 5 minutes based on location + query
cache = TTLCache(maxsize=100, ttl=300)

@functools.lru_cache(maxsize=100)
def cached_search(query, user_id, lat_rounded, lon_rounded):
    # Round to 2 decimal places (~1km precision)
    # This allows cache hits for nearby locations
    pass
```

**Impact**: Instant response for cached queries
**Trade-off**: Slightly stale results

## Quick Win Recommendation

**Implement options 1, 2, and 3 together** for ~60-70% speed improvement with minimal code changes:

1. Switch to `gemini-2.5-flash-lite`
2. Reduce to 5 candidates
3. Shorten prompt by 50%

**Expected result**: 15-20 second responses → 5-8 seconds

## Long-term Recommendation

Implement option 4 (pre-ranking) for the best balance of speed and quality. Combined with iOS caching (already implemented), this gives:
- First load: 5-8 seconds (from API)
- Subsequent loads: <1 second (from iOS cache)
- Pull-to-refresh: 5-8 seconds (fresh data)

## Monitoring

Add timing logs to identify which step is slowest:
```python
import time

step_times = {
    'preferences': time.time() - step1_start,
    'db_query': time.time() - step2_start,
    'pre_rank': time.time() - step3_start,
    'llm_call': time.time() - step4_start,
    'total': time.time() - search_start
}
print(f"[TIMING] {step_times}")
```

## Additional Notes

- iOS already has caching (30min for discover) - this is good!
- 8-second timeout on iOS loading screen is appropriate
- Consider showing "Analyzing restaurants..." progress indicator
- For discover endpoint, consider returning cached results immediately + updating in background
