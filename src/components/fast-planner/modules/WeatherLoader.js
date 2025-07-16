/**
 * Weather Module Loader
 * Simple integration point to load weather visualization into Fast Planner
 * 
 * This file can be imported into FastPlannerApp.jsx to enable weather features
 * without disrupting existing functionality
 */

import WeatherIntegrationTest from './weather/WeatherIntegrationTest.js';
import NOAAWeatherIntegration from './weather/NOAAWeatherIntegration.js';

/**
 * Initialize weather visualization system for Fast Planner
 * Call this from FastPlannerApp.jsx componentDidMount or useEffect
 */
export const initializeWeatherSystem = async () => {
    try {
        console.log('🌤️ Initializing Weather Visualization System...');
        
        // Create weather integration test instance
        const weatherTest = new WeatherIntegrationTest();
        
        // Initialize the weather system
        const initialized = await weatherTest.initialize();
        
        if (initialized) {
            console.log('✅ Weather system initialized successfully');
            
            // Make weather test available globally for manual testing
            window.weatherTest = weatherTest;
            
            // NOAA integration is auto-initialized when imported
            // This adds NOAA satellite/radar capabilities
            console.log('🛰️ NOAA satellite/radar integration loaded');
            
            // Don't auto-run tests to avoid API rate limits
            console.log('🌤️ Weather system ready - use window.weatherTest.quickTest() for manual testing');
            console.log('🛰️ Test NOAA weather with: window.testNOAAWeather()');
            console.log('📍 Test Gulf location with: window.testGulfLocation(29.0, -94.0)');
            
            return weatherTest;
        } else {
            console.error('❌ Weather system initialization failed');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Weather system initialization error:', error);
        return null;
    }
};

/**
 * Get weather for current flight route
 * Can be called from UI components to get weather data
 */
export const getRouteWeather = async (flightData = null) => {
    try {
        if (!window.weatherTest) {
            console.warn('⚠️ Weather system not initialized. Call initializeWeatherSystem() first.');
            return null;
        }
        
        console.log('🌤️ Getting weather for current route...');
        const results = await window.weatherTest.testFlightWeatherIntegration(flightData);
        
        return results;
        
    } catch (error) {
        console.error('❌ Error getting route weather:', error);
        return null;
    }
};

/**
 * Add NOAA weather overlay to map
 * Integration point for NOAA satellite/radar overlays
 */
export const addNOAAWeatherOverlay = async (mapInstance, layerType = 'CARIBBEAN') => {
    try {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided');
            return false;
        }
        
        console.log(`🛰️ Adding NOAA ${layerType} overlay to map...`);
        
        // Use the NOAA integration
        if (window.noaaWeather) {
            const success = await window.noaaWeather.addTestOverlay(mapInstance, layerType);
            
            if (success) {
                console.log(`✅ NOAA ${layerType} overlay added successfully`);
                return true;
            } else {
                console.log(`❌ Failed to add NOAA ${layerType} overlay`);
                return false;
            }
        } else {
            console.warn('⚠️ NOAA weather service not available');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error adding NOAA weather overlay:', error);
        return false;
    }
};

/**
 * Remove NOAA weather overlay from map
 */
export const removeNOAAWeatherOverlay = (mapInstance, layerType = null) => {
    try {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided');
            return;
        }
        
        if (window.noaaWeather) {
            window.noaaWeather.removeOverlay(mapInstance, layerType);
            console.log(`✅ NOAA ${layerType || 'weather'} overlay removed`);
        } else {
            console.warn('⚠️ NOAA weather service not available');
        }
        
    } catch (error) {
        console.error('❌ Error removing NOAA weather overlay:', error);
    }
};

/**
 * Add simple NOAA lightning detection overlay without TIME parameter (fallback)
 */
