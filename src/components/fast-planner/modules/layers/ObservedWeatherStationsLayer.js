/**
 * ObservedWeatherStationsLayer.js
 * Real NOAA observation stations layer for Fast Planner
 * 
 * Displays actual weather observation points in the Gulf of Mexico
 * NO dummy data - only real NOAA/NWS observation stations
 */

class ObservedWeatherStationsLayer {
    constructor(map) {
        this.map = map;
        this.layerName = 'observed-weather-stations';
        this.source = null;
        this.layer = null;
        this.stationsData = new Map();
        this.popup = null;
        this.isVisible = false;
        
        // NOAA observation stations in Gulf of Mexico region
        this.gulfStations = [
            // *** COASTAL AVIATION STATIONS (Exact coordinates) ***
            // Texas Coast
            { id: 'KGLS', name: 'Galveston', lat: 29.2669, lon: -94.8606, type: 'ASOS' },
            { id: 'KIAH', name: 'Houston Intercontinental', lat: 29.9844, lon: -95.3414, type: 'ASOS' },
            { id: 'KHOU', name: 'Houston Hobby', lat: 29.6454, lon: -95.2789, type: 'ASOS' },
            { id: 'KCLL', name: 'College Station', lat: 30.5886, lon: -96.3614, type: 'ASOS' },
            { id: 'KVCT', name: 'Victoria', lat: 28.8525, lon: -96.9178, type: 'ASOS' },
            { id: 'KCXO', name: 'Conroe', lat: 30.3519, lon: -95.4144, type: 'AWOS' },
            
            // Louisiana Coast
            { id: 'KMSY', name: 'New Orleans', lat: 29.9934, lon: -90.2581, type: 'ASOS' },
            { id: 'KBTR', name: 'Baton Rouge', lat: 30.5328, lon: -91.1497, type: 'ASOS' },
            { id: 'KLCH', name: 'Lake Charles', lat: 30.1261, lon: -93.2236, type: 'ASOS' },
            { id: 'KLFT', name: 'Lafayette', lat: 30.2053, lon: -91.9876, type: 'ASOS' },
            { id: 'KNEW', name: 'New Orleans Lakefront', lat: 30.0424, lon: -90.0283, type: 'ASOS' },
            
            // Mississippi/Alabama Coast
            { id: 'KGPT', name: 'Gulfport', lat: 30.4073, lon: -89.0700, type: 'ASOS' },
            { id: 'KMOB', name: 'Mobile', lat: 30.6912, lon: -88.2425, type: 'ASOS' },
            { id: 'KBFM', name: 'Mobile Downtown', lat: 30.6267, lon: -88.0678, type: 'AWOS' },
            
            // Florida Panhandle
            { id: 'KPNS', name: 'Pensacola', lat: 30.4733, lon: -87.1867, type: 'ASOS' },
            { id: 'KVPS', name: 'Valparaiso', lat: 30.4828, lon: -86.5253, type: 'ASOS' },
            { id: 'KTLH', name: 'Tallahassee', lat: 30.3965, lon: -84.3503, type: 'ASOS' },
            
            // *** VERIFIED OFFSHORE GULF PLATFORMS (Exact coordinates from pilot) ***
            { id: 'KVOA', name: 'Gulf Platform VOA', lat: 29.23, lon: -87.78, type: 'ASOS' },
            { id: 'KIKT', name: 'Gulf Platform IKT', lat: 28.47, lon: -88.32, type: 'ASOS' },
            { id: 'KTAH', name: 'Gulf Platform TAH', lat: 27.32, lon: -90.71, type: 'ASOS' },
            { id: 'KANR', name: 'Gulf Platform ANR', lat: 27.23, lon: -91.18, type: 'ASOS' },
            { id: 'KGLX', name: 'Gulf Platform GLX', lat: 28.24, lon: -88.98, type: 'ASOS' },
            { id: 'KMTK', name: 'Gulf Platform MTK', lat: 28.70, lon: -89.39, type: 'ASOS' },
            { id: 'KMKQ', name: 'Gulf Platform MKQ', lat: 27.52, lon: -90.10, type: 'ASOS' },
            { id: 'KATP', name: 'Gulf Platform ATP', lat: 27.20, lon: -90.03, type: 'ASOS' },
            { id: 'KJSL', name: 'Gulf Platform JSL', lat: 25.99, lon: -91.01, type: 'ASOS' },
            { id: 'K18H', name: 'Gulf Platform 18H', lat: 25.73, lon: -91.43, type: 'ASOS' },
            { id: 'KGHB', name: 'Gulf Platform GHB', lat: 27.85, lon: -91.98, type: 'ASOS' },
            { id: 'KOYE', name: 'Gulf Platform OYE', lat: 28.87, lon: -90.49, type: 'ASOS' },
            { id: 'KPZZ', name: 'Gulf Platform PZZ', lat: 28.43, lon: -91.03, type: 'ASOS' },
            { id: 'KEKE', name: 'Gulf Platform EKE', lat: 28.50, lon: -91.57, type: 'ASOS' },
            { id: 'KEZP', name: 'Gulf Platform EZP', lat: 28.22, lon: -92.79, type: 'ASOS' },
            { id: 'KGUL', name: 'Gulf Platform GUL', lat: 27.09, lon: -93.56, type: 'ASOS' },
            { id: 'KGVW', name: 'Gulf Platform GVW', lat: 29.14, lon: -94.55, type: 'ASOS' },
            { id: 'KBQX', name: 'Gulf Platform BQX', lat: 28.32, lon: -95.62, type: 'ASOS' },
            { id: 'KVAF', name: 'Gulf Platform VAF', lat: 27.06, lon: -95.34, type: 'ASOS' },
            { id: 'KHHV', name: 'Gulf Platform HHV', lat: 26.94, lon: -94.69, type: 'ASOS' },
            { id: 'KGYF', name: 'Gulf Platform GYF', lat: 25.63, lon: -94.86, type: 'ASOS' },
            
            // Marine Buoys (exact coordinates from NOAA)
            { id: 'DRYF1', name: 'Dry Tortugas Buoy', lat: 24.6280, lon: -82.9192, type: 'BUOY' },
            { id: 'LONF1', name: 'Long Key Buoy', lat: 24.8361, lon: -80.8606, type: 'BUOY' },
            { id: '42001', name: 'East Gulf Buoy', lat: 25.8980, lon: -89.6680, type: 'BUOY' },
            { id: '42002', name: 'West Gulf Buoy', lat: 25.1930, lon: -93.7640, type: 'BUOY' },
            { id: '42019', name: 'Freeport Buoy', lat: 27.9070, lon: -95.3520, type: 'BUOY' },
            { id: '42020', name: 'Corpus Christi Buoy', lat: 26.9690, lon: -96.6940, type: 'BUOY' },
            { id: '42035', name: 'Galveston Buoy', lat: 29.2320, lon: -94.4130, type: 'BUOY' },
            { id: '42040', name: 'Luke Buoy', lat: 29.2120, lon: -88.2070, type: 'BUOY' }
        ];
        
        // Station status cache (good/bad weather conditions)
        this.stationStatus = new Map();
        
        console.log('ObservedWeatherStationsLayer initialized with', this.gulfStations.length, 'stations');
    }
    
