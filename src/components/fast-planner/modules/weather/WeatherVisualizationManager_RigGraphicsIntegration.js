/**
 * WeatherVisualizationManager_RigGraphicsIntegration.js
 * 
 * Integration patch showing how to add RigWeatherGraphics to your existing WeatherVisualizationManager
 * 
 * This shows the key changes needed to integrate the new rig weather graphics system
 */

// ADD THIS IMPORT at the top of WeatherVisualizationManager.js
import RigWeatherGraphicsIntegration from '../layers/RigWeatherGraphicsIntegration.js';

// MODIFY the constructor to include rig weather graphics
class WeatherVisualizationManager {
    constructor() {
        // ... existing constructor code ...
        
        // ADD: Rig weather graphics integration
        this.rigWeatherIntegration = null;      // Will be initialized with map reference
        this.rigWeatherVisible = false;         // Track rig graphics visibility
        
        console.log('WeatherVisualizationManager initialized with rig weather graphics support');
    }
    
    // MODIFY the initialize method to set up rig weather graphics
    initialize(managers) {
        console.log('🌤️ Initializing Weather Manager with managers:', {
            hasMapManager: !!managers.mapManager,
            hasPlatformManager: !!managers.platformManager
        });
        
        // Store manager references
        this.mapManager = managers.mapManager;
        this.platformManager = managers.platformManager;
        
        // Initialize weather API
        this.weatherAPI.initialize();
        
        // ADD: Initialize rig weather graphics integration
        if (this.mapManager) {
            this.rigWeatherIntegration = new RigWeatherGraphicsIntegration(this.mapManager);
            
            // Wait for map to be ready, then initialize
            setTimeout(() => {
                if (this.rigWeatherIntegration.initialize()) {
                    console.log('✅ Rig weather graphics integration ready');
                    
                    // Make available globally for Map Layers Card
                    window.rigWeatherIntegration = this.rigWeatherIntegration;
                } else {
                    console.warn('⚠️ Rig weather graphics integration failed');
                }
            }, 1000);
        }
        
        console.log('✅ Weather Manager initialized');
    }
    
    // MODIFY showWeatherOverlays to include rig weather graphics
    async showWeatherOverlays() {
        if (!this.mapManager || !this.mapManager.map) {
            console.warn('Cannot show weather overlays - map not available');
            return;
        }
        
        console.log('🌤️ Showing weather overlays with rig graphics');
        
        // Get platform locations (your existing method)
        const platforms = this.getPlatformLocations();
        
        if (platforms.length === 0) {
            console.warn('No platforms available for weather display');
            return;
        }
        
        // ADD: Fetch aviation weather for rig graphics
        await this.showRigWeatherGraphics(platforms);
        
        // Create and display weather points (your existing code)
        await this.createWeatherDataPoints(platforms);
        
        this.isWeatherVisible = true;
        console.log('✅ Weather overlays displayed with rig graphics');
    }
    
    // ADD: New method to show rig weather graphics
    async showRigWeatherGraphics(platforms) {
        if (!this.rigWeatherIntegration) {
            console.warn('Rig weather integration not available');
            return;
        }
        
        console.log('🎯 Fetching aviation weather for rig graphics...');
        
        // Fetch aviation weather for each platform
        const weatherDataMap = {};
        let successCount = 0;
        
        for (const platform of platforms) {
            try {
                console.log(`Fetching aviation weather for ${platform.name} at ${platform.lat}, ${platform.lon}`);
                
                // Use your aviation weather API (when implemented) instead of NWS
                const aviationWeather = await this.fetchAviationWeather(platform.lat, platform.lon);
                
                if (aviationWeather) {
                    weatherDataMap[platform.name] = aviationWeather;
                    successCount++;
                    console.log(`✅ Aviation weather loaded for ${platform.name}`);
                } else {
                    console.warn(`⚠️ No aviation weather data for ${platform.name}`);
                }
                
            } catch (error) {
                console.warn(`Failed to get aviation weather for ${platform.name}:`, error.message);
            }
        }
        
        if (successCount > 0) {
            // Display rig weather graphics
            this.rigWeatherIntegration.displayRigWeatherGraphics(platforms, weatherDataMap);
            this.rigWeatherVisible = true;
            
            console.log(`🎯 Rig weather graphics displayed for ${successCount}/${platforms.length} platforms`);
        } else {
            console.warn('No aviation weather data available for rig graphics');
        }
    }
    
    // ADD: New method for aviation weather (placeholder for your aviation API)
    async fetchAviationWeather(lat, lon) {
        // TODO: Replace this with your Aviation Weather Center API implementation
        // For now, return mock aviation data structure
        console.log(`🚁 Fetching aviation weather for ${lat}, ${lon} (placeholder)`);
        
        // This should be replaced with actual aviation API call
        return {
            // Mock aviation data - replace with real API
            ceiling: 1200,              // ft AGL
            flightCategory: 'MVFR',     // VFR/MVFR/IFR/LIFR
            visibility: 4.5,            // statute miles
            cloudCoverage: 65,          // percentage
            windSpeed: 22,              // knots
            windDirection: 170,         // degrees
            windGust: 28,               // knots (if present)
            temperature: 75,            // °F
            dewPoint: 65,               // °F
            conditions: 'Broken clouds'
        };
    }
    
    // MODIFY hideWeatherOverlays to include rig graphics cleanup
    hideWeatherOverlays() {
        if (!this.mapManager || !this.mapManager.map) {
            console.warn('Cannot hide weather overlays - map not available');
            return;
        }
        
        console.log('🌤️ Removing weather overlays including rig graphics');
        
        // ADD: Remove rig weather graphics
        if (this.rigWeatherIntegration) {
            this.rigWeatherIntegration.removeRigWeatherGraphics();
            this.rigWeatherVisible = false;
            console.log('🧹 Rig weather graphics removed');
        }
        
        // Your existing weather overlay removal code...
        // [Keep all your existing cleanup code here]
        
        this.isWeatherVisible = false;
        console.log('✅ All weather overlays removed');
    }
    
    // ADD: Method to toggle rig weather graphics specifically
    toggleRigWeatherGraphics(visible) {
        if (!this.rigWeatherIntegration) {
            console.warn('Rig weather integration not available');
            return;
        }
        
        if (visible && !this.rigWeatherVisible) {
            // Show rig graphics
            const platforms = this.getPlatformLocations();
            this.showRigWeatherGraphics(platforms);
        } else if (!visible && this.rigWeatherVisible) {
            // Hide rig graphics
            this.rigWeatherIntegration.removeRigWeatherGraphics();
            this.rigWeatherVisible = false;
        }
        
        console.log(`🎯 Rig weather graphics ${visible ? 'enabled' : 'disabled'}`);
    }
    
    // ADD: Getter for rig weather graphics status
    isRigWeatherVisible() {
        return this.rigWeatherVisible;
    }
    
    // The rest of your existing methods remain unchanged...
}

/* 
INTEGRATION STEPS:

1. Add the import at the top of WeatherVisualizationManager.js
2. Add the rig weather integration properties to the constructor
3. Modify the initialize method to set up rig weather graphics
4. Modify showWeatherOverlays to include rig graphics
5. Add the new aviation weather fetching method
6. Modify hideWeatherOverlays to clean up rig graphics
7. Add the toggle method for rig graphics

NEXT STEPS:
1. Implement the aviation API to replace fetchAviationWeather placeholder
2. Add rig weather toggle to Map Layers Card
3. Test with your 4 rig locations
4. Fine-tune visual appearance
*/