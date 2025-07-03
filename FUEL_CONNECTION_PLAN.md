# FUEL CONNECTION IMPLEMENTATION PLAN
*Aviation Software - No Mistakes Allowed*

## **📋 UPDATED IMPLEMENTATION PLAN - Phase 1: Fuel Connection**

### **CURRENT WORKING COMPONENTS:**
✅ **CleanDetailedFuelBreakdown** - User inputs, segmentation logic working  
✅ **SegmentFuelManager** - Proper fuel segmentation architecture  
✅ **FuelInputManager** - Single source of truth for fuel data  
✅ **EnhancedStopCardsContainer** - Calls StopCardCalculator (single calculation point)  
✅ **StopCardCalculator** - Has getLocationFuel() function that uses overrides  

### **THE PROBLEM:**
❌ **Fuel overrides not reaching StopCardCalculator** due to prop chain issues

### **SOLUTION ARCHITECTURE:**
Instead of prop passing, implement **Direct Callback Pattern**:

```
CleanDetailedFuelBreakdown → Direct Callback → EnhancedStopCardsContainer → StopCardCalculator
```

### **IMPLEMENTATION STEPS:**

#### **Step 1: Create Direct Communication Channel**
- Add `onFuelOverridesChanged` callback to EnhancedStopCardsContainer
- Pass this callback through MainCard → RightPanel → FastPlannerApp → CleanDetailedFuelBreakdown
- This callback will trigger **immediate recalculation** with new overrides

#### **Step 2: Race Condition Prevention**
- Use `useCallback` with stable dependencies
- Add debouncing (100ms) to prevent rapid recalculations
- Use refs to store latest overrides to avoid stale closures
- Ensure single update per input change

#### **Step 3: State Management**
- EnhancedStopCardsContainer stores fuel overrides in local state
- Updates trigger immediate StopCardCalculator.calculateStopCards call
- Results flow to displayStopCards and up to header totals

#### **Step 4: Verification**
- Real-time fuel total updates in stop cards
- Header totals reflect fuel changes
- No race conditions or double calculations

### **CRITICAL RACE CONDITION SAFEGUARDS:**
1. **Single Source Updates** - Only EnhancedStopCardsContainer calls StopCardCalculator
2. **Debounced Inputs** - Prevent rapid-fire calculations
3. **Ref-based Storage** - Avoid stale closure issues
4. **Dependency Validation** - Ensure all required data before calculation

---

## **CURRENT STATUS:**
- **STARTING**: Step 1 - Create Direct Communication Channel
- **CONTEXT**: User can type fuel values and see them in UI, but totals don't update
- **ARCHITECTURE**: EnhancedStopCardsContainer is receiving empty `{}` for locationFuelOverrides instead of actual values like `{KHUM_approachFuel: {value: 200}}`

## **NEXT ACTION:**
Implement Step 1 - Add direct callback from CleanDetailedFuelBreakdown to EnhancedStopCardsContainer to bypass prop chain issues.