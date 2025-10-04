# 🍽️ Friends Network Graph - Setup Guide

## ✅ What's Been Created

### Backend Files
- ✅ `dashboard/backend/services/similarity_engine.py` - AI similarity computation using Gemini
- ✅ `dashboard/backend/routers/friends_graph.py` - API endpoints for graph data
- ✅ `dashboard/backend/main.py` - Updated with friends_graph router registration

### Frontend Files  
- ✅ `dashboard/frontend/app/(dashboard)/friends-graph/page.tsx` - Main page
- ✅ `dashboard/frontend/app/(dashboard)/friends-graph/FriendsGraphFlow.tsx` - ReactFlow component
- ✅ `dashboard/frontend/app/(dashboard)/friends-graph/index.css` - All styling
- ✅ `dashboard/frontend/app/(dashboard)/friends-graph/components/`:
  - `FriendNode.tsx` - Custom node component
  - `SimilarityEdge.tsx` - Custom edge with hover tooltips
  - `GraphMinimap.tsx` - Minimap visualization
  - `types/index.ts` - TypeScript types
  - `sidebar/GraphSidebar.tsx` - Filter & stats sidebar
  - `hooks/useGraphData.ts` - Data fetching hook
  - `hooks/useGraphLayout.ts` - Graph layout algorithm
- ✅ `dashboard/frontend/app/api/friends/graph/[userId]/route.ts` - Next.js API route

### Database
- ✅ You've already run the SQL schema

---

## 🚀 Final Setup Steps

### 1. Install Python Dependencies

```bash
cd Yummy/dashboard/backend
pip install scikit-learn google-generativeai numpy
```

Or add to `requirements.txt`:
```
scikit-learn==1.3.2
google-generativeai==0.3.2
numpy==1.24.3
```

### 2. Install Frontend Dependencies

```bash
cd Yummy/dashboard/frontend
npm install @xyflow/react lucide-react
```

### 3. Set Environment Variables

Add to `dashboard/backend/.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 4. Start Backend Server

```bash
cd Yummy/dashboard/backend
python -m uvicorn main:app --reload --port 8000
```

### 5. Start Frontend Server

```bash
cd Yummy/dashboard/frontend
npm run dev
```

---

## 🎯 Initial Data Setup

### Option A: Compute Profiles for All Users (Recommended)

Create a script: `dashboard/backend/scripts/compute_all_profiles.py`

```python
import asyncio
from supabase_client import get_supabase

async def compute_all_profiles():
    supabase = get_supabase()
    
    # Get all users
    result = supabase.table('profiles').select('id').execute()
    users = result.data
    
    print(f"Computing profiles for {len(users)} users...")
    
    for idx, user in enumerate(users):
        user_id = user['id']
        print(f"[{idx+1}/{len(users)}] Computing profile for {user_id}")
        
        try:
            supabase.rpc('compute_user_food_profile', {
                'p_user_id': user_id
            }).execute()
        except Exception as e:
            print(f"Error for {user_id}: {e}")
    
    print("✅ Done!")

if __name__ == "__main__":
    asyncio.run(compute_all_profiles())
```

Run it:
```bash
cd Yummy/dashboard/backend
python scripts/compute_all_profiles.py
```

### Option B: Compute On-Demand via API

For a specific user:
```bash
curl -X POST http://localhost:8000/api/friends/graph/{USER_ID}/compute
```

---

## 🧪 Testing the Graph

### 1. Visit the Graph Page

Navigate to: `http://localhost:3000/friends-graph`

### 2. You Should See:
- All your friends as nodes (circular avatars)
- Edges connecting friends (thicker = more similar)
- Your node highlighted with a purple gradient
- Sidebar with filters and stats

### 3. Interactions:
- **Hover over edges** → See AI-generated explanation of similarity
- **Click nodes** → Select them (future: open profile modal)
- **Use similarity slider** → Filter weak connections
- **Switch to Stats tab** → See network statistics

---

