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
  
  // Initialize region selector if present
  const regionSelect = document.getElementById('region-select');
  if (regionSelect) {
    // Default to Gulf of Mexico or use URL parameter if present
    const urlParams = new URLSearchParams(window.location.search);
    const regionParam = urlParams.get('region');
    
    if (regionParam) {
      // Find the option with this value
      for (let i = 0; i < regionSelect.options.length; i++) {
        if (regionSelect.options[i].value === regionParam) {
          regionSelect.selectedIndex = i;
          break;
        }
      }
    }
    
    // Update page title based on selected region
    document.title = `Fast Planner - ${regionSelect.options[regionSelect.selectedIndex].text} Edition`;
  }
  
  // Initialize aircraft card with default data
  updateAircraftCard({
    id: 'N603PW',
    type: 'AW139',
    endurance: '2.3',
    missionFuel: '3070',
    fuelUplift: '2039',
    takeoffWeight: '24807',
    operationalRadius: '85'
  });
  
  // DISABLED: We now use React's Authentication Context
  // Check for authentication token
  // checkAuthenticationStatus();
  
  console.log('Legacy auth check disabled - using React authentication context');
});

/**
 * Update the aircraft card at the top of the page
 * @param {Object} aircraftData The aircraft data
 */
function updateAircraftCard(aircraftData) {
  // Update the aircraft ID and type
  if (aircraftData.id && aircraftData.type) {
    document.getElementById('aircraft-id').textContent = `${aircraftData.id} - ${aircraftData.type}`;
  }
  
  // Update the values in the card
  if (aircraftData.endurance) {
    document.getElementById('endurance-value').textContent = aircraftData.endurance;
  }
  
  if (aircraftData.missionFuel) {
    document.getElementById('mission-fuel-value').textContent = aircraftData.missionFuel;
  }
  
  if (aircraftData.fuelUplift) {
    document.getElementById('fuel-uplift-value').textContent = aircraftData.fuelUplift;
  }
  
  if (aircraftData.takeoffWeight) {
    document.getElementById('takeoff-weight-value').textContent = aircraftData.takeoffWeight;
  }
  
  if (aircraftData.operationalRadius) {
    document.getElementById('operational-radius-value').textContent = aircraftData.operationalRadius;
  }
}

/**
 * DISABLED: Check for authentication token and update UI
 * We now use React's Authentication Context instead
 */
function checkAuthenticationStatus() {
  console.log('Legacy authentication check called - this function is deprecated');
  
  // DISABLED - this function should no longer be used
  return;
  
  /*
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
  */
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
 * DISABLED: Update authentication UI based on token and user info
 * We now use React's Authentication Context instead
 * 
 * @param {string|null} token Auth token
 * @param {Object|null} userInfo User info
 */
function updateAuthUI(token, userInfo) {
  console.log('Legacy updateAuthUI called - this function is deprecated');
  
  // This function is now active again but simplified
  const authMessage = document.getElementById('auth-message');
  const loginButton = document.getElementById('login-button');
  
  if (!authMessage || !loginButton) {
    console.log('Auth UI elements not found');
    return;
  }
  
  if (token) {
    authMessage.innerHTML = 'Connected to Foundry';
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
  */
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
  
  // Region selector
  const regionSelect = document.getElementById('region-select');
  if (regionSelect) {
    regionSelect.addEventListener('change', function() {
      // Handle region change
      const selectedRegion = regionSelect.value;
      console.log('Region changed to:', selectedRegion);
      
      // Update page title based on region
      document.title = `Fast Planner - ${regionSelect.options[regionSelect.selectedIndex].text} Edition`;
      
      // Clear any existing route and data
      if (typeof clearRoute === 'function') {
        clearRoute();
      }
      
      // If we have a map and we're authenticated, reload rig data for the selected region
      if (map && map.loaded()) {
        loadRigData(selectedRegion);
      }
    });
  }
  
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
      // Get the selected aircraft type
      const aircraftType = aircraftTypeSelect.value;
      
      // Update aircraft card based on selection
      if (aircraftType === 'aw139') {
        updateAircraftCard({
          id: 'N603PW',
          type: 'AW139',
          endurance: '2.3',
          missionFuel: '3070',
          fuelUplift: '2039',
          takeoffWeight: '24807',
          operationalRadius: '85'
        });
      } else if (aircraftType === 's92') {
        updateAircraftCard({
          id: 'N892PW',
          type: 'S-92',
          endurance: '3.4',
          missionFuel: '4600',
          fuelUplift: '3510',
          takeoffWeight: '26500',
          operationalRadius: '150'
        });
      } else if (aircraftType === 'h175') {
        updateAircraftCard({
          id: 'N175PW',
          type: 'H175',
          endurance: '3.8',
          missionFuel: '3800',
          fuelUplift: '2950',
          takeoffWeight: '17196',
          operationalRadius: '140'
        });
      } else if (aircraftType === 'h160') {
        updateAircraftCard({
          id: 'N160PW',
          type: 'H160',
          endurance: '3.2',
          missionFuel: '2400',
          fuelUplift: '1980',
          takeoffWeight: '13338',
          operationalRadius: '110'
        });
      }
      
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
 * @param {string} region Optional region identifier
 */
function loadRigData(region) {
  const selectedRegion = region || (document.getElementById('region-select') ? 
    document.getElementById('region-select').value : 'gulf-of-mexico');
  
  console.log(`Loading rig data for region: ${selectedRegion}`);
  
  // Check if map is available
  if (!map) {
    console.error('Map is not initialized');
    return;
  }
  
  document.getElementById('loading-overlay').textContent = `Loading rig data for ${selectedRegion}...`;
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