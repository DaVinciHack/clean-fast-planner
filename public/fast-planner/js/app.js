/**
 * Main application code for Fast Planner
 */

// Store aircraft types globally for access in route calculations
window.aircraftTypes = DEFAULT_AIRCRAFT_TYPES;

// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('Fast Planner application starting...');
  
  // Initialize the map
  initMap();
  
  // Set up UI event handlers
  setupEventHandlers();
  
  // Check for authentication token
  checkAuthenticationStatus();
});

/**
 * Check for authentication token and update UI
 */
function checkAuthenticationStatus() {
  // First try to get token from our app's storage
  let token = getStoredToken();
  
  // If no token found, check if we're embedded in the main app
  if (!token && window.parent !== window) {
    try {
      // Attempt to access the parent window's localStorage (if same origin)
      const mainAppAuthItem = window.parent.localStorage.getItem('auth');
      if (mainAppAuthItem) {
        try {
          const parsedAuth = JSON.parse(mainAppAuthItem);
          if (parsedAuth && parsedAuth.token) {
            console.log('Found authentication token in parent window');
            token = parsedAuth.token;
            // Store it in our session for future use
            sessionStorage.setItem('PALANTIR_TOKEN', token);
          }
        } catch (e) {
          console.warn('Error parsing parent window auth:', e);
        }
      }
    } catch (e) {
      console.warn('Could not access parent window localStorage (likely cross-origin):', e);
    }
  }
  
  const userInfo = token ? extractUserInfoFromToken(token) : null;
  updateAuthUI(token, userInfo);
}

/**
 * Get stored authentication token
 * @returns {string|null} Token or null if not found
 */
function getStoredToken() {
  // Try sessionStorage first
  const sessionToken = sessionStorage.getItem('PALANTIR_TOKEN');
  if (sessionToken) {
    return sessionToken;
  }
  
  // Then try cookie
  const cookieMatch = document.cookie.match(/PALANTIR_TOKEN=([^;]+)/);
  if (cookieMatch && cookieMatch[1]) {
    return cookieMatch[1];
  }
  
  return null;
}

/**
 * Extract user info from JWT token
 * @param {string} token JWT token
 * @returns {Object|null} User info or null if invalid token
 */
function extractUserInfoFromToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      
      return {
        email: payload.email || payload.sub || null,
        name: payload.name || null
      };
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
  
  return null;
}

/**
 * Update authentication UI based on token and user info
 * @param {string|null} token Auth token
 * @param {Object|null} userInfo User info
 */
function updateAuthUI(token, userInfo) {
  const authMessage = document.getElementById('auth-message');
  const loginButton = document.getElementById('login-button');
  
  if (token) {
    authMessage.innerHTML = `Connected to Foundry${userInfo?.email ? ' as ' + userInfo.email : ''}`;
    authMessage.className = 'auth-success';
    loginButton.textContent = 'Logout';
    loginButton.onclick = handleLogout;
    loginButton.href = '#';
    
    // If map is loaded, automatically load rig data
    if (map && map.loaded()) {
      console.log('User is authenticated and map is loaded, automatically loading rig data');
      setTimeout(() => loadRigData(), 500); // Small delay to ensure map is fully loaded
    } else {
      console.log('User is authenticated but map is not yet loaded, waiting for map');
      const checkMapLoaded = setInterval(() => {
        if (map && map.loaded()) {
          clearInterval(checkMapLoaded);
          console.log('Map now loaded, loading rig data');
          loadRigData();
        }
      }, 500);
      
      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkMapLoaded), 10000);
    }
  } else {
    authMessage.innerHTML = 'Not connected to Foundry';
    authMessage.className = 'auth-error';
    loginButton.textContent = 'Login to Foundry';
    // Keep original href for login
  }
}

/**
 * Handle logout action
 * @param {Event} e Click event
 */
function handleLogout(e) {
  e.preventDefault();
  
  // Clear token from storage
  sessionStorage.removeItem('PALANTIR_TOKEN');
  document.cookie = 'PALANTIR_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Update UI
  updateAuthUI(null, null);
  
  return false;
}

/**
 * Set up UI event handlers
 */
function setupEventHandlers() {
  console.log('Setting up event handlers');
  
  // Clear route button
  const clearRouteButton = document.getElementById('clear-route');
  if (clearRouteButton) {
    clearRouteButton.addEventListener('click', function() {
      clearRoute();
    });
  }
  
  // Load rig data button
  const loadRigDataButton = document.getElementById('load-rig-data');
  if (loadRigDataButton) {
    loadRigDataButton.addEventListener('click', function() {
      loadRigData();
    });
  }
  
  // Toggle chart visibility
  const toggleChartButton = document.getElementById('toggle-chart');
  if (toggleChartButton) {
    toggleChartButton.addEventListener('click', function() {
      toggleChartVisibility();
    });
  }
  
  // Load custom chart button
  const loadCustomChartButton = document.getElementById('load-custom-chart');
  if (loadCustomChartButton) {
    loadCustomChartButton.addEventListener('click', function() {
      const chartInput = document.getElementById('chart-input');
      if (chartInput) {
        chartInput.click();
      }
    });
  }
  
  // Chart input change for custom uploads
  const chartInput = document.getElementById('chart-input');
  if (chartInput) {
    chartInput.addEventListener('change', function(e) {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        loadCustomChart(file);
      }
    });
  }
  
  // Aircraft type change
  const aircraftTypeSelect = document.getElementById('aircraft-type');
  if (aircraftTypeSelect) {
    aircraftTypeSelect.addEventListener('change', function() {
      // Update route stats if we have waypoints
      if (typeof waypoints !== 'undefined' && waypoints.length >= 2) {
        updateRoute();
      }
    });
  }
  
  // Payload weight change
  const payloadWeightInput = document.getElementById('payload-weight');
  if (payloadWeightInput) {
    payloadWeightInput.addEventListener('input', function() {
      // Update route stats if we have waypoints
      if (typeof waypoints !== 'undefined' && waypoints.length >= 2) {
        updateRoute();
      }
    });
  }
  
  // Reserve fuel change
  const reserveFuelInput = document.getElementById('reserve-fuel');
  if (reserveFuelInput) {
    reserveFuelInput.addEventListener('input', function() {
      // Update route stats if we have waypoints
      if (typeof waypoints !== 'undefined' && waypoints.length >= 2) {
        updateRoute();
      }
    });
  }
  
  // Add stop button
  const addStopBtn = document.getElementById('add-stop-btn');
  if (addStopBtn) {
    addStopBtn.addEventListener('click', function() {
      // Add a blank stop (center of map)
      const center = map.getCenter();
      addWaypoint([center.lng, center.lat], 'New Stop');
    });
  }
  
  // Login button click (for logout action only - login uses href)
  const loginButton = document.getElementById('login-button');
  if (loginButton) {
    loginButton.addEventListener('click', function(e) {
      if (loginButton.textContent === 'Logout') {
        e.preventDefault();
        handleLogout(e);
        return false;
      }
    });
  }
}

