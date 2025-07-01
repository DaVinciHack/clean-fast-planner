/**
 * DetailedFuelBreakdown_CARDS.jsx
 * 
 * MODERN CARD-BASED VERSION of the fuel breakdown interface.
 * Styled like the existing stop cards with beautiful card layout instead of table.
 * Features:
 * - Individual cards for each stop
 * - Color-coded by stop type (departure, intermediate, refuel, final)
 * - Hover animations and modern styling
 * - Two-column layout: passenger ops (purple) and fuel ops (blue)
 * - Fuel summary at bottom of each card
 * - All the same logic as table version but much prettier!
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import FuelSaveBackService from '../../services/FuelSaveBackService';
import StopCardCalculator from '../../modules/calculations/flight/StopCardCalculator';
import { DistanceIcon, TimeIcon } from '../flight/stops/StopIcons';

// Import segment-aware utilities
import { detectLocationSegment, createSegmentFuelKey, getSegmentBoundaries, parseSegmentFuelKey } from '../../utilities/SegmentUtils';

// Time formatting function - same as StopCard component
const formatTime = (timeHours) => {
  if (!timeHours && timeHours !== 0) return '00:00';
  const hours = Math.floor(timeHours);
  const minutes = Math.floor((timeHours - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const DetailedFuelBreakdown = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  weatherSegments = [],
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  currentFlightId = null,
  alternateRouteData = null,
  alternateStopCard = null,
  waypoints = [],
  weather = { windSpeed: 0, windDirection: 0 },
  clearKey = '', // NEW: Key to trigger state clearing when flight changes
  locationFuelOverrides = {}, // NEW: Location-specific fuel overrides from FastPlannerApp
  // NEW: Callback props for updating main app state
  onStopCardsCalculated = () => {}, // Main callback to update stopCards in FastPlannerApp
  // Flight settings callback props (same as SettingsCard)
  onExtraFuelChange = () => {}, // Global extra fuel (for settings page compatibility)
  onDeckTimeChange = () => {},
  onDeckFuelChange = () => {},
  onDeckFuelFlowChange = () => {},
  onPassengerWeightChange = () => {},
  onCargoWeightChange = () => {},
  onTaxiFuelChange = () => {},
  onContingencyFuelPercentChange = () => {},
  onReserveMethodChange = () => {},
  onReserveFuelChange = () => {},
  // NEW: Location-specific fuel callback
  onLocationFuelChange = () => {},  // Callback for ARA/approach fuel changes
  // ✅ SEGMENT-AWARE: Segment-specific fuel callbacks
  onSegmentExtraFuelChange = () => {},  // Callback for segment extra fuel changes
  getCurrentSegmentInfo = () => []      // Function to get current segment information
}) => {
  console.log('🚨🚨🚨 DetailedFuelBreakdown RENDERING! visible=', visible);
  
  // 🎯 INTERACTIVE FUEL CONTROL STATE (same as table version)
  const [userOverrides, setUserOverrides] = useState({});
  const [fieldStates, setFieldStates] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [localStopCards, setLocalStopCards] = useState(stopCards);
  
  // ✅ REFUEL PERSISTENCE: Local refuel stops state to prevent clearing
  const [localRefuelStops, setLocalRefuelStops] = useState([]);
  
  // ✅ REFUEL PERSISTENCE: Detect refuel stops from both local state and stop cards
  const refuelStops = useMemo(() => {
    if (!localStopCards || localStopCards.length === 0) return localRefuelStops;
    
    // Merge detected stops from cards with local state (prioritize local state)
    const detectedStops = [];
    localStopCards.forEach((card, index) => {
      if (card.refuelMode === true || card.isRefuelStop === true) {
        detectedStops.push(card.index); // Use actual card index directly
      }
    });
    
    // Use local state if it has values, otherwise use detected stops
    const finalStops = localRefuelStops.length > 0 ? localRefuelStops : detectedStops;
    
    console.log('🛩️ REFUEL PERSISTENCE: Refuel stops detection:', {
      detectedFromCards: detectedStops,
      localState: localRefuelStops,
      finalStops: finalStops
    });
    
    return finalStops;
  }, [localStopCards, localRefuelStops]);
  
  // ✅ SEGMENT-AWARE: Get current segment boundaries
  const segmentInfo = useMemo(() => {
    const segments = getSegmentBoundaries(waypoints, refuelStops);
    console.log('🛩️ SEGMENT-AWARE: Current segments:', segments);
    return segments;
  }, [waypoints, refuelStops]);
  
  // ✅ SYNC FIX: Always sync local refuel stops from updated stop cards
  useEffect(() => {
    if (localStopCards && localStopCards.length > 0) {
      const detectedStops = [];
      localStopCards.forEach((card, index) => {
        if (card.refuelMode === true || card.isRefuelStop === true) {
          detectedStops.push(card.index); // Use actual card index directly
        }
      });
      
      // Update local refuel stops to match what's in the stop cards
      const currentStopsString = JSON.stringify(localRefuelStops.sort());
      const detectedStopsString = JSON.stringify(detectedStops.sort());
      
      if (currentStopsString !== detectedStopsString) {
        console.log('✅ SYNC FIX: Syncing local refuel stops with stop cards:', detectedStops);
        setLocalRefuelStops(detectedStops);
      }
    }
  }, [localStopCards]);
  
  // ✅ CLEAN: Simple refuel checkbox changes - no complex parent communication
  const handleRefuelChange = useCallback((cardIndex, isRefuel) => {
    console.log(`🛩️ CLEAN: Checkbox change - Card ${cardIndex} = ${isRefuel}`);
    
    setLocalRefuelStops(prev => {
      const newRefuelStops = isRefuel 
        ? (prev.includes(cardIndex) ? prev : [...prev, cardIndex])
        : prev.filter(index => index !== cardIndex);
      
      console.log(`🛩️ CLEAN: Updated local refuel stops:`, newRefuelStops);
      return newRefuelStops;
    });
  }, []);
  
  // 🔄 COMPLETE REFRESH: When modal becomes visible, refresh completely from current stop card state
  React.useEffect(() => {
    if (visible && stopCards && stopCards.length > 0) {
      console.log('🔄 MODAL OPENED: Performing complete refresh from current stop card state');
      
      // Clear any stale user overrides and field states
      setUserOverrides({});
      setFieldStates({});
      setIsEditing(null);
      
      // Sync refuel stops from actual stop cards
      const actualRefuelStops = [];
      stopCards.forEach(card => {
        if (card.refuelMode === true || card.isRefuelStop === true) {
          actualRefuelStops.push(card.index);
        }
      });
      
      console.log('🔄 MODAL REFRESH: Current refuel stops from stop cards:', actualRefuelStops);
      setLocalRefuelStops(actualRefuelStops);
      
      // Force complete sync of local stop cards
      setLocalStopCards([...stopCards]); // Use spread to force re-render
      
      console.log('✅ MODAL REFRESH: Complete refresh completed');
    }
  }, [visible]); // Trigger when modal becomes visible

  // ✅ COMPREHENSIVE SYNC: "Let it think and then refresh" - Full UI sync after calculation cycle
  React.useEffect(() => {
    console.log('🔄 DetailedFuelBreakdown: stopCards prop changed:', {
      stopCardsLength: stopCards?.length,
      firstCard: stopCards?.[0],
      hasAraFuel: stopCards?.[0]?.araFuel,
      hasApproachFuel: stopCards?.[0]?.approachFuel
    });
    
    // 🚫 SMART FILTER: Protect refuel stops but allow final correct updates
    console.log('🔄 DetailedFuelBreakdown: Received new stopCards, checking refuel integrity');
    
    const expectedRefuelStops = localRefuelStops;
    let shouldUpdate = true;
    
    if (expectedRefuelStops.length > 0) {
      // Check if the stop cards have the expected refuel information
      const actualRefuelInCards = [];
      stopCards.forEach(card => {
        if (card.refuelMode === true || card.isRefuelStop === true) {
          actualRefuelInCards.push(card.index);
        }
      });
      
      console.log('🚫 SMART FILTER: Expected refuel stops:', expectedRefuelStops);
      console.log('🚫 SMART FILTER: Actual refuel in cards:', actualRefuelInCards);
      
      // Only reject if we expect refuel stops but the cards have NONE
      const hasAnyRefuelStops = actualRefuelInCards.length > 0;
      shouldUpdate = hasAnyRefuelStops; // Accept if there are ANY refuel stops
    }
    
    if (shouldUpdate) {
      console.log('✅ SMART FILTER: Accepting stop cards update');
      setLocalStopCards(stopCards);
    } else {
      console.log('❌ SMART FILTER: Rejecting update - missing ALL refuel stops');
    }
    
    // 🎯 FORCE REFRESH: When stop cards update, force UI to re-render with new summaries
    console.log('✅ SIMPLE SYNC: Stop cards updated, forcing UI refresh for corrected summaries');
    
    // Force re-render by updating a dummy state to trigger summary recalculation
    setFieldStates(prev => ({ ...prev, _forceRefresh: Date.now() }));
    
  }, [stopCards]);
  
  // Separate effect for clearing user state (only on new flights)
  React.useEffect(() => {
    console.log('🧹 DetailedFuelBreakdown: Clearing user state for new flight');
    setUserOverrides({});
    setFieldStates({});
    setIsEditing(null);
  }, [clearKey]); // Only clear when clearKey changes (new flight)

  // ❌ REMOVED: Duplicate clearKey effect

  // 🚫 REMOVED CALCULATION: Only update settings, let EnhancedStopCardsContainer handle calculations
  const triggerRecalculation = useCallback((forceOverrides = null) => {
    console.log('🚫 DetailedFuelBreakdown: NO LONGER DOING CALCULATIONS - delegating to EnhancedStopCardsContainer');
    console.log('🔄 DetailedFuelBreakdown: Will only update location fuel overrides, not trigger calculations');
    
    // DO NOT do any calculations - only update settings and let EnhancedStopCardsContainer recalculate
    console.log('🚫 DetailedFuelBreakdown: Not doing any calculations - settings updates will trigger natural recalculation');
    
    // The function now only exists for handleFieldChange to call, but doesn't do calculations
  }, [localStopCards]);
  
  // Handle field changes - proper async updates to avoid render warnings
  const handleFieldChange = useCallback((stopIndex, fieldType, value) => {
    const key = `${stopIndex}_${fieldType}`;
    
    console.log(`🚨🚨🚨 FIELD CHANGE DETECTED! Field change ${fieldType} for stop ${stopIndex}:`, value);
    console.log(`🛩️ Fuel Breakdown: *** FIELD CHANGE CALLED ***`);
    console.log(`🛩️ Fuel Breakdown: Field change ${fieldType} for stop ${stopIndex}:`, value);
    console.log(`🛩️ Fuel Breakdown: Key: ${key}`);
    console.log(`🛩️ Fuel Breakdown: Current userOverrides:`, userOverrides);
    console.log(`🛩️ Fuel Breakdown: Current localStopCards length:`, localStopCards?.length);
    
    console.log(`🔧 BEFORE setUserOverrides call`);
    console.log(`🔧 setUserOverrides function:`, typeof setUserOverrides);
    
    // Update user overrides
    setUserOverrides(prev => {
      console.log(`🔧 INSIDE setUserOverrides callback!`);
      console.log(`🔧 Previous userOverrides:`, prev);
      console.log(`🛩️ Fuel Breakdown: Previous userOverrides:`, prev);
      const newOverrides = {
        ...prev,
        [key]: value
      };
      console.log(`🛩️ Fuel Breakdown: NEW userOverrides will be:`, newOverrides);
      
      // Store the intent to update, but call outside render cycle
      console.log(`🔄 Scheduling settings update for ${fieldType}:`, value);
      
      // Set field state to green (user-override) immediately
      setFieldStates(prev => ({
        ...prev,
        [key]: 'user-override'
      }));
      
      // Call settings update DIRECTLY (no timeout)
      console.log(`🔄 DIRECT settings update for ${fieldType}:`, value);
      
      console.log(`🔍 SWITCH DEBUG: About to enter switch for fieldType: "${fieldType}"`);
      
      try {
        switch (fieldType) {
          case 'extraFuel':
            // 🚨 SIMPLIFIED: Just use global extra fuel for now - segment-aware was too complex
            console.log(`✅ SIMPLIFIED: Global extra fuel change:`, value);
            onExtraFuelChange(value);
            break;
          case 'deckTime':
            console.log(`✅ Calling onDeckTimeChange with:`, value);
            onDeckTimeChange(value);
            break;
          case 'araFuel':
            console.log(`🎯 SWITCH DEBUG: Entered araFuel case for value:`, value);
            // ✅ SEGMENT-AWARE: Location-specific ARA/approach fuel
            console.log(`🛩️ SEGMENT-AWARE: Location-specific fuel change for stop ${stopIndex}:`, value);
            const araStopCard = localStopCards[stopIndex];
            const araStopName = araStopCard?.name || araStopCard?.stopName || `stop_${stopIndex}`;
            
            // 🚨 FIX: Get isRig from weather segments, not from stop card
            let isRig = false;
            if (weatherSegments && weatherSegments.length > 0) {
              const weatherSegment = weatherSegments.find(segment => 
                segment.airportIcao === araStopName ||
                segment.locationName === araStopName ||
                segment.location === araStopName ||
                segment.uniqueId === araStopName
              );
              isRig = weatherSegment?.isRig || false;
              console.log(`🌦️ Found weather segment for ${araStopName}:`, { isRig: isRig, segment: weatherSegment });
            }
            
            console.log(`✅ SIMPLIFIED: About to call onLocationFuelChange:`, {
              stopName: araStopName,
              stopIndex: stopIndex,
              fuelType: isRig ? 'araFuel' : 'approachFuel',
              value: value,
              isRig: isRig
            });
            
            onLocationFuelChange({
              stopName: araStopName,
              stopIndex: stopIndex,
              fuelType: isRig ? 'araFuel' : 'approachFuel',
              value: value,
              isRig: isRig,
              refuelStops: localRefuelStops  // 🚨 CRITICAL: Pass current refuel stops so calculation is correct
            });
            
            console.log(`✅ onLocationFuelChange called successfully - letting normal flow handle recalculation`);
            break;
          default:
            console.log(`⚠️ Unknown field type: ${fieldType}`);
        }
        
        // 🎯 DELAYED TRIGGER: For ALL fuel types that might affect calculations
        if (fieldType === 'araFuel' || fieldType === 'extraFuel') {
          console.log('🕐 SETTING UP DELAYED TRIGGER for fieldType:', fieldType);
          
          // Capture current context for later trigger
          const currentStopCard = localStopCards[stopIndex];
          const currentStopName = currentStopCard?.name || currentStopCard?.stopName || `stop_${stopIndex}`;
          
          setTimeout(() => {
            console.log('🕐 DELAYED TRIGGER: Executing now for fieldType:', fieldType);
            
            if (fieldType === 'araFuel') {
              console.log('🔄 DELAYED TRIGGER: Forcing GLOBAL recalculation by toggling extra fuel');
              
              // Get current extra fuel value
              const currentExtraFuel = flightSettings?.extraFuel || 0;
              
              // Force global recalculation by slightly changing extra fuel then changing it back
              onExtraFuelChange(currentExtraFuel + 0.1); // Tiny change
              
              setTimeout(() => {
                onExtraFuelChange(currentExtraFuel); // Change back to original
                console.log('🔄 DELAYED TRIGGER: Restored original extra fuel, recalculation should be complete');
              }, 100);
              
            } else if (fieldType === 'extraFuel') {
              // Re-trigger extra fuel change
              onExtraFuelChange(value);
            }
            
          }, 500);
        }
        console.log(`✅ Settings update completed for ${fieldType}`);
      } catch (error) {
        console.error(`❌ Error in settings update for ${fieldType}:`, error);
      }
      
      // Check capacity for passengers and weight fields
      if ((fieldType === 'passengers' || fieldType === 'weight') && value !== '' && value !== undefined) {
        const stopCard = localStopCards[stopIndex] || {};
        const availablePassengers = stopCard.maxPassengers || 0;
        const availableWeight = (availablePassengers * (flightSettings.passengerWeight || 220));
        const standardWeight = flightSettings.passengerWeight || 220;
        const aircraftMaxCapacity = selectedAircraft?.maxPayload || 99999;
        
        const requestedPassengers = newOverrides[`${stopIndex}_passengers`];
        const requestedWeight = newOverrides[`${stopIndex}_weight`];
        
        let isCapacityOk = true;
        if (requestedWeight !== undefined && requestedWeight !== '') {
          isCapacityOk = requestedWeight <= availableWeight && requestedWeight <= aircraftMaxCapacity;
        } else if (requestedPassengers !== undefined && requestedPassengers !== '') {
          const calculatedWeight = requestedPassengers * standardWeight;
          isCapacityOk = requestedPassengers <= availablePassengers && calculatedWeight <= aircraftMaxCapacity;
        }
        
        setFieldStates(prev => ({
          ...prev,
          [`${stopIndex}_passengers`]: isCapacityOk ? 'user-override' : 'over-capacity',
          [`${stopIndex}_weight`]: isCapacityOk ? 'user-override' : 'over-capacity'
        }));
      } else if (value !== '' && value !== undefined) {
        console.log(`🎨 Setting field state for ${key} to 'user-override'`);
        setFieldStates(prev => {
          const newStates = {
            ...prev,
            [key]: 'user-override'
          };
          console.log(`🎨 New fieldStates:`, newStates);
          return newStates;
        });
      }
      
      console.log(`🛩️ Fuel Breakdown: Returning newOverrides to setState:`, newOverrides);
      return newOverrides;
    });
    
    // 🚫 DIRECT SETTINGS CALL: Call settings callbacks directly, don't wait for recalculation
    console.log(`🔄 DIRECT settings update for ${fieldType}:`, value);
    
    try {
      switch (fieldType) {
        case 'extraFuel':
          console.log(`✅ Calling onExtraFuelChange with:`, value);
          onExtraFuelChange(value);
          break;
        case 'deckTime':
          console.log(`✅ Calling onDeckTimeChange with:`, value);
          onDeckTimeChange(value);
          break;
        case 'araFuel':
          // Location-specific ARA/approach fuel
          console.log(`🛩️ Location-specific fuel change for stop ${stopIndex}:`, value);
          const araStopCard = localStopCards[stopIndex];
          const araStopName = araStopCard?.name || araStopCard?.stopName || `stop_${stopIndex}`;
          
          // Determine if it's a rig from weather segments
          let isRig = false;
          if (weatherSegments && weatherSegments.length > 0) {
            const weatherSegment = weatherSegments.find(segment => 
              segment.airportIcao === araStopName ||
              segment.locationName === araStopName ||
              segment.location === araStopName ||
              segment.uniqueId === araStopName
            );
            isRig = weatherSegment?.isRig || false;
          }
          
          console.log(`✅ Calling onLocationFuelChange:`, {
            stopName: araStopName,
            stopIndex: stopIndex,
            fuelType: isRig ? 'araFuel' : 'approachFuel',
            value: value,
            isRig: isRig,
            refuelStops: localRefuelStops
          });
          
          onLocationFuelChange({
            stopName: araStopName,
            stopIndex: stopIndex,
            fuelType: isRig ? 'araFuel' : 'approachFuel',
            value: value,
            isRig: isRig,
            refuelStops: localRefuelStops
          });
          break;
        default:
          console.log(`⚠️ Unknown field type: ${fieldType}`);
      }
    } catch (error) {
      console.error(`😨 Error calling settings callback for ${fieldType}:`, error);
    }
    
  }, [localStopCards, flightSettings.passengerWeight, selectedAircraft?.maxPayload, localRefuelStops, onExtraFuelChange, onDeckTimeChange, onLocationFuelChange, weatherSegments]);
  
  // Get field border color based on state
  const getFieldBorderColor = (stopIndex, fieldType) => {
    const key = `${stopIndex}_${fieldType}`;
    let state = fieldStates[key];
    
    // 🚨 FIX: For ARA/approach fuel, check if we have a location override
    if (fieldType === 'araFuel') {
      const stopCard = localStopCards[stopIndex] || {};
      const stopName = stopCard.name || stopCard.stopName;
      if (stopName) {
        // Determine fuel type based on location
        let fuelType = 'araFuel';
        if (weatherSegments && weatherSegments.length > 0) {
          const weatherSegment = weatherSegments.find(segment => 
            segment.airportIcao === stopName ||
            segment.locationName === stopName ||
            segment.location === stopName ||
            segment.uniqueId === stopName
          );
          if (weatherSegment && !weatherSegment.isRig) {
            fuelType = 'approachFuel';
          }
        }
        
        const locationKey = `${stopName}_${fuelType}`;
        if (locationFuelOverrides[locationKey]?.value !== undefined) {
          state = 'user-override';
        }
      }
    }
    
    console.log(`🎨 Field border color check for ${key}:`, {
      state: state,
      isEditing: isEditing === key,
      fieldStates: fieldStates
    });
    
    if (isEditing === key) return '#4FC3F7'; // Blue while editing
    if (state === 'user-override') return '#2196F3'; // Blue for user overrides
    if (state === 'calculated') return '#4CAF50'; // Green for pre-calculated values (weather, etc.)
    if (state === 'over-capacity') return '#f44336'; // Red for warnings
    return '#666'; // Grey for default
  };
  
  // 🚨 SIMPLIFIED TinyInput - No more complex state management
  const TinyInput = ({ placeholder, stopIndex, fieldType, min = 0, width = '60px' }) => {
    const key = `${stopIndex}_${fieldType}`;
    const [localValue, setLocalValue] = React.useState('');
    const [isLocalEditing, setIsLocalEditing] = React.useState(false);
    
    // 🚨 SIMPLE: Get the actual saved value (user override)
    const getSavedValue = () => {
      if (fieldType === 'araFuel') {
        const stopCard = localStopCards[stopIndex] || {};
        const stopName = stopCard.name || stopCard.stopName;
        if (stopName) {
          // 🚨 FIX: Check both old format and new segment-aware format
          const araKey = `${stopName}_araFuel`;
          const approachKey = `${stopName}_approachFuel`;
          
          // First check old format keys
          let value = locationFuelOverrides[araKey]?.value || locationFuelOverrides[approachKey]?.value;
          
          // If not found, check all segment-aware keys for this stop
          if (value === undefined) {
            const segmentKeys = Object.keys(locationFuelOverrides).filter(key => 
              key.includes(stopName) && (key.includes('araFuel') || key.includes('approachFuel'))
            );
            
            for (const key of segmentKeys) {
              if (locationFuelOverrides[key]?.value !== undefined) {
                value = locationFuelOverrides[key].value;
                break;
              }
            }
          }
          
          return value;
        }
      } else if (fieldType === 'extraFuel') {
        // Extra fuel comes from flightSettings, not userOverrides
        return flightSettings.extraFuel;
      } else {
        return userOverrides[key];
      }
      return undefined;
    };
    
    const savedValue = getSavedValue();
    
    // 🚨 SIMPLE: Get weather-calculated value for this specific location
    const getWeatherValue = () => {
      if (fieldType !== 'araFuel') return 0;
      
      const stopCard = localStopCards[stopIndex] || {};
      const stopName = stopCard.name || stopCard.stopName;
      if (!stopName || !weatherSegments?.length) return 0;
      
      const weatherSegment = weatherSegments.find(segment => 
        segment.airportIcao === stopName || segment.locationName === stopName ||
        segment.location === stopName || segment.uniqueId === stopName
      );
      
      if (!weatherSegment) return 0;
      
      const ranking = weatherSegment.ranking2;
      const isRig = weatherSegment.isRig;
      
      if (isRig && (ranking === 8 || ranking === 5)) {
        return fuelPolicy?.araFuelDefault || 200; // ARA fuel for rigs
      } else if (!isRig && (ranking === 10 || ranking === 5)) {
        return fuelPolicy?.approachFuelDefault || 200; // Approach fuel for airports
      }
      return 0;
    };
    
    const weatherValue = getWeatherValue();
    
    // 🚨 SIMPLE: What to show in the input field
    const getCurrentValue = () => {
      if (isLocalEditing) {
        return localValue; // Show what user is typing
      } else if (savedValue !== undefined && savedValue !== null && savedValue !== '') {
        return savedValue.toString(); // Show user override
      } else {
        return ''; // Empty - weather value goes in placeholder
      }
    };
    
    // 🚨 SIMPLE: Color scheme per user request
    const getInputStyle = () => {
      let borderColor = '#666'; // Default grey
      let textColor = '#ccc';   // Default grey text
      
      if (savedValue !== undefined && savedValue !== null && savedValue !== '') {
        borderColor = '#4CAF50'; // Green border for user overrides
        textColor = '#fff';      // White text for user overrides
      } else if (weatherValue > 0) {
        borderColor = '#2196F3'; // Blue border for weather values
        textColor = '#fff';      // White text for weather values
      }
      
      return { borderColor, textColor };
    };
    
    const currentValue = getCurrentValue();
    const { borderColor, textColor } = getInputStyle();
    
    // 🚨 SIMPLE: Update localValue when not editing
    React.useEffect(() => {
      if (!isLocalEditing) {
        setLocalValue(currentValue);
      }
    }, [currentValue, isLocalEditing]);
    
    console.log(`🔍 TinyInput ${key}:`, {
      savedValue, weatherValue, currentValue, isLocalEditing
    });
    
    return (
      <input
        type="text"
        value={currentValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => {
          console.log(`🎯 Focus ${key}: starting with "${currentValue}"`);
          setIsLocalEditing(true);
          setLocalValue(currentValue);
        }}
        onBlur={() => {
          console.log(`🎯 Blur ${key}: saving "${localValue}"`);
          setIsLocalEditing(false);
          
          // Only save if user entered something
          if (localValue.trim() !== '') {
            const numValue = parseInt(localValue) || 0;
            handleFieldChange(stopIndex, fieldType, numValue);
          }
        }}
        placeholder={weatherValue > 0 ? weatherValue.toString() : placeholder}
        style={{
          width: width,
          padding: '8px 10px',
          fontSize: '14px',
          fontWeight: '600',
          backgroundColor: '#333',
          color: textColor,
          border: `1px solid ${borderColor}`,
          borderRadius: '6px',
          textAlign: 'center',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
      />
    );
  };
  
  // Process fuel data using local stop cards for real-time updates
  const fuelData = useMemo(() => {
    if (!localStopCards || localStopCards.length === 0) {
      return { stopBreakdown: [], hasData: false };
    }
    
    // Filter to only show actual stop cards (not navigation waypoints)
    const actualStopCards = localStopCards.filter(card => 
      card.totalFuel !== undefined && card.totalFuel > 0 && 
      (card.stop || card.stopName || card.name)
    );
    
    const stopBreakdown = actualStopCards.map((card, index) => ({
      stop: card.stop || card.stopName || card.name || `Stop ${index + 1}`,
      requiredFuel: Math.round(card.totalFuel || 0),
      isRefuel: card.refuelMode === true,
      originalIndex: localStopCards.indexOf(card) // Keep track of original index for user overrides
    }));
    
    return { stopBreakdown, hasData: true };
  }, [localStopCards]);
  
  // Save fuel settings function (same as table version)
  const handleSaveFuelSettings = async () => {
    if (!currentFlightId || !stopCards || stopCards.length === 0) {
      alert('No flight data available to save fuel settings.');
      return;
    }
    
    try {
      console.log('💾 Saving fuel settings with user overrides:', userOverrides);
      
      const modifiedStopCards = stopCards.map((card, index) => {
        const modifications = {};
        
        Object.keys(userOverrides).forEach(key => {
          const [stopIdx, fieldType] = key.split('_');
          if (parseInt(stopIdx) === index) {
            switch (fieldType) {
              case 'extraFuel':
                modifications.extraFuel = userOverrides[key];
                break;
              case 'deckTime':
                modifications.deckTime = userOverrides[key];
                break;
              case 'passengers':
                modifications.maxPassengers = userOverrides[key];
                break;
              case 'araFuel':
                modifications.araFuel = userOverrides[key];
                break;
            }
          }
        });
        
        return { ...card, ...modifications };
      });
      
      await FuelSaveBackService.saveFuelData(
        currentFlightId,
        modifiedStopCards,
        flightSettings,
        weatherFuel,
        fuelPolicy,
        routeStats,
        selectedAircraft
      );
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Fuel settings saved successfully', 'success');
      } else {
        alert('Fuel settings saved successfully!');
      }
      
    } catch (error) {
      console.error('Failed to save fuel settings:', error);
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Failed to save: ${error.message}`, 'error');
      } else {
        alert(`Failed to save fuel settings: ${error.message}`);
      }
    }
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        width: '80%',
        height: '90%',
        maxWidth: '900px',
        maxHeight: '800px',
        borderRadius: '12px',
        border: '2px solid #4FC3F7',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: '13px'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '16px 24px',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ 
            color: '#ffffff', 
            margin: 0, 
            fontSize: '20px',
            fontWeight: '600'
          }}>
            🎯 Interactive Fuel Control - Modern Card Interface
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Save Fuel Settings Button */}
            {currentFlightId && stopCards && stopCards.length > 0 && (
              <button
                onClick={handleSaveFuelSettings}
                style={{
                  background: 'linear-gradient(to bottom, #2e7d32, #1b5e20)',
                  color: 'white',
                  border: '1px solid #4caf50',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                💾 Save Fuel Settings
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(to bottom, #1f2937, #111827)',
                color: '#ccc',
                border: '1px solid #666',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
        
        {/* Content Area - Card Layout */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '16px'
        }}>
          {!fuelData.hasData ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: '#666',
              fontSize: '16px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⛽</div>
              <div>No fuel data available</div>
              <div style={{ fontSize: '14px', marginTop: '10px' }}>
                Create a route with waypoints to see detailed fuel breakdown
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {fuelData.stopBreakdown.map((stop, displayIndex) => {
                const originalIndex = stop.originalIndex;
                const stopCard = localStopCards[originalIndex] || {};
                const availablePassengers = stopCard.maxPassengers || 0;
                const availableWeight = (availablePassengers * (flightSettings.passengerWeight || 220));
                
                // Smart capacity checking logic
                const requestedPassengers = userOverrides[`${originalIndex}_passengers`];
                const requestedWeight = userOverrides[`${originalIndex}_weight`];
                let isCapacityOk = true;
                const standardWeight = flightSettings.passengerWeight || 220;
                const aircraftMaxCapacity = selectedAircraft?.maxPayload || 99999;
                
                if (requestedPassengers !== undefined || requestedWeight !== undefined) {
                  if (requestedWeight !== undefined) {
                    isCapacityOk = requestedWeight <= availableWeight && requestedWeight <= aircraftMaxCapacity;
                  } else if (requestedPassengers !== undefined) {
                    const calculatedWeight = requestedPassengers * standardWeight;
                    isCapacityOk = requestedPassengers <= availablePassengers && calculatedWeight <= aircraftMaxCapacity;
                  }
                }
                
                const tripFuel = stopCard.tripFuel || 0;
                const contingencyFuel = stopCard.contingencyFuel || 0;
                const isRefuelStop = stopCard.refuelMode === true || stop.isRefuel;
                const isFinalStop = originalIndex === localStopCards.length - 1;
                
                // Get card type styling
                const getCardColor = () => {
                  if (isRefuelStop) return '#F57C00'; // Orange for refuel stops
                  return '#1565C0'; // Darker blue for all regular stops (departure, rigs, arrival)
                };
                
                const cardColor = getCardColor();
                
                return (
                  <div key={originalIndex} style={{
                    background: `linear-gradient(to bottom, ${cardColor}33 0%, ${cardColor}11 30%, #1a1a1a 100%)`,
                    borderRadius: '12px',
                    border: '1px solid #333',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    padding: '20px',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0px)';
                  }}>
                    
                    {/* Card Header - Stop Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: cardColor,
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {displayIndex + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ color: '#fff', fontSize: '16px', fontWeight: '600' }}>
                              {stop.stop}
                            </div>
                            {/* Distance and Time Info - Same as Stop Cards */}
                            {stopCard.totalDistance && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ccc', fontSize: '11px' }}>
                                <DistanceIcon />
                                <span>{stopCard.totalDistance || '0'} nm</span>
                              </div>
                            )}
                            {stopCard.totalTime && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ccc', fontSize: '11px' }}>
                                <TimeIcon />
                                <span>{formatTime(stopCard.totalTime)}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* ✅ REFUEL STATUS DISPLAY: Show refuel status without checkbox (managed from stop cards) */}
                          {!stopCard.isDeparture && !stopCard.isDestination && originalIndex > 0 && originalIndex < localStopCards.length - 1 && isRefuelStop && (
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              marginTop: '4px',
                              fontSize: '11px',
                              color: '#FF6B35'
                            }}>
                              <span style={{ fontWeight: '600' }}>
                                ⛽ REFUEL STOP
                              </span>
                              <span style={{ fontSize: '9px', color: '#ccc', fontStyle: 'italic' }}>
                                (managed from stop cards)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Status Indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'right' }}>
                          {isFinalStop ? 'Required Landing Fuel:' : 'Required Departure Fuel:'}
                        </div>
                        <div style={{
                          backgroundColor: cardColor,
                          color: 'white',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {stop.requiredFuel.toLocaleString()} lbs
                        </div>
                        <span style={{ fontSize: '18px' }}>
                          {isCapacityOk ? '✅' : '❌'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Content - Responsive Layout */}
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '1fr 1fr', 
                      gap: '16px' 
                    }}>
                      
                      {/* Left Column - Passenger & Weight Controls */}
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(21, 101, 192, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(21, 101, 192, 0.2)'
                      }}>
                        <div style={{ color: '#1565C0', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                          👥 PASSENGER OPERATIONS
                        </div>
                        
                        {!isFinalStop ? (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: '#1565C0', marginBottom: '2px', fontWeight: '600' }}>
                                PASSENGERS
                              </div>
                              <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px', fontWeight: '600' }}>
                                Available: {availablePassengers}
                              </div>
                              <TinyInput
                                stopIndex={originalIndex}
                                fieldType="passengers"
                                placeholder="requested"
                                width="70px"
                              />
                            </div>
                            <div>
                              <div style={{ fontSize: '10px', color: '#1565C0', marginBottom: '2px', fontWeight: '600' }}>
                                WEIGHT (LBS)
                              </div>
                              <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '6px', fontWeight: '600' }}>
                                Available: {Math.round(availableWeight)}
                              </div>
                              <TinyInput
                                stopIndex={originalIndex}
                                fieldType="weight"
                                placeholder="requested"
                                width="70px"
                              />
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '20px' }}>
                            🏁 Final Destination - No passenger operations required
                          </div>
                        )}
                        
                        {/* Refuel Status Display Only - Use stop cards to control refuel */}
                        {isRefuelStop && (
                          <div style={{ 
                            marginTop: '12px', 
                            paddingTop: '8px', 
                            borderTop: '1px solid rgba(245, 124, 0, 0.3)',
                            textAlign: 'center' 
                          }}>
                            <div style={{ 
                              fontSize: '11px', 
                              color: '#F57C00', 
                              fontWeight: '600',
                              background: 'rgba(245, 124, 0, 0.1)',
                              padding: '4px 8px',
                              borderRadius: '12px',
                              display: 'inline-block'
                            }}>
                              ⛽ REFUEL STOP
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Right Column - Fuel Controls */}
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(79, 195, 247, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(79, 195, 247, 0.2)'
                      }}>
                        <div style={{ color: '#4FC3F7', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                          ⛽ FUEL OPERATIONS
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                          <div>
                            <div style={{ fontSize: '10px', color: '#4FC3F7', marginBottom: '2px', fontWeight: '600' }}>
                              DECK TIME
                            </div>
                            <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '4px' }}>
                              (minutes)
                            </div>
                            {originalIndex > 0 && !isFinalStop ? (
                              <TinyInput
                                stopIndex={originalIndex}
                                fieldType="deckTime"
                                placeholder="15"
                                width="50px"
                              />
                            ) : (
                              <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>
                                {originalIndex === 0 ? 'Departure' : 'Final'}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '10px', color: '#4FC3F7', marginBottom: '2px', fontWeight: '600' }}>
                              EXTRA FUEL
                            </div>
                            <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '4px' }}>
                              (pounds)
                            </div>
                            {originalIndex === 0 ? (
                              <TinyInput
                                stopIndex={originalIndex}
                                fieldType="extraFuel"
                                placeholder="0"
                                width="50px"
                              />
                            ) : (
                              <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>
                                {flightSettings.extraFuel || 0}
                              </div>
                            )}
                          </div>
                          
                          <div>
                            <div style={{ fontSize: '10px', color: '#4FC3F7', marginBottom: '2px', fontWeight: '600' }}>
                              ARA/APPROACH
                            </div>
                            <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '4px' }}>
                              (pounds)
                            </div>
                            {originalIndex > 0 ? (
                              <TinyInput
                                stopIndex={originalIndex}
                                fieldType="araFuel"
                                placeholder="0"
                                width="50px"
                              />
                            ) : (
                              <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#666' }}>
                                Departure
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fuel Summary at Bottom */}
                    <div style={{
                      marginTop: '16px',
                      padding: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#4FC3F7', fontSize: '11px', marginBottom: '6px', fontWeight: '600' }}>
                        FUEL BREAKDOWN SUMMARY
                      </div>
                      <div style={{ fontSize: '13px', color: '#ddd', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>
                          {/* Use CALCULATED fuel breakdown from StopCardCalculator - single source of truth */}
                          {stopCard.fuelComponents || 'No fuel breakdown available'}
                        </span>
                        <span style={{ fontSize: '14px', color: '#4FC3F7', fontWeight: '600' }}>
                          = {Math.round(stopCard.totalFuel || 0).toLocaleString()} lbs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedFuelBreakdown;