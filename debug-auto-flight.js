/**
 * Debug Auto Flight Functionality
 * 
 * Run this in the browser console to debug the auto flight system
 */

// Debug function to test auto flight system
function debugAutoFlight() {
    console.log('🛩️ ===== AUTO FLIGHT DEBUG STARTED =====');
    
    // Step 1: Check if AutoFlightManager class exists
    console.log('🛩️1. Checking AutoFlightManager class:');
    console.log('   window.AutoFlightManager exists?', !!window.AutoFlightManager);
    console.log('   AutoFlightManager:', window.AutoFlightManager);
    
    // Step 2: Check if auto flight manager instance exists
    console.log('🛩️ 2. Checking auto flight manager instance:');
    console.log('   window.autoFlightManager exists?', !!window.autoFlightManager);
    console.log('   autoFlightManager:', window.autoFlightManager);
    
    // Step 3: Check waypoints data sources
    console.log('🛩️ 3. Checking waypoints data sources:');
    console.log('   window.currentWaypoints:', window.currentWaypoints);
    console.log('   window.currentFlightData:', window.currentFlightData);
    
    // Step 4: Check map instance
    console.log('🛩️ 4. Checking map instance:');
    const mapManager = window.mapManager || window.mapManagerRef?.current;
    console.log('   mapManager exists?', !!mapManager);
    console.log('   mapManager.map exists?', !!mapManager?.map);
    console.log('   map is loaded?', mapManager?.map?.isStyleLoaded?.());
    
    // Step 5: Check Enhanced3DControls
    console.log('🛩️ 5. Checking Enhanced3DControls:');
    console.log('   window.Enhanced3DControls exists?', !!window.Enhanced3DControls);
    console.log('   window.enhanced3DControls exists?', !!window.enhanced3DControls);
    
    // Step 6: Try to manually create and test AutoFlightManager
    console.log('🛩️ 6. Manual AutoFlightManager test:');
    try {
        if (window.AutoFlightManager && mapManager?.map) {
            console.log('   Creating test AutoFlightManager...');
            const testManager = new window.AutoFlightManager(mapManager.map, null);
            
            // Test route loading with sample data
            const testRoute = [
                { lat: 29.7604, lng: -95.3698, name: "Houston", altitude: 0 },
                { lat: 29.5333, lng: -94.8667, name: "Galveston", altitude: 1000 },
                { lat: 29.2000, lng: -94.5000, name: "Offshore", altitude: 2000 }
            ];
            
            console.log('   Loading test route...');
            const loadResult = testManager.loadRoute(testRoute);
            console.log('   Route load result:', loadResult);
            
            if (loadResult) {
                console.log('   Starting test flight...');
                const startResult = testManager.startFlight();
                console.log('   Flight start result:', startResult);
                
                // Stop after 5 seconds
                setTimeout(() => {
                    testManager.stopFlight();
                    console.log('   Test flight stopped');
                }, 5000);
            }
        } else {
            console.log('   Cannot create test - missing AutoFlightManager or map');
        }
    } catch (error) {
        console.error('   Error during manual test:', error);
    }
    
    // Step 7: Check flight panel
    console.log('🛩️ 7. Checking flight panel:');
    const panel = document.getElementById('auto-flight-panel');
    console.log('   Flight panel exists?', !!panel);
    console.log('   Panel:', panel);
    
    console.log('🛩️ ===== AUTO FLIGHT DEBUG COMPLETED =====');
}

// Function to check current flight waypoints from the application
function checkCurrentFlightWaypoints() {
    console.log('🛩️ ===== CURRENT FLIGHT WAYPOINTS DEBUG =====');
    
    // Check FastPlanner app state
    const reactInstances = window.React?._debuggingInstances || [];
    console.log('React instances found:', reactInstances.length);
    
    // Check global waypoints
    console.log('Global waypoints:', {
        currentWaypoints: window.currentWaypoints,
        lastWaypoints: window.lastWaypoints,
        flightData: window.currentFlightData
    });
    
    // Check if we can access FastPlanner component state
    const fastPlannerElement = document.querySelector('[data-testid="fast-planner"]') || 
                              document.querySelector('.fast-planner-container') ||
                              document.querySelector('#fast-planner-app');
    
    if (fastPlannerElement) {
        console.log('FastPlanner element found:', fastPlannerElement);
        
        // Try to get React fiber node
        const fiberKey = Object.keys(fastPlannerElement).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
        if (fiberKey) {
            const fiber = fastPlannerElement[fiberKey];
            console.log('React fiber:', fiber);
        }
    }
    
    console.log('🛩️ ===== WAYPOINTS DEBUG COMPLETED =====');
}

// Export functions to global scope
window.debugAutoFlight = debugAutoFlight;
window.checkCurrentFlightWaypoints = checkCurrentFlightWaypoints;

console.log('🛩️ Auto Flight Debug Script Loaded!');
console.log('🛩️ Run debugAutoFlight() in console to test');
console.log('🛩️ Run checkCurrentFlightWaypoints() to check waypoints');