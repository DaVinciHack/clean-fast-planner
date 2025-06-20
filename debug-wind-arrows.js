// Debug script to check wind arrow system
// Paste this into browser console while app is running

console.log('🔍 DEBUG: Checking wind arrow system...');

// Check if rigWeatherIntegration exists
console.log('window.rigWeatherIntegration:', !!window.rigWeatherIntegration);
if (window.rigWeatherIntegration) {
  console.log('  - Type:', typeof window.rigWeatherIntegration);
  console.log('  - Has updateRigWeather method:', typeof window.rigWeatherIntegration.updateRigWeather);
} else {
  console.log('  ❌ window.rigWeatherIntegration is not available');
}

// Check if WeatherVisualizationManager exists
console.log('window.weatherVisualizationManager:', !!window.weatherVisualizationManager);
if (window.weatherVisualizationManager) {
  console.log('  - Type:', typeof window.weatherVisualizationManager);
} else {
  console.log('  ❌ window.weatherVisualizationManager is not available');
}

// Check if weather circles layer exists
console.log('window.currentWeatherCirclesLayer:', !!window.currentWeatherCirclesLayer);

// Check if there's weather data
console.log('window.loadedWeatherSegments:', window.loadedWeatherSegments?.length || 'not available');

// Check managers
console.log('Managers check:');
console.log('  - window.mapManager:', !!window.mapManager);
console.log('  - window.platformManager:', !!window.platformManager);
console.log('  - window.appManagers:', !!window.appManagers);

// Try to find any rig weather graphics
console.log('Looking for RigWeatherGraphics...');
const rigGraphicsKeys = Object.keys(window).filter(k => k.toLowerCase().includes('rig') || k.toLowerCase().includes('weather'));
console.log('  - Rig/Weather related window objects:', rigGraphicsKeys);

console.log('🔍 DEBUG: Wind arrow system check complete');