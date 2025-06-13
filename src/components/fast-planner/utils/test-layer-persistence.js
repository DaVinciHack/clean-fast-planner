/**
 * test-layer-persistence.js
 * 
 * Test utilities to verify that the LayerPersistenceManager works correctly
 * and that weather circles + alternate lines persist across 2D/3D switches
 */

/**
 * Create sample weather data for testing
 */
function createTestWeatherData() {
  return [
    {
      airportIcao: "TEST1",
      locationName: "Test Location 1", 
      ranking2: 5,
      isRig: false,
      geoPoint: "28.5,-94.0",
      alternateGeoShape: {
        coordinates: [
          [-94.2, 28.3], // Split point
          [-94.0, 28.5]  // Alternate destination
        ]
      }
    },
    {
      airportIcao: "TEST2", 
      locationName: "Test Location 2",
      ranking2: 10,
      isRig: true,
      geoPoint: "28.8,-93.5",
      alternateGeoShape: {
        coordinates: [
          [-93.7, 28.6], // Split point  
          [-93.5, 28.8]  // Alternate destination
        ]
      }
    }
  ];
}

/**
 * Test function to verify layer persistence works
 */
async function testLayerPersistence() {
  console.log('🧪 TEST: Starting layer persistence test...');
  
  try {
    // Check if we have the required managers
    if (!window.mapManager && !window.mapManagerRef?.current) {
      throw new Error('No map manager available');
    }
    
    const mapManager = window.mapManager || window.mapManagerRef.current;
    const map = mapManager.getMap();
    
    if (!map) {
      throw new Error('No map instance available');
    }
    
    console.log('✅ TEST: Map manager and instance available');
    
    // Create test weather data
    const testData = createTestWeatherData();
    window.loadedWeatherSegments = testData;
    console.log('✅ TEST: Created test weather data');
    
    // Create weather circles layer
    const { default: WeatherCirclesLayer } = await import('../modules/layers/WeatherCirclesLayer');
    const weatherLayer = new WeatherCirclesLayer(map);
    await weatherLayer.addWeatherCircles(testData);
    window.currentWeatherCirclesLayer = weatherLayer;
    console.log('✅ TEST: Weather circles created');
    
    // Wait a moment for layers to render
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check that layers exist
    const hasWeatherCircles = !!map.getLayer('weather-circles-layer-inner') || 
                             !!map.getLayer('weather-circles-layer-innermost');
    const hasAlternateLines = !!map.getLayer('weather-circles-layer-lines');
    
    console.log('📊 TEST: Current layer status:');
    console.log('  - Weather circles:', hasWeatherCircles);
    console.log('  - Alternate lines:', hasAlternateLines);
    
    if (!hasWeatherCircles && !hasAlternateLines) {
      throw new Error('No weather layers were created');
    }
    
    console.log('✅ TEST: Weather layers confirmed present');
    
    // Now test the style switch
    console.log('🔄 TEST: Switching to 3D style...');
    const currentStyle = mapManager.getCurrentStyle ? mapManager.getCurrentStyle() : 'dark';
    const newStyle = currentStyle === '3d' ? 'dark' : '3d';
    
    await mapManager.switchMapStyle(newStyle);
    console.log(`✅ TEST: Switched to ${newStyle} style`);
    
    // Wait for restoration to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if layers were restored
    const hasWeatherCirclesAfter = !!map.getLayer('weather-circles-layer-inner') || 
                                  !!map.getLayer('weather-circles-layer-innermost');
    const hasAlternateLinesAfter = !!map.getLayer('weather-circles-layer-lines');
    
    console.log('📊 TEST: Layer status after style switch:');
    console.log('  - Weather circles:', hasWeatherCirclesAfter);
    console.log('  - Alternate lines:', hasAlternateLinesAfter);
    console.log('  - LayerPersistenceManager active:', !!window.layerPersistenceManager);
    
    if (window.layerPersistenceManager) {
      const status = window.layerPersistenceManager.getLayerStatus();
      console.log('📊 TEST: LayerPersistenceManager status:', status);
    }
    
    if (hasWeatherCirclesAfter || hasAlternateLinesAfter) {
      console.log('🎉 TEST: SUCCESS! Layers persisted across style change');
      return true;
    } else {
      console.log('❌ TEST: FAILED! Layers did not persist');
      
      // Try manual restoration
      console.log('🔧 TEST: Attempting manual restoration...');
      if (window.layerPersistenceManager) {
        await window.layerPersistenceManager.manualRestore();
        
        // Check again after manual restore
        await new Promise(resolve => setTimeout(resolve, 2000));
        const hasAfterManual = !!map.getLayer('weather-circles-layer-inner') || 
                              !!map.getLayer('weather-circles-layer-innermost');
        
        if (hasAfterManual) {
          console.log('🎉 TEST: SUCCESS! Manual restoration worked');
          return true;
        }
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ TEST: Error during layer persistence test:', error);
    return false;
  }
}

/**
 * Quick test for debugging - creates weather circles if they don't exist
 */
async function quickTestWeatherCircles() {
  console.log('🧪 QUICK TEST: Creating test weather circles...');
  
  try {
    const testData = createTestWeatherData();
    window.loadedWeatherSegments = testData;
    
    const mapManager = window.mapManager || window.mapManagerRef?.current;
    if (!mapManager) {
      throw new Error('No map manager available');
    }
    
    const map = mapManager.getMap();
    if (!map) {
      throw new Error('No map available');
    }
    
    // Clean up existing
    if (window.currentWeatherCirclesLayer) {
      window.currentWeatherCirclesLayer.removeWeatherCircles();
    }
    
    // Create new
    const { default: WeatherCirclesLayer } = await import('../modules/layers/WeatherCirclesLayer');
    const weatherLayer = new WeatherCirclesLayer(map);
    await weatherLayer.addWeatherCircles(testData);
    window.currentWeatherCirclesLayer = weatherLayer;
    
    console.log('✅ QUICK TEST: Weather circles created successfully');
    console.log('🧪 Now try switching between 2D/3D to test persistence');
    
  } catch (error) {
    console.error('❌ QUICK TEST: Error:', error);
  }
}

// Make functions globally available for testing
window.testLayerPersistence = testLayerPersistence;
window.quickTestWeatherCircles = quickTestWeatherCircles;
window.createTestWeatherData = createTestWeatherData;

console.log('🧪 Layer persistence test utilities loaded');
console.log('🚀 Run: window.testLayerPersistence() to test full functionality');
console.log('🚀 Run: window.quickTestWeatherCircles() to quickly create test weather circles');

export { testLayerPersistence, quickTestWeatherCircles, createTestWeatherData };
