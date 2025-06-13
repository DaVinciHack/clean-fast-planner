/**
 * WeatherReportGenerator.js
 * Weather Report Generator for Fast Planner
 * 
 * Generates aviation weather reports for rig operations
 * NO dummy data - only real weather information
 */

import { WeatherReport, RigWeatherReport } from './utils/WeatherTypes.js';

class WeatherReportGenerator {
    constructor() {
        // Report templates storage
        this.templates = new Map();
        this.initializeTemplates();
        
        // Aviation weather thresholds (ICAO standards)
        this.flightCategoryThresholds = {
            VFR: { visibility: 5000, ceiling: 1000 },    // Visual Flight Rules
            MVFR: { visibility: 1600, ceiling: 500 },    // Marginal VFR
            IFR: { visibility: 800, ceiling: 200 },      // Instrument Flight Rules
            LIFR: { visibility: 0, ceiling: 0 }          // Low IFR
        };
    }
    
    /**
     * Initialize report templates
     * @private
     */
    initializeTemplates() {
        // Standard aviation weather report template
        this.templates.set('STANDARD', {
            header: 'AVIATION WEATHER REPORT',
            sections: ['currentConditions', 'flightCategory', 'helideckStatus', 'hazards', 'recommendations']
        });
        
        // Detailed analysis template
        this.templates.set('DETAILED', {
            header: 'DETAILED WEATHER ANALYSIS',
            sections: ['currentConditions', 'flightCategory', 'helideckStatus', 'hazards', 'detailedAnalysis', 'recommendations']
        });
        
        // Summary template
        this.templates.set('SUMMARY', {
            header: 'WEATHER SUMMARY',
            sections: ['quickStatus', 'keyValues']
        });
        
        // Operational template
        this.templates.set('OPERATIONAL', {
            header: 'OPERATIONAL WEATHER BRIEFING',
            sections: ['operationalStatus', 'criticalParameters', 'riskAssessment', 'actionItems']
        });
    }
    
    /**
     * Describe wind conditions in plain language
     * @private
     */
    describeWindConditions(windSpeed, windGust) {
        if (windSpeed < 5) return 'Light winds';
        if (windSpeed < 15) return 'Moderate winds';
        if (windSpeed < 25) return 'Fresh winds';
        if (windSpeed < 35) return 'Strong winds';
        return 'Very strong winds';
    }
    
    /**
     * Describe visibility conditions
     * @private
     */
    describeVisibility(visibility) {
        if (visibility >= 6) return 'Excellent visibility';
        if (visibility >= 3) return 'Good visibility';
        if (visibility >= 1) return 'Poor visibility';
        return 'Very poor visibility';
    }
    
    /**
     * Describe temperature conditions
     * @private
     */
    describeTemperature(temperature) {
        if (temperature < 0) return 'Below freezing';
        if (temperature < 10) return 'Cold';
        if (temperature < 20) return 'Cool';
        if (temperature < 30) return 'Warm';
        return 'Hot';
    }
    
    /**
     * Describe sea state conditions
     * @private
     */
    describeSeaState(seaState) {
        const descriptions = [
            'Calm (glassy)',
            'Calm (rippled)',
            'Smooth (wavelets)',
            'Slight',
            'Moderate',
            'Rough',
            'Very rough',
            'High',
            'Very high'
        ];
        
        return descriptions[seaState] || 'Unknown sea state';
    }
    
    /**
     * Get flight category description
     * @private
     */
    getFlightCategoryDescription(category) {
        const descriptions = {
            'VFR': 'Visual flight rules conditions - clear flying weather',
            'MVFR': 'Marginal visual flight rules - some restrictions',
            'IFR': 'Instrument flight rules required - poor weather conditions',
            'LIFR': 'Low instrument flight rules - very poor conditions'
        };
        
        return descriptions[category] || 'Unknown flight category';
    }
    
    /**
     * Get flight category operational impact
     * @private
     */
    getFlightCategoryImpact(category) {
        const impacts = {
            'VFR': 'Normal flight operations authorized',
            'MVFR': 'Flight operations with increased caution',
            'IFR': 'Instrument flight procedures required',
            'LIFR': 'Flight operations restricted or prohibited'
        };
        
        return impacts[category] || 'Impact assessment unavailable';
    }
    
