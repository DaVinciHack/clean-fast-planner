/**
 * Emergency race condition fix for WeatherCirclesLayer
 * 
 * If the weather circles get stuck in a race condition,
 * run this function in the console to clear it
 */

window.emergencyFixWeatherRaceCondition = () => {
  console.log('🚨 EMERGENCY: Clearing weather circles race condition...');
  
  // Clear all locks
  window.weatherCirclesCreationInProgress = false;
  window.weatherCirclesLockTime = null;
  
  // Clear any existing weather circles
  if (window.currentWeatherCirclesLayer) {
    try {
      window.currentWeatherCirclesLayer.removeWeatherCircles();
      console.log('🧹 EMERGENCY: Removed existing weather circles');
    } catch (error) {
      console.warn('🧹 EMERGENCY: Error removing weather circles:', error);
    }
    window.currentWeatherCirclesLayer = null;
  }
  
  // Reset LayerPersistenceManager state
  if (window.layerPersistenceManager) {
    window.layerPersistenceManager.restorationInProgress = false;
    console.log('🔧 EMERGENCY: Reset LayerPersistenceManager state');
  }
  
  console.log('✅ EMERGENCY: Race condition cleared. You can now try loading weather circles again.');
  console.log('🚀 EMERGENCY: Try: window.quickTestWeatherCircles() to test');
};

console.log('🚨 Emergency race condition fix loaded');
console.log('🚀 If weather circles get stuck, run: window.emergencyFixWeatherRaceCondition()');

export default window.emergencyFixWeatherRaceCondition;
