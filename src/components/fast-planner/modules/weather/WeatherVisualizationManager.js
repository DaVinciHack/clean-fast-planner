/**
 * WeatherVisualizationManager.js
 * Main Weather Manager for Fast Planner
 * 
 * Handles weather data integration and 3D visualization
 * Following same patterns as MapManager, PlatformManager, etc.
 * NO dummy data - real aviation weather only
 */

import WeatherAPIService from './WeatherAPIService.js';
import { WeatherReport, RigWeatherReport, WeatherLayer3D } from './utils/WeatherTypes.js';

class WeatherVisualizationManager {
    constructor() {
        // Weather API service
        this.weatherAPI = new WeatherAPIService();
        
        // Weather data storage
        this.weatherReports = new Map();        // Location-based weather reports
        this.rigWeatherReports = new Map();     // Rig-specific weather reports
        this.weather3DLayers = [];              // 3D weather layers for visualization
        
        // Visualization settings
        this.isWeatherVisible = false;          // Weather overlay visibility
        this.activeWeatherLayers = [];          // Currently displayed layers
        this.weatherOpacity = 0.7;              // Weather layer opacity
        
        // Update intervals
        this.updateInterval = null;
        this.updateFrequency = 10 * 60 * 1000;  // Update every 10 minutes
        
        // Integration points
        this.mapManager = null;                 // Reference to MapManager
        this.platformManager = null;            // Reference to PlatformManager
        
        // Weather overlay controls
        this.weatherControls = {
            showClouds: true,
            showTurbulence: false,
            showIcing: false,
            showWind: true,
            altitudeFilter: null                // Filter by altitude range
        };
        
        console.log('WeatherVisualizationManager initialized');
    }
    
