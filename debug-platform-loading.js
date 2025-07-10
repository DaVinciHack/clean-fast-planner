// Debug script to diagnose platform loading issues
// Run this in browser console after loading online

console.log('🏗️ PLATFORM DEBUG: Starting comprehensive platform analysis...');

// 1. Check manager existence and state
console.log('📊 1. PLATFORM MANAGER STATE:');
console.log('  - platformManager exists:', !!window.platformManager);
console.log('  - platformManagerRef exists:', !!window.platformManagerRef);
console.log('  - Platforms loaded:', window.platformManager?.platforms?.length || 0);

if (window.platformManager?.platforms?.length > 0) {
  console.log('  - First platform sample:', window.platformManager.platforms[0]);
}

// 2. Check authentication state
console.log('\n📊 2. AUTHENTICATION STATE:');
console.log('  - isFoundryAuthenticated:', window.isFoundryAuthenticated);
console.log('  - client exists:', !!window.client);
console.log('  - client type:', window.client?.constructor?.name);

// 3. Check map state
console.log('\n📊 3. MAP STATE:');
const map = window.mapManager?.map || window.mapManagerRef?.current?.map;
console.log('  - Map exists:', !!map);
console.log('  - Map loaded:', !!map?.isStyleLoaded());

if (map) {
  // Check platform layers
  const platformLayers = [
    'platforms-fixed-layer',
    'platforms-movable-layer', 
    'airfields-layer'
  ];
  
  console.log('  - Platform layers:');
  platformLayers.forEach(layerId => {
    const layer = map.getLayer(layerId);
    console.log(`    - ${layerId}: ${!!layer}`);
  });
  
  // Check platform source
  const source = map.getSource('major-platforms');
  console.log('  - major-platforms source:', !!source);
  if (source) {
    console.log('    - Source features:', source._data?.features?.length || 0);
    if (source._data?.features?.length > 0) {
      console.log('    - First feature:', source._data.features[0]);
    }
  }
}

// 4. Check region state
console.log('\n📊 4. REGION STATE:');
console.log('  - regionManager exists:', !!window.regionManager);
console.log('  - Current region:', window.regionManager?.getCurrentRegion());

// 5. Check callback system
console.log('\n📊 5. CALLBACK SYSTEM:');
if (window.platformManager) {
  console.log('  - platformManager.callbacks:', !!window.platformManager.callbacks);
  console.log('  - onPlatformsLoaded callback:', !!window.platformManager.callbacks?.onPlatformsLoaded);
}

// 6. Check recent console activity
console.log('\n📊 6. PLATFORM LOADING LOGS:');
console.log('  Look above for any of these log patterns:');
console.log('  - "🔧 CALLBACK RE-BINDING: Updating platform manager callbacks..."');
console.log('  - "🏗️ PLATFORMS LOADED: X platforms via callback"');
console.log('  - "🚨 PLATFORM FALLBACK: Platforms loaded but not visible..."');
console.log('  - "✅ PLATFORMS: Successfully visible on map"');

// 7. Force platform loading test
console.log('\n📊 7. FORCE PLATFORM LOADING TEST:');
if (window.platformManager && window.client) {
  console.log('  - Attempting force reload...');
  try {
    const currentRegion = window.regionManager?.getCurrentRegion() || { name: 'NORWAY' };
    const regionName = currentRegion.osdkRegion || currentRegion.name;
    
    console.log(`  - Loading platforms for region: ${regionName}`);
    window.platformManager.loadPlatformsFromFoundry(window.client, regionName)
      .then(result => {
        console.log('  - Force reload result:', result?.length || 0, 'platforms');
      })
      .catch(error => {
        console.error('  - Force reload error:', error);
      });
  } catch (error) {
    console.error('  - Force reload failed:', error);
  }
}

console.log('\n🔬 PLATFORM DEBUG COMPLETE');
console.log('📝 Key things to check:');
console.log('  1. Are platforms loaded in manager but not visible on map?');
console.log('  2. Are there any authentication issues?');
console.log('  3. Did the callback system set up properly?');
console.log('  4. Are map layers missing?');