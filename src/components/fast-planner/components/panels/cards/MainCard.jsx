import React from 'react';
import RegionSelector from '../../controls/RegionSelector';

/**
 * MainCard Component
 * 
 * Contains the main controls including region selection, aircraft configuration,
 * and route statistics from the original RightPanel component.
 */
const MainCard = ({
  onClearRoute,
  onLoadRigData,
  onToggleChart,
  chartsVisible,
  aircraftType,
  onAircraftTypeChange,
  aircraftRegistration,
  onAircraftRegistrationChange,
  selectedAircraft,
  aircraftsByType,
  aircraftLoading,
  routeStats,
  isAuthenticated,
  authUserName,
  rigsLoading,
  onLogin,
  // Region selector props
  regions = [],
  currentRegion = null,
  onRegionChange = () => {},
  regionLoading = false,
  // Read-only values from settings
  reserveFuel = 600,
}) => {
  return (
    <div className="tab-content main-tab">
      <div className="panel-header">
        <div className="region-selector-container">
          <RegionSelector
            regions={regions}
            currentRegion={currentRegion}
            onRegionChange={onRegionChange}
            isLoading={regionLoading}
          />
        </div>
      </div>
      
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
        {/* Simple aircraft type selection dropdown */}
        <select 
          id="aircraft-type" 
          value={aircraftType === '' ? 'select' : aircraftType}
          onChange={(e) => {
            // Get the actual value ('' for 'select', otherwise the type)
            const value = e.target.value === 'select' ? '' : e.target.value;
            console.log(`Aircraft type dropdown changed to: ${value || 'empty'}`);
            
            // Call handler to update the type filter
            onAircraftTypeChange(value);
            
            // When changing aircraft type, clear the aircraft registration
            if (onAircraftRegistrationChange) {
              onAircraftRegistrationChange('');
            }
          }}
          disabled={aircraftLoading}
          className="aircraft-type-dropdown"
        >
          {/* Only one "Change Aircraft Type" option */}
          <option value="select">-- Change Aircraft Type --</option>
          
          {aircraftLoading ? (
            <option value="" disabled>
              Loading...
            </option>
          ) : (
            // Even if we're not loading, check if we have aircraft data
            aircraftsByType && Object.keys(aircraftsByType).length > 0 ? (
              // Map through all available types, regardless of whether they have aircraft or not
              // This matches the behavior of the original component
              Object.keys(aircraftsByType)
                .sort() // Sort alphabetically 
                .map(type => {
                  // Create friendly display names
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
                    case 'A109E': displayName = 'A109E'; break;
                    default: displayName = type;
                  }
                  
                  // Get the actual count of aircraft for this type
                  const actualCount = (aircraftsByType[type] || []).length;
                  
                  // Only show the type if it has aircraft available
                  if (actualCount > 0) {
                    return (
                      <option key={type} value={type}>
                        {displayName} ({actualCount})
                      </option>
                    );
                  } else {
                    // Don't return anything for empty types
                    return null;
                  }
                })
                // Filter out null values from the map
                .filter(Boolean)
            ) : (
              // If no types at all, show a placeholder
              <option value="" disabled>No aircraft types available</option>
            )
          )}
        </select>
        
        <label htmlFor="aircraft-registration">Aircraft Registration:</label>
        <select 
          id="aircraft-registration" 
          value={aircraftRegistration}
          onChange={(e) => {
            const newReg = e.target.value;
            console.log(`Aircraft registration changed to: ${newReg || 'empty'}`);
            
            if (newReg) {
              console.log('Specific aircraft selected, passing to parent component');
              
              // Call the handler to select the aircraft - let React handle the state
              onAircraftRegistrationChange(newReg);
              
              // Don't manipulate DOM directly, just let React state flow update UI
              console.log('Aircraft selection processed, parent component will handle updates');
            } else {
              // Just call the parent handler normally for empty selection
              onAircraftRegistrationChange(newReg);
            }
          }}
          // Only disable if loading or if there are no aircraft available at all
          disabled={aircraftLoading || 
                  (aircraftType && aircraftsByType && 
                    (!aircraftsByType[aircraftType] || aircraftsByType[aircraftType].length === 0))}
        >
          <option value="">-- Select Aircraft --</option>
          
          {aircraftLoading ? (
            <option value="" disabled>
              Loading...
            </option>
          ) : (
            // Start with a check if we have ANY aircraft at all
            Object.values(aircraftsByType).flat().length > 0 ? (
              // If we do have aircraft, check if we're filtering by type or showing all
              !aircraftType || aircraftType === '' ? (
                // No type filter: show all aircraft from all types
                // MODIFIED: Always show selected aircraft at the top of the list if one is selected
                selectedAircraft ? (
                  // If we have a selected aircraft, show it at the top and then all others
                  <>
                    {/* Current selected aircraft at the top */}
                    <option key={selectedAircraft.registration} value={selectedAircraft.registration}>
                      {selectedAircraft.registration}
                    </option>
                    
                    {/* Show all other aircraft except the selected one */}
                    {[...Object.values(aircraftsByType).flat()]
                      .filter(aircraft => aircraft && aircraft.registration !== selectedAircraft.registration) 
                      .sort((a, b) => (a.registration || '').localeCompare(b.registration || ''))
                      .map(aircraft => (
                        <option key={aircraft.registration} value={aircraft.registration}>
                          {aircraft.registration}
                        </option>
                      ))}
                  </>
                ) : (
                  // No selected aircraft, show all aircraft normally
                  [...Object.values(aircraftsByType).flat()]
                    .filter(aircraft => aircraft) // Ensure we have valid aircraft objects
                    .sort((a, b) => (a.registration || '').localeCompare(b.registration || ''))
                    .map(aircraft => (
                      <option key={aircraft.registration} value={aircraft.registration}>
                        {aircraft.registration}
                      </option>
                    ))
                )
              ) : (
                // Type filter: check if we have aircraft of this type
                aircraftsByType[aircraftType] && aircraftsByType[aircraftType].length > 0 ? (
                  // Show aircraft for the selected type
                  // MODIFIED: Always show selected aircraft at the top if it's of this type
                  selectedAircraft && selectedAircraft.modelType === aircraftType ? (
                    // If we have a selected aircraft of this type, show it at the top and then all others
                    <>
                      {/* Current selected aircraft at the top */}
                      <option key={selectedAircraft.registration} value={selectedAircraft.registration}>
                        {selectedAircraft.registration}
                      </option>
                      
                      {/* Show all other aircraft of this type except the selected one */}
                      {[...aircraftsByType[aircraftType]]
                        .filter(aircraft => aircraft && aircraft.registration !== selectedAircraft.registration)
                        .sort((a, b) => (a.registration || '').localeCompare(b.registration || ''))
                        .map(aircraft => (
                          <option key={aircraft.registration} value={aircraft.registration}>
                            {aircraft.registration}
                          </option>
                        ))}
                    </>
                  ) : (
                    // No selected aircraft of this type, show all aircraft of this type normally
                    [...aircraftsByType[aircraftType]]
                      .sort((a, b) => (a.registration || '').localeCompare(b.registration || ''))
                      .map(aircraft => (
                        <option key={aircraft.registration} value={aircraft.registration}>
                          {aircraft.registration}
                        </option>
                      ))
                  )
                ) : (
                  // No aircraft of this type
                  <option value="" disabled>
                    No {aircraftType} aircraft available in this region
                  </option>
                )
              )
            ) : (
              // No aircraft available at all
              <option value="" disabled>
                No aircraft available in this region
              </option>
            )
          )}
        </select>
        
        {/* Status indicators */}
        <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>
          {!aircraftLoading && aircraftsByType && aircraftType && aircraftsByType[aircraftType] ? (
            <span>
              {aircraftsByType[aircraftType].length > 0 ? 
                `${aircraftsByType[aircraftType].length} ${aircraftType} aircraft available` : 
                `No ${aircraftType} aircraft in this region`}
            </span>
          ) : null}
        </div>
        
        {/* Show the selected aircraft registration at the bottom with type */}
        <div className="selected-aircraft">
          <label>Selected Aircraft:</label>
          <div className="selected-aircraft-display" id="selected-aircraft-display" style={{
            fontWeight: 'bold',
            color: selectedAircraft ? '#4285f4' : '#666'
          }}>
            {selectedAircraft ? (
              <>
                {/* Extract registration without region */}
                {selectedAircraft.registration.split(' (')[0]} 
                {/* Show type instead of region */}
                {selectedAircraft.modelType ? ` (${selectedAircraft.modelType})` : ''}
              </>
            ) : "None Selected"}
          </div>
        </div>
        
        {/* Aircraft data grid - only shown when aircraft is selected */}
        {selectedAircraft && (
          <div className="aircraft-data-grid">
            {/* Cruise Speed */}
            <div className="aircraft-data-item">
              <div className="icon">✈️</div>
              <div className="label">Cruise Speed</div>
              <div className="value">
                {selectedAircraft.cruiseSpeed || 145}
                <span className="unit">kts</span>
              </div>
            </div>
            
            {/* Fuel Flow */}
            <div className="aircraft-data-item">
              <div className="icon">⛽</div>
              <div className="label">Fuel Flow</div>
              <div className="value">
                {selectedAircraft.fuelBurn || 1100}
                <span className="unit">lbs/hr</span>
              </div>
            </div>
            
            {/* Max Passengers */}
            <div className="aircraft-data-item">
              <div className="icon">👥</div>
              <div className="label">Max Pax</div>
              <div className="value">
                {selectedAircraft.maxPassengers || 19}
              </div>
            </div>
            
            {/* Max Fuel */}
            <div className="aircraft-data-item">
              <div className="icon">🔋</div>
              <div className="label">Max Fuel</div>
              <div className="value">
                {selectedAircraft.maxFuel || 5000}
                <span className="unit">lbs</span>
              </div>
            </div>
            
            {/* Useful Load */}
            <div className="aircraft-data-item">
              <div className="icon">⚖️</div>
              <div className="label">Useful Load</div>
              <div className="value">
                {selectedAircraft.usefulLoad || 7000}
                <span className="unit">lbs</span>
              </div>
            </div>
            
            {/* Reserve Fuel - read-only display from settings */}
            <div className="aircraft-data-item">
              <div className="icon">🔄</div>
              <div className="label">Reserve</div>
              <div className="value">
                {reserveFuel}
                <span className="unit">lbs</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="control-section">
        <h4>Route Statistics</h4>
        <div id="route-stats" className="route-stats">
          <div><strong>Total Distance:</strong> <span id="total-distance">{routeStats?.totalDistance || '0'}</span> nm</div>
          <div><strong>Estimated Time:</strong> <span id="estimated-time">{routeStats?.estimatedTime || '00:00'}</span></div>
          <div><strong>Fuel Required:</strong> <span id="fuel-required">{routeStats?.fuelRequired || '0'}</span> lbs</div>
          <div><strong>Usable Load:</strong> <span id="usable-load">{routeStats?.usableLoad || '0'}</span> lbs</div>
          <div><strong>Max Passengers:</strong> <span id="max-passengers">{routeStats?.maxPassengers || '0'}</span></div>
          {routeStats?.legs && (
            <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
              <strong>Route Legs:</strong>
              <div style={{ maxHeight: '100px', overflowY: 'auto', marginTop: '5px' }}>
                {routeStats.legs.map((leg, index) => (
                  <div key={index} style={{ marginBottom: '2px' }}>
                    Leg {index + 1}: {leg.distance} nm
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
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
  );
};

export default MainCard;