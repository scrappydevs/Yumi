# 🚀 Quick Start - Food Graph Feature

## 📦 Installation (5 minutes)

### Step 1: Install Backend Dependencies
```bash
cd dashboard/backend
pip install sentence-transformers==2.2.2 numpy==1.24.0 scikit-learn==1.3.0
```

**Note**: First run will download the embedding model (~200MB). This is one-time and automatic.

### Step 2: Start Backend
```bash
python main.py
```

Wait for:
```
✅ Initialized with model: all-MiniLM-L6-v2 (dim=384)
🚀 Starting Aegis Backend API
```

### Step 3: Run iOS App
Open in Xcode and run on simulator or device. Done!

---

## 🎮 Testing the Feature

### If you already have reviews:
1. Open app → Tap **"Taste Profile"** (top-left)
2. Watch the graph animate and settle
3. Tap any food node to see details
4. Tap slider icon to adjust similarity threshold

### If starting fresh:
1. Review 3-5 different foods first
2. Then navigate to Taste Profile
3. You'll see connections between similar foods

---

## 🎨 What You'll See

```
┌─────────────────────────────────────┐
│  🍜 Ramen                           │
│   ╱ ╲                               │
│  ╱   ╲ (87% similar)                │
│ 🍕   🍝 Pasta                       │
│  ╲   ╱                              │
│   ╲ ╱                               │
│    🍔 Burger                        │
└─────────────────────────────────────┘

Nodes = Your foods
Lines = Similarity
Colors = Cuisine types
```

---

## 🎯 Demo Tips

**Best Impact:**
1. Show 3+ reviews in home feed
2. Navigate to Taste Profile
3. Point out cuisine clusters (e.g., "Look at my Asian food cluster!")
4. Tap a node → "Each node has full details"
5. Adjust slider → "Watch connections change"

**Talking Points:**
- "Uses AI embeddings to find semantic similarity"
- "Force-directed physics simulation for layout"
- "Real-time graph generation from my reviews"
- "Helps discover my hidden taste patterns"

---

## ⚡ Quick Commands

```bash
# Backend
cd dashboard/backend
python main.py

# Test graph endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/food-graph?min_similarity=0.5

# iOS
open aegis/aegis.xcodeproj
# Then ⌘R to run
```

---

## 🐛 Common Issues

**"Model not found" on first run**
→ Wait 2-3 min for automatic download

**"No reviews found"**
→ Submit at least 2 reviews first

**Backend connection error**
→ Check `NetworkService.swift` has correct IP (line 16)

---

**You're ready to demo! 🎉**

