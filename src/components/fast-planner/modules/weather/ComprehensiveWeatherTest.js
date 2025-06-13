/**
 * ComprehensiveWeatherTest.js
 * Final test combining NOAA satellite, radar, and live weather data
 * 
 * This demonstrates the complete weather integration capability
 * including both satellite/radar overlays and live weather data
 */

import NOAASatelliteService from './NOAASatelliteService.js';
import WeatherAPIService from './WeatherAPIService.js';

class ComprehensiveWeatherTest {
    constructor() {
        this.satelliteService = new NOAASatelliteService();
        this.weatherService = new WeatherAPIService();
        
        // Gulf of Mexico test locations (where your rigs operate)
        this.testLocations = [
            { name: 'Houston Offshore', lat: 29.0, lon: -94.0, description: 'Major offshore area' },
            { name: 'Louisiana Shelf', lat: 28.5, lon: -91.5, description: 'Deep water rigs' },
            { name: 'Texas Coast', lat: 27.8, lon: -96.2, description: 'Shallow water platforms' },
            { name: 'Mobile Bay Area', lat: 30.2, lon: -88.0, description: 'Eastern Gulf operations' }
        ];
        
        console.log('🌊🛰️ Comprehensive Weather Test initialized');
    }
    
    /**
     * Run complete weather integration test
     * @returns {Promise<Object>} Complete test results
     */
    async runCompleteTest() {
        console.log('🧪 Running COMPLETE weather integration test...');
        console.log('==========================================');
        
        const results = {
            success: false,
            summary: {},
            locationTests: [],
            capabilities: null,
            recommendations: [],
            errors: []
        };
        
        try {
            // Step 1: Test NOAA capabilities
            console.log('📋 Step 1: Getting NOAA service capabilities...');
            try {
                results.capabilities = await this.satelliteService.getCapabilities();
                console.log('✅ NOAA capabilities retrieved');
            } catch (error) {
                console.warn('⚠️ Capabilities test failed:', error.message);
                results.errors.push(`Capabilities: ${error.message}`);
            }
            
            // Step 2: Test each Gulf location
            console.log('\n🌊 Step 2: Testing Gulf of Mexico locations...');
            
            for (const location of this.testLocations) {
                console.log(`\n📍 Testing ${location.name} (${location.lat}, ${location.lon})`);
                
                const locationResult = {
                    location: location,
                    satellite: null,
                    radar: null,
                    liveWeather: null,
                    coverage: null,
                    overlayCapable: false,
                    errors: []
                };
                
                try {
                    // Test satellite/radar coverage and data
                    const weatherData = await this.satelliteService.testAllWeatherData(
                        location.lat, 
                        location.lon
                    );
                    
                    locationResult.satellite = weatherData.satelliteData;
                    locationResult.radar = weatherData.radarData;
                    locationResult.coverage = weatherData.coverage;
                    locationResult.overlayCapable = weatherData.success;
                    
                    // Test live weather data
                    try {
                        const liveWeather = await this.weatherService.getWeatherForLocation({
                            latitude: location.lat,
                            longitude: location.lon,
                            name: location.name
                        });
                        
                        locationResult.liveWeather = liveWeather;
                        console.log(`✅ Live weather data retrieved for ${location.name}`);
                        
                    } catch (error) {
                        console.warn(`⚠️ Live weather failed for ${location.name}:`, error.message);
                        locationResult.errors.push(`Live weather: ${error.message}`);
                    }
                    
                } catch (error) {
                    console.error(`❌ Location test failed for ${location.name}:`, error.message);
                    locationResult.errors.push(`Location test: ${error.message}`);
                }
                
                results.locationTests.push(locationResult);
            }
            
            // Step 3: Generate summary and recommendations
            this.generateCompleteSummary(results);
            
            // Determine overall success
            results.success = results.locationTests.some(test => 
                test.overlayCapable || test.liveWeather !== null
            );
            
            // Display results
            this.displayCompleteResults(results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Complete test failed:', error);
            results.errors.push(error.message);
            return results;
        }
    }
    
    /**
     * Generate summary and recommendations
     * @private
     */
    generateCompleteSummary(results) {
        const summary = {
            totalLocations: results.locationTests.length,
            satelliteCoverage: 0,
            radarCoverage: 0,
            liveWeatherSuccess: 0,
            overlayCapable: 0,
            gulfOptimal: 0
        };
        
        // Analyze each location
        results.locationTests.forEach(test => {
            if (test.coverage?.withinSatellite) summary.satelliteCoverage++;
            if (test.coverage?.withinRadar) summary.radarCoverage++;
            if (test.liveWeather) summary.liveWeatherSuccess++;
            if (test.overlayCapable) summary.overlayCapable++;
            if (test.coverage?.radarRegions?.includes('CARIBBEAN')) summary.gulfOptimal++;
        });
        
        results.summary = summary;
        
        // Generate recommendations
        if (summary.gulfOptimal > 0) {
            results.recommendations.push('🎯 EXCELLENT: Gulf of Mexico has optimal weather coverage!');
            results.recommendations.push('🌊 Caribbean radar covers your offshore operations perfectly');
            results.recommendations.push('⚡ 4-minute radar updates ideal for storm tracking');
        }
        
        if (summary.satelliteCoverage > 0) {
            results.recommendations.push('🛰️ Satellite data available for cloud analysis');
            results.recommendations.push('👁️ Multiple bands for visibility assessment');
        }
        
        if (summary.liveWeatherSuccess > 0) {
            results.recommendations.push('🌤️ Live weather API integration working');
            results.recommendations.push('📊 Ready for weather rosette implementation');
        }
        
        if (summary.overlayCapable > 0) {
            results.recommendations.push('🗺️ Map overlay integration ready');
            results.recommendations.push('🎨 Can implement weather layer controls');
        }
        
        // Implementation recommendations
        results.recommendations.push('');
        results.recommendations.push('🚀 NEXT STEPS:');
        results.recommendations.push('1. Add weather layer toggle to your UI');
        results.recommendations.push('2. Implement weather rosette around rigs');
        results.recommendations.push('3. Combine radar + live data for comprehensive view');
        results.recommendations.push('4. Add time controls for weather animation');
    }
    
    /**
     * Display complete test results
     * @private
     */
    displayCompleteResults(results) {
        console.log('\n🌊🛰️ COMPREHENSIVE WEATHER INTEGRATION RESULTS 🛰️🌊');
        console.log('======================================================');
        
        console.log(`🎯 Overall Success: ${results.success ? '✅ EXCELLENT' : '❌ NEEDS WORK'}`);
        
        // Summary statistics
        console.log('\n📊 COVERAGE SUMMARY:');
        console.log(`   Locations Tested: ${results.summary.totalLocations}`);
        console.log(`   🛰️ Satellite Coverage: ${results.summary.satelliteCoverage}/${results.summary.totalLocations}`);
        console.log(`   🌧️ Radar Coverage: ${results.summary.radarCoverage}/${results.summary.totalLocations}`);
        console.log(`   🌤️ Live Weather Success: ${results.summary.liveWeatherSuccess}/${results.summary.totalLocations}`);
        console.log(`   🗺️ Map Overlay Ready: ${results.summary.overlayCapable}/${results.summary.totalLocations}`);
        console.log(`   🌊 Gulf Optimal: ${results.summary.gulfOptimal}/${results.summary.totalLocations}`);
        
        // Location details
        console.log('\n📍 LOCATION DETAILS:');
        results.locationTests.forEach((test, index) => {
            const loc = test.location;
            console.log(`\n   ${index + 1}. ${loc.name} (${loc.lat}, ${loc.lon})`);
            console.log(`      ${loc.description}`);
            console.log(`      🛰️ Satellite: ${test.satellite?.length || 0} layers`);
            console.log(`      🌧️ Radar: ${test.radar?.length || 0} layers`);
            console.log(`      🌤️ Live Weather: ${test.liveWeather ? '✅ Available' : '❌ Failed'}`);
            console.log(`      🗺️ Map Overlay: ${test.overlayCapable ? '✅ Ready' : '❌ Not Ready'}`);
            
            if (test.coverage?.radarRegions?.length > 0) {
                console.log(`      📡 Radar Regions: ${test.coverage.radarRegions.join(', ')}`);
            }
        });
        
        // NOAA capabilities
        if (results.capabilities) {
            console.log('\n📋 NOAA SERVICE STATUS:');
            console.log(`   ✅ Service: ${results.capabilities.service.title}`);
            console.log(`   📊 Total Layers: ${results.capabilities.layers.length}`);
            console.log(`   🕐 Update Sequence: ${results.capabilities.updateSequence}`);
        }
        
        // Recommendations
        if (results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            results.recommendations.forEach((rec, index) => {
                console.log(`   ${rec}`);
            });
        }
        
        // Errors
        if (results.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            results.errors.forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }
        
        // Store results globally
        window.completeWeatherTestResults = results;
        console.log('\n🔍 Full results stored at: window.completeWeatherTestResults');
        console.log('\n🎉 Weather integration testing complete!');
    }
    
    /**
     * Quick test method for console
     */
    async quickTest() {
        console.log('🚀 Running quick comprehensive weather test...');
        return await this.runCompleteTest();
    }
    
    /**
     * Test specific location
     */
    async testLocation(lat, lon, name = 'Custom Location') {
        console.log(`📍 Testing specific location: ${name} (${lat}, ${lon})`);
        
        const results = {
            weatherData: await this.satelliteService.testAllWeatherData(lat, lon),
            liveWeather: null
        };
        
        try {
            results.liveWeather = await this.weatherService.getWeatherForLocation({
                latitude: lat,
                longitude: lon,
                name: name
            });
        } catch (error) {
            console.warn('Live weather failed:', error.message);
        }
        
        console.log('📊 Location test results:', results);
        return results;
    }
}

// Export for use
export default ComprehensiveWeatherTest;

// Make available globally for console testing
if (typeof window !== 'undefined') {
    window.ComprehensiveWeatherTest = ComprehensiveWeatherTest;
    window.comprehensiveWeatherTest = new ComprehensiveWeatherTest();
    
    console.log('🧪 Comprehensive Weather Test available at: window.comprehensiveWeatherTest');
    console.log('🚀 Run complete test with: window.comprehensiveWeatherTest.quickTest()');
    console.log('📍 Test specific location: window.comprehensiveWeatherTest.testLocation(29.0, -94.0, "My Rig")');
}