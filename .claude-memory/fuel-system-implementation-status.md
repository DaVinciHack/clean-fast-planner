# Fuel System Implementation Status & AppSettingsManager Fix

## 🚨 **CRITICAL ISSUE IDENTIFIED AND BEING FIXED**

### **Root Cause Found:**
- **AppSettingsManager race condition**: Storing fuel policy values in localStorage
- **Override conflict**: OSDK policy values (10%) being overwritten by stored defaults (0%)
- **Systemic problem**: Affects ALL fuel values (contingency, reserve, taxi, deck fuel)

### **Evidence from Console Logs:**
```
✅ First calculation: contingencyFuelPercent: 10 (from OSDK policy)
❌ Second calculation: contingencyFuelPercent: 0 (from AppSettingsManager override)
```

### **Problem Flow:**
1. User changes passenger weight → Correct OSDK calculation (10%) ✅
2. AppSettingsManager updates → Triggers callback with stored values ❌  
3. Stored values override OSDK policy → Calculation uses wrong values (0%) ❌

## 🎯 **SOLUTION: Separate User Inputs from Fuel Policy**

### **Aviation-Compliant Behavior Required:**
- **Fresh flight = Fresh fuel policy values** (no stale overrides)
- **Aircraft change = Reset all fuel overrides** 
- **Region change = New OSDK policy applied**
- **User overrides = Flight-specific only** (not persisted globally)

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Clean AppSettingsManager ✅ IN PROGRESS**
1. **Remove fuel policy from defaults**
2. **Update callback mechanism** - Only send user inputs
3. **Test elimination of race condition**

### **Phase 2: Implement Flight-Specific Overrides**
1. **Create override storage system** (in-memory, not localStorage)
2. **Add reset triggers** for aircraft/flight changes  
3. **Route fuel overrides** through MasterFuelManager

## 🔧 **CURRENT STATUS**
- ✅ Renamed wrong SettingsCard to .old
- ✅ Identified AppSettingsManager race condition 
- 🔄 Cleaning AppSettingsManager defaults
