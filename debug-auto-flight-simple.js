/**
 * Simple Auto Flight Debug Script
 * 
 * Run this in browser console to test auto flight step by step
 */

// Test if auto flight can be triggered
function testAutoFlightBasic() {
    console.log('🛩️ === BASIC AUTO FLIGHT TEST ===');
    
    // Check if map is available
    const map = window.mapManager?.map || window.mapManagerRef?.current?.map;
    console.log('🗺️ Map available:', !!map);
    console.log('🗺️ Map style loaded:', map?.isStyleLoaded?.() || false);
    
    // Check if waypoints are available
    const waypoints = window.currentWaypoints;
    console.log('📍 Global waypoints available:', !!waypoints);
    console.log('📍 Waypoints count:', waypoints?.length || 0);
    console.log('📍 First waypoint:', waypoints?.[0]);
    
    // Check if auto flight manager exists
    console.log('🛩️ Auto flight manager exists:', !!window.autoFlightManager);
    
    if (window.autoFlightManager) {
        console.log('🛩️ Auto flight manager status:');
        console.log('  - isFlying:', window.autoFlightManager.isFlying);
        console.log('  - isPaused:', window.autoFlightManager.isPaused);
        console.log('  - hasError:', window.autoFlightManager.hasError);
        console.log('  - waypoints loaded:', window.autoFlightManager.route?.waypoints?.length || 0);
    }
    
    console.log('🛩️ === END BASIC TEST ===');
}

// Test creating auto flight manager manually
function testAutoFlightManual() {
    console.log('🛩️ === MANUAL AUTO FLIGHT TEST ===');
    
    const map = window.mapManager?.map || window.mapManagerRef?.current?.map;
    if (!map) {
        console.error('❌ No map available for testing');
        return;
    }
    
    if (!map.isStyleLoaded()) {
        console.error('❌ Map style not loaded');
        return;
    }
    
    // Create test waypoints
    const testWaypoints = [
        { lat: 29.7604, lng: -95.3698, name: "Houston" },
        { lat: 29.5333, lng: -94.8667, name: "Galveston" },
        { lat: 29.2000, lng: -94.5000, name: "Offshore" },
        { lat: 28.8667, lng: -94.2000, name: "Platform" }
    ];
    
    console.log('🛩️ Testing with waypoints:', testWaypoints);
    
    // Import and create AutoFlightManager
    import('/src/components/fast-planner/modules/weather/AutoFlightManager.js')
        .then(module => {
            const AutoFlightManager = module.default;
            console.log('✅ AutoFlightManager imported successfully');
            
            try {
                const flightManager = new AutoFlightManager(map, null);
                console.log('✅ AutoFlightManager created successfully');
                
                if (flightManager.loadRoute(testWaypoints)) {
                    console.log('✅ Route loaded successfully');
                    console.log('🛩️ Starting flight...');
                    
                    // Start flight
                    const started = flightManager.startFlight();
                    console.log('🛩️ Flight started:', started);
                    
                    // Store for later access
                    window.testAutoFlightManager = flightManager;
                    
                } else {
                    console.error('❌ Failed to load route');
                }
                
            } catch (error) {
                console.error('❌ Error creating AutoFlightManager:', error);
            }
        })
        .catch(error => {
            console.error('❌ Error importing AutoFlightManager:', error);
        });
    
    console.log('🛩️ === END MANUAL TEST ===');
}

// Test step by step
function testAutoFlightStep() {
    console.log('🛩️ === STEP BY STEP AUTO FLIGHT TEST ===');
    
    // Step 1: Check prerequisites
    console.log('📋 Step 1: Checking prerequisites...');
    testAutoFlightBasic();
    
    // Step 2: Try manual creation after delay
    setTimeout(() => {
        console.log('📋 Step 2: Testing manual creation...');
        testAutoFlightManual();
    }, 1000);
}

// Expose functions globally
window.testAutoFlightBasic = testAutoFlightBasic;
window.testAutoFlightManual = testAutoFlightManual;
window.testAutoFlightStep = testAutoFlightStep;

console.log('🛩️ Auto Flight Debug Tools Loaded!');
console.log('🛩️ Available functions:');
console.log('  - testAutoFlightBasic() - Check current state');
console.log('  - testAutoFlightManual() - Test manual creation');
console.log('  - testAutoFlightStep() - Step by step test');