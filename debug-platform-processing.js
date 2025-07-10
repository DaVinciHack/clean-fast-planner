// Debug platform data processing pipeline
// Run this after the force reload shows query results

console.log('🔍 PLATFORM PROCESSING DEBUG: Checking data pipeline...');

// Check if the platform loading completed
setTimeout(() => {
  console.log('\n📊 POST-QUERY ANALYSIS (after 3 seconds):');
  console.log('  - Platforms now loaded:', window.platformManager?.platforms?.length || 0);
  
  if (window.platformManager?.platforms?.length > 0) {
    console.log('  - First platform:', window.platformManager.platforms[0]);
    console.log('  - Platform types:', window.platformManager.platforms.map(p => p.type || p.locationType).slice(0, 5));
  }
  
  // Check for map layers again
  const map = window.mapManager?.map || window.mapManagerRef?.current?.map;
  if (map) {
    console.log('  - Map layers after query:');
    ['platforms-fixed-layer', 'platforms-movable-layer', 'airfields-layer'].forEach(layerId => {
      console.log(`    - ${layerId}: ${!!map.getLayer(layerId)}`);
    });
    
    const source = map.getSource('major-platforms');
    console.log('  - major-platforms source now:', !!source);
    if (source) {
      console.log('    - Source features now:', source._data?.features?.length || 0);
    }
  }
  
  // Check for any errors in console
  console.log('\n📊 LOOK FOR ERRORS:');
  console.log('  Check console above for any errors during platform processing');
  console.log('  Common issues:');
  console.log('  - "Error processing platforms"');
  console.log('  - "Error adding platforms to map"'); 
  console.log('  - "PlatformManager: Error"');
  
}, 3000);

// Also check what data is actually being returned
console.log('\n🔍 TRYING TO INTERCEPT QUERY RESULTS...');

// Override the platform manager's callback temporarily to see what data comes through
if (window.platformManager && window.platformManager.setCallback) {
  const originalCallback = window.platformManager.callbacks?.onPlatformsLoaded;
  
  window.platformManager.setCallback('onPlatformsLoaded', (platforms) => {
    console.log('🔍 INTERCEPTED PLATFORMS CALLBACK:', {
      count: platforms?.length || 0,
      sample: platforms?.[0],
      types: platforms?.map(p => p.type || p.locationType).slice(0, 5)
    });
    
    // Call original callback if it exists
    if (originalCallback) {
      originalCallback(platforms);
    }
  });
  
  console.log('✅ Platform callback intercepted - trigger another force reload to see data');
}