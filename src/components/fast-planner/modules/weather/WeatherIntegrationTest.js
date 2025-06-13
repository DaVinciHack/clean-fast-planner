/**
 * WeatherIntegrationTest.js
 * Test integration between weather module and existing Fast Planner systems
 * 
 * Tests:
 * 1. Extract departure time from flight data (or default to 1 hour from now)
 * 2. Extract rig coordinates from platform data  
 * 3. Fetch real weather data for rigs
 * 4. Generate weather reports
 */

import WeatherVisualizationManager from './WeatherVisualizationManager.js';
import WeatherReportGenerator from './WeatherReportGenerator.js';

class WeatherIntegrationTest {
    constructor() {
        this.weatherManager = new WeatherVisualizationManager();
        this.reportGenerator = new WeatherReportGenerator();
        
        console.log('WeatherIntegrationTest initialized');
    }
    
    /**
     * Initialize weather system integration
     */
    async initialize() {
        try {
            // Initialize weather manager with references to other managers
            const managers = {
                mapManager: window.mapManager || window.mapManagerRef?.current || null,
                platformManager: window.platformManager || null
            };
            
            console.log('🌤️ Initializing weather system with managers:', {
                hasMapManager: !!managers.mapManager,
                hasPlatformManager: !!managers.platformManager
            });
            
            this.weatherManager.initialize(managers);
            
            console.log('✅ Weather integration initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Weather integration initialization failed:', error);
            return false;
        }
    }
    
