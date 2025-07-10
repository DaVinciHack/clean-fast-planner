// Debug platform loading for the CORRECT region
// This will detect what region you're actually viewing

console.log('🌍 REGION DEBUG: Detecting your current viewing region...');

// 1. Check URL for region hints
console.log('📍 1. URL ANALYSIS:');
const url = window.location.href;
console.log('  - Current URL:', url);

// 2. Check for any stored region data
console.log('\n📍 2. STORED REGION DATA:');
console.log('  - localStorage regions:', Object.keys(localStorage).filter(k => k.includes('region')));
console.log('  - activeRegionFromContext:', window.activeRegionFromContext);

// 3. Check map bounds to guess region
console.log('\n📍 3. MAP BOUNDS ANALYSIS:');
const map = window.mapManager?.map || window.mapManagerRef?.current?.map;
if (map) {
  const bounds = map.getBounds();
  const center = map.getCenter();
  console.log('  - Map center:', {lat: center.lat, lng: center.lng});
  console.log('  - Map bounds:', {
    north: bounds.getNorth(),
    south: bounds.getSouth(), 
    east: bounds.getEast(),
    west: bounds.getWest()
  });
  
  // Rough region detection based on coordinates
  const lat = center.lat;
  const lng = center.lng;
  
  let guessedRegion = 'UNKNOWN';
  if (lat > 60 && lng > 4 && lng < 15) {
    guessedRegion = 'NORWAY';
  } else if (lat > 25 && lat < 32 && lng > -98 && lng < -80) {
    guessedRegion = 'GULF_OF_MEXICO';
  } else if (lat > 50 && lat < 62 && lng > -5 && lng < 5) {
    guessedRegion = 'NORTH_SEA';
  }
  
  console.log('  - Guessed region based on coordinates:', guessedRegion);
}

// 4. Check for region in flight data
console.log('\n📍 4. FLIGHT DATA REGION:');
if (window.currentFlightData) {
  console.log('  - Flight region:', window.currentFlightData.region);
}

// 5. Try to force correct region loading
console.log('\n📍 5. FORCING CORRECT REGION PLATFORM LOADING:');

const regions = ['GULF_OF_MEXICO', 'NORTH_SEA', 'NORWAY', 'GOM', 'NORTHSEA'];

console.log('  - Available regions to try:', regions);
console.log('  - Which region should I load platforms for?');
console.log('  - Run: loadPlatformsForRegion("REGION_NAME")');

// Create helper function
window.loadPlatformsForRegion = function(regionName) {
  console.log(`🚀 Loading platforms for region: ${regionName}`);
  
  if (window.platformManager && window.client) {
    window.platformManager.loadPlatformsFromFoundry(window.client, regionName)
      .then(result => {
        console.log(`✅ Loaded ${result?.length || 0} platforms for ${regionName}`);
        if (result?.length > 0) {
          console.log('  - Sample platform:', result[0]);
        }
        
        // Check map after loading
        setTimeout(() => {
          const map = window.mapManager?.map;
          if (map) {
            const source = map.getSource('major-platforms');
            console.log('  - Map source now has features:', source?._data?.features?.length || 0);
          }
        }, 1000);
      })
      .catch(error => {
        console.error(`❌ Failed to load platforms for ${regionName}:`, error);
      });
  }
};

console.log('\n🎯 QUICK TEST:');
console.log('Try: loadPlatformsForRegion("GULF_OF_MEXICO")');
console.log('Or: loadPlatformsForRegion("NORTH_SEA")');