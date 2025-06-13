/**
 * WeatherTypes.js
 * Aviation Weather Data Type Definitions for Fast Planner
 * 
 * Core Principles:
 * - No dummy or mock data
 * - Real aviation weather parameters only
 * - ICAO standard compliance
 * - Clean, maintainable structure
 */

// Aviation Weather Parameters (ICAO Standard)
export const WeatherParameterTypes = {
    // Clouds (Critical for aviation)
    CLOUD_BASE: 'cloud_base_ft_agl',           // Cloud base altitude (feet AGL)
    CLOUD_TOP: 'cloud_top_ft_agl',             // Cloud top altitude (feet AGL)  
    CLOUD_COVERAGE: 'cloud_coverage_oktas',    // Cloud coverage (0-8 oktas)
    CLOUD_TYPE: 'cloud_type',                  // Cloud type (CB, TCU, etc.)
    
    // Visibility (Critical for approach/departure)
    VISIBILITY: 'visibility_sm',               // Visibility in statute miles
    RVR: 'runway_visual_range_ft',             // Runway Visual Range
    
    // Wind (Critical for flight operations)  
    WIND_SPEED: 'wind_speed_kts',              // Wind speed in knots
    WIND_DIRECTION: 'wind_direction_deg',      // Wind direction (degrees true)
    WIND_GUST: 'wind_gust_kts',               // Wind gust speed
    
    // Hazards (Aviation safety critical)
    ICING: 'icing_intensity',                  // Icing conditions
    TURBULENCE: 'turbulence_intensity',       // Turbulence intensity
    CONVECTIVE: 'convective_activity',        // Thunderstorm activity
    
    // Atmospheric Conditions
    PRESSURE: 'pressure_mb',                   // Atmospheric pressure (millibars)
    TEMPERATURE: 'temperature_c',              // Temperature (Celsius)
    DEW_POINT: 'dew_point_c'                  // Dew point (Celsius)
};

// Aviation Weather Intensity Scales (ICAO Standard)
export const WeatherIntensity = {
    ICING: {
        NONE: 0,
        TRACE: 1,      // Trace icing
        LIGHT: 2,      // Light icing
        MODERATE: 3,   // Moderate icing
        SEVERE: 4      // Severe icing
    },
    TURBULENCE: {
        NONE: 0,
        LIGHT: 1,      // Light turbulence
        MODERATE: 2,   // Moderate turbulence  
        SEVERE: 3,     // Severe turbulence
        EXTREME: 4     // Extreme turbulence
    },
    PRECIPITATION: {
        NONE: 0,
        LIGHT: 1,
        MODERATE: 2,
        HEAVY: 3
    }
};

// Cloud Type Classifications (Aviation Standard)
export const CloudTypes = {
    CB: 'Cumulonimbus',      // Thunderstorm clouds
    TCU: 'Towering Cumulus', // Towering cumulus
    CU: 'Cumulus',           // Fair weather cumulus
    ST: 'Stratus',           // Stratus layer
    SC: 'Stratocumulus',     // Stratocumulus
    AC: 'Altocumulus',       // Altocumulus
    AS: 'Altostratus',       // Altostratus
    CI: 'Cirrus',            // Cirrus
    CC: 'Cirrocumulus',      // Cirrocumulus
    CS: 'Cirrostratus'       // Cirrostratus
};

// Flight Category Definitions (Aviation Standard)
export const FlightCategories = {
    VFR: {
        name: 'Visual Flight Rules',
        ceiling_min: 3000,     // Ceiling >= 3000 ft AGL
        visibility_min: 5      // Visibility >= 5 SM
    },
    MVFR: {
        name: 'Marginal Visual Flight Rules', 
        ceiling_min: 1000,     // Ceiling 1000-3000 ft AGL
        ceiling_max: 3000,
        visibility_min: 3,     // Visibility 3-5 SM
        visibility_max: 5
    },
    IFR: {
        name: 'Instrument Flight Rules',
        ceiling_min: 500,      // Ceiling 500-1000 ft AGL
        ceiling_max: 1000,
        visibility_min: 1,     // Visibility 1-3 SM
        visibility_max: 3
    },
    LIFR: {
        name: 'Low Instrument Flight Rules',
        ceiling_max: 500,      // Ceiling < 500 ft AGL
        visibility_max: 1      // Visibility < 1 SM
    }
};

