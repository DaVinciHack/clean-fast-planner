/**
 * NOAASatelliteService.js
 * NOAA Satellite WMS Integration for Fast Planner
 * 
 * Integrates with NOAA nowCOAST WMS satellite layers
 * Provides real-time satellite imagery overlays for weather visualization
 */

class NOAASatelliteService {
    constructor() {
        // NOAA nowCOAST WMS endpoints - use relative URLs for development (localhost or ngrok)
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('ngrok');
        const baseUrl = isLocal ? '' : 'https://bristow.info/weather';
        
        this.satelliteUrl = `${baseUrl}/api/noaa/geoserver/observations/satellite/ows`;
        this.radarUrl = `${baseUrl}/api/noaa/geoserver/observations/weather_radar/ows`;
        this.lightningUrl = `${baseUrl}/api/noaa/geoserver/observations/lightning_detection/ows`;
        
        console.log(`🌐 Environment: ${window.location.hostname}, isLocal: ${isLocal}, baseUrl: "${baseUrl}"`);
        
        // Available satellite layers
        this.satelliteLayers = {
            VISIBLE: 'goes_visible_imagery',           // 0.5km resolution
            LONGWAVE: 'goes_longwave_imagery',         // 2km resolution - temperature patterns
            SHORTWAVE: 'goes_shortwave_imagery',       // 2km resolution - fog/low clouds
            WATER_VAPOR: 'goes_water_vapor_imagery',   // 2km resolution - moisture
            SNOW_ICE: 'goes_snow_ice_imagery'          // 1km resolution - ice/snow
        };
        
        // Available weather radar layers  
        this.radarLayers = {
            CONUS: 'conus_base_reflectivity_mosaic',      // Continental US
            ALASKA: 'alaska_base_reflectivity_mosaic',    // Alaska
            HAWAII: 'hawaii_base_reflectivity_mosaic',    // Hawaii  
            CARIBBEAN: 'caribbean_base_reflectivity_mosaic', // Gulf of Mexico & Caribbean
            GUAM: 'guam_base_reflectivity_mosaic'         // Guam/Pacific
        };
        
        // Available lightning layers
        this.lightningLayers = {
            LIGHTNING: 'ldn_lightning_strike_density'     // Global lightning detection
        };
        
        // Combined layers for easy access
        this.layers = {
            ...this.satelliteLayers,
            ...this.radarLayers,
            ...this.lightningLayers
        };
        
        // Coverage areas
        this.satelliteCoverage = {
            west: -179.50264534993195,
            east: -50.74952459605097,
            south: 10.910578706055357,
            north: 50.55317923122151
        };
        
        // Radar coverage areas (much broader)
        this.radarCoverage = {
            CONUS: { west: -129.99, east: -59.99, south: 20.00, north: 55.00 },
            CARIBBEAN: { west: -89.99, east: -60.00, south: 9.99, north: 25.00 }, // Perfect for Gulf!
            ALASKA: { west: -175.99, east: -125.99, south: 49.99, north: 72.00 },
            HAWAII: { west: -164.00, east: -151.00, south: 14.99, north: 26.00 },
            GUAM: { west: 140.00, east: 150.00, south: 8.99, north: 18.00 }
        };
        // Lightning coverage (GLOBAL!)
        this.lightningCoverage = {
            west: -179.99, east: 179.97, south: -25.01, north: 80.03
        };
        
        // Update frequencies
        this.updateFrequency = {
            satellite: 5 * 60 * 1000,  // 5 minutes
            radar: 4 * 60 * 1000,      // 4 minutes  
            lightning: 15 * 60 * 1000  // 15 minutes
        };
        
        console.log('NOAASatelliteService initialized');
    }
    