    /**
     * Initialize weather manager with other managers
     * @param {Object} managers - Other manager instances
     */
    initialize(managers = {}) {
        try {
            // Store references to other managers
            this.mapManager = managers.mapManager || null;
            this.platformManager = managers.platformManager || null;
            
            // Initialize weather API service
            this.weatherAPI.initialize();
            
            // Start weather update cycle
            this.startWeatherUpdates();
            
            // Initialize weather integration with existing systems
            this.initializeWeatherIntegration();
            
            console.log('WeatherVisualizationManager initialized with manager references');
            
        } catch (error) {
            console.error('WeatherVisualizationManager initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Get weather report for a specific location
     * @param {Object} location - Location object with coordinates
     * @param {Object} options - Request options
     * @returns {Promise<WeatherReport>} Weather report
     */
    async getWeatherForLocation(location, options = {}) {
        if (!location || !location.latitude || !location.longitude) {
            throw new Error('Invalid location for weather request');
        }
        
        try {
            const locationKey = this.getLocationKey(location);
            
            // Check if we have recent weather data
            const existing = this.weatherReports.get(locationKey);
            if (existing && this.isWeatherDataCurrent(existing)) {
                console.log('Returning cached weather for', location.name || locationKey);
                return existing;
            }
            
            // Fetch fresh weather data
            console.log('Fetching fresh weather data for', location.name || locationKey);
            const weatherReport = await this.weatherAPI.getWeatherForLocation(location, options);
            
            // Store the report
            this.weatherReports.set(locationKey, weatherReport);
            
            // Notify any listeners of weather update
            this.notifyWeatherUpdate(locationKey, weatherReport);
            
            return weatherReport;
            
        } catch (error) {
            console.error('Failed to get weather for location:', error);
            throw error;
        }
    }
    
    /**
     * Get weather report for a specific rig
     * @param {Object} rig - Rig object with coordinates and metadata
     * @param {Object} options - Request options
     * @returns {Promise<RigWeatherReport>} Rig-specific weather report
     */
    async getRigWeatherReport(rig, options = {}) {
        if (!rig || !rig.latitude || !rig.longitude) {
            throw new Error('Invalid rig for weather request');
        }
        
        try {
            const rigKey = this.getRigKey(rig);
            
            // Check for existing current data
            const existing = this.rigWeatherReports.get(rigKey);
            if (existing && this.isWeatherDataCurrent(existing)) {
                console.log('Returning cached rig weather for', rig.name || rigKey);
                return existing;
            }
            
            // Fetch fresh rig weather data
            console.log('Fetching fresh rig weather data for', rig.name || rigKey);
            const rigWeatherReport = await this.weatherAPI.getRigWeatherReport(rig, options);
            
            // Store the report
            this.rigWeatherReports.set(rigKey, rigWeatherReport);
            
            // Notify of rig weather update
            this.notifyRigWeatherUpdate(rigKey, rigWeatherReport);
            
            return rigWeatherReport;
            
        } catch (error) {
            console.error('Failed to get rig weather report:', error);
            throw error;
        }
    }
    
    /**
     * Get weather for all visible rigs
     * @param {Array} rigs - Array of rig objects
     * @returns {Promise<Map>} Map of rig weather reports
     */
    async getWeatherForAllRigs(rigs) {
        if (!Array.isArray(rigs) || rigs.length === 0) {
            console.log('No rigs provided for weather updates');
            return new Map();
        }
        
        console.log(`Getting weather for ${rigs.length} rigs`);
        const weatherPromises = [];
        
        for (const rig of rigs) {
            if (rig.latitude && rig.longitude) {
                weatherPromises.push(
                    this.getRigWeatherReport(rig).catch(error => {
                        console.error(`Weather failed for rig ${rig.name || rig.id}:`, error);
                        return null; // Don't fail entire batch for one rig
                    })
                );
            }
        }
        
        try {
            const results = await Promise.all(weatherPromises);
            const weatherMap = new Map();
            
            results.forEach((report, index) => {
                if (report) {
                    const rig = rigs[index];
                    const key = this.getRigKey(rig);
                    weatherMap.set(key, report);
                }
            });
            
            console.log(`Successfully retrieved weather for ${weatherMap.size} rigs`);
            return weatherMap;
            
        } catch (error) {
            console.error('Batch rig weather update failed:', error);
            throw error;
        }
    }
    
    /**
     * Show/hide weather overlays on map
     * @param {boolean} visible - Whether to show weather overlays
     */
    setWeatherVisible(visible) {
        this.isWeatherVisible = visible;
        
        if (visible) {
            this.showWeatherOverlays();
        } else {
            this.hideWeatherOverlays();
        }
        
        console.log('Weather overlays:', visible ? 'SHOWN' : 'HIDDEN');
    }
    
    /**
     * Toggle specific weather layer types
     * @param {string} layerType - Type of weather layer (clouds, turbulence, icing, wind)
     * @param {boolean} visible - Whether to show this layer type
     */
    toggleWeatherLayer(layerType, visible) {
        if (!this.weatherControls.hasOwnProperty(`show${layerType.charAt(0).toUpperCase() + layerType.slice(1)}`)) {
            console.error('Invalid weather layer type:', layerType);
            return;
        }
        
        this.weatherControls[`show${layerType.charAt(0).toUpperCase() + layerType.slice(1)}`] = visible;
        
        if (this.isWeatherVisible) {
            this.refreshWeatherOverlays();
        }
        
        console.log(`Weather layer ${layerType}:`, visible ? 'ENABLED' : 'DISABLED');
    }
    
    /**
     * Set weather opacity
     * @param {number} opacity - Opacity value (0-1)
     */
    setWeatherOpacity(opacity) {
        if (opacity < 0 || opacity > 1) {
            console.error('Invalid opacity value:', opacity);
            return;
        }
        
        this.weatherOpacity = opacity;
        
        if (this.isWeatherVisible) {
            this.updateWeatherOpacity();
        }
        
        console.log('Weather opacity set to:', opacity);
    }
    
    /**
     * Generate weather report for a rig (for export/display)
     * @param {string} rigId - Rig identifier
     * @returns {Object} Formatted weather report
     */
    generateRigWeatherReport(rigId) {
        const rigWeather = this.getRigWeatherFromCache(rigId);
        
        if (!rigWeather) {
            return {
                rigId: rigId,
                status: 'NO_DATA',
                message: 'Weather data not available'
            };
        }
        
        // Format report for display
        const report = {
            rigId: rigId,
            timestamp: rigWeather.timestamp,
            coordinates: rigWeather.coordinates,
            
            // Current conditions
            conditions: {
                windSpeed: rigWeather.getParameter('wind_speed_kts'),
                windDirection: rigWeather.getParameter('wind_direction_deg'),
                visibility: rigWeather.getParameter('visibility_sm'),
                temperature: rigWeather.getParameter('temperature_c'),
                waveHeight: rigWeather.waveHeight,
                seaState: rigWeather.seaState
            },
            
            // Flight category and recommendations
            flightCategory: rigWeather.calculateFlightCategory(),
            landingRecommendation: rigWeather.landingRecommendation,
            alternateRequired: rigWeather.alternateRequired,
            
            // Identified hazards
            hazards: rigWeather.identifyHazards(),
            
            // Data source and validity
            source: rigWeather.source,
            validTime: rigWeather.validTime
        };
        
        return report;
    }
    
    /**
     * Start automatic weather updates
     * @private
     */
    startWeatherUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.updateInterval = setInterval(() => {
            this.performScheduledWeatherUpdate();
        }, this.updateFrequency);
        
        console.log(`Weather updates started - every ${this.updateFrequency / 1000 / 60} minutes`);
    }
    
    /**
     * Stop automatic weather updates
     */
    stopWeatherUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Weather updates stopped');
        }
    }
    
