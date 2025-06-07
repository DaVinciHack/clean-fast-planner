# Fast Planner Fuel System Implementation Plan

## 🎯 **Overview**
Complete the integration of the enhanced fuel system into Fast Planner, including weather-based fuel calculations, policy integration, and dedicated fuel management UI.

## 📋 **Phase 1: OSDK Update & Integration (Priority 1)**

### **1.1 Update OSDK** ⏱️ *Immediate*
- [ ] **Download new OSDK** with `flatPitchFuelBurnDeckFuel` and `deckFuelTime` fields
- [ ] **Replace existing OSDK** in Fast Planner project
- [ ] **Update import paths** if necessary
- [ ] **Test OSDK connection** to ensure new fields are available

### **1.2 Test Enhanced Fuel Managers** ⏱️ *30 minutes*
- [ ] **Test EnhancedFuelManager** with new OSDK
- [ ] **Verify weather fuel analysis** works with real data
- [ ] **Confirm stop card distribution** logic
- [ ] **Test manual override functionality**

## 📋 **Phase 2: Fuel Policy Integration (Priority 2)**

### **2.1 Create FuelPolicyLoader** ⏱️ *2 hours*
- [ ] **Create FuelPolicyLoader.js** in `/modules/fuel/`
- [ ] **OSDK integration** for policy queries
- [ ] **Aircraft-specific policy loading** by aircraftId + region
- [ ] **Error handling** for missing policies
- [ ] **Caching** for loaded policies

### **2.2 Enhanced Settings Manager** ⏱️ *3 hours*
- [ ] **Extend AppSettingsManager.js** with policy integration
- [ ] **Auto-populate settings** from loaded fuel policies
- [ ] **Track policy vs user overrides** clearly
- [ ] **Validate overrides** against aircraft constraints
- [ ] **Policy change detection** and settings update

### **2.3 Aircraft Change Handler** ⏱️ *1 hour*
- [ ] **Detect aircraft/region changes** in AircraftManager
- [ ] **Trigger policy reload** when aircraft changes
- [ ] **Update settings page** with new policy defaults
- [ ] **Preserve valid user overrides** across changes
- [ ] **Recalculate fuel** with new settings

## 📋 **Phase 3: Dedicated Fuel Tab (Priority 3)**

### **3.1 Repurpose Evacuation Tab** ⏱️ *1 hour*
- [ ] **Rename evacuation tab** to "Fuel" in main navigation
- [ ] **Update tab routing** and component references
- [ ] **Remove evacuation content** (save backup)
- [ ] **Create fuel tab placeholder** structure

### **3.2 Create Fuel Tab Components** ⏱️ *4 hours*

#### **PolicySection.jsx**
- [ ] **Display active policy** name and details
- [ ] **Show policy source** (flight → aircraft → default)
- [ ] **Policy defaults display** with clear labels
- [ ] **Override controls** for each fuel component

#### **ManualModeSection.jsx**
- [ ] **Weather failure detection** and manual mode toggle
- [ ] **Manual fuel inputs** with validation
- [ ] **Safety warnings** for manual overrides
- [ ] **Manual calculation display**

#### **ComparisonSection.jsx**
- [ ] **Import Palantir fuel** capability
- [ ] **Side-by-side comparison** table
- [ ] **Discrepancy highlighting** with tolerances
- [ ] **Discrepancy analysis** and explanations

### **3.3 Fuel Tab Integration** ⏱️ *2 hours*
- [ ] **Connect to EnhancedFuelManager**
- [ ] **Real-time updates** when route changes
- [ ] **Settings synchronization** between tabs
- [ ] **Weather segment integration**

## 📋 **Phase 4: Enhanced Settings Page (Priority 4)**

### **4.1 Settings Page Restructure** ⏱️ *3 hours*
- [ ] **Policy defaults section** (read-only display)
- [ ] **User overrides section** with clear indicators
- [ ] **Override vs default highlighting** (colors/icons)
- [ ] **Reset to policy defaults** functionality
- [ ] **Validation feedback** for override values

### **4.2 Settings Integration** ⏱️ *2 hours*
- [ ] **Connect to FuelPolicyLoader**
- [ ] **Auto-populate on aircraft change**
- [ ] **Save override preferences** locally
- [ ] **Sync with fuel calculations** in real-time
- [ ] **Export settings** for backup/sharing

## 📋 **Phase 5: Stop Card Integration (Priority 5)**

### **5.1 Replace Stop Card Calculator** ⏱️ *2 hours*
- [ ] **Update StopCardsContainer.jsx** to use EnhancedStopCardCalculator
- [ ] **Pass weather segments** to stop card calculations
- [ ] **Update stop card display** to show weather fuel components
- [ ] **Add fuel breakdown tooltips** explaining ARA/approach fuel

### **5.2 Stop Card Enhancement** ⏱️ *3 hours*
- [ ] **Weather fuel indicators** on stop cards
- [ ] **Fuel component breakdown** display
- [ ] **Consumption indicators** (ARA fuel consumed at rigs)
- [ ] **Policy vs override indicators** on cards
- [ ] **Manual mode indicators** when active

## 📋 **Phase 6: Weather Integration (Priority 6)**

### **6.1 Weather Segments Integration** ⏱️ *2 hours*
- [ ] **Import weather segments** from Palantir flights
- [ ] **Pass to EnhancedFuelManager** automatically
- [ ] **Weather update handling** when available
- [ ] **Manual weather input** when APIs fail

### **6.2 Weather UI Indicators** ⏱️ *2 hours*
- [ ] **Weather status display** (available/manual/failed)
- [ ] **Weather-based fuel warnings** on map/cards
- [ ] **Weather ranking display** for airports/rigs
- [ ] **Manual weather override** interface

## 📋 **Phase 7: Testing & Validation (Priority 7)**

### **7.1 Integration Testing** ⏱️ *3 hours*
- [ ] **Test complete fuel workflow** with real flights
- [ ] **Validate Palantir comparison** accuracy
- [ ] **Test manual mode fallback** scenarios
- [ ] **Performance testing** with large routes

### **7.2 User Experience Testing** ⏱️ *2 hours*
- [ ] **Settings page workflow** testing
- [ ] **Fuel tab usability** testing
- [ ] **Policy change scenarios** testing
- [ ] **Error handling** validation

## 🔧 **Implementation Notes**

### **File Organization:**
```
/src/components/fast-planner/
├── modules/fuel/
│   ├── FuelPolicyLoader.js (NEW)
│   ├── EnhancedFuelManager.js (EXISTING)
│   └── weather/ (EXISTING)
├── components/fuel/ (NEW DIRECTORY)
│   ├── FuelTab.jsx (NEW)
│   ├── PolicySection.jsx (NEW)
│   ├── ManualModeSection.jsx (NEW)
│   └── ComparisonSection.jsx (NEW)
└── modules/AppSettingsManager.js (ENHANCE)
```

### **Key Integration Points:**
1. **Aircraft change** → Policy reload → Settings update → Fuel recalculation
2. **Route change** → Weather analysis → Fuel update → Stop card update
3. **Settings change** → Fuel recalculation → Stop card update
4. **Manual mode** → Override all calculations → Clear indicators

### **Success Criteria:**
- ✅ **Policy auto-loading** when aircraft selected
- ✅ **Weather fuel distribution** working correctly
- ✅ **Manual mode** when weather fails
- ✅ **Palantir comparison** within tolerance
- ✅ **Settings persistence** across sessions
- ✅ **Real-time updates** throughout system

## ⏱️ **Total Estimated Time: 25-30 hours**
**Suggested Sprint: 1 week of focused development**