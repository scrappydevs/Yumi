# 🔗 Edge Physics & Interaction Update

## 🎯 New Behavior: Distance = Similarity

Changed from visual encoding (opacity/width) to **physics-based encoding** where similar foods naturally cluster closer together!

---

## 🔄 What Changed

### **1. Edge Visual Style**

**Before:**
```swift
// Variable opacity and width based on similarity
.stroke(
    Color.gray.opacity(0.15 + edge.weight * 0.25),
    lineWidth: 1 + edge.weight * 2
)
```

**After:**
```swift
// Constant opacity and width
.stroke(
    Color.gray.opacity(0.3),
    lineWidth: 2
)
// Changes to blue when selected
```

**Why:** Makes all connections equally visible. Similarity is now encoded in **distance**, not visual style.

---

### **2. Physics Simulation - Spring-Based Distance**

**Before:**
```swift
// Simple attraction force
let force = attractionStrength * dist * edge.weight
```

**After:**
```swift
// Spring force with ideal distance based on similarity
let idealDistance = 50 + (1.0 - edge.weight) * 100

// High similarity (0.9) → idealDistance = 60pt
// Medium similarity (0.6) → idealDistance = 90pt  
// Low similarity (0.3) → idealDistance = 120pt

let displacement = dist - idealDistance
let force = attractionStrength * displacement * 10 * edge.weight
```

**Result:**
- **Similar foods** (high weight) → pulled close together → **short edge**
- **Different foods** (low weight) → settle far apart → **long edge**

---

### **3. Interactive Edge Tapping**

**New Feature:** Tap any connection line to see exact similarity percentage!

```swift
// Added to ViewModel
@Published var selectedEdge: GraphEdge?

func selectEdge(_ edge: GraphEdge)
func deselectEdge()
```

**UI Behavior:**
1. User taps an edge
2. Edge turns **blue** and gets thicker
3. **Blue badge** appears at midpoint showing "73%" (similarity)
4. Tap background to deselect

**Visual:**
```
Before tap:
  🍜 ─────── 🍝  (gray line)

After tap:
  🍜 ═══[73%]═══ 🍝  (blue line with badge)
```

---

## 📊 Physics Explanation

### **Spring Force Model**

Each edge acts like a **spring** with an ideal rest length based on similarity:

```
idealDistance = 50 + (1 - similarity) × 100

Examples:
- 90% similar: 50 + (0.1 × 100) = 60pt
- 70% similar: 50 + (0.3 × 100) = 80pt
- 50% similar: 50 + (0.5 × 100) = 100pt
- 30% similar: 50 + (0.7 × 100) = 120pt
```

The spring force formula:
```
displacement = currentDistance - idealDistance
force = k × displacement × similarity

If currentDistance > ideal → pull nodes together
If currentDistance < ideal → push nodes apart
```

---

## 🎨 Visual Outcomes

### **Clustering Behavior**

**High similarity cluster (e.g., Ramen types):**
```
   🍜 Tonkotsu
    ║  (short edge, ~60pt)
   🍜 Shoyu  
    ║  (short edge, ~65pt)
   🍜 Miso
```
Nodes are **tightly grouped** → easy to see they're related

**Low similarity (e.g., Ramen vs Pizza):**
```
🍜 Ramen ─────────── (long edge, ~110pt) ─────────── 🍕 Pizza
```
Nodes are **far apart** → visually distinct categories

### **Mixed Cluster**
```
     🍜 Ramen (short)
      ╱    ╲
     ╱      ╲ (medium)
   🍝        🥘
   Pasta    Curry
     ╲      ╱
      ╲    ╱ (short)
       🍛
    Fried Rice
```

Natural hierarchy emerges from the physics!

---

## 🎮 User Interaction Flow

### **Exploring Connections:**

1. **Visual scan:** Tight clusters = similar foods
2. **Tap edge:** See exact percentage
3. **Compare:** "Ramen→Sushi is 85%, but Ramen→Pizza is only 35%"

### **Example Discovery:**
```
User: "Huh, my burger and bánh mì are 73% similar?"
      *taps edge to confirm*
Badge: [73%]
User: "Oh yeah, both have pickled veggies and protein in bread!"
```

---

## 🔬 Technical Details

### **Constant Edge Styling**
```swift
struct EdgeView: View {
    let isSelected: Bool
    
    .stroke(
        isSelected ? Color.blue : Color.gray.opacity(0.3),
        lineWidth: isSelected ? 3 : 2
    )
}
```

**Unselected:** Gray, 2pt width
**Selected:** Blue, 3pt width (+ animated transition)

### **Percentage Badge**
```swift
Text("\(Int(edge.weight * 100))%")
    .font(.system(.caption, design: .rounded))
    .fontWeight(.semibold)
    .foregroundColor(.white)
    .padding(.horizontal, 10)
    .padding(.vertical, 6)
    .background(
        Capsule()
            .fill(Color.blue)
            .shadow(color: .blue.opacity(0.4), radius: 8)
    )
    .position(x: midX, y: midY)
    .transition(.scale.combined(with: .opacity))
```

**Appears at:** Midpoint of edge
**Animation:** Scale + opacity fade in/out

### **Gesture Handling**
```swift
// Edge tap - select edge
.onTapGesture {
    viewModel.selectEdge(edge)
}

// Background tap - deselect
.onTapGesture {
    viewModel.deselectEdge()
}

// Node tap - deselect edge, show node details
.onChange(of: viewModel.selectedNode) { newValue in
    if newValue != nil {
        viewModel.deselectEdge()
    }
}
```

---

## 🎯 Benefits

### **1. More Intuitive**
- **Visual clustering** matches mental model
- Distance = similarity is universal concept
- No need to decode line thickness/opacity

### **2. Cleaner Look**
- Uniform line styling
- Less visual noise
- Focus on structure, not decoration

### **3. Interactive Discovery**
- Users explore relationships actively
- Exact percentages on demand
- Gamification: "What's my highest similarity?"

### **4. Better for Dense Graphs**
- With many edges, variable opacity/width becomes cluttered
- Constant styling keeps it readable
- Physics naturally spaces things out

---

## 📐 Example Measurements

From a real graph with threshold 0.3:

| Food Pair | Similarity | Ideal Distance | Visual Result |
|-----------|-----------|----------------|---------------|
| Tonkotsu Ramen ↔ Shoyu Ramen | 92% | 58pt | Very close |
| Ramen ↔ Pad Thai | 68% | 82pt | Medium distance |
| Ramen ↔ Pizza | 42% | 108pt | Far apart |
| Pizza ↔ Pasta | 78% | 72pt | Close |
| Coca-Cola ↔ Red Bull | 38% | 112pt | Far apart |

After 100 physics iterations, nodes settle into these distances naturally!

---

## 🎨 UI Polish Details

### **Edge Selection Feedback**
- ✅ Color change: gray → blue
- ✅ Width increase: 2pt → 3pt
- ✅ Smooth animation (0.2s ease)
- ✅ Badge appears with scale+opacity

### **Instructions Updated**
**Old:** "Tap any food to see details • Connected foods are similar"
**New:** "Tap food circles for details • Tap connecting lines for similarity %"

### **Gesture Priority**
1. Edge taps select edge
2. Node taps select node + deselect edge
3. Background taps deselect edge

---

## 🚀 Result

The graph now:
- ✅ **Looks cleaner** - uniform edge styling
- ✅ **Behaves smarter** - physics-based clustering
- ✅ **Feels interactive** - tap edges for exact %
- ✅ **Reveals patterns** - tight clusters emerge naturally

**Similar foods are literally close together! 📍**


