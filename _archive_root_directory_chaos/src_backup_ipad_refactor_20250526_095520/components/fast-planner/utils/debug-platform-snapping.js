/**
 * debug-platform-snapping.js
 * 
 * This script adds debug output to help diagnose platform snapping issues
 * and fixes the platform manager's findNearestPlatform functionality.
 */

console.log('🔍 Debug platform snapping initialized');

// Wait for all necessary managers to be available
const waitForManagers = (callback) => {
  if (window.platformManager && window.mapManager && window.mapManager.getMap()) {
    callback();
    return;
  }

  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (window.platformManager && window.mapManager && window.mapManager.getMap()) {
      clearInterval(interval);
      callback();
    } else if (attempts >= 40) { // 20 seconds
      clearInterval(interval);
      console.error('📍 Timeout waiting for managers');
    }
  }, 500);
};

// Add debug functions to platform manager
waitForManagers(() => {
  console.log('🔍 Adding platform snapping debug functions');
  
  if (!window.platformManager) {
    console.error('📍 platformManager not available');
    return;
  }

  if (!window.turf) {
    console.error('📍 turf.js not available - platform snapping depends on it');
    
    // Try to define a basic implementation of turf.distance and turf.point
    window.turf = window.turf || {};
    window.turf.point = window.turf.point || function(coords) {
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {}
      };
    };
    
    window.turf.distance = window.turf.distance || function(point1, point2, options) {
      const lat1 = point1.geometry ? point1.geometry.coordinates[1] : point1[1];
      const lon1 = point1.geometry ? point1.geometry.coordinates[0] : point1[0];
      const lat2 = point2.geometry ? point2.geometry.coordinates[1] : point2[1];
      const lon2 = point2.geometry ? point2.geometry.coordinates[0] : point2[0];
      
      // Simple distance calculation using Haversine formula
      // Convert from degrees to radians
      const toRad = function(degree) {
        return degree * Math.PI / 180;
      };
      
      const R = 6371; // Radius of the earth in km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distanceKm = R * c; // Distance in km
      
      // If nautical miles requested
      if (options && options.units === 'nauticalmiles') {
        return distanceKm * 0.539957; // 1 km = 0.539957 nautical miles
      }
      
      return distanceKm;
    };
    
    console.log('📍 Defined a basic implementation of turf.js');
  }
  
  // Start by debugging what platforms are available
  console.log('📍 Platforms available:', window.platformManager.platforms ? window.platformManager.platforms.length : 0);
  if (window.platformManager.platforms && window.platformManager.platforms.length > 0) {
    // Log a few samples for debugging
    console.log('📍 Sample platforms:', window.platformManager.platforms.slice(0, 3));
  }
  
  // Store the original method
  const originalFindNearestPlatform = window.platformManager.findNearestPlatform;
  
  // Fix the findNearestPlatform method with detailed logging
  window.platformManager.findNearestPlatform = function(lat, lng, maxDistance = 5) {
    console.log(`📍 findNearestPlatform called with lat=${lat}, lng=${lng}, maxDistance=${maxDistance}`);
    
    if (!this.platforms || this.platforms.length === 0) {
      console.log('📍 No platforms loaded, cannot find nearest platform');
      return null;
    }
    
    if (!window.turf) {
      console.error('📍 Turf.js not loaded');
      return null;
    }
    
    try {
      let nearestPlatform = null;
      let minDistance = Number.MAX_VALUE;
      
      console.log(`📍 Searching through ${this.platforms.length} platforms...`);
      
      this.platforms.forEach(platform => {
        // Skip if platform has no coordinates
        if (!platform.coordinates || platform.coordinates.length !== 2) {
          return;
        }
        
        const coords = platform.coordinates;
        
        try {
          const distance = window.turf.distance(
            window.turf.point([lng, lat]),
            window.turf.point(coords),
            { units: 'nauticalmiles' }
          );
          
          if (distance < minDistance) {
            minDistance = distance;
            nearestPlatform = {
              name: platform.name,
              operator: platform.operator,
              coords: coords,
              coordinates: coords,
              lat: coords[1],
              lng: coords[0],
              distance: distance
            };
          }
        } catch (err) {
          console.error('📍 Error calculating distance:', err);
        }
      });
      
      // Only return if within reasonable distance
      if (minDistance <= maxDistance) {
        console.log(`📍 Found nearest platform ${nearestPlatform.name} at distance ${nearestPlatform.distance.toFixed(2)} nm`);
        
        // Add visual debugging
        const map = window.mapManager.getMap();
        if (map) {
          // Add a temporary marker to show the nearest platform that was found
          try {
            const el = document.createElement('div');
            el.className = 'debug-nearest-platform';
            el.style.width = '16px';
            el.style.height = '16px';
            el.style.borderRadius = '8px';
            el.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
            el.style.border = '2px solid white';
            
            // Create a popup to show details
            const popup = new window.mapboxgl.Popup({
              closeButton: true,
              closeOnClick: false
            })
              .setLngLat(nearestPlatform.coordinates)
              .setHTML(`
                <div>
                  <strong>Nearest Platform</strong><br>
                  Name: ${nearestPlatform.name}<br>
                  Distance: ${nearestPlatform.distance.toFixed(2)} nm
                </div>
              `);
            
            const marker = new window.mapboxgl.Marker(el)
              .setLngLat(nearestPlatform.coordinates)
              .setPopup(popup)
              .addTo(map);
            
            // Remove after 5 seconds
            setTimeout(() => {
              marker.remove();
            }, 5000);
          } catch (err) {
            console.error('📍 Error showing debug marker:', err);
          }
        }
        
        return nearestPlatform;
      } else if (nearestPlatform) {
        console.log(`📍 Nearest platform ${nearestPlatform.name} is too far (${nearestPlatform.distance.toFixed(2)} nm > ${maxDistance} nm)`);
      }
    } catch (error) {
      console.error('📍 Error finding nearest platform:', error);
    }
    
    return null;
  };
  
  console.log('📍 Platform snapping debug and fix applied');
});
