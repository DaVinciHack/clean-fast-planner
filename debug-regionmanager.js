// Debug why RegionManager auto-loading isn't working
console.log('🔍 REGIONMANAGER DEBUG: Checking why auto-loading failed...');

// 1. Check if RegionManager was created
console.log('📊 1. REGIONMANAGER CREATION:');
console.log('  - window.regionManager exists:', !!window.regionManager);
console.log('  - window.regionManagerRef exists:', !!window.regionManagerRef);

if (window.regionManager) {
  console.log('  - RegionManager methods:', Object.getOwnPropertyNames(window.regionManager.__proto__));
  
  // Test getCurrentRegion
  try {
    const currentRegion = window.regionManager.getCurrentRegion();
    console.log('  - getCurrentRegion() result:', currentRegion);
  } catch (error) {
    console.error('  - getCurrentRegion() error:', error);
  }
} else {
  console.log('  - ❌ RegionManager not created - this is the problem!');
}

// 2. Check manager creation logs
console.log('\n📊 2. MANAGER CREATION LOGS:');
console.log('  Look above for these logs:');
console.log('  - "FastPlannerApp: Creating RegionManager instance"');
console.log('  - "🚀 AUTO-LOADING: Triggering platform load for region..."');

// 3. Check manager creation conditions
console.log('\n📊 3. MANAGER CREATION CONDITIONS:');
console.log('  - mapManagerRef.current:', !!window.mapManagerRef?.current);
console.log('  - platformManagerRef.current:', !!window.platformManagerRef?.current);
console.log('  - Both required for RegionManager creation');

// 4. Manual trigger test
console.log('\n📊 4. MANUAL TRIGGER TEST:');
if (window.platformManager && window.client) {
  console.log('  - Manually triggering Gulf of Mexico platform load...');
  
  window.platformManager.loadPlatformsFromFoundry(window.client, "GULF_OF_MEXICO")
    .then(result => {
      console.log('  ✅ Manual load result:', result?.length || 0, 'platforms');
      if (result?.length > 0) {
        console.log('  - Sample platform:', result[0]);
        
        // Check map after 2 seconds
        setTimeout(() => {
          const map = window.mapManager?.map;
          if (map) {
            const source = map.getSource('major-platforms');
            console.log('  - Map now shows:', source?._data?.features?.length || 0, 'features');
          }
        }, 2000);
      }
    })
    .catch(error => {
      console.error('  ❌ Manual load error:', error);
    });
} else {
  console.log('  - ❌ Cannot manually trigger - missing platformManager or client');
}

// 5. Check activeRegionFromContext
console.log('\n📊 5. REGION CONTEXT:');
console.log('  - activeRegionFromContext:', window.activeRegionFromContext);
console.log('  - This should be used by RegionManager');