export const addSimpleLightningOverlayNoTime = async (mapInstance) => {
    try {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided');
            return false;
        }
        
        console.log('⚡ Adding lightning detection layer WITHOUT TIME parameter...');
        
        // Remove existing lightning layer if present
        if (mapInstance.getSource('simple-lightning')) {
            try {
                mapInstance.removeLayer('simple-lightning-layer');
                mapInstance.removeSource('simple-lightning');
                console.log('🧹 Removed existing lightning layer');
            } catch (cleanupError) {
                console.warn('⚠️ Error cleaning up existing lightning layer:', cleanupError);
            }
        }
        
        // Build the tile URL without TIME parameter
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok');
        const baseUrl = isLocal ? '' : 'https://bristow.info/weather';
        const tileUrl = `${baseUrl}/api/noaa/geoserver/observations/lightning_detection/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ldn_lightning_strike_density&CRS=EPSG:3857&FORMAT=image/png&TRANSPARENT=true&WIDTH=256&HEIGHT=256&BBOX={bbox-epsg-3857}`;
        
        console.log(`⚡ Lightning tile URL template (no TIME): ${tileUrl}`);
        
        // Add lightning source without TIME parameter
        try {
            mapInstance.addSource('simple-lightning', {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256,
                minzoom: 0,
                maxzoom: 18,
                attribution: '© NOAA Global Lightning Detection Network'
            });
            
            mapInstance.addLayer({
                id: 'simple-lightning-layer',
                type: 'raster',
                source: 'simple-lightning',
                minzoom: 0,
                maxzoom: 18,
                paint: {
                    'raster-opacity': 0.8,
                    'raster-fade-duration': 300
                }
            });
            
            console.log('⚡ Lightning detection layer added successfully WITHOUT TIME parameter');
            return true;
        } catch (addLayerError) {
            console.error('❌ Failed to add lightning layer (no TIME):', addLayerError);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error adding lightning layer (no TIME):', error);
        return false;
    }
};

/**
 * Add simple NOAA lightning detection overlay (no opacity control for compatibility)
 */
export const addSimpleLightningOverlay = async (mapInstance) => {
    try {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided');
            return false;
        }
        
        console.log('⚡ Adding lightning detection layer with TIME parameter...');
        
        // Remove existing lightning layer if present
        if (mapInstance.getSource('simple-lightning')) {
            try {
                mapInstance.removeLayer('simple-lightning-layer');
                mapInstance.removeSource('simple-lightning');
                console.log('🧹 Removed existing lightning layer');
            } catch (cleanupError) {
                console.warn('⚠️ Error cleaning up existing lightning layer:', cleanupError);
            }
        }
        
        // Get current time in ISO format for TIME parameter (NOAA requires this)
        const now = new Date();
        now.setMinutes(Math.floor(now.getMinutes() / 15) * 15); // Round to nearest 15 minutes
        const timeParam = now.toISOString().slice(0, 19) + 'Z';
        
        console.log(`⚡ Using TIME parameter: ${timeParam}`);
        
        // Alternative: try without TIME parameter if issues persist
        // Some WMS servers have better zoom behavior without time constraints
        
        // Build the tile URL - use relative URLs for development (localhost or ngrok)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok');
        const baseUrl = isLocal ? '' : 'https://bristow.info/weather';
        
        // Use 256x256 tiles for better zoom compatibility (WMS standard)
        const tileUrl = `${baseUrl}/api/noaa/geoserver/observations/lightning_detection/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ldn_lightning_strike_density&CRS=EPSG:3857&FORMAT=image/png&TRANSPARENT=true&WIDTH=256&HEIGHT=256&TIME=${encodeURIComponent(timeParam)}&BBOX={bbox-epsg-3857}`;
        
        console.log(`⚡ Lightning tile URL template: ${tileUrl}`);
        
        // Add lightning source with PHP proxy URL and TIME parameter
        try {
            mapInstance.addSource('simple-lightning', {
                type: 'raster',
                tiles: [tileUrl],
                tileSize: 256, // Reduced from 512 to 256 for better zoom compatibility
                minzoom: 0,
                maxzoom: 18,
                attribution: '© NOAA Global Lightning Detection Network'
            });
            
            // Add lightning layer with zoom range configuration
            mapInstance.addLayer({
                id: 'simple-lightning-layer',
                type: 'raster',
                source: 'simple-lightning',
                minzoom: 0,
                maxzoom: 18,
                paint: {
                    'raster-opacity': 0.8,
                    'raster-fade-duration': 300 // Smooth fade transitions
                }
            });
            
            console.log('⚡ Lightning detection layer added successfully with TIME parameter');
            console.log('🌍 Global coverage: Updates every 15 minutes');
            console.log('📡 Data from US NLDN + Global GLD360 networks');
            
            // Add zoom change listener to debug zoom-related issues
            const debugZoomChange = () => {
                const zoom = mapInstance.getZoom();
                const hasLayer = !!mapInstance.getLayer('simple-lightning-layer');
                const hasSource = !!mapInstance.getSource('simple-lightning');
                console.log(`⚡ Lightning Debug - Zoom: ${zoom.toFixed(2)}, Layer: ${hasLayer}, Source: ${hasSource}`);
            };
            
            mapInstance.on('zoomend', debugZoomChange);
            
            // Store cleanup function for later removal
            if (!window.lightningDebugCleanup) {
                window.lightningDebugCleanup = () => {
                    mapInstance.off('zoomend', debugZoomChange);
                    delete window.lightningDebugCleanup;
                };
            }
            
            return true;
        } catch (addLayerError) {
            console.error('❌ Failed to add lightning layer to map:', addLayerError);
            
            // Clean up source if layer addition failed
            try {
                if (mapInstance.getSource('simple-lightning')) {
                    mapInstance.removeSource('simple-lightning');
                }
            } catch (cleanupError) {
                console.warn('⚠️ Error cleaning up failed lightning source:', cleanupError);
            }
            
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error adding simple lightning layer:', error);
        return false;
    }
};

