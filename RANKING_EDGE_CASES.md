# Restaurant Ranking Edge Cases - Implementation

## Overview
Enhanced the LLM ranking logic to intelligently handle edge cases in both individual and group restaurant searches.

---

## Edge Cases Handled

### 1. **Query Override (Highest Priority)**
**Scenario:** User explicitly requests a specific cuisine/type in their query, but their saved preferences say something else.

**Example:**
```
Query: "I want Chinese food"
Saved Preferences: Italian, French
Result: ONLY recommend Chinese restaurants (query wins)
```

**Why:** User's current desire overrides historical preferences. They might like Italian normally but want Chinese today.

**Implementation:**
- LLM checks query for explicit cuisine mentions
- Ignores saved preferences if query is specific
- Only shows restaurants matching the query

---

### 2. **Empty/Minimal Preferences**
**Scenario:** User has no saved preferences (new user or hasn't reviewed anything).

**Example:**
```
Query: "somewhere good to eat"
Saved Preferences: (empty)
Result: High-rated restaurants with diverse options
```

**Why:** Without preferences, we fall back to objective quality (ratings) and variety.

**Implementation:**
- Backend checks if preferences dict is empty
- LLM prioritizes highest-rated restaurants
- Includes diverse cuisines for exploration
- Passes `USER HAS MINIMAL PREFERENCES` flag to LLM

---

### 3. **Vague Queries**
**Scenario:** User's query is too generic to extract intent.

**Example:**
```
Query: "food near me" or "somewhere to eat"
Saved Preferences: Mexican, Spicy, $$
Result: Use preferences as primary guide
```

**Sub-case: Both vague:**
```
Query: "food"
Saved Preferences: (empty)
Result: Top-rated restaurants, diverse options
```

**Why:** When query is vague, preferences provide context. If both are vague, we default to quality and variety.

**Implementation:**
- LLM identifies vague queries (no specific requirements)
- Falls back to preferences if available
- If both vague: prioritize ratings + variety

---

### 4. **Explicit Requirements Override Everything**
**Scenario:** Query has specific requirements that conflict with preferences.

**Examples:**
```
Query: "romantic dinner"
Preferences: Casual, Fast Food
Result: Romantic restaurants (query wins)

Query: "cheap eats under $10"
Preferences: $$$$ (Fine Dining)
Result: Budget restaurants (query wins)

Query: "outdoor seating"
Preferences: (any)
Result: Only restaurants with outdoor seating
```

**Why:** Current needs trump general preferences.

---

## Group-Specific Edge Cases

### 5. **Diverse Group Preferences**
**Scenario:** Group members have conflicting preferences.

**Example:**
```
Query: "where should we eat?"
User A: Italian, Fine Dining, $$$
User B: Japanese, Casual, $$
User C: Mexican, Trendy, $$
Merged: Italian + Japanese + Mexican, $$$
Result: Look for fusion, diverse menus, or pick best from each
```

**Strategy:**
1. **Fusion restaurants** (if available) - satisfy multiple cuisines
2. **Varied menus** - places with options from multiple cuisines
3. **Best-rated from each** - one Italian, one Japanese, one Mexican

---

### 6. **Group Query Override**
**Scenario:** Query specifies cuisine for group, but group has different preferences.

**Example:**
```
Query: "Let's get Chinese food"
Group Preferences: Italian, French, Mexican
Result: ONLY Chinese (query wins)
```

**Why:** The person making the query has already gotten group consensus. Query reflects group decision.

---

### 7. **Empty Group Preferences**
**Scenario:** None of the group members have established preferences.

**Example:**
```
Query: "lunch for 4 people"
Group Preferences: (empty)
Result: High-rated, group-friendly, diverse menus
```

**Priority:**
1. High ratings (objective quality)
2. Group-friendly atmosphere (spacious, casual)
3. Diverse menu options (something for everyone)

---

## Priority Hierarchy

### Individual Search:
```
1. Explicit Query Requirements (cuisine, atmosphere, price)
   ↓
2. Query Context (romantic, cheap, outdoor, etc.)
   ↓
3. Saved User Preferences
   ↓
4. High Ratings (fallback)
```

### Group Search:
```
1. Explicit Query Requirements
   ↓
2. Group Context (family-friendly, large tables, etc.)
   ↓
3. Merged Group Preferences
   ↓
4. Group-Friendly Factors (ratings, diverse menu, atmosphere)
```

---

## Examples in Action

### Example 1: Query Override
```
Input:
  Query: "I want Indian food"
  Preferences: ["Italian", "French", "Japanese"]
  
LLM Decision:
  - Detects explicit "Indian food" in query
  - Ignores Italian/French/Japanese preferences
  - ONLY recommends Indian restaurants
  
Output:
  1. Spice House - Indian (4.8⭐, $$)
     Reason: "Matches your explicit request for Indian food with excellent ratings"
  2. Curry Palace - Indian (4.6⭐, $$)
  3. Tandoori Garden - Indian (4.5⭐, $$$)
```

### Example 2: Empty Preferences
```
Input:
  Query: "somewhere good"
  Preferences: []
  
LLM Decision:
  - No preferences to guide
  - Query is vague
  - Fallback: highest ratings + variety
  
Output:
  1. Le Bernardin - French (4.9⭐, $$$$)
     Reason: "Top-rated restaurant with excellent reviews"
  2. Nobu - Japanese (4.8⭐, $$$)
     Reason: "Highly acclaimed, different cuisine for variety"
  3. Carbone - Italian (4.7⭐, $$$)
```

### Example 3: Vague Query with Preferences
```
Input:
  Query: "food"
  Preferences: ["Mexican", "Spicy", "$$", "Casual"]
  
LLM Decision:
  - Query is vague
  - Has preferences → use them
  - Look for Mexican, casual, $$
  
Output:
  1. Taco Madness - Mexican (4.7⭐, $$)
     Reason: "Matches your Mexican preference, casual atmosphere, budget-friendly"
  2. Chili's Cantina - Mexican (4.5⭐, $$)
  3. Salsa Verde - Mexican/Fusion (4.6⭐, $$)
```

### Example 4: Group with Diverse Preferences
```
Input:
  Query: "dinner for 3"
  User A: ["Italian", "$$$"]
  User B: ["Japanese", "$$"]
  User C: ["Mexican", "$$"]
  Merged: ["Italian", "Japanese", "Mexican", "$$$"]
  
LLM Decision:
  - Group has diverse tastes
  - Look for places with variety
  - Or pick best from each cuisine
  
Output:
  1. Fusion Kitchen - Asian/Italian Fusion (4.7⭐, $$$)
     Reason: "Fusion menu accommodates Italian and Japanese preferences, $$$$ for all budgets"
  2. Carbone - Italian (4.8⭐, $$$)
     Reason: "Top-rated Italian to satisfy User A's preference"
  3. Nobu - Japanese (4.8⭐, $$$)
     Reason: "Excellent Japanese option for User B"
```

---

## Implementation Details

### Code Location
- File: `dashboard/backend/services/restaurant_search_service.py`
- Methods:
  - `search_restaurants()` - Lines 209-279 (individual)
  - `search_restaurants_for_group()` - Lines 410-490 (group)

### How It Works
1. **Backend checks preferences:**
   ```python
   has_preferences = bool(preferences.get('cuisines') or 
                          preferences.get('priceRange') or 
                          preferences.get('atmosphere') or 
                          preferences.get('flavorNotes'))
   ```

2. **Passes context to LLM:**
   ```python
   f"USER HAS {'MINIMAL' if not has_preferences else 'FULL'} PREFERENCES"
   ```

3. **LLM applies ranking rules:**
   - Identifies query intent
   - Checks for explicit requirements
   - Balances query vs preferences
   - Explains reasoning in response

---

## Benefits

1. **Flexibility:** Users can override their preferences anytime
2. **New User Friendly:** Works well even without preference history
3. **Smart Defaults:** Falls back to quality when uncertain
4. **Transparent:** Explanations show why each restaurant was chosen
5. **Group-Aware:** Special handling for group dynamics
6. **Context-Sensitive:** Adapts to different types of queries

---

## Testing Scenarios

### Test Case 1: Query Override
```bash
Query: "Chinese food"
Expected: Only Chinese restaurants, ignore other preferences
```

### Test Case 2: No Preferences
```bash
Query: "good food"
Preferences: (empty)
Expected: High-rated, diverse cuisines
```

### Test Case 3: Vague Query
```bash
Query: "eat"
Preferences: "Mexican, Spicy"
Expected: Mexican restaurants prioritized
```

### Test Case 4: Group Conflict
```bash
Query: "dinner"
Group: Italian + Japanese + Vegan
Expected: Fusion or diverse menus that work for all
```

---

## Future Enhancements

- [ ] Dietary restrictions handling (vegetarian, gluten-free, etc.)
- [ ] Distance preferences (willing to travel farther for specific cuisine)
- [ ] Time-based preferences (breakfast spots vs dinner restaurants)
- [ ] Occasion handling (date night, business lunch, family dinner)
- [ ] Budget flexibility (splurge occasionally vs always cheap)
- [ ] Negative preferences ("never show me seafood")

---

**Status:** ✅ Implemented and ready to test!

