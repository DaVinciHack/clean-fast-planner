// Debug why platform auto-loading isn't working
console.log('🔍 PLATFORM AUTO-LOADING DEBUG: Checking all conditions...');

// 1. Check RegionContext effect triggers
console.log('\n📊 1. REGIONCONTEXT EFFECT CONDITIONS:');
console.log('  - window.regionEffectRuns:', window.regionEffectRuns || 'Never ran');
console.log('  - currentRegion exists:', !!window.activeRegionFromContext);
console.log('  - client exists:', !!window.client);
if (window.activeRegionFromContext) {
  console.log('  - currentRegion.name:', window.activeRegionFromContext.name);
  console.log('  - currentRegion.osdkRegion:', window.activeRegionFromContext.osdkRegion);
}

// 2. Check mapReady state
console.log('\n📊 2. MAP READY CONDITIONS:');
console.log('  - mapManagerRef exists:', !!window.mapManagerRef);
console.log('  - mapManagerRef.current exists:', !!window.mapManagerRef?.current);
console.log('  - map object exists:', !!window.mapManager?.map);
console.log('  - mapReady should be:', !!window.mapManager?.map);

// 3. Check platformManager
console.log('\n📊 3. PLATFORM MANAGER CONDITIONS:');
console.log('  - platformManagerRef exists:', !!window.platformManagerRef);
console.log('  - platformManagerRef.current exists:', !!window.platformManagerRef?.current);
console.log('  - loadPlatformsFromFoundry function:', typeof window.platformManagerRef?.current?.loadPlatformsFromFoundry);

// 4. Check loading guards
console.log('\n📊 4. LOADING GUARD CONDITIONS:');
const region = window.activeRegionFromContext?.osdkRegion || 'GULF_OF_MEXICO';
const loadingKey = `platform_loading_${region}`;
console.log(`  - Loading guard for ${region}:`, window[loadingKey] || 'Not set');
console.log('  - window.regionState:', window.regionState);

// 5. Manual trigger with full debug
console.log('\n📊 5. MANUAL TRIGGER TEST:');
if (window.platformManager && window.client && window.activeRegionFromContext) {
  console.log(`  - Triggering manual load for: ${window.activeRegionFromContext.osdkRegion}`);
  
  window.platformManager.loadPlatformsFromFoundry(window.client, window.activeRegionFromContext.osdkRegion)
    .then(result => {
      console.log('  ✅ MANUAL LOAD SUCCESS:', result?.length || 0, 'platforms loaded');
      if (result?.length > 0) {
        console.log('  - First platform:', result[0]?.name || result[0]);
        
        // Check if platforms appear on map
        setTimeout(() => {
          const map = window.mapManager?.map;
          if (map) {
            const source = map.getSource('major-platforms');
            const features = source?._data?.features?.length || 0;
            console.log(`  ✅ MAP UPDATE: ${features} platforms now visible on map`);
            
            if (features > 0) {
              console.log('  🎉 SUCCESS: Platforms are loading and displaying correctly!');
              console.log('  🚨 ISSUE: Auto-loading logic has a condition that is not being met');
            }
          }
        }, 1000);
      }
    })
    .catch(error => {
      console.error('  ❌ MANUAL LOAD ERROR:', error);
    });
} else {
  console.log('  ❌ Missing requirements for manual trigger:');
  console.log('    - platformManager:', !!window.platformManager);
  console.log('    - client:', !!window.client);
  console.log('    - activeRegionFromContext:', !!window.activeRegionFromContext);
}

// 6. Force trigger the region effect
console.log('\n📊 6. FORCE TRIGGER REGION EFFECT:');
console.log('  This will simulate what should happen automatically...');

// Check if we can force trigger
if (window.activeRegionFromContext && window.client && window.platformManagerRef?.current) {
  console.log('  - All conditions met, triggering delayed region load manually...');
  
  const currentRegion = window.activeRegionFromContext;
  const client = window.client;
  const platformManager = window.platformManagerRef.current;
  
  console.log(`🚀 AUTO-LOADING: Triggering platform load for region: ${currentRegion.osdkRegion}`);
  
  platformManager.loadPlatformsFromFoundry(client, currentRegion.osdkRegion)
    .then(result => {
      console.log(`🏗️ PLATFORMS LOADED: ${result?.length || 0} platforms via callback`);
      console.log(`✅ PLATFORMS: Successfully visible on map`);
    })
    .catch(error => {
      console.error('❌ AUTO-LOADING ERROR:', error);
    });
} else {
  console.log('  ❌ Cannot force trigger - missing conditions:');
  console.log('    - activeRegionFromContext:', !!window.activeRegionFromContext);
  console.log('    - client:', !!window.client);
  console.log('    - platformManagerRef.current:', !!window.platformManagerRef?.current);
}