/**
 * Get weather report for specific rig
 * Can be used in rig popup displays
 */
export const getRigWeatherReport = async (rigName, format = 'SUMMARY') => {
    try {
        if (!window.weatherTest) {
            console.warn('⚠️ Weather system not initialized');
            return null;
        }
        
        // Find rig data
        const rig = findRigByName(rigName);
        if (!rig) {
            console.warn(`⚠️ Rig not found: ${rigName}`);
            return null;
        }
        
        console.log(`🌤️ Getting weather report for ${rigName}...`);
        
        // Get weather data
        const weatherReport = await window.weatherTest.weatherManager.getRigWeatherReport(rig);
        
        // Generate formatted report
        const formattedReport = window.weatherTest.reportGenerator.generateRigReport(
            weatherReport, 
            format
        );
        
        return {
            rigName: rigName,
            weatherData: weatherReport,
            formattedReport: formattedReport
        };
        
    } catch (error) {
        console.error(`❌ Error getting weather for ${rigName}:`, error);
        return null;
    }
};

/**
 * Helper function to find rig by name
 * @private
 */
const findRigByName = (rigName) => {
    // Check current waypoints
    if (window.currentWaypoints) {
        const waypoint = window.currentWaypoints.find(wp => 
            wp.name === rigName || wp.name?.toUpperCase() === rigName?.toUpperCase()
        );
        
        if (waypoint && waypoint.lat && waypoint.lng) {
            return {
                id: waypoint.name,
                name: waypoint.name,
                latitude: waypoint.lat,
                longitude: waypoint.lng,
                coordinates: [waypoint.lng, waypoint.lat]
            };
        }
    }
    
    // Check platform manager
    if (window.platformManager) {
        const platform = window.platformManager.findPlatformByName(rigName);
        if (platform && platform.coordinates) {
            return {
                id: platform.id || platform.name,
                name: platform.name,
                latitude: platform.coordinates[1],
                longitude: platform.coordinates[0],
                coordinates: platform.coordinates
            };
        }
    }
    
    return null;
};

/**
 * Weather module status check
 * Useful for debugging integration
 */
export const getWeatherSystemStatus = () => {
    const status = {
        initialized: !!window.weatherTest,
        weatherManager: !!(window.weatherTest && window.weatherTest.weatherManager),
        reportGenerator: !!(window.weatherTest && window.weatherTest.reportGenerator),
        hasRoute: !!(window.currentWaypoints && window.currentWaypoints.length > 0),
        platformManager: !!window.platformManager,
        mapManager: !!window.mapManager
    };
    
    console.log('🌤️ Weather System Status:', status);
    return status;
};

