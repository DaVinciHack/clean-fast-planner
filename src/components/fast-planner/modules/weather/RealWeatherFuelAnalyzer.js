/**
 * RealWeatherFuelAnalyzer.js
 * 
 * Uses REAL external API weather data to determine ARA and approach fuel requirements
 * Replaces the pseudo-TAF system with actual aviation weather from AWC/Open-Meteo
 * 
 * Aviation Safety: NO dummy data - only real weather for fuel calculations
 */

class RealWeatherFuelAnalyzer {
    constructor(weatherVisualizationManager) {
        this.weatherManager = weatherVisualizationManager;
        
        console.log('🌦️ FUEL: RealWeatherFuelAnalyzer initialized with external API weather');
    }
    
    /**
     * Analyze real weather for fuel requirements (replaces pseudo-TAF analysis)
     * @param {Array} waypoints - Flight waypoints (rigs and airports)
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Real weather-based fuel requirements
     */
    async analyzeRealWeatherForFuel(waypoints, options = {}) {
        console.log('🌦️ FUEL: Starting REAL weather analysis for fuel calculations');
        console.log('🌦️ FUEL: Waypoints to analyze:', waypoints?.length || 0);
        
        if (!waypoints || waypoints.length === 0) {
            console.warn('🌦️ FUEL: No waypoints provided for weather analysis');
            return { araFuel: 0, approachFuel: 0, weatherData: [] };
        }
        
        const weatherAnalysisResults = [];
        let totalAraFuel = 0;
        let totalApproachFuel = 0;
        
        try {
            // Get real weather for each waypoint
            for (const waypoint of waypoints) {
                const waypointAnalysis = await this.analyzeWaypointWeather(waypoint, options);
                
                if (waypointAnalysis) {
                    weatherAnalysisResults.push(waypointAnalysis);
                    
                    // Add to fuel totals
                    totalAraFuel += waypointAnalysis.araFuelRequired || 0;
                    totalApproachFuel += waypointAnalysis.approachFuelRequired || 0;
                }
            }
            
            const fuelAnalysis = {
                araFuel: Math.round(totalAraFuel),
                approachFuel: Math.round(totalApproachFuel),
                weatherData: weatherAnalysisResults,
                dataSource: 'REAL_EXTERNAL_APIS',
                analysisTime: new Date().toISOString()
            };
            
            console.log('🌦️ FUEL: ✅ Real weather fuel analysis complete:', {
                totalAraFuel: fuelAnalysis.araFuel,
                totalApproachFuel: fuelAnalysis.approachFuel,
                analyzedLocations: weatherAnalysisResults.length,
                dataSource: fuelAnalysis.dataSource
            });
            
            return fuelAnalysis;
            
        } catch (error) {
            console.error('🌦️ FUEL: Real weather analysis failed:', error.message);
            
            // Return safe fallback (no additional fuel)
            return {
                araFuel: 0,
                approachFuel: 0,
                weatherData: [],
                dataSource: 'ANALYSIS_ERROR',
                error: error.message
            };
        }
    }
    
