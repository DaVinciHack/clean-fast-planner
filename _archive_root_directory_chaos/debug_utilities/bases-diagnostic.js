// Diagnostic script to check what's happening with bases
// Run this in the browser console when the app is loaded

// Check if any items have isBase field
const checkBases = () => {
  console.log('=== BASES DIAGNOSTIC ===');
  
  // Check if PlatformManager exists
  if (typeof window.platformManager === 'undefined') {
    console.error('PlatformManager not found in window. Try window.appManagers?.platformManagerRef?.current');
    return;
  }
  
  const pm = window.platformManager || window.appManagers?.platformManagerRef?.current;
  if (!pm) {
    console.error('Could not find PlatformManager instance');
    return;
  }
  
  // Check platforms data
  console.log('Total platforms:', pm.platforms.length);
  
  // Find all platforms with isBases = true
  const bases = pm.platforms.filter(p => p.isBases === true);
  console.log('Platforms marked as bases:', bases.length);
  
  if (bases.length > 0) {
    console.log('Sample bases:', bases.slice(0, 3));
  }
  
  // Check map layers
  const map = pm.mapManager?.getMap();
  if (map) {
    // Check if bases layer exists
    const basesLayer = map.getLayer('bases-layer');
    const basesLabels = map.getLayer('bases-labels');
    
    console.log('Bases layer exists:', !!basesLayer);
    console.log('Bases labels layer exists:', !!basesLabels);
    
    if (basesLayer) {
      const visibility = map.getLayoutProperty('bases-layer', 'visibility');
      console.log('Bases layer visibility:', visibility);
    }
    
    // Check the source data
    const source = map.getSource('major-platforms');
    if (source) {
      const sourceData = source._data;
      if (sourceData && sourceData.features) {
        const basesFeatures = sourceData.features.filter(f => 
          f.properties && f.properties.platformType === 'bases'
        );
        console.log('Features with platformType "bases":', basesFeatures.length);
        if (basesFeatures.length > 0) {
          console.log('Sample base features:', basesFeatures.slice(0, 2));
        }
      }
    }
  }
  
  // Check basesVisible flag
  console.log('basesVisible flag:', pm.basesVisible);
  
  console.log('=== END DIAGNOSTIC ===');
};

// Also check raw platform data for isBase fields
const checkRawData = () => {
  console.log('=== RAW DATA CHECK ===');
  
  const pm = window.platformManager || window.appManagers?.platformManagerRef?.current;
  if (!pm || !pm.platforms) return;
  
  // Check for any isBase-like fields
  const sample = pm.platforms.slice(0, 100); // Check first 100
  const baseFields = new Set();
  
  sample.forEach(p => {
    Object.keys(p).forEach(key => {
      if (key.toLowerCase().includes('base')) {
        baseFields.add(key);
      }
    });
  });
  
  console.log('Fields containing "base":', Array.from(baseFields));
  
  // Count platforms by each base field
  baseFields.forEach(field => {
    const withField = pm.platforms.filter(p => p[field]);
    console.log(`Platforms with ${field}:`, withField.length);
    if (withField.length > 0) {
      console.log(`Sample values for ${field}:`, 
        [...new Set(withField.slice(0, 20).map(p => p[field]))]);
    }
  });
  
  console.log('=== END RAW DATA CHECK ===');
};

// Run both checks
checkBases();
checkRawData();

// Export for easy reuse
window.checkBases = checkBases;
window.checkRawData = checkRawData;
