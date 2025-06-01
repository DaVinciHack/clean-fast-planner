# Fast Planner System Architecture Map

## 🚨 CURRENT BROKEN STATE (As of June 1, 2025)

### **CORE PROBLEM IDENTIFIED:**
- Region: "Gulf of Mexico" loads correctly ✅
- Aircraft: N109DR data available with `flatPitchFuelBurnDeckFuel: 600` ✅
- **BUT**: System falls back to Norway policy instead of Gulf of Mexico ❌
- **AND**: Aircraft registration gets corrupted: `N109DR` → `N109DR (GULF OF MEXICO)` ❌
- **AND**: Fuel flow data lost: `flatPitchFuelBurnDeckFuel: undefined` ❌

---

## 📊 COMPLETE SYSTEM MAP

### **1. MAIN APPLICATION CONTROLLER**
```
FastPlannerApp.jsx (1591 lines)
├── useManagers() hook → Creates all manager instances
├── useAircraft() hook → Aircraft selection logic
├── useRegion() → Region management
└── Components:
    ├── LeftPanel
    ├── RightPanel → Contains MainCard
    ├── MapComponent
    └── AppHeader
```

### **2. AIRCRAFT SYSTEM (Multiple Overlapping Systems)**
```
🔴 PROBLEM: Multiple aircraft selection systems conflict

A) useAircraft.js Hook (365 lines)
   ├── setSelectedAircraft()
   ├── changeAircraftType()
   ├── changeAircraftRegistration() ← CORRECT FUNCTION
   └── Aircraft state management

B) AircraftManager.js (1384 lines) 
   ├── loadAircraftByRegion()
   ├── groupAircraftByType()
   └── Aircraft data OSDK queries

C) AircraftContext (OLD SYSTEM - SHOULD BE REMOVED)
   ├── Legacy aircraft selection
   └── Conflicts with new system

D) MainCard Components (2 VERSIONS)
   ├── /components/cards/MainCard.jsx ← Uses old AircraftContext
   ├── /panels/cards/MainCard.jsx ← Uses proper props
   └── Only ONE should be active!
```

### **3. FUEL POLICY SYSTEM**
```
A) FuelPolicyService.js
   ├── loadPoliciesForRegion(region)
   ├── selectDefaultPolicyForAircraft(aircraft)
   └── OSDK policy queries

B) MasterFuelManager.js (631 lines)
   ├── extractPolicyValues() 
   ├── calculateStopCards()
   ├── updateAircraft() ← Receives aircraft
   ├── updateOverrides() ← Receives user settings
   └── Single source of truth attempt

C) AppSettingsManager.js 
   ├── Stores user overrides in localStorage
   ├── Triggers callbacks on changes
   └── 🔴 RACE CONDITION: Overwrites OSDK values
```

### **4. FUEL CALCULATION SYSTEM**
```
A) StopCardCalculator.js (1290 lines)
   ├── calculateStopCards() ← Main calculation
   ├── Uses aircraft.flatPitchFuelBurnDeckFuel ← Should be 600
   ├── Falls back to options.deckFuelFlow ← Currently 9999
   └── 🔴 PROBLEM: Using fallback instead of aircraft data

B) PassengerCalculator.js
   ├── calculatePassengers()
   └── Passenger-related calculations

C) EnhancedStopCardsContainer.jsx (241 lines)
   ├── useMasterFuelManager() hook
   ├── Applies user overrides to manager
   └── Displays calculated stop cards
```

### **5. REGIONAL SYSTEM**
```
A) RegionContext
   ├── currentRegion state
   └── Region selection logic

B) RegionManager.js
   ├── Regional data management
   └── OSDK region queries
```

---

## 🔍 DATA CORRUPTION POINTS IDENTIFIED

### **Problem 1: Aircraft Registration Corruption**
```
✅ OSDK Data: aircraft.assetIdentifier = "N109DR"
❌ Display Logic: Shows "N109DR (GULF OF MEXICO)"  
❌ Policy Search: Uses corrupted name instead of clean registration
```