    /**
     * Check if coordinates are within NOAA coverage (satellite or radar)
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @param {string} type - 'satellite', 'radar', or 'any' (default)
     * @returns {Object} Coverage information
     */
    isWithinCoverage(lat, lon, type = 'any') {
        const result = {
            withinSatellite: false,
            withinRadar: false,
            radarRegions: [],
            bestCoverage: null
        };
        
        // Check satellite coverage
        result.withinSatellite = lat >= this.satelliteCoverage.south && 
                                lat <= this.satelliteCoverage.north && 
                                lon >= this.satelliteCoverage.west && 
                                lon <= this.satelliteCoverage.east;
        
        // Check radar coverage by region
        for (const [region, bounds] of Object.entries(this.radarCoverage)) {
            if (lat >= bounds.south && lat <= bounds.north && 
                lon >= bounds.west && lon <= bounds.east) {
                result.withinRadar = true;
                result.radarRegions.push(region);
            }
        }
        
        // Determine best coverage
        if (result.withinRadar && result.withinSatellite) {
            result.bestCoverage = 'both';
        } else if (result.withinRadar) {
            result.bestCoverage = 'radar';
        } else if (result.withinSatellite) {
            result.bestCoverage = 'satellite';
        } else {
            result.bestCoverage = 'none';
        }
        
        return result;
    }
    
    /**
     * Get WMS URL for a specific layer (satellite, radar, or lightning)
     * @param {string} layerName - Layer name from this.layers
     * @param {Object} options - WMS options (bbox, width, height, time, etc.)
     * @returns {string} Complete WMS URL
     */
    getWMSUrl(layerName, options = {}) {
        // Determine if this is a satellite, radar, or lightning layer
        const isSatellite = Object.values(this.satelliteLayers).includes(layerName);
        const isLightning = Object.values(this.lightningLayers).includes(layerName);
        const isRadar = Object.values(this.radarLayers).includes(layerName);
        
        let baseUrl;
        if (isSatellite) {
            baseUrl = this.satelliteUrl;
        } else if (isLightning) {
            baseUrl = this.lightningUrl;
        } else {
            baseUrl = this.radarUrl;
        }
        
        const params = new URLSearchParams({
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            REQUEST: 'GetMap',
            LAYERS: layerName,
            CRS: options.crs || 'EPSG:3857',
            FORMAT: options.format || 'image/png',
            TRANSPARENT: 'true',
            WIDTH: options.width || 512,
            HEIGHT: options.height || 512
        });
        
        // Only add BBOX if it's not null (for Mapbox tile templates, we add BBOX manually)
        if (options.bbox !== null) {
            params.set('BBOX', options.bbox || this.getDefaultBBox(isSatellite ? 'satellite' : isLightning ? 'lightning' : 'radar'));
        }
        
        // Don't add TIME parameter - it causes most WMS services to return errors
        // Lightning handles TIME separately in WeatherLoader.js
        console.log(`🛰️ Building ${isSatellite ? 'satellite' : isLightning ? 'lightning' : 'radar'} WMS URL without TIME parameter`);
        
        return `${baseUrl}?${params.toString()}`;
    }
    
    /**
     * Get the latest available time for satellite imagery
     * @returns {string} ISO timestamp
     */
    getLatestTime() {
        // For real-time data, use current time rounded to nearest 5-minute interval
        const now = new Date();
        const minutes = Math.floor(now.getMinutes() / 5) * 5;
        now.setMinutes(minutes, 0, 0);
        return now.toISOString().slice(0, 19) + 'Z';
    }
    
    /**
     * Get default bounding box for different layer types
     * @param {string} type - 'satellite' or 'radar'
     * @returns {string} Bounding box string
     */
    getDefaultBBox(type = 'radar') {
        if (type === 'satellite') {
            // Gulf of Mexico focus for satellite
            return '-11000000,2500000,-8500000,4000000';
        } else {
            // Caribbean/Gulf focus for radar (better coverage)
            return '-10500000,1100000,-6700000,2900000';
        }
    }
    
    /**
     * Get bounding box for specific region
     * @param {Object} bounds - {north, south, east, west} in decimal degrees
     * @returns {string} Bounding box in EPSG:3857
     */
    getBBoxFromBounds(bounds) {
        // Convert lat/lon to Web Mercator (EPSG:3857)
        const sw = this.latLonToWebMercator(bounds.south, bounds.west);
        const ne = this.latLonToWebMercator(bounds.north, bounds.east);
        return `${sw.x},${sw.y},${ne.x},${ne.y}`;
    }
    
    /**
     * Convert lat/lon to Web Mercator coordinates
     * @param {number} lat - Latitude in decimal degrees
     * @param {number} lon - Longitude in decimal degrees
     * @returns {Object} {x, y} coordinates in EPSG:3857
     */
    latLonToWebMercator(lat, lon) {
        const x = lon * 20037508.34 / 180;
        let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        y = y * 20037508.34 / 180;
        return { x, y };
    }
    
