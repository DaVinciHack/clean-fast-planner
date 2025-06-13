/**
 * WeatherPopupIntegration.js
 * 
 * Simple example of how to integrate live NWS weather data into existing popups
 * This shows how to enhance your current TAF/METAR popup system with live weather
 */

/**
 * Example of how to enhance an existing popup with live weather data
 * Call this function when creating or updating a popup for a rig/platform
 * 
 * @param {string} platformId - Platform identifier (e.g., "PL22")
 * @param {number} lat - Platform latitude
 * @param {number} lon - Platform longitude
 * @param {string} existingContent - Your existing popup HTML content
 * @returns {Promise<string>} Enhanced popup content with live weather
 */
async function enhancePopupWithLiveWeather(platformId, lat, lon, existingContent) {
    try {
        // Check if weather manager is available
        if (!window.weatherManager) {
            console.warn('Weather manager not available for popup enhancement');
            return existingContent;
        }
        
        // Get live weather HTML section
        const liveWeatherHTML = await window.weatherManager.getLiveWeatherHTML(lat, lon, platformId);
        
        // Combine existing content with live weather
        return existingContent + liveWeatherHTML;
        
    } catch (error) {
        console.warn('Failed to enhance popup with live weather:', error.message);
        return existingContent;
    }
}

/**
 * Example of how to create a complete enhanced popup
 * This shows the pattern for your existing popup creation
 */
async function createEnhancedRigPopup(rigData) {
    // Your existing popup content (TAF/METAR data)
    const existingContent = `
        <div style="color: #e0e0e0; font-size: 13px;">
            <strong style="color: #40c8f0; font-size: 14px;">${rigData.name}</strong><br>
            <div style="margin-top: 6px;">
                <strong>Arrival:</strong> ${rigData.arrival}<br>
                <strong style="color: #4CAF50;">Good Conditions</strong>
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: #ccc;">
                <strong>METAR:</strong><br>
                ${rigData.metar || 'Not available'}
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #ccc;">
                <strong>TAF:</strong><br>
                ${rigData.taf || 'Not available'}
            </div>
        </div>
    `;
    
    // Enhance with live weather data
    const enhancedContent = await enhancePopupWithLiveWeather(
        rigData.id, 
        rigData.latitude, 
        rigData.longitude, 
        existingContent
    );
    
    return enhancedContent;
}

/**
 * Simple integration function - call this to enable live weather on all popups
 * This can be called after your weather manager is initialized
 */
function enableLiveWeatherOnPopups() {
    // Make the enhancement function globally available
    window.enhancePopupWithLiveWeather = enhancePopupWithLiveWeather;
    window.createEnhancedRigPopup = createEnhancedRigPopup;
    
    console.log('✅ Live weather popup integration enabled');
    console.log('   Use: window.enhancePopupWithLiveWeather(platformId, lat, lon, existingContent)');
    console.log('   Or:  window.createEnhancedRigPopup(rigData)');
}

// Auto-enable when loaded
if (typeof window !== 'undefined') {
    // Wait for weather manager to be available
    const checkWeatherManager = () => {
        if (window.weatherManager) {
            enableLiveWeatherOnPopups();
        } else {
            setTimeout(checkWeatherManager, 1000);
        }
    };
    
    checkWeatherManager();
}

export { enhancePopupWithLiveWeather, createEnhancedRigPopup, enableLiveWeatherOnPopups };