    /**
     * Get helideck status description
     * @private
     */
    getHelideckStatusDescription(status) {
        const descriptions = {
            'SUITABLE': 'Helideck conditions are suitable for normal operations',
            'MARGINAL': 'Helideck conditions are marginal - proceed with caution',
            'NOT_SUITABLE': 'Helideck conditions are not suitable for operations',
            'INSUFFICIENT_DATA': 'Cannot assess helideck conditions - insufficient weather data'
        };
        
        return descriptions[status] || 'Helideck status unknown';
    }
    
    /**
     * Get helideck operational limitations
     * @private
     */
    getHelideckLimitations(rigWeather) {
        const limitations = [];
        
        const windSpeed = rigWeather.getParameter(WeatherParameterTypes.WIND_SPEED);
        if (windSpeed && windSpeed > 30) {
            limitations.push('Wind speed exceeds normal operational limits');
        }
        
        const visibility = rigWeather.getParameter(WeatherParameterTypes.VISIBILITY);
        if (visibility && visibility < 1) {
            limitations.push('Visibility below minimum requirements');
        }
        
        const ceiling = rigWeather.getParameter(WeatherParameterTypes.CLOUD_BASE);
        if (ceiling && ceiling < 500) {
            limitations.push('Cloud ceiling below minimum safe altitude');
        }
        
        if (rigWeather.waveHeight && rigWeather.waveHeight > 4) {
            limitations.push('High waves may affect rig stability and approach');
        }
        
        return limitations;
    }
    
    /**
     * Get hazard description
     * @private
     */
    getHazardDescription(hazard) {
        const descriptions = {
            'ICING': 'Aircraft icing conditions present - ice accumulation on aircraft surfaces',
            'TURBULENCE': 'Atmospheric turbulence present - expect rough flight conditions',
            'CONVECTIVE': 'Thunderstorm activity present - severe weather hazard'
        };
        
        return descriptions[hazard.type] || `${hazard.type} hazard present`;
    }
    
    /**
     * Get hazard mitigation strategies
     * @private
     */
    getHazardMitigation(hazard) {
        const mitigations = {
            'ICING': 'Avoid flight altitudes with icing conditions, use anti-ice systems if available',
            'TURBULENCE': 'Maintain appropriate airspeed, secure all loose items, brief passengers',
            'CONVECTIVE': 'Avoid thunderstorm areas by at least 20 nautical miles, delay flight if necessary'
        };
        
        return mitigations[hazard.type] || 'Exercise appropriate caution for weather hazard';
    }
    
    /**
     * Format marine conditions
     * @private
     */
    formatMarineConditions(rigWeather) {
        return {
            waveHeight: rigWeather.waveHeight,
            seaState: rigWeather.seaState,
            seaStateDescription: this.describeSeaState(rigWeather.seaState),
            platformMotion: rigWeather.platformMotion,
            impact: this.assessMarineImpact(rigWeather)
        };
    }
    
    /**
     * Analyze wind conditions in detail
     * @private
     */
    analyzeWindConditions(rigWeather) {
        const windSpeed = rigWeather.getParameter(WeatherParameterTypes.WIND_SPEED);
        const windDirection = rigWeather.getParameter(WeatherParameterTypes.WIND_DIRECTION);
        const windGust = rigWeather.getParameter(WeatherParameterTypes.WIND_GUST);
        
        return {
            steadyWind: windSpeed,
            direction: windDirection,
            gustFactor: windGust ? windGust - windSpeed : 0,
            crosswindComponent: this.calculateCrosswindComponent(windSpeed, windDirection),
            operationalImpact: this.assessWindImpact(windSpeed, windGust)
        };
    }
    
    /**
     * Analyze visibility conditions
     * @private
     */
    analyzeVisibilityConditions(rigWeather) {
        const visibility = rigWeather.getParameter(WeatherParameterTypes.VISIBILITY);
        
        return {
            currentVisibility: visibility,
            flightRulesImpact: this.getVisibilityFlightRules(visibility),
            approachLimitations: this.getVisibilityLimitations(visibility),
            recommendations: this.getVisibilityRecommendations(visibility)
        };
    }
    