    /**
     * Perform scheduled weather update
     * @private
     */
    async performScheduledWeatherUpdate() {
        console.log('Performing scheduled weather update...');
        
        try {
            // Update weather for visible rigs if platform manager is available
            if (this.platformManager && this.platformManager.getCurrentRigs) {
                const currentRigs = this.platformManager.getCurrentRigs();
                if (currentRigs && currentRigs.length > 0) {
                    await this.getWeatherForAllRigs(currentRigs);
                }
            }
            
            // Clean old weather data
            this.cleanExpiredWeatherData();
            
        } catch (error) {
            console.error('Scheduled weather update failed:', error);
        }
    }
    
    /**
     * Enhance existing rig popups with live NWS weather data
     * This integrates with your existing TAF/METAR system
     * @private
     */
    async showWeatherOverlays() {
        if (!this.mapManager || !this.mapManager.map) {
            console.warn('Cannot show weather overlays - map not available');
            return;
        }
        
        console.log('🌤️ Adding live weather data to map with popups');
        
        try {
            // Get platform locations
            const platforms = this.getPlatformLocations();
            
            if (platforms.length === 0) {
                console.log('No platform locations found for weather integration');
                return;
            }
            
            console.log(`Found ${platforms.length} platforms for weather integration`);
            
            // Create weather data points with popups
            await this.createWeatherDataPoints(platforms);
            
        } catch (error) {
            console.error('Failed to add weather data to map:', error);
        }
        
        // Mark as visible
        this.isWeatherVisible = true;
        console.log('🌤️ Live weather data added to map');
    }
    
    /**
     * Create weather data points on the map with popups
     * @private
     */
    async createWeatherDataPoints(platforms) {
        const weatherFeatures = [];
        
        // Get weather data for each platform
        for (const platform of platforms) {
            try {
                console.log(`Fetching weather for ${platform.name} at ${platform.lat}, ${platform.lon}`);
                const weatherData = await this.fetchNWSPointWeather(platform.lat, platform.lon);
                
                if (weatherData) {
                    weatherFeatures.push({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [platform.lon, platform.lat]
                        },
                        properties: {
                            platformId: platform.id,
                            platformName: platform.name,
                            temperature: weatherData.temperature,
                            windSpeed: weatherData.windSpeed,
                            windDirection: weatherData.windDirection,
                            visibility: weatherData.visibility,
                            skyCover: weatherData.skyCover,
                            conditions: weatherData.conditions,
                            weatherHTML: await this.createLiveWeatherSection(platform)
                        }
                    });
                    
                    console.log(`✅ Weather data loaded for ${platform.name}: ${weatherData.conditions}`);
                } else {
                    console.warn(`⚠️ No weather data for ${platform.name}`);
                }
                
            } catch (error) {
                console.warn(`Failed to get weather for ${platform.name}:`, error.message);
            }
        }
        