    /**
     * Test weather integration with flight data
     * @param {Object} flightData - Flight data object
     * @returns {Promise<Object>} Test results
     */
    async testFlightWeatherIntegration(flightData = null) {
        console.log('🧪 Testing weather integration with flight data...');
        
        const results = {
            success: false,
            departureTime: null,
            rigData: [],
            weatherReports: [],
            errors: []
        };
        
        try {
            // Step 1: Extract departure time
            results.departureTime = this.extractDepartureTime(flightData);
            console.log('📅 Departure time:', results.departureTime);
            
            // Step 2: Get rig data from current route
            results.rigData = this.extractRigDataFromRoute();
            console.log('🛢️ Found rigs:', results.rigData.length);
            
            // Step 3: Get weather for each rig
            if (results.rigData.length > 0) {
                console.log('🌤️ Fetching weather for rigs...');
                
                for (const rig of results.rigData) {
                    try {
                        const weatherReport = await this.weatherManager.getRigWeatherReport(rig);
                        
                        // Generate formatted report
                        const formattedReport = this.reportGenerator.generateRigReport(
                            weatherReport, 
                            'STANDARD'
                        );
                        
                        results.weatherReports.push({
                            rigId: rig.id || rig.name,
                            rigName: rig.name,
                            coordinates: rig.coordinates,
                            weatherReport: weatherReport,
                            formattedReport: formattedReport
                        });
                        
                        console.log(`✅ Weather retrieved for ${rig.name}`);
                        
                    } catch (error) {
                        console.error(`❌ Weather failed for ${rig.name}:`, error);
                        results.errors.push({
                            rig: rig.name,
                            error: error.message
                        });
                    }
                }
            }
            
            results.success = results.weatherReports.length > 0;
            
            // Step 4: Display results
            this.displayTestResults(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Weather integration test failed:', error);
            results.errors.push({
                general: error.message
            });
            return results;
        }
    }
    
    /**
     * Extract departure time from flight data
     * @param {Object} flightData - Flight data object
     * @returns {Date} Departure time
     */
    extractDepartureTime(flightData) {
        let departureTime;
        
        if (flightData && flightData.etd) {
            // Flight data has ETD
            departureTime = new Date(flightData.etd);
            console.log('📅 Using flight ETD:', departureTime.toISOString());
            
        } else {
            // Default to 1 hour from now
            departureTime = new Date();
            departureTime.setHours(departureTime.getHours() + 1);
            console.log('📅 No ETD provided, using 1 hour from now:', departureTime.toISOString());
        }
        
        return departureTime;
    }
    
    /**
     * Extract rig data from current route
     * @returns {Array} Array of rig objects with coordinates
     */
    extractRigDataFromRoute() {
        const rigs = [];
        
        try {
            // Method 1: Check current waypoints (most reliable)
            if (window.currentWaypoints && Array.isArray(window.currentWaypoints)) {
                console.log('🔍 Checking current waypoints for rigs...');
                
                window.currentWaypoints.forEach(waypoint => {
                    if (waypoint.name && waypoint.lat && waypoint.lng) {
                        // Check if this waypoint corresponds to a rig
                        const isRig = this.checkIfLocationIsRig(waypoint.name);
                        
                        if (isRig) {
                            rigs.push({
                                id: waypoint.name,
                                name: waypoint.name,
                                latitude: waypoint.lat,
                                longitude: waypoint.lng,
                                coordinates: [waypoint.lng, waypoint.lat],
                                source: 'currentWaypoints'
                            });
                            
                            console.log(`🛢️ Found rig waypoint: ${waypoint.name}`);
                        }
                    }
                });
            }
            
            // Method 2: Check platform manager for rigs in route
            if (window.platformManager && rigs.length === 0) {
                console.log('🔍 Checking platform manager for rigs...');
                
                // Get platforms that match current waypoints
                const waypoints = window.waypointManager ? window.waypointManager.getWaypoints() : [];
                
                waypoints.forEach(waypoint => {
                    if (waypoint.name) {
                        const platform = window.platformManager.findPlatformByName(waypoint.name);
                        
                        if (platform && platform.coordinates && this.checkIfLocationIsRig(platform.name)) {
                            rigs.push({
                                id: platform.id || platform.name,
                                name: platform.name,
                                latitude: platform.coordinates[1],
                                longitude: platform.coordinates[0],
                                coordinates: platform.coordinates,
                                source: 'platformManager'
                            });
                            
                            console.log(`🛢️ Found rig from platform manager: ${platform.name}`);
                        }
                    }
                });
            }
            
            // Method 3: Use test rig if none found
            if (rigs.length === 0) {
                console.log('🔍 No rigs found in route, using test rig for demonstration...');
                
                // Use a known rig location for testing (North Sea)
                rigs.push({
                    id: 'TEST_RIG',
                    name: 'Test Offshore Platform',
                    latitude: 59.0,  // North Sea
                    longitude: 2.0,
                    coordinates: [2.0, 59.0],
                    source: 'test'
                });
            }
            
        } catch (error) {
            console.error('Error extracting rig data:', error);
        }
        
        return rigs;
    }
    
    /**
     * Check if a location name corresponds to a rig
     * @param {string} locationName - Name of the location
     * @returns {boolean} True if location is likely a rig
     */
    checkIfLocationIsRig(locationName) {
        if (!locationName) return false;
        
        const rigIndicators = [
            'RIG', 'PLATFORM', 'FPSO', 'FSO', 'DRILLING',
            'SEMI', 'JACK', 'TLP', 'SPAR', 'FIELD'
        ];
        
        const upperName = locationName.toUpperCase();
        
        // Check if name contains rig indicators
        const hasRigIndicator = rigIndicators.some(indicator => 
            upperName.includes(indicator)
        );
        
        if (hasRigIndicator) {
            return true;
        }
        
        // Check if it's NOT an airport (airports usually have 4-letter ICAO codes)
        if (locationName.length === 4 && /^[A-Z]{4}$/.test(locationName)) {
            // Might be an airport ICAO code
            return false;
        }
        
        // Check against known platforms in platform manager
        if (window.platformManager) {
            const platform = window.platformManager.findPlatformByName(locationName);
            if (platform) {
                // Check platform properties that indicate it's a rig
                return !platform.isAirfield && 
                       !platform.isBases && 
                       (platform.isPlatform || platform.hasFuel);
            }
        }
        
        // Default to considering it a potential rig if not clearly an airport
        return true;
    }
    
    /**
     * Display test results in console and UI
     * @param {Object} results - Test results
     */
    displayTestResults(results) {
        console.log('🧪 WEATHER INTEGRATION TEST RESULTS 🧪');
        console.log('==========================================');
        
        console.log(`✅ Success: ${results.success}`);
        console.log(`📅 Departure Time: ${results.departureTime}`);
        console.log(`🛢️ Rigs Found: ${results.rigData.length}`);
        console.log(`🌤️ Weather Reports: ${results.weatherReports.length}`);
        console.log(`❌ Errors: ${results.errors.length}`);
        
        if (results.rigData.length > 0) {
            console.log('\n🛢️ RIG DATA:');
            results.rigData.forEach((rig, index) => {
                console.log(`${index + 1}. ${rig.name} [${rig.coordinates}] (${rig.source})`);
            });
        }
        
        if (results.weatherReports.length > 0) {
            console.log('\n🌤️ WEATHER REPORTS:');
            results.weatherReports.forEach((report, index) => {
                console.log(`${index + 1}. ${report.rigName}:`);
                
                if (report.formattedReport.currentConditions) {
                    const conditions = report.formattedReport.currentConditions;
                    
                    if (conditions.wind) {
                        console.log(`   Wind: ${conditions.wind.speed} ${conditions.wind.direction || ''}`);
                        console.log(`   Description: ${conditions.wind.description}`);
                    }
                    
                    if (conditions.visibility) {
                        console.log(`   Visibility: ${conditions.visibility.value}`);
                        console.log(`   Description: ${conditions.visibility.description}`);
                    }
                    
                    if (conditions.marine) {
                        console.log(`   Wave Height: ${conditions.marine.waveHeight}`);
                        console.log(`   Sea State: ${conditions.marine.seaState} - ${conditions.marine.description}`);
                    }
                }
                
                if (report.formattedReport.flightCategory) {
                    console.log(`   Flight Category: ${report.formattedReport.flightCategory.category}`);
                }
                
                if (report.formattedReport.helideckStatus) {
                    console.log(`   Helideck: ${report.formattedReport.helideckStatus.status}`);
                }
            });
        }
        
        if (results.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            results.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.rig || 'General'}: ${error.error}`);
            });
        }
        
        // Store results globally for inspection
        window.weatherTestResults = results;
        console.log('\n🔍 Full results available at: window.weatherTestResults');
    }
    
    /**
     * Quick test method that can be called from console
     */
    async quickTest() {
        console.log('🚀 Running quick weather integration test...');
        
        await this.initialize();
        const results = await this.testFlightWeatherIntegration();
        
        if (results.success) {
            console.log('🎉 Weather integration test PASSED!');
        } else {
            console.log('⚠️ Weather integration test had issues - check results above');
        }
        
        return results;
    }
}

// Export for use
export default WeatherIntegrationTest;

// Also make available globally for console testing
if (typeof window !== 'undefined') {
    window.WeatherIntegrationTest = WeatherIntegrationTest;
    
    // Create a global instance for easy testing
    window.weatherTest = new WeatherIntegrationTest();
    
    console.log('🧪 Weather integration test available at: window.weatherTest');
    console.log('🚀 Run quick test with: window.weatherTest.quickTest()');
}