    /**
     * Create a Mapbox GL source for NOAA satellite layer
     * @param {string} layerName - Layer name from this.layers
     * @param {Object} options - Layer options
     * @returns {Object} Mapbox GL source configuration
     */
    createMapboxSource(layerName, options = {}) {
        // Build URL without bbox first, then add bbox placeholder manually to avoid encoding
        const urlWithoutBbox = this.getWMSUrl(layerName, {
            ...options,
            width: 512,
            height: 512,
            bbox: null  // Don't include bbox in the URL generation
        });
        
        // Add bbox parameter manually to avoid URL encoding of the placeholder
        const tileUrl = urlWithoutBbox + '&BBOX={bbox-epsg-3857}';
        
        // Debug the actual tile URL being created
        console.log(`🛰️ Satellite tile URL template: ${tileUrl}`);
        
        // Test what a real tile URL looks like (handle URL-encoded bbox placeholder)
        const testUrl = tileUrl.replace('{bbox-epsg-3857}', '-10000000,3000000,-9000000,4000000')
                               .replace('%7Bbbox-epsg-3857%7D', '-10000000,3000000,-9000000,4000000');
        console.log(`🧪 Test tile URL: ${testUrl}`);
        
        return {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 512,
            attribution: '© NOAA nowCOAST Satellite Imagery'
        };
    }
    
    /**
     * Test both satellite and radar data availability
     * @param {number} lat - Test latitude
     * @param {number} lon - Test longitude
     * @returns {Promise<Object>} Comprehensive test results
     */
    async testAllWeatherData(lat = 29.0, lon = -94.0) {
        console.log('🛰️🌧️ Testing both satellite and radar data availability...');
        
        const results = {
            success: false,
            location: { lat, lon },
            coverage: {},
            satelliteData: [],
            radarData: [],
            recommendations: [],
            errors: []
        };
        
        try {
            // Check coverage
            results.coverage = this.isWithinCoverage(lat, lon);
            
            console.log(`📡 Coverage: Satellite=${results.coverage.withinSatellite}, Radar=${results.coverage.withinRadar}`);
            console.log(`🎯 Best coverage: ${results.coverage.bestCoverage}`);
            
            // Test satellite layers if within coverage
            if (results.coverage.withinSatellite) {
                console.log('🛰️ Testing satellite layers...');
                
                for (const [name, layerName] of Object.entries(this.satelliteLayers)) {
                    try {
                        const testUrl = this.getWMSUrl(layerName, {
                            bbox: this.getBBoxFromBounds({
                                north: lat + 0.5, south: lat - 0.5,
                                east: lon + 0.5, west: lon - 0.5
                            }),
                            width: 256, height: 256
                        });
                        
                        const response = await fetch(testUrl, { method: 'HEAD' });
                        
                        if (response.ok) {
                            results.satelliteData.push({
                                name: name,
                                layer: layerName,
                                type: 'satellite',
                                url: testUrl,
                                status: 'available'
                            });
                            console.log(`✅ Satellite ${name} available`);
                        } else {
                            console.log(`⚠️ Satellite ${name}: HTTP ${response.status}`);
                        }
                        
                    } catch (error) {
                        console.log(`❌ Satellite ${name} failed: ${error.message}`);
                        results.errors.push(`Satellite ${name}: ${error.message}`);
                    }
                }
            }
            
            // Test radar layers if within coverage
            if (results.coverage.withinRadar) {
                console.log('🌧️ Testing radar layers...');
                
                // Test specific radar regions that cover this location
                for (const region of results.coverage.radarRegions) {
                    const layerName = this.radarLayers[region];
                    
                    try {
                        const testUrl = this.getWMSUrl(layerName, {
                            bbox: this.getBBoxFromBounds({
                                north: lat + 0.5, south: lat - 0.5,
                                east: lon + 0.5, west: lon - 0.5
                            }),
                            width: 256, height: 256
                        });
                        
                        const response = await fetch(testUrl, { method: 'HEAD' });
                        
                        if (response.ok) {
                            results.radarData.push({
                                name: `${region}_RADAR`,
                                layer: layerName,
                                type: 'radar',
                                region: region,
                                url: testUrl,
                                status: 'available'
                            });
                            console.log(`✅ Radar ${region} available`);
                        } else {
                            console.log(`⚠️ Radar ${region}: HTTP ${response.status}`);
                        }
                        
                    } catch (error) {
                        console.log(`❌ Radar ${region} failed: ${error.message}`);
                        results.errors.push(`Radar ${region}: ${error.message}`);
                    }
                }
            }
            
            // Generate recommendations
            this.generateRecommendations(results);
            
            results.success = results.satelliteData.length > 0 || results.radarData.length > 0;
            
        } catch (error) {
            console.error('❌ Weather data test failed:', error);
            results.errors.push(error.message);
        }
        
        return results;
    }
    