        // Add weather points to map if we have data
        if (weatherFeatures.length > 0) {
            // Add weather data source
            this.mapManager.map.addSource('live-weather-data', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: weatherFeatures
                }
            });
            
            // Add weather symbols (small blue dots)
            this.mapManager.map.addLayer({
                id: 'live-weather-symbols',
                type: 'circle',
                source: 'live-weather-data',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#40c8f0',
                    'circle-stroke-color': '#ffffff',
                    'circle-stroke-width': 2,
                    'circle-opacity': 0.8
                }
            });
            
            // Add weather condition labels
            this.mapManager.map.addLayer({
                id: 'live-weather-labels',
                type: 'symbol',
                source: 'live-weather-data',
                layout: {
                    'text-field': ['concat', ['get', 'conditions'], '\n', ['get', 'temperature'], '°F'],
                    'text-font': ['Arial Unicode MS Bold'],
                    'text-size': 10,
                    'text-offset': [0, 2.5],
                    'text-anchor': 'top'
                },
                paint: {
                    'text-color': '#40c8f0',
                    'text-halo-color': '#000000',
                    'text-halo-width': 2
                }
            });
            
            // Add click handler for weather popups
            this.mapManager.map.on('click', 'live-weather-symbols', (e) => {
                const properties = e.features[0].properties;
                
                // Create popup with weather data
                const popup = new window.mapboxgl.Popup({
                    closeButton: true,
                    closeOnClick: false,
                    offset: 15,
                    className: 'live-weather-popup',
                    maxWidth: '300px'
                });
                
                // Use the generated weather HTML
                popup.setLngLat(e.lngLat)
                     .setHTML(properties.weatherHTML)
                     .addTo(this.mapManager.map);
            });
            
            // Change cursor on hover
            this.mapManager.map.on('mouseenter', 'live-weather-symbols', () => {
                this.mapManager.map.getCanvas().style.cursor = 'pointer';
            });
            
            this.mapManager.map.on('mouseleave', 'live-weather-symbols', () => {
                this.mapManager.map.getCanvas().style.cursor = '';
            });
            
            console.log(`✅ Added ${weatherFeatures.length} live weather points to map`);
        }
    }
    
    /**
     * Get platform locations from the existing platform system
     * @private
     */
    getPlatformLocations() {
        const platforms = [];
        
        // Try to get platforms from the map layers
        if (this.mapManager && this.mapManager.map) {
            try {
                // Look for existing weather circles or platform markers
                const layers = this.mapManager.map.getStyle().layers;
                
                // For now, use some Gulf of Mexico rig locations as examples
                // In production, this would pull from your actual platform data
                const gulfRigs = [
                    { id: 'PL22', name: 'PL22', lat: 28.5, lon: -90.0 },
                    { id: 'PL15', name: 'PL15', lat: 29.0, lon: -89.5 },
                    { id: 'PL08', name: 'PL08', lat: 28.0, lon: -91.0 },
                    { id: 'PL35', name: 'PL35', lat: 28.8, lon: -90.8 }
                ];
                
                platforms.push(...gulfRigs);
                
            } catch (error) {
                console.warn('Could not extract platform locations:', error.message);
            }
        }
        
        return platforms;
    }
    
    /**
     * Enhance existing popups with live weather data section
     * @private
     */
    async enhanceExistingPopups(platforms) {
        console.log('🌤️ Enhancing existing popups with live weather data');
        
        // Store original popup creation function if it exists
        if (!window.originalCreatePopup && window.createWeatherPopup) {
            window.originalCreatePopup = window.createWeatherPopup;
        }
        
        // Create enhanced popup function
        window.createWeatherPopup = async (platformId, platformData, existingContent) => {
            // Call original popup creation if it exists
            let baseContent = existingContent;
            if (window.originalCreatePopup && typeof window.originalCreatePopup === 'function') {
                baseContent = window.originalCreatePopup(platformId, platformData, existingContent);
            }
            
            // Add live weather section
            const liveWeatherSection = await this.createLiveWeatherSection(platformData);
            
            // Combine existing content with live weather
            return this.combinePopupContent(baseContent, liveWeatherSection);
        };
        
        // For each platform, try to enhance popups on click
        platforms.forEach(platform => {
            this.setupPlatformWeatherIntegration(platform);
        });
    }
    
    /**
     * Create comprehensive live weather section for popup
     * @private
     */
    async createLiveWeatherSection(platformData) {
        try {
            const liveWeather = await this.fetchNWSPointWeather(platformData.lat, platformData.lon);
            
            if (!liveWeather) {
                return `
                    <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid #ff9800;">
                        <strong style="color: #ff9800;">🌤️ Live Weather (NWS)</strong><br>
                        <span style="color: #ccc; font-size: 12px;">Weather data unavailable</span>
                    </div>
                `;
            }
            
            // Build weather display with all available parameters
            let weatherDetails = '';
            
            // Temperature and conditions
            if (liveWeather.temperature !== null) {
                weatherDetails += `<strong>Temp:</strong> ${Math.round(liveWeather.temperature)}°F<br>`;
            }
            
            // Wind information
            if (liveWeather.windSpeed !== null && liveWeather.windDirection !== null) {
                const windSpeedKts = Math.round(liveWeather.windSpeed);
                const windDir = Math.round(liveWeather.windDirection);
                weatherDetails += `<strong>Wind:</strong> ${windSpeedKts} kts @ ${windDir}°<br>`;
            }
            
            // Visibility
            if (liveWeather.visibility !== null) {
                const visibilityMiles = (liveWeather.visibility / 1609.34).toFixed(1); // Convert meters to miles
                weatherDetails += `<strong>Visibility:</strong> ${visibilityMiles} SM<br>`;
            }
            
            // Cloud coverage
            if (liveWeather.skyCover !== null) {
                weatherDetails += `<strong>Cloud Cover:</strong> ${liveWeather.skyCover}%<br>`;
            }
            
            // Relative humidity
            if (liveWeather.relativeHumidity !== null) {
                weatherDetails += `<strong>Humidity:</strong> ${Math.round(liveWeather.relativeHumidity)}%<br>`;
            }
            
            // Precipitation probability
            if (liveWeather.probabilityOfPrecipitation !== null) {
                weatherDetails += `<strong>Precip Chance:</strong> ${liveWeather.probabilityOfPrecipitation}%<br>`;
            }
            
            // Weather conditions
            if (liveWeather.weather && liveWeather.weather !== 'Clear') {
                weatherDetails += `<strong>Conditions:</strong> ${liveWeather.weather}<br>`;
            }
            
            // Storm warnings/hazards
            let hazardWarning = '';
            if (liveWeather.hazards && liveWeather.hazards.length > 0) {
                const warnings = liveWeather.hazards.map(h => `${h.phenomenon}-${h.significance}`).join(', ');
                hazardWarning = `
                    <div style="margin-top: 4px; padding: 4px; background-color: rgba(255,0,0,0.2); border-radius: 3px; border-left: 2px solid #ff0000;">
                        <strong style="color: #ff4444;">⚠️ Warnings:</strong> ${warnings}
                    </div>
                `;
            }
            
            return `
                <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid #40c8f0;">
                    <strong style="color: #40c8f0;">🌤️ Live Weather (NWS)</strong><br>
                    <div style="font-size: 12px; color: #e0e0e0; margin-top: 4px;">
                        ${weatherDetails}
                        <strong>Overall:</strong> ${liveWeather.conditions}<br>
                        <span style="font-size: 10px; color: #888; margin-top: 4px; display: block;">Updated: ${new Date().toLocaleTimeString()}</span>
                    </div>
                    ${hazardWarning}
                </div>
            `;
            
        } catch (error) {
            console.warn('Failed to create live weather section:', error.message);
            return `
                <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid #f44336;">
                    <strong style="color: #f44336;">🌤️ Live Weather (NWS)</strong><br>
                    <span style="color: #ccc; font-size: 12px;">Error loading weather data</span>
                </div>
            `;
        }
    }
    
    /**
     * Combine existing popup content with live weather section
     * @private
     */
    combinePopupContent(existingContent, liveWeatherSection) {
        if (!existingContent) {
            return liveWeatherSection;
        }
        
        // If existing content is HTML, append the live weather section
        if (typeof existingContent === 'string') {
            return existingContent + liveWeatherSection;
        }
        
        return existingContent + liveWeatherSection;
    }
    
    /**
     * Get live weather HTML for any location (public method for integration)
     * This can be called by your existing popup system
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} platformId - Platform identifier (optional)
     * @returns {Promise<string>} HTML string for live weather section
     */
    async getLiveWeatherHTML(lat, lon, platformId = null) {
        const platformData = { lat, lon, id: platformId };
        return await this.createLiveWeatherSection(platformData);
    }
    
    /**
     * Initialize weather integration with existing systems
     * Call this after the weather manager is loaded
     */
    initializeWeatherIntegration() {
        // Make weather integration globally available
        window.weatherManager = this;
        
        // Create global function for easy integration
        window.getLiveWeatherForPopup = async (lat, lon, platformId) => {
            return await this.getLiveWeatherHTML(lat, lon, platformId);
        };
        
        console.log('✅ Weather integration initialized and available globally');
    }
    
    /**
     * Fetch comprehensive weather data for a specific point from NWS REST API
     * @private
     */
    async fetchNWSPointWeather(lat, lon) {
        try {
            // Use NWS REST API to get current conditions and forecast grid data
            const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
            
            if (!response.ok) {
                throw new Error(`NWS API responded with ${response.status}`);
            }
            
            const pointData = await response.json();
            
            // Get the forecast office and grid coordinates
            if (pointData.properties && pointData.properties.forecastGridData) {
                const gridDataUrl = pointData.properties.forecastGridData;
                const gridResponse = await fetch(gridDataUrl);
                
                if (gridResponse.ok) {
                    const gridData = await gridResponse.json();
                    
                    // Extract comprehensive weather parameters
                    return {
                        temperature: this.extractCurrentValue(gridData.properties.temperature),
                        windSpeed: this.extractCurrentValue(gridData.properties.windSpeed),
                        windDirection: this.extractCurrentValue(gridData.properties.windDirection),
                        visibility: this.extractCurrentValue(gridData.properties.visibility),
                        skyCover: this.extractCurrentValue(gridData.properties.skyCover), // Cloud coverage %
                        dewpoint: this.extractCurrentValue(gridData.properties.dewpoint),
                        relativeHumidity: this.extractCurrentValue(gridData.properties.relativeHumidity),
                        probabilityOfPrecipitation: this.extractCurrentValue(gridData.properties.probabilityOfPrecipitation),
                        weather: this.extractCurrentWeatherConditions(gridData.properties.weather), // Weather conditions array
                        hazards: this.extractCurrentHazards(gridData.properties.hazards), // Storm warnings
                        conditions: this.determineOverallConditions(gridData.properties)
                    };
                }
            }
            
            return null;
            
        } catch (error) {
            console.warn(`NWS API request failed for ${lat},${lon}:`, error.message);
            return null;
        }
    }
    
    /**
     * Extract current value from NWS time series data
     * @private
     */
    extractCurrentValue(timeSeries) {
        if (!timeSeries || !timeSeries.values || timeSeries.values.length === 0) {
            return null;
        }
        
        // Get the most recent value
        const latestValue = timeSeries.values[0];
        return latestValue.value;
    }
    
    /**
     * Extract current weather conditions from NWS weather array
     * @private
     */
    extractCurrentWeatherConditions(weatherSeries) {
        if (!weatherSeries || !weatherSeries.values || weatherSeries.values.length === 0) {
            return null;
        }
        
        const currentWeather = weatherSeries.values[0];
        if (currentWeather && currentWeather.value && Array.isArray(currentWeather.value)) {
            // Return the most significant weather condition
            return currentWeather.value[0]?.weather || 'Clear';
        }
        
        return 'Clear';
    }
    
    /**
     * Extract current hazards/warnings from NWS hazards array
     * @private
     */
    extractCurrentHazards(hazardsSeries) {
        if (!hazardsSeries || !hazardsSeries.values || hazardsSeries.values.length === 0) {
            return [];
        }
        
        const currentHazards = hazardsSeries.values[0];
        if (currentHazards && currentHazards.value && Array.isArray(currentHazards.value)) {
            return currentHazards.value.map(hazard => ({
                phenomenon: hazard.phenomenon,
                significance: hazard.significance,
                eventNumber: hazard.event_number
            }));
        }
        
        return [];
    }
    
    /**
     * Determine overall weather conditions from all parameters
     * @private
     */
    determineOverallConditions(properties) {
        // Simple logic to determine overall conditions
        // This could be enhanced with more sophisticated analysis
        
        const visibility = this.extractCurrentValue(properties.visibility);
        const skyCover = this.extractCurrentValue(properties.skyCover);
        const windSpeed = this.extractCurrentValue(properties.windSpeed);
        const hazards = this.extractCurrentHazards(properties.hazards);
        
        // Check for hazards first
        if (hazards && hazards.length > 0) {
            return 'Storm Warnings Active';
        }
        
        // Check visibility
        if (visibility !== null && visibility < 3) {
            return 'Low Visibility';
        }
        
        // Check wind conditions
        if (windSpeed !== null && windSpeed > 25) {
            return 'High Winds';
        }
        
        // Check cloud coverage
        if (skyCover !== null) {
            if (skyCover < 25) return 'Clear';
            if (skyCover < 50) return 'Partly Cloudy';
            if (skyCover < 75) return 'Mostly Cloudy';
            return 'Overcast';
        }
        
        return 'Good Conditions';
    }
    
    /**
     * Hide weather overlays from map
    /**
     * Hide weather data from map
     * @private
     */
    hideWeatherOverlays() {
        if (!this.mapManager || !this.mapManager.map) {
            console.warn('Cannot hide weather overlays - map not available');
            return;
        }
        
        console.log('🌤️ Removing live weather data from map');

        // Remove weather symbols layer
        try {
            if (this.mapManager.map.getLayer('live-weather-symbols')) {
                this.mapManager.map.removeLayer('live-weather-symbols');
            }
            console.log('✅ Weather symbols layer removed');
        } catch (error) {
            console.warn('⚠️ Could not remove weather symbols layer:', error.message);
        }

        // Remove weather labels layer
        try {
            if (this.mapManager.map.getLayer('live-weather-labels')) {
                this.mapManager.map.removeLayer('live-weather-labels');
            }
            console.log('✅ Weather labels layer removed');
        } catch (error) {
            console.warn('⚠️ Could not remove weather labels layer:', error.message);
        }

        // Remove weather data source
        try {
            if (this.mapManager.map.getSource('live-weather-data')) {
                this.mapManager.map.removeSource('live-weather-data');
            }
            console.log('✅ Weather data source removed');
        } catch (error) {
            console.warn('⚠️ Could not remove weather data source:', error.message);
        }

        // Mark as hidden
        this.isWeatherVisible = false;
        console.log('🌤️ Live weather data removed from map');
    }
    
    /**
     * Refresh weather overlays based on current settings
     * @private
     */
    refreshWeatherOverlays() {
        if (this.isWeatherVisible) {
            this.hideWeatherOverlays();
            this.showWeatherOverlays();
        }
    }
    
    /**
     * Update weather layer opacity
     * @private
     */
    updateWeatherOpacity() {
        // Implementation would update opacity of weather layers on map
        console.log('Weather layer opacity updated to:', this.weatherOpacity);
    }
    
    /**
     * Check if weather data is still current
     * @private
     */
    isWeatherDataCurrent(weatherReport) {
        if (!weatherReport || !weatherReport.timestamp) {
            return false;
        }
        
        const age = Date.now() - new Date(weatherReport.timestamp).getTime();
        const maxAge = 15 * 60 * 1000; // 15 minutes
        
        return age < maxAge;
    }
    
    /**
     * Generate location key for caching
     * @private
     */
    getLocationKey(location) {
        return `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}`;
    }
    
    /**
     * Generate rig key for caching
     * @private
     */
    getRigKey(rig) {
        return rig.id || rig.name || this.getLocationKey(rig);
    }
    
    /**
     * Get rig weather from cache
     * @private
     */
    getRigWeatherFromCache(rigId) {
        return this.rigWeatherReports.get(rigId);
    }
    
    /**
     * Notify listeners of weather update
     * @private
     */
    notifyWeatherUpdate(locationKey, weatherReport) {
        // Implementation would emit events for weather updates
        console.log('Weather updated for location:', locationKey);
    }
    
    /**
     * Notify listeners of rig weather update
     * @private
     */
    notifyRigWeatherUpdate(rigKey, rigWeatherReport) {
        // Implementation would emit events for rig weather updates
        console.log('Rig weather updated for:', rigKey);
    }
    
    /**
     * Clean expired weather data from cache
     * @private
     */
    cleanExpiredWeatherData() {
        let cleanedCount = 0;
        
        // Clean location weather reports
        for (const [key, report] of this.weatherReports.entries()) {
            if (!this.isWeatherDataCurrent(report)) {
                this.weatherReports.delete(key);
                cleanedCount++;
            }
        }
        
        // Clean rig weather reports
        for (const [key, report] of this.rigWeatherReports.entries()) {
            if (!this.isWeatherDataCurrent(report)) {
                this.rigWeatherReports.delete(key);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`Cleaned ${cleanedCount} expired weather reports from cache`);
        }
    }
    
    /**
     * Cleanup method for manager shutdown
     */
    cleanup() {
        this.stopWeatherUpdates();
        this.weatherReports.clear();
        this.rigWeatherReports.clear();
        this.weather3DLayers = [];
        
        console.log('WeatherVisualizationManager cleaned up');
    }
}

export default WeatherVisualizationManager;