    /**
     * Analyze real weather for a specific waypoint
     * @param {Object} waypoint - Waypoint to analyze
     * @param {Object} options - Analysis options
     * @returns {Promise<Object>} Weather analysis for this waypoint
     */
    async analyzeWaypointWeather(waypoint, options = {}) {
        try {
            // Get coordinates
            const latitude = waypoint.coords?.[1] || waypoint.lat || waypoint.latitude;
            const longitude = waypoint.coords?.[0] || waypoint.lng || waypoint.longitude;
            
            if (!latitude || !longitude) {
                console.warn(`🌦️ FUEL: No coordinates for waypoint ${waypoint.name}`);
                return null;
            }
            
            console.log(`🌦️ FUEL: Getting real weather for ${waypoint.name} at ${latitude}, ${longitude}`);
            
            // Get REAL weather from external APIs
            const realWeather = await this.weatherManager.fetchAviationWeather(latitude, longitude);
            
            if (!realWeather) {
                console.warn(`🌦️ FUEL: No real weather available for ${waypoint.name}`);
                return null;
            }
            
            // Determine if this is a rig or airport
            const isRig = this.isRigWaypoint(waypoint);
            const isAirport = !isRig;
            
            console.log(`🌦️ FUEL: ${waypoint.name} classified as ${isRig ? 'RIG' : 'AIRPORT'}`);
            console.log(`🌦️ FUEL: Real weather data:`, {
                station: realWeather.stationId,
                flightCategory: realWeather.flightCategory,
                ceiling: realWeather.ceiling,
                visibility: realWeather.visibility,
                wind: `${realWeather.windSpeed}@${realWeather.windDirection}°`,
                source: realWeather.dataSource
            });
            
            // Analyze fuel requirements based on REAL weather
            const fuelRequirements = this.calculateFuelRequirements(realWeather, isRig, isAirport, waypoint);
            
            return {
                waypointName: waypoint.name,
                waypointType: isRig ? 'RIG' : 'AIRPORT',
                coordinates: { latitude, longitude },
                realWeatherData: realWeather,
                araFuelRequired: fuelRequirements.araFuel,
                approachFuelRequired: fuelRequirements.approachFuel,
                weatherReasoning: fuelRequirements.reasoning,
                flightCategory: realWeather.flightCategory,
                dataSource: realWeather.dataSource
            };
            
        } catch (error) {
            console.error(`🌦️ FUEL: Weather analysis failed for ${waypoint.name}:`, error.message);
            return null;
        }
    }
    
    /**
     * Calculate fuel requirements based on real weather conditions
     * @param {Object} realWeather - Real weather data from external APIs
     * @param {boolean} isRig - Whether this is a rig
     * @param {boolean} isAirport - Whether this is an airport
     * @param {Object} waypoint - Waypoint info
     * @returns {Object} Fuel requirements
     */
    calculateFuelRequirements(realWeather, isRig, isAirport, waypoint) {
        let araFuel = 0;
        let approachFuel = 0;
        let reasoning = [];
        
        const flightCategory = realWeather.flightCategory;
        const ceiling = realWeather.ceiling;
        const visibility = realWeather.visibility;
        const windSpeed = realWeather.windSpeed;
        
        // ARA FUEL: Required for rigs with poor weather conditions
        if (isRig) {
            // IFR/LIFR conditions require ARA fuel for rig approaches
            if (flightCategory === 'LIFR') {
                araFuel = 200; // Low IFR conditions - high ARA fuel
                reasoning.push(`LIFR conditions at ${waypoint.name} - 200lbs ARA fuel required`);
            } else if (flightCategory === 'IFR') {
                araFuel = 150; // IFR conditions - moderate ARA fuel
                reasoning.push(`IFR conditions at ${waypoint.name} - 150lbs ARA fuel required`);
            } else if (flightCategory === 'MVFR') {
                araFuel = 75; // Marginal VFR - some ARA fuel as precaution
                reasoning.push(`MVFR conditions at ${waypoint.name} - 75lbs ARA fuel as precaution`);
            }
            
            // High winds require additional ARA fuel for rig approaches
            if (windSpeed >= 25) {
                const windAraFuel = 50;
                araFuel += windAraFuel;
                reasoning.push(`High winds (${windSpeed}kts) at ${waypoint.name} - additional ${windAraFuel}lbs ARA fuel`);
            }
        }
        
        // APPROACH FUEL: Required for airports with poor weather conditions
        if (isAirport) {
            // IFR/LIFR conditions require approach fuel for airports
            if (flightCategory === 'LIFR') {
                approachFuel = 100; // Low IFR - multiple approach attempts possible
                reasoning.push(`LIFR conditions at ${waypoint.name} - 100lbs approach fuel required`);
            } else if (flightCategory === 'IFR') {
                approachFuel = 75; // IFR - instrument approach required
                reasoning.push(`IFR conditions at ${waypoint.name} - 75lbs approach fuel required`);
            } else if (flightCategory === 'MVFR') {
                approachFuel = 50; // Marginal VFR - possible approach complications
                reasoning.push(`MVFR conditions at ${waypoint.name} - 50lbs approach fuel as precaution`);
            }
            
            // Low ceiling requires additional approach fuel
            if (ceiling && ceiling < 1000) {
                const ceilingApproachFuel = 25;
                approachFuel += ceilingApproachFuel;
                reasoning.push(`Low ceiling (${ceiling}ft) at ${waypoint.name} - additional ${ceilingApproachFuel}lbs approach fuel`);
            }
        }
        
        if (araFuel === 0 && approachFuel === 0) {
            reasoning.push(`Good weather conditions at ${waypoint.name} - no additional fuel required`);
        }
        
        console.log(`🌦️ FUEL: ${waypoint.name} fuel requirements:`, {
            araFuel,
            approachFuel,
            reasoning: reasoning.join('; ')
        });
        
        return {
            araFuel,
            approachFuel,
            reasoning: reasoning.join('; ')
        };
    }
    
