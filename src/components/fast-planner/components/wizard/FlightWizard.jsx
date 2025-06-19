import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
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
  // Data and handlers from parent
  regions = [],
  searchLocation,
  onAddWaypoint,
  aircraftTypes = [],
  aircraftsByType = {},
  selectedAircraft,
  onAircraftSelect
}) => {
  // Get user details from auth context
  const { userDetails, userName } = useAuth();
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  // Flight building state
  const [flightData, setFlightData] = useState({
    departure: null,
    stops: [],
    destination: null,
    aircraft: null,
    aircraftType: null,
    departureTime: null,
    passengers: {}
  });
  
  // Current input state
  const [currentInput, setCurrentInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [validationStatus, setValidationStatus] = useState(null); // 'valid', 'invalid', 'searching'
  
  // Steps definition
  const steps = [
    { id: 'welcome', title: 'Welcome to FastPlanner' },
    { id: 'departure', title: 'Where are you departing from?' },
    { id: 'stops', title: 'Any stops along the way?' },
    { id: 'destination', title: 'What\'s your final destination?' },
    { id: 'aircraft', title: 'Which aircraft will you use?' },
    { id: 'time', title: 'When do you want to depart?' },
    { id: 'complete', title: 'Ready to plan your flight!' }
  ];
  
  const currentStepData = steps[currentStep];
  
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
    } else if (stepId === 'stops') {
      setFlightData(prev => ({ 
        ...prev, 
        stops: [...prev.stops, location] 
      }));
      // Add to actual flight planner immediately - use originalName for clean locName
      const locName = location.originalName || location.locName || location.name || location.location_name;
      if (locName && onAddWaypoint) {
        console.log('🧙‍♂️ Adding waypoint to flight planner:', locName);
        onAddWaypoint(locName);
      } else {
        console.warn('🧙‍♂️ Cannot add waypoint - missing locName or onAddWaypoint function');
      }
      // For stops, just clear the input - don't auto-advance (user might want more stops)
    } else if (stepId === 'destination') {
      setFlightData(prev => ({ ...prev, destination: location }));
      // Add to actual flight planner immediately - use originalName for clean locName
      const locName = location.originalName || location.locName || location.name || location.location_name;
      if (locName && onAddWaypoint) {
        console.log('🧙‍♂️ Adding waypoint to flight planner:', locName);
        onAddWaypoint(locName);
      } else {
        console.warn('🧙‍♂️ Cannot add waypoint - missing locName or onAddWaypoint function');
      }
      // Auto-advance to aircraft selection after selecting destination
      setTimeout(() => handleNext(), 500);
    }
    
    setCurrentInput('');
    setSearchResults([]);
    setValidationStatus(null);
  };
  
  // Handle next step
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
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
    if (flightData.stops) {
      waypoints.push(...flightData.stops.map(stop => ({
        ...stop,
        name: stop.originalName || stop.name
      })));
    }
    if (flightData.destination) {
      waypoints.push({
        ...flightData.destination,
        name: flightData.destination.originalName || flightData.destination.name
      });
    }
    
    // Pass complete flight data to parent for auto-planning
    const completeFlightData = {
      ...flightData,
      waypoints: waypoints,
      autoRun: true // Flag to trigger auto-plan
    };
    
    console.log('🧙‍♂️ Wizard: Using original names for system:', waypoints.map(w => w.name));
    
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
                {userDetails?.givenName && (
                  <div className="user-first-name">{userDetails.givenName}</div>
                )}
                {userDetails?.familyName && (
                  <div className="user-last-name">{userDetails.familyName}</div>
                )}
                {!userDetails?.givenName && !userDetails?.familyName && (
                  <div className="user-first-name">Pilot</div>
                )}
              </div>
              <p>Let's plan your flight step by step.<br/>It only takes a minute!</p>
              <button className="wizard-btn primary" onClick={handleNext}>
                Start Planning
              </button>
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
          
          {(currentStepData.id === 'departure' || currentStepData.id === 'stops' || currentStepData.id === 'destination') && (
            <div className="wizard-step location-step">
              <h2>{currentStepData.title}</h2>
              
              {/* Step-specific instructions */}
              {currentStepData.id === 'departure' && (
                <p>Search for your departure location and select it from the results below.</p>
              )}
              {currentStepData.id === 'stops' && (
                <p>Add any <strong>offshore stops</strong> (rigs, platforms) along your route, or click "Add Final Destination" to continue.</p>
              )}
              {currentStepData.id === 'destination' && (
                <p>Search for your final destination and select it from the results below.</p>
              )}
              
              {/* Show current route being built */}
              {(flightData.departure || flightData.stops.length > 0) && (
                <div className="route-preview">
                  <h4>Your Route:</h4>
                  <div className="route-list">
                    {flightData.departure && (
                      <div className="route-item departure">
                        <span className="route-icon">FROM</span> {flightData.departure.name}
                      </div>
                    )}
                    {flightData.stops.map((stop, index) => (
                      <div key={index} className="route-item stop">
                        <span className="route-icon">STOP</span> {stop.name}
                        <button 
                          className="remove-stop-btn"
                          onClick={() => {
                            setFlightData(prev => ({
                              ...prev,
                              stops: prev.stops.filter((_, i) => i !== index)
                            }));
                          }}
                          title="Remove this stop"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {currentStepData.id === 'destination' && (
                      <div className="route-item destination building">
                        <span className="route-icon">TO</span> Adding destination...
                      </div>
                    )}
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
                      currentStepData.id === 'stops' ? "Enter stop location (e.g. rig name, platform, airport...)" :
                      currentStepData.id === 'destination' ? "Enter destination location (e.g. rig name, airport code...)" :
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
                  <button className="wizard-btn secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                    Back
                  </button>
                )}
                {currentStepData.id === 'stops' && (
                  <button className="wizard-btn primary" onClick={handleNext}>
                    Add Final Destination
                  </button>
                )}
                {currentStepData.id !== 'stops' && validationStatus === 'valid' && (
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
                {flightData.departureTime && (
                  <div className="summary-departure-time">
                    <strong>Departure:</strong> {new Date(flightData.departureTime).toLocaleString()}
                  </div>
                )}
                
                <div className="summary-route">
                  <strong>Route:</strong> 
                  <div className="route-flow">
                    <span className="route-location departure">{flightData.departure?.name}</span>
                    {flightData.stops.map((stop, index) => (
                      <React.Fragment key={index}>
                        <span className="route-arrow">→</span>
                        <span className="route-location stop">{stop.name}</span>
                      </React.Fragment>
                    ))}
                    <span className="route-arrow">→</span>
                    <span className="route-location destination">{flightData.destination?.name}</span>
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