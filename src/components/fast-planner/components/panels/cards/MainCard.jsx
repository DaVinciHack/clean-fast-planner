import React, { useState, useEffect } from 'react';
import { useReserveFuel } from '../../../hooks/useReserveFuel';
import RegionSelector from '../../controls/RegionSelector';
import { SaveFlightButton, LoadFlightsButton } from '../../controls';
import AutoPlanButton from '../../controls/AutoPlanButton';
import EnhancedStopCardsContainer from '../../flight/stops/EnhancedStopCardsContainer.jsx';
import '../../flight/stops/StopCards.css';
import FAASubmissionButton from '../../../../faa/FAASubmissionButton.jsx';

/**
 * MainCard Component
 * 
 * Contains the main controls including region selection, aircraft configuration,
 * and route statistics from the original RightPanel component.
 * Now using RegionContext for region management.
 */
const MainCard = ({
  onClearRoute,
  onLoadRigData,
  onToggleChart,
  onAutoPlan, // Add onAutoPlan prop
  onWaiveAlternatesChange, // 🛩️ VFR OPERATIONS: Callback for alternate route visibility
  waiveAlternates = false, // 🛩️ VFR OPERATIONS: Current waive alternates state
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
  // Read-only values from settings
  reserveFuel = 0,
  // Waypoints for stop cards
  waypoints = [],
  passengerWeight = 0,
  cargoWeight = 0, // 🟠 ADDED: Missing cargoWeight prop
  extraFuel = 0, // 🔧 ADDED: Missing extraFuel prop
  araFuel = 0, // 🔧 ADDED: ARA fuel from weather analysis
  approachFuel = 0, // 🔧 ADDED: Approach fuel from weather analysis
  deckTimePerStop, // 🚨 AVIATION SAFETY: NO DEFAULT - Must come from OSDK fuel policy
  deckFuelFlow, // 🚨 AVIATION SAFETY: NO DEFAULT - Must come from OSDK fuel policy
  contingencyFuelPercent, // 🚨 AVIATION SAFETY: NO DEFAULT - Must come from OSDK fuel policy  
  taxiFuel, // 🚨 AVIATION SAFETY: NO DEFAULT - Must come from OSDK fuel policy
  // Weather props
  weather, // No default - weather must be provided from parent
  onWeatherUpdate = () => {},
  // Alternate route data
  alternateRouteData = null,
  // Loaded flight data for responsive display
  loadedFlightData = null,
  // Stop cards data from useRouteCalculation
  stopCards = [],
  // Fuel policy for MasterFuelManager
  fuelPolicy = null,
  // Flight loading callback
  onFlightLoad = () => {},
  // Waypoint mode controls
  toggleWaypointMode = () => {},
  waypointModeActive = false,
  // Weather segments for rig detection
  weatherSegments = null,
  // Current flight ID for Auto Plan detection
  currentFlightId = null,
  // 🛩️ HEADER SYNC: Callback for stop cards synchronization
  onStopCardsCalculated = null,
  // 📊 FUEL BREAKDOWN: Callback to show fuel breakdown modal
  onShowFuelBreakdown = null,
  // 🔧 NEW: Callback to receive alternate card data
  onAlternateCardCalculated = null,
  // ✅ SYNC FIX: Location-specific fuel overrides for stop card synchronization
  locationFuelOverrides = {},
  // 🚫 REFUEL SYNC: Current refuel stops from DetailedFuelBreakdown
  currentRefuelStops = [],
  // ✅ SEGMENT-AWARE: Segment-specific extra fuel handler
  onSegmentExtraFuelChange = () => {},
  // ✅ SEGMENT-AWARE: Function to get current segment information
  getCurrentSegmentInfo = () => [],
  // 🔥 DIRECT CALLBACK: Function to register fuel overrides callback
  onFuelOverridesChanged = null,
  // 🔄 REFUEL SYNC: Callback for refuel stops synchronization
  onRefuelStopsChanged = null,
  // 🛩️ SIMPLE SAVE: Direct save function without popup
  onDirectSave = null,
}) => {
  // Use shared reserve fuel calculation hook - NO FALLBACK, fuel policy is source of truth
  const calculatedReserveFuel = useReserveFuel(fuelPolicy, selectedAircraft, 0);
  

  // Calculate weather age from weather segments
  const getWeatherAge = () => {
    if (!weatherSegments || weatherSegments.length === 0) {
      return null;
    }

    // Find the most recent timestamp from all weather segments
    let mostRecentTimestamp = null;
    weatherSegments.forEach(segment => {
      if (segment.timestamp) {
        const segmentTime = new Date(segment.timestamp);
        if (!mostRecentTimestamp || segmentTime > mostRecentTimestamp) {
          mostRecentTimestamp = segmentTime;
        }
      }
    });

    if (!mostRecentTimestamp) {
      return null;
    }

    try {
      const now = new Date();
      const ageMs = now.getTime() - mostRecentTimestamp.getTime();
      const ageMinutes = ageMs / (1000 * 60);

      if (ageMinutes < 1) {
        return {
          text: `Weather is ${Math.round(ageMinutes * 60)} seconds old`,
          isOld: false
        };
      } else if (ageMinutes < 60) {
        const minutes = Math.floor(ageMinutes);
        const seconds = Math.round((ageMinutes - minutes) * 60);
        return {
          text: `Weather is ${minutes}.${seconds.toString().padStart(2, '0')} mins old`,
          isOld: ageMinutes > 180 // Warning if > 3 hours (180 minutes)
        };
      } else {
        const hours = Math.floor(ageMinutes / 60);
        const minutes = Math.round(ageMinutes % 60);
        return {
          text: `Weather is ${hours}h ${minutes}m old`,
          isOld: ageMinutes > 180 // Warning if > 3 hours
        };
      }
    } catch (error) {
      console.error('Error calculating weather age:', error);
      return null;
    }
  };

  const [weatherAge, setWeatherAge] = useState(getWeatherAge());

  // Update weather age every 30 seconds for real-time display
  useEffect(() => {
    const updateWeatherAge = () => {
      setWeatherAge(getWeatherAge());
    };

    // Update immediately when weather segments change
    updateWeatherAge();

    // Set up interval for real-time updates
    const interval = setInterval(updateWeatherAge, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [weatherSegments]); // Re-run when weather segments change

  // Listen for master toggle events from MapLayersCard to keep buttons synchronized
  useEffect(() => {
    const handleMasterToggle = (event) => {
      if (event.detail && event.detail.source === 'mapLayersCard-master') {
        console.log('🔄 MAIN CARD: Received master toggle from MapLayersCard:', event.detail);
        // The MapLayersCard master button was used, so we should update our state
        // but don't emit events back to avoid infinite loops
        const { allVisible } = event.detail;
        
        // Update the chartsVisible state to match if needed
        if (chartsVisible !== allVisible) {
          console.log(`🔄 MAIN CARD: Syncing chartsVisible from ${chartsVisible} to ${allVisible}`);
          onToggleChart(); // This should update the parent's chartsVisible state
        }
      }
    };

    window.addEventListener('master-layer-toggle', handleMasterToggle);
    return () => window.removeEventListener('master-layer-toggle', handleMasterToggle);
  }, [chartsVisible, onToggleChart]);

  // Status message handlers for the Save Flight button
  const handleSaveSuccess = (message) => {
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(message, 'success');
    } else {
      alert(message);
    }
  };
  
  const handleSaveError = (error) => {
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(error, 'error');
    } else {
      alert(error);
    }
  };
  
  // State to track if registration section is expanded
  const [isRegistrationExpanded, setIsRegistrationExpanded] = useState(!selectedAircraft);
  
  // Automatically expand/collapse based on selection changes
  React.useEffect(() => {
    if (selectedAircraft) {
      // Collapse when aircraft is selected
      setIsRegistrationExpanded(false);
    } else if (aircraftType) {
      // Expand when aircraft type is selected but no aircraft is selected
      setIsRegistrationExpanded(true);
    }
  }, [selectedAircraft, aircraftType]);
  
  // Calculate time to departure - same logic as AppHeader
  const getTimeToDepature = (etd) => {
    if (!etd) return { text: '', color: '#888888' };
    
    try {
      const now = new Date();
      const departure = new Date(etd);
      const diffMs = departure.getTime() - now.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      // Format the departure time
      const depTime = departure.toISOString().substr(11, 5) + 'Z';
      
      if (diffMinutes < -1440) {
        const daysAgo = Math.abs(Math.floor(diffMinutes / 1440));
        return { text: `Dep. ${depTime} (${daysAgo}d ago)`, color: '#888888' };
      } else if (diffMinutes < 0) {
        const minutesAgo = Math.abs(diffMinutes);
        if (minutesAgo < 60) {
          return { text: `Dep. ${depTime} (${minutesAgo} min ago)`, color: '#888888' };
        } else {
          const hoursAgo = Math.floor(minutesAgo / 60);
          return { text: `Dep. ${depTime} (${hoursAgo}h ago)`, color: '#888888' };
        }
      } else if (diffMinutes < 1440) {
        if (diffMinutes < 60) {
          return { text: `Dep. ${depTime} ${diffMinutes} min`, color: '#2196F3' };
        } else {
          const hours = Math.floor(diffMinutes / 60);
          const mins = diffMinutes % 60;
          return { text: `Dep. ${depTime} ${hours}:${mins.toString().padStart(2, '0')} min`, color: '#2196F3' };
        }
      } else {
        const days = Math.floor(diffMinutes / 1440);
        const remainingMins = diffMinutes % 1440;
        const hours = Math.floor(remainingMins / 60);
        return { text: `Dep. ${depTime} ${days}d ${hours}h`, color: '#4CAF50' };
      }
    } catch (error) {
      console.error('Error calculating departure time:', error);
      return { text: '', color: '#888888' };
    }
  };
  
  return (
    <div className="tab-content main-tab">
      <div className="panel-header">
        <div className="region-selector-container">
          {/* RegionSelector no longer needs props as it gets everything from RegionContext */}
          <RegionSelector />
        </div>
      </div>
      
      {/* Responsive flight info - only shows on iPad and smaller when AppHeader hides it */}
      {loadedFlightData && (
        <div className="maincard-flight-info">
          <div className="maincard-flight-name">
            {loadedFlightData.flightNumber || loadedFlightData.name || 'Unknown Flight'}
          </div>
          <div 
            className="maincard-flight-departure"
            style={{ color: getTimeToDepature(loadedFlightData.etd || loadedFlightData.estimatedTimeOfDeparture).color }}
          >
            {getTimeToDepature(loadedFlightData.etd || loadedFlightData.estimatedTimeOfDeparture).text}
          </div>
        </div>
      )}
      
      <div className="control-section" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '15px' }}>
        {/* Auto Plan, Save, and Load buttons - Side by Side with exactly 7px gap */}
        <div style={{ display: 'flex', width: '100%', gap: '7px' }}>
          <AutoPlanButton
            selectedAircraft={selectedAircraft}
            waypoints={waypoints}
            flightId={currentFlightId} // 🔧 FIX: Pass actual flight ID for new vs existing flight detection
            style={{ flex: 1, margin: 0 }}
            onSuccess={handleSaveSuccess}
            onError={handleSaveError}
            onAutoPlan={onAutoPlan} // Pass the onAutoPlan function from props
          />
          {/* 🛩️ SIMPLE SAVE: Direct save button without popup */}
          <button
            className="control-button"
            onClick={() => onDirectSave && onDirectSave()}
            disabled={!selectedAircraft || !waypoints || waypoints.length < 2}
            style={{
              flex: 1,
              margin: 0,
              backgroundColor: '#038dde',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px 10px',
              cursor: selectedAircraft && waypoints && waypoints.length >= 2 ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              fontWeight: 'normal',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: selectedAircraft && waypoints && waypoints.length >= 2 ? 1 : 0.6
            }}
            title="Save current flight plan"
          >
            Save
          </button>
          <LoadFlightsButton 
            style={{ flex: 1, margin: 0 }}
            onSuccess={(message) => {
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(message, 'success');
              }
            }}
            onError={(error) => {
              if (window.LoadingIndicator) {
                window.LoadingIndicator.updateStatusIndicator(error, 'error');
              }
            }}
          />
        </div>
      </div>
      
      {/* Map Control buttons - Slim, on separate line */}
      <div className="control-section" style={{ display: 'flex', width: '100%', marginBottom: '15px' }}>
        <div style={{ display: 'flex', width: '100%', gap: '7px' }}>
          <button 
            onClick={onClearRoute}
            style={{
              flex: 1,
              background: 'linear-gradient(to bottom, #1f2937, #111827)',
              color: '#ffffff',
              border: '1px solid #dc2626',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#dc2626';
              e.target.style.borderColor = '#dc2626';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
              e.target.style.borderColor = '#dc2626';
            }}
          >
            Clear Route
          </button>
          <div style={{ flex: 1, height: '24px' }}>
            <FAASubmissionButton
              flightPlanData={{
                // Aircraft Information
                tailNumber: (selectedAircraft?.registration || aircraftRegistration || "REGISTRATION REQUIRED")
                  .replace(/\s*\([^)]*\)/g, ''), // Remove anything in brackets
                aircraftType: selectedAircraft?.acModelName || selectedAircraft?.modelName || selectedAircraft?.type || aircraftType || "AIRCRAFT TYPE REQUIRED",
                wakeCategory: selectedAircraft?.wakeCategory || "L", // Helicopter wake category
                equipment: selectedAircraft?.equipment || "SG", // Standard helicopter equipment
                
                // Route Information  
                departure: {
                  airport: waypoints.length > 0 ? (waypoints[0]?.name || waypoints[0]?.id) : "DEPARTURE REQUIRED",
                  time: new Date().toISOString().substr(11, 5).replace(':', '') // Current time in HHMM
                },
                destination: {
                  airport: waypoints.length > 1 ? (waypoints[waypoints.length - 1]?.name || waypoints[waypoints.length - 1]?.id) : "DESTINATION REQUIRED",
                  estimatedTime: routeStats?.totalTime ? 
                    `${Math.floor(routeStats.totalTime / 60).toString().padStart(2, '0')}${(routeStats.totalTime % 60).toString().padStart(2, '0')}` : 
                    "FLIGHT TIME REQUIRED"
                },
                route: waypoints.length > 2 ? waypoints.slice(1, -1).map(wp => wp.name || wp.id || 'WPT').join(' ') : "DCT",
                altitude: selectedAircraft?.cruiseAltitude || selectedAircraft?.serviceAltitude || "1000", // Use real aircraft altitude
                airspeed: selectedAircraft?.cruiseSpeed || selectedAircraft?.cruseSpeed || "AIRSPEED REQUIRED", // Real aircraft cruise speed (note: cruseSpeed is OSDK typo)
                flightRules: "VFR", // Default for helicopter ops
                
                // Pilot Information
                pilotName: authUserName || "PILOT NAME REQUIRED",
                pilotPhone: "",
                
                // Passengers & Fuel
                personsOnBoard: Math.ceil(passengerWeight / 170) || 1, // Estimate from passenger weight
                fuelOnBoard: routeStats?.fuelRequired ? 
                  `${Math.floor(routeStats.fuelRequired / 60).toString().padStart(2, '0')}${Math.floor((routeStats.fuelRequired % 60)).toString().padStart(2, '0')}` : 
                  "FUEL CALCULATION REQUIRED",
                endurance: selectedAircraft?.endurance || 
                  (selectedAircraft?.maxFuelCapacity && selectedAircraft?.fuelBurn ? 
                    `${Math.floor(selectedAircraft.maxFuelCapacity / selectedAircraft.fuelBurn).toString().padStart(2, '0')}00` : 
                    (selectedAircraft?.fuelCapacity && selectedAircraft?.fuelConsumption ? 
                      `${Math.floor(selectedAircraft.fuelCapacity / selectedAircraft.fuelConsumption).toString().padStart(2, '0')}00` : 
                      "ENDURANCE DATA REQUIRED")),
                
                // Emergency Equipment (standard for commercial helicopters)
                emergencyEquipment: "R/V/S/J", // Radio, VHF, Survival equipment, Jackets
                lifeJackets: "L/F/U/V", // Light, Fluorescein, UHF, VHF
                dinghies: "D/4/C", // Dinghies, 4 persons, Color
                
                // Operational Information
                remarks: [
                  routeStats?.distance ? `ROUTE DISTANCE: ${Math.round(routeStats.distance)}NM` : null,
                  araFuel > 0 ? `ARA FUEL REQUIRED: ${araFuel}LBS` : null,
                  approachFuel > 0 ? `APPROACH FUEL REQUIRED: ${approachFuel}LBS` : null,
                  passengerWeight > 0 ? `PAX WEIGHT: ${passengerWeight}LBS` : null,
                  selectedAircraft?.acModelName ? `AIRCRAFT: ${selectedAircraft.acModelName}` : 
                    (selectedAircraft?.type ? `AIRCRAFT: ${selectedAircraft.type}` : null),
                  selectedAircraft?.company ? `OPERATOR: ${selectedAircraft.company}` : null,
                  selectedAircraft?.maxPassengers ? `MAX PAX: ${selectedAircraft.maxPassengers}` : null
                ].filter(Boolean).join(' / ') || "OFFSHORE HELICOPTER OPERATIONS",
                alternateAirport: waypoints.length > 2 ? (waypoints[1]?.name || waypoints[1]?.id) : undefined
              }}
              onSubmissionSuccess={(flightPlanId) => {
                console.log('✈️ Flight plan submitted successfully:', flightPlanId);
              }}
              style={{
                width: '100%',
                height: '24px',
                fontSize: '11px',
                fontWeight: '500',
                borderRadius: '4px',
                padding: '4px 8px',
                background: 'linear-gradient(to bottom, #1f2937, #111827)',
                color: '#ffffff',
                border: '1px solid #28a745',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
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
            
            // Always expand the registration dropdown when changing aircraft type
            setIsRegistrationExpanded(true);
          }}
          onClick={() => {
            // Expand registration on click (not just on change)
            setIsRegistrationExpanded(true);
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
        
        {/* Aircraft Registration Selection - with slide animation */}
        <div className={`registration-container ${isRegistrationExpanded ? 'expanded' : 'collapsed'}`} 
             style={{
               overflow: 'hidden',
               transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin 0.3s ease-in-out',
               maxHeight: isRegistrationExpanded ? '200px' : '0px',
               opacity: isRegistrationExpanded ? '1' : '0',
               marginTop: isRegistrationExpanded ? '10px' : '0px',
               marginBottom: isRegistrationExpanded ? '10px' : '0px'
             }}>
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
                
                // Auto-collapse the registration section after selection
                setIsRegistrationExpanded(false);
                
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
                {selectedAircraft.cruiseSpeed || 'N/A'}
                <span className="unit">{selectedAircraft.cruiseSpeed ? 'kts' : ''}</span>
              </div>
            </div>
            
            {/* Fuel Flow */}
            <div className="aircraft-data-item">
              <div className="icon">⛽</div>
              <div className="label">Fuel Flow</div>
              <div className="value">
                {selectedAircraft.fuelBurn || 'N/A'}
                <span className="unit">{selectedAircraft.fuelBurn ? 'lbs/hr' : ''}</span>
              </div>
            </div>
            
            {/* Max Passengers */}
            <div className="aircraft-data-item">
              <div className="icon">👥</div>
              <div className="label">Max Pax</div>
              <div className="value">
                {selectedAircraft.maxPassengers || 'N/A'}
              </div>
            </div>
            
            {/* Max Fuel */}
            <div className="aircraft-data-item">
              <div className="icon">🔋</div>
              <div className="label">Max Fuel</div>
              <div className="value">
                {selectedAircraft.maxFuel || 'N/A'}
                <span className="unit">{selectedAircraft.maxFuel ? 'lbs' : ''}</span>
              </div>
            </div>
            
            {/* Useful Load */}
            <div className="aircraft-data-item">
              <div className="icon">⚖️</div>
              <div className="label">Useful Load</div>
              <div className="value">
                {selectedAircraft.usefulLoad || 'N/A'}
                <span className="unit">{selectedAircraft.usefulLoad ? 'lbs' : ''}</span>
              </div>
            </div>
            
            {/* Reserve Fuel - read-only display from settings */}
            <div className="aircraft-data-item">
              <div className="icon">🔄</div>
              <div className="label">Reserve</div>
              <div className="value">
                {calculatedReserveFuel.fuel}
                <span className="unit">lbs</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Compact Wind Settings Section */}
        <div className="weather-control-section" style={{ marginBottom: '0', marginTop: '4px' }}>
          <div className="settings-group" style={{ display: 'flex', gap: '8px', marginBottom: '0' }}>
            <div style={{ flex: '1' }}>
              <label htmlFor="wind-direction" style={{ fontSize: '0.75em' }}>Wind From:</label>
              <div className="input-with-unit" style={{ width: '100%' }}>
                <input
                  id="wind-direction"
                  type="number"
                  min="0"
                  max="359"
                  value={weather.windDirection}
                  onChange={(e) => {
                    const newDirection = parseInt(e.target.value) || 0;
                    console.log('MainCard: Wind direction changed to:', newDirection);
                    // Ensure valid range 0-359
                    const normalizedDirection = ((newDirection % 360) + 360) % 360;
                    // Important: Pass parameters in correct order (speed, direction)
                    onWeatherUpdate(weather.windSpeed, normalizedDirection);
                  }}
                  style={{ width: '100%', height: '24px', fontSize: '0.8em' }}
                />
                <span className="unit">°</span>
              </div>
            </div>
            <div style={{ flex: '1' }}>
              <label htmlFor="wind-speed" style={{ fontSize: '0.75em' }}>Speed:</label>
              <div className="input-with-unit" style={{ width: '100%' }}>
                <input
                  id="wind-speed"
                  type="number"
                  min="0"
                  max="100"
                  value={weather.windSpeed}
                  onChange={(e) => {
                    const newSpeed = parseInt(e.target.value) || 0;
                    console.log('MainCard: Wind speed changed to:', newSpeed);
                    // Important: Pass parameters in correct order (speed, direction)
                    onWeatherUpdate(newSpeed, weather.windDirection);
                  }}
                  style={{ width: '100%', height: '24px', fontSize: '0.8em' }}
                />
                <span className="unit">kts</span>
              </div>
            </div>
          </div>
          
          {/* Weather Age Display */}
          {weatherAge && (
            <div className="weather-age-display" style={{
              marginTop: '4px',
              fontSize: '0.75em',
              color: weatherAge.isOld ? '#f59e0b' : '#6b7280', // Orange if old, gray if recent
              fontWeight: weatherAge.isOld ? '600' : '400',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ fontSize: '0.9em' }}>{weatherAge.isOld ? '⚠️' : '🌤️'}</span>
              <span>{weatherAge.text}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Remove padding in the control section that renders StopCardsContainer */}
      <div className="control-section" style={{ margin: '0', padding: '0' }}>
        {/* Enhanced Stop Cards with MasterFuelManager Integration */}
        {waypoints.length >= 2 && (
          <EnhancedStopCardsContainer
            waypoints={waypoints}
            routeStats={routeStats}
            selectedAircraft={selectedAircraft}
            passengerWeight={passengerWeight}
            cargoWeight={cargoWeight} // 🟠 ADDED: Missing cargoWeight prop
            reserveFuel={calculatedReserveFuel.fuel}
            contingencyFuelPercent={contingencyFuelPercent}
            deckTimePerStop={deckTimePerStop}
            deckFuelFlow={deckFuelFlow}
            taxiFuel={taxiFuel}
            extraFuel={extraFuel} // 🔧 ADDED: Missing extraFuel prop
            araFuel={araFuel} // 🔧 ADDED: ARA fuel from weather analysis
            approachFuel={approachFuel} // 🔧 ADDED: Approach fuel from weather analysis
            weather={weather}
            alternateRouteData={alternateRouteData}
            fuelPolicy={fuelPolicy}
            weatherSegments={weatherSegments}
            stopCards={stopCards}
            onWaiveAlternatesChange={onWaiveAlternatesChange} // 🛩️ Pass callback up
            waiveAlternates={waiveAlternates} // 🛩️ VFR OPERATIONS: Pass waive alternates state
            onStopCardsCalculated={onStopCardsCalculated} // 🛩️ HEADER SYNC: Pass callback to container
            onShowFuelBreakdown={onShowFuelBreakdown} // 📊 FUEL BREAKDOWN: Pass callback to show modal at app level
            onAlternateCardCalculated={onAlternateCardCalculated} // 🔧 NEW: Pass alternate card callback
            currentFlightId={currentFlightId} // 🔧 NEW: Pass current flight ID for fuel save functionality
            locationFuelOverrides={locationFuelOverrides} // ✅ SYNC FIX: Pass location fuel overrides to container
            currentRefuelStops={currentRefuelStops} // 🚫 REFUEL SYNC: Pass synced refuel stops to container
            onSegmentExtraFuelChange={onSegmentExtraFuelChange} // ✅ SEGMENT-AWARE: Pass segment extra fuel handler to container
            getCurrentSegmentInfo={getCurrentSegmentInfo} // ✅ SEGMENT-AWARE: Pass segment info getter to container
            onFuelOverridesChanged={onFuelOverridesChanged} // 🔥 DIRECT CALLBACK: Pass fuel overrides callback to container
            onRefuelStopsChanged={onRefuelStopsChanged} // 🔄 REFUEL SYNC: Pass refuel stops callback to container
          />
        )}
      </div>
    </div>
  );
};

export default MainCard;