## 📊 How It Works

### Data Flow

```
1. User visits /friends-graph
   ↓
2. Frontend calls /api/friends/graph/{userId}
   ↓
3. Backend calls Supabase function get_friend_graph()
   ↓
4. Returns:
   - List of friends with profiles
   - Similarity scores between friends
   ↓
5. useGraphLayout hook positions nodes
   - Closer nodes = more similar
   - Force-directed layout
   ↓
6. ReactFlow renders:
   - FriendNode for each person
   - SimilarityEdge for each connection
   ↓
7. Hover edge → Show AI explanation via Gemini
```

### Similarity Computation

When you call `/api/friends/graph/{userId}/compute`:

1. **Fetch user reviews & food preferences**
2. **Compute similarity scores**:
   - 30% Cuisine overlap
   - 25% Restaurant overlap  
   - 25% Taste profile (sweet, spicy, savory, sour)
   - 15% Food item overlap
   - 5% Price preference
3. **Generate AI explanation** using Gemini:
   - "You both love Italian food and have similar savory preferences!"
4. **Cache for 7 days** in `friend_similarities` table

---

## 🎨 Customization

### Change Node Colors

Edit `dashboard/frontend/app/(dashboard)/friends-graph/index.css`:

```css
.friend-node.current-user {
  background: linear-gradient(
    135deg,
    rgba(255, 87, 51, 0.2) 0%,  /* Change this */
    rgba(251, 176, 59, 0.2) 100%  /* And this */
  );
}
```

### Adjust Layout Algorithm

Edit `useGraphLayout.ts`, function `calculateForceDirectedPosition`:

```typescript
const radius = 300;  // Increase for wider spread
const force = sim.similarity_score * 50;  // Increase for stronger attraction
```

### Change Similarity Weights

Edit `similarity_engine.py`, function `compute_similarity`:

```python
overall_score = (
    0.40 * cuisine_similarity +  # Increase cuisine weight
    0.30 * restaurant_similarity +
    0.20 * taste_similarity +
    0.10 * food_similarity +
    0.00 * price_similarity  # Ignore price
)
```

---

## 🐛 Troubleshooting

### Error: "No friends yet"
- Check if user has accepted friendships in `friendships` table
- Ensure `status = 'accepted'`

### Error: "Failed to fetch graph data"
- Check backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in frontend `.env`
- Look at backend console for Python errors

### Edges not showing
- Run compute endpoint to generate similarities
- Check `friend_similarities` table has data
- Ensure similarity scores > 0

### Slow AI explanations
- Gemini API may be rate-limited
- Check GEMINI_API_KEY is set correctly
- Fallback explanation will be used if API fails

### Nodes overlapping
- Increase radius in `useGraphLayout.ts`
- Adjust force strength
- Try different layout algorithm (D3-force, etc.)

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Click node → Open user profile modal
- [ ] Real-time updates via WebSockets
- [ ] 3D graph visualization
- [ ] Cluster detection (friend groups)
- [ ] Timeline view (similarity over time)
- [ ] Export graph as image
- [ ] Share graph view with friends

### Advanced Algorithms
- [ ] D3-force for better layouts
- [ ] Community detection (Louvain algorithm)
- [ ] PageRank for influential foodies
- [ ] Collaborative filtering recommendations

---

## 📚 Architecture Reference

This implementation follows **auctor-1's ReactFlow pattern**:
- ✅ ReactFlowProvider wrapper
- ✅ Custom node/edge components
- ✅ useNodesState / useEdgesState hooks
- ✅ Custom hooks for data & layout
- ✅ Liquid glass styling throughout
- ✅ Panel-based sidebar
- ✅ MiniMap with custom rendering
- ✅ TypeScript types for all components

Similar to auctor-1's diagram editor but adapted for social network visualization!

---

## 🎉 You're Done!

Visit: **http://localhost:3000/friends-graph**

Enjoy exploring your foodie friend network! 🍕🍜🍰

