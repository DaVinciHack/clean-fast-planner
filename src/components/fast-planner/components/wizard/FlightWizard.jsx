import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import PassengerInputStep from './PassengerInputStep';
import './FlightWizard.css';

/**
 * FlightWizard - Apple-style guided flight planning for non-aviation users
 * 
 * Simple, one-question-at-a-time interface that builds flights step by step
 */
const FlightWizard = ({ 
  isVisible, 
  onClose, 
  onComplete,
  onSkip,
  onLoadFlight, // NEW: Handler to load selected flight
  initialStep = 0, // NEW: Initial step to start the wizard on
  // Data and handlers from parent
  regions = [],
  searchLocation,
  onAddWaypoint,
  onClearRoute,
  aircraftTypes = [],
  aircraftsByType = {},
  selectedAircraft,
  onAircraftSelect
}) => {
  // Get user details from auth context
  const { userDetails, userName } = useAuth();
  // Wizard state
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  // Name animation state
  const [showFirstName, setShowFirstName] = useState(false);
  const [showLastName, setShowLastName] = useState(false);
  
  // Flight building state
  const [flightData, setFlightData] = useState({
    departure: null,
    landings: [], // Combined stops + destination (last item is destination)
    aircraft: null,
    aircraftType: null,
    departureTime: null,
    passengers: {}
  });
  
  // Current input state
  const [currentInput, setCurrentInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', 'searching'
  
  // Flight list state
  const [flights, setFlights] = useState([]);
  const [filteredFlights, setFilteredFlights] = useState([]);
  const [flightSearchTerm, setFlightSearchTerm] = useState('');
  const [flightSearchDate, setFlightSearchDate] = useState('');
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  
  // Reset step when wizard opens with a specific initialStep
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(initialStep);
    }
  }, [isVisible, initialStep]);

  // Animate names when wizard becomes visible and user data is actually loaded
  useEffect(() => {
    if (isVisible && currentStep === 0 && userDetails) {
      // Reset animation state
      setShowFirstName(false);
      setShowLastName(false);
      
      // Wait for wizard to appear, then animate first name
      const firstNameTimer = setTimeout(() => {
        setShowFirstName(true);
        
        // Then animate last name after first name animation starts
        const lastNameTimer = setTimeout(() => {
          setShowLastName(true);
        }, 600); // Delay for last name
        
        return () => clearTimeout(lastNameTimer);
      }, 300); // Initial delay for first name
      
      return () => clearTimeout(firstNameTimer);
    }
  }, [isVisible, currentStep, userDetails]);

  // Color array for landings (blues and purples like passenger colors)
  const getLandingColor = (index) => {
    const colors = [
      '#007bff', // Blue
      '#6610f2', // Purple
      '#6f42c1', // Indigo  
      '#e83e8c', // Pink
      '#20c997', // Teal
      '#fd7e14', // Orange
      '#dc3545'  // Red
    ];
    return colors[index % colors.length];
  };

  // Load flights when flight list step is accessed
  useEffect(() => {
    if (currentStep === 1 && flights.length === 0) { // Step 1 is flightList
      loadFlights();
    }
  }, [currentStep]);

  // Filter flights based on search criteria
  useEffect(() => {
    let filtered = flights;
    
    // Filter by search term
    if (flightSearchTerm) {
      filtered = filtered.filter(flight => 
        flight.flightNumber?.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
        flight.flightName?.toLowerCase().includes(flightSearchTerm.toLowerCase()) ||
        flight.name?.toLowerCase().includes(flightSearchTerm.toLowerCase())
      );
    }
    
    // Filter by date - check all date fields like the display logic does
    if (flightSearchDate) {
      filtered = filtered.filter(flight => {
        // Check all possible date fields (same as display logic)
        const dateStr = flight.date || flight.etd || flight.departureTime || flight.createdAt;
        if (dateStr) {
          try {
            const flightDate = new Date(dateStr).toISOString().split('T')[0];
            return flightDate === flightSearchDate;
          } catch (e) {
            console.warn('🧙‍♂️ Wizard: Invalid date format for flight:', flight.flightNumber, dateStr);
            return false;
          }
        }
        return false;
      });
    }
    
    setFilteredFlights(filtered);
  }, [flights, flightSearchTerm, flightSearchDate]);

  // Load flights using FlightService (same as LoadFlightsCard)
  const loadFlights = async () => {
    setIsLoadingFlights(true);
    try {
      // Import FlightService
      const FlightService = (await import('../../services/FlightService')).default;
      
      console.log('🧙‍♂️ Wizard: Loading flights via FlightService...');
      
      const result = await FlightService.loadFlights(null, 100); // Load all regions, max 100 flights
      
      if (result.success) {
        console.log('🧙‍♂️ Wizard: Loaded flights:', result.flights.length);
        
        // Debug: Log first flight's date properties
        if (result.flights.length > 0) {
          const firstFlight = result.flights[0];
          console.log('🧙‍♂️ Wizard: First flight date properties:', {
            etd: firstFlight.etd,
            departureTime: firstFlight.departureTime,
            createdAt: firstFlight.createdAt,
            allKeys: Object.keys(firstFlight)
          });
        }
        
        setFlights(result.flights);
      } else {
        console.error('🧙‍♂️ Wizard: Failed to load flights:', result.error);
        setFlights([]);
      }
    } catch (error) {
      console.error('🧙‍♂️ Wizard: Error loading flights:', error);
      console.error('🧙‍♂️ Wizard: Error details:', error.message);
      setFlights([]);
    } finally {
      setIsLoadingFlights(false);
    }
  };

  // Handle flight selection - use EXACT same workflow as LoadFlightsCard
  const handleFlightSelect = (flight) => {
    console.log('🧙‍♂️ Wizard: Selected flight:', flight.flightNumber || flight.name);
    console.log('🧙‍♂️ Wizard: Using EXACT LoadFlightsCard workflow');
    
    // 🎯 VISUAL FIX: Hide ALL map elements immediately before any map changes to prevent flash
    console.log('🎯 WIZARD: Hiding all map elements to prevent flash during flight load');
    try {
      if (window.platformManager) {
        window.platformManager.toggleFixedPlatformsVisibility(false);
        window.platformManager.toggleMovablePlatformsVisibility(false);
        window.platformManager.toggleBlocksVisibility(false);
        window.platformManager.toggleBasesVisibility(false);
        // Hide airports/airfields too
        window.platformManager.toggleAirfieldsVisibility(false);
      }
    } catch (error) {
      console.warn('🎯 Warning: Could not hide map elements in wizard:', error);
      // Continue with flight loading even if hiding fails
    }
    
    // 🎯 WIZARD MAP STATE AWARE: Check current state before transitioning
    if (window.mapManager?.map) {
      const mapState = window.mapManager.getMapState();
      console.log('🧙‍♂️ Wizard: Current map state:', mapState);
      
      if (mapState.isStarlightMode) {
        // Already in starlight mode - wizard will trigger 360° spin via RightPanel
        console.log('🌪️ Wizard: Already in starlight mode - RightPanel will handle 360° spin');
      } else {
        // Not in starlight mode - switch to satellite behind wizard
        console.log('🛰️ Wizard: Not in starlight mode, switching to satellite behind wizard');
        window.mapManager.map.setStyle('mapbox://styles/mapbox/satellite-v9');
      }
    }
    
    // 🎬 SMOOTH CLOSE: Keep dark overlay up briefly, then fade out
    const wizardOverlay = document.querySelector('.flight-wizard-overlay');
    if (wizardOverlay) {
      // Wait a moment for satellite to load, then smooth fade
      setTimeout(() => {
        console.log('🧙‍♂️ Wizard: Starting smooth fade after satellite switch');
        wizardOverlay.style.transition = 'opacity 0.3s ease-out';
        wizardOverlay.style.opacity = '0';
        
        // Remove wizard after fade completes
        setTimeout(() => {
          onClose();
        }, 300);
      }, 150); // Brief delay for satellite to take effect
    } else {
      // Fallback - close immediately if overlay not found
      onClose();
    }
    
    // 🎯 CRITICAL: Use the exact same function call as LoadFlightsCard
    // This preserves all existing transition logic in RightPanel
    if (onLoadFlight) {
      // Pass the raw flight object exactly as LoadFlightsCard does
      onLoadFlight(flight);
    }
  };

  // Steps definition
  const steps = [
    { id: 'welcome', title: 'Welcome to FastPlanner' },
    { id: 'flightList', title: 'Select Flight to Load/Edit' },
    { id: 'departure', title: 'Where are you departing from?' },
    { id: 'landings', title: 'Add any rigs and final destination' },
    { id: 'aircraft', title: 'Which aircraft will you use?' },
    { id: 'passengers', title: 'How many passengers and cargo?' },
    { id: 'time', title: 'When do you want to depart?' },
    { id: 'complete', title: 'Ready to plan your flight!' }
  ];
  
  const currentStepData = steps[currentStep] || { id: 'unknown', title: 'Unknown Step' };
  
  // Handle closing with "don't show again" option
  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('fastplanner-wizard-disabled', 'true');
    }
    onClose();
  };
  
  // Handle location search with existing fuzzy search
  const handleLocationSearch = async (input) => {
    if (!input.trim()) {
      setSearchResults([]);
      setValidationStatus(null);
      return;
    }
    
    setValidationStatus('searching');
    
    try {
      // Use existing search functionality from parent
      const results = await searchLocation(input);
      setSearchResults(results || []);
      setValidationStatus(results && results.length > 0 ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Search error:', error);
      setValidationStatus('invalid');
      setSearchResults([]);
    }
  };
  
  // Handle location selection
  const handleLocationSelect = (location) => {
    const stepId = currentStepData.id;
    
    if (stepId === 'departure') {
      setFlightData(prev => ({ ...prev, departure: location }));
      // Add to actual flight planner immediately - use originalName for clean locName
      const locName = location.originalName || location.locName || location.name || location.location_name;
      if (locName && onAddWaypoint) {
        console.log('🧙‍♂️ Adding waypoint to flight planner:', locName);
        onAddWaypoint(locName);
      } else {
        console.warn('🧙‍♂️ Cannot add waypoint - missing locName or onAddWaypoint function');
      }
      // Auto-advance to next step after selecting departure
      setTimeout(() => handleNext(), 500);
    } else if (stepId === 'landings') {
      // Check for duplicates before adding
      const locName = location.originalName || location.locName || location.name || location.location_name;
      const isDuplicate = flightData.landings.some(landing => 
        (landing.originalName || landing.locName || landing.name || landing.location_name) === locName
      );
      
      if (!isDuplicate) {
        setFlightData(prev => ({ 
          ...prev, 
          landings: [...prev.landings, location] 
        }));
        // DON'T add to flight planner yet - buffer in wizard until "Choose Aircraft"
        console.log('🧙‍♂️ Buffered landing in wizard:', locName);
      } else {
        console.log('🧙‍♂️ Duplicate location ignored:', locName);
      }
      // For landings, just clear the input - don't auto-advance (user might want more landings)
    }
    
    setCurrentInput('');
    setSearchResults([]);
    setValidationStatus(null);
  };
  
  // Handle next step
  const handleNext = () => {
    // If advancing to complete step, generate flight name if not already set
    if (currentStep === steps.length - 2) { // Going to complete step
      if (!flightData.flightName && flightData.departure && flightData.landings.length > 0) {
        // Generate auto flight name using same format as Auto Plan
        const departure = flightData.departure.name || 'DEP';
        const firstLocation = flightData.landings[0]?.name || 'DEST';
        
        // Use departure time for date formatting
        let shortDate;
        if (flightData.departureTime) {
          const depDate = new Date(flightData.departureTime);
          shortDate = depDate.toISOString().slice(2, 16).replace('T', ', ');
        } else {
          const now = new Date();
          shortDate = now.toISOString().slice(2, 16).replace('T', ', ');
        }
        
        const autoFlightName = `${departure} ${firstLocation} ${shortDate}`;
        console.log('🧙‍♂️ Auto-generated flight name:', autoFlightName);
        
        setFlightData(prev => ({
          ...prev,
          flightName: autoFlightName
        }));
      }
    }
    
    // If advancing from landings to aircraft, send buffered landings to main planner
    if (currentStepData.id === 'landings' && currentStep < steps.length - 1) {
      console.log('🧙‍♂️ Sending buffered landings to main flight planner');
      
      // Send all landings to the flight planner now
      flightData.landings.forEach(landing => {
        const locName = landing.originalName || landing.locName || landing.name || landing.location_name;
        if (locName && onAddWaypoint) {
          console.log('🧙‍♂️ Adding buffered waypoint to flight planner:', locName);
          onAddWaypoint(locName);
        }
      });
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Handle going back - clear main planner if going back to edit landings
  const handleBack = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      
      // If going back to landings step from aircraft, clear the main planner
      // so user can rebuild the list cleanly without duplicates
      if (steps[newStep].id === 'landings' && onClearRoute) {
        console.log('🧙‍♂️ Going back to edit landings - clearing main planner to prevent duplicates');
        onClearRoute(true); // Preserve flight data, just clear waypoints
        
        // Re-add the departure since we're only editing landings
        if (flightData.departure) {
          const locName = flightData.departure.originalName || flightData.departure.locName || flightData.departure.name;
          if (locName && onAddWaypoint) {
            setTimeout(() => {
              console.log('🧙‍♂️ Re-adding departure after clear:', locName);
              onAddWaypoint(locName);
            }, 100);
          }
        }
      }
      
      setCurrentStep(newStep);
    }
  };
  
  // Handle completion - trigger auto-plan
  const handleComplete = () => {
    console.log('🧙‍♂️ Wizard Complete - Auto Planning with data:', flightData);
    
    // Build waypoints array from flight data using originalName for system compatibility
    const waypoints = [];
    if (flightData.departure) {
      waypoints.push({
        ...flightData.departure,
        name: flightData.departure.originalName || flightData.departure.name
      });
    }
    if (flightData.landings) {
      waypoints.push(...flightData.landings.map(landing => ({
        ...landing,
        name: landing.originalName || landing.name
      })));
    }
    
    // Pass complete flight data to parent for auto-planning
    const completeFlightData = {
      ...flightData,
      waypoints: waypoints,
      autoRun: true // Flag to trigger auto-plan
    };
    
    console.log('🧙‍♂️ Wizard: Using original names for system:', waypoints.map(w => w.name));
    console.log('🧙‍♂️ Wizard: Complete flight data being sent:', completeFlightData);
    console.log('🧙‍♂️ Wizard: Departure time being sent:', completeFlightData.departureTime);
    
    onComplete(completeFlightData);
    handleClose();
  };
  
  // Progress percentage
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  if (!isVisible) return null;
  
  return (
    <div className="flight-wizard-overlay">
      <div className="flight-wizard-container">
        {/* Progress bar */}
        <div className="wizard-progress">
          <div 
            className="wizard-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Main wizard card */}
        <div className="wizard-card">
          {/* Close button inside card */}
          <button className="wizard-close-btn" onClick={handleClose}>
            ×
          </button>
          {currentStepData.id === 'welcome' && (
            <div className="wizard-step welcome-step">
              <div className="welcome-header">
                Welcome to Flight Planning
              </div>
              <div className="user-name-display">
                {userDetails && userDetails.givenName && (
                  <div className={`user-first-name ${showFirstName ? 'fade-in' : ''}`}>
                    {userDetails.givenName}
                  </div>
                )}
                {userDetails && userDetails.familyName && (
                  <div className={`user-last-name ${showLastName ? 'fade-in' : ''}`}>
                    {userDetails.familyName}
                  </div>
                )}
                {userDetails && !userDetails.givenName && !userDetails.familyName && (
                  <div className={`user-first-name ${showFirstName ? 'fade-in' : ''}`}>
                    Pilot
                  </div>
                )}
              </div>
              <p>Choose how you'd like to continue:</p>
              <div className="wizard-choice-buttons">
                <button className="wizard-btn primary" onClick={() => setCurrentStep(2)}>
                  Build New Flight
                </button>
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(1)}>
                  Load/Edit Flight
                </button>
              </div>
              <label className="wizard-checkbox">
                <input 
                  type="checkbox" 
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                Don't show this again
              </label>
            </div>
          )}
          
          {currentStepData.id === 'flightList' && (
            <div className="wizard-step flight-list-step">
              <h2>{currentStepData.title}</h2>
              <p>Select an existing flight to load and edit:</p>
              
              {/* Search controls */}
              <div className="flight-search-controls">
                <div className="search-row">
                  <input
                    type="text"
                    placeholder="Search flights by name..."
                    value={flightSearchTerm}
                    onChange={(e) => setFlightSearchTerm(e.target.value)}
                    className="wizard-search-input"
                  />
                  <input
                    type="date"
                    value={flightSearchDate}
                    onChange={(e) => setFlightSearchDate(e.target.value)}
                    className="wizard-date-input"
                  />
                </div>
              </div>
              
              {/* Flight list */}
              <div className="flight-list-container">
                {isLoadingFlights ? (
                  <div className="flight-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading flights...</p>
                  </div>
                ) : filteredFlights.length > 0 ? (
                  <div className="flight-list">
                    {filteredFlights.map((flight, index) => (
                      <div 
                        key={flight.__primaryKey || flight.flightId || flight.id || index}
                        className="flight-item"
                        style={{
                          opacity: 0,
                          transform: 'translateY(20px)',
                          animation: `cascadeIn 0.4s ease-out forwards ${index * 0.1}s`
                        }}
                        onClick={() => handleFlightSelect(flight)}
                      >
                        <div className="flight-name">
                          {flight.flightNumber || flight.flightName || flight.name || 'Unnamed Flight'}
                        </div>
                        <div className="flight-route">
                          {flight.stops && flight.stops.length > 0 ? 
                            flight.stops.join(' → ') :
                            flight.departure && flight.destination ? 
                              `${flight.departure} → ${flight.destination}` :
                              'No route information'
                          }
                        </div>
                        <div className="flight-details">
                          {(flight.date || flight.etd || flight.departureTime || flight.createdAt) && (
                            <span className="flight-date">
                              {(() => {
                                const dateStr = flight.date || flight.etd || flight.departureTime || flight.createdAt;
                                try {
                                  const date = new Date(dateStr);
                                  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                                } catch (e) {
                                  return dateStr; // Fallback to raw string if parsing fails
                                }
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-flights">
                    <p>No flights found matching your search criteria.</p>
                  </div>
                )}
              </div>
              
              {/* Back button */}
              <div className="wizard-nav-buttons">
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(0)}>
                  Back to Start
                </button>
              </div>
            </div>
          )}
          
          {(currentStepData.id === 'departure' || currentStepData.id === 'landings') && (
            <div className="wizard-step location-step">
              <h2>{currentStepData.title}</h2>
              
              {/* Step-specific instructions */}
              {currentStepData.id === 'departure' && (
                <p>Search for your departure location and select it from the results below.</p>
              )}
              {currentStepData.id === 'landings' && (
                <p>Add any <strong>rigs, platforms, and your final destination</strong>. The last location you add will be your final destination.</p>
              )}
              
              {/* Show current route being built */}
              {(flightData.departure || flightData.landings.length > 0) && (
                <div className="route-preview">
                  <h4>Your Route:</h4>
                  <div className="route-list">
                    {flightData.departure && (
                      <div className="route-item departure">
                        <span className="route-icon">FROM</span> {flightData.departure.name}
                      </div>
                    )}
                    {flightData.landings.map((landing, index) => {
                      const isLast = index === flightData.landings.length - 1;
                      const color = getLandingColor(index);
                      return (
                        <div 
                          key={index} 
                          className={`route-item ${isLast ? 'destination' : 'stop'}`}
                          style={{ borderLeftColor: color }}
                        >
                          <span 
                            className="route-icon"
                            style={{ backgroundColor: color }}
                          >
                            {isLast ? 'TO' : `${index + 1}`}
                          </span> 
                          {landing.name}
                          <button 
                            className="remove-stop-btn"
                            onClick={() => {
                              setFlightData(prev => ({
                                ...prev,
                                landings: prev.landings.filter((_, i) => i !== index)
                              }));
                            }}
                            title="Remove this landing"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Search input */}
              <div className="wizard-search">
                <div className="search-input-container">
                  <input
                    type="text"
                    value={currentInput}
                    onChange={(e) => {
                      setCurrentInput(e.target.value);
                      handleLocationSearch(e.target.value);
                    }}
                    onPaste={(e) => {
                      // Handle pasted text
                      setTimeout(() => {
                        const pastedValue = e.target.value;
                        handleLocationSearch(pastedValue);
                      }, 10);
                    }}
                    placeholder={
                      currentStepData.id === 'departure' ? "Enter departure location (e.g. Houston, KHOU, platform name...)" :
                      currentStepData.id === 'landings' ? "Enter rig, platform, or destination (e.g. rig name, airport code...)" :
                      "Enter location name, code, or coordinates..."
                    }
                    className="wizard-input"
                  />
                  {validationStatus === 'searching' && <div className="search-status searching">🔍</div>}
                  {validationStatus === 'valid' && <div className="search-status valid">✅</div>}
                  {validationStatus === 'invalid' && <div className="search-status invalid">❌</div>}
                </div>
                
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="search-results">
                    {searchResults.slice(0, 5).map((result, index) => (
                      <button
                        key={index}
                        className="search-result-item"
                        onClick={() => handleLocationSelect(result)}
                      >
                        <span className="result-name">{result.name}</span>
                        <span className="result-details">{result.type || 'Location'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Navigation buttons */}
              <div className="wizard-buttons">
                {currentStep > 1 && (
                  <button className="wizard-btn secondary" onClick={handleBack}>
                    Back
                  </button>
                )}
                {currentStepData.id === 'landings' && flightData.landings.length > 0 && (
                  <button className="wizard-btn primary" onClick={handleNext}>
                    Choose Aircraft
                  </button>
                )}
                {currentStepData.id !== 'landings' && validationStatus === 'valid' && (
                  <button className="wizard-btn primary" onClick={handleNext}>
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
          
          {currentStepData.id === 'aircraft' && (
            <div className="wizard-step aircraft-step">
              <h2>{currentStepData.title}</h2>
              
              {/* DEBUG: Show aircraft data */}
              {console.log('🧙‍♂️ Aircraft Types Debug:', aircraftTypes)}
              {console.log('🧙‍♂️ Aircraft Types Keys:', Object.keys(aircraftTypes || {}))}
              {console.log('🧙‍♂️ Aircraft Types Length:', Object.keys(aircraftTypes || {}).length)}
              
              <div className="aircraft-selection">
                {(!aircraftTypes || aircraftTypes.length === 0) ? (
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic' }}>
                    Loading aircraft data from OSDK...
                  </p>
                ) : (
                  <select 
                    className="wizard-select"
                    onChange={(e) => {
                      const aircraftType = e.target.value;
                      setFlightData(prev => ({ ...prev, aircraftType }));
                    }}
                  >
                    <option value="">Select aircraft type...</option>
                    {aircraftTypes.map((type, index) => (
                      <option key={index} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                )}
                
                {flightData.aircraftType && aircraftsByType[flightData.aircraftType] && (
                  <select 
                    className="wizard-select"
                    onChange={(e) => {
                      const aircraft = aircraftsByType[flightData.aircraftType].find(a => a.registration === e.target.value);
                      setFlightData(prev => ({ ...prev, aircraft }));
                    }}
                  >
                    <option value="">Select specific aircraft...</option>
                    {aircraftsByType[flightData.aircraftType].map(aircraft => (
                      <option key={aircraft.registration} value={aircraft.registration}>
                        {aircraft.registration}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="wizard-buttons">
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </button>
                {flightData.aircraft && (
                  <button className="wizard-btn primary" onClick={handleNext}>
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
          
          {currentStepData.id === 'passengers' && (
            <div className="wizard-step passengers-step">
              <PassengerInputStep
                flightData={flightData}
                onFlightDataUpdate={setFlightData}
                className="passenger-input-wizard"
              />
              
              <div className="wizard-buttons">
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </button>
                <button className="wizard-btn primary" onClick={handleNext}>
                  Next
                </button>
              </div>
            </div>
          )}
          
          {currentStepData.id === 'time' && (
            <div className="wizard-step time-step">
              <h2>{currentStepData.title}</h2>
              <p>Select your departure date and time for this flight.</p>
              
              <div className="time-selection">
                <div className="time-input-group">
                  <label className="time-label">Departure Date:</label>
                  <input
                    type="date"
                    className="wizard-input"
                    value={flightData.departureTime ? flightData.departureTime.split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value;
                      const time = flightData.departureTime ? flightData.departureTime.split('T')[1] : '09:00';
                      setFlightData(prev => ({ 
                        ...prev, 
                        departureTime: date ? `${date}T${time}` : null 
                      }));
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="time-input-group">
                  <label className="time-label">Departure Time:</label>
                  <input
                    type="time"
                    className="wizard-input"
                    value={flightData.departureTime ? flightData.departureTime.split('T')[1] : '09:00'}
                    onChange={(e) => {
                      const time = e.target.value;
                      const date = flightData.departureTime ? 
                        flightData.departureTime.split('T')[0] : 
                        new Date().toISOString().split('T')[0];
                      setFlightData(prev => ({ 
                        ...prev, 
                        departureTime: `${date}T${time}` 
                      }));
                    }}
                  />
                </div>
                
                {/* Quick time buttons */}
                <div className="quick-time-buttons">
                  <button 
                    className="wizard-btn secondary"
                    onClick={() => {
                      const oneHourFromNow = new Date();
                      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
                      const date = oneHourFromNow.toISOString().split('T')[0];
                      const time = oneHourFromNow.toTimeString().slice(0, 5);
                      setFlightData(prev => ({ ...prev, departureTime: `${date}T${time}` }));
                    }}
                  >
                    +1 Hour
                  </button>
                  <button 
                    className="wizard-btn secondary"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      tomorrow.setHours(7, 0, 0, 0);
                      const date = tomorrow.toISOString().split('T')[0];
                      setFlightData(prev => ({ ...prev, departureTime: `${date}T07:00` }));
                    }}
                  >
                    Tomorrow 7AM
                  </button>
                </div>
              </div>
              
              <div className="wizard-buttons">
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </button>
                {flightData.departureTime && (
                  <button className="wizard-btn primary" onClick={handleNext}>
                    Next
                  </button>
                )}
              </div>
            </div>
          )}
          
          {currentStepData.id === 'complete' && (
            <div className="wizard-step complete-step">
              <h2>Ready to Plan</h2>
              <p>Your flight is ready to be planned automatically.</p>
              
              <div className="flight-summary">
                {/* 🧙‍♂️ FLIGHT NAME: Add editable flight name to summary */}
                <div className="summary-flight-name">
                  <strong>Flight Name:</strong>
                  <input
                    type="text"
                    value={flightData.flightName || ''}
                    onChange={(e) => setFlightData(prev => ({ ...prev, flightName: e.target.value }))}
                    className="wizard-input flight-name-input"
                    placeholder="Auto-generated flight name"
                  />
                </div>
                
                {flightData.departureTime && (
                  <div className="summary-departure-time">
                    <strong>Departure:</strong> {new Date(flightData.departureTime).toLocaleString()}
                  </div>
                )}
                
                <div className="summary-route">
                  <strong>Route:</strong> 
                  <div className="route-flow">
                    <span 
                      className="route-location departure"
                      style={{
                        opacity: 0,
                        transform: 'translateY(20px)',
                        animation: `cascadeIn 0.4s ease-out forwards 0s`
                      }}
                    >
                      {flightData.departure?.name}
                    </span>
                    {flightData.landings.map((landing, index) => {
                      const isLast = index === flightData.landings.length - 1;
                      const animationDelay = (index + 1) * 0.1;
                      return (
                        <React.Fragment key={index}>
                          <span 
                            className="route-arrow"
                            style={{
                              opacity: 0,
                              animation: `cascadeIn 0.4s ease-out forwards ${animationDelay}s`
                            }}
                          >
                            →
                          </span>
                          <span 
                            className={`route-location ${isLast ? 'destination' : 'stop'}`}
                            style={{
                              opacity: 0,
                              transform: 'translateY(20px)',
                              animation: `cascadeIn 0.4s ease-out forwards ${animationDelay + 0.05}s`
                            }}
                          >
                            {landing.name}
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
                
                <div className="summary-aircraft">
                  <strong>Aircraft:</strong> {flightData.aircraft?.registration || flightData.aircraftType}
                </div>
              </div>
              
              <div className="wizard-buttons">
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </button>
                <button className="wizard-btn primary large" onClick={handleComplete}>
                  Auto Plan Flight
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Skip option */}
        <button className="wizard-skip" onClick={onSkip}>
          Skip wizard - use manual mode
        </button>
      </div>
    </div>
  );
};

export default FlightWizard;