### **Problem 2: Fuel Flow Data Loss**
```
✅ OSDK Data: aircraft.flatPitchFuelBurnDeckFuel = 600
❌ StopCardCalculator: Receives undefined
❌ Falls back to: 9999 (user override) or 400 (hardcoded)
```

### **Problem 3: Policy Search Mismatch**
```
✅ Region: "GULF OF MEXICO" 
❌ Aircraft Search: "n109dr (gulf of mexico)" (corrupted)
❌ Result: Falls back to Norway policy
```

### **Problem 4: Multiple Override Sources**
```
1. OSDK Policy → Correct values
2. AppSettingsManager → localStorage overrides 
3. User Form Inputs → Runtime overrides
4. MasterFuelManager → Combines all sources
5. 🔴 RACE CONDITION: Wrong priority order
```

---

## 🎯 CALL SEQUENCE ANALYSIS

### **Aircraft Selection Flow (CURRENT)**
```
1. User selects aircraft in MainCard
2. MainCard calls: onAircraftRegistrationChange(registration)
3. FastPlannerApp: changeAircraftRegistration(registration)
4. useAircraft: setSelectedAircraft(aircraft) 
5. useAircraft: Updates aircraft state
6. 🔴 BREAK: Aircraft object gets corrupted somewhere
7. EnhancedStopCardsContainer: updateAircraft(corruptedAircraft)
8. MasterFuelManager: Receives aircraft without flatPitchFuelBurnDeckFuel
9. StopCardCalculator: Falls back to 9999
```

### **Policy Loading Flow (CURRENT)**
```
1. Region selected: "Gulf of Mexico"
2. FuelPolicyService: loadPoliciesForRegion("GULF OF MEXICO")
3. ✅ Loads correct Gulf policies
4. Aircraft selected: "N109DR (GULF OF MEXICO)" ← CORRUPTED NAME
5. FuelPolicyService: selectDefaultPolicyForAircraft(corruptedName)
6. ❌ Search fails for corrupted name
7. ❌ Falls back to Norway policy
```

---

## 🧹 CLEANUP PRIORITIES

### **IMMEDIATE FIXES NEEDED:**
1. **Fix aircraft registration corruption** - use clean assetIdentifier
2. **Fix fuel flow data extraction** - ensure flatPitchFuelBurnDeckFuel is preserved
3. **Fix policy search** - use clean registration + region
4. **Remove conflicting aircraft systems** - standardize on one approach

### **ARCHITECTURAL ISSUES:**
1. **Too many managers** - consolidate overlapping systems
2. **Unclear data flow** - standardize the call sequence
3. **Race conditions** - fix override priority order
4. **Dead code** - remove unused components

---

## 🚀 PROPOSED CLEAN ARCHITECTURE

### **Target State:**
```
FastPlannerApp (Main Controller)
├── Single Aircraft Manager → Clean OSDK data
├── Single Policy Manager → Region + Aircraft → Policy
├── Single Fuel Calculator → Policy + Aircraft + Overrides → Results
└── Display Components → Read-only, no logic
```

### **Clean Data Flow:**
```
1. REGION SELECTION → Regional policies loaded
2. AIRCRAFT SELECTION → Clean aircraft data + policy match
3. USER OVERRIDES → Applied to calculator only
4. CALCULATIONS → Single source, no fallbacks
5. DISPLAY UPDATE → All components updated consistently
```

---

## 📝 SESSION HANDOFF TEMPLATE

**CURRENT STATUS:** System mapped, core issues identified
**NEXT STEPS:** Begin architectural cleanup
**KEY PRINCIPLE:** No fallbacks, only real OSDK data or errors
**DANGER ZONES:** Aircraft registration corruption, policy search mismatch

**FILES TO FOCUS ON:**
- Aircraft selection logic (useAircraft.js)
- Policy search (FuelPolicyService.js) 
- Data extraction (StopCardCalculator.js)
- Override management (MasterFuelManager.js)

---

*Last Updated: June 1, 2025*
*Status: System mapped, ready for cleanup*