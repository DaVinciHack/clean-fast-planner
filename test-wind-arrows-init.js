/**
 * Test script for verifying wind arrow system initialization
 * 
 * Run this in the browser console after the application loads:
 * 
 * 1. Open the Fast Planner app
 * 2. Wait for it to fully load
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire script and press Enter
 * 
 * This will test if window.rigWeatherIntegration is properly initialized
 * with the updateRigWeather method that WeatherCirclesLayer expects.
 */

console.log('🧪 Starting wind arrow system initialization test...');

// Test 1: Check if weather visualization manager exists
if (window.weatherVisualizationManager) {
    console.log('✅ weatherVisualizationManager is available');
} else {
    console.log('❌ weatherVisualizationManager is NOT available');
}

// Test 2: Check if rigWeatherIntegration exists
if (window.rigWeatherIntegration) {
    console.log('✅ rigWeatherIntegration is available');
    
    // Test 3: Check if updateRigWeather method exists
    if (typeof window.rigWeatherIntegration.updateRigWeather === 'function') {
        console.log('✅ updateRigWeather method is available');
        
        // Test 4: Try to call updateRigWeather with test data
        try {
            const testData = [{
                rigName: 'TEST_RIG',
                latitude: 29.0,
                longitude: -94.0,
                windSpeed: 15,
                windDirection: 180,
                locationType: 'primary'
            }];
            
            window.rigWeatherIntegration.updateRigWeather(testData);
            console.log('✅ updateRigWeather method executed successfully');
            console.log('🎯 Wind arrow system initialization: SUCCESS');
            
        } catch (error) {
            console.log('❌ Error calling updateRigWeather:', error);
            console.log('🚨 Wind arrow system initialization: FAILED');
        }
    } else {
        console.log('❌ updateRigWeather method is NOT available');
        console.log('Available methods:', Object.getOwnPropertyNames(window.rigWeatherIntegration));
        console.log('🚨 Wind arrow system initialization: FAILED');
    }
} else {
    console.log('❌ rigWeatherIntegration is NOT available');
    console.log('🚨 Wind arrow system initialization: FAILED');
}

// Test 5: Check timing - if managers are available
if (window.currentManagers) {
    console.log('📊 Manager status:');
    console.log('  - mapManager:', !!window.currentManagers.mapManager);
    console.log('  - platformManager:', !!window.currentManagers.platformManager);
    console.log('  - weatherVisualizationManager:', !!window.currentManagers.weatherVisualizationManager);
    
    if (window.currentManagers.mapManager?.map) {
        console.log('  - map instance:', 'Available');
    } else {
        console.log('  - map instance:', 'NOT AVAILABLE');
    }
} else {
    console.log('📊 currentManagers not available yet - may need to wait longer');
}

console.log('🧪 Wind arrow system test complete. Check results above.');