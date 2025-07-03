/**
 * DEBUG SCRIPT: Fuel Overrides Flow Tracing
 * 
 * Run this in the browser console to trace the complete fuel override flow
 * from CleanDetailedFuelBreakdown to StopCardCalculator
 */

console.log('🔍 FUEL OVERRIDE DEBUG: Starting comprehensive flow trace...');

// Step 1: Check if window callback is registered
console.log('📞 STEP 1: Window callback registration');
console.log('window.fuelOverridesCallback exists:', !!window.fuelOverridesCallback);
console.log('window.fuelOverridesCallback type:', typeof window.fuelOverridesCallback);

// Step 2: Test the callback directly
if (window.fuelOverridesCallback) {
  console.log('🧪 STEP 2: Testing direct callback with sample data');
  const testOverrides = {
    'ST127-A_araFuel': { value: 999 },
    'ST127-A_extraFuel': { value: 123 }
  };
  
  console.log('🧪 Calling window.fuelOverridesCallback with:', testOverrides);
  try {
    window.fuelOverridesCallback(testOverrides);
    console.log('✅ Direct callback executed successfully');
  } catch (error) {
    console.error('❌ Direct callback failed:', error);
  }
} else {
  console.warn('⚠️ window.fuelOverridesCallback is not registered yet');
}

// Step 3: Check current flight data
console.log('🛩️ STEP 3: Current flight data check');
console.log('Current waypoints:', window.currentFlightData?.waypoints?.length || 'No waypoints');
console.log('Current stopCards:', window.debugStopCards?.length || 'No stop cards');

// Step 4: Check EnhancedStopCardsContainer state
console.log('📦 STEP 4: EnhancedStopCardsContainer state check');
if (window.debugStopCards && window.debugStopCards.length > 0) {
  const firstCard = window.debugStopCards[0];
  console.log('First stop card fuel components:', {
    totalFuel: firstCard.totalFuel,
    araFuel: firstCard.fuelComponentsObject?.araFuel,
    extraFuel: firstCard.fuelComponentsObject?.extraFuel,
    tripFuel: firstCard.fuelComponentsObject?.tripFuel
  });
}

// Step 5: Simulate the exact sequence from CleanDetailedFuelBreakdown
console.log('🎯 STEP 5: Simulating CleanDetailedFuelBreakdown sequence');

// This is the exact format CleanDetailedFuelBreakdown sends
const simulatedOverrides = {
  'ST127-A_araFuel': { value: 125 },
  'ST127-A_extraFuel': { value: 50 }
};

console.log('🎯 Sending simulated overrides:', simulatedOverrides);
console.log('🎯 Override keys:', Object.keys(simulatedOverrides));
console.log('🎯 Sample override format:', Object.values(simulatedOverrides)[0]);

if (window.fuelOverridesCallback) {
  try {
    window.fuelOverridesCallback(simulatedOverrides);
    console.log('🎯 Simulated override sent successfully');
    
    // Wait for React state updates
    setTimeout(() => {
      console.log('🎯 Checking results after React state update...');
      if (window.debugStopCards && window.debugStopCards.length > 0) {
        const updatedCard = window.debugStopCards[0];
        console.log('🎯 Updated first card fuel:', {
          totalFuel: updatedCard.totalFuel,
          araFuel: updatedCard.fuelComponentsObject?.araFuel,
          extraFuel: updatedCard.fuelComponentsObject?.extraFuel
        });
      }
    }, 1000);
    
  } catch (error) {
    console.error('🎯 Simulated override failed:', error);
  }
}

// Step 6: Check segment analysis
console.log('📊 STEP 6: Segment analysis debug');
if (window.getCurrentSegmentInfo) {
  try {
    const segments = window.getCurrentSegmentInfo();
    console.log('📊 Current segments:', segments);
    segments.forEach((segment, i) => {
      console.log(`📊 Segment ${i + 1}:`, {
        start: segment.startLocation,
        end: segment.endLocation,
        araFuel: segment.fuelRequirements?.araFuel,
        extraFuel: segment.fuelRequirements?.extraFuel
      });
    });
  } catch (error) {
    console.log('📊 getCurrentSegmentInfo not available or failed:', error.message);
  }
}

// Step 7: Direct inspection of StopCardCalculator parameters
console.log('⚙️ STEP 7: StopCardCalculator parameter inspection');
console.log('⚙️ Override the next StopCardCalculator call to log parameters...');

// Temporarily override the calculateStopCards function to log parameters
if (window.StopCardCalculator) {
  const originalCalculate = window.StopCardCalculator.calculateStopCards;
  window.StopCardCalculator.calculateStopCards = function(...args) {
    console.log('⚙️ StopCardCalculator called with options:', args[4]?.locationFuelOverrides);
    console.log('⚙️ Full options object:', args[4]);
    return originalCalculate.apply(this, args);
  };
  console.log('⚙️ StopCardCalculator overridden for debugging');
}

console.log('🔍 FUEL OVERRIDE DEBUG: Complete trace finished. Check results above.');
console.log('💡 TIP: Try setting a fuel override in the UI and watch the console for flow tracking.');