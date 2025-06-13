/**
 * NOAAWeatherIntegration.js
 * Simple integration helper to add NOAA satellite/radar to existing weather system
 * 
 * This can be imported and called from your FastPlannerApp or weather modules
 */

import NOAASatelliteService from './NOAASatelliteService.js';
import ComprehensiveWeatherTest from './ComprehensiveWeatherTest.js';

class NOAAWeatherIntegration {
    constructor() {
        this.noaaService = new NOAASatelliteService();
        this.weatherTest = new ComprehensiveWeatherTest();
        this.isInitialized = false;
        
        console.log('🛰️ NOAA Weather Integration ready');
    }
    
    /**
     * Initialize NOAA services and make them available globally
     */
    initialize() {
        if (this.isInitialized) {
            console.log('🛰️ NOAA services already initialized');
            return true;
        }
        
        try {
            // Make services available globally for console testing
            window.noaaWeather = this.noaaService;
            window.noaaWeatherTest = this.weatherTest;
            
            // Add quick test methods to window
            window.testNOAAWeather = () => this.weatherTest.quickTest();
            window.testGulfLocation = (lat = 29.0, lon = -94.0) => 
                this.weatherTest.testLocation(lat, lon, 'Gulf Test Location');
            
            this.isInitialized = true;
            
            console.log('✅ NOAA Weather Integration initialized successfully!');
            console.log('🧪 Test NOAA weather with: window.testNOAAWeather()');
            console.log('📍 Test Gulf location with: window.testGulfLocation(29.0, -94.0)');
            console.log('🛰️ Access NOAA service at: window.noaaWeather');
            
            return true;
            
        } catch (error) {
            console.error('❌ NOAA Weather Integration failed:', error);
            return false;
        }
    }
    
    /**
     * Add NOAA weather overlay to existing map
     * @param {Object} mapInstance - Your existing Mapbox map
     * @param {string} layerType - 'VISIBLE', 'CARIBBEAN' (radar), etc.
     */
    async addWeatherOverlay(mapInstance, layerType = 'CARIBBEAN') {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided');
            return false;
        }
        
        try {
            console.log(`🗺️ Adding ${layerType} weather overlay...`);
            
            // Use CARIBBEAN radar for Gulf of Mexico (best coverage)
            const success = await this.noaaService.addTestOverlay(mapInstance, layerType);
            
            if (success) {
                console.log(`✅ ${layerType} weather overlay added to map`);
                return true;
            } else {
                console.log(`❌ Failed to add ${layerType} overlay`);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Weather overlay failed:', error);
            return false;
        }
    }
    
    /**
     * Remove weather overlay from map
     * @param {Object} mapInstance - Your existing Mapbox map
     */
    removeWeatherOverlay(mapInstance) {
        if (!mapInstance) {
            console.warn('⚠️ No map instance provided');
            return;
        }
        
        try {
            this.noaaService.removeOverlay(mapInstance);
            console.log('✅ Weather overlay removed');
        } catch (error) {
            console.error('❌ Failed to remove weather overlay:', error);
        }
    }
    
    /**
     * Quick test for Gulf of Mexico locations
     */
    async quickGulfTest() {
        console.log('🌊 Running quick Gulf of Mexico weather test...');
        
        const gulfLocations = [
            { name: 'Houston Offshore', lat: 29.0, lon: -94.0 },
            { name: 'Louisiana Shelf', lat: 28.5, lon: -91.5 }
        ];
        
        const results = [];
        
        for (const location of gulfLocations) {
            console.log(`📍 Testing ${location.name}...`);
            
            const result = await this.weatherTest.testLocation(
                location.lat, 
                location.lon, 
                location.name
            );
            
            results.push({
                location: location,
                coverage: result.weatherData.coverage,
                satelliteLayers: result.weatherData.satelliteData?.length || 0,
                radarLayers: result.weatherData.radarData?.length || 0,
                liveWeather: !!result.liveWeather
            });
        }
        
        console.log('🌊 Gulf test results:', results);
        return results;
    }
    
    /**
     * Get available weather layers for a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} Available layers
     */
    async getAvailableLayers(lat, lon) {
        const coverage = this.noaaService.isWithinCoverage(lat, lon);
        const result = {
            location: { lat, lon },
            coverage: coverage,
            satelliteLayers: [],
            radarLayers: []
        };
        
        if (coverage.withinSatellite) {
            result.satelliteLayers = Object.keys(this.noaaService.satelliteLayers);
        }
        
        if (coverage.withinRadar) {
            result.radarLayers = coverage.radarRegions.map(region => 
                `${region}_RADAR`
            );
        }
        
        return result;
    }
}

// Create and export singleton instance
const noaaIntegration = new NOAAWeatherIntegration();

// Auto-initialize when imported
noaaIntegration.initialize();

export default noaaIntegration;

// Also export the class for custom instantiation
export { NOAAWeatherIntegration };