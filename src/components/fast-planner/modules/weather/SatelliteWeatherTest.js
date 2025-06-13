}
    
    /**
     * Test with multiple locations for Gulf of Mexico coverage
     */
    async testMultipleGulfLocations() {
        console.log('🌊 Testing multiple Gulf of Mexico locations...');
        
        const testLocations = [
            { name: 'Houston Offshore', lat: 29.0, lon: -94.0 },
            { name: 'Louisiana Shelf', lat: 28.5, lon: -91.5 },
            { name: 'Texas Coast', lat: 27.8, lon: -96.2 },
            { name: 'Mobile Bay', lat: 30.2, lon: -88.0 }
        ];
        
        const results = {};
        
        for (const location of testLocations) {
            console.log(`Testing ${location.name}...`);
            results[location.name] = await this.runComprehensiveTest(location.lat, location.lon);
        }
        
        console.log('🌊 Multi-location test results:', results);
        return results;
    }
}

// Export for use
export default SatelliteWeatherTest;

// Make available globally for console testing
if (typeof window !== 'undefined') {
    window.SatelliteWeatherTest = SatelliteWeatherTest;
    window.satelliteWeatherTest = new SatelliteWeatherTest();
    
    console.log('🧪 Satellite Weather Test available at: window.satelliteWeatherTest');
    console.log('🚀 Run quick test with: window.satelliteWeatherTest.quickTest()');
    console.log('🌊 Test Gulf locations: window.satelliteWeatherTest.testGulfOfMexico()');
}