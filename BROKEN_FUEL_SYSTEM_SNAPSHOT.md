# 🚨 BROKEN FUEL SYSTEM SNAPSHOT - BEFORE CLEANUP
**Date: July 2, 2025**
**Status: HEAVILY BROKEN - Multiple competing processes causing input field issues**

## **CRITICAL PROBLEMS IDENTIFIED:**

### **1. Multiple Competing State Systems in DetailedFuelBreakdown.jsx**
- Line 73: `const [userOverrides, setUserOverrides] = useState({});`
- Line 74: `const [fieldStates, setFieldStates] = useState({});` 
- Line 75: `const [isEditing, setIsEditing] = useState(null);`
- Line 76: `const [localStopCards, setLocalStopCards] = useState(stopCards);`

**PROBLEM**: 4 different state management systems all trying to track the same fuel input data, causing conflicts and "stuck" input fields.

### **2. Massive 212-Line handleFieldChange Function (Lines 287-499)**
**PROBLEM**: This monster function has duplicated logic and tries to manage too many responsibilities:
- State synchronization across 4 different systems
- Smart filtering for refuel stops vs VFR mode
- Multiple callback patterns
- Complex error handling

### **3. Complex Sync Logic with Competing Filters (Lines 176-263)**
```javascript
// Different filtering for IFR vs VFR modes
if (waiveAlternates) {
  // VFR MODE: Only reject if we lose ALL refuel data completely
  // ... complex logic
} else if (expectedRefuelStops.length > 0) {
  // IFR MODE: Use smart filtering to protect refuel stops
  // ... more complex logic
}
```
**PROBLEM**: Multiple concurrent systems trying to manage the same refuel stop data.

### **4. Input Field State Management Issues (Lines 546-696)**
**TinyInput Component Problems:**
- Complex local state with `isLocalEditing`
- Multiple value resolution systems (saved vs weather vs current)
- Inconsistent synchronization between components
- Values getting "stuck" when refuel stops are added/removed

### **5. Confusing Value Resolution (Lines 552-587)**
```javascript
const getSavedValue = () => {
  if (fieldType === 'araFuel') {
    // Check both old format and new segment-aware format
    let value = locationFuelOverrides[araKey]?.value || locationFuelOverrides[approachKey]?.value;
    // If not found, check all segment-aware keys for this stop
    if (value === undefined) {
      const segmentKeys = Object.keys(locationFuelOverrides).filter(key => 
        key.includes(stopName) && (key.includes('araFuel') || key.includes('approachFuel'))
      );
      // ... more complex logic
    }
  }
}
```
**PROBLEM**: Multiple overlapping systems for tracking the same fuel values.

## **WHAT'S STILL WORKING:**

### **✅ StopCardCalculator.js Core Math Engine**
- Accurate fuel calculations with aircraft performance data
- Proper wind adjustments
- Correct distance/time calculations
- Segment-aware calculations for refuel stops
- Aviation safety standards maintained

### **✅ Single Source of Truth Principle**
- All calculations go through StopCardCalculator
- No hardcoded fuel values
- Proper OSDK integration

## **USER REPORTED ISSUES:**

1. **ARA fuel input fields getting "stuck"** - can't clear values once entered
2. **Values not updating** when refuel stops are added/removed
3. **ARA fuel not appearing in summary cards** when refuel stops present
4. **Competing processes** making the system unreliable
5. **Messy codebase** that's hard to debug and maintain

## **ARCHITECTURAL PROBLEMS:**

### **Too Many Responsibilities in One Component**
DetailedFuelBreakdown.jsx (1211 lines) tries to do:
- User input collection
- State management (4 different systems)
- Data validation and filtering
- UI rendering
- Cross-component synchronization
- Passenger management (future)

### **No Clear Data Flow**
Current chaotic flow:
```
User Input → Multiple State Systems → Complex Sync Logic → Callbacks → Parent → StopCardCalculator → UI Update
```

**Should be:**
```
User Input → Single Fuel Manager → Parent Callback → StopCardCalculator → UI Update
```

## **RECOVERY PLAN:**

### **Phase 1: Create FuelInputManager Class**
- Replace 4 competing state systems with single source of truth
- Clean listener pattern for UI updates
- Eliminate synchronization conflicts

### **Phase 2: Simplify Input Components**
- Replace complex TinyInput with clean FuelInput
- Remove competing state management
- Fix "stuck" input field issues

### **Phase 3: Clean Up DetailedFuelBreakdown**
- Remove massive handleFieldChange function
- Eliminate complex sync logic
- Single responsibility: display and collect inputs

## **NOTES FOR RECOVERY:**
- **Keep UI layout** - cards are working well for display
- **Preserve passenger management capabilities** - will be needed
- **Don't break StopCardCalculator** - it's doing the math correctly
- **Maintain aviation safety standards** - no shortcuts

## **LAST WORKING STATE:**
Before trying to implement refuel-aware ARA fuel, the basic IFR mode was working. The problem started when trying to make ARA fuel segment-aware like approach fuel.

## **FILE STATUS:**
- DetailedFuelBreakdown.jsx: 🔴 BROKEN (multiple competing processes)
- StopCardCalculator.js: 🟢 WORKING (core math is solid)  
- EnhancedStopCardsContainer.jsx: 🟡 WORKING but dependent on broken input system

**PRIORITY**: Implement clean FuelInputManager to replace the 4 competing state systems and fix input field issues.