    /**
     * Initialize the layer on the map
     */
    initialize() {
        try {
            this.createSource();
            this.createLayer();
            this.setupPopup();
            this.startWeatherUpdates();
            
            console.log('✅ Observed weather stations layer initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize observed weather stations layer:', error);
            return false;
        }
    }
    
    /**
     * Create the GeoJSON source for stations
     */
    createSource() {
        const features = this.gulfStations.map(station => ({
            type: 'Feature',
            id: station.id,
            geometry: {
                type: 'Point',
                coordinates: [station.lon, station.lat]
            },
            properties: {
                id: station.id,
                name: station.name,
                type: station.type,
                status: 'unknown', // Will be updated with weather data
                lastUpdate: null,
                conditions: null
            }
        }));
        
        const sourceData = {
            type: 'FeatureCollection',
            features: features
        };
        
        if (this.map.getSource(this.layerName)) {
            this.map.getSource(this.layerName).setData(sourceData);
        } else {
            this.map.addSource(this.layerName, {
                type: 'geojson',
                data: sourceData
            });
        }
        
        this.source = this.map.getSource(this.layerName);
        console.log(`Created source with ${features.length} weather stations`);
    }
    
    /**
     * Create the visual layer
     */
    createLayer() {
        // Remove existing layers if present
        if (this.map.getLayer(`${this.layerName}-inner`)) {
            this.map.removeLayer(`${this.layerName}-inner`);
        }
        if (this.map.getLayer(`${this.layerName}-ring`)) {
            this.map.removeLayer(`${this.layerName}-ring`);
        }
        if (this.map.getLayer(`${this.layerName}-wind-arrows`)) {
            this.map.removeLayer(`${this.layerName}-wind-arrows`);
        }
        if (this.map.getLayer(this.layerName)) {
            this.map.removeLayer(this.layerName);
        }
        
        // Inner circle (fill for buoys, transparent for aviation stations)
        this.map.addLayer({
            id: `${this.layerName}-inner`,
            type: 'circle',
            source: this.layerName,
            paint: {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 2,
                    8, 4,
                    12, 5
                ],
                'circle-color': [
                    'case',
                    ['==', ['get', 'type'], 'BUOY'], '#0066cc',  // Blue fill for buoys
                    'transparent'  // Transparent for aviation stations (ring only)
                ],
                'circle-opacity': [
                    'case',
                    ['==', ['get', 'type'], 'BUOY'], 0.6,  // Semi-transparent blue for buoys
                    0  // Fully transparent for aviation stations
                ],
                'circle-pitch-alignment': 'map',
                'circle-pitch-scale': 'map'
            }
        });
        
        // Outer ring (flight category color) - make slightly smaller to accommodate outside arrows
        this.map.addLayer({
            id: `${this.layerName}-ring`,
            type: 'circle',
            source: this.layerName,
            paint: {
                'circle-radius': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, [
                        'case',
                        ['==', ['get', 'type'], 'BUOY'], 2.5,
                        ['==', ['get', 'type'], 'ASOS'], 3.5,
                        3  // AWOS default
                    ],
                    8, [
                        'case',
                        ['==', ['get', 'type'], 'BUOY'], 4,
                        ['==', ['get', 'type'], 'ASOS'], 5,
                        4.5  // AWOS default
                    ],
                    12, [
                        'case',
                        ['==', ['get', 'type'], 'BUOY'], 6,
                        ['==', ['get', 'type'], 'ASOS'], 7,
                        6.5  // AWOS default
                    ]
                ],
                'circle-color': 'transparent',
                'circle-stroke-color': [
                    'case',
                    ['==', ['get', 'status'], 'good'], '#00ff00',      // Green for VFR
                    ['==', ['get', 'status'], 'marginal'], '#ffff00',  // Yellow for MVFR
                    ['==', ['get', 'status'], 'poor'], '#ff8c00',      // Orange for IFR
                    ['==', ['get', 'status'], 'bad'], '#ff0000',       // Red for LIFR
                    '#c0c0c0'  // Light gray for unknown
                ],
                'circle-stroke-width': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 2,
                    8, 3,
                    12, 3
                ],
                'circle-stroke-opacity': 0.9,
                'circle-pitch-alignment': 'map',
                'circle-pitch-scale': 'map'
            }
        });
        
        // Wind direction arrows (positioned OUTSIDE the ring) - using text arrow symbol
        this.map.addLayer({
            id: `${this.layerName}-wind-arrows`,
            type: 'symbol',
            source: this.layerName,
            layout: {
                'text-field': '▲', // Triangle arrow symbol
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 10,
                    8, 14,
                    12, 16
                ],
                'text-rotate': [
                    'case',
                    ['has', 'windDirection'], ['get', 'windDirection'],
                    0  // Default to 0 if no wind direction
                ],
                // Position the arrow OUTSIDE the ring
                'text-offset': [
                    0, 
                    [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        4, -1.5,   // Further outside at low zoom
                        8, -2.0,   // Even further at medium zoom
                        12, -2.5   // Furthest at high zoom
                    ]
                ],
                'text-allow-overlap': true,
                'text-ignore-placement': true,
                'text-pitch-alignment': 'map',
                'text-rotation-alignment': 'map'
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1,
                'text-opacity': [
                    'case',
                    ['has', 'windDirection'], 0.9,  // Show arrow if wind data available
                    0  // Hide if no wind data
                ]
            }
        });
        
        // Station labels
        this.map.addLayer({
            id: `${this.layerName}-labels`,
            type: 'symbol',
            source: this.layerName,
            layout: {
                'text-field': ['get', 'id'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 7,
                    8, 9,
                    12, 11
                ],
                'text-offset': [0, 2.0],
                'text-anchor': 'top',
                'text-optional': true,
                'text-pitch-alignment': 'map',
                'text-rotation-alignment': 'map'
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#000000',
                'text-halo-width': 1.5,
                'text-opacity': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    4, 0.6,
                    8, 0.9,
                    12, 1.0
                ]
            }
        });
        
        this.layer = this.layerName;
        console.log('✅ Weather stations layer created');
    }
    
    /**
     * Setup popup for station clicks
     */
    setupPopup() {
        this.popup = new mapboxgl.Popup({
            closeButton: true,
            closeOnClick: false,
            maxWidth: '400px'
        });
        
        // Click handler for stations - handle clicks on any of the layer components
        const clickableLayerIds = [`${this.layerName}-inner`, `${this.layerName}-ring`, `${this.layerName}-wind-arrows`];
        
        clickableLayerIds.forEach(layerId => {
            this.map.on('click', layerId, (e) => {
                const feature = e.features[0];
                const stationId = feature.properties.id;
                
                this.showStationPopup(feature, e.lngLat);
            });
            
            // Cursor change on hover
            this.map.on('mouseenter', layerId, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            
            this.map.on('mouseleave', layerId, () => {
                this.map.getCanvas().style.cursor = '';
            });
        });
        
        console.log('✅ Station popup handlers setup');
    }
    
    /**
     * Show popup with station weather data
     */
    async showStationPopup(feature, lngLat) {
        const stationId = feature.properties.id;
        const stationName = feature.properties.name;
        const stationType = feature.properties.type;
        
        // Show loading popup first
        this.popup
            .setLngLat(lngLat)
            .setHTML(`
                <div class="weather-station-popup">
                    <h3>${stationId} - ${stationName}</h3>
                    <p><em>Loading weather data...</em></p>
                </div>
            `)
            .addTo(this.map);
        
        try {
            // Fetch real-time weather data
            const weatherData = await this.fetchStationWeather(stationId, stationType);
            
            if (weatherData) {
                this.updateStationPopup(stationId, stationName, stationType, weatherData);
            } else {
                this.showErrorPopup(stationId, stationName, 'Weather data unavailable');
            }
            
        } catch (error) {
            console.error(`Failed to fetch weather for ${stationId}:`, error);
            this.showErrorPopup(stationId, stationName, error.message);
        }
    }
    
    /**
     * Fetch real weather data for a station
     */
    async fetchStationWeather(stationId, stationType) {
        try {
            let apiUrl;
            
            if (stationType === 'BUOY') {
                // NOAA Buoy data via proxy to avoid CORS
                apiUrl = `/api/buoy/data/realtime2/${stationId}.txt`;
            } else {
                // Aviation weather from NOAA Aviation Weather Center via proxy
                apiUrl = `/api/awc/api/data/metar?ids=${stationId}&format=json&taf=false`;
            }
            
            console.log(`Fetching weather via proxy: ${apiUrl}`);
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API responded with ${response.status}: ${response.statusText}`);
            }
            
            if (stationType === 'BUOY') {
                const textData = await response.text();
                return this.parseBuoyData(textData, stationId);
            } else {
                const jsonData = await response.json();
                return this.parseMetarData(jsonData, stationId);
            }
            
        } catch (error) {
            console.warn(`Weather fetch failed for ${stationId}:`, error.message);
            
            // NO FALLBACK - If real weather data fails, show error instead of fake data
            throw new Error(`Real weather data unavailable for ${stationId}: ${error.message}`);
        }
    }
    
    /**
     * Parse METAR data from NOAA Aviation Weather Center
     */
    parseMetarData(data, stationId) {
        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('No METAR data available');
        }
        
        const metar = data[0];
        const rawMetar = metar.rawOb || '';
        
        // Calculate flight category ourselves based on visibility and ceiling
        const flightCategory = this.calculateFlightCategory(metar, rawMetar);
        
        return {
            type: 'METAR',
            raw: rawMetar,
            time: metar.obsTime || new Date().toISOString(),
            conditions: this.extractMetarConditions(metar, rawMetar),
            weatherPhenomena: this.extractWeatherPhenomena(rawMetar),
            cloudLayers: this.extractCloudLayers(rawMetar),
            flightCategory: flightCategory, // Use our calculated category
            source: 'NOAA Aviation Weather Center'
        };
    }
    
    /**
     * Calculate flight category based on visibility and ceiling
     */
    calculateFlightCategory(metar, rawMetar) {
        // Get visibility in statute miles
        let visibility = metar.visib || 10; // Default to 10+ if not specified
        if (typeof visibility === 'string') {
            if (visibility.includes('+')) {
                visibility = parseFloat(visibility.replace('+', '')) || 10;
            } else {
                visibility = parseFloat(visibility) || 10;
            }
        }
        
        // Get ceiling from cloud layers
        let ceiling = 30000; // Default high ceiling
        const cloudLayers = this.extractCloudLayers(rawMetar);
        
        for (const layer of cloudLayers) {
            // Look for broken (BKN) or overcast (OVC) layers which create a ceiling
            if (layer.includes('Broken') || layer.includes('Overcast')) {
                const altMatch = layer.match(/(\d{1,3},?\d{0,3})\s*ft/);
                if (altMatch) {
                    const altitude = parseInt(altMatch[1].replace(',', ''));
                    if (altitude < ceiling) {
                        ceiling = altitude;
                    }
                }
            }
        }
        
        console.log(`${metar.station || 'Station'}: Visibility=${visibility}SM, Ceiling=${ceiling}ft`);
        
        // Apply flight category rules
        if (visibility < 1 || ceiling < 500) {
            return 'LIFR';  // Low IFR
        } else if (visibility >= 1 && visibility < 3 || ceiling >= 500 && ceiling < 1000) {
            return 'IFR';   // Instrument Flight Rules
        } else if (visibility >= 3 && visibility < 5 || ceiling >= 1000 && ceiling < 3000) {
            return 'MVFR';  // Marginal VFR
        } else {
            return 'VFR';   // Visual Flight Rules
        }
    }
    
    /**
     * Extract readable conditions from METAR data
     */
    extractMetarConditions(metar, rawMetar) {
        const conditions = [];
        
        // Basic conditions
        if (metar.temp !== undefined) conditions.push(`Temp: ${Math.round(metar.temp)}°C`);
        if (metar.dewp !== undefined) conditions.push(`Dewpoint: ${Math.round(metar.dewp)}°C`);
        
        // Wind information
        if (metar.wspd !== undefined) {
            let windStr = `Wind: ${metar.wdir || 'VRB'}°@${Math.round(metar.wspd)}kt`;
            if (metar.wgst) windStr += ` G${Math.round(metar.wgst)}kt`;
            conditions.push(windStr);
        }
        
        // Visibility
        if (metar.visib !== undefined) conditions.push(`Visibility: ${metar.visib}SM`);
        
        // Altimeter
        if (metar.altim) conditions.push(`Altimeter: A${metar.altim}`);
        
        return conditions.join(', ');
    }
    
    /**
     * Extract weather phenomena from raw METAR (CRITICAL for aviation safety)
     */
    extractWeatherPhenomena(rawMetar) {
        const phenomena = [];
        
        console.log(`🔍 Analyzing METAR for weather phenomena: ${rawMetar}`);
        
        // Weather phenomena patterns - MUST use word boundaries to prevent false matches
        const weatherPatterns = {
            'VCTS': '⚡ Vicinity Thunderstorms',
            '\\bTS\\b': '⛈️ Thunderstorms',  // Word boundary to prevent matching inside VCTS
            'TSRA': '⛈️ Thunderstorms with Rain', 
            'SHRA': '🌦️ Rain Showers',
            '\\bRA\\b': '🌧️ Rain',  // Word boundary to prevent false matches
            '\\bDZ\\b': '🌦️ Drizzle',
            '\\bSN\\b': '🌨️ Snow',  // Word boundary to prevent matching inside DSNT
            'SHSN': '🌨️ Snow Showers',
            '\\bFG\\b': '🌫️ Fog',
            '\\bBR\\b': '🌫️ Mist',
            '\\bHZ\\b': '🌫️ Haze',
            'BLDU': '💨 Blowing Dust',
            'BLSA': '💨 Blowing Sand',
            'FZRA': '🧊 Freezing Rain',
            'FZDZ': '🧊 Freezing Drizzle',
            'FZFG': '🧊 Freezing Fog',
            '\\bGR\\b': '🧊 Hail',
            '\\bGS\\b': '🧊 Small Hail',
            '\\bPL\\b': '🧊 Ice Pellets',
            '\\bUP\\b': '❓ Unknown Precipitation',
            'VCSH': '🌦️ Vicinity Showers',
            'VCFG': '🌫️ Vicinity Fog'
        };
        
        // Lightning patterns in remarks
        const lightningPatterns = {
            'LTG': '⚡ Lightning',
            'LTGIC': '⚡ In-Cloud Lightning',
            'LTGCC': '⚡ Cloud-to-Cloud Lightning', 
            'LTGCG': '⚡ Cloud-to-Ground Lightning',
            'LTGCA': '⚡ Cloud-to-Air Lightning'
        };
        
        // Check for weather phenomena using regex for exact matches
        for (const [pattern, description] of Object.entries(weatherPatterns)) {
            const regex = new RegExp(pattern, 'g');
            if (regex.test(rawMetar)) {
                phenomena.push(description);
                console.log(`✅ Found weather phenomenon: ${pattern} -> ${description}`);
            }
        }
        
        // Check for lightning in remarks section
        const remarksPart = rawMetar.split('RMK')[1] || '';
        for (const [code, description] of Object.entries(lightningPatterns)) {
            if (remarksPart.includes(code)) {
                // Extract direction if present
                const ltgMatch = remarksPart.match(new RegExp(`${code}\\s+([A-Z\\s]+)`));
                if (ltgMatch) {
                    const direction = ltgMatch[1].trim();
                    phenomena.push(`${description} ${direction}`);
                } else {
                    phenomena.push(description);
                }
                console.log(`✅ Found lightning: ${code} -> ${description}`);
                break; // Only add one lightning entry
            }
        }
        
        console.log(`🎯 Final weather phenomena: ${phenomena.join(', ')}`);
        return phenomena;
    }
    
    /**
     * Get note for station (if any)
     */
    getStationNote(stationId) {
        const station = this.gulfStations.find(s => s.id === stationId);
        return station?.note || null;
    }
    
    /**
     * Extract cloud layer information from raw METAR
     */
    extractCloudLayers(rawMetar) {
        const cloudLayers = [];
        
        // Cloud layer patterns: SKC, CLR, FEW###, SCT###, BKN###, OVC###
        const cloudPatterns = [
            { pattern: /SKC/g, description: 'Sky Clear' },
            { pattern: /CLR/g, description: 'Clear' },
            { pattern: /FEW(\d{3})/g, description: 'Few' },
            { pattern: /SCT(\d{3})/g, description: 'Scattered' },
            { pattern: /BKN(\d{3})/g, description: 'Broken' },
            { pattern: /OVC(\d{3})/g, description: 'Overcast' }
        ];
        
        for (const cloudPattern of cloudPatterns) {
            let match;
            while ((match = cloudPattern.pattern.exec(rawMetar)) !== null) {
                if (match[1]) {
                    // Has altitude
                    const altitude = parseInt(match[1]) * 100; // Convert to feet
                    cloudLayers.push(`${cloudPattern.description} at ${altitude.toLocaleString()}ft`);
                } else {
                    // No altitude (SKC, CLR)
                    cloudLayers.push(cloudPattern.description);
                }
            }
        }
        
        return cloudLayers;
    }
    
    /**
     * Parse NOAA buoy data
     */
    parseBuoyData(textData, stationId) {
        const lines = textData.split('\n').filter(line => line.trim());
        if (lines.length < 3) {
            throw new Error('Invalid buoy data format');
        }
        
        // Parse the latest data line (usually line 2)
        const dataLine = lines[2].split(/\s+/);
        
        return {
            type: 'BUOY',
            raw: lines[2],
            time: new Date().toISOString(),
            conditions: this.extractBuoyConditions(dataLine),
            flightCategory: 'MARINE',
            source: 'NOAA National Data Buoy Center'
        };
    }
    
    /**
     * Extract readable conditions from buoy data
     */
    extractBuoyConditions(data) {
        const conditions = [];
        
        // Typical buoy data format: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS TIDE
        if (data[5] && data[5] !== 'MM') conditions.push(`Wind Dir: ${data[5]}°`);
        if (data[6] && data[6] !== 'MM') conditions.push(`Wind Speed: ${data[6]}kt`);
        if (data[8] && data[8] !== 'MM') conditions.push(`Wave Height: ${data[8]}m`);
        if (data[12] && data[12] !== 'MM') conditions.push(`Pressure: ${data[12]}mb`);
        if (data[13] && data[13] !== 'MM') conditions.push(`Air Temp: ${data[13]}°C`);
        if (data[14] && data[14] !== 'MM') conditions.push(`Water Temp: ${data[14]}°C`);
        
        return conditions.join(', ');
    }
    
    /**
     * Update popup with weather data
     */
    updateStationPopup(stationId, stationName, stationType, weatherData) {
        const formatTime = (isoString) => {
            const date = new Date(isoString);
            return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        };
        
        const categoryColor = {
            'VFR': '#00ff00',
            'MVFR': '#ffff00', 
            'IFR': '#ff8c00',
            'LIFR': '#ff0000',
            'MARINE': '#00bfff'
        };
        
        const color = categoryColor[weatherData.flightCategory] || '#808080';
        
        // Extract key weather info from conditions
        const conditionsArray = weatherData.conditions.split(', ');
        let temp = '', wind = '', visibility = '';
        
        conditionsArray.forEach(condition => {
            if (condition.startsWith('Temp:')) temp = condition.replace('Temp: ', '');
            if (condition.startsWith('Wind:')) wind = condition.replace('Wind: ', '');
            if (condition.startsWith('Visibility:')) visibility = condition.replace('Visibility: ', '');
        });
        
        // Format ceiling from cloud layers
        let ceiling = '20,000 ft AGL';
        if (weatherData.cloudLayers && weatherData.cloudLayers.length > 0) {
            const significantClouds = weatherData.cloudLayers.filter(layer => 
                layer.includes('Broken') || layer.includes('Overcast')
            );
            if (significantClouds.length > 0) {
                ceiling = significantClouds[0].replace(' at ', ': ') + ' AGL';
            } else if (weatherData.cloudLayers[0] !== 'Sky Clear' && weatherData.cloudLayers[0] !== 'Clear') {
                ceiling = weatherData.cloudLayers[0];
            }
        }
        
        // Convert temperature to Fahrenheit
        let tempF = '';
        if (temp) {
            const tempC = parseFloat(temp.replace('°C', ''));
            const tempFahrenheit = Math.round((tempC * 9/5) + 32);
            tempF = `${tempFahrenheit}°F / ${temp}`;
        }
        
        // Simple conditions text
        let conditionsText = 'Clear skies';
        if (weatherData.weatherPhenomena && weatherData.weatherPhenomena.length > 0) {
            conditionsText = weatherData.weatherPhenomena.map(p => p.replace(/[⚡🌦️🌧️🌫️💨🧊❓☁️]/g, '').trim()).join(', ');
        }
        
        this.popup.setHTML(`
            <div style="font-family: Arial, sans-serif; max-width: 240px; background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; border-radius: 4px; padding: 0; box-shadow: 0 4px 16px rgba(0,0,0,0.3); font-size: 12px;">
                <div style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px 4px 0 0; border-bottom: 1px solid rgba(255,255,255,0.2);">
                    <div style="font-size: 12px; font-weight: 600; color: #ffffff; margin: 0;">${stationId}</div>
                </div>
                
                <div style="padding: 6px 8px; line-height: 1.2;">
                    <div style="margin-bottom: 3px;"><strong>Ceiling:</strong> ${ceiling}</div>
                    <div style="margin-bottom: 3px;"><strong>Flight Category:</strong> <span style="color: ${color}; font-weight: bold;">${weatherData.flightCategory}</span></div>
                    <div style="margin-bottom: 3px;"><strong>Visibility:</strong> ${visibility || '10+SM'}</div>
                    <div style="margin-bottom: 3px;"><strong>Wind:</strong> ${wind || 'Calm'}</div>
                    <div style="margin-bottom: 3px;"><strong>Cloud Coverage:</strong> ${weatherData.cloudLayers && weatherData.cloudLayers.length > 0 ? weatherData.cloudLayers[0] : '0%'}</div>
                    <div style="margin-bottom: 3px;"><strong>Temp:</strong> ${tempF || temp || 'N/A'}</div>
                    <div style="margin-bottom: 4px;"><strong>Conditions:</strong> ${conditionsText}</div>
                    
                    <div style="font-size: 10px; color: #b8d4f0; opacity: 0.8;"><strong>Observed:</strong> ${formatTime(weatherData.time)}</div>
                </div>
            </div>
        `);
    }
    
    /**
     * Show error popup
     */
    showErrorPopup(stationId, stationName, error) {
        this.popup.setHTML(`
            <div class="weather-station-popup">
                <h3>${stationId} - ${stationName}</h3>
                <p style="color: red;">❌ ${error}</p>
                <p style="font-size: 12px; color: #666;">
                    Station may be offline or data unavailable
                </p>
            </div>
        `);
    }
    
    /**
     * Start periodic weather updates
     */
    startWeatherUpdates() {
        // Run initial update immediately to color the circles
        console.log('🔄 Running initial weather station color update...');
        this.updateAllStationColors();
        
        // Then update every 10 minutes
        setInterval(() => {
            this.updateAllStationColors();
        }, 10 * 60 * 1000);
        
        console.log('✅ Started periodic weather updates (10 min intervals)');
    }
    
    /**
     * Update all station colors based on conditions
     */
    async updateAllStationColors() {
        console.log('🔄 Updating weather station colors...');
        
        for (const station of this.gulfStations) {
            try {
                const weatherData = await this.fetchStationWeather(station.id, station.type);
                if (weatherData) {
                    // Extract wind direction from conditions for arrow rotation
                    let windDirection = null;
                    if (weatherData.conditions) {
                        const windMatch = weatherData.conditions.match(/Wind:\s*(\d+)°/);
                        if (windMatch) {
                            windDirection = parseInt(windMatch[1]);
                        }
                    }
                    
                    this.updateStationColor(station.id, weatherData.flightCategory, windDirection);
                }
            } catch (error) {
                console.warn(`Failed to update station ${station.id}:`, error.message);
            }
            
            // Small delay to avoid overwhelming APIs
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    /**
     * Update individual station color and wind direction
     */
    updateStationColor(stationId, flightCategory, windDirection = null) {
        // Update the source data
        const sourceData = this.source._data;
        const feature = sourceData.features.find(f => f.properties.id === stationId);
        
        if (feature) {
            const statusMap = {
                'VFR': 'good',
                'MVFR': 'marginal', 
                'IFR': 'poor',
                'LIFR': 'bad',
                'MARINE': 'good'
            };
            
            feature.properties.status = statusMap[flightCategory] || 'unknown';
            feature.properties.lastUpdate = new Date().toISOString();
            
            // Add wind direction for arrow rotation (convert to degrees for icon rotation)
            if (windDirection !== null && !isNaN(windDirection)) {
                feature.properties.windDirection = windDirection;
            }
            
            this.source.setData(sourceData);
            console.log(`Updated ${stationId}: ${flightCategory} (${statusMap[flightCategory]}), Wind: ${windDirection || 'N/A'}°`);
        }
    }
    
    /**
     * Show/hide the layer
     */
    setVisible(visible) {
        this.isVisible = visible;
        
        const visibility = visible ? 'visible' : 'none';
        
        // Toggle visibility for all layer components
        const layerIds = [
            `${this.layerName}-inner`,
            `${this.layerName}-ring`, 
            `${this.layerName}-wind-arrows`,
            `${this.layerName}-labels`
        ];
        
        layerIds.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.setLayoutProperty(layerId, 'visibility', visibility);
            }
        });
        
        if (!visible && this.popup.isOpen()) {
            this.popup.remove();
        }
        
        console.log(`Weather stations layer ${visible ? 'shown' : 'hidden'}`);
    }
    
    /**
     * Clean up the layer
     */
    destroy() {
        if (this.popup) {
            this.popup.remove();
        }
        
        // Remove all layer components
        const layerIds = [
            `${this.layerName}-labels`,
            `${this.layerName}-wind-arrows`,
            `${this.layerName}-ring`,
            `${this.layerName}-inner`,
            this.layerName
        ];
        
        layerIds.forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });
        
        if (this.map.getSource(this.layerName)) {
            this.map.removeSource(this.layerName);
        }
        
        console.log('🗑️ Weather stations layer destroyed');
    }
}

export default ObservedWeatherStationsLayer;