    /**
     * Generate recommendations based on test results
     * @private
     */
    generateRecommendations(results) {
        if (results.coverage.bestCoverage === 'both') {
            results.recommendations.push('🎯 Excellent! Both satellite and radar available');
            results.recommendations.push('💡 Use radar for precipitation, satellite for clouds');
            results.recommendations.push('🔄 Radar updates every 4 min, satellite every 5 min');
        } else if (results.coverage.bestCoverage === 'radar') {
            results.recommendations.push('🌧️ Radar coverage available - perfect for storm tracking');
            results.recommendations.push('⚡ 4-minute updates ideal for real-time weather');
            results.recommendations.push('🎯 Especially good for Gulf of Mexico operations');
        } else if (results.coverage.bestCoverage === 'satellite') {
            results.recommendations.push('🛰️ Satellite coverage available');
            results.recommendations.push('☁️ Great for cloud patterns and visibility');
            results.recommendations.push('🌊 Multiple bands available for different conditions');
        } else {
            results.recommendations.push('⚠️ Limited NOAA coverage for this location');
            results.recommendations.push('💡 Consider alternative weather data sources');
        }
        
        // Gulf of Mexico specific recommendations
        if (results.coverage.radarRegions.includes('CARIBBEAN')) {
            results.recommendations.push('🌊 Gulf of Mexico: Perfect for offshore operations!');
            results.recommendations.push('🛢️ Ideal for rig weather monitoring');
        }
    }
    