/**
 * Load rig data
 */
function loadRigData() {
  console.log('Loading rig data...');
  
  // Check if map is available
  if (!map) {
    console.error('Map is not initialized');
    return;
  }
  
  document.getElementById('loading-overlay').textContent = 'Loading rig data...';
  document.getElementById('loading-overlay').style.display = 'block';
  
  // Wait for map to be fully loaded
  const waitForMap = () => {
    if (map.loaded()) {
      // Get static platform data (since we can't access real Foundry data directly)
      const platforms = [
        { name: "Mars", coordinates: [-90.966, 28.1677], operator: "Shell" },
        { name: "Perdido", coordinates: [-94.9025, 26.1347], operator: "Shell" },
        { name: "Thunder Horse", coordinates: [-88.4957, 28.1912], operator: "BP" },
        { name: "Olympus", coordinates: [-90.9772, 28.1516], operator: "Shell" },
        { name: "Appomattox", coordinates: [-91.654, 28.968], operator: "Shell" },
        { name: "Atlantis", coordinates: [-90.1675, 27.1959], operator: "BP" },
        { name: "Mad Dog", coordinates: [-90.9122, 27.3389], operator: "BP" },
        { name: "Auger", coordinates: [-92.4458, 27.5483], operator: "Shell" },
        { name: "Hoover Diana", coordinates: [-94.6894, 26.9333], operator: "ExxonMobil" },
        { name: "Genesis", coordinates: [-90.8597, 27.7778], operator: "Chevron" },
        { name: "Ram Powell", coordinates: [-88.1111, 29.0736], operator: "Shell" },
        { name: "Ursa", coordinates: [-89.7875, 28.1539], operator: "Shell" },
        { name: "Holstein", coordinates: [-90.5397, 27.3217], operator: "BHP" },
        { name: "Brutus", coordinates: [-90.6506, 27.7978], operator: "Shell" },
        { name: "Amberjack", coordinates: [-90.5703, 28.5983], operator: "Talos Energy" }
      ];
      
      // Add platforms to map
      addPlatformsToMap(platforms);
      
      // Make "Hide Rigs" button visible
      document.getElementById('toggle-chart').style.display = 'inline-block';
      document.getElementById('toggle-chart').textContent = 'Hide Rigs';
      
      // Hide loading overlay
      document.getElementById('loading-overlay').style.display = 'none';
    } else {
      // Wait for map to load
      map.once('load', () => {
        loadRigData();
      });
    }
  };
  
  waitForMap();
}

/**
 * Load a custom chart/image
 * @param {File} file Image file
 */
function loadCustomChart(file) {
  console.log('Loading custom chart:', file.name);
  
  document.getElementById('loading-overlay').textContent = 'Loading custom chart...';
  document.getElementById('loading-overlay').style.display = 'block';
  
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // Create an image from the file
    const img = new Image();
    
    img.onload = function() {
      // Get current map bounds
      const bounds = map.getBounds();
      const nw = bounds.getNorthWest();
      const se = bounds.getSouthEast();
      
      // Remove existing custom chart if any
      if (map.getLayer('custom-chart-layer')) {
        map.removeLayer('custom-chart-layer');
      }
      if (map.getSource('custom-chart-source')) {
        map.removeSource('custom-chart-source');
      }
      
      // Add the image as a source
      map.addSource('custom-chart-source', {
        'type': 'image',
        'url': e.target.result,
        'coordinates': [
          [nw.lng, nw.lat], // top-left
          [se.lng, nw.lat], // top-right
          [se.lng, se.lat], // bottom-right
          [nw.lng, se.lat]  // bottom-left
        ]
      });
      
      // Add a layer using the source
      map.addLayer({
        'id': 'custom-chart-layer',
        'type': 'raster',
        'source': 'custom-chart-source',
        'paint': {
          'raster-opacity': 0.7 // Adjust transparency
        }
      });
      
      // Hide loading overlay
      document.getElementById('loading-overlay').style.display = 'none';
    };
    
    img.onerror = function() {
      alert('Failed to load the selected image file.');
      document.getElementById('loading-overlay').style.display = 'none';
    };
    
    img.src = e.target.result;
  };
  
  reader.onerror = function() {
    alert('Failed to read the selected file.');
    document.getElementById('loading-overlay').style.display = 'none';
  };
  
  reader.readAsDataURL(file);
}