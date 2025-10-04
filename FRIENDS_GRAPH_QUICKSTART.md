# Friends Network Graph - Quick Start 🚀

## ✅ Already Done!

The friends network graph is **integrated and working** in the Friends page as the "Network" tab.

## What You Have

1. ✅ **Frontend Integration** - Graph as a tab in `/friends` page
2. ✅ **Backend Working** - Uses existing `profiles.friends` array
3. ✅ **Basic Visualization** - Shows all friends with connections
4. ✅ **Liquid Glass Styling** - Beautiful macOS-inspired UI
5. ✅ **ReactFlow** - Following auctor-1 best practices

## How to Use

1. **Navigate to Friends Page**: Go to `/friends` in your Yummy app
2. **Click "Network" Tab**: Fourth tab with network icon
3. **See Your Friend Graph**: Interactive visualization with:
   - Your node in center (highlighted in purple)
   - Friend nodes around you
   - Connections showing relationships
   - Hover over edges for info
   - Click nodes to navigate to profiles

## Current State

### ✅ Working Now (No Setup Needed)
- Basic friend graph visualization
- Force-directed layout
- Interactive nodes and edges
- Default similarity scores (0.5 for all friends)
- Mutual friends counting
- Google avatar images (configured in `next.config.ts`)

### 🔧 Optional: Advanced Features

If you want **AI-powered similarity explanations** and **food preference matching**, you need to:

1. **Create Database Tables** (see `database/friend_graph_schema.sql`)
2. **Set Up Gemini API Key**
3. **Run Similarity Computation**

---

## Optional: Enable AI-Powered Similarities

### Step 1: Install Python Dependencies

```bash
cd dashboard/backend
pip install scikit-learn google-generativeai numpy
```

### Step 2: Set Gemini API Key

Add to `dashboard/backend/.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get key from: https://makersuite.google.com/app/apikey

### Step 3: Create Database Tables

Run the SQL in `database/friend_graph_schema.sql` in your Supabase SQL editor.

This creates:
- `friend_similarities` table
- `user_food_profiles` table  
- PostgreSQL functions for computing profiles

### Step 4: Compute Similarities

For each user who wants advanced features:

```bash
curl -X POST http://localhost:8000/api/friends/graph/{USER_ID}/compute
```

Or create a script to do all users:

```python
import requests

user_ids = ["user-1-id", "user-2-id", "user-3-id"]

for user_id in user_ids:
    response = requests.post(
        f"http://localhost:8000/api/friends/graph/{user_id}/compute"
    )
    print(f"User {user_id}: {response.json()}")
```

### Step 5: Refresh Graph

The graph will now show:
- **AI-generated explanations** when hovering edges
- **Variable edge thickness** based on actual similarity
- **Smarter positioning** (more similar friends closer together)

---

## Architecture Notes (Following auctor-1)

### ReactFlow Pattern
```typescript
// Main flow component (uses hooks)
function FriendsGraphFlow() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  // ... graph logic
  return <ReactFlow ... />;
}

// Wrapper with provider
function FriendsGraphWrapper() {
  return (
    <ReactFlowProvider>
      <FriendsGraphFlow />
    </ReactFlowProvider>
  );
}

export default FriendsGraphWrapper;
```

### Dynamic Import (Avoid SSR Issues)
```typescript
const FriendsGraphFlow = dynamic(
  () => import('../friends-graph/FriendsGraphFlow'),
  { ssr: false }
);
```

### Image Configuration
```typescript
// next.config.ts
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'lh3.googleusercontent.com', // Google avatars
    },
  ],
}
```

---

## Troubleshooting

### "Loading friend network..." forever?
- Check that backend is running on port 8000
- Verify user has friends in their `profiles.friends` array
- Check browser console for errors

### Images not loading?
- ✅ Already fixed! Google hostnames are configured in `next.config.ts`
- Make sure you restart Next.js after config changes

### Duplicate key errors?
- ✅ Already fixed! Edge IDs use `source-target` format
- Types updated to match backend response

### Graph looks disconnected?
- This is normal! It means you don't have computed similarities yet
- Either run the compute endpoint or it will show default connections

---

## What's Next?

1. **Add more friends** to see a richer graph
2. **Optional**: Set up AI similarities for better insights
3. **Customize styling** in `index.css` for your brand
4. **Add features**: 
   - Click nodes to view profiles (already works!)
   - Filter by similarity score
   - Search within graph
   - Export graph as image

Enjoy your beautiful friend network graph! 🎨✨

