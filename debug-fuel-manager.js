/**
 * Debug script to test MasterFuelManager import and basic functionality
 * Run this in browser console to check for issues
 */

console.log('🔍 Starting MasterFuelManager Debug...');

// Test 1: Check if MasterFuelManager can be imported
try {
  console.log('📦 Testing MasterFuelManager import...');
  
  // This should work if the file exists and has no syntax errors
  // Note: This is a dynamic import for testing purposes
  import('/src/components/fast-planner/modules/fuel/MasterFuelManager.js')
    .then((module) => {
      console.log('✅ MasterFuelManager imported successfully:', module);
      
      const manager = module.default;
      console.log('🏛️ Manager instance:', manager);
      
      // Test basic functionality
      if (manager && typeof manager.getCurrentState === 'function') {
        const state = manager.getCurrentState();
        console.log('📊 Manager current state:', state);
      }
      
      // Test subscription
      if (manager && typeof manager.subscribe ===