/**
 * Enable weather overlays on the map
 * Integrates with existing map system to add weather visualization
 */
export const enableWeatherOverlays = async (mapInstance, options = {}) => {
    try {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided for weather overlays');
            return false;
        }
        
        console.log('🌤️ Enabling weather overlays...');
        
        const config = {
            enableSatellite: options.satellite !== false,
            enableRadar: options.radar !== false,
            defaultLayer: options.defaultLayer || 'VISIBLE',
            opacity: options.opacity || 0.7,
            ...options
        };
        
        let overlaysEnabled = false;
        
        // Try to enable NOAA satellite/radar overlays if available
        if (window.noaaWeather || window.NOAASatelliteService) {
            const service = window.noaaWeather || new window.NOAASatelliteService();
            
            try {
                const success = await service.addTestOverlay(mapInstance, config.defaultLayer);
                if (success) {
                    overlaysEnabled = true;
                    console.log('✅ NOAA weather overlays enabled successfully');
                }
            } catch (error) {
                console.warn('⚠️ NOAA overlay failed:', error.message);
            }
        }
        
        // Enable weather visualization layers if available
        if (window.weatherTest && window.weatherTest.weatherManager) {
            try {
                // Initialize weather visualization
                const managers = {
                    mapManager: mapInstance,
                    platformManager: window.platformManager
                };
                
                window.weatherTest.weatherManager.initialize(managers);
                overlaysEnabled = true;
                console.log('✅ Weather visualization system enabled');
                
            } catch (error) {
                console.warn('⚠️ Weather visualization failed:', error.message);
            }
        }
        
        if (overlaysEnabled) {
            console.log('🎉 Weather overlays enabled successfully!');
            
            // Store configuration for later use
            if (!window.weatherOverlayConfig) {
                window.weatherOverlayConfig = config;
            }
            
            return true;
        } else {
            console.warn('⚠️ No weather overlay services available');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error enabling weather overlays:', error);
        return false;
    }
};

