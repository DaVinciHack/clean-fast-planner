/**
 * RigWeatherGraphics.js
 * Visual rig weather graphics system for Fast Planner
 * 
 * Renders wind arrows and weather rings for helicopter operations
 * Aviation weather data visualization with proper safety standards
 */

class RigWeatherGraphics {
    constructor(map) {
        this.map = map;
        this.isVisible = false;
        this.rigWeatherData = [];
        
        // Layer IDs
        this.layerIds = {
            rings: 'rig-weather-rings',
            arrows: 'rig-weather-arrows',
            hover: 'rig-weather-hover'
        };
        
        // Source IDs
        this.sourceIds = {
            rings: 'rig-weather-rings-source',
            arrows: 'rig-weather-arrows-source',
            hover: 'rig-weather-hover-source'
        };
        
        // Add professional icons to map
        this.addWeatherIcons();
        
        console.log('🚁 RigWeatherGraphics initialized');
        
        // Add test function to global scope for debugging
        window.testRigGraphics = () => this.testStaticGraphics();
    }
    
    /**
     * Add compass rose weather graphics - maritime/aviation style
     * @private
     */
    addWeatherIcons() {
        try {
            // Create compass rose with integrated wind arrow
            const compassRose = this.createCompassRose();
            
            if (compassRose && !this.map.hasImage('compass-rose')) {
                this.map.addImage('compass-rose', compassRose);
                console.log('🚁 Compass rose weather graphic added');
            }
            
        } catch (error) {
            console.error('🚁 Failed to add compass rose:', error);
        }
    }
    
    /**
     * Create maritime/aviation compass rose with integrated wind arrow
     * Like a traditional compass rose on nautical charts
     * @private
     */
    createCompassRose() {
        const size = 120; // Large enough for compass rose
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        
        // Clear to transparent
        ctx.clearRect(0, 0, size, size);
        
        const centerX = size / 2;
        const centerY = size / 2;
        const radius = 50; // Compass rose radius
        
        // Draw compass rose base (subtle circle)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Draw cardinal direction markers (N, E, S, W)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 1;
        
        // North marker
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX - 3, centerY - radius + 8);
        ctx.lineTo(centerX + 3, centerY - radius + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // East marker
        ctx.beginPath();
        ctx.moveTo(centerX + radius, centerY);
        ctx.lineTo(centerX + radius - 8, centerY - 3);
        ctx.lineTo(centerX + radius - 8, centerY + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // South marker
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + radius);
        ctx.lineTo(centerX - 3, centerY + radius - 8);
        ctx.lineTo(centerX + 3, centerY + radius - 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // West marker
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX - radius + 8, centerY - 3);
        ctx.lineTo(centerX - radius + 8, centerY + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw main wind arrow (pointing north by default, will be rotated)
        // Make arrow completely white so MapBox can colorize it
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'white'; // No black outline so color shows better
        ctx.lineWidth = 2;
        
        // Large directional arrow
        const arrowLength = radius * 0.8;
        const arrowWidth = 12;
        
        ctx.beginPath();
        // Arrow tip
        ctx.moveTo(centerX, centerY - arrowLength);
        // Left side of arrowhead
        ctx.lineTo(centerX - arrowWidth, centerY - arrowLength + 15);
        // Left side of shaft
        ctx.lineTo(centerX - 4, centerY - arrowLength + 15);
        // Left bottom of shaft
        ctx.lineTo(centerX - 4, centerY + arrowLength * 0.3);
        // Right bottom of shaft
        ctx.lineTo(centerX + 4, centerY + arrowLength * 0.3);
        // Right side of shaft
        ctx.lineTo(centerX + 4, centerY - arrowLength + 15);
        // Right side of arrowhead
        ctx.lineTo(centerX + arrowWidth, centerY - arrowLength + 15);
        ctx.closePath();
        ctx.fill();
        
        // Add thin black outline for definition
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Convert to ImageData
        return ctx.getImageData(0, 0, size, size);
    }
    
    /**
     * Update and display rig weather graphics
     * @param {Array} rigWeatherData - Array of rig weather data
     */
    updateRigWeather(rigWeatherData) {
        // SIMPLIFIED: Don't auto-cleanup, just update data
        this.rigWeatherData = rigWeatherData;
        
        // DEBUG: Log what we received
        console.log(`🚁 RECEIVED ${rigWeatherData.length} weather items:`, rigWeatherData.map(r => ({
            name: r.rigName,
            type: r.locationType,
            isAirport: r.isAirport,
            windSpeed: r.windSpeed
        })));
        
        // ALWAYS render arrows when weather data is updated
        this.isVisible = true;
        this.removeWeatherGraphics();
        this.renderWeatherGraphics();
        
        console.log(`🚁 Updated weather graphics for ${rigWeatherData.length} rigs`);
    }
    
    /**
     * Toggle visibility of rig weather graphics
     * @param {boolean} visible - Show/hide graphics
     */
    toggleVisibility(visible) {
        // ALWAYS VISIBLE: Wind arrows should always be shown with weather data
        this.isVisible = true;
        
        // Always render graphics regardless of toggle state
        console.log('🌬️ Wind arrows are permanently visible - ignoring toggle');
        this.renderWeatherGraphics();
        
        console.log(`🚁 Wind arrows are always shown (toggle ignored)`);
    }
    
    /**
     * Render all weather graphics on the map
     * @private
     */
    renderWeatherGraphics() {
        if (!this.rigWeatherData || this.rigWeatherData.length === 0) {
            console.log('🚁 No rig weather data to render');
            return;
        }
        
        // Remove existing graphics first
        this.removeWeatherGraphics();
        
        // Create weather rings
        this.createWeatherRings();
        
        // Create wind arrows (with error handling)
        try {
            this.createWindArrows();
        } catch (error) {
            console.warn('🚁 Wind arrows failed, continuing with circles only:', error.message);
        }
        
        // Create hover areas
        this.createHoverAreas();
        
        console.log(`🚁 Rendered weather graphics for ${this.rigWeatherData.length} rigs`);
        
        // Debug: Log exact locations where graphics were placed
        this.rigWeatherData.forEach(rig => {
            console.log(`📍 Rig ${rig.rigName} graphics at: ${rig.latitude}, ${rig.longitude}`);
        });
    }
    
    /**
     * Create concentric weather rings
     * @private
     */
    createWeatherRings() {
        const ringFeatures = [];
        
        for (const rig of this.rigWeatherData) {
            const rings = this.generateWeatherRings(rig);
            ringFeatures.push(...rings);
        }
        
        if (ringFeatures.length === 0) return;
        
        // Add source
        this.map.addSource(this.sourceIds.rings, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: ringFeatures
            }
        });
        