    /**
     * Get GetCapabilities document from NOAA WMS
     * @returns {Promise<Object>} Parsed capabilities
     */
    async getCapabilities() {
        try {
            const url = `${this.baseUrl}?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0`;
            console.log('🛰️ Fetching NOAA WMS capabilities...');
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Capabilities request failed: ${response.status}`);
            }
            
            const xmlText = await response.text();
            
            // Parse XML to get layer information
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const capabilities = {
                service: {},
                layers: [],
                updateSequence: xmlDoc.documentElement.getAttribute('updateSequence')
            };
            
            // Extract service information
            const serviceElement = xmlDoc.getElementsByTagName('Service')[0];
            if (serviceElement) {
                capabilities.service = {
                    name: serviceElement.getElementsByTagName('Name')[0]?.textContent,
                    title: serviceElement.getElementsByTagName('Title')[0]?.textContent,
                    abstract: serviceElement.getElementsByTagName('Abstract')[0]?.textContent
                };
            }
            
            // Extract layer information
            const layerElements = xmlDoc.getElementsByTagName('Layer');
            for (let i = 0; i < layerElements.length; i++) {
                const layer = layerElements[i];
                const nameElement = layer.getElementsByTagName('Name')[0];
                
                if (nameElement) {
                    const layerInfo = {
                        name: nameElement.textContent,
                        title: layer.getElementsByTagName('Title')[0]?.textContent,
                        abstract: layer.getElementsByTagName('Abstract')[0]?.textContent,
                        queryable: layer.getAttribute('queryable') === '1'
                    };
                    
                    // Get time dimension
                    const timeElement = layer.getElementsByTagName('Dimension')[0];
                    if (timeElement && timeElement.getAttribute('name') === 'time') {
                        layerInfo.timeSupport = true;
                        layerInfo.defaultTime = timeElement.getAttribute('default');
                    }
                    
                    capabilities.layers.push(layerInfo);
                }
            }
            
            console.log('✅ NOAA WMS capabilities retrieved:', capabilities);
            return capabilities;
            
        } catch (error) {
            console.error('❌ Failed to get NOAA WMS capabilities:', error);
            throw error;
        }
    }
    
    /**
     * Create a simple test overlay for Mapbox GL
     * @param {Object} map - Mapbox GL map instance
     * @param {string} layerType - Layer type to display
     * @returns {Promise<boolean>} Success status
     */
    async addTestOverlay(map, layerType = 'VISIBLE') {
        if (!map) {
            console.error('❌ No map instance provided');
            return false;
        }
        
        const layerName = this.layers[layerType];
        if (!layerName) {
            console.error(`❌ Unknown layer type: ${layerType}`);
            return false;
        }
        
        try {
            console.log(`🛰️ Adding ${layerType} satellite overlay to map...`);
            
            // Use unique layer IDs for each layer type to enable stacking
            const sourceId = `noaa-${layerType.toLowerCase()}-source`;
            const layerId = `noaa-${layerType.toLowerCase()}-layer`;
            
            // Remove existing layer of this type if present
            if (map.getSource(sourceId)) {
                map.removeLayer(layerId);
                map.removeSource(sourceId);
            }
            
            // Create source
            const source = this.createMapboxSource(layerName);
            
            // Add source to map
            map.addSource(sourceId, source);
            
            // Add layer to map with proper z-order
            const layerOrder = {
                'CONUS': 100,      // Radar on top
                'LONGWAVE': 90,    // IR layers below
                'SHORTWAVE': 80,   // IR layers below
                'VISIBLE': 70      // Visible light lowest
            };
            
            const layerConfig = {
                id: layerId,
                type: 'raster',
                source: sourceId,
                paint: {
                    'raster-opacity': 0.7
                }
            };
            
            // Find the right insertion point for proper layering
            const allLayers = map.getStyle().layers;
            let beforeLayerId = null;
            
            // Insert weather layers before any existing labels or text layers
            for (let i = allLayers.length - 1; i >= 0; i--) {
                const layer = allLayers[i];
                if (layer.type === 'symbol' || layer.id.includes('label') || layer.id.includes('text')) {
                    beforeLayerId = layer.id;
                    break;
                }
            }
            
            if (beforeLayerId) {
                map.addLayer(layerConfig, beforeLayerId);
                console.log(`✅ ${layerType} added before layer: ${beforeLayerId}`);
            } else {
                map.addLayer(layerConfig);
                console.log(`✅ ${layerType} added to top`);
            }
            
            console.log(`✅ ${layerType} satellite overlay added successfully with ID: ${layerId}`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to add satellite overlay:`, error);
            return false;
        }
    }
    
    /**
     * Remove satellite overlay from map
     * @param {Object} map - Mapbox GL map instance
     * @param {string} layerType - Optional specific layer type to remove
     */
    removeOverlay(map, layerType = null) {
        if (!map) return;
        
        try {
            if (layerType) {
                // Remove specific layer type
                const sourceId = `noaa-${layerType.toLowerCase()}-source`;
                const layerId = `noaa-${layerType.toLowerCase()}-layer`;
                
                if (map.getSource(sourceId)) {
                    map.removeLayer(layerId);
                    map.removeSource(sourceId);
                    console.log(`✅ ${layerType} satellite overlay removed`);
                }
            } else {
                // Remove all NOAA satellite layers (legacy support)
                const layerTypes = ['CONUS', 'LONGWAVE', 'SHORTWAVE', 'VISIBLE'];
                
                for (const type of layerTypes) {
                    const sourceId = `noaa-${type.toLowerCase()}-source`;
                    const layerId = `noaa-${type.toLowerCase()}-layer`;
                    
                    if (map.getSource(sourceId)) {
                        map.removeLayer(layerId);
                        map.removeSource(sourceId);
                    }
                }
                
                // Also remove old layer naming for backward compatibility
                if (map.getSource('noaa-satellite')) {
                    map.removeLayer('noaa-satellite-layer');
                    map.removeSource('noaa-satellite');
                }
                
                console.log('✅ All satellite overlays removed');
            }
        } catch (error) {
            console.error('❌ Failed to remove satellite overlay:', error);
        }
    }
}

// Export for use
export default NOAASatelliteService;

// Make available globally for console testing
if (typeof window !== 'undefined') {
    window.NOAASatelliteService = NOAASatelliteService;
    window.noaaSatellite = new NOAASatelliteService();
    
    console.log('🛰️ NOAA Satellite Service available at: window.noaaSatellite');
    console.log('🧪 Test satellite data with: window.noaaSatellite.testSatelliteData(29.0, -94.0)');
}