    /**
     * Is helideck operational based on weather
     * @private
     */
    isHelideckOperational(rigWeather) {
        const status = rigWeather.assessHelideckConditions();
        return status === 'SUITABLE';
    }
    
    /**
     * Is flight authorized based on weather
     * @private
     */
    isFlightAuthorized(rigWeather) {
        const status = rigWeather.assessHelideckConditions();
        const hazardLevel = this.assessHazardLevel(rigWeather);
        
        return status !== 'NOT_SUITABLE' && hazardLevel !== 'HIGH';
    }
    
    /**
     * Assess operational risk level
     * @private
     */
    assessOperationalRisk(rigWeather) {
        const factors = [];
        
        // Wind risk
        const windSpeed = rigWeather.getParameter(WeatherParameterTypes.WIND_SPEED);
        if (windSpeed > 30) factors.push('HIGH_WIND');
        
        // Visibility risk
        const visibility = rigWeather.getParameter(WeatherParameterTypes.VISIBILITY);
        if (visibility < 2) factors.push('LOW_VISIBILITY');
        
        // Marine risk
        if (rigWeather.waveHeight > 3) factors.push('ROUGH_SEAS');
        
        // Hazard risk
        const hazards = rigWeather.identifyHazards();
        if (hazards.length > 0) factors.push('WEATHER_HAZARDS');
        
        return {
            level: this.calculateRiskLevel(factors),
            factors: factors,
            mitigation: this.getRiskMitigation(factors)
        };
    }
    
    /**
     * Generate action items based on weather conditions
     * @private
     */
    generateActionItems(rigWeather) {
        const actions = [];
        
        const windSpeed = rigWeather.getParameter(WeatherParameterTypes.WIND_SPEED);
        if (windSpeed > 25) {
            actions.push({
                priority: 'HIGH',
                action: 'WIND_CHECK',
                description: 'Verify wind conditions at departure and destination',
                deadline: 'Before flight'
            });
        }
        
        const visibility = rigWeather.getParameter(WeatherParameterTypes.VISIBILITY);
        if (visibility < 3) {
            actions.push({
                priority: 'HIGH',
                action: 'ALTERNATE_PLAN',
                description: 'Confirm alternate airport and fuel requirements',
                deadline: 'Before departure'
            });
        }
        
        if (rigWeather.alternateRequired) {
            actions.push({
                priority: 'CRITICAL',
                action: 'ALTERNATE_REQUIRED',
                description: 'Alternate airport is mandatory for this flight',
                deadline: 'Before departure'
            });
        }
        
        return actions;
    }
    
    /**
     * Calculate risk level from factors
     * @private
     */
    calculateRiskLevel(factors) {
        if (factors.length === 0) return 'LOW';
        if (factors.length <= 2) return 'MEDIUM';
        return 'HIGH';
    }
    
    /**
     * Get risk mitigation strategies
     * @private
     */
    getRiskMitigation(factors) {
        const mitigations = [];
        
        if (factors.includes('HIGH_WIND')) {
            mitigations.push('Monitor wind conditions continuously, consider delaying if winds increase');
        }
        
        if (factors.includes('LOW_VISIBILITY')) {
            mitigations.push('Ensure IFR proficiency, confirm alternate airport availability');
        }
        
        if (factors.includes('ROUGH_SEAS')) {
            mitigations.push('Coordinate with rig personnel for deck conditions and landing clearance');
        }
        
        if (factors.includes('WEATHER_HAZARDS')) {
            mitigations.push('Brief crew on weather hazards, ensure appropriate equipment available');
        }
        
        return mitigations;
    }
    
    /**
     * Helper methods for detailed analysis
     * @private
     */
    calculateCrosswindComponent(windSpeed, windDirection) {
        // Simplified crosswind calculation - would need runway heading for accurate calculation
        if (!windSpeed || !windDirection) return null;
        
        // Assume crosswind component for analysis purposes
        return Math.sin(windDirection * Math.PI / 180) * windSpeed;
    }
    
    assessWindImpact(windSpeed, windGust) {
        if (!windSpeed) return 'Unknown';
        
        if (windSpeed < 15) return 'Minimal impact on operations';
        if (windSpeed < 25) return 'Moderate impact - increased pilot workload';
        if (windSpeed < 35) return 'Significant impact - challenging conditions';
        return 'Severe impact - operations may not be safe';
    }
    
