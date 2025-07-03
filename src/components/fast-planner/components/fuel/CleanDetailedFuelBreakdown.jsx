/**
 * CleanDetailedFuelBreakdown.jsx
 * 
 * CLEAN VERSION of the fuel breakdown interface.
 * Uses FuelInputManager to eliminate the 4 competing state systems.
 * 
 * Key improvements:
 * - Single FuelInputManager instead of 4 state systems
 * - Clean FuelInput components instead of complex TinyInput
 * - No massive handleFieldChange function
 * - No competing synchronization logic
 * - Simple, predictable data flow
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import FuelInputManager from '../../modules/fuel/FuelInputManager';
import SimpleFuelInput from './SimpleFuelInput';
import StopCardCalculator from '../../modules/calculations/flight/StopCardCalculator';
import { DistanceIcon, TimeIcon, FuelIcon, PassengerIcon } from '../flight/stops/StopIcons';
import { detectLocationSegment, getSegmentLocations } from '../../utilities/SegmentUtils.js';
import './FuelStyles.css'; // Import the existing fuel breakdown styles

// Time formatting function
const formatTime = (timeHours) => {
  if (!timeHours && timeHours !== 0) return '00:00';
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const CleanDetailedFuelBreakdown = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  weatherSegments = [],
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  waypoints = [],
  weather = { windSpeed: 0, windDirection: 0 },
  locationFuelOverrides = {},
  waiveAlternates = false,
  alternateStopCard = null,
  alternateRouteData = null,
  // Main callback to update parent
  onFuelDataChanged = () => {}
}) => {
  
  // 🔥 STABLE REFUEL DETECTION: Use ref to maintain refuel stops during fuel input
  const refuelStopsRef = useRef([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [globalSettingsCollapsed, setGlobalSettingsCollapsed] = useState(true);
  
  // ✅ ALTERNATE REQUIREMENTS DETECTION: Check which specific values are affected by alternate minimums
  const getAlternateRequirements = useCallback((stopCard) => {
    // Return the alternateRequirements flag from the specific stop card
    // This tells us if THIS specific stop's fuel/passenger values are constrained by alternates
    return stopCard?.alternateRequirements || false;
  }, []);
  
  // Read refuel stops from stopCards when component opens or stopCards change
  useEffect(() => {
    if (!stopCards || stopCards.length === 0) {
      return;
    }
    
    // Only read when visible and either not initialized or stopCards have changed
    if (!visible) {
      return;
    }
    
    const stops = [];
    stopCards.forEach((card, index) => {
      if (card.refuelMode === true || card.isRefuelStop === true) {
        stops.push(card.index || index); // Use card.index like EnhancedStopCardsContainer
      }
    });
    
    // Always update refuel stops when stopCards change (not just first time)
    const newStopsStr = JSON.stringify(stops.sort());
    const currentStopsStr = JSON.stringify(refuelStopsRef.current.sort());
    
    if (newStopsStr !== currentStopsStr) {
      refuelStopsRef.current = stops;
    }
    
    if (!isInitialized) {
      setIsInitialized(true);
    }
  }, [visible, stopCards, isInitialized]); // Re-read when visible, stopCards change, or initialization state changes
  
  const refuelStops = refuelStopsRef.current;

  // Create single FuelInputManager instance
  const fuelManager = useMemo(() => {
    const manager = new FuelInputManager(flightSettings, locationFuelOverrides);
    
    // Update flight data immediately if we have stop cards
    if (stopCards.length > 0) {
      manager.updateFlightData(stopCards, refuelStops, weatherSegments, fuelPolicy);
    }
    
    return manager;
  }, [refuelStops, stopCards, weatherSegments, fuelPolicy]);
  
  // 🚀 SIMPLE STATE: Direct fuel overrides (must be declared before useMemo)
  const [fuelOverrides, setFuelOverrides] = useState({});
  
  // 🔥 DIRECT CALCULATION: Calculate stop cards directly in render to avoid state sync issues
  const displayStopCards = useMemo(() => {
    if (!waypoints || waypoints.length === 0 || !selectedAircraft) {
      return stopCards; // Fallback to prop if can't calculate
    }
    
    try {
      // Format overrides to match expected structure
      const formattedOverrides = {};
      Object.entries(fuelOverrides).forEach(([key, val]) => {
        formattedOverrides[key] = { value: val };
      });
      
      const effectiveSettings = {
        ...flightSettings,
        locationFuelOverrides: formattedOverrides
      };
      
      // Just call StopCardCalculator normally - it should handle segments via refuelStops parameter
      
      const calculatedCards = StopCardCalculator.calculateStopCards(
        waypoints,
        routeStats,
        selectedAircraft,
        weather,
        effectiveSettings,
        weatherSegments,
        refuelStops,
        waiveAlternates,
        alternateStopCard
      );
      
      
      // 🛩️ PRESERVE REFUEL FLAGS: Restore refuel information from local refuelStops array (MATCH EnhancedStopCardsContainer)
      const cardsWithRefuel = calculatedCards.map((card, index) => {
        const cardIndex = card.index;
        const isRefuelStop = refuelStops.includes(cardIndex);
        
        if (isRefuelStop) {
          return {
            ...card,
            refuelMode: true,
            isRefuelStop: true
          };
        }
        
        return card;
      });
      
      return cardsWithRefuel;
      
    } catch (error) {
      console.error('🔥 MEMO: Calculation error:', error);
      return stopCards; // Fallback to prop if calculation fails
    }
  }, [waypoints, selectedAircraft, routeStats, weather, flightSettings, weatherSegments, refuelStops, waiveAlternates, alternateStopCard, fuelOverrides]);
  
  // 🛡️ RACE CONDITION FIX: Only allow updates after component is mounted
  const [isMounted, setIsMounted] = useState(false);
  
  // 🔧 STABLE CALLBACK: Use ref to avoid recreation on every render
  const onFuelDataChangedRef = useRef(onFuelDataChanged);
  useEffect(() => {
    onFuelDataChangedRef.current = onFuelDataChanged;
  });
  
  // Stable callback that won't change reference
  const stableOnFuelDataChanged = useCallback((effectiveSettings) => {
    if (onFuelDataChangedRef.current) {
      onFuelDataChangedRef.current(effectiveSettings);
    }
  }, []);
  
  // Mark component as mounted after initial render
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Reset initialization when component becomes visible
  useEffect(() => {
    if (visible && !isInitialized) {
    }
    if (!visible && isInitialized) {
      setIsInitialized(false);
      refuelStopsRef.current = [];
    }
  }, [visible]);
  
  // 🚀 DIRECT CALCULATOR: Removed - now handled directly in setState callback to avoid closure issues
  
  // 🚀 SIMPLE FUEL CHANGE: Update local state and recalculate immediately  
  const handleFuelChange = useCallback((stopName, fuelType, value) => {
    
    // Update local state with simple key-value overrides (NO SYNC during typing)
    setFuelOverrides(prev => {
      const key = `${stopName}_${fuelType}`;
      const newOverrides = {
        ...prev,
        [key]: value
      };
      
      
      return newOverrides;
    });
  }, []);
  
  // Separate function for when user finishes typing (onBlur)
  const handleFuelBlur = useCallback((stopName, fuelType, value) => {
    
    // Only sync to parent when user finishes typing
    if (onFuelDataChanged && value !== '') {
      const fuelChangeData = {
        stopName: stopName,
        fuelType: fuelType, 
        value: value,
        // 🚫 DO NOT SEND REFUEL STOPS: Detailed page should not override main UI refuel state
        stopIndex: undefined, // Will be detected in handleLocationFuelChange
        isRig: undefined // Will be detected in handleLocationFuelChange
      };
      
      onFuelDataChanged(fuelChangeData);
    }
  }, [onFuelDataChanged, refuelStops]);
  
  // ✅ SIMPLE FIX: Get reserve fuel from stop cards (they already have it calculated correctly)
  const getReserveFuelFromStopCards = useCallback(() => {
    // The stop cards already have the correct calculated reserve fuel
    if (stopCards && stopCards.length > 0) {
      const departureCard = stopCards.find(card => card.isDeparture);
      if (departureCard && departureCard.fuelComponentsObject?.reserveFuel) {
        return departureCard.fuelComponentsObject.reserveFuel;
      }
    }
    // Fallback: use raw value from flight settings
    return flightSettings.reserveFuel || 30;
  }, [stopCards, flightSettings]);

  const getFuelValue = useCallback((stopName, fuelType) => {
    const key = `${stopName}_${fuelType}`;
    
    // For reserve fuel, use calculated value from stop cards instead of raw settings
    if (fuelType === 'reserveFuel') {
      const value = fuelOverrides[key];
      return value !== undefined ? value : getReserveFuelFromStopCards();
    }
    
    // For taxi fuel, check override first, then fall back to flight settings
    if (fuelType === 'taxiFuel') {
      const value = fuelOverrides[key];
      return value !== undefined ? value : (flightSettings.taxiFuel || 30);
    }
    
    // For other fuel types, return the override value or empty string (for input display)
    const value = fuelOverrides[key];
    return value !== undefined ? value : '';
  }, [fuelOverrides, flightSettings, getReserveFuelFromStopCards]);
  
  const handleApplyChanges = useCallback(() => {
    
    // Convert simple overrides to FuelInputManager format
    Object.entries(fuelOverrides).forEach(([key, value]) => {
      const [stopName, fuelType] = key.split('_');
      fuelManager.updateLocationFuel(stopName, fuelType, value);
    });
    
    // 🛩️ SEGMENT-AWARE: Apply changes calls individual fuel changes already via handleFuelChange
    // No need to call onFuelDataChanged here as each fuel change triggers it individually
  }, [fuelOverrides, fuelManager, onFuelDataChanged, refuelStops]);
  
  // 🔥 REMOVED: No longer needed since displayStopCards is calculated via useMemo
  
  // Update fuel manager with new flight data (separate effect to avoid loops)
  useEffect(() => {
    if (stopCards.length > 0 && isMounted) {
      fuelManager.updateFlightData(stopCards, refuelStops, weatherSegments, fuelPolicy);
    }
  }, [stopCards, refuelStops, isMounted, weatherSegments, fuelPolicy]);
  
  // Update fuel manager when external settings change (ONLY if mounted)
  useEffect(() => {
    if (!isMounted) {
      return;
    }
    
    fuelManager.bulkUpdateSettings(flightSettings);
  }, [flightSettings, isMounted]);
  
  // Get weather values for inputs
  const getWeatherValue = (stopName, fuelType) => {
    if (!weatherSegments || weatherSegments.length === 0) return 0;
    
    const segment = weatherSegments.find(segment => 
      segment.airportIcao === stopName ||
      segment.locationName === stopName ||
      segment.location === stopName ||
      segment.uniqueId === stopName
    );
    
    if (!segment) return 0;
    
    // Simple logic: if ranking indicates fuel needed, suggest amount
    if (fuelType === 'araFuel' && segment.isRig && (segment.ranking2 === 8 || segment.ranking2 === 5)) {
      return fuelPolicy?.araFuelDefault || 200;
    }
    
    if (fuelType === 'approachFuel' && !segment.isRig && (segment.ranking2 === 10 || segment.ranking2 === 5)) {
      return fuelPolicy?.approachFuelDefault || 150;
    }
    
    return 0;
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }} onClick={onClose}>
      <div style={{
        background: '#1e1e1e',
        borderRadius: '12px',
        width: 'min(95vw, 750px)',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6)',
        color: '#fff',
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)'
      }} onClick={(e) => e.stopPropagation()}>
        <div className="fuel-modal-header">
          <h2>Detailed Fuel & Passenger Management</h2>
          <button className="fuel-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="fuel-modal-body">
          
          {/* Global Fuel Settings */}
          <div style={{ marginBottom: '12px' }}>
            <h3 
              onClick={() => setGlobalSettingsCollapsed(!globalSettingsCollapsed)}
              style={{ 
                cursor: 'pointer', 
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                margin: '0',
                padding: '6px 12px',
                backgroundColor: '#2a2a2a',
                borderRadius: '4px',
                height: '32px'
              }}
            >
              <span style={{ 
                transform: globalSettingsCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                fontSize: '0.7rem'
              }}>▼</span>
              Global Fuel Settings
            </h3>
            {!globalSettingsCollapsed && (
            <div className="fuel-grid" style={{ padding: '8px 0', marginTop: '4px' }}>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Extra Fuel (lbs):</label>
                <input
                  type="number"
                  value={flightSettings?.extraFuel || 0}
                  placeholder="0"
                  style={{
                    width: '80px',
                    padding: '6px',
                    backgroundColor: '#2c2c2c',
                    color: '#fff',
                    border: '1px solid #666',
                    borderRadius: '4px'
                  }}
                  readOnly
                />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Taxi Fuel (lbs):</label>
                <input type="number" value={flightSettings?.taxiFuel || 0} placeholder="30" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Deck Time per Stop (min):</label>
                <input type="number" value={flightSettings?.deckTimePerStop || 0} placeholder="5" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Deck Fuel Flow (lbs/hr):</label>
                <input type="number" value={flightSettings?.deckFuelFlow || 0} placeholder="25" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Contingency (%):</label>
                <input type="number" value={flightSettings?.contingencyFuelPercent || 0} placeholder="5" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
              </div>
              
              <div className="fuel-row">
                <label style={{fontSize: '0.6rem'}}>Reserve Fuel:</label>
                <div>
                  <div style={{
                    fontSize: '0.5rem',
                    color: '#888',
                    marginBottom: '1px',
                    textAlign: 'center'
                  }}>
                    {(() => {
                      const currentPolicy = fuelPolicy?.currentPolicy;
                      if (currentPolicy?.fuelTypes?.reserveFuel?.type === 'time' && selectedAircraft?.fuelBurn) {
                        const timeMinutes = currentPolicy.fuelTypes.reserveFuel.default || 0;
                        return `(${timeMinutes} min × ${selectedAircraft.fuelBurn} lbs/hr)`;
                      }
                      return '(lbs)';
                    })()}
                  </div>
                  <input type="number" value={getReserveFuelFromStopCards()} placeholder="20" style={{width: '80px', padding: '6px', backgroundColor: '#2c2c2c', color: '#fff', border: '1px solid #666', borderRadius: '4px'}} readOnly />
                </div>
              </div>
              
            </div>
            )}
          </div>
          
          {/* Stop Cards with Fuel Inputs */}
          <div className="fuel-section">
            <h3>Stop-Specific Fuel & Passengers</h3>
            
            {displayStopCards.map((card, index) => {
              const stopName = card.name || card.stopName || `stop_${index}`;
              const isRefuelStop = card.refuelMode === true || card.isRefuelStop === true;
              
              // Get fuel summary for this stop from segment manager
              const fuelSummary = fuelManager.getFuelSummaryForStop(index);
              
              // Determine if this stop needs ARA/approach fuel inputs
              const weatherSegment = weatherSegments?.find(segment => 
                segment.airportIcao === stopName ||
                segment.locationName === stopName ||
                segment.location === stopName ||
                segment.uniqueId === stopName
              );
              
              const isRig = weatherSegment?.isRig || false;
              const isDeparture = index === 0;
              const isDestination = index === displayStopCards.length - 1;
              
              // 🚨 CORRECT AVIATION LOGIC: 
              // - ARA fuel: Only for rigs (any position)
              // - Approach fuel: All airports EXCEPT departure
              // - Extra fuel: Departure and refuel stops
              const showAraInput = isRig;
              const showApproachInput = !isRig && !isDeparture; // All airports except departure
              const showExtraFuelInput = isDeparture || isRefuelStop; // Departure + refuel stops
              
              // 🔍 DEBUG: Cross-connection debugging
              const debugInfo = {
                index: index,
                isRig: isRig,
                isDeparture: isDeparture,
                isDestination: isDestination,
                isRefuelStop: isRefuelStop,
                showAraInput: showAraInput,
                showApproachInput: showApproachInput,
                showExtraFuelInput: showExtraFuelInput,
                weatherSegment: weatherSegment,
                cardPosition: `${index + 1} of ${displayStopCards.length}`
              };
              
              
              return (
                <div key={card.id || index} className={`stop-fuel-card ${isRefuelStop ? 'refuel-stop' : ''}`} style={{
                  marginBottom: 'clamp(16px, 3vw, 24px)',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  background: '#2c2c2c',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  
                  {/* FLIGHT DETAILS - Top of card with location identity */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid #404040',
                    background: '#353535',
                    position: 'relative',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px'
                  }}>
                    
                    {/* Location Type Indicator */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '4px',
                      height: '100%',
                      background: '#666',
                      opacity: 0.6
                    }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#0066cc',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        border: '1px solid #333'
                      }}>
                        {index + 1}
                      </div>
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>{stopName}</h4>
                      <span style={{
                        color: '#888',
                        fontSize: '0.5rem',
                        fontWeight: '400',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>{isRig ? 'rig' : 'airport'}</span>
                      {isRefuelStop && <span style={{
                        background: '#f59e0b',
                        color: '#000',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>REFUEL</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#aaa', fontSize: '0.8rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><DistanceIcon /> {card.totalDistance || card.distance || '0.0'} nm</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><TimeIcon /> {formatTime(card.totalTime || card.timeHours || 0)}</span>
                      <div style={{
                        background: getAlternateRequirements(card) ? 'rgba(52, 52, 52, 0.8)' : '#0066cc',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        border: getAlternateRequirements(card) ? '2px solid #f39c12' : 'none'
                      }}>
                        Required Fuel: <span style={getAlternateRequirements(card) ? { color: '#f39c12' } : {}}>{card.totalFuel || 0}</span> lbs
                        {getAlternateRequirements(card) && (
                          <span style={{
                            fontSize: '0.7em',
                            marginLeft: '8px',
                            fontWeight: 'bold',
                            opacity: 0.9,
                            color: '#f39c12'
                          }}>
                            ALT FUEL REQUIRED
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px 16px' }}>
                    
                    {/* SIDE BY SIDE: Passengers LEFT | Fuel RIGHT */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      marginBottom: '16px',
                      marginLeft: '-16px',
                      marginRight: '-16px'
                    }}>
                      
                      {/* LEFT: Passenger Section */}
                      <div style={{
                        background: '#363636',
                        borderRadius: '6px',
                        padding: '12px 16px 12px 16px'
                      }}>
                      <h5 style={{
                        margin: '0 0 12px 0',
                        color: '#4A9EFF',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}><PassengerIcon /> PASSENGER OPERATIONS</h5>
                      
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        alignItems: 'end'
                      }}>
                        
                        {/* PASSENGERS */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.7rem',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>PASSENGERS</label>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '0.5rem',
                              color: '#888',
                              marginBottom: '1px'
                            }}>Available</div>
                            <div style={{
                              color: getAlternateRequirements(card) ? '#f39c12' : '#fff',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              marginBottom: '6px'
                            }}>{card.maxPassengers || 0}</div>
                            <button style={{
                              width: '100px',
                              padding: '8px',
                              background: '#404040',
                              color: '#ccc',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}>requested</button>
                          </div>
                        </div>
                        
                        {/* WEIGHT */}
                        <div>
                          <label style={{
                            display: 'block',
                            color: '#aaa',
                            fontSize: '0.7rem',
                            marginBottom: '4px',
                            textTransform: 'uppercase'
                          }}>WEIGHT (LBS)</label>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '0.5rem',
                              color: '#888',
                              marginBottom: '1px'
                            }}>Available</div>
                            <div style={{
                              color: getAlternateRequirements(card) ? '#f39c12' : '#fff',
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              marginBottom: '6px'
                            }}>{card.availableWeight || card.maxPassengersWeight || 0}</div>
                            <button style={{
                              width: '100px',
                              padding: '8px',
                              background: '#404040',
                              color: '#ccc',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}>requested</button>
                          </div>
                        </div>
                        
                      </div>
                      </div>
                      
                      {/* RIGHT: Fuel Section */}
                      <div style={{
                        background: '#363636',
                        borderRadius: '6px',
                        padding: '12px 16px 12px 16px'
                      }}>
                      <h5 style={{
                        margin: '0 0 12px 0',
                        color: '#10B981',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}><FuelIcon /> FUEL OPERATIONS</h5>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        gap: '15px',
                        alignItems: 'end'
                      }}>
                        
                        {/* DECK TIME / TAXI FUEL */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            color: '#aaa', 
                            fontSize: '0.7rem', 
                            marginBottom: '4px',
                            textTransform: 'uppercase' 
                          }}>{isDeparture ? 'TAXI FUEL' : 'DECK TIME'}</label>
                          <label style={{ 
                            display: 'block', 
                            color: '#666', 
                            fontSize: '0.6rem', 
                            marginBottom: '6px' 
                          }}>{isDeparture ? '(pounds)' : '(minutes)'}</label>
                          <div style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              value={isDeparture ? (getFuelValue(stopName, 'taxiFuel') || '') : (getFuelValue(stopName, 'deckTime') || '')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isDeparture) {
                                  handleFuelChange(stopName, 'taxiFuel', value);
                                } else {
                                  handleFuelChange(stopName, 'deckTime', value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isDeparture) {
                                  handleFuelBlur(stopName, 'taxiFuel', value);
                                } else {
                                  handleFuelBlur(stopName, 'deckTime', value);
                                }
                              }}
                              placeholder={isDeparture ? "30" : (isRig ? "15" : "0")}
                              style={{
                                width: 'clamp(60px, 12vw, 80px)',
                                padding: '4px 6px',
                                backgroundColor: '#2c2c2c',
                                color: '#fff',
                                border: '1px solid #4A9EFF',
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                height: '24px'
                              }}
                            />
                            <div style={{ 
                              color: '#666', 
                              fontSize: '0.6rem', 
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 'clamp(60px, 12vw, 80px)'
                            }}>
                              {isDeparture ? 'Departure' : (stopName.length > 8 ? stopName.substring(0, 8) + '...' : stopName)}
                            </div>
                          </div>
                        </div>
                        
                        {/* EXTRA FUEL */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            color: '#aaa', 
                            fontSize: '0.7rem', 
                            marginBottom: '4px',
                            textTransform: 'uppercase' 
                          }}>EXTRA FUEL</label>
                          <label style={{ 
                            display: 'block', 
                            color: '#666', 
                            fontSize: '0.6rem', 
                            marginBottom: '6px' 
                          }}>(pounds)</label>
                          <div style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              value={getFuelValue(stopName, 'extraFuel') || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleFuelChange(stopName, 'extraFuel', value);
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                handleFuelBlur(stopName, 'extraFuel', value);
                              }}
                              placeholder="0"
                              disabled={!showExtraFuelInput} // Disable if not departure/refuel
                              style={{
                                width: 'clamp(60px, 12vw, 80px)',
                                padding: '4px 6px',
                                backgroundColor: !showExtraFuelInput ? '#1a1a1a' : '#2c2c2c', // Dark for disabled
                                color: !showExtraFuelInput ? '#666' : '#fff', // Dimmed text for disabled
                                border: '1px solid #4A9EFF', // Keep border consistent
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                height: '24px',
                                cursor: !showExtraFuelInput ? 'not-allowed' : 'text' // Show disabled cursor
                              }}
                            />
                            <div style={{ 
                              color: !showExtraFuelInput ? '#444' : '#666', 
                              fontSize: '0.6rem', 
                              marginTop: '2px' 
                            }}>
                              {showExtraFuelInput ? (isDeparture ? 'Departure' : 'Refuel') : 'Carried'}
                            </div>
                          </div>
                        </div>
                        
                        {/* ARA/APPROACH */}
                        <div>
                          <label style={{ 
                            display: 'block', 
                            color: '#aaa', 
                            fontSize: '0.7rem', 
                            marginBottom: '4px',
                            textTransform: 'uppercase' 
                          }}>{isRig ? 'ARA' : 'APPROACH'}</label>
                          <label style={{ 
                            display: 'block', 
                            color: '#666', 
                            fontSize: '0.6rem', 
                            marginBottom: '6px' 
                          }}>(pounds)</label>
                          <div style={{ textAlign: 'center' }}>
                            <input
                              type="number"
                              value={isRig ? (getFuelValue(stopName, 'araFuel') || '') : (getFuelValue(stopName, 'approachFuel') || '')}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isRig) {
                                  handleFuelChange(stopName, 'araFuel', value);
                                } else {
                                  handleFuelChange(stopName, 'approachFuel', value);
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (isRig) {
                                  handleFuelBlur(stopName, 'araFuel', value);
                                } else {
                                  handleFuelBlur(stopName, 'approachFuel', value);
                                }
                              }}
                              placeholder="0"
                              disabled={isDeparture && !isRig} // Disable approach fuel for departure
                              style={{
                                width: 'clamp(60px, 12vw, 80px)',
                                padding: '4px 6px',
                                backgroundColor: (isDeparture && !isRig) ? '#1a1a1a' : '#2c2c2c', // Darker for disabled
                                color: (isDeparture && !isRig) ? '#666' : '#fff', // Dimmed text for disabled
                                border: '1px solid #4A9EFF', // Keep border consistent
                                borderRadius: '4px',
                                textAlign: 'center',
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                height: '24px',
                                cursor: (isDeparture && !isRig) ? 'not-allowed' : 'text' // Show disabled cursor
                              }}
                            />
                            <div style={{ 
                              color: (isDeparture && !isRig) ? '#444' : '#666', 
                              fontSize: '0.6rem', 
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 'clamp(60px, 12vw, 80px)'
                            }}>
                              {isDeparture && !isRig ? 'N/A (Departure)' : (isDeparture ? 'Departure' : (stopName.length > 8 ? stopName.substring(0, 8) + '...' : stopName))}
                            </div>
                          </div>
                        </div>
                        
                      </div>
                      </div>
                      
                    </div>
                    
                    {/* Fuel Breakdown Summary - Single line like original */}
                    <div style={{
                      background: '#1a1a1a',
                      borderRadius: '0px',
                      borderBottomLeftRadius: '8px',
                      borderBottomRightRadius: '8px',
                      padding: '12px 16px',
                      marginTop: '16px',
                      marginLeft: '-16px',
                      marginRight: '-16px',
                      marginBottom: '-12px',
                      border: 'none',
                      borderTop: '1px solid #333'
                    }}>
                      <div style={{
                        textAlign: 'center',
                        color: '#4A9EFF',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        marginBottom: '8px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>FUEL BREAKDOWN SUMMARY</div>
                      
                      {/* 🧪 DEBUG: Show current overrides for this card */}
                      <div style={{
                        fontSize: '0.7rem',
                        color: '#FFA726',
                        textAlign: 'center',
                        marginBottom: '6px'
                      }}>
                        Overrides: Extra={getFuelValue(stopName, 'extraFuel')} ARA={getFuelValue(stopName, 'araFuel')} Approach={getFuelValue(stopName, 'approachFuel')}
                      </div>
                      
                      <div style={{
                        color: '#fff',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        fontFamily: 'monospace'
                      }}>
{(() => {
                          // Create clean summary - only show components > 0
                          const parts = [];
                          
                          // Taxi fuel: Only show on departure card (consumed immediately on takeoff)
                          const taxi = isDeparture ? (getFuelValue(stopName, 'taxiFuel') || card.fuelComponentsObject?.taxiFuel || 0) : 0;
                          const trip = card.fuelComponentsObject?.tripFuel || card.tripFuel || 0;
                          const cont = card.fuelComponentsObject?.contingencyFuel || 0;
                          const deck = card.fuelComponentsObject?.deckFuel || 0;
                          // ARA fuel: Use CALCULATED remaining amount, not user override for this rig
                          // The user override is what this rig CONSUMES, not what it carries forward
                          const ara = card.fuelComponentsObject?.araFuel || 0;
                          // Approach fuel: Use CALCULATED remaining amount, not user override for this airport
                          // The user override is what this airport CONSUMES, not what it carries forward
                          const app = card.fuelComponentsObject?.approachFuel || 0;
                          const extra = getFuelValue(stopName, 'extraFuel') || card.fuelComponentsObject?.extraFuel || 0;
                          const res = getFuelValue(stopName, 'reserveFuel') || card.fuelComponentsObject?.reserveFuel || 0;
                          
                          if (taxi > 0) parts.push(`Taxi:${taxi}`);
                          if (trip > 0) parts.push(`Trip:${trip}`);
                          if (cont > 0) parts.push(`Cont:${cont}`);
                          if (ara > 0) parts.push(`ARA:${ara}`);
                          if (deck > 0) parts.push(`Deck:${deck}`);
                          if (app > 0) parts.push(`App:${app}`);
                          if (extra > 0) parts.push(`Extra:${extra}`);
                          if (res > 0) parts.push(`Res:${res}`);
                          
                          return parts.join(' ') + ' = ';
                        })()}<span style={{ color: '#4A9EFF', fontWeight: 'bold' }}>{card.totalFuel || 0} lbs</span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              );
            })}
          </div>
          
        </div>
        
        {/* 📊 COMPREHENSIVE FUEL SUMMARY */}
        <div className="fuel-section">
          <h3>📊 Flight Fuel Summary</h3>
          <div className="fuel-summary-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            backgroundColor: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            
            {/* Total Fuel Overview */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ color: '#4CAF50', margin: '0 0 8px 0' }}>🛫 Departure Total</h4>
              <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#fff' }}>
                {displayStopCards[0]?.totalFuel || 0} lbs
              </div>
              <div style={{ fontSize: '0.8em', color: '#aaa', marginTop: '4px' }}>
                Trip: {displayStopCards[0]?.fuelComponentsObject?.tripFuel || 0} lbs
              </div>
            </div>
            
            {/* User Overrides Summary */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ color: '#FF6B35', margin: '0 0 8px 0' }}>✏️ Your Overrides</h4>
              {Object.keys(fuelOverrides).length === 0 ? (
                <div style={{ color: '#666' }}>None yet</div>
              ) : (
                <div>
                  {Object.entries(fuelOverrides).map(([key, value]) => {
                    const [location, fuelType] = key.split('_');
                    const typeLabel = fuelType === 'araFuel' ? '🚁 ARA' : '🛬 Approach';
                    return (
                      <div key={key} style={{ fontSize: '0.9em', marginBottom: '2px' }}>
                        <span style={{ color: '#FFA726' }}>{typeLabel}:</span> {value} lbs @ {location}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Weather Suggestions */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ color: '#2196F3', margin: '0 0 8px 0' }}>🌦️ Weather Suggestions</h4>
              {displayStopCards.length === 0 ? (
                <div style={{ color: '#666' }}>No stops loaded</div>
              ) : (
                <div>
                  {displayStopCards.map((card, index) => {
                    const stopName = card.name || card.stopName;
                    const araWeather = getWeatherValue(stopName, 'araFuel');
                    const approachWeather = getWeatherValue(stopName, 'approachFuel');
                    
                    if (araWeather > 0 || approachWeather > 0) {
                      return (
                        <div key={index} style={{ fontSize: '0.8em', marginBottom: '2px' }}>
                          {stopName}: {araWeather > 0 ? `🚁${araWeather}` : ''} {approachWeather > 0 ? `🛬${approachWeather}` : ''}
                        </div>
                      );
                    }
                    return null;
                  }).filter(Boolean)}
                </div>
              )}
            </div>
            
            {/* Fuel Components Breakdown */}
            <div className="summary-card" style={{ backgroundColor: '#2c2c2c', padding: '12px', borderRadius: '6px' }}>
              <h4 style={{ color: '#9C27B0', margin: '0 0 8px 0' }}>⛽ Fuel Components</h4>
              {displayStopCards[0]?.fuelComponentsObject ? (
                <div style={{ fontSize: '0.8em' }}>
                  <div>Trip: {displayStopCards[0].fuelComponentsObject.tripFuel || 0} lbs</div>
                  <div>Taxi: {displayStopCards[0].fuelComponentsObject.taxiFuel || 0} lbs</div>
                  <div>Reserve: {displayStopCards[0].fuelComponentsObject.reserveFuel || 0} lbs</div>
                  <div>ARA: {displayStopCards[0].fuelComponentsObject.araFuel || 0} lbs</div>
                  <div>Approach: {displayStopCards[0].fuelComponentsObject.approachFuel || 0} lbs</div>
                  <div>Extra: {displayStopCards[0].fuelComponentsObject.extraFuel || 0} lbs</div>
                </div>
              ) : (
                <div style={{ color: '#666' }}>No fuel data</div>
              )}
            </div>
            
          </div>
        </div>
        
        {/* Debug Section */}
        <div className="fuel-section">
          <h3>🔧 Debug Information</h3>
          <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
            <div>Segments: {fuelManager.getCurrentSegments().length}</div>
            <div>Refuel Stops: {JSON.stringify(refuelStops)}</div>
            <div>Stop Cards: {displayStopCards.length}</div>
            {fuelManager.getCurrentSegments().map((segment, i) => (
              <div key={i}>
                Segment {i + 1}: {segment.startLocation} → {segment.endLocation} 
                (ARA: {segment.fuelRequirements.araFuel}, Approach: {segment.fuelRequirements.approachFuel})
              </div>
            ))}
            
            <div style={{ marginTop: '10px' }}>
              <strong>Current Fuel Overrides:</strong>
              <div style={{ marginLeft: '10px', color: '#4CAF50', fontSize: '11px' }}>
                {Object.keys(fuelOverrides).length === 0 ? 
                  'None' : 
                  Object.entries(fuelOverrides).map(([key, value]) => (
                    <div key={key} style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#FFA726' }}>{key}:</span> {value}
                    </div>
                  ))
                }
              </div>
            </div>
            
            {/* 🔍 DEBUG: Cross-connection detection */}
            <div style={{ marginTop: '10px' }}>
              <strong>Cross-Connection Debug:</strong>
              <div style={{ marginLeft: '10px', color: '#FF6B6B', fontSize: '11px' }}>
                {displayStopCards.map((card, i) => {
                  const stopName = card.name || card.stopName;
                  const araOverride = getFuelValue(stopName, 'araFuel');
                  const approachOverride = getFuelValue(stopName, 'approachFuel');
                  if (araOverride > 0 || approachOverride > 0) {
                    return (
                      <div key={i} style={{ marginBottom: '2px' }}>
                        {stopName}: ARA={araOverride} Approach={approachOverride}
                      </div>
                    );
                  }
                  return null;
                }).filter(Boolean)}
              </div>
            </div>
            
            <div style={{ marginTop: '10px' }}>
              <strong>Stop Card Properties:</strong>
              {displayStopCards.map((card, i) => (
                <div key={i} style={{ marginLeft: '10px' }}>
                  Stop {i}: {JSON.stringify(Object.keys(card), null, 2)}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleApplyChanges}
            style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
          >
            ✅ Apply Changes
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => {
            }}
          >
            🔧 Debug Info
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default CleanDetailedFuelBreakdown;