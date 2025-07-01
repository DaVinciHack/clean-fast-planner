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
  onLocationFuelChange = () => {}  // Callback for ARA/approach fuel changes
}) => {
  console.log('🚨🚨🚨 DetailedFuelBreakdown RENDERING! visible=', visible);
  
  // 🎯 INTERACTIVE FUEL CONTROL STATE (same as table version)
  const [userOverrides, setUserOverrides] = useState({});
  const [fieldStates, setFieldStates] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  const [localStopCards, setLocalStopCards] = useState(stopCards);
  
  // Update local state when props change and clear user overrides for new flights
  React.useEffect(() => {
    console.log('🔄 DetailedFuelBreakdown: stopCards prop changed:', {
      stopCardsLength: stopCards?.length,
      firstCard: stopCards?.[0],
      hasAraFuel: stopCards?.[0]?.araFuel,
      hasApproachFuel: stopCards?.[0]?.approachFuel
    });
    
    // 🚨 CRITICAL FIX: Clear user overrides when flight changes
    console.log('🧹 DetailedFuelBreakdown: Clearing userOverrides for new flight/route');
    setUserOverrides({});
    setFieldStates({});
    setIsEditing(null);
    
    setLocalStopCards(stopCards);
    
    // DEBUG: Expose test function
    window.testFuelBreakdownUpdate = () => {
      console.log('🧪 TEST: Manual test of fuel breakdown update');
      console.log('🧪 TEST: Current userOverrides:', userOverrides);
      console.log('🧪 TEST: Current localStopCards length:', localStopCards?.length);
      console.log('🧪 TEST: onStopCardsCalculated type:', typeof onStopCardsCalculated);
      
      // Try to trigger manually
      setUserOverrides(prev => ({
        ...prev,
        '1_extraFuel': 999 // Test value
      }));
    };
  }, [stopCards]);

  // 🚨 CRITICAL: Clear all user state when flight/route changes (separate effect)
  React.useEffect(() => {
    console.log('🧹 DetailedFuelBreakdown: clearKey changed:', clearKey);
    console.log('🧹 DetailedFuelBreakdown: Clearing ALL user state due to clearKey change');
    setUserOverrides({});
    setFieldStates({});
    setIsEditing(null);
  }, [clearKey]);

  // Trigger recalculation only when user actually changes something  
  const triggerRecalculation = useCallback((forceOverrides = null) => {
    const currentOverrides = forceOverrides || userOverrides;
    console.log('🔄 DetailedFuelBreakdown: triggerRecalculation called');
    console.log('🔄 DetailedFuelBreakdown: forceOverrides:', forceOverrides);
    console.log('🔄 DetailedFuelBreakdown: userOverrides:', userOverrides);
    console.log('🔄 DetailedFuelBreakdown: currentOverrides:', currentOverrides);
    console.log('🔄 DetailedFuelBreakdown: currentOverrides length:', Object.keys(currentOverrides).length);
    console.log('🔄 DetailedFuelBreakdown: onStopCardsCalculated type:', typeof onStopCardsCalculated);
    
    if (Object.keys(currentOverrides).length > 0) {
      console.log('🔄 DetailedFuelBreakdown: Triggering recalculation with overrides:', currentOverrides);
      
      // Apply user overrides to stop cards before triggering recalculation
      const updatedStopCards = localStopCards.map((card, idx) => {
        const updatedCard = { ...card };
        
        // Apply any user overrides for this stop
        Object.keys(currentOverrides).forEach(key => {
          const [stopIdx, fieldType] = key.split('_');
          if (parseInt(stopIdx) === idx) {
            const value = currentOverrides[key];
            switch (fieldType) {
              case 'extraFuel':
                updatedCard.extraFuel = value;
                // Also update fuelComponentsObject if it exists
                if (updatedCard.fuelComponentsObject) {
                  updatedCard.fuelComponentsObject.extraFuel = value;
                }
                break;
              case 'araFuel':
                // Smart logic: Apply to ARA for rigs, Approach for airports
                const isRig = updatedCard.isRig || updatedCard.type === 'rig' || updatedCard.stopType === 'rig';
                if (isRig) {
                  updatedCard.araFuel = value;
                  // Also update fuelComponentsObject if it exists
                  if (updatedCard.fuelComponentsObject) {
                    updatedCard.fuelComponentsObject.araFuel = value;
                  }
                } else {
                  updatedCard.approachFuel = value;
                  // Also update fuelComponentsObject if it exists
                  if (updatedCard.fuelComponentsObject) {
                    updatedCard.fuelComponentsObject.approachFuel = value;
                  }
                }
                break;
              case 'deckTime':
                updatedCard.deckTime = value;
                break;
              case 'passengers':
                updatedCard.maxPassengers = value;
                break;
              case 'weight':
                updatedCard.maxWeight = value;
                break;
            }
          }
        });
        
        return updatedCard;
      });
      
      setLocalStopCards(updatedStopCards);
      
      // Trigger main app recalculation with updated stop cards
      setTimeout(() => {
        console.log('🚀 DetailedFuelBreakdown: Sending updated stop cards to main app:', updatedStopCards?.length, 'cards');
        console.log('🚀 DetailedFuelBreakdown: First card extraFuel:', updatedStopCards?.[0]?.extraFuel);
        console.log('🚀 DetailedFuelBreakdown: Calling onStopCardsCalculated...');
        onStopCardsCalculated(updatedStopCards);
        console.log('🚀 DetailedFuelBreakdown: onStopCardsCalculated called successfully');
      }, 50);
    }
  }, [localStopCards, onStopCardsCalculated]);
  
  // Handle field changes - proper async updates to avoid render warnings
  const handleFieldChange = useCallback((stopIndex, fieldType, value) => {
    const key = `${stopIndex}_${fieldType}`;
    
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
            console.log(`🌦️ Location-specific fuel change for stop ${stopIndex}:`, value);
            const stopCard = localStopCards[stopIndex];
            const stopName = stopCard?.name || stopCard?.stopName || `stop_${stopIndex}`;
            
            // 🚨 FIX: Get isRig from weather segments, not from stop card
            let isRig = false;
            if (weatherSegments && weatherSegments.length > 0) {
              const weatherSegment = weatherSegments.find(segment => 
                segment.airportIcao === stopName ||
                segment.locationName === stopName ||
                segment.location === stopName ||
                segment.uniqueId === stopName
              );
              isRig = weatherSegment?.isRig || false;
              console.log(`🌦️ Found weather segment for ${stopName}:`, { isRig: isRig, segment: weatherSegment });
            }
            
            console.log(`✅ About to call onLocationFuelChange with:`, {
              stopName: stopName,
              stopIndex: stopIndex,
              fuelType: isRig ? 'araFuel' : 'approachFuel',
              value: value,
              isRig: isRig
            });
            
            onLocationFuelChange({
              stopName: stopName,
              stopIndex: stopIndex,
              fuelType: isRig ? 'araFuel' : 'approachFuel',
              value: value,
              isRig: isRig
            });
            
            console.log(`✅ onLocationFuelChange called successfully`);
            
            // 🚨 DEBUG: Log current locationFuelOverrides after change
            setTimeout(() => {
              console.log(`🔍 Current locationFuelOverrides after change:`, locationFuelOverrides);
              console.log(`🔍 Triggering manual recalculation to update summaries...`);
              
              // 🚨 FORCE: Trigger recalculation manually
              if (typeof triggerRecalculation === 'function') {
                triggerRecalculation();
              }
            }, 100);
            break;
          default:
            console.log(`⚠️ Unknown field type: ${fieldType}`);
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
    
    // Note: Recalculation is now triggered immediately above with fresh overrides
  }, [localStopCards, flightSettings.passengerWeight, selectedAircraft?.maxPayload, triggerRecalculation]);
  
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
          // Check both araFuel and approachFuel location overrides
          const araKey = `${stopName}_araFuel`;
          const approachKey = `${stopName}_approachFuel`;
          
          return locationFuelOverrides[araKey]?.value || locationFuelOverrides[approachKey]?.value;
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
                          {isRefuelStop && (
                            <div style={{ color: '#FF6B35', fontSize: '11px', fontWeight: '600', marginTop: '2px' }}>
                              REFUEL STOP
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