    assessMarineImpact(rigWeather) {
        if (!rigWeather.waveHeight) return 'Marine impact unknown';
        
        if (rigWeather.waveHeight < 2) return 'Minimal impact on rig stability';
        if (rigWeather.waveHeight < 4) return 'Moderate impact - monitor rig motion';
        return 'Significant impact - rig motion may affect operations';
    }
    
    getVisibilityFlightRules(visibility) {
        if (!visibility) return 'Unknown';
        
        if (visibility >= 5) return 'VFR conditions';
        if (visibility >= 3) return 'MVFR conditions';
        if (visibility >= 1) return 'IFR conditions';
        return 'LIFR conditions';
    }
    
    getVisibilityLimitations(visibility) {
        if (!visibility) return ['Cannot assess visibility limitations'];
        
        const limitations = [];
        
        if (visibility < 5) {
            limitations.push('Visual reference may be limited during approach');
        }
        
        if (visibility < 3) {
            limitations.push('Instrument approach procedures required');
        }
        
        if (visibility < 1) {
            limitations.push('Operations severely restricted by visibility');
        }
        
        return limitations;
    }
    
    getVisibilityRecommendations(visibility) {
        if (!visibility) return ['Cannot provide visibility recommendations'];
        
        const recommendations = [];
        
        if (visibility < 5) {
            recommendations.push('Maintain increased vigilance during flight');
        }
        
        if (visibility < 3) {
            recommendations.push('File and fly IFR flight plan');
        }
        
        if (visibility < 1) {
            recommendations.push('Consider delaying flight until conditions improve');
        }
        
        return recommendations;
    }
    
    getHistoricalContext(rigWeather) {
        // Placeholder for historical weather comparison
        // Would integrate with historical weather data if available
        return {
            available: false,
            message: 'Historical weather comparison not available'
        };
    }
    
    generateAlternativeOptions(rigWeather) {
        // Generate alternative operational options based on weather
        const alternatives = [];
        
        const status = rigWeather.assessHelideckConditions();
        
        if (status === 'MARGINAL' || status === 'NOT_SUITABLE') {
            alternatives.push({
                option: 'DELAY_FLIGHT',
                description: 'Delay flight until weather conditions improve',
                feasibility: 'HIGH'
            });
            
            alternatives.push({
                option: 'ALTERNATE_RIG',
                description: 'Consider operations to alternate rig with better weather',
                feasibility: 'MEDIUM'
            });
            
            alternatives.push({
                option: 'SHORE_BASE',
                description: 'Return to shore base and wait for conditions to improve',
                feasibility: 'HIGH'
            });
        }
        
        return alternatives;
    }
    
    /**
     * Generate rig-specific weather report
     * @param {RigWeatherReport} rigWeather - Rig weather report object
     * @param {string} format - Report format ('SUMMARY', 'DETAILED')
     * @returns {Object} Formatted weather report
     */
    generateRigReport(rigWeather, format = 'SUMMARY') {
        if (!rigWeather) {
            return {
                error: 'No weather data available',
                rigName: 'Unknown',
                status: 'DATA_UNAVAILABLE'
            };
        }
        
        const report = {
            rigName: rigWeather.locationId,
            timestamp: rigWeather.timestamp,
            coordinates: rigWeather.coordinates,
            status: 'SUCCESS'
        };
        
        // Add weather parameters
        if (rigWeather.parameters && rigWeather.parameters.size > 0) {
            report.weather = {};
            rigWeather.parameters.forEach((param, key) => {
                report.weather[key] = {
                    value: param.value,
                    unit: param.unit
                };
            });
        }
        
        // Add helideck assessment
        try {
            report.helideckStatus = rigWeather.assessHelideckConditions();
        } catch (error) {
            report.helideckStatus = 'ASSESSMENT_UNAVAILABLE';
        }
        
        // Add flight category
        try {
            report.flightCategory = rigWeather.getFlightCategory();
        } catch (error) {
            report.flightCategory = 'CATEGORY_UNAVAILABLE';
        }
        
        return report;
    }
}

export default WeatherReportGenerator;
