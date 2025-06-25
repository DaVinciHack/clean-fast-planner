# 🛩️ REFUEL STOPS IMPLEMENTATION PLAN

## 🎯 CURRENT STATUS - PHASE 1 COMPLETE ✅

### **What's Working:**
- ✅ **Tiny refuel checkbox** added to intermediate stop cards only
- ✅ **Perfect visual integration** - maintains amazing card design  
- ✅ **State management** working - `refuelStops` array tracks checked stops
- ✅ **Console logging** - checkbox changes logged for debugging
- ✅ **Smart visibility** - no checkbox on departure/arrival cards

### **Files Modified:**
- **StopCard.jsx** - Added refuel checkbox UI after location name
- **EnhancedStopCardsContainer.jsx** - Added refuel state management

### **Current Visual Result:**
```
1  VR212 ☑️ refuel          -3.5 kts
📍 74.7 nm   ⏰ 00:31   ⛽ 1857 lbs  
Trip:1249 Cont:0 Deck:133 Res:475
```

## 🚀 NEXT IMPLEMENTATION PHASES

### **PHASE 2: Wire Up Fuel Recalculation Logic**
**Status:** Ready to implement
**Location:** `EnhancedStopCardsContainer.jsx`

**Implementation:**
1. **Modify `handleRefuelChange` function** to trigger fuel recalculation when checkbox changes
2. **Update the main useEffect** that calls `StopCardCalculator.calculateStopCards()` 
3. **Pass refuel stops array** to calculation logic

**Code Pattern:**
```javascript
// In handleRefuelChange function, add:
// After updating refuelStops state, trigger recalculation
setForceRecalculation(prev => prev + 1);

// In main useEffect dependency array, add:
}, [...existing deps, refuelStops, forceRecalculation]);
```

### **PHASE 3: Add "Waive Alternates" Checkbox**
**Status:** Ready to implement
**Location:** `EnhancedStopCardsContainer.jsx` (top of stop cards section)

**Implementation:**
1. **Add state:** `const [waiveAlternates, setWaiveAlternates] = useState(false);`
2. **Add checkbox UI** above stop cards with label "Waive Alternates (VFR)"
3. **Conditional alternate calculation** - skip if waived
4. **Update `alternateStopCard` useEffect** to check waive flag

**Visual Target:**
```
┌─────────────────────────────────────┐
│ ☐ Waive Alternates (VFR Day Flying) │
├─────────────────────────────────────┤
│ ROUTE STOPS (UNIFIED FUEL)          │
│ [Stop cards below...]               │
└─────────────────────────────────────┘
```

### **PHASE 4: Segmented Fuel Calculations**
**Status:** Needs planning
**Location:** `StopCardCalculator.js`

**Core Logic:**
- **Input:** Array of refuel stop indices
- **Process:** Split route into segments at refuel points
- **Calculate:** Each segment separately using existing logic
- **Result:** Different fuel amounts per segment

**Segmentation Example:**
```
Route: KPTN → VR212(refuel) → EI320 → ST21-2 → KPTN

Becomes 2 calculations:
Segment 1: KPTN → VR212 (minimal fuel to arrive with reserves)
Segment 2: VR212 → EI320 → ST21-2 → KPTN (full calculation from VR212)
```

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### **Key Files & Responsibilities:**
1. **StopCard.jsx** - UI component with refuel checkbox ✅
2. **EnhancedStopCardsContainer.jsx** - State management & calculation triggering
3. **StopCardCalculator.js** - Core fuel calculation logic (needs segmentation)

### **Data Flow:**
```
User clicks refuel checkbox
  ↓
handleRefuelChange updates refuelStops state  
  ↓
useEffect detects refuelStops change
  ↓
Calls StopCardCalculator with refuel info
  ↓
Calculator splits route into segments
  ↓
Returns segmented fuel calculations
  ↓
UI displays updated fuel amounts
```

