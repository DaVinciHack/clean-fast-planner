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
import RigWeatherGraphics from './RigWeatherGraphics.js';

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
        this.rigWeatherGraphics = null;         // Rig weather graphics system
        
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
            
            // Initialize rig weather graphics if map is available
            if (this.mapManager && this.mapManager.map) {
                this.rigWeatherGraphics = new RigWeatherGraphics(this.mapManager.map);
                // Make globally accessible for MapLayersCard
                window.rigWeatherIntegration = this.rigWeatherGraphics;
                window.weatherVisualizationManager = this;
                
                // Add global test function for debugging
                window.testRigWeatherGraphics = () => {
                    console.log('🧪 Running rig weather graphics test...');
                    if (this.rigWeatherGraphics) {
                        return this.rigWeatherGraphics.testStaticGraphics();
                    } else {
                        console.error('🧪 RigWeatherGraphics not available');
                        return null;
                    }
                };
                
                // Add global function to use real rig positions
                window.useRealRigPositions = () => {
                    console.log('🧭 Using real rig positions...');
                    if (this.rigWeatherGraphics) {
                        return this.rigWeatherGraphics.useRealRigPositions();
                    } else {
                        console.error('🧭 RigWeatherGraphics not available');
                        return null;
                    }
                };
                
                // Add global cleanup function for flight changes
                window.clearRigWeatherGraphics = () => {
                    console.log('🧹 GLOBAL: Clearing all rig weather graphics');
                    if (this.rigWeatherGraphics) {
                        this.rigWeatherGraphics.removeWeatherGraphics();
                        console.log('🧹 GLOBAL: Rig weather graphics cleared');
                    }
                    
                    // Also clear old weather circles
                    if (window.currentWeatherCirclesLayer) {
                        try {
                            window.currentWeatherCirclesLayer.removeWeatherCircles();
                            console.log('🧹 GLOBAL: Old weather circles cleared');
                        } catch (error) {
                            console.warn('🧹 GLOBAL: Could not clear old weather circles:', error);
                        }
                    }
                };
                
                // Add global function to explore weather circles data
                window.exploreWeatherData = () => {
                    console.log('🔍 Exploring all weather data sources...');
                    
                    if (window.currentWeatherCirclesLayer) {
                        console.log('🔍 Weather circles layer:', window.currentWeatherCirclesLayer);
                        console.log('🔍 Weather circles properties:', Object.keys(window.currentWeatherCirclesLayer));
                        
                        // Try to find the actual data
                        const props = Object.keys(window.currentWeatherCirclesLayer);
                        props.forEach(prop => {
                            const value = window.currentWeatherCirclesLayer[prop];
                            if (Array.isArray(value) && value.length > 0) {
                                console.log(`🔍 Found array in ${prop}:`, value.length, 'items');
                                console.log(`🔍 Sample ${prop}[0]:`, value[0]);
                            }
                        });
                    }
                    
                    return 'Check console for detailed exploration';
                };
                
                console.log('🚁 RigWeatherGraphics initialized and made globally accessible');
                console.log('🚁 WeatherVisualizationManager made globally accessible');
                console.log('🧪 Global test function available: window.testRigWeatherGraphics()');
            }
            
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
                const weatherData = await this.fetchAviationWeather(platform.lat, platform.lon);
                
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
            const liveWeather = await this.fetchAviationWeather(platformData.lat, platformData.lon);
            
            if (!liveWeather) {
                return `
                    <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid #ff9800;">
                        <strong style="color: #ff9800;">🚁 Aviation Weather</strong><br>
                        <span style="color: #ccc; font-size: 12px;">Weather data unavailable</span>
                    </div>
                `;
            }
            
            // Determine data source and icon (aviation only)
            const dataIcon = '🚁';
            const dataSource = 'Aviation Weather (AWC)';
            const stationInfo = liveWeather.stationId ? ` - ${liveWeather.stationId}` : '';
            
            // Build aviation weather display
            let weatherDetails = '';
            
            // Aviation-specific parameters (priority display)
            if (liveWeather.ceiling !== null && liveWeather.ceiling !== undefined) {
                const ceilingFt = liveWeather.ceiling.toLocaleString();
                weatherDetails += `<strong>Ceiling:</strong> ${ceilingFt} ft AGL<br>`;
            } else {
                weatherDetails += `<strong>Ceiling:</strong> Unlimited<br>`;
            }
            
            // Flight category (critical for aviation)
            if (liveWeather.flightCategory) {
                const categoryColors = {
                    'VFR': '#66BB6A',   // Green
                    'MVFR': '#FFA726',  // Orange
                    'IFR': '#EF5350',   // Red
                    'LIFR': '#9C27B0'   // Purple
                };
                const categoryColor = categoryColors[liveWeather.flightCategory] || '#40c8f0';
                weatherDetails += `<strong>Flight Category:</strong> <span style="color: ${categoryColor}; font-weight: bold;">${liveWeather.flightCategory}</span><br>`;
            }
            
            // Visibility (aviation standard)
            if (liveWeather.visibility !== null) {
                const visibility = typeof liveWeather.visibility === 'number' ? 
                    (liveWeather.visibility > 100 ? (liveWeather.visibility / 1609.34).toFixed(1) : liveWeather.visibility.toFixed(1)) :
                    liveWeather.visibility;
                weatherDetails += `<strong>Visibility:</strong> ${visibility} SM<br>`;
            }
            
            // Wind information (enhanced for aviation)
            if (liveWeather.windSpeed !== null && liveWeather.windDirection !== null) {
                const windSpeedKts = Math.round(liveWeather.windSpeed);
                const windDir = Math.round(liveWeather.windDirection);
                let windString = `${windSpeedKts} kts @ ${windDir}°`;
                
                // Add gust information if available
                if (liveWeather.windGust && liveWeather.windGust > liveWeather.windSpeed) {
                    const gustKts = Math.round(liveWeather.windGust);
                    windString = `${windSpeedKts}G${gustKts} kts @ ${windDir}°`;
                }
                
                weatherDetails += `<strong>Wind:</strong> ${windString}<br>`;
            }
            
            // Cloud coverage (aviation format)
            if (liveWeather.cloudCoverage !== null && liveWeather.cloudCoverage !== undefined) {
                weatherDetails += `<strong>Cloud Coverage:</strong> ${liveWeather.cloudCoverage}%<br>`;
            }
            
            // Temperature
            if (liveWeather.temperature !== null) {
                let tempString = `${Math.round(liveWeather.temperature)}°F`;
                
                // Add dewpoint if available
                if (liveWeather.dewPoint !== null && liveWeather.dewPoint !== undefined) {
                    tempString += ` / ${Math.round(liveWeather.dewPoint)}°F`;
                }
                
                weatherDetails += `<strong>Temp:</strong> ${tempString}<br>`;
            }
            
            // Density altitude (important for helicopter performance)
            if (liveWeather.densityAltitude !== null && liveWeather.densityAltitude !== undefined) {
                const sign = liveWeather.densityAltitude >= 0 ? '+' : '';
                weatherDetails += `<strong>Density Alt:</strong> ${sign}${liveWeather.densityAltitude} ft<br>`;
            }
            
            // Weather conditions
            if (liveWeather.conditions && liveWeather.conditions !== 'Clear') {
                weatherDetails += `<strong>Conditions:</strong> ${liveWeather.conditions}<br>`;
            }
            
            // Observation time for METAR data
            let timeInfo = '';
            if (liveWeather.observationTime) {
                const obsTime = new Date(liveWeather.observationTime).toLocaleTimeString();
                timeInfo = `Observed: ${obsTime}`;
            } else {
                timeInfo = `Updated: ${new Date().toLocaleTimeString()}`;
            }
            
            return `
                <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid #40c8f0;">
                    <strong style="color: #40c8f0;">${dataIcon} ${dataSource}${stationInfo}</strong><br>
                    <div style="font-size: 12px; color: #e0e0e0; margin-top: 4px;">
                        ${weatherDetails}
                        <span style="font-size: 10px; color: #888; margin-top: 4px; display: block;">${timeInfo}</span>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.warn('Failed to create live weather section:', error.message);
            return `
                <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,255,255,0.1); border-radius: 4px; border-left: 3px solid #f44336;">
                    <strong style="color: #f44336;">🚁 Aviation Weather</strong><br>
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
     * ✅ PHASE 1.1: Add arrival time support
     * @private
     */
    async fetchAviationWeather(lat, lon, arrivalTime = null) {
        const timeDesc = arrivalTime ? `arrival time ${new Date(arrivalTime).toISOString()}` : 'current conditions';
        console.log(`🔍 ARRIVAL TIME WEATHER: Starting weather fetch for ${lat}, ${lon} at ${timeDesc}`);
        
        try {
            // Use Open-Meteo for accurate offshore weather (uses NOAA GFS data)
            console.log(`🔍 ARRIVAL TIME WEATHER: About to call Open-Meteo with ${arrivalTime ? 'arrival time' : 'current'} data`);
            const noaaResult = await this.tryOpenMeteoNOAA(lat, lon, arrivalTime);
            if (noaaResult) {
                console.log(`🔍 ARRIVAL TIME WEATHER: ✅ Got weather data:`, noaaResult);
                return noaaResult;
            }
            
            console.error(`🔍 ARRIVAL TIME WEATHER: ❌ No data from Open-Meteo NOAA model`);
            return null;
            
        } catch (error) {
            console.error(`🔍 ARRIVAL TIME WEATHER: ❌ API error: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Try Open-Meteo API with NOAA model for offshore weather
     * @private
     */
    async tryOpenMeteoNOAA(lat, lon, arrivalTime = null) {
        try {
            // ✅ PHASE 1.1: Get forecast weather for ARRIVAL TIME, not current conditions
            // Use Open-Meteo API for precise point forecast at exact rig coordinates (uses NOAA GFS model by default)
            // Include marine-specific parameters for offshore operations
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover&hourly=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover,visibility,cloud_cover_low,cloud_cover_mid,cloud_cover_high,precipitation&forecast_days=3&timezone=UTC`;
            
            console.log(`🔍 ARRIVAL TIME WEATHER: API URL for ${arrivalTime ? 'arrival time' : 'current'} weather: ${url}`);
            
            const response = await fetch(url);
            console.log(`🔍 SEARCH FOR: "API RESPONSE" - Status: ${response.status}, OK: ${response.ok}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`🔍 SEARCH FOR: "API ERROR DETAILS" - ${response.status}: ${errorText}`);
                throw new Error(`Open-Meteo NOAA API responded with ${response.status}: ${errorText}`);
            }
            
            const weatherData = await response.json();
            console.log(`🔍 SEARCH FOR: "RAW API DATA" - Full response:`, weatherData);
            
            if (!weatherData.current) {
                console.warn(`🔍 SEARCH FOR: "NO CURRENT DATA" - Missing current weather in response`);
                return null;
            }
            
            console.log(`🔍 SEARCH FOR: "CURRENT WEATHER" - Current data:`, weatherData.current);
            
            // Try to get marine data for offshore conditions
            let marineData = null;
            try {
                const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height,wave_direction,wave_period&timezone=UTC`;
                console.log(`🔍 SEARCH FOR: "MARINE API" - Marine URL: ${marineUrl}`);
                const marineResponse = await fetch(marineUrl);
                if (marineResponse.ok) {
                    marineData = await marineResponse.json();
                    console.log(`🔍 SEARCH FOR: "MARINE DATA" - Marine data:`, marineData.current);
                }
            } catch (error) {
                console.log(`🔍 SEARCH FOR: "MARINE ERROR" - ${error.message}`);
            }
            
            // ✅ PHASE 1.2: Convert weather data for specific arrival time
            console.log(`🔍 ARRIVAL TIME WEATHER: Converting weather data for ${arrivalTime ? new Date(arrivalTime).toISOString() : 'current time'}`);
            const aviationWeather = this.convertOpenMeteoNOAAToAviation(weatherData, lat, lon, marineData, arrivalTime);
            console.log(`🔍 ARRIVAL TIME WEATHER: ✅ Converted weather data:`, aviationWeather);
            
            return aviationWeather;
            
        } catch (error) {
            console.error(`🔍 SEARCH FOR: "TRY CATCH ERROR" - ${error.message}`);
            console.error(`🔍 SEARCH FOR: "ERROR STACK" - ${error.stack}`);
            return null;
        }
    }

    /**
     * Try Aviation Weather Center API (backup)
     * @private
     */
    async tryAWCAPI(lat, lon) {
        try {
            // Create a larger bounding box around the target coordinates for offshore locations
            // Rigs are offshore, so we need to look for nearby coastal/airport weather stations
            const buffer = 2.0; // Increase to 2 degrees to find coastal weather stations
            const bbox = `${lat - buffer},${lon - buffer},${lat + buffer},${lon + buffer}`;
            
            console.log(`🌦️ AWC API: Fetching from /api/awc/api/data/metar?bbox=${bbox} (via proxy)`);
            
            const response = await fetch(`/api/awc/api/data/metar?bbox=${bbox}&format=json&taf=false&hours=1`);
            
            console.log(`🌦️ AWC API: Response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`AWC API responded with ${response.status}`);
            }
            
            const metarData = await response.json();
            console.log(`🌦️ AWC API: Received ${metarData.length} METAR stations:`, metarData.map(m => `${m.icaoId}@${m.lat},${m.lon}`));
            
            if (!metarData || metarData.length === 0) {
                console.warn(`🌦️ AWC API: No METAR data found for ${lat},${lon} within ${buffer * 2}° search area`);
                return null;
            }
            
            // Find the closest METAR station to our target coordinates
            const closestMetar = this.findClosestMetar(metarData, lat, lon);
            
            if (!closestMetar) {
                console.warn(`🌦️ AWC API: No suitable METAR found within range for ${lat},${lon}`);
                return null;
            }
            
            // Parse METAR data into aviation-specific structure
            const aviationWeather = this.parseMetarToAviationData(closestMetar);
            console.log(`🌦️ AWC API: ✅ Parsed weather data:`, aviationWeather);
            
            return aviationWeather;
            
        } catch (error) {
            console.error(`🌦️ AWC API: Failed - ${error.message}`);
            return null;
        }
    }
    
    /**
     * Try Open-Meteo API (no CORS issues)
     * @private
     */
    async tryOpenMeteoAPI(lat, lon) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=visibility&timezone=UTC`;
            
            console.log(`🌦️ Open-Meteo API: Fetching from ${url}`);
            
            const response = await fetch(url);
            console.log(`🌦️ Open-Meteo API: Response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`Open-Meteo API responded with ${response.status}`);
            }
            
            const weatherData = await response.json();
            console.log(`🌦️ Open-Meteo API: Received data:`, weatherData);
            
            if (!weatherData.current) {
                console.warn(`🌦️ Open-Meteo API: No current weather data available`);
                return null;
            }
            
            // Convert Open-Meteo data to aviation format
            const aviationWeather = this.convertOpenMeteoToAviation(weatherData, lat, lon);
            console.log(`🌦️ Open-Meteo API: ✅ Converted weather data:`, aviationWeather);
            
            return aviationWeather;
            
        } catch (error) {
            console.error(`🌦️ Open-Meteo API: Failed - ${error.message}`);
            return null;
        }
    }
    
    /**
     * Convert Open-Meteo NOAA data to aviation format (for offshore rigs)
     * ✅ PHASE 1.3: Extract weather data for specific arrival hour
     * @private
     */
    convertOpenMeteoNOAAToAviation(weatherData, lat, lon, marineData = null, arrivalTime = null) {
        const current = weatherData.current;
        const hourly = weatherData.hourly;
        
        // ✅ PHASE 1.3: Determine which dataset to use (arrival time vs current)
        let weatherDataToUse = current;
        let dataSource = 'current';
        let timeInfo = 'Current conditions';
        
        if (arrivalTime && hourly && hourly.time) {
            // Find the closest hour to arrival time in the forecast
            const arrivalDate = new Date(arrivalTime);
            const arrivalHour = arrivalDate.toISOString().slice(0, 13) + ':00'; // Round to nearest hour
            
            console.log(`🔍 ARRIVAL TIME WEATHER: Looking for forecast at ${arrivalHour}`);
            
            const hourIndex = hourly.time.findIndex(time => time === arrivalHour);
            
            if (hourIndex !== -1) {
                console.log(`🔍 ARRIVAL TIME WEATHER: ✅ Found forecast data at index ${hourIndex} for ${arrivalHour}`);
                
                // Extract forecast data for arrival time
                weatherDataToUse = {
                    temperature_2m: hourly.temperature_2m[hourIndex],
                    relative_humidity_2m: hourly.relative_humidity_2m[hourIndex],
                    weather_code: hourly.weather_code[hourIndex],
                    surface_pressure: hourly.surface_pressure[hourIndex],
                    wind_speed_10m: hourly.wind_speed_10m[hourIndex],
                    wind_direction_10m: hourly.wind_direction_10m[hourIndex],
                    wind_gusts_10m: hourly.wind_gusts_10m[hourIndex],
                    cloud_cover: hourly.cloud_cover[hourIndex],
                    time: hourly.time[hourIndex]
                };
                
                dataSource = 'forecast';
                const arrivalTimeString = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                timeInfo = `Forecast for ${arrivalTimeString} arrival`;
                
                console.log(`🔍 ARRIVAL TIME WEATHER: Using forecast data:`, weatherDataToUse);
            } else {
                console.warn(`🔍 ARRIVAL TIME WEATHER: ❌ No forecast data found for ${arrivalHour}, falling back to current conditions`);
                timeInfo = 'Current conditions (arrival forecast unavailable)';
            }
        }
        
        // ✅ PHASE 1.3: Use arrival time weather data instead of current
        // Convert temperature from Celsius to Fahrenheit
        const tempF = Math.round((weatherDataToUse.temperature_2m * 9/5) + 32);
        
        // Convert wind speed from km/h to knots
        const windSpeedKts = Math.round(weatherDataToUse.wind_speed_10m * 0.539957);
        const windGustKts = weatherDataToUse.wind_gusts_10m ? Math.round(weatherDataToUse.wind_gusts_10m * 0.539957) : null;
        
        // Get visibility from hourly data (first hour) - convert from meters to statute miles
        const visibilityMeters = hourly.visibility && hourly.visibility[0] ? hourly.visibility[0] : 10000;
        const visibilitySM = Math.round(visibilityMeters / 1609.34);
        
        // Calculate ceiling from cloud cover data
        const cloudCoverLow = hourly.cloud_cover_low && hourly.cloud_cover_low[0] ? hourly.cloud_cover_low[0] : 0;
        const cloudCoverMid = hourly.cloud_cover_mid && hourly.cloud_cover_mid[0] ? hourly.cloud_cover_mid[0] : 0;
        const cloudCoverHigh = hourly.cloud_cover_high && hourly.cloud_cover_high[0] ? hourly.cloud_cover_high[0] : 0;
        
        // Estimate ceiling based on cloud layers (simplified aviation method)
        let ceiling = null;
        if (cloudCoverLow > 50) {
            ceiling = 2000; // Low clouds ~2000 ft
        } else if (cloudCoverMid > 50) {
            ceiling = 8000; // Mid clouds ~8000 ft
        } else if (cloudCoverHigh > 75) {
            ceiling = 20000; // High clouds ~20000 ft
        }
        
        // Determine flight category based on ceiling and visibility (aviation standards)
        let flightCategory = 'VFR';
        if (ceiling && ceiling < 500) {
            flightCategory = 'LIFR';
        } else if (ceiling && ceiling < 1000) {
            flightCategory = 'IFR';
        } else if (ceiling && ceiling < 3000 || visibilitySM < 5) {
            flightCategory = 'MVFR';
        } else if (visibilitySM < 1) {
            flightCategory = 'LIFR';
        } else if (visibilitySM < 3) {
            flightCategory = 'IFR';
        }
        
        // Weather code to conditions mapping (NOAA GFS model specific)
        const weatherCodes = {
            0: 'Clear skies',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        
        const conditions = weatherCodes[weatherDataToUse.weather_code] || 'Unknown conditions';
        
        // Calculate dewpoint approximation from relative humidity
        const dewPoint = weatherDataToUse.relative_humidity_2m ? 
            Math.round(weatherDataToUse.temperature_2m - ((100 - weatherDataToUse.relative_humidity_2m) / 5)) : null;
        const dewPointF = dewPoint ? Math.round((dewPoint * 9/5) + 32) : null;
        
        return {
            // Basic weather parameters
            temperature: tempF,
            windSpeed: windSpeedKts,
            windDirection: Math.round(weatherDataToUse.wind_direction_10m || 0),
            windGust: windGustKts,
            visibility: visibilitySM,
            
            // Aviation-specific parameters
            ceiling: ceiling,
            flightCategory: flightCategory,
            
            // Cloud information
            cloudCoverage: Math.round(weatherDataToUse.cloud_cover || 0),
            cloudCoverageLow: Math.round(cloudCoverLow),
            cloudCoverageMid: Math.round(cloudCoverMid),
            cloudCoverageHigh: Math.round(cloudCoverHigh),
            conditions: conditions,
            
            // Additional parameters
            dewPoint: dewPointF,
            altimeter: weatherDataToUse.surface_pressure ? Math.round(weatherDataToUse.surface_pressure * 0.02953) : null, // Convert hPa to inHg
            relativeHumidity: Math.round(weatherDataToUse.relative_humidity_2m || 0),
            
            // Marine conditions (for offshore operations)
            waveHeight: marineData?.current?.wave_height || null,
            waveDirection: marineData?.current?.wave_direction || null,
            wavePeriod: marineData?.current?.wave_period || null,
            
            // ✅ PHASE 1.4: Add arrival time information and data freshness
            arrivalTime: arrivalTime,
            weatherTime: weatherDataToUse.time || current.time,
            weatherTimeInfo: timeInfo,
            dataFreshness: new Date().toISOString(),
            
            // Metadata
            stationId: `NOAA-GFS-${lat.toFixed(2)},${lon.toFixed(2)}`,
            observationTime: weatherDataToUse.time || current.time,
            dataSource: dataSource === 'forecast' ? 'OPEN_METEO_NOAA_GFS_FORECAST' : 'OPEN_METEO_NOAA_GFS_CURRENT',
            rawMetar: `NOAA GFS Model via Open-Meteo for ${lat.toFixed(4)},${lon.toFixed(4)} - ${conditions} ${tempF}°F ${windSpeedKts}kts@${Math.round(weatherDataToUse.wind_direction_10m)}° ${visibilitySM}SM ${flightCategory}${marineData?.current?.wave_height ? ` Waves:${marineData.current.wave_height}m` : ''}`
        };
    }

    /**
     * Convert Open-Meteo data to aviation format (legacy)
     * @private
     */
    convertOpenMeteoToAviation(weatherData, lat, lon) {
        const current = weatherData.current;
        const hourly = weatherData.hourly;
        
        // Convert temperature from Celsius to Fahrenheit
        const tempF = Math.round((current.temperature_2m * 9/5) + 32);
        
        // Convert wind speed from km/h to knots
        const windSpeedKts = Math.round(current.wind_speed_10m * 0.539957);
        const windGustKts = current.wind_gusts_10m ? Math.round(current.wind_gusts_10m * 0.539957) : null;
        
        // Get visibility from hourly data (first hour)
        const visibilityKm = hourly.visibility && hourly.visibility[0] ? hourly.visibility[0] / 1000 : 10;
        const visibilitySM = Math.round(visibilityKm * 0.621371); // Convert km to statute miles
        
        // Determine flight category based on visibility
        let flightCategory = 'VFR';
        if (visibilitySM < 1) flightCategory = 'LIFR';
        else if (visibilitySM < 3) flightCategory = 'IFR';
        else if (visibilitySM < 5) flightCategory = 'MVFR';
        
        // Weather code to conditions mapping (simplified)
        const weatherCodes = {
            0: 'Clear skies',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            61: 'Slight rain',
            95: 'Thunderstorm'
        };
        
        const conditions = weatherCodes[current.weather_code] || 'Unknown conditions';
        
        return {
            // Basic weather parameters
            temperature: tempF,
            windSpeed: windSpeedKts,
            windDirection: Math.round(current.wind_direction_10m || 0),
            windGust: windGustKts,
            visibility: visibilitySM,
            
            // Aviation-specific parameters
            ceiling: null, // Open-Meteo doesn't provide ceiling data
            flightCategory: flightCategory,
            
            // Cloud information
            cloudCoverage: this.weatherCodeToCloudCoverage(current.weather_code),
            conditions: conditions,
            
            // Additional parameters
            dewPoint: null, // Not available in basic Open-Meteo
            altimeter: current.surface_pressure ? Math.round(current.surface_pressure * 0.02953) : null, // Convert hPa to inHg
            
            // Metadata
            stationId: `OPEN-METEO-${lat.toFixed(2)},${lon.toFixed(2)}`,
            observationTime: current.time,
            dataSource: 'OPEN_METEO',
            rawMetar: `Generated from Open-Meteo API for ${lat.toFixed(4)},${lon.toFixed(4)}`
        };
    }
    
    /**
     * Convert weather code to cloud coverage percentage
     * @private
     */
    weatherCodeToCloudCoverage(code) {
        if (code === 0) return 0;   // Clear skies
        if (code === 1) return 25;  // Mainly clear
        if (code === 2) return 50;  // Partly cloudy
        if (code === 3) return 100; // Overcast
        return 75; // Default for other conditions
    }
    
    /**
     * Try alternative weather API (WeatherAPI.com has free tier)
     * @private
     */
    async tryAlternativeWeatherAPI(lat, lon) {
        try {
            // Using WeatherAPI.com free tier (no API key needed for basic calls)
            const url = `https://api.weatherapi.com/v1/current.json?key=demo&q=${lat},${lon}&aqi=no`;
            
            console.log(`🌦️ WeatherAPI: Fetching from ${url}`);
            
            const response = await fetch(url);
            console.log(`🌦️ WeatherAPI: Response status: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`WeatherAPI responded with ${response.status}`);
            }
            
            const weatherData = await response.json();
            console.log(`🌦️ WeatherAPI: Received data:`, weatherData);
            
            if (!weatherData.current) {
                console.warn(`🌦️ WeatherAPI: No current weather data available`);
                return null;
            }
            
            // Convert WeatherAPI data to aviation format
            const aviationWeather = this.convertWeatherAPIToAviation(weatherData, lat, lon);
            console.log(`🌦️ WeatherAPI: ✅ Converted weather data:`, aviationWeather);
            
            return aviationWeather;
            
        } catch (error) {
            console.error(`🌦️ WeatherAPI: Failed - ${error.message}`);
            return null;
        }
    }
    
    /**
     * Convert WeatherAPI data to aviation format
     * @private
     */
    convertWeatherAPIToAviation(weatherData, lat, lon) {
        const current = weatherData.current;
        
        // Convert wind speed from mph to knots
        const windSpeedKts = Math.round(current.wind_mph * 0.868976);
        
        // Get visibility in miles
        const visibilitySM = Math.round(current.vis_miles || 10);
        
        // Determine flight category based on visibility
        let flightCategory = 'VFR';
        if (visibilitySM < 1) flightCategory = 'LIFR';
        else if (visibilitySM < 3) flightCategory = 'IFR';
        else if (visibilitySM < 5) flightCategory = 'MVFR';
        
        // Convert cloud coverage percentage
        const cloudCoverage = current.cloud || 0;
        
        return {
            // Basic weather parameters
            temperature: Math.round(current.temp_f),
            windSpeed: windSpeedKts,
            windDirection: Math.round(current.wind_degree || 0),
            windGust: current.gust_mph ? Math.round(current.gust_mph * 0.868976) : null,
            visibility: visibilitySM,
            
            // Aviation-specific parameters
            ceiling: null, // WeatherAPI doesn't provide ceiling data
            flightCategory: flightCategory,
            
            // Cloud information
            cloudCoverage: cloudCoverage,
            conditions: current.condition?.text || 'Unknown conditions',
            
            // Additional parameters
            dewPoint: null, // Not available in basic WeatherAPI
            altimeter: null, // Not available in basic WeatherAPI
            
            // Metadata
            stationId: `WEATHERAPI-${lat.toFixed(2)},${lon.toFixed(2)}`,
            observationTime: current.last_updated,
            dataSource: 'WEATHER_API_COM',
            rawMetar: `Generated from WeatherAPI for ${lat.toFixed(4)},${lon.toFixed(4)}`
        };
    }
    
    /**
     * Generate realistic test weather data for debugging
     * @private
     */
    generateTestWeatherData(lat, lon) {
        console.log(`🌦️ TEST DATA: Generating realistic test weather for ${lat}, ${lon}`);
        
        // Generate realistic Gulf of Mexico weather patterns
        const windDirections = [90, 135, 180, 225, 270]; // Common Gulf wind directions
        const windSpeeds = [8, 12, 15, 18, 22, 25]; // Common wind speeds in knots
        const temperatures = [68, 72, 75, 78, 82, 85]; // Gulf temperatures in Fahrenheit
        const visibilities = [3, 5, 7, 10, 10, 10]; // Statute miles (more good vis)
        const flightCategories = ['VFR', 'VFR', 'VFR', 'MVFR', 'IFR']; // Weighted toward VFR
        
        const randomWind = windSpeeds[Math.floor(Math.random() * windSpeeds.length)];
        const randomDir = windDirections[Math.floor(Math.random() * windDirections.length)];
        const randomTemp = temperatures[Math.floor(Math.random() * temperatures.length)];
        const randomVis = visibilities[Math.floor(Math.random() * visibilities.length)];
        const randomCategory = flightCategories[Math.floor(Math.random() * flightCategories.length)];
        
        return {
            temperature: randomTemp,
            windSpeed: randomWind,
            windDirection: randomDir,
            windGust: Math.random() > 0.7 ? randomWind + 8 : null,
            visibility: randomVis,
            ceiling: randomCategory === 'VFR' ? null : Math.floor(Math.random() * 3000) + 500,
            flightCategory: randomCategory,
            cloudCoverage: Math.floor(Math.random() * 100),
            conditions: randomCategory === 'VFR' ? 'Few clouds' : 'Broken clouds',
            stationId: `TEST-${lat.toFixed(1)},${lon.toFixed(1)}`,
            observationTime: new Date().toISOString(),
            dataSource: 'TEST_DATA_FOR_DEBUG',
            rawMetar: `TEST DATA ${randomDir}${String(randomWind).padStart(2, '0')}KT ${randomVis}SM FEW025 ${randomTemp}/XX A3015`
        };
    }
    
    
    /**
     * Find the closest METAR station to target coordinates
     * @private
     */
    findClosestMetar(metarData, targetLat, targetLon) {
        let closestMetar = null;
        let closestDistance = Infinity;
        
        for (const metar of metarData) {
            if (!metar.lat || !metar.lon) continue;
            
            // Calculate distance using simple Euclidean distance (sufficient for small areas)
            const distance = Math.sqrt(
                Math.pow(metar.lat - targetLat, 2) + 
                Math.pow(metar.lon - targetLon, 2)
            );
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestMetar = metar;
            }
        }
        
        // Only return if within reasonable distance (about 250 nautical miles for offshore locations)
        if (closestDistance <= 4.5) {
            console.log(`🌦️ AWC: Found closest METAR station at ${closestDistance.toFixed(2)}° distance (${closestMetar.icaoId})`);
            return closestMetar;
        }
        
        return null;
    }
    
    /**
     * Parse METAR data into aviation-specific weather structure
     * @private
     */
    parseMetarToAviationData(metarData) {
        const parsed = {
            // Basic weather parameters
            temperature: this.convertCelsiusToFahrenheit(metarData.temp),
            windSpeed: metarData.wspd || 0,
            windDirection: metarData.wdir || 0,
            windGust: metarData.wgst || null,
            visibility: metarData.visib || 10, // statute miles
            
            // Aviation-specific parameters
            ceiling: this.parseCeiling(metarData.cig),
            flightCategory: metarData.fltcat || this.determineFlightCategory(metarData.cig, metarData.visib),
            
            // Cloud information
            cloudCoverage: this.parseCloudCoverage(metarData.cover),
            cloudBase: metarData.cig || null, // Use ceiling as cloud base
            conditions: metarData.wxString || this.parseWeatherConditions(metarData),
            
            // Additional parameters
            dewPoint: this.convertCelsiusToFahrenheit(metarData.dewp),
            altimeter: metarData.altim, // inches Hg
            
            // Aviation calculations
            densityAltitude: this.calculateDensityAltitude(metarData.temp, metarData.altim),
            
            // Metadata
            stationId: metarData.icaoId,
            observationTime: metarData.obsTime,
            dataSource: 'AWC_METAR',
            rawMetar: metarData.rawOb
        };
        
        return parsed;
    }
    
    /**
     * Parse ceiling from METAR data
     * @private
     */
    parseCeiling(cig) {
        if (!cig || cig === 'CLR' || cig === 'SKC') {
            return null; // Clear skies, no ceiling
        }
        
        // METAR ceiling is in hundreds of feet AGL
        const ceilingValue = parseInt(cig);
        if (!isNaN(ceilingValue)) {
            return ceilingValue; // Already in feet AGL
        }
        
        return null;
    }
    
    /**
     * Determine flight category based on ceiling and visibility
     * @private
     */
    determineFlightCategory(ceiling, visibility) {
        // Standard aviation flight categories
        if (!ceiling && visibility >= 5) {
            return 'VFR'; // Visual Flight Rules
        } else if (ceiling >= 3000 && visibility >= 5) {
            return 'VFR';
        } else if (ceiling >= 1000 && visibility >= 3) {
            return 'MVFR'; // Marginal VFR
        } else if (ceiling >= 500 && visibility >= 1) {
            return 'IFR'; // Instrument Flight Rules
        } else {
            return 'LIFR'; // Low IFR
        }
    }
    
    /**
     * Parse cloud coverage from METAR
     * @private
     */
    parseCloudCoverage(cover) {
        if (!cover) return 0;
        
        // Convert METAR cloud coverage to percentage
        switch (cover.toUpperCase()) {
            case 'CLR': case 'SKC': return 0;   // Clear
            case 'FEW': return 25;              // Few (1/8 - 2/8)
            case 'SCT': return 50;              // Scattered (3/8 - 4/8)
            case 'BKN': return 75;              // Broken (5/8 - 7/8)
            case 'OVC': return 100;             // Overcast (8/8)
            default: return 0;
        }
    }
    
    /**
     * Convert Celsius to Fahrenheit
     * @private
     */
    convertCelsiusToFahrenheit(celsius) {
        if (celsius === null || celsius === undefined) return null;
        return Math.round((celsius * 9/5) + 32);
    }
    
    /**
     * Parse weather conditions from METAR
     * @private
     */
    parseWeatherConditions(metarData) {
        const conditions = [];
        
        // Cloud conditions
        if (metarData.cover) {
            switch (metarData.cover.toUpperCase()) {
                case 'CLR': case 'SKC': conditions.push('Clear skies'); break;
                case 'FEW': conditions.push('Few clouds'); break;
                case 'SCT': conditions.push('Scattered clouds'); break;
                case 'BKN': conditions.push('Broken clouds'); break;
                case 'OVC': conditions.push('Overcast'); break;
            }
        }
        
        // Weather phenomena
        if (metarData.wxString && metarData.wxString !== '') {
            conditions.push(metarData.wxString);
        }
        
        return conditions.length > 0 ? conditions.join(', ') : 'Clear';
    }
    
    /**
     * Calculate density altitude approximation
     * @private
     */
    calculateDensityAltitude(tempC, altimeterInHg) {
        if (!tempC || !altimeterInHg) return null;
        
        // Simplified density altitude calculation for sea level
        const standardTemp = 15; // °C at sea level
        const tempDiff = tempC - standardTemp;
        const densityAltOffset = tempDiff * 120; // Rough approximation: 120 ft per °C
        
        return Math.round(densityAltOffset);
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
     * Fetch rig weather data from flight waypoints
     * @param {Array} waypoints - Flight waypoints containing rig locations
     * @returns {Array} Array of rig weather data
     */
    async fetchRigWeatherFromFlight(waypoints) {
        if (!waypoints || waypoints.length === 0) {
            console.log('🚁 No waypoints provided for rig weather');
            return [];
        }
        
        const rigWeatherData = [];
        
        // Debug: Log all waypoints first to understand the structure
        console.log('🚁 All waypoints received:', waypoints);
        console.log('🚁 Waypoint properties sample:', waypoints[0] ? Object.keys(waypoints[0]) : 'No waypoints');
        
        waypoints.forEach((wp, index) => {
            console.log(`🚁 Waypoint ${index}:`, {
                name: wp.name,
                type: wp.type,
                isRig: wp.isRig,
                // Try different coordinate property names
                lat: wp.lat || wp.latitude || wp.coords?.lat,
                lng: wp.lng || wp.longitude || wp.lon || wp.coords?.lng,
                coordinates: wp.coordinates,
                // Log all properties to see what's available
                allProps: Object.keys(wp)
            });
        });
        
        // Filter for rig waypoints - use LANDING_STOP type (rigs) vs WAYPOINT (navigation)
        const rigWaypoints = waypoints.filter(wp => {
            // Rigs are LANDING_STOP type that are NOT airports (airports start with K)
            const isRig = wp.type === 'LANDING_STOP' && wp.pointType === 'LANDING_STOP' && 
                         !wp.name?.startsWith('K'); // Skip airports like KLCH
            
            // Get coordinates from coords array [lng, lat]
            const lat = wp.coords?.[1];
            const lng = wp.coords?.[0];
            
            if (isRig) {
                console.log(`🚁 Detected rig waypoint: ${wp.name} (${lat}, ${lng})`);
                
                // Ensure we have coordinates
                if (!lat || !lng) {
                    console.warn(`🚁 Rig ${wp.name} missing coordinates - skipping`);
                    return false;
                }
            }
            
            return isRig && lat && lng;
        });
        
        console.log(`🚁 Found ${rigWaypoints.length} rig waypoints for weather fetching:`, rigWaypoints.map(r => r.name));
        
        for (const rig of rigWaypoints) {
            try {
                // Get coordinates from coords array [lng, lat]
                const lat = rig.coords?.[1];
                const lng = rig.coords?.[0];
                
                console.log(`🚁 Fetching aviation weather for rig ${rig.name} at ${lat}, ${lng}`);
                
                const weatherData = await this.fetchAviationWeather(lat, lng);
                
                if (weatherData) {
                    // Create structured data for visual graphics
                    const rigWeather = {
                        rigName: rig.name,
                        latitude: lat,
                        longitude: lng,
                        
                        // Aviation data (from AWC API)
                        ceiling: weatherData.ceiling,
                        flightCategory: weatherData.flightCategory,
                        visibility: weatherData.visibility,
                        cloudCoverage: weatherData.cloudCoverage,
                        
                        // Wind data
                        windSpeed: weatherData.windSpeed || 0,
                        windDirection: weatherData.windDirection || 0,
                        windGust: weatherData.windGust,
                        
                        // Additional
                        temperature: weatherData.temperature,
                        conditions: weatherData.conditions,
                        stationId: weatherData.stationId,
                        observationTime: weatherData.observationTime,
                        
                        // Metadata
                        waypointId: rig.id,
                        dataSource: weatherData.dataSource
                    };
                    
                    rigWeatherData.push(rigWeather);
                    console.log(`🚁 Aviation weather retrieved for ${rig.name}:`, rigWeather);
                } else {
                    console.warn(`🚁 No aviation weather available for rig ${rig.name}`);
                }
                
            } catch (error) {
                console.error(`🚁 Failed to fetch weather for rig ${rig.name}:`, error.message);
            }
        }
        
        console.log(`🚁 Successfully fetched weather for ${rigWeatherData.length} rigs`);
        return rigWeatherData;
    }
    
    /**
     * Update rig weather graphics with REAL external API weather data
     * @param {Array} weatherSegments - Weather segments with location type data (used only for coordinates)
     */
    async updateRigWeatherGraphicsFromSegments(weatherSegments) {
        if (!this.rigWeatherGraphics) {
            console.warn('🚁 RigWeatherGraphics not initialized');
            return;
        }
        
        try {
            console.log('🚁 Getting REAL weather from external APIs for rig graphics:', weatherSegments?.length || 0);
            
            if (!weatherSegments || weatherSegments.length === 0) {
                console.warn('🚁 No weather segments available');
                return;
            }
            
            // Extract rig locations (coordinates only) from weather segments
            const rigLocations = weatherSegments
                .filter(segment => segment.isRig === true)
                .map(segment => {
                    const rigName = segment.locationName || segment.name || segment.airportIcao;
                    
                    // Get coordinates by matching airportIcao to waypoints
                    let latitude = segment.latitude || segment.lat;
                    let longitude = segment.longitude || segment.lng || segment.lon;
                    
                    // If no direct coordinates, look up from waypoints using airportIcao
                    if ((!latitude || !longitude) && segment.airportIcao && window.currentWaypoints) {
                        const matchingWaypoint = window.currentWaypoints.find(wp => 
                            wp.name === segment.airportIcao || 
                            wp.name?.includes(segment.airportIcao) ||
                            segment.airportIcao?.includes(wp.name)
                        );
                        
                        if (matchingWaypoint) {
                            latitude = matchingWaypoint.coords?.[1] || matchingWaypoint.lat || matchingWaypoint.latitude;
                            longitude = matchingWaypoint.coords?.[0] || matchingWaypoint.lng || matchingWaypoint.longitude;
                            console.log('🚁 Matched weather rig to waypoint:', segment.airportIcao, '→', matchingWaypoint.name, 'at', latitude, longitude);
                        } else {
                            console.log('🚁 No waypoint match found for rig:', segment.airportIcao);
                        }
                    }
                    
                    return {
                        rigName: rigName,
                        latitude: latitude,
                        longitude: longitude,
                        arrivalTime: segment.arrivalTime, // Use for flight-time weather
                        segmentId: segment.id || segment.uniqueId
                    };
                })
                .filter(rig => rig.latitude && rig.longitude); // Only rigs with valid coordinates
            
            console.log(`🚁 Found ${rigLocations.length} rigs with coordinates:`, rigLocations.map(r => r.rigName));
            
            if (rigLocations.length === 0) {
                console.warn('🚁 No rigs with valid coordinates found');
                return;
            }
            
            // 🌦️ CALL REAL EXTERNAL WEATHER APIs FOR EACH RIG
            const realWeatherData = [];
            
            for (const rig of rigLocations) {
                try {
                    const arrivalDesc = rig.arrivalTime ? `for arrival at ${new Date(rig.arrivalTime).toLocaleTimeString()}` : 'current conditions';
                    console.log(`🌦️ Fetching REAL weather from API for ${rig.rigName} at ${rig.latitude}, ${rig.longitude} ${arrivalDesc}`);
                    
                    // ✅ PHASE 1.1: Call API with arrival time for forecast weather
                    const realWeather = await this.fetchAviationWeather(rig.latitude, rig.longitude, rig.arrivalTime);
                    
                    if (realWeather) {
                        const rigWeatherData = {
                            rigName: rig.rigName,
                            latitude: rig.latitude,
                            longitude: rig.longitude,
                            
                            // 🌦️ REAL WEATHER DATA FROM EXTERNAL APIs
                            ceiling: realWeather.ceiling,
                            flightCategory: realWeather.flightCategory,
                            visibility: realWeather.visibility,
                            cloudCoverage: realWeather.cloudCoverage || 0,
                            
                            // 🌬️ REAL WIND DATA FROM METAR
                            windSpeed: realWeather.windSpeed || 0,
                            windDirection: realWeather.windDirection || 0,
                            windGust: realWeather.windGust,
                            
                            // 🌡️ REAL ATMOSPHERIC CONDITIONS
                            temperature: realWeather.temperature,
                            conditions: realWeather.conditions,
                            densityAltitude: realWeather.densityAltitude,
                            
                            // 📡 REAL DATA SOURCE INFO
                            stationId: realWeather.stationId,
                            observationTime: realWeather.observationTime,
                            dataSource: realWeather.dataSource, // 'AWC_METAR'
                            rawMetar: realWeather.rawMetar,
                            
                            // Flight timing (from segment)
                            arrivalTime: rig.arrivalTime,
                            segmentId: rig.segmentId
                        };
                        
                        realWeatherData.push(rigWeatherData);
                        console.log(`🌦️ ✅ Real weather retrieved for ${rig.rigName}:`, {
                            station: realWeather.stationId,
                            category: realWeather.flightCategory,
                            wind: `${realWeather.windSpeed}kts@${realWeather.windDirection}°`,
                            visibility: `${realWeather.visibility}SM`,
                            source: realWeather.dataSource
                        });
                    } else {
                        console.warn(`🌦️ ❌ No real weather available for ${rig.rigName} - using fallback`);
                        
                        // Fallback with clear indication this is not real data
                        realWeatherData.push({
                            rigName: rig.rigName,
                            latitude: rig.latitude,
                            longitude: rig.longitude,
                            flightCategory: 'UNKNOWN',
                            ceiling: null,
                            visibility: null,
                            windSpeed: 0,
                            windDirection: 0,
                            temperature: null,
                            conditions: 'No weather data available',
                            dataSource: 'NO_DATA',
                            stationId: 'N/A'
                        });
                    }
                    
                } catch (error) {
                    console.error(`🌦️ ❌ API error for ${rig.rigName}:`, error.message);
                    
                    // Error fallback
                    realWeatherData.push({
                        rigName: rig.rigName,
                        latitude: rig.latitude,
                        longitude: rig.longitude,
                        flightCategory: 'ERROR',
                        ceiling: null,
                        visibility: null,
                        windSpeed: 0,
                        windDirection: 0,
                        temperature: null,
                        conditions: `API Error: ${error.message}`,
                        dataSource: 'API_ERROR',
                        stationId: 'ERROR'
                    });
                }
            }
            
            console.log(`🌦️ Retrieved real weather for ${realWeatherData.length} rigs from external APIs`);
            
            // Update graphics with REAL weather data
            this.rigWeatherGraphics.updateRigWeather(realWeatherData);
            
            console.log(`🚁 ✅ Updated rig weather graphics with REAL external API weather data for ${realWeatherData.length} rigs`);
            
        } catch (error) {
            console.error('🚁 Failed to update rig weather graphics with real API data:', error.message);
        }
    }
    
    /**
     * Update rig weather graphics from flight waypoints (fallback method)
     * @param {Array} waypoints - Flight waypoints
     */
    async updateRigWeatherGraphics(waypoints) {
        if (!this.rigWeatherGraphics) {
            console.warn('🚁 RigWeatherGraphics not initialized');
            return;
        }
        
        try {
            // Fetch weather data for rig waypoints
            const rigWeatherData = await this.fetchRigWeatherFromFlight(waypoints);
            
            // Update graphics
            this.rigWeatherGraphics.updateRigWeather(rigWeatherData);
            
            console.log(`🚁 Updated rig weather graphics for ${rigWeatherData.length} rigs`);
            
        } catch (error) {
            console.error('🚁 Failed to update rig weather graphics:', error.message);
        }
    }
    
    /**
     * Convert ranking to flight category
     * @private
     */
    determineFlightCategoryFromRanking(ranking2) {
        // Based on existing ranking system
        if (ranking2 === 15 || ranking2 === 20) return 'VFR';
        if (ranking2 === 10) return 'MVFR';
        if (ranking2 === 8) return 'IFR';
        if (ranking2 === 5) return 'LIFR';
        return 'VFR'; // Default
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
     * Parse wind speed from METAR string
     */
    parseWindSpeedFromMetar(rawMetar) {
        if (!rawMetar) return null;
        
        // First try pseudo-METAR format with slash like "174/12KT" (common for rigs)
        const slashWindMatch = rawMetar.match(/(\d{3})\/(\d{1,3})(G\d{1,3})?KT/);
        if (slashWindMatch) {
            const windSpeed = parseInt(slashWindMatch[2]);
            console.log(`🌬️ Parsed wind speed: ${windSpeed} kts from slash format METAR: ${rawMetar.substring(0, 50)}...`);
            return windSpeed;
        }
        
        // Standard METAR format like "21518KT"
        const windMatch = rawMetar.match(/(\d{3})(\d{2,3})(G\d{2,3})?KT/);
        if (windMatch) {
            const windSpeed = parseInt(windMatch[2]);
            console.log(`🌬️ Parsed wind speed: ${windSpeed} kts from standard METAR: ${rawMetar.substring(0, 50)}...`);
            return windSpeed;
        }
        
        // Variable wind pattern like "VRB05KT"
        const variableMatch = rawMetar.match(/VRB(\d{2,3})KT/);
        if (variableMatch) {
            const windSpeed = parseInt(variableMatch[1]);
            console.log(`🌬️ Parsed variable wind speed: ${windSpeed} kts from METAR`);
            return windSpeed;
        }
        
        return null;
    }
    
    /**
     * Parse wind direction from METAR string
     */
    parseWindDirectionFromMetar(rawMetar) {
        if (!rawMetar) return null;
        
        // First try pseudo-METAR format with slash like "174/12KT" (common for rigs)
        const slashWindMatch = rawMetar.match(/(\d{3})\/(\d{1,3})(G\d{1,3})?KT/);
        if (slashWindMatch) {
            const windDirection = parseInt(slashWindMatch[1]);
            console.log(`🌬️ Parsed wind direction: ${windDirection}° from slash format METAR`);
            return windDirection;
        }
        
        // Standard METAR format like "21518KT"
        const windMatch = rawMetar.match(/(\d{3})(\d{2,3})(G\d{2,3})?KT/);
        if (windMatch) {
            const windDirection = parseInt(windMatch[1]);
            console.log(`🌬️ Parsed wind direction: ${windDirection}° from standard METAR`);
            return windDirection;
        }
        
        // Variable wind returns null (no specific direction)
        if (rawMetar.includes('VRB')) {
            console.log(`🌬️ Variable wind direction from METAR`);
            return null;
        }
        
        return null;
    }
    
    /**
     * Parse wind gust from METAR string
     */
    parseWindGustFromMetar(rawMetar) {
        if (!rawMetar) return null;
        
        // First try pseudo-METAR format with slash like "174/12G25KT" (common for rigs)
        const slashGustMatch = rawMetar.match(/(\d{3})\/(\d{1,3})G(\d{1,3})KT/);
        if (slashGustMatch) {
            const windGust = parseInt(slashGustMatch[3]);
            console.log(`🌬️ Parsed wind gust: ${windGust} kts from slash format METAR`);
            return windGust;
        }
        
        // Standard METAR format like "21518G25KT"
        const gustMatch = rawMetar.match(/\d{3}\d{2,3}G(\d{2,3})KT/);
        if (gustMatch) {
            const windGust = parseInt(gustMatch[1]);
            console.log(`🌬️ Parsed wind gust: ${windGust} kts from standard METAR`);
            return windGust;
        }
        
        return null;
    }
    
    /**
     * Parse comprehensive weather data from METAR string
     * @param {string} rawMetar - Raw METAR string
     * @returns {object} Parsed weather data
     */
    parseComprehensiveMetar(rawMetar) {
        if (!rawMetar) return null;
        
        const data = {
            visibility: null,
            temperature: null,
            dewpoint: null,
            altimeter: null,
            clouds: [],
            conditions: [],
            rawMetar: rawMetar
        };
        
        // Parse visibility (e.g., "10SM", "1/2SM", "3/4SM")
        const visMatch = rawMetar.match(/(\d{1,2}(?:\/\d)?|\d+)SM/);
        if (visMatch) {
            const visString = visMatch[1];
            if (visString.includes('/')) {
                // Fractional visibility like "1/2SM"
                const [num, den] = visString.split('/');
                data.visibility = parseFloat(num) / parseFloat(den);
            } else {
                data.visibility = parseFloat(visString);
            }
        }
        
        // Parse temperature and dewpoint (e.g., "24/22")
        const tempMatch = rawMetar.match(/\s(\d{2})\/(\d{2})\s/);
        if (tempMatch) {
            data.temperature = parseInt(tempMatch[1]); // Celsius
            data.dewpoint = parseInt(tempMatch[2]);
        }
        
        // Parse altimeter setting (e.g., "A3000")
        const altMatch = rawMetar.match(/A(\d{4})/);
        if (altMatch) {
            data.altimeter = parseFloat(altMatch[1]) / 100; // Convert to inches Hg
        }
        
        // Parse cloud layers (e.g., "FEW015", "SCT024", "BKN085", "OVC010")
        const cloudMatches = rawMetar.matchAll(/(FEW|SCT|BKN|OVC)(\d{3})/g);
        for (const match of cloudMatches) {
            const coverage = match[1];
            const altitude = parseInt(match[2]) * 100; // Convert to feet AGL
            data.clouds.push({
                coverage: coverage,
                altitude: altitude,
                type: this.getCloudCoverageDescription(coverage)
            });
        }
        
        // Parse weather conditions (e.g., "-RA", "TS", "FG", "SN")
        const conditionMatches = rawMetar.matchAll(/\s(-|\+)?(RA|SN|TS|FG|BR|HZ|DZ|GR|IC|PL|GS|UP|VA|FC|SS|DS|PO|SQ|FC)\b/g);
        for (const match of conditionMatches) {
            const intensity = match[1] || '';
            const phenomenon = match[2];
            data.conditions.push({
                intensity: intensity,
                phenomenon: phenomenon,
                description: this.getWeatherDescription(intensity, phenomenon)
            });
        }
        
        return data;
    }
    
    /**
     * Get cloud coverage description
     */
    getCloudCoverageDescription(coverage) {
        switch (coverage) {
            case 'FEW': return 'Few';
            case 'SCT': return 'Scattered';
            case 'BKN': return 'Broken';
            case 'OVC': return 'Overcast';
            default: return coverage;
        }
    }
    
    /**
     * Get weather phenomenon description
     */
    getWeatherDescription(intensity, phenomenon) {
        const intensityMap = {
            '-': 'Light ',
            '+': 'Heavy ',
            '': ''
        };
        
        const phenomenonMap = {
            'RA': 'Rain',
            'SN': 'Snow',
            'TS': 'Thunderstorm',
            'FG': 'Fog',
            'BR': 'Mist',
            'HZ': 'Haze',
            'DZ': 'Drizzle',
            'GR': 'Hail',
            'IC': 'Ice Crystals',
            'PL': 'Ice Pellets',
            'GS': 'Small Hail',
            'UP': 'Unknown Precipitation',
            'VA': 'Volcanic Ash',
            'FC': 'Funnel Cloud',
            'SS': 'Sandstorm',
            'DS': 'Duststorm',
            'PO': 'Dust Devils',
            'SQ': 'Squalls'
        };
        
        return (intensityMap[intensity] || '') + (phenomenonMap[phenomenon] || phenomenon);
    }
    
    /**
     * Calculate flight category from METAR data (visibility and ceiling)
     * @param {object} metarData - Parsed METAR data
     * @returns {string} Flight category (VFR, MVFR, IFR, LIFR)
     */
    calculateFlightCategory(metarData) {
        if (!metarData) return 'Unknown';
        
        const visibility = metarData.visibility;
        const clouds = metarData.clouds || [];
        
        // Find lowest ceiling (BKN or OVC)
        let ceiling = null;
        for (const cloud of clouds) {
            if (cloud.coverage === 'BKN' || cloud.coverage === 'OVC') {
                if (ceiling === null || cloud.altitude < ceiling) {
                    ceiling = cloud.altitude;
                }
            }
        }
        
        // Flight category determination (FAA standards)
        // LIFR: Ceiling < 500 ft AND/OR visibility < 1 SM
        if ((ceiling !== null && ceiling < 500) || (visibility !== null && visibility < 1)) {
            return 'LIFR';
        }
        
        // IFR: Ceiling 500-999 ft AND/OR visibility 1-2 SM
        if ((ceiling !== null && ceiling >= 500 && ceiling < 1000) || 
            (visibility !== null && visibility >= 1 && visibility < 3)) {
            return 'IFR';
        }
        
        // MVFR: Ceiling 1000-3000 ft AND/OR visibility 3-4 SM
        if ((ceiling !== null && ceiling >= 1000 && ceiling <= 3000) || 
            (visibility !== null && visibility >= 3 && visibility <= 5)) {
            return 'MVFR';
        }
        
        // VFR: Ceiling > 3000 ft AND visibility > 5 SM
        return 'VFR';
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