// Console helper functions for manual testing
if (typeof window !== 'undefined') {
    // Import and initialize the weather suite
    import('./weather/WeatherSuiteManager.js').then(module => {
        const WeatherSuiteManager = module.default;
        window.WeatherSuiteManager = WeatherSuiteManager;
        window.weatherSuite = new WeatherSuiteManager();
        
        console.log('🌩️ Weather Suite Manager loaded and available at: window.weatherSuite');
    }).catch(error => {
        console.warn('⚠️ Could not load WeatherSuiteManager:', error);
    });
    
    window.weatherHelpers = {
        init: initializeWeatherSystem,
        getRouteWeather: getRouteWeather,
        enableWeatherOverlays: enableWeatherOverlays,
        getRigWeatherReport: getRigWeatherReport,
        getStatus: getWeatherSystemStatus,
        // New NOAA functions
        addNOAAOverlay: addNOAAWeatherOverlay,
        removeNOAAOverlay: removeNOAAWeatherOverlay,
        addLightningSimple: addSimpleLightningOverlay,
        addLightningNoTime: addSimpleLightningOverlayNoTime,
        testNOAA: () => window.testNOAAWeather ? window.testNOAAWeather() : console.warn('NOAA test not available'),
        testGulf: (lat = 29.0, lon = -94.0) => window.testGulfLocation ? window.testGulfLocation(lat, lon) : console.warn('Gulf test not available'),
        
        // Weather Suite shortcuts (will be available after import completes)
        setupRigWeather: async () => {
            if (window.weatherSuite) {
                if (!window.weatherSuite.isInitialized) {
                    window.weatherSuite.initialize(window.mapManager.map);
                }
                return await window.weatherSuite.setupForRigOperations();
            } else {
                console.warn('⚠️ Weather suite not loaded yet, try again in a moment');
                return false;
            }
        },
        
        setupStormTracking: async () => {
            if (window.weatherSuite) {
                if (!window.weatherSuite.isInitialized) {
                    window.weatherSuite.initialize(window.mapManager.map);
                }
                return await window.weatherSuite.setupForStormTracking();
            } else {
                console.warn('⚠️ Weather suite not loaded yet, try again in a moment');
                return false;
            }
        },
        
        addLightning: async (opacity = 0.9) => {
            if (window.weatherSuite) {
                if (!window.weatherSuite.isInitialized) {
                    window.weatherSuite.initialize(window.mapManager.map);
                }
                return await window.weatherSuite.addWeatherLayer('LIGHTNING', { opacity });
            } else {
                console.warn('⚠️ Weather suite not loaded yet, try again in a moment');
                return false;
            }
        },
        
        clearAllWeather: async () => {
            if (window.weatherSuite && window.weatherSuite.isInitialized) {
                return await window.weatherSuite.clearAllWeatherLayers();
            } else {
                // Fallback to removing NOAA overlays
                window.weatherHelpers.removeNOAAOverlay(window.mapManager.map);
                console.log('✅ Cleared basic weather overlays');
                return true;
            }
        },
        
        // Helper to find and use map automatically
        enableWeatherOverlaysAuto: async (options = {}) => {
            console.log('🔍 Searching for map instance...');
            
            // Try different possible map locations
            let mapInstance = null;
            
            if (window.mapManager?.map) {
                mapInstance = window.mapManager.map;
                console.log('✅ Found map at: window.mapManager.map');
            } else if (window.mapManager && typeof window.mapManager.getMap === 'function') {
                mapInstance = window.mapManager.getMap();
                console.log('✅ Found map via: window.mapManager.getMap()');
            } else if (window.mapManagerRef?.current?.map) {
                mapInstance = window.mapManagerRef.current.map;
                console.log('✅ Found map at: window.mapManagerRef.current.map');
            } else if (window.mapInstance) {
                mapInstance = window.mapInstance;
                console.log('✅ Found map at: window.mapInstance');
            } else {
                console.error('❌ Could not find map instance. Available options:');
                console.log('   window.mapManager:', !!window.mapManager);
                console.log('   window.mapManagerRef:', !!window.mapManagerRef);
                console.log('   window.mapInstance:', !!window.mapInstance);
                return false;
            }
            
            if (mapInstance) {
                return await enableWeatherOverlays(mapInstance, options);
            } else {
                console.error('❌ No valid map instance found');
                return false;
            }
        },
        
        // Helper to show available map objects
        findMap: () => {
            console.log('🔍 Available map objects:');
            console.log('window.mapManager:', window.mapManager);
            console.log('window.mapManager?.map:', window.mapManager?.map);
            console.log('window.mapManagerRef:', window.mapManagerRef);
            console.log('window.mapManagerRef?.current:', window.mapManagerRef?.current);
            console.log('window.mapInstance:', window.mapInstance);
            
            // Try to identify the actual Mapbox GL map
            const candidates = [
                { name: 'window.mapManager.map', obj: window.mapManager?.map },
                { name: 'window.mapManager', obj: window.mapManager },
                { name: 'window.mapManagerRef?.current?.map', obj: window.mapManagerRef?.current?.map },
                { name: 'window.mapInstance', obj: window.mapInstance }
            ];
            
            console.log('🎯 Mapbox GL map candidates:');
            candidates.forEach(candidate => {
                if (candidate.obj && candidate.obj.addSource && candidate.obj.addLayer) {
                    console.log(`✅ ${candidate.name} - Looks like a Mapbox GL map!`);
                } else if (candidate.obj) {
                    console.log(`⚠️ ${candidate.name} - Object exists but doesn't look like Mapbox GL`);
                } else {
                    console.log(`❌ ${candidate.name} - Not available`);
                }
            });
        }
    };
    
    console.log('🌤️ Weather helpers available at: window.weatherHelpers');
    console.log('🚀 Initialize with: window.weatherHelpers.init()');
    console.log('🛰️ Test NOAA with: window.weatherHelpers.testNOAA()');
    console.log('🌊 Test Gulf with: window.weatherHelpers.testGulf()');
}

export default {
    initializeWeatherSystem,
    getRouteWeather,
    enableWeatherOverlays,
    getRigWeatherReport,
    getWeatherSystemStatus,
    addNOAAWeatherOverlay,
    removeNOAAWeatherOverlay
};