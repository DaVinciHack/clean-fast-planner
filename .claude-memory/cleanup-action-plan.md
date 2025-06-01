# Fast Planner Cleanup Action Plan

## 🎯 PHASE 1: FIX IMMEDIATE DATA CORRUPTION (Priority 1)

### **Fix 1: Aircraft Registration Corruption**
**Problem:** `N109DR` becomes `N109DR (GULF OF MEXICO)` 
**Location:** Aircraft selection logic
**Fix:** Use `aircraft.assetIdentifier` for all searches, not display name

### **Fix 2: Fuel Flow Data Loss** 
**Problem:** `aircraft.flatPitchFuelBurnDeckFuel: 600` becomes `undefined`
**Location:** Data extraction pipeline
**Fix:** Trace where fuel flow data gets lost and preserve it

### **Fix 3: Policy Search Mismatch**
**Problem:** Searches for corrupted name instead of clean registration
**Location:** FuelPolicyService.js
**Fix:** Use clean registration + region for policy matching

### **Fix 4: Remove Norway Fallback**
**Problem:** Falls back to Norway when Gulf of Mexico should be used
**Location:** Policy selection logic
**Fix:** Error when correct policy not found, no fallbacks

## 🧹 PHASE 2: ARCHITECTURAL CLEANUP (Priority 2)

### **Cleanup 1: Remove Duplicate Aircraft Systems**
- Keep: useAircraft.js hook system
- Remove: Old AircraftContext system  
- Remove: Unused MainCard version

### **Cleanup 2: Consolidate Fuel Calculation**
- Standardize on: MasterFuelManager as single source
- Remove: Conflicting calculation paths
- Fix: Override priority order

### **Cleanup 3: Simplify Data Flow**
- Create: Clear call sequence documentation
- Remove: Redundant managers and hooks
- Fix: Race conditions between systems

## 📋 NEXT SESSION AGENDA

1. **Trace aircraft registration corruption** - find where region gets appended
2. **Trace fuel flow data loss** - find where flatPitchFuelBurnDeckFuel disappears  
3. **Fix policy search logic** - use clean data for matching
4. **Test fixes** - ensure Gulf of Mexico policy loads correctly

## 🚨 CRITICAL PRINCIPLES

- **No fallbacks** - Real OSDK data or error
- **Single source of truth** - One system per responsibility  
- **Clean data flow** - No data corruption between components
- **Aviation safety** - No misleading numbers that look correct

*Ready for implementation - system fully mapped and priorities clear*