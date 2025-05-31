/**
 * Test MasterFuelManager basic functionality
 * Run this in the browser console to verify Phase 1 is working
 */

console.log('🧪 Testing MasterFuelManager Phase 1...');

// Test policy update
const testPolicy = {
  name: 'Test Policy',
  region: 'NORWAY',
  fuelTypes: {
    taxiFuel: { default: 50 },
    reserveFuel: { default: 600, type: 'fixed' }
  },
  contingencyFuel: {
    flightLegs: { value: 10, type: 'percentage' },
    alternate: { value: 5, type: 'percentage' }
  },
  deckFuelTime: 15
};

// Test aircraft
const testAircraft = {
  registration: 'LN-TEST',
  cruiseSpeed: 145,
  fuelBurn: 1100,
  emptyWeight: 12500,
  maxTakeoffWeight: 17500
};

// Test waypoints
const testWaypoints = [
  { name: 'ENZV', lat: 60.4034, lon: 5.2505, type: 'airport' },
  { name: 'ENLE', lat: 61.1056, lon: 5.0623, type: 'rig' },
  { name: 'ENCN', lat: 62.7443, lon: 6.3388, type: 'airport' }
];

// Test weather
const testWeather = {
  windSpeed: 20,
  windDirection: 270,
  source: 'test'
};

// Import the manager
import('../modules/fuel/MasterFuelManager.js').then(module => {
  const manager = module.default;
  
  console.log('✅ MasterFuelManager imported successfully');
  console.log('📊 Initial state:', manager.getCurrentState());
  
  // Test policy update
  manager.updateFuelPolicy(testPolicy);
  console.log('✅ Policy updated');
  
  // Test aircraft update  
  manager.updateAircraft(testAircraft);
  console.log('✅ Aircraft updated');
  
  // Test waypoints update
  manager.updateWaypoints(testWaypoints);
  console.log('✅ Waypoints updated');
  
  // Test weather update
  manager.updateWeather(testWeather);
  console.log('✅ Weather updated');
  
  // Test calculation
  const calculations = manager.calculateAllFuel();
  console.log('✅ Calculations complete:', calculations);
  
  console.log('🎉 Phase 1 test completed successfully!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});