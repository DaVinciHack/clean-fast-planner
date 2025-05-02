import React, { useEffect, useState } from 'react';
import RegionSelector from '../controls/RegionSelector';
import FlightSettings from '../flight/FlightSettings';
import '../../FastPlannerStyles.css';

/**
 * Right Panel Component
 * 
 * Contains controls, aircraft configuration and route statistics
 * with tab system for settings, performance, weather, finance, and evacuation
 */
// This key will force a complete re-render of the RightPanel when needed
let rightPanelRenderKey = 0;

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
  selectedAircraft, // New prop for the third field
  forceUpdate, // To detect when state changes
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
  onLogin,
  // Region selector props
  regions = [],
  currentRegion = null,
  onRegionChange = () => {},
  regionLoading = false,
  // Flight settings props
  deckTimePerStop = 5,
  deckFuelPerStop = 100,
  deckFuelFlow = 400,
  passengerWeight = 220,
  cargoWeight = 0,
  taxiFuel = 50,
  contingencyFuelPercent = 10,
  reserveMethod = 'fixed',
  onDeckTimeChange = () => {},
  onDeckFuelChange = () => {},
  onDeckFuelFlowChange = () => {},
  onPassengerWeightChange = () => {},
  onCargoWeightChange = () => {},
  onTaxiFuelChange = () => {},
  onContingencyFuelPercentChange = () => {},
  onReserveMethodChange = () => {}
}) => {
  
  // Force reset dropdowns when selectedAircraft changes
  useEffect(() => {
    if (selectedAircraft) {
      // When we have a selected aircraft, force the dropdowns to reset properly
      setTimeout(() => {
        // Force DOM reset for the type dropdown
        const typeDropdown = document.getElementById('aircraft-type');
        if (typeDropdown) {
          // Set to "Change Aircraft Type"
          typeDropdown.value = 'select';
          console.log('Reset type dropdown to "-- Change Aircraft Type --"');
        }
        
        // The registration dropdown should still show the selected registration
        const regDropdown = document.getElementById('aircraft-registration');
        if (regDropdown) {
          // Make sure it shows the selected aircraft, not blank
          regDropdown.value = aircraftRegistration;
          console.log(`Set registration dropdown to selected value: ${aircraftRegistration}`);
        }
      }, 50);
    }
  }, [selectedAircraft, aircraftRegistration, forceUpdate]); // Re-run when selectedAircraft or forceUpdate changes
  
  // Initial mount effect - run once
  useEffect(() => {
    console.log("RightPanel mounted");
    
    // Mark that we've mounted - no reloading
    if (!window.rightPanelMounted) {
      window.rightPanelMounted = true;
      
      // Log diagnostic information
      console.log("RightPanel initial mount - aircraft data:", {
        aircraftsByType: aircraftsByType,
        aircraftCount: Object.values(aircraftsByType || {}).flat().length,
        typeCount: Object.keys(aircraftsByType || {}).length
      });
      
      // Display a helpful notification without reloading
      if (Object.keys(aircraftsByType || {}).length === 0) {
        console.log("No aircraft types found after mount - will wait for data to load");
        
        // Create a notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.padding = '10px 15px';
        notification.style.backgroundColor = 'rgba(0, 70, 150, 0.9)';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '10000';
        notification.style.fontFamily = 'sans-serif';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
        notification.textContent = 'Waiting for aircraft data to load...';
        document.body.appendChild(notification);
        
        // Remove after 4 seconds
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 4000);
      }
    }
  }, [aircraftsByType]);
  
  // Debug aircraft data
  useEffect(() => {
    console.log("RightPanel Aircraft Data:", {
      aircraftType,
      aircraftRegistration,
      selectedAircraft,
      aircraftsByTypeKeys: Object.keys(aircraftsByType || {}),
      aircraftsByTypeCount: Object.keys(aircraftsByType || {}).reduce((acc, type) => {
        acc[type] = (aircraftsByType[type] || []).length;
        return acc;
      }, {})
    });
    
    // Check if dropdown has options
    setTimeout(() => {
      const typeDropdown = document.getElementById('aircraft-type');
      if (typeDropdown) {
        console.log("Aircraft Type Dropdown:", {
          options: Array.from(typeDropdown.options || []).map(o => o.value),
          selectedValue: typeDropdown.value,
          optionCount: typeDropdown.options?.length || 0
        });
      }
      
      // Auto-select first type if none selected and we have types
      if (!aircraftType && !selectedAircraft) {
        const availableTypes = Object.keys(aircraftsByType || {})
          .filter(type => (aircraftsByType[type] || []).length > 0);
        
        if (availableTypes.length > 0) {
          console.log(`No type selected, auto-selecting first type: ${availableTypes[0]}`);
          onAircraftTypeChange(availableTypes[0]);
        }
      }
    }, 200);
  }, [aircraftType, aircraftRegistration, selectedAircraft, aircraftsByType, forceUpdate, onAircraftTypeChange]);
  
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      if (onLoadCustomChart) {
        onLoadCustomChart(file);
      }
    }
  };
  
  // Define the available tabs
  const tabs = [
    { id: 'main', name: 'Main' },
    { id: 'settings', name: 'Settings' },
    { id: 'performance', name: 'Performance' },
    { id: 'weather', name: 'Weather' },
    { id: 'finance', name: 'Finance' },
    { id: 'evacuation', name: 'Evacuation' }
  ];
  
  // State for the active tab
  const [activeTab, setActiveTab] = useState('main');
  
  // Render the Main Tab Content
  const renderMainTab = () => (
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
            
            // CRITICAL FIX: In the original code, there are two scenarios:
            // 1. Type dropdown is clicked and a new type is selected
            // 2. Type dropdown is clicked but "-- Change Aircraft Type --" is selected
            
            if (value) {
              // Scenario 1: Selecting a specific type
              console.log('Selecting specific aircraft type:', value);
              
              // If we already had a selected aircraft, clear it
              // This matches the original behavior
              if (selectedAircraft) {
                console.log('Had selected aircraft, clearing it for new type selection');
              }
              
              // Call handler to update the type filter
              onAircraftTypeChange(value);
              
              // And clear the registration dropdown
              const regDropdown = document.getElementById('aircraft-registration');
              if (regDropdown) {
                regDropdown.value = '';
              }
              
              // Clear the selected aircraft when choosing a new type
              if (onAircraftRegistrationChange) {
                onAircraftRegistrationChange('');
              }
            } else {
              // Scenario 2: "-- Change Aircraft Type --" selected
              console.log('Change Aircraft Type selected (empty value)');
              
              // In the original, this shows all aircraft types
              // but keeps the current aircraft selected
              onAircraftTypeChange('');
              
              // If we had a selected aircraft, keep it selected
              if (selectedAircraft && aircraftRegistration) {
                console.log('Keeping selected aircraft while showing all types');
                
                // Make sure registration dropdown still shows selected aircraft
                const regDropdown = document.getElementById('aircraft-registration');
                if (regDropdown) {
                  regDropdown.value = aircraftRegistration;
                }
              }
            }
          }}
          disabled={aircraftLoading}
          className="aircraft-type-dropdown"
          key={`aircraft-type-${forceUpdate}`} // Force re-render when forceUpdate changes
        >
          {/* Only one "Change Aircraft Type" option */}
          <option value="select">-- Change Aircraft Type --</option>
          
          {aircraftLoading ? (
            <option value="" disabled>Loading aircraft data...</option>
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
              console.log('Specific aircraft selected, will reset type dropdown');
              
              // Schedule a reset of the type dropdown
              setTimeout(() => {
                // First call the parent handler to update the state and select the aircraft
                onAircraftRegistrationChange(newReg);
                
                // Then reset the type dropdown to "Change Aircraft Type"
                const typeDropdown = document.getElementById('aircraft-type');
                if (typeDropdown) {
                  typeDropdown.value = 'select';
                  console.log('Reset type dropdown to "-- Change Aircraft Type --"');
                }
              }, 10);
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
            // Show loading indicator while aircraft data is loading
            <option value="" disabled>Loading aircraft data...</option>
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
        
        {/* Show the selected aircraft registration at the bottom with type */}
        <div className="selected-aircraft">
          <label>Selected Aircraft:</label>
          <div className="selected-aircraft-display">
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
            
            {/* Reserve Fuel */}
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

        {/* Compact input layout using the new input-group class */}
        <div className="input-group">
          <div>
            <label htmlFor="payload-weight">Payload:</label>
            <input 
              type="number" 
              id="payload-weight" 
              value={payloadWeight}
              min="0" 
              max="10000"
              onChange={(e) => onPayloadWeightChange(parseInt(e.target.value, 10) || 0)}
            />
            <span className="unit">lbs</span>
          </div>
          <div>
            <label htmlFor="reserve-fuel">Reserve:</label>
            <input 
              type="number" 
              id="reserve-fuel" 
              value={reserveFuel}
              min="0" 
              max="2000"
              onChange={(e) => onReserveFuelChange(parseInt(e.target.value, 10) || 0)}
            />
            <span className="unit">lbs</span>
          </div>
        </div>
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
  );
  
  // Render the Settings Tab Content 
  const renderSettingsTab = () => {
    // Prepare settings for FlightSettings component
    const flightSettings = {
      passengerWeight,
      taxiFuel,
      reserveFuel,
      contingencyFuelPercent,
      deckTimePerStop,
      deckFuelFlow
    };
    
    // Handler for settings changes
    const handleFlightSettingsChange = (newSettings) => {
      console.log("Flight settings changed:", newSettings);
      
      // Log each setting change for debugging
      Object.keys(newSettings).forEach(key => {
        console.log(`Setting ${key} changed to:`, newSettings[key]);
      });
      
      // Update the state for each setting
      if (newSettings.passengerWeight !== undefined) {
        onPassengerWeightChange(newSettings.passengerWeight);
      }
      
      if (newSettings.reserveFuel !== undefined) {
        onReserveFuelChange(newSettings.reserveFuel);
      }
      
      if (newSettings.deckTimePerStop !== undefined) {
        onDeckTimeChange(newSettings.deckTimePerStop);
      }
      
      if (newSettings.deckFuelFlow !== undefined) {
        onDeckFuelFlowChange(newSettings.deckFuelFlow);
      }
      
      if (newSettings.taxiFuel !== undefined) {
        onTaxiFuelChange(newSettings.taxiFuel);
      }
      
      if (newSettings.contingencyFuelPercent !== undefined) {
        onContingencyFuelPercentChange(newSettings.contingencyFuelPercent);
      }
    };
    
    return (
      <div className="tab-content settings-tab">
        <h3>Flight Settings</h3>
        <div className="control-section">
          {/* Render our new FlightSettings component */}
          <FlightSettings 
            settings={flightSettings}
            onSettingsChange={handleFlightSettingsChange}
          />
          
          {/* Additional settings */}
          <h4>Additional Settings</h4>
          
          <div className="input-group">
            <div>
              <label htmlFor="cargo-weight">Additional Cargo:</label>
              <input 
                type="number" 
                id="cargo-weight" 
                value={cargoWeight}
                min="0" 
                max="5000"
                onChange={(e) => onCargoWeightChange(parseInt(e.target.value, 10) || 0)}
              />
              <span className="unit">lbs</span>
            </div>
          </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button 
            className="control-button"
            onClick={() => {
              // Create a flash message to confirm settings are saved
              const loadingOverlay = document.getElementById('loading-overlay');
              if (loadingOverlay) {
                loadingOverlay.textContent = 'Global flight settings saved!';
                loadingOverlay.style.display = 'block';
                
                setTimeout(() => {
                  loadingOverlay.style.display = 'none';
                }, 1500);
              }
              
              // Save to localStorage for persistence as global settings
              try {
                localStorage.setItem('fastPlanner_deckTimePerStop', deckTimePerStop);
                localStorage.setItem('fastPlanner_deckFuelPerStop', deckFuelPerStop);
                localStorage.setItem('fastPlanner_deckFuelFlow', deckFuelFlow);
                localStorage.setItem('fastPlanner_passengerWeight', passengerWeight);
                localStorage.setItem('fastPlanner_cargoWeight', cargoWeight);
                localStorage.setItem('fastPlanner_reserveMethod', reserveMethod);
                localStorage.setItem('fastPlanner_reserveFuel', reserveFuel);
                localStorage.setItem('fastPlanner_taxiFuel', taxiFuel);
                localStorage.setItem('fastPlanner_contingencyFuelPercent', contingencyFuelPercent);
                console.log('Global flight settings saved to localStorage');
              } catch (error) {
                console.error('Error saving settings to localStorage:', error);
              }
            }}
          >
            Save as Global
          </button>
          
          {selectedAircraft && (
            <button 
              className="control-button"
              style={{ 
                backgroundColor: '#006644', 
                backgroundImage: 'linear-gradient(to bottom, #00aa77, #006644)'
              }}
              onClick={() => {
                // Get the key to use for storage
                const storageKey = `aircraft_${selectedAircraft.registration}`;
                
                // Create settings object
                const settings = {
                  deckTimePerStop,
                  deckFuelPerStop,
                  deckFuelFlow,
                  taxiFuel,
                  contingencyFuelPercent,
                  reserveFuel,
                  reserveMethod,
                  passengerWeight,
                  cargoWeight
                };
                
                // Show confirmation message
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                  loadingOverlay.textContent = `Settings saved for ${selectedAircraft.registration}!`;
                  loadingOverlay.style.display = 'block';
                  
                  setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                  }, 1500);
                }
                
                // Call the saveAircraftSettings function via a custom event
                const event = new CustomEvent('save-aircraft-settings', {
                  detail: { key: storageKey, settings }
                });
                window.dispatchEvent(event);
              }}
            >
              Save for {selectedAircraft?.registration?.split(' (')[0]}
            </button>
          )}
          
          {aircraftType && aircraftType !== '' && (
            <button 
              className="control-button"
              style={{ 
                backgroundColor: '#004488', 
                backgroundImage: 'linear-gradient(to bottom, #0066cc, #004488)'
              }}
              onClick={() => {
                // Create settings object
                const settings = {
                  deckTimePerStop,
                  deckFuelPerStop,
                  deckFuelFlow,
                  taxiFuel,
                  contingencyFuelPercent,
                  reserveFuel,
                  reserveMethod,
                  passengerWeight,
                  cargoWeight
                };
                
                // Show confirmation message
                const loadingOverlay = document.getElementById('loading-overlay');
                if (loadingOverlay) {
                  loadingOverlay.textContent = `Settings saved for all ${aircraftType} aircraft!`;
                  loadingOverlay.style.display = 'block';
                  
                  setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                  }, 1500);
                }
                
                // Call the saveAircraftSettings function via a custom event
                const event = new CustomEvent('save-aircraft-settings', {
                  detail: { key: aircraftType, settings }
                });
                window.dispatchEvent(event);
              }}
            >
              Save for {aircraftType} Type
            </button>
          )}
        </div>
      </div>
    </div>
  );
  };
  
  // Render the Performance Tab Content
  const renderPerformanceTab = () => (
    <div className="tab-content performance-tab">
      <h3>Performance Settings</h3>
      <div className="control-section">
        <h4>Take-off & Landing Performance</h4>
        
        <div className="settings-group">
          <div>
            <label htmlFor="temperature">Temperature (°C):</label>
            <input 
              type="number" 
              id="temperature" 
              defaultValue={25}
              min="-20" 
              max="50"
            />
          </div>
          
          <div>
            <label htmlFor="pressure-altitude">Pressure Altitude (ft):</label>
            <input 
              type="number" 
              id="pressure-altitude" 
              defaultValue={0}
              min="0" 
              max="10000"
            />
          </div>
        </div>
        
        <h4>Aircraft Configuration</h4>
        
        <div className="performance-checkbox-group">
          <div>
            <input type="checkbox" id="engine-failure" />
            <label htmlFor="engine-failure">Include Engine Failure Analysis</label>
          </div>
          
          <div>
            <input type="checkbox" id="cat-a" defaultChecked />
            <label htmlFor="cat-a">Apply Category A Procedures</label>
          </div>
        </div>
        
        <button className="control-button">
          Calculate Performance
        </button>
        
        <div className="performance-results">
          <h4>Performance Results</h4>
          <div className="result-item">
            <div className="result-label">Max Takeoff Weight:</div>
            <div className="result-value">17,500 lbs</div>
          </div>
          <div className="result-item">
            <div className="result-label">Weight Limited By:</div>
            <div className="result-value">Cat A Takeoff</div>
          </div>
          <div className="result-item">
            <div className="result-label">Max Passengers:</div>
            <div className="result-value">12</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render the Weather Tab Content
  const renderWeatherTab = () => (
    <div className="tab-content weather-tab">
      <h3>Weather Settings</h3>
      <div className="control-section">
        <h4>Weather Source</h4>
        
        <div className="weather-source-options">
          <div>
            <input type="radio" id="actual-weather" name="weather-source" defaultChecked />
            <label htmlFor="actual-weather">Use Actual Weather</label>
          </div>
          
          <div>
            <input type="radio" id="manual-weather" name="weather-source" />
            <label htmlFor="manual-weather">Manual Weather Entry</label>
          </div>
        </div>
        
        <h4>Wind Settings</h4>
        
        <div className="settings-group">
          <div>
            <label htmlFor="wind-direction">Wind Direction (°):</label>
            <input 
              type="number" 
              id="wind-direction" 
              defaultValue={270}
              min="0" 
              max="359"
            />
          </div>
          
          <div>
            <label htmlFor="wind-speed">Wind Speed (kts):</label>
            <input 
              type="number" 
              id="wind-speed" 
              defaultValue={15}
              min="0" 
              max="100"
            />
          </div>
        </div>
        
        <h4>Visibility & Ceiling</h4>
        
        <div className="settings-group">
          <div>
            <label htmlFor="visibility">Visibility (nm):</label>
            <input 
              type="number" 
              id="visibility" 
              defaultValue={10}
              min="0" 
              max="50"
              step="0.1"
            />
          </div>
          
          <div>
            <label htmlFor="ceiling">Ceiling (ft):</label>
            <input 
              type="number" 
              id="ceiling" 
              defaultValue={3000}
              min="0" 
              max="20000"
              step="100"
            />
          </div>
        </div>
        
        <button className="control-button">
          Apply Weather
        </button>
        
        <div className="weather-data">
          <h4>Current Weather</h4>
          <div className="weather-item">
            <div className="weather-icon">🌤️</div>
            <div className="weather-details">
              <div>Wind: 270° at 15 kts</div>
              <div>Visibility: 10 nm</div>
              <div>Ceiling: 3,000 ft</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render the Finance Tab Content
  const renderFinanceTab = () => (
    <div className="tab-content finance-tab">
      <h3>Finance Calculator</h3>
      <div className="control-section">
        <h4>Flight Cost Parameters</h4>
        
        <label htmlFor="hourly-rate">Hourly Rate (USD):</label>
        <input 
          type="number" 
          id="hourly-rate" 
          defaultValue={4500}
          min="0"
          step="100"
        />
        
        <label htmlFor="landing-fee">Landing Fee (USD):</label>
        <input 
          type="number" 
          id="landing-fee" 
          defaultValue={250}
          min="0"
          step="50"
        />
        
        <label htmlFor="fuel-cost">Fuel Cost (USD/lb):</label>
        <input 
          type="number" 
          id="fuel-cost" 
          defaultValue={3.25}
          min="0"
          step="0.05"
        />
        
        <h4>Contract Details</h4>
        
        <label htmlFor="billing-method">Billing Method:</label>
        <select id="billing-method">
          <option value="hourly">Hourly Rate</option>
          <option value="fixed">Fixed Price</option>
          <option value="mileage">Per Nautical Mile</option>
        </select>
        
        <button className="control-button finance-calculate">
          Calculate Quote
        </button>
        
        <div className="finance-results">
          <h4>Cost Breakdown</h4>
          <div className="finance-item">
            <div className="finance-label">Flight Time Cost:</div>
            <div className="finance-value">$9,900.00</div>
          </div>
          <div className="finance-item">
            <div className="finance-label">Landing Fees:</div>
            <div className="finance-value">$2,500.00</div>
          </div>
          <div className="finance-item">
            <div className="finance-label">Fuel Cost:</div>
            <div className="finance-value">$16,850.00</div>
          </div>
          <div className="finance-item total">
            <div className="finance-label">Total Cost:</div>
            <div className="finance-value">$29,250.00</div>
          </div>
          <div className="finance-item per-passenger">
            <div className="finance-label">Cost Per Passenger (12 pax):</div>
            <div className="finance-value">$2,437.50</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render the Evacuation Tab Content
  const renderEvacuationTab = () => (
    <div className="tab-content evacuation-tab">
      <h3>Evacuation Planner</h3>
      <div className="control-section">
        <h4>Evacuation Parameters</h4>
        
        <label htmlFor="total-evacuees">Total Personnel to Evacuate:</label>
        <input 
          type="number" 
          id="total-evacuees" 
          defaultValue={120}
          min="1"
        />
        
        <label htmlFor="available-aircraft">Available Aircraft:</label>
        <select id="available-aircraft" multiple>
          <option value="N603PW">N603PW (AW139)</option>
          <option value="N604PW">N604PW (AW139)</option>
          <option value="N701BH">N701BH (S92)</option>
          <option value="N702BH">N702BH (S92)</option>
        </select>
        <div className="small-hint">Hold Ctrl/Cmd to select multiple</div>
        
        <label htmlFor="priority-level">Priority Level:</label>
        <select id="priority-level">
          <option value="1">1 - Immediate (Medical Emergency)</option>
          <option value="2">2 - Urgent (Weather Threat)</option>
          <option value="3" selected>3 - Standard Evacuation</option>
          <option value="4">4 - Non-Essential Personnel</option>
        </select>
        
        <button className="control-button evacuation-calculate">
          Calculate Evacuation Plan
        </button>
        
        <div className="evacuation-results">
          <h4>Evacuation Plan</h4>
          <div className="evacuation-summary">
            <div>Total Evacuees: 120</div>
            <div>Total Flights Required: 10</div>
            <div>Estimated Completion Time: 4:30</div>
          </div>
          
          <div className="evacuation-flight-list">
            <h5>Flight Schedule</h5>
            <div className="evacuation-flight">
              <div className="flight-number">Flight 1</div>
              <div className="flight-details">
                <div>N603PW - 12 pax</div>
                <div>Depart: 10:00 - Arrive: 10:45</div>
              </div>
            </div>
            <div className="evacuation-flight">
              <div className="flight-number">Flight 2</div>
              <div className="flight-details">
                <div>N701BH - 19 pax</div>
                <div>Depart: 10:15 - Arrive: 11:00</div>
              </div>
            </div>
            <div className="evacuation-flight">
              <div className="flight-number">Flight 3</div>
              <div className="flight-details">
                <div>N604PW - 12 pax</div>
                <div>Depart: 10:30 - Arrive: 11:15</div>
              </div>
            </div>
            <div className="evacuation-more">+7 more flights...</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Main return
  return (
    <>
      {/* Right panel toggle tab */}
      <div 
        className="panel-tab right-panel-tab main-toggle tab-selector" 
        style={{ top: '50px' }}
        onClick={onToggleVisibility}
      >
        {visible ? 'Hide →' : '← Show'}
      </div>
      
      {/* Tab System */}
      {visible && tabs.map((tab, index) => (
        <div 
          key={tab.id}
          className={`panel-tab right-panel-tab tab-selector tab-${tab.id} ${activeTab === tab.id ? 'active' : ''}`}
          style={{ 
            top: `${120 + index * 98}px`
          }}
          onClick={() => setActiveTab(tab.id)}
          title={tab.name}
        >
          {tab.name}
        </div>
      ))}
      
      <div id="info-panel" className={`info-panel ${!visible ? "hidden" : ""}`}>
        {/* Render appropriate tab content based on active tab */}
        {activeTab === 'main' && renderMainTab()}
        {activeTab === 'settings' && renderSettingsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'weather' && renderWeatherTab()}
        {activeTab === 'finance' && renderFinanceTab()}
        {activeTab === 'evacuation' && renderEvacuationTab()}
      </div>
    </>
  );
};

export default RightPanel;