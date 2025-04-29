import React from 'react';

/**
 * Right Panel Component
 * 
 * Contains controls, aircraft configuration and route statistics
 */
const RightPanel = ({
  visible,
  onToggleVisibility,
  onClearRoute,
  onLoadRigData,
  onToggleChart,
  onLoadCustomChart,
  chartsVisible,
  aircraftType,
  onAircraftTypeChange,
  aircraftRegistration,
  onAircraftRegistrationChange,
  aircraftsByType,
  aircraftLoading,
  payloadWeight,
  onPayloadWeightChange,
  reserveFuel,
  onReserveFuelChange,
  routeStats,
  waypoints,
  onRemoveWaypoint,
  isAuthenticated,
  authUserName,
  rigsLoading,
  onLogin
}) => {
  
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onLoadCustomChart) {
        onLoadCustomChart(file);
      }
    }
  };
  
  return (
    <>
      {/* Right panel toggle tab */}
      <div 
        className="panel-tab right-panel-tab" 
        onClick={onToggleVisibility}
      >
        {visible ? 'Hide →' : '← Controls'}
      </div>
      
      <div id="info-panel" className={`info-panel ${!visible ? "hidden" : ""}`}>
        <h3>Gulf of Mexico Fast Planner</h3>
        <p style={{ fontSize: "0.8em", color: "var(--label-color)", margin: "0 0 10px 0" }}>
          Click on map to add waypoints or use Route Editor
        </p>
        
        <div className="control-section">
          <button 
            id="clear-route" 
            className="control-button" 
            onClick={onClearRoute}
          >
            Clear Route
          </button>
          <button 
            id="toggle-chart" 
            className="control-button" 
            style={{ display: chartsVisible !== null ? "inline-block" : "none" }}
            onClick={onToggleChart}
          >
            {chartsVisible ? 'Hide Rigs' : 'Show Rigs'}
          </button>
          {/* Manual reload button - hidden by default but useful for development */}
          <button 
            id="reload-data" 
            className="control-button" 
            onClick={onLoadRigData}
            disabled={rigsLoading}
            style={{ display: 'none' }} /* Hidden by default */
          >
            {rigsLoading ? 'Loading...' : 'Reload Data'}
          </button>
        </div>
        
        <div className="control-section">
          <h4>Aircraft Configuration</h4>
          <label htmlFor="aircraft-type">Aircraft Type:</label>
          {/* Improved aircraft type selection dropdown that doesn't require an extra click */}
          <select 
            id="aircraft-type" 
            value={aircraftType || ''}
            onChange={(e) => {
              // When a selection is made, immediately reset back to the empty option
              // This allows selecting another type right away
              onAircraftTypeChange(e.target.value);
              
              // Immediately reset the dropdown to the empty option
              if (e.target.value) {
                setTimeout(() => {
                  // Use setTimeout to ensure the current selection is processed first
                  const dropdown = document.getElementById('aircraft-type');
                  if (dropdown) {
                    dropdown.value = '';
                  }
                }, 100);
              }
            }}
            disabled={aircraftLoading}
            className="aircraft-type-dropdown"
          >
            {/* Clear option - always first, with better wording */}
            <option value="">-- Change Aircraft Type --</option>
            
            {aircraftLoading ? (
              <option value="" disabled>Loading...</option>
            ) : aircraftsByType && Object.keys(aircraftsByType).some(type => aircraftsByType[type] && aircraftsByType[type].length > 0) ? (
              // Show all types that have aircraft in this region
              Object.keys(aircraftsByType)
                .filter(type => type && aircraftsByType[type] && aircraftsByType[type].length > 0)
                .sort() // Sort alphabetically
                .map(type => {
                  let displayName;
                  switch(type) {
                    case 'S92': displayName = 'Sikorsky S-92'; break;
                    case 'S76': displayName = 'Sikorsky S-76'; break;
                    case 'S76D': displayName = 'Sikorsky S-76D'; break;
                    case 'AW139': displayName = 'Leonardo AW139'; break;
                    case 'AW189': displayName = 'Leonardo AW189'; break;
                    case 'H175': displayName = 'Airbus H175'; break;
                    case 'H160': displayName = 'Airbus H160'; break;
                    case 'EC135': displayName = 'Airbus EC135'; break;
                    case 'EC225': displayName = 'Airbus EC225'; break;
                    case 'AS350': displayName = 'Airbus AS350'; break;
                    case 'A119': displayName = 'Leonardo A119'; break;
                    default: displayName = type;
                  }
                  // Double-check the actual count to prevent incorrect numbers
                  const actualCount = (aircraftsByType[type] || []).length;
                  return (
                    <option key={type} value={type}>
                      {displayName} ({actualCount})
                    </option>
                  );
                })
            ) : (
              <option value="" disabled>No aircraft available in this region</option>
            )}
          </select>
          
          <label htmlFor="aircraft-registration">Aircraft Registration:</label>
          <select 
            id="aircraft-registration" 
            value={aircraftRegistration}
            onChange={(e) => onAircraftRegistrationChange(e.target.value)}
            disabled={aircraftLoading || !aircraftType || (aircraftsByType && (!aircraftsByType[aircraftType] || aircraftsByType[aircraftType].length === 0))}
          >
            <option value="">-- Select Aircraft --</option>
            {aircraftLoading ? (
              <option value="" disabled>Loading aircraft data...</option>
            ) : aircraftsByType && aircraftsByType[aircraftType] && aircraftsByType[aircraftType].length > 0 ? (
              // Show filtered aircraft for this type, sorted alphabetically
              [...aircraftsByType[aircraftType]]
                .sort((a, b) => a.registration.localeCompare(b.registration))
                .map(aircraft => (
                  <option key={aircraft.registration} value={aircraft.registration}>
                    {aircraft.registration}
                  </option>
                ))
            ) : (
              // No aircraft available message
              <option value="" disabled>
                No {aircraftType} aircraft available in this region
              </option>
            )}
          </select>
          
          {/* Status indicators */}
          <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>
            {aircraftLoading ? (
              <span>Loading aircraft data...</span>
            ) : aircraftsByType && aircraftType && aircraftsByType[aircraftType] ? (
              <span>
                {aircraftsByType[aircraftType].length > 0 ? 
                  `${aircraftsByType[aircraftType].length} ${aircraftType} aircraft available` : 
                  `No ${aircraftType} aircraft in this region`}
              </span>
            ) : null}
          </div>
          
          <label htmlFor="payload-weight">Payload Weight (lbs):</label>
          <input 
            type="number" 
            id="payload-weight" 
            value={payloadWeight}
            min="0" 
            max="10000"
            onChange={(e) => onPayloadWeightChange(parseInt(e.target.value, 10) || 0)}
          />
          
          <label htmlFor="reserve-fuel">Reserve Fuel (lbs):</label>
          <input 
            type="number" 
            id="reserve-fuel" 
            value={reserveFuel}
            min="0" 
            max="2000"
            onChange={(e) => onReserveFuelChange(parseInt(e.target.value, 10) || 0)}
          />
        </div>
        
        <div className="control-section">
          <h4>Route Statistics</h4>
          <div id="route-stats" className="route-stats">
            <div><strong>Total Distance:</strong> <span id="total-distance">{routeStats?.totalDistance || '0'}</span> nm</div>
            <div><strong>Estimated Time:</strong> <span id="estimated-time">{routeStats?.estimatedTime || '00:00'}</span></div>
            <div><strong>Fuel Required:</strong> <span id="fuel-required">{routeStats?.fuelRequired || '0'}</span> lbs</div>
            <div><strong>Usable Load:</strong> <span id="usable-load">{routeStats?.usableLoad || '0'}</span> lbs</div>
            <div><strong>Max Passengers:</strong> <span id="max-passengers">{routeStats?.maxPassengers || '0'}</span></div>
          </div>
        </div>
        
        {/* Waypoints list removed to avoid duplication - now only shown in left panel */}
        
        <div id="auth-status" className="control-section">
          <h4>Connection Status</h4>
          {/* Add debug info in development */}
          <div style={{fontSize: '10px', color: '#888', marginBottom: '4px'}}>
            Auth state: {String(isAuthenticated)} | User: {authUserName || 'None'}
          </div>
          <div id="auth-message" className={isAuthenticated ? "auth-success" : "auth-error"}>
            {isAuthenticated 
              ? `Connected to Foundry${authUserName ? " as " + authUserName : ""}` 
              : "Not connected to Foundry"}
          </div>
          {!isAuthenticated && (
            <button 
              id="login-button" 
              className="control-button" 
              onClick={(e) => {
                e.preventDefault();
                // Add a visual feedback
                const messageEl = document.getElementById('auth-message');
                if (messageEl) {
                  messageEl.innerHTML = 'Connecting to Foundry...';
                  messageEl.className = 'auth-pending';
                }
                
                // Call the login function
                if (onLogin) {
                  onLogin();
                  
                  // Force immediate UI update - this helps with the visual feedback
                  setTimeout(() => {
                    const authMessage = document.getElementById('auth-message');
                    if (authMessage) {
                      if (window.isFoundryAuthenticated) {
                        authMessage.innerHTML = `Connected to Foundry as Duncan Burbury`;
                        authMessage.className = 'auth-success';
                        
                        // Hide login button
                        const loginBtn = document.getElementById('login-button');
                        if (loginBtn) loginBtn.style.display = 'none';
                      }
                    }
                  }, 2000);
                }
              }}
            >
              Login to Foundry
            </button>
          )}
          {/* Debug button to refresh state */}
          <button 
            style={{
              fontSize: '10px', 
              padding: '2px 4px', 
              backgroundColor: '#555', 
              color: 'white',
              marginTop: '5px',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '3px'
            }}
            onClick={() => {
              console.log("Checking localStorage for auth state...");
              try {
                // Check localStorage
                const storedAuth = localStorage.getItem('fastPlanner_isAuthenticated');
                console.log("localStorage auth state:", storedAuth);
                
                // Force refresh auth state from localStorage
                if (storedAuth === 'true') {
                  console.log("Found true auth state in localStorage, refreshing UI...");
                  
                  // Get user details
                  const userDetails = localStorage.getItem('fastPlanner_userDetails');
                  console.log("User details in localStorage:", userDetails ? "FOUND" : "NOT FOUND");
                  
                  // Create a flash message
                  const loadingOverlay = document.getElementById('loading-overlay');
                  if (loadingOverlay) {
                    loadingOverlay.textContent = 'Refreshing authentication state...';
                    loadingOverlay.style.display = 'block';
                    
                    setTimeout(() => {
                      loadingOverlay.style.display = 'none';
                      window.location.reload(); // Force page reload as a last resort
                    }, 1000);
                  }
                } else {
                  console.log("No valid auth state in localStorage");
                  if (onLogin) {
                    console.log("Calling login function...");
                    onLogin();
                  }
                }
              } catch (e) {
                console.error("Error checking auth state:", e);
              }
            }}
          >
            Refresh connection
          </button>
        </div>
      </div>
    </>
  );
};

export default RightPanel;