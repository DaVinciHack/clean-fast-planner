/**
 * Simple Auto Flight Test Script
 * 
 * Run this in the browser console to test auto flight step by step
 */

// Test function
async function testAutoFlightStep() {
    console.log('🛩️ ===== SIMPLE AUTO FLIGHT TEST =====');
    
    // Step 1: Check basic prerequisites
    console.log('🛩️ Step 1: Checking prerequisites...');
    
    const mapManager = window.mapManager || window.mapManagerRef?.current;
    const mapInstance = mapManager?.map;
    
    console.log('- mapManager exists:', !!mapManager);
    console.log('- mapInstance exists:', !!mapInstance);
    console.log('- map style loaded:', mapInstance?.isStyleLoaded?.());
    console.log('- AutoFlightManager class:', !!window.AutoFlightManager);
    
    if (!mapInstance || !mapInstance.isStyleLoaded()) {
        console.error('❌ Map not ready - cannot test auto flight');
        return;
    }
    
    // Step 2: Create test waypoints
    console.log('🛩️ Step 2: Creating test waypoints...');
    const testWaypoints = [
        { lat: 29.7604, lng: -95.3698, name: "Houston Hobby (KHOU)", altitude: 0 },
        { lat: 29.5333, lng: -94.8667, name: "Galveston Bay", altitude: 1000 },
        { lat: 29.2000, lng: -94.5000, name: "Offshore Point Alpha", altitude: 2000 },
        { lat: 28.8667, lng: -94.2000, name: "East Cameron 330", altitude: 2000 },
        { lat: 28.6000, lng: -93.8000, name: "South Timbalier 54", altitude: 1500 },
        { lat: 28.3333, lng: -93.3333, name: "Heliport Landing", altitude: 0 }
    ];
    
    console.log('✅ Test waypoints created:', testWaypoints.length);
    
    // Step 3: Create AutoFlightManager
    console.log('🛩️ Step 3: Creating AutoFlightManager...');
    try {
        const controls = window.enhanced3DControls || null;
        const autoFlight = new window.AutoFlightManager(mapInstance, controls);
        
        console.log('✅ AutoFlightManager created successfully');
        
        // Step 4: Load route
        console.log('🛩️ Step 4: Loading route...');
        const loadResult = autoFlight.loadRoute(testWaypoints);
        console.log('Route load result:', loadResult);
        
        if (!loadResult) {
            console.error('❌ Failed to load route');
            return;
        }
        
        // Step 5: Check if flight panel was created
        console.log('🛩️ Step 5: Checking flight panel...');
        const panel = document.getElementById('auto-flight-panel');
        console.log('Flight panel exists:', !!panel);
        
        // Step 6: Start flight
        console.log('🛩️ Step 6: Starting flight...');
        const startResult = autoFlight.startFlight();
        console.log('Flight start result:', startResult);
        
        if (startResult) {
            // Store globally for debugging
            window.testAutoFlightManager = autoFlight;
            console.log('✅ Auto flight test started successfully!');
            console.log('🛩️ Flight manager stored at: window.testAutoFlightManager');
            console.log('🛩️ Call window.testAutoFlightManager.debugStatus() for status');
            console.log('🛩️ Call window.testAutoFlightManager.stopFlight() to stop');
            
            // Auto-stop after 30 seconds
            setTimeout(() => {
                console.log('🛩️ Auto-stopping test flight after 30 seconds...');
                autoFlight.stopFlight();
            }, 30000);
            
        } else {
            console.error('❌ Failed to start flight');
            autoFlight.debugStatus();
        }
        
    } catch (error) {
        console.error('❌ Error creating AutoFlightManager:', error);
    }
    
    console.log('🛩️ ===== TEST COMPLETED =====');
}

// Test function for checking map state
function checkMapState() {
    console.log('🗺️ ===== MAP STATE CHECK =====');
    
    const mapManager = window.mapManager || window.mapManagerRef?.current;
    const mapInstance = mapManager?.map;
    
    console.log('Map manager:', mapManager);
    console.log('Map instance:', mapInstance);
    
    if (mapInstance) {
        console.log('Map loaded:', mapInstance.loaded());
        console.log('Style loaded:', mapInstance.isStyleLoaded());
        console.log('Current center:', mapInstance.getCenter());
        console.log('Current zoom:', mapInstance.getZoom());
        console.log('Current pitch:', mapInstance.getPitch());
        console.log('Current bearing:', mapInstance.getBearing());
        
        // Try to get current style
        try {
            const style = mapInstance.getStyle();
            console.log('Current style URL:', style?.name || 'unknown');
        } catch (e) {
            console.log('Style info not available:', e.message);
        }
    }
    
    console.log('🗺️ ===== END MAP CHECK =====');
}

// Make functions globally available
window.testAutoFlightStep = testAutoFlightStep;
window.checkMapState = checkMapState;

console.log('🛩️ Simple Auto Flight Test loaded!');
console.log('🛩️ Run testAutoFlightStep() to test auto flight');
console.log('🛩️ Run checkMapState() to check map state');