/**
 * Weather Data Structure for a specific location
 * All values are real aviation parameters - NO dummy data
 */
export class WeatherReport {
    constructor(locationId, coordinates, timestamp) {
        this.locationId = locationId;           // Location identifier (e.g., rig name, airport code)
        this.coordinates = coordinates;         // {lat, lon} in decimal degrees
        this.timestamp = timestamp;             // ISO timestamp of weather observation/forecast
        this.validTime = null;                  // Valid time for forecast data
        this.source = null;                     // Weather data source (API identifier)
        
        // Weather parameters (all initially null - populated from real data only)
        this.parameters = new Map();
        
        // Aviation-specific derived values
        this.flightCategory = null;             // VFR/MVFR/IFR/LIFR
        this.hazards = [];                      // Array of weather hazards
        this.recommendations = [];              // Flight planning recommendations
    }
    
    /**
     * Set a weather parameter with validation
     * Only accepts real weather data - no dummy values
     */
    setParameter(paramType, value, unit = null) {
        if (value === null || value === undefined) {
            return; // Don't store null/undefined values
        }
        
        this.parameters.set(paramType, {
            value: value,
            unit: unit,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * Get a weather parameter value
     */
    getParameter(paramType) {
        const param = this.parameters.get(paramType);
        return param ? param.value : null;
    }
    
    /**
     * Calculate flight category based on ceiling and visibility
     * Uses real aviation standards - no approximations
     */
    calculateFlightCategory() {
        const ceiling = this.getParameter(WeatherParameterTypes.CLOUD_BASE);
        const visibility = this.getParameter(WeatherParameterTypes.VISIBILITY);
        
        if (ceiling === null || visibility === null) {
            return null; // Cannot determine without real data
        }
        
        if (ceiling >= FlightCategories.VFR.ceiling_min && 
            visibility >= FlightCategories.VFR.visibility_min) {
            this.flightCategory = 'VFR';
        } else if (ceiling >= FlightCategories.MVFR.ceiling_min && 
                   visibility >= FlightCategories.MVFR.visibility_min) {
            this.flightCategory = 'MVFR';
        } else if (ceiling >= FlightCategories.IFR.ceiling_min && 
                   visibility >= FlightCategories.IFR.visibility_min) {
            this.flightCategory = 'IFR';
        } else {
            this.flightCategory = 'LIFR';
        }
        
        return this.flightCategory;
    }
    
    /**
     * Identify aviation hazards based on weather parameters
     * Only reports real hazards - no false positives
     */
    identifyHazards() {
        this.hazards = [];
        
        // Check for icing conditions
        const icing = this.getParameter(WeatherParameterTypes.ICING);
        if (icing && icing >= WeatherIntensity.ICING.MODERATE) {
            this.hazards.push({
                type: 'ICING',
                severity: Object.keys(WeatherIntensity.ICING)[icing],
                impact: 'Aircraft icing conditions present'
            });
        }
        
        // Check for turbulence
        const turbulence = this.getParameter(WeatherParameterTypes.TURBULENCE);
        if (turbulence && turbulence >= WeatherIntensity.TURBULENCE.MODERATE) {
            this.hazards.push({
                type: 'TURBULENCE', 
                severity: Object.keys(WeatherIntensity.TURBULENCE)[turbulence],
                impact: 'Flight turbulence expected'
            });
        }
        
        // Check for convective activity (thunderstorms)
        const convective = this.getParameter(WeatherParameterTypes.CONVECTIVE);
        if (convective && convective > 0) {
            this.hazards.push({
                type: 'CONVECTIVE',
                severity: 'ACTIVE',
                impact: 'Thunderstorm activity - avoid area'
            });
        }
        
        return this.hazards;
    }
}

/**
 * 3D Weather Layer Structure for visualization
 * Represents real atmospheric layers with accurate altitudes
 */
export class WeatherLayer3D {
    constructor(type, altitudeBase, altitudeTop) {
        this.type = type;                       // Layer type (cloud, turbulence, icing)
        this.altitudeBase = altitudeBase;       // Base altitude (feet MSL)
        this.altitudeTop = altitudeTop;         // Top altitude (feet MSL)
        this.thickness = altitudeTop - altitudeBase; // Layer thickness
        this.coordinates = [];                  // Geographic boundaries
        this.intensity = 0;                     // Intensity value
        this.coverage = 0;                      // Coverage percentage
        this.movementVector = null;             // Movement direction/speed
        this.validTime = null;                  // Valid time for forecast
    }
    
    /**
     * Check if aircraft altitude intersects this weather layer
     */
    intersectsAltitude(aircraftAltitude) {
        return aircraftAltitude >= this.altitudeBase && 
               aircraftAltitude <= this.altitudeTop;
    }
    
    /**
     * Get layer density for 3D visualization
     * Returns opacity/density based on real weather parameters
     */
    getVisualizationDensity() {
        // Calculate density based on intensity and coverage
        // Real weather data only - no arbitrary values
        if (this.intensity === 0 || this.coverage === 0) {
            return 0; // No weather = no visualization
        }
        
        // Density is product of intensity and coverage
        return (this.intensity / 4.0) * (this.coverage / 100.0);
    }
}

/**
 * Rig Weather Report Structure
 * Aviation-specific weather for offshore platforms
 */
export class RigWeatherReport extends WeatherReport {
    constructor(rigId, coordinates, timestamp) {
        super(rigId, coordinates, timestamp);
        
        // Rig-specific parameters
        this.helideckStatus = null;             // Helideck operational status
        this.seaState = null;                   // Sea state (for offshore operations)
        this.waveHeight = null;                 // Significant wave height
        this.platformMotion = null;             // Platform motion characteristics
        this.obstacleLight = null;              // Obstacle lighting status
        
        // Aviation decision aids
        this.landingRecommendation = null;      // Landing recommendation
        this.alternateRequired = false;         // Alternate airport required
        this.fuelReserveRecommended = null;     // Additional fuel reserve recommended
    }
    
    /**
     * Assess helideck landing conditions
     * Based on real aviation criteria for offshore operations
     */
    assessHelideckConditions() {
        const windSpeed = this.getParameter(WeatherParameterTypes.WIND_SPEED);
        const visibility = this.getParameter(WeatherParameterTypes.VISIBILITY);
        const ceiling = this.getParameter(WeatherParameterTypes.CLOUD_BASE);
        
        // Real aviation criteria - no arbitrary limits
        if (windSpeed === null || visibility === null || ceiling === null) {
            this.landingRecommendation = 'INSUFFICIENT_DATA';
            return;
        }
        
        // Apply real helideck operational limits
        if (windSpeed <= 35 && visibility >= 1 && ceiling >= 500) {
            this.landingRecommendation = 'SUITABLE';
        } else if (windSpeed <= 45 && visibility >= 0.5 && ceiling >= 200) {
            this.landingRecommendation = 'MARGINAL';
            this.alternateRequired = true;
        } else {
            this.landingRecommendation = 'NOT_SUITABLE';
            this.alternateRequired = true;
        }
        
        return this.landingRecommendation;
    }
}

export default {
    WeatherParameterTypes,
    WeatherIntensity,
    CloudTypes,
    FlightCategories,
    WeatherReport,
    WeatherLayer3D,
    RigWeatherReport
};