    /**
     * Determine if waypoint is a rig (not an airport)
     * @param {Object} waypoint - Waypoint to check
     * @returns {boolean} True if rig, false if airport
     */
    isRigWaypoint(waypoint) {
        // Method 1: Explicit rig marking
        if (waypoint.isRig === true) {
            return true;
        }
        
        // Method 2: Check isairport property (string: "Y"/"yes" = airport)
        if (waypoint.hasOwnProperty('isairport') || waypoint.hasOwnProperty('isAirport')) {
            const airportValue = waypoint.isairport || waypoint.isAirport;
            const isAirport = airportValue && 
                (airportValue.toString().toLowerCase() === 'y' || 
                 airportValue.toString().toLowerCase() === 'yes');
            return !isAirport; // If not airport, then it's a rig
        }
        
        // Method 3: Type-based detection
        if (waypoint.type === 'LANDING_STOP' && waypoint.pointType === 'LANDING_STOP' && !waypoint.name?.startsWith('K')) {
            return true;
        }
        
        // Method 4: Skip navigation waypoints
        if (waypoint.isWaypoint === true || waypoint.type === 'WAYPOINT') {
            return false;
        }
        
        // Default: assume it's a rig if not explicitly an airport
        return true;
    }
    
    /**
     * Convert real weather analysis to weather segments format for compatibility
     * @param {Array} weatherData - Real weather analysis results
     * @returns {Array} Weather segments compatible with existing system
     */
    convertToWeatherSegments(weatherData) {
        console.log('🌦️ FUEL: Converting real weather to segments format for compatibility');
        
        return weatherData.map(analysis => ({
            // Location info
            locationName: analysis.waypointName,
            name: analysis.waypointName,
            airportIcao: analysis.waypointName,
            isRig: analysis.waypointType === 'RIG',
            
            // Real weather data
            flightCategory: analysis.realWeatherData.flightCategory,
            ceiling: analysis.realWeatherData.ceiling,
            visibility: analysis.realWeatherData.visibility,
            windSpeed: analysis.realWeatherData.windSpeed,
            windDirection: analysis.realWeatherData.windDirection,
            windGust: analysis.realWeatherData.windGust,
            temperature: analysis.realWeatherData.temperature,
            conditions: analysis.realWeatherData.conditions,
            
            // Fuel requirements
            araFuelRequired: analysis.araFuelRequired,
            approachFuelRequired: analysis.approachFuelRequired,
            weatherReasoning: analysis.weatherReasoning,
            
            // Metadata
            dataSource: 'REAL_EXTERNAL_WEATHER_API',
            stationId: analysis.realWeatherData.stationId,
            observationTime: analysis.realWeatherData.observationTime,
            rawMetar: analysis.realWeatherData.rawMetar,
            
            // Coordinates
            latitude: analysis.coordinates.latitude,
            longitude: analysis.coordinates.longitude,
            
            // Compatibility fields
            ranking2: this.convertFlightCategoryToRanking(analysis.realWeatherData.flightCategory),
            weatherSource: analysis.realWeatherData.dataSource,
            timestamp: new Date().toISOString()
        }));
    }
    
    /**
     * Convert flight category to ranking for compatibility
     * @param {string} flightCategory - Flight category (VFR, MVFR, IFR, LIFR)
     * @returns {number} Ranking number
     */
    convertFlightCategoryToRanking(flightCategory) {
        switch (flightCategory) {
            case 'VFR': return 15;   // Good conditions
            case 'MVFR': return 10;  // Marginal conditions
            case 'IFR': return 8;    // Instrument conditions
            case 'LIFR': return 5;   // Low instrument conditions
            default: return 20;      // Unknown/clear
        }
    }
}

export default RealWeatherFuelAnalyzer;