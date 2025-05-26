import React, { useEffect } from 'react';
import RegionSelector from '../controls/RegionSelector';
import '../../FastPlannerStyles.css';
import LoadingIndicator from '../../modules/LoadingIndicator';
import { useAircraft } from '../../context/AircraftContext';

/**
 * MainCard Component
 * 
 * Contains the main controls including region selection, aircraft configuration,
 * and route statistics. This is the primary card shown when the right panel opens.
 */
const MainCard = ({
  regions = [],
  currentRegion = null,
  onRegionChange = () => {},
  regionLoading = false,
  onClearRoute,
  onToggleChart,
  chartsVisible,
  selectedAircraft,
  payloadWeight,
  onPayloadWeightChange,
  reserveFuel,
  onReserveFuelChange,
  routeStats,
  isAuthenticated,
  authUserName,
  onLogin,
  rigsLoading,
}) => {
  // Get aircraft context for accessing aircraft data
  const { 
    aircraftType, 
    aircraftRegistration, 
    changeAircraftType, 
    changeAircraftRegistration,
    aircraftsByType,
    aircraftLoading,
    forceUpdate
  } = useAircraft();
  
  // Debug aircraft data
  useEffect(() => {
    console.log("MainCard Aircraft Data:", {
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
        
        // Always make sure the dropdown starts with "-- Change Aircraft Type --"
        if (typeDropdown.value !== 'select' && !aircraftType) {
          typeDropdown.value = 'select';
          console.log('Reset type dropdown to "-- Change Aircraft Type --"');
        }
      }
    }, 200);
  }, [aircraftType, aircraftRegistration, selectedAircraft, aircraftsByType, forceUpdate]);
  
  // Reset dropdowns when selectedAircraft changes
  useEffect(() => {
    if (selectedAircraft) {
      console.log('MainCard: Selected aircraft changed, rebuilding dropdowns');
      
      // Force immediate state update for type dropdown
      if (changeAircraftType) {
        console.log('Forcing type reset to empty string');
        changeAircraftType('');
      }
      
      // Wait briefly for state to update, then force DOM update
      setTimeout(() => {
        // Reset the type dropdown
        const typeDropdown = document.getElementById('aircraft-type');
        if (typeDropdown) {
          // Reset to "-- Change Aircraft Type --"
          typeDropdown.value = 'select';
          console.log('Reset type dropdown to "-- Change Aircraft Type --"');
          
          // Force dropdown rebuild
          const event = new Event('change', { bubbles: true });
          typeDropdown.dispatchEvent(event);
          
          // Force DOM refresh
          typeDropdown.classList.add('force-rebuild');
          setTimeout(() => typeDropdown.classList.remove('force-rebuild'), 10);
        }
        
        // Reset the registration dropdown
        const regDropdown = document.getElementById('aircraft-registration');
        if (regDropdown) {
          // Set to empty to force it to rebuild
          regDropdown.value = '';
          console.log('Reset registration dropdown - will force a rebuild');
          
          // Force change event
          const event = new Event('change', { bubbles: true });
          regDropdown.dispatchEvent(event);
          
          // Force DOM refresh
          regDropdown.classList.add('force-rebuild');
          setTimeout(() => regDropdown.classList.remove('force-rebuild'), 10);
        }
        
        // Show selection confirmation
        if (!window.aircraftSelectionHelpShown) {
          window.aircraftSelectionHelpShown = true;
          
          const loaderId = LoadingIndicator.show('.route-stats-title', 
            `Aircraft Selected: ${selectedAircraft.registration.split(' (')[0]} (${selectedAircraft.modelType})`, 
            { position: 'bottom' });
          
          setTimeout(() => {
            LoadingIndicator.hide(loaderId);
          }, 5000);
        }
      }, 150);
      
      // Force a complete rebuild after a short delay
      setTimeout(() => {
        // As a last resort, trigger a forced rebuild via event
        const rebuildEvent = new CustomEvent('force-rerender-dropdowns', {
          detail: { 
            forcedRebuild: true,
            timestamp: Date.now(),
            aircraft: selectedAircraft.registration
          }
        });
        window.dispatchEvent(rebuildEvent);
      }, 500);
    }
  }, [selectedAircraft, changeAircraftType]);
  
  // Initial mount effect
  useEffect(() => {
    console.log("MainCard mounted");
    
    // Mark that we've mounted - no reloading
    if (!window.rightPanelMounted) {
      window.rightPanelMounted = true;
      
      // Log diagnostic information
      console.log("MainCard initial mount - aircraft data:", {
        aircraftsByType: aircraftsByType,
        aircraftCount: Object.values(aircraftsByType || {}).flat().length,
        typeCount: Object.keys(aircraftsByType || {}).length
      });
      
      // Display a helpful notification without reloading
      if (Object.keys(aircraftsByType || {}).length === 0) {
        console.log("No aircraft types found after mount - will wait for data to load");
        
        const loaderId = LoadingIndicator.show('.route-stats-title', 
          'Waiting for aircraft data to load...', 
          { position: 'bottom' });
        
        setTimeout(() => {
          LoadingIndicator.hide(loaderId);
        }, 4000);
      }
    }
  }, [aircraftsByType]);
  
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
        <button 
          id="reload-data" 
          className="control-button" 
          onClick={() => {
            // Show loading indicator
            const loaderId = LoadingIndicator.show('.route-stats-title', 
              'Reloading rig data...', 
              { position: 'bottom' });
            
            // Call the reload function
            onClearRoute();
            
            // Hide the loader after a delay
            setTimeout(() => {
              LoadingIndicator.hide(loaderId);
            }, 2000);
          }}
          disabled={rigsLoading}
          style={{ display: 'none' }} /* Hidden by default */
        >
          {rigsLoading ? 'Loading...' : 'Reload Data'}
        </button>
      </div>
      
      <div className="control-section">
        <h4>Aircraft Configuration</h4>
        <label htmlFor="aircraft-type">Aircraft Type:</label>
        <select 
          id="aircraft-type" 
          value={aircraftType === '' ? 'select' : aircraftType}
          onChange={(e) => {
            // Get the actual value ('' for 'select', otherwise the type)
            const value = e.target.value === 'select' ? '' : e.target.value;
            console.log(`Aircraft type dropdown changed to: ${value || 'empty'}`);
            
            if (value) {
              // Selecting a specific type
              console.log('Selecting specific aircraft type:', value);
              
              // Call handler to update the type filter
              changeAircraftType(value);
              
              // Clear the registration dropdown
              const regDropdown = document.getElementById('aircraft-registration');
              if (regDropdown) {
                regDropdown.value = '';
              }
              
              // Clear the selected aircraft when choosing a new type
              if (changeAircraftRegistration) {
                changeAircraftRegistration('');
              }
            } else {
              // "-- Change Aircraft Type --" selected
              console.log('Change Aircraft Type selected (empty value)');
              
              // Show all aircraft types
              changeAircraftType('');
              
              // If we had a selected aircraft, keep it selected
              if (selectedAircraft && aircraftRegistration) {
                console.log('Keeping selected aircraft while showing all types');
                
                // Make sure registration dropdown still shows selected aircraft
                const regDropdown = document.getElementById('aircraft-registration');
                if (regDropdown) {
                  regDropdown.value = aircraftRegistration;
                }
              }
              
              // Ensure we see "-- Change Aircraft Type --" in the dropdown
              setTimeout(() => {
                const typeDropdown = document.getElementById('aircraft-type');
                if (typeDropdown) {
                  typeDropdown.value = 'select';
                  console.log('Ensured type dropdown shows "-- Change Aircraft Type --"');
                }
              }, 50);
            }
          }}
          disabled={aircraftLoading}
          className="aircraft-type-dropdown"
        >
          <option value="select">-- Change Aircraft Type --</option>
          
          {aircraftLoading ? (
            <option value="" disabled>
              Loading...
            </option>
          ) : (
            aircraftsByType && Object.keys(aircraftsByType).length > 0 ? (
              Object.keys(aircraftsByType)
                .sort()
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
                  
                  // Get the count of aircraft for this type
                  const actualCount = (aircraftsByType[type] || []).length;
                  
                  // Only show types with aircraft available
                  if (actualCount > 0) {
                    return (
                      <option key={type} value={type}>
                        {displayName} ({actualCount})
                      </option>
                    );
                  } else {
                    return null;
                  }
                })
                .filter(Boolean)
            ) : (
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
              console.log('Specific aircraft selected, will reset both dropdowns');
              
              // Call the handler to select the aircraft
              changeAircraftRegistration(newReg);
              
              // Add a slight delay to show a message that aircraft was selected
              setTimeout(() => {
                console.log('Aircraft selection processed, dropdowns should be reset');
                
                // Directly update the Selected Aircraft display
                const selectedDisplay = document.querySelector('.selected-aircraft-display');
                if (selectedDisplay) {
                  // Find the selected aircraft in the aircraftsByType 
                  const allAircraft = Object.values(aircraftsByType || {}).flat();
                  const aircraft = allAircraft.find(a => a.registration === newReg);
                  
                  if (aircraft) {
                    // Update the Selected Aircraft display
                    selectedDisplay.innerHTML = `${aircraft.registration.split(' (')[0]} ${aircraft.modelType ? `(${aircraft.modelType})` : ''}`;
                    selectedDisplay.style.color = '#4285f4';
                    console.log('Updated selected aircraft display manually');
                    
                    // Update the TOP CARD with aircraft info
                    const topCardTitle = document.querySelector('.route-stats-title');
                    if (topCardTitle) {
                      topCardTitle.innerHTML = `<span style="color: white">${aircraft.registration.split(' (')[0]} • </span><span style="color: #4285f4">${aircraft.modelType}</span>`;
                      console.log('Updated top card title with aircraft info');
                    }
                  }
                }
              }, 100);
            } else {
              // Just call the handler for empty selection
              changeAircraftRegistration(newReg);
            }
          }}
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
                // Always show selected aircraft at the top of the list if one is selected
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
                  // Always show selected aircraft at the top if it's of this type
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
        
        {/* Show the selected aircraft registration */}
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

        {/* Compact input layout */}
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
      
      <div id="auth-status" className="control-section">
        <h4>Connection Status</h4>
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
                
                // Force immediate UI update
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