/**
 * Weather Module Index
 * Fast Planner Weather Visualization Module
 * 
 * Exports all weather-related classes and utilities
 * for integration with the main Fast Planner application
 */

// Core weather manager
export { default as WeatherVisualizationManager } from './WeatherVisualizationManager.js';

// Weather API service
export { default as WeatherAPIService } from './WeatherAPIService.js';

// Report generation
export { default as WeatherReportGenerator } from './WeatherReportGenerator.js';

// 3D visualization components
export { default as CloudLayerRenderer } from './weather3D/CloudLayerRenderer.js';

// Integration testing
export { default as WeatherIntegrationTest } from './WeatherIntegrationTest.js';

// Weather data types and utilities
export {
    WeatherParameterTypes,
    WeatherIntensity,
    CloudTypes,
    FlightCategories,
    WeatherReport,
    WeatherLayer3D,
    RigWeatherReport
} from './utils/WeatherTypes.js';

// Module information
export const WeatherModuleInfo = {
    name: 'Fast Planner Weather Module',
    version: '1.0.0',
    description: 'Aviation weather visualization and reporting for offshore operations',
    
    // Module capabilities
    capabilities: [
        'Real-time weather data integration',
        'Rig-specific weather reports', 
        '3D cloud layer visualization',
        'Aviation hazard assessment',
        'Helideck operational status',
        'Flight category determination',
        'Weather overlay integration'
    ],
    
    // Integration points with other Fast Planner modules
    integrations: {
        mapManager: 'Weather overlay display',
        platformManager: 'Rig weather reports', 
        routeCalculator: 'Weather impact on routes',
        regionManager: 'Regional weather data'
    },
    
    // Data sources (real APIs only - no dummy data)
    dataSources: [
        'Open-Meteo Marine API',
        'NOAA Aviation Weather', 
        'WeatherAPI.com',
        'WMS Weather Services'
    ]
};

console.log(`${WeatherModuleInfo.name} v${WeatherModuleInfo.version} loaded`);