        // Add ring layer as LINE (outline only) - insert at the TOP of the layer stack
        this.map.addLayer({
            id: this.layerIds.rings,
            type: 'line',
            source: this.sourceIds.rings,
            layout: {
                'line-cap': 'round',
                'line-join': 'round'
            },
            paint: {
                'line-color': ['get', 'color'],
                'line-width': [
                    'interpolate',
                    ['exponential', 2],
                    ['zoom'],
                    5, 2,    // Thin at low zoom
                    10, 4,   // Medium at mid zoom
                    15, 8    // Thick at high zoom
                ],
                'line-opacity': ['get', 'opacity']
            }
        }); // No beforeId = adds to TOP of stack
        
        console.log(`🚁 Added ${ringFeatures.length} weather rings`);
        
        // Debug: Check if layer was actually added
        setTimeout(() => {
            const layer = this.map.getLayer(this.layerIds.rings);
            const source = this.map.getSource(this.sourceIds.rings);
            console.log('🧪 DEBUG: Layer exists?', !!layer);
            console.log('🧪 DEBUG: Source exists?', !!source);
            console.log('🧪 DEBUG: Layer visibility?', layer ? this.map.getLayoutProperty(this.layerIds.rings, 'visibility') : 'N/A');
            
            // List all layers for debugging
            const allLayers = this.map.getStyle().layers;
            console.log('🧪 DEBUG: All map layers:', allLayers.map(l => l.id));
            console.log('🧪 DEBUG: Our layer index:', allLayers.findIndex(l => l.id === this.layerIds.rings));
        }, 100);
    }
    
    /**
     * Generate weather rings for a rig
     * @private
     */
    generateWeatherRings(rig) {
        const rings = [];
        const center = [rig.longitude, rig.latitude];
        
        // Ring configuration based on cloud coverage
        const ringConfig = this.getRingConfiguration(rig);
        
        for (const ring of ringConfig) {
            const circle = this.createCircle(center, ring.radius, 64);
            
            rings.push({
                type: 'Feature',
                geometry: circle,
                properties: {
                    rigName: rig.rigName,
                    ringType: ring.type,
                    color: ring.color,
                    opacity: ring.opacity,
                    radius: ring.radius
                }
            });
        }
        
        return rings;
    }
    
    /**
     * Get ring configuration based on weather data
     * @private
     */
    getRingConfiguration(rig) {
        const rings = [];
        
        // Outer ring - Flight category/visibility color (separate from wind color)
        const visibilityColor = this.getFlightCategoryColor(rig.flightCategory);
        rings.push({
            type: 'visibility',
            radius: 2000, // meters - BIGGER to be prominent over other weather circles
            color: visibilityColor, // Ring color = visibility/flight category
            opacity: 0.9 // HIGH opacity to stand out
        });
        
        // Inner rings based on cloud coverage
        if (rig.cloudCoverage >= 75) {
            rings.push({
                type: 'clouds_heavy',
                radius: 600,
                color: '#607D8B',
                opacity: 0.3
            });
        }
        
        if (rig.cloudCoverage >= 50) {
            rings.push({
                type: 'clouds_moderate',
                radius: 400,
                color: '#90A4AE',
                opacity: 0.25
            });
        }
        
        if (rig.cloudCoverage >= 25) {
            rings.push({
                type: 'clouds_light',
                radius: 200,
                color: '#CFD8DC',
                opacity: 0.2
            });
        }
        
        return rings;
    }
    
    /**
     * Get color for flight category
     * @private
     */
    getFlightCategoryColor(category) {
        const colors = {
            'VFR': '#66BB6A',   // Green
            'MVFR': '#FFA726',  // Orange
            'IFR': '#EF5350',   // Red
            'LIFR': '#9C27B0'   // Purple
        };
        return colors[category] || '#40c8f0';
    }
    
    /**
     * Create wind arrows
     * @private
     */
    createWindArrows() {
        const arrowFeatures = [];
        
        for (const rig of this.rigWeatherData) {
            console.log(`🚁 Processing rig ${rig.rigName}: windSpeed=${rig.windSpeed}, windDirection=${rig.windDirection}`);
            if (rig.windSpeed > 0) {
                const arrow = this.generateWindArrow(rig);
                if (arrow) {
                    arrowFeatures.push(arrow);
                    console.log(`🚁 ✅ Generated arrow for ${rig.rigName}`);
                } else {
                    console.log(`🚁 ❌ Failed to generate arrow for ${rig.rigName}`);
                }
            } else {
                console.log(`🚁 ❌ No wind data for ${rig.rigName} (windSpeed: ${rig.windSpeed})`);
            }
        }
        
        if (arrowFeatures.length === 0) return;
        
        // Add source
        this.map.addSource(this.sourceIds.arrows, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: arrowFeatures
            }
        });
        
        // Add layer - insert at the TOP of the layer stack
        this.map.addLayer({
            id: this.layerIds.arrows,
            type: 'symbol',
            source: this.sourceIds.arrows,
            layout: {
                'icon-image': 'compass-rose',
                'icon-size': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    5, 0.5,   // Bigger at low zoom
                    10, 0.8,  // Bigger at mid zoom  
                    15, 1.0   // Full size at high zoom - prominent wind arrows
                ],
                'icon-rotate': ['get', 'rotation'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true
            },
            paint: {
                'icon-color': ['get', 'windColor'], // Use wind speed color for arrow
                'icon-opacity': 0.9,
                'icon-halo-color': '#000000',
                'icon-halo-width': 1
            }
        }); // No beforeId = adds to TOP of stack
        
        // Debug: Check if compass-rose image exists
        if (!this.map.hasImage('compass-rose')) {
            console.error('🚁 ❌ compass-rose image not found! Arrows will not render.');
        } else {
            console.log('🚁 ✅ compass-rose image available for arrows');
        }
        
        console.log(`🚁 Added ${arrowFeatures.length} wind arrows`);
    }
    
    /**
     * Generate compass rose wind indicator for a rig
     * Positioned at rig center like a nautical compass
     * @private
     */
    generateWindArrow(rig) {
        const windColor = this.getWindSpeedColor(rig.windSpeed);
        
        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [rig.longitude, rig.latitude] // Centered on rig
            },
            properties: {
                rigName: rig.rigName,
                windSpeed: rig.windSpeed,
                windDirection: rig.windDirection,
                windGust: rig.windGust,
                rotation: rig.windDirection,
                windColor: windColor, // Wind speed color for arrow
                // Keep both for compatibility
                color: windColor
            }
        };
    }
    
    /**
     * Get wind speed color based on thresholds
     * @private
     */
    getWindSpeedColor(windSpeed) {
        if (windSpeed >= 60) return '#D32F2F';      // Red - Dangerous
        if (windSpeed >= 40) return '#FF5722';      // Orange - High
        if (windSpeed >= 15) return '#FFC107';      // Yellow - Moderate
        return '#4CAF50';                           // Green - Light
    }
    
    /**
     * Get arrow scale based on wind speed
     * @private
     */
    getArrowScale(windSpeed) {
        if (windSpeed >= 40) return 1.2;
        if (windSpeed >= 20) return 1.0;
        if (windSpeed >= 10) return 0.8;
        return 0.6;
    }
    
    /**
     * Create hover areas for interaction
     * @private
     */
    createHoverAreas() {
        const hoverFeatures = [];
        
        for (const rig of this.rigWeatherData) {
            const hoverArea = this.createCircle([rig.longitude, rig.latitude], 1000, 32);
            
            hoverFeatures.push({
                type: 'Feature',
                geometry: hoverArea,
                properties: {
                    rigName: rig.rigName,
                    rigData: JSON.stringify(rig)
                }
            });
        }
        
        if (hoverFeatures.length === 0) return;
        
        // Add source
        this.map.addSource(this.sourceIds.hover, {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: hoverFeatures
            }
        });
        
        // Add invisible layer for hover - insert at the TOP of the layer stack
        this.map.addLayer({
            id: this.layerIds.hover,
            type: 'fill',
            source: this.sourceIds.hover,
            layout: {},
            paint: {
                'fill-opacity': 0 // Invisible
            }
        }); // No beforeId = adds to TOP of stack
        
        // Add hover events
        this.addHoverEvents();
    }
    
    /**
     * Add hover events for unified weather popup
     * @private
     */
    addHoverEvents() {
        // Remove any existing popup first
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
        
        // Create new unified popup
        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: 'rig-weather-popup unified-weather-popup',
            maxWidth: '320px'
        });
        
        // Mouse enter - show unified popup
        this.map.on('mouseenter', this.layerIds.hover, (e) => {
            this.map.getCanvas().style.cursor = 'pointer';
            
            try {
                const rigData = JSON.parse(e.features[0].properties.rigData);
                console.log('🔗 UNIFIED POPUP: Creating popup for rig:', rigData.rigName);
                
                // Create unified popup content combining TAF + Real-time data
                const unifiedContent = this.createUnifiedWeatherPopup(rigData);
                
                this.popup.setLngLat(e.lngLat)
                         .setHTML(unifiedContent)
                         .addTo(this.map);
                         
                console.log('🔗 UNIFIED POPUP: ✅ Unified popup displayed');
                
            } catch (error) {
                console.error('🔗 UNIFIED POPUP: Error creating popup:', error);
                
                // Fallback popup
                this.popup.setLngLat(e.lngLat)
                         .setHTML('<div style="color: red;">Error loading weather data</div>')
                         .addTo(this.map);
            }
        });
        
        // Mouse leave
        this.map.on('mouseleave', this.layerIds.hover, () => {
            this.map.getCanvas().style.cursor = '';
            if (this.popup) {
                this.popup.remove();
            }
        });
    }
    
    /**
     * Create unified weather popup that combines TAF + Real-time data in ONE popup
     * This eliminates the "two separate popups" issue
     * @private
     */
    createUnifiedWeatherPopup(rigData) {
        console.log('🔗 UNIFIED POPUP: Creating unified popup for rig:', rigData.rigName);
        
        const gustInfo = rigData.windGust && rigData.windGust > rigData.windSpeed ? 
            `G${Math.round(rigData.windGust)}` : '';
        
        const windString = `${Math.round(rigData.windSpeed)}${gustInfo} kts @ ${Math.round(rigData.windDirection)}°`;
        
        const categoryColor = this.getFlightCategoryColor(rigData.flightCategory);
        
        // Format arrival time if available
        let arrivalInfo = '';
        if (rigData.arrivalTime) {
            try {
                const arrivalDate = new Date(rigData.arrivalTime);
                const timeString = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateString = arrivalDate.toLocaleDateString();
                arrivalInfo = `<div><strong>Arrival:</strong> ${timeString} on ${dateString}</div>`;
            } catch (e) {
                arrivalInfo = `<div><strong>Arrival:</strong> ${rigData.arrivalTime}</div>`;
            }
        }
        
        // 🔗 SEARCH FOR EXISTING TAF DATA from multiple global sources
        let tafSection = '';
        let palantirWeather = null;
        
        try {
            // Search in multiple possible locations for weather segments
            const weatherSegmentSources = [
                window.loadedWeatherSegments,
                window.currentWeatherSegments,
                window.currentWeatherCirclesLayer?.currentWeatherSegments,
                window.weatherSegments, // Additional source
                window.currentFlightData?.weatherSegments // From flight data
            ];
            
            console.log('🔗 UNIFIED POPUP: Searching for TAF data for rig:', rigData.rigName);
            console.log('🔗 UNIFIED POPUP: Available weather segment sources:', weatherSegmentSources.map(s => s ? `${s.constructor?.name || 'Array'}(${s.length})` : 'null'));
            
            for (const segments of weatherSegmentSources) {
                if (segments && Array.isArray(segments)) {
                    console.log(`🔗 UNIFIED POPUP: Searching in source with ${segments.length} segments`);
                    
                    // Debug: log all rig segments in this source
                    const rigSegments = segments.filter(s => s.isRig === true);
                    console.log(`🔗 UNIFIED POPUP: Found ${rigSegments.length} rig segments:`, rigSegments.map(s => s.locationName || s.airportIcao || s.name));
                    
                    palantirWeather = segments.find(segment => 
                        segment.isRig === true && 
                        (segment.locationName === rigData.rigName || 
                         segment.airportIcao === rigData.rigName ||
                         segment.name === rigData.rigName ||
                         segment.uniqueId === rigData.rigName)
                    );
                    
                    if (palantirWeather) {
                        console.log('🔗 UNIFIED POPUP: ✅ Found Palantir TAF data for', rigData.rigName, 'in source with', segments.length, 'segments');
                        console.log('🔗 UNIFIED POPUP: TAF data contains:', {
                            hasRawTaf: !!palantirWeather.rawTaf,
                            hasRawMetar: !!palantirWeather.rawMetar,
                            ranking2: palantirWeather.ranking2,
                            windSpeed: palantirWeather.windSpeed,
                            airportIcao: palantirWeather.airportIcao
                        });
                        break;
                    }
                }
            }
            
            if (palantirWeather) {
                console.log('🔗 UNIFIED POPUP: Found Palantir TAF data for', rigData.rigName, palantirWeather);
                
                // Create TAF section with Palantir analysis
                const araStatus = palantirWeather.ranking2 === 8 || palantirWeather.ranking2 === 5 ? 
                    '<span style="color: #8E24AA; font-weight: bold;">⚠️ ARA Fuel Required</span>' : 
                    '<span style="color: #66BB6A; font-weight: bold;">✅ No ARA Fuel</span>';
                
                // Create detailed TAF info with full METAR/TAF data
                let tafDetails = `<div style="margin-bottom: 6px;"><strong>ARA Status:</strong> ${araStatus}</div>`;
                
                if (palantirWeather.windSpeed && palantirWeather.windDirection) {
                    tafDetails += `<div><strong>Planned Wind:</strong> ${Math.round(palantirWeather.windSpeed)} kts @ ${Math.round(palantirWeather.windDirection)}°</div>`;
                }
                
                if (palantirWeather.ranking2) {
                    tafDetails += `<div><strong>Weather Ranking:</strong> ${palantirWeather.ranking2}</div>`;
                }
                
                if (palantirWeather.visibility) {
                    tafDetails += `<div><strong>Planned Visibility:</strong> ${palantirWeather.visibility} SM</div>`;
                }
                
                // 🔗 ADD FULL TAF DATA (the complete TAF that explains why ARA fuel is required)
                if (palantirWeather.rawTaf) {
                    tafDetails += `
                        <div style="margin-top: 8px; margin-bottom: 6px;">
                            <strong style="color: #FFC107;">📋 TAF (Terminal Aerodrome Forecast):</strong><br>
                            <div style="font-family: monospace; font-size: 10px; background-color: rgba(0,0,0,0.3); padding: 4px; border-radius: 3px; word-break: break-all; line-height: 1.3; margin-top: 4px;">${palantirWeather.rawTaf}</div>
                        </div>
                    `;
                }
                
                // 🔗 ADD FULL METAR DATA  
                if (palantirWeather.rawMetar) {
                    tafDetails += `
                        <div style="margin-top: 6px; margin-bottom: 6px;">
                            <strong style="color: #FFC107;">🌦️ METAR (Current Observations):</strong><br>
                            <div style="font-family: monospace; font-size: 10px; background-color: rgba(0,0,0,0.3); padding: 4px; border-radius: 3px; word-break: break-all; line-height: 1.3; margin-top: 4px;">${palantirWeather.rawMetar}</div>
                        </div>
                    `;
                }
                        
                tafSection = `
                    <div style="margin-top: 10px; padding: 8px; background-color: rgba(255,193,7,0.15); border-radius: 6px; border-left: 3px solid #FFC107;">
                        <div style="color: #FFC107; font-weight: bold; margin-bottom: 6px; display: flex; align-items: center;">
                            📋 Flight Planning (Palantir Analysis)
                        </div>
                        <div style="font-size: 11px; color: #e0e0e0; line-height: 1.4;">
                            ${tafDetails}
                            <div style="font-size: 10px; color: #aaa; margin-top: 6px; font-style: italic; padding-top: 4px; border-top: 1px solid rgba(255,193,7,0.3);">
                                TAF/METAR data used for fuel calculations & ARA requirements
                            </div>
                        </div>
                    </div>
                `;
            } else {
                console.log('🔗 UNIFIED POPUP: No Palantir TAF data found for', rigData.rigName);
                
                // Show placeholder when no TAF data available
                tafSection = `
                    <div style="margin-top: 8px; padding: 6px; background-color: rgba(128,128,128,0.1); border-radius: 4px; border-left: 3px solid #888;">
                        <div style="color: #888; font-weight: bold; margin-bottom: 4px;">📋 Flight Planning</div>
                        <div style="font-size: 11px; color: #aaa;">
                            <div>No TAF data available for planning</div>
                        </div>
                    </div>
                `;
            }
        } catch (error) {
            console.warn('🔗 UNIFIED POPUP: Error searching for TAF data:', error);
        }
        
        // ✅ PHASE 1.4: Show accurate timing information with data freshness
        let weatherTimeInfo = '';
        if (rigData.weatherTimeInfo) {
            // Use the time info from the weather data
            weatherTimeInfo = `<div style="font-size: 10px; color: #4CAF50; margin-top: 4px;">📅 ${rigData.weatherTimeInfo}</div>`;
        } else if (rigData.arrivalTime) {
            const arrivalTimeString = new Date(rigData.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            weatherTimeInfo = `<div style="font-size: 10px; color: #4CAF50; margin-top: 4px;">📅 Weather for ${arrivalTimeString} arrival</div>`;
        } else {
            weatherTimeInfo = '<div style="font-size: 10px; color: #FFC107; margin-top: 4px;">⏰ Current weather conditions</div>';
        }
        
        // Add data freshness indicator
        if (rigData.dataFreshness) {
            const fetchTime = new Date(rigData.dataFreshness);
            const minutesAgo = Math.round((new Date() - fetchTime) / 60000);
            const freshnessText = minutesAgo < 1 ? 'just now' : `${minutesAgo} min${minutesAgo > 1 ? 's' : ''} ago`;
            weatherTimeInfo += `<div style="font-size: 9px; color: #888; margin-top: 2px;">Updated ${freshnessText}</div>`;
        }
        
        // Determine warning level based on conditions
        const hasWarnings = rigData.limitations || rigData.warnings || rigData.flightCategory === 'LIFR' || rigData.flightCategory === 'IFR';
        const warningStyle = hasWarnings ? 'border-left: 3px solid #FF5722;' : 'border-left: 3px solid #40c8f0;';
        
        return `
            <div style="padding: 10px; max-width: 340px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <div style="font-weight: bold; color: #40c8f0; margin-bottom: 8px; font-size: 14px;">
                    🚁 ${rigData.rigName} - Comprehensive Weather
                </div>
                
                <!-- REAL-TIME WEATHER SECTION -->
                <div style="margin-bottom: 10px; padding: 8px; background-color: rgba(64, 200, 240, 0.1); border-radius: 6px; ${warningStyle}">
                    <div style="color: #40c8f0; font-weight: bold; margin-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                        <span>🌦️ ${rigData.weatherTimeInfo || (rigData.arrivalTime ? `Weather for ${new Date(rigData.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} arrival` : 'Live Weather')} (NOAA GFS)</span>
                        ${hasWarnings ? '<span style="color: #FF5722; margin-left: 8px;">⚠️</span>' : ''}
                    </div>
                    <div style="font-size: 12px; color: #e0e0e0; line-height: 1.4;">
                        ${arrivalInfo}
                        <div style="margin-bottom: 4px; display: flex; align-items: center;">
                            <strong>Flight Category:</strong> 
                            <span style="color: ${categoryColor}; font-weight: bold; margin-left: 6px; padding: 2px 6px; border-radius: 3px; background-color: rgba(${categoryColor === '#66BB6A' ? '102,187,106' : categoryColor === '#FFA726' ? '255,167,38' : categoryColor === '#EF5350' ? '239,83,80' : '156,39,176'}, 0.2);">${rigData.flightCategory || 'Unknown'}</span>
                        </div>
                        ${rigData.ceiling ? `<div><strong>Ceiling:</strong> ${rigData.ceiling.toLocaleString()} ft AGL</div>` : '<div><strong>Ceiling:</strong> Unlimited</div>'}
                        <div><strong>Visibility:</strong> ${rigData.visibility || 'Unknown'} SM</div>
                        <div><strong>Wind:</strong> ${windString}</div>
                        <div><strong>Clouds:</strong> ${rigData.cloudCoverage || 0}%</div>
                        <div><strong>Temperature:</strong> ${rigData.temperature ? Math.round(rigData.temperature) + '°F' : 'Unknown'}</div>
                        ${rigData.conditions ? `<div><strong>Conditions:</strong> ${rigData.conditions}</div>` : ''}
                        ${rigData.limitations ? `<div style="color: #FF5722; font-weight: bold; margin-top: 4px;"><strong>⚠️ Limitations:</strong> ${rigData.limitations}</div>` : ''}
                        ${rigData.warnings ? `<div style="color: #F44336; font-weight: bold; margin-top: 4px;"><strong>🚨 Warnings:</strong> ${rigData.warnings}</div>` : ''}
                        ${weatherTimeInfo}
                    </div>
                </div>
                
                <!-- FLIGHT PLANNING TAF SECTION -->
                ${tafSection}
                
                <div style="font-size: 9px; color: #666; margin-top: 8px; text-align: center; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1);">
                    Real-time: ${rigData.stationId || 'Open-Meteo NOAA GFS'} | Flight Planning: Palantir Analysis
                </div>
            </div>
        `;
    }
    
    /**
     * Legacy method - now redirects to unified popup
     * @private
     */
    createWeatherPopupContent(rigData) {
        return this.createUnifiedWeatherPopup(rigData);
    }
    
    /**
     * Create circle geometry as LineString for rings (not filled circles)
     * @private
     */
    createCircle(center, radiusInMeters, points = 64) {
        const coords = [];
        const distanceX = radiusInMeters / (111000 * Math.cos(center[1] * Math.PI / 180));
        const distanceY = radiusInMeters / 111000;
        
        for (let i = 0; i <= points; i++) {
            const theta = (i / points) * (2 * Math.PI);
            const x = distanceX * Math.cos(theta);
            const y = distanceY * Math.sin(theta);
            coords.push([center[0] + x, center[1] + y]);
        }
        
        return {
            type: 'LineString',
            coordinates: coords
        };
    }
    
    /**
     * Remove all weather graphics
     * @private
     */
    removeWeatherGraphics() {
        // Remove event listeners
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }
        
        if (this.map.getLayer(this.layerIds.hover)) {
            this.map.off('mouseenter', this.layerIds.hover);
            this.map.off('mouseleave', this.layerIds.hover);
        }
        
        // Remove layers
        Object.values(this.layerIds).forEach(layerId => {
            if (this.map.getLayer(layerId)) {
                this.map.removeLayer(layerId);
            }
        });
        
        // Remove sources
        Object.values(this.sourceIds).forEach(sourceId => {
            if (this.map.getSource(sourceId)) {
                this.map.removeSource(sourceId);
            }
        });
        
        console.log('🚁 Removed all rig weather graphics');
    }
    
    /**
     * Use real rig positions from flight data
     * Connect to actual flight waypoints/segments
     */
    useRealRigPositions() {
        console.log('🧭 Attempting to use real rig positions from flight data...');
        
        // Try to get real rig positions from various sources
        const rigPositions = this.extractRigPositions();
        
        if (rigPositions.length > 0) {
            console.log(`🧭 Found ${rigPositions.length} real rig positions:`, rigPositions.map(r => r.rigName));
            
            // Create weather data for real rigs
            const realRigWeatherData = rigPositions.map(rig => ({
                rigName: rig.rigName,
                latitude: rig.latitude,
                longitude: rig.longitude,
                
                // Use mock weather data for now (will be replaced with real API calls)
                flightCategory: this.mockFlightCategory(),
                ceiling: this.mockCeiling(),
                visibility: this.mockVisibility(),
                cloudCoverage: this.mockCloudCoverage(),
                windSpeed: this.mockWindSpeed(),
                windDirection: this.mockWindDirection(),
                windGust: this.mockWindGust(),
                temperature: this.mockTemperature(),
                conditions: this.mockConditions(),
                stationId: rig.rigName
            }));
            
            console.log('🧭 Created weather data for real rigs:', realRigWeatherData);
            
            // Update graphics with real data
            this.updateRigWeather(realRigWeatherData);
            this.toggleVisibility(true);
            
            return realRigWeatherData;
        } else {
            console.warn('🧭 No real rig positions found, falling back to test graphics');
            return this.testStaticGraphics();
        }
    }
    
    /**
     * Extract real rig positions from various data sources
     * @private
     */
    extractRigPositions() {
        const rigPositions = [];
        
        // Debug: Log all available data sources
        console.log('🧭 DEBUG: Available data sources:');
        console.log('🧭 window.currentWaypoints:', !!window.currentWaypoints, window.currentWaypoints?.length);
        console.log('🧭 window.currentWeatherCirclesLayer:', !!window.currentWeatherCirclesLayer);
        console.log('🧭 window.currentWeatherSegments:', !!window.currentWeatherSegments, window.currentWeatherSegments?.length);
        console.log('🧭 window.platformManager:', !!window.platformManager);
        
        // Debug weather circles layer structure
        if (window.currentWeatherCirclesLayer) {
            console.log('🧭 Weather circles layer properties:', Object.keys(window.currentWeatherCirclesLayer));
        }
        
        // Method 1: Try to get from current flight waypoints (ENHANCED with rig name matching)
        if (window.currentWaypoints && window.currentWaypoints.length > 0) {
            console.log('🧭 Current waypoints available:', window.currentWaypoints.length);
            
            // First, try exact waypoint matching for rigs
            window.currentWaypoints.forEach(wp => {
                if (this.isRigWaypoint(wp)) {
                    const lat = wp.coords?.[1] || wp.lat || wp.latitude;
                    const lng = wp.coords?.[0] || wp.lng || wp.longitude;
                    
                    if (lat && lng) {
                        rigPositions.push({
                            rigName: wp.name,
                            latitude: lat,
                            longitude: lng,
                            source: 'currentWaypoints'
                        });
                        console.log('🧭 ✅ Added rig from waypoints:', wp.name, 'at', lat, lng);
                    }
                }
            });
            
            // ENHANCED: Also try to match weather segment rig names to waypoint names
            if (window.currentWeatherCirclesLayer?.currentWeatherSegments) {
                const weatherSegments = window.currentWeatherCirclesLayer.currentWeatherSegments;
                weatherSegments.forEach(segment => {
                    if (segment.isRig === true && segment.airportIcao) {
                        // Try to find a waypoint that matches this rig's airportIcao
                        const matchingWaypoint = window.currentWaypoints.find(wp => 
                            wp.name === segment.airportIcao || 
                            wp.name?.includes(segment.airportIcao) ||
                            segment.airportIcao?.includes(wp.name)
                        );
                        
                        if (matchingWaypoint) {
                            const lat = matchingWaypoint.coords?.[1] || matchingWaypoint.lat || matchingWaypoint.latitude;
                            const lng = matchingWaypoint.coords?.[0] || matchingWaypoint.lng || matchingWaypoint.longitude;
                            
                            if (lat && lng) {
                                // Check if we already added this rig
                                const alreadyAdded = rigPositions.find(r => r.rigName === segment.airportIcao);
                                if (!alreadyAdded) {
                                    rigPositions.push({
                                        rigName: segment.airportIcao,
                                        latitude: lat,
                                        longitude: lng,
                                        source: 'waypointMatching'
                                    });
                                    console.log('🧭 ✅ Matched weather rig to waypoint:', segment.airportIcao, '→', matchingWaypoint.name, 'at', lat, lng);
                                }
                            }
                        } else {
                            console.log('🧭 ❌ No waypoint match found for rig:', segment.airportIcao);
                        }
                    }
                });
            }
        }
        
        // Method 2: Try to get from weather circles currentWeatherSegments (this is where the data is!)
        if (rigPositions.length === 0 && window.currentWeatherCirclesLayer && window.currentWeatherCirclesLayer.currentWeatherSegments) {
            try {
                const weatherSegments = window.currentWeatherCirclesLayer.currentWeatherSegments;
                console.log('🧭 Found weather segments in circles layer:', weatherSegments.length, 'segments');
                
                weatherSegments.forEach(segment => {
                    // Debug each segment to see the full structure
                    console.log('🧭 Full segment object for', segment.name || segment.locationName || segment.uniqueId, ':', segment);
                    
                    if (segment.isRig === true) {
                        const rigName = segment.airportIcao || segment.locationName || segment.name || segment.uniqueId;
                        console.log('🧭 Found rig segment:', rigName);
                        console.log('🧭 All properties:', Object.keys(segment));
                        
                        // Try direct coordinate properties first
                        let lat = segment.latitude || segment.lat || segment.geoPoint?.latitude || segment.coordinates?.lat || segment.coord?.lat;
                        let lng = segment.longitude || segment.lng || segment.lon || segment.geoPoint?.longitude || segment.coordinates?.lng || segment.coord?.lng;
                        
                        console.log('🧭 Direct coordinate search results:', { lat, lng });
                        
                        // If no direct coordinates, try to look up from platform manager using airportIcao
                        if ((!lat || !lng) && segment.airportIcao && window.platformManager) {
                            console.log('🧭 Looking up coordinates from platform manager for:', segment.airportIcao);
                            try {
                                const platforms = window.platformManager.getCurrentPlatforms();
                                if (platforms && platforms.length > 0) {
                                    // Find platform by matching the airportIcao to platform name/id
                                    const platform = platforms.find(p => 
                                        p.name === segment.airportIcao || 
                                        p.id === segment.airportIcao ||
                                        p.identifier === segment.airportIcao
                                    );
                                    
                                    if (platform) {
                                        lat = platform.latitude || platform.lat;
                                        lng = platform.longitude || platform.lng || platform.lon;
                                        console.log('🧭 ✅ Found platform coordinates for', segment.airportIcao, ':', { lat, lng });
                                    } else {
                                        console.log('🧭 ❌ Platform not found for:', segment.airportIcao);
                                    }
                                }
                            } catch (error) {
                                console.warn('🧭 Error looking up platform coordinates:', error.message);
                            }
                        }
                        
                        if (lat && lng) {
                            rigPositions.push({
                                rigName: rigName,
                                latitude: lat,
                                longitude: lng,
                                source: 'weatherCirclesSegments'
                            });
                            console.log('🧭 ✅ Added rig:', rigName, 'at', lat, lng);
                        } else {
                            console.log('🧭 ❌ Rig found but no coordinates available:', rigName);
                        }
                    }
                });
            } catch (error) {
                console.warn('🧭 Could not extract from weather circles segments:', error.message);
            }
        }
        
        // Method 3: Try to get from weather segments
        if (rigPositions.length === 0 && window.currentWeatherSegments) {
            window.currentWeatherSegments.forEach(segment => {
                if (segment.isRig === true) {
                    rigPositions.push({
                        rigName: segment.locationName || segment.name || segment.airportIcao,
                        latitude: segment.latitude || segment.lat,
                        longitude: segment.longitude || segment.lng || segment.lon,
                        source: 'weatherSegments'
                    });
                }
            });
        }
        
        // Method 3: Try to get from platform manager
        if (rigPositions.length === 0 && window.platformManager) {
            try {
                const platforms = window.platformManager.getCurrentPlatforms();
                if (platforms && platforms.length > 0) {
                    platforms.forEach(platform => {
                        if (platform.latitude && platform.longitude) {
                            rigPositions.push({
                                rigName: platform.name || platform.id,
                                latitude: platform.latitude,
                                longitude: platform.longitude,
                                source: 'platformManager'
                            });
                        }
                    });
                }
            } catch (error) {
                console.warn('🧭 Could not get platforms from platformManager:', error.message);
            }
        }
        
        console.log(`🧭 Extracted ${rigPositions.length} rig positions from various sources`);
        return rigPositions;
    }
    
    /**
     * Check if waypoint is a rig/platform (not an airport)
     * Uses the definitive isAirport property from location objects
     * @private
     */
    isRigWaypoint(wp) {
        // Method 1: Explicit rig marking (from flight plans with weather segments)
        if (wp.isRig === true) {
            return true;
        }
        
        // Method 2: Check if it's NOT an airport using isairport string property
        // isairport can be "Y", "yes", "Yes", "YES" for airports
        if (wp.hasOwnProperty('isairport') || wp.hasOwnProperty('isAirport')) {
            const airportValue = wp.isairport || wp.isAirport;
            const isAirport = airportValue && 
                (airportValue.toString().toLowerCase() === 'y' || 
                 airportValue.toString().toLowerCase() === 'yes');
            
            // Include BOTH airports and rigs
            console.log(`🌬️ Including ${isAirport ? 'airport' : 'rig'}:`, wp.name, 'isairport:', airportValue);
            return true; // Include both airports and rigs
        }
        
        // Method 3: Include ALL landing stops (airports AND rigs)
        if (wp.type === 'LANDING_STOP' && wp.pointType === 'LANDING_STOP') {
            console.log(`🌬️ Including landing stop: ${wp.name}`);
            return true; // Include both airports and rigs
        }
        
        // Method 4: If we're in waypoint mode, skip waypoints
        if (wp.isWaypoint === true || wp.type === 'WAYPOINT') {
            return false;
        }
        
        // Default: assume it's a rig if it's not explicitly an airport
        console.log('🧭 Assuming rig/platform for location:', wp.name);
        return true;
    }
    
    // Mock weather data generators (to be replaced with real API calls)
    mockFlightCategory() {
        const categories = ['VFR', 'MVFR', 'IFR', 'LIFR'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    mockCeiling() {
        return Math.floor(Math.random() * 10000) + 500;
    }
    
    mockVisibility() {
        return Math.floor(Math.random() * 10) + 1;
    }
    
    mockCloudCoverage() {
        return Math.floor(Math.random() * 100);
    }
    
    mockWindSpeed() {
        return Math.floor(Math.random() * 40) + 5;
    }
    
    mockWindDirection() {
        return Math.floor(Math.random() * 360);
    }
    
    mockWindGust() {
        return Math.random() > 0.5 ? null : Math.floor(Math.random() * 20) + 25;
    }
    
    mockTemperature() {
        return Math.floor(Math.random() * 40) + 50;
    }
    
    mockConditions() {
        const conditions = ['Clear', 'Partly Cloudy', 'Overcast', 'Light Rain', 'Fog'];
        return conditions[Math.floor(Math.random() * conditions.length)];
    }
    
    /**
     * Test static graphics with known coordinates
     * User suggested testing with static coordinates to isolate the issue
     */
    testStaticGraphics() {
        console.log('🧪 Testing static rig weather graphics...');
        
        // Remove any existing graphics first
        this.removeWeatherGraphics();
        
        // Create test data with visible Gulf of Mexico coordinates
        const testRigData = [
            {
                rigName: 'TEST_RIG_1',
                latitude: 28.5,
                longitude: -90.0,
                flightCategory: 'VFR',
                ceiling: 5000,
                visibility: 10,
                cloudCoverage: 25,
                windSpeed: 15,
                windDirection: 270,
                windGust: null,
                temperature: 75,
                conditions: 'Clear',
                stationId: 'TEST1'
            },
            {
                rigName: 'TEST_RIG_2', 
                latitude: 29.0,
                longitude: -89.5,
                flightCategory: 'MVFR',
                ceiling: 2500,
                visibility: 5,
                cloudCoverage: 75,
                windSpeed: 25,
                windDirection: 180,
                windGust: 35,
                temperature: 68,
                conditions: 'Overcast',
                stationId: 'TEST2'
            }
        ];
        
        console.log('🧪 Test data created:', testRigData);
        
        // Update graphics with test data
        this.updateRigWeather(testRigData);
        
        // Force visibility
        this.toggleVisibility(true);
        
        console.log('🧪 Static test graphics should now be visible on the map');
        console.log('🧪 Look for circles around coordinates:');
        console.log('🧪 - TEST_RIG_1: 28.5, -90.0 (VFR - Green)');
        console.log('🧪 - TEST_RIG_2: 29.0, -89.5 (MVFR - Orange)');
        
        return testRigData;
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.removeWeatherGraphics();
        this.rigWeatherData = [];
        console.log('🚁 RigWeatherGraphics destroyed');
    }
}

export default RigWeatherGraphics;