### **State Structure:**
```javascript
// Current working state in EnhancedStopCardsContainer
const [refuelStops, setRefuelStops] = useState([]); // [1, 3] = stops 1&3 are refuel
const [waiveAlternates, setWaiveAlternates] = useState(false); // TODO: Add this
```

## 🚨 CRITICAL CONSIDERATIONS

### **Aviation Safety:**
- **Minimum fuel rules** - never go below regulatory minimums
- **Segment validation** - each segment must be valid independently  
- **Emergency reserves** - maintain ability to return from any point

### **Calculation Logic:**
- **Deck fuel handling** - already correct (all intermediate stops get deck fuel)
- **Existing patterns** - leverage current calculation structure
- **Error handling** - fail safely if segmentation creates invalid routes

### **User Experience:**
- **Live updates** - immediate fuel recalculation on checkbox change
- **Clear indicators** - visual separation of fuel segments
- **Intuitive workflow** - plan route first, then optimize with refuel

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 2 - Fuel Recalculation:**
- [ ] Add forceRecalculation state trigger
- [ ] Modify handleRefuelChange to trigger calculation
- [ ] Update useEffect dependencies
- [ ] Test checkbox triggers recalculation
- [ ] Validate existing fuel logic still works

### **Phase 3 - Waive Alternates:**
- [ ] Add waiveAlternates state
- [ ] Add checkbox UI above stop cards
- [ ] Modify alternate card useEffect
- [ ] Test alternate card disappears when waived
- [ ] Ensure alternate reappears when un-waived

### **Phase 4 - Segmented Calculations:**
- [ ] Design segmentation algorithm
- [ ] Modify StopCardCalculator.calculateStopCards()
- [ ] Add refuel stops parameter handling
- [ ] Implement segment splitting logic
- [ ] Test each segment calculates correctly
- [ ] Validate fuel amounts make sense

### **Phase 5 - Testing & Validation:**
- [ ] Test various refuel combinations
- [ ] Verify minimum fuel compliance
- [ ] Test edge cases (first stop refuel, last stop refuel)
- [ ] Validate passenger capacity updates with lower fuel
- [ ] Performance testing with multiple refuel stops

## 🎯 SUCCESS CRITERIA

### **Functional Requirements:**
- ✅ Refuel checkbox appears only on intermediate stops
- ✅ Checkbox state persists during session
- [ ] Fuel amounts recalculate when refuel toggled
- [ ] Segmented calculations show correct fuel per segment
- [ ] Passenger capacity updates with reduced fuel loads
- [ ] Waive alternates removes alternate calculations

### **User Experience:**
- ✅ Maintains beautiful existing card design
- ✅ Intuitive checkbox placement and labeling
- [ ] Immediate visual feedback on changes
- [ ] Clear indication of fuel segments
- [ ] Smooth interaction without performance issues

### **Safety Compliance:**
- [ ] Never allows fuel below regulatory minimums
- [ ] Maintains emergency return capability
- [ ] Clear error messages for invalid configurations
- [ ] Validates all segments independently

## 💾 COMMIT STRATEGY

**Current Saved State:**
- ✅ Weather station wind arrows (committed & pushed)
- ✅ Aviation fuel safety fixes (committed & pushed)  
- ✅ Refuel checkbox UI (needs commit)

**Next Commits:**
1. **Refuel UI Complete** - commit current checkbox implementation
2. **Waive Alternates** - commit VFR checkbox feature
3. **Segmented Calculations** - commit core fuel logic changes
4. **Testing & Polish** - commit final refinements

## 🤝 HANDOFF NOTES

### **What's Ready:**
- All UI foundation is in place and working beautifully
- State management structure is correct
- Integration points identified and documented

### **What Needs Work:**
- Core segmentation logic in StopCardCalculator
- Waive alternates checkbox addition
- Testing of various refuel scenarios

### **Key Insights:**
- Existing fuel calculation logic is solid - build on it, don't replace it
- Cards look amazing - minimal changes preserve the design
- Gulf VFR operations need flexibility - this feature provides it safely

**Remember:** This is aviation software - lives depend on accuracy. Test thoroughly, fail safely, never guess on fuel calculations.