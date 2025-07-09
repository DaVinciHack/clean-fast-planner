# Mapbox Line Drag Test

## 🎯 Purpose
This is an isolated test to debug the elastic band drag functionality for both desktop and iPad touch devices.

## 🚀 How to Run

### Option 1: Local File (Desktop Only)
```bash
# Navigate to the test folder
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/drag-test

# Open in browser (or just double-click index.html)
open index.html
```

### Option 2: Server Mode (Desktop + iPad)
```bash
# Navigate to the test folder
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/drag-test

# Start the test server
python3 server.py
```

The server will show you:
- **Local URL**: `http://localhost:8081` (for testing on your Mac)
- **iPad URL**: `http://YOUR_IP:8081` (for testing on iPad - same WiFi required)

### Testing Steps:
1. **Desktop Test**: Open the local URL first to verify it works
2. **iPad Test**: Use the IP address URL on your iPad
3. **Try dragging**: Drag from the MIDDLE of line segments (not the ends)

## 📱 iPad Access
- Make sure your iPad is on the same WiFi network as your Mac
- Use the IP address shown by the server (e.g., `http://192.168.1.100:8081`)
- The test should load the same as on desktop

## 📱 Testing Approach
The test implements **two different approaches** simultaneously:

### Approach 1: Mapbox Native Events
- Uses `map.on('touchstart', 'line', handler)`
- Should be the "proper" way according to Mapbox docs
- **This is what we want to work**

### Approach 2: DOM Touch Events
- Uses `canvas.addEventListener('touchstart', handler, { passive: false })`
- Fallback approach with explicit passive:false configuration
- **This is our backup plan**

## 🔍 Debug Information
The test provides real-time debug information:
- **Green status bar**: Shows current action
- **Debug panel**: Shows technical details and which approach is being used
- **Console logs**: Detailed information for debugging

## 🎨 Visual Feedback
- **Red line**: Normal state
- **Pink line**: Mouse hover
- **Green line**: Currently being dragged
- **Thicker touch area**: Invisible 20px wide touch target for easier mobile interaction

## 📊 What We're Testing
1. **Event Detection**: Do touch events reach our handlers?
2. **preventDefault()**: Can we prevent page scrolling during drag?
3. **Coordinate Conversion**: Are touch coordinates converted correctly?
4. **Line Updates**: Does the line add points vs create new segments?

## 🔧 Configuration
- Uses FastPlanner's actual Mapbox token
- Gulf Coast location (like FastPlanner)
- Satellite imagery with street overlay
- Touch-optimized CSS settings

## 🐛 Expected Behaviors

### ✅ Working (Desktop):
- Hover changes cursor and line color
- Click and drag adds new waypoint to line
- Line updates smoothly during drag

### ❓ Testing (iPad):
- Touch should be detected on the line
- Drag should add waypoint (not create new segment at end)
- Page should not scroll during drag
- Debug info should show which approach works

## 📝 Next Steps
Based on test results:
1. **If Mapbox events work**: Implement in main codebase
2. **If DOM events work**: Use DOM approach with passive:false
3. **If neither work**: Investigate coordinate/detection issues
4. **If both work**: Choose Mapbox approach as primary

## 🚨 Known Issues from FastPlanner
- Route line disappears during drag on iPad
- Creates new segments instead of dragging existing route
- Complex touch timing conflicts
- Mouse dragging breaks when implementing touch

This test aims to solve these issues in isolation before applying to the main codebase.
