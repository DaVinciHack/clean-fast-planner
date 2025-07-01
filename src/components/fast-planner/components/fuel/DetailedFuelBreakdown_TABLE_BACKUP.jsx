/**
 * DetailedFuelBreakdown.jsx
 * 
 * Professional fuel breakdown modal designed for tablet and mobile viewing.
 * Mimics Palantir's fuel breakdown interface with responsive design.
 * Accessible from MainCard where "ROUTE STOPS (UNIFIED FUEL)" is displayed.
 */

import React, { useState, useMemo } from 'react';
import FuelSaveBackService from '../../services/FuelSaveBackService';
import StopCardCalculator from '../../modules/calculations/flight/StopCardCalculator';

const DetailedFuelBreakdown = ({
  visible = false,
  onClose = () => {},
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  currentFlightId = null,
  alternateRouteData = null,
  alternateStopCard = null,
  waypoints = [],
  weather = { windSpeed: 0, windDirection: 0 }
}) => {
  // 🎯 INTERACTIVE FUEL CONTROL STATE
  const [userOverrides, setUserOverrides] = useState({});
  const [fieldStates, setFieldStates] = useState({});
  const [isEditing, setIsEditing] = useState(null);
  
  // Handle field changes - simpler approach to avoid input interference
  const handleFieldChange = (stopIndex, fieldType, value) => {
    const key = `${stopIndex}_${fieldType}`;
    
    // Update override value immediately without complex logic
    setUserOverrides(prev => {
      const newOverrides = {
        ...prev,
        [key]: value
      };
      
      // Check capacity after updating - for passengers and weight fields only
      if ((fieldType === 'passengers' || fieldType === 'weight') && value !== '' && value !== undefined) {
        const stopCard = stopCards[stopIndex] || {};
        const availablePassengers = stopCard.maxPassengers || 0;
        const availableWeight = (availablePassengers * (flightSettings.passengerWeight || 220));
        const standardWeight = flightSettings.passengerWeight || 220;
        const aircraftMaxCapacity = selectedAircraft?.maxPayload || 99999;
        
        const requestedPassengers = newOverrides[`${stopIndex}_passengers`];
        const requestedWeight = newOverrides[`${stopIndex}_weight`];
        
        let isCapacityOk = true;
        if (requestedWeight !== undefined && requestedWeight !== '') {
          // User provided weight - use actual weight
          isCapacityOk = requestedWeight <= availableWeight && requestedWeight <= aircraftMaxCapacity;
        } else if (requestedPassengers !== undefined && requestedPassengers !== '') {
          // User only provided passengers - use standard weight calculation
          const calculatedWeight = requestedPassengers * standardWeight;
          isCapacityOk = requestedPassengers <= availablePassengers && calculatedWeight <= aircraftMaxCapacity;
        }
        
        // Update field states for both passenger and weight fields
        setFieldStates(prev => ({
          ...prev,
          [`${stopIndex}_passengers`]: isCapacityOk ? 'user-override' : 'over-capacity',
          [`${stopIndex}_weight`]: isCapacityOk ? 'user-override' : 'over-capacity'
        }));
      } else if (value !== '' && value !== undefined) {
        // For other fields, just mark as user-override
        setFieldStates(prev => ({
          ...prev,
          [key]: 'user-override'
        }));
      }
      
      return newOverrides;
    });
  };
  
  // Get field border color based on state
  const getFieldBorderColor = (stopIndex, fieldType) => {
    const key = `${stopIndex}_${fieldType}`;
    const state = fieldStates[key];
    
    if (isEditing === key) return '#4FC3F7'; // Blue while editing
    if (state === 'user-override') return '#2196F3'; // Blue for user overrides
    if (state === 'over-capacity') return '#f44336'; // Red for warnings
    return '#666'; // Grey for calculated/default
  };
  
  // Tiny mobile-optimized input component - Show saved values
  const TinyInput = ({ placeholder, stopIndex, fieldType, min = 0, width = '45px' }) => {
    const key = `${stopIndex}_${fieldType}`;
    const [localValue, setLocalValue] = React.useState('');
    const savedValue = userOverrides[key];
    
    // Show saved value when not editing, local value when editing
    const displayValue = isEditing === key ? localValue : (savedValue || '');
    
    return (
      <input
        type="text"
        value={displayValue}
        onChange={(e) => {
          // Allow typing freely without interference
          setLocalValue(e.target.value);
        }}
        onFocus={() => {
          setIsEditing(key);
          // Load existing value when starting to edit
          setLocalValue(savedValue ? savedValue.toString() : '');
        }}
        onBlur={() => {
          setIsEditing(null);
          // Save to parent state when done editing
          const numValue = localValue === '' ? '' : parseInt(localValue) || 0;
          handleFieldChange(stopIndex, fieldType, numValue);
        }}
        placeholder={placeholder}
        style={{
          width: width,
          padding: '2px 3px',
          fontSize: '10px',
          backgroundColor: '#333',
          color: '#fff',
          border: `1px solid ${getFieldBorderColor(stopIndex, fieldType)}`,
          borderRadius: '2px',
          textAlign: 'center'
        }}
      />
    );
  };
  
  // Clean up fuel components text to remove duplicates and format nicely
  const cleanupFuelComponents = (componentText) => {
    if (!componentText || componentText === 'No breakdown available') {
      return componentText;
    }
    
    // Split by common separators and clean up duplicates
    const parts = componentText.split(/[,\s]+/).filter(part => part.length > 0);
    const seen = new Set();
    const cleaned = [];
    
    for (const part of parts) {
      // Extract fuel type and amount (e.g., "Trip:1114" -> "Trip")
      const match = part.match(/^([A-Za-z]+):/);
      if (match) {
        const fuelType = match[1];
        if (!seen.has(fuelType)) {
          seen.add(fuelType);
          cleaned.push(part);
        }
      } else {
        cleaned.push(part);
      }
    }
    
    return cleaned.join(' ');
  };

  // Calculate fuel breakdown data
  const fuelData = useMemo(() => {
    if (!stopCards || stopCards.length === 0) {
      return { stopBreakdown: [], minimalFuel: null, hasData: false };
    }
    
    // Process stop cards for detailed breakdown
    const stopBreakdown = stopCards.map((card, index) => {
      // Calculate refuel amount needed
      let refuelAmount = 0;
      let refuelText = '-';
      
      if (card.refuelMode === true && index > 0) {
        // For refuel stops, the refuel amount is the difference between what's needed and what's available
        // Look at the Required Fuel vs what would be available without refueling
        const requiredFuel = Math.round(card.totalFuel || 0);
        
        // For a refuel stop, we need to find how much fuel was actually consumed to get here
        // and how much more is needed to continue. The refuel amount is what needs to be added.
        
        // If this is marked as a refuel stop, it means we NEED to refuel here
        // The card.totalFuel shows the minimum fuel needed to continue from here
        // So the refuel amount should be showing this as the minimum to add
        
        refuelText = `Minimum +${requiredFuel.toLocaleString()} lbs to continue`;
        console.log(`🛩️ REFUEL CALC: Stop ${card.stopName} needs minimum ${requiredFuel} lbs to continue`);
      }
      
      return {
        stop: card.stopName || card.name || `Stop ${index + 1}`,
        requiredFuel: Math.round(card.totalFuel || 0),
        maxPassengers: typeof card.maxPassengers === 'string' ? card.maxPassengers : 
                       card.maxPassengers !== null && card.maxPassengers !== undefined ? 
                       `${card.maxPassengers} (${Math.round((card.maxPassengers * (flightSettings.passengerWeight || 220)) || 0)} Lbs)` : 
                       'Final Stop',
        fuelComponents: cleanupFuelComponents(card.componentText || card.fuelComponents || 'No breakdown available'),
        refuelAmount: refuelText,
        isRefuel: card.refuelMode === true,
        isDestination: card.isDestination === true,
        isDeparture: index === 0
      };
    });
    
    // Use the alternateStopCard passed from the app level
    let minimalFuel = null;
    if (alternateStopCard) {
      console.log('🔍 DEBUG: Using alternate stop card from app level:', {
        totalFuel: alternateStopCard.totalFuel,
        totalDistance: alternateStopCard.totalDistance,
        totalTime: alternateStopCard.totalTime,
        totalTimeType: typeof alternateStopCard.totalTime,
        maxPassengers: alternateStopCard.maxPassengers,
        maxPassengersDisplay: alternateStopCard.maxPassengersDisplay,
        componentText: alternateStopCard.componentText,
        fuelComponents: alternateStopCard.fuelComponents,
        routeDescription: alternateStopCard.routeDescription,
        timeCalculation: `${Math.floor((alternateStopCard.totalTime || 0) / 60)}:${((alternateStopCard.totalTime || 0) % 60).toString().padStart(2, '0')}`,
        fullCard: alternateStopCard
      });
      
      // Parse fuel components to extract reserve, contingency, and extra fuel
      const componentText = alternateStopCard.componentText || alternateStopCard.fuelComponents || '';
      console.log('🔍 DEBUG: Parsing alternate fuel components:', componentText);
      
      // Extract fuel values from component text (e.g., "Res:475 Extra:200")
      const reserveMatch = componentText.match(/Res:(\d+)/);
      const contingencyMatch = componentText.match(/Cont:(\d+)/);
      const extraMatch = componentText.match(/Extra:(\d+)/);
      
      const reserveFuel = reserveMatch ? parseInt(reserveMatch[1]) : 0;
      const contingencyFuel = contingencyMatch ? parseInt(contingencyMatch[1]) : 0; 
      const extraFuel = extraMatch ? parseInt(extraMatch[1]) : 0;
      const expectedLandingFuel = reserveFuel + contingencyFuel + extraFuel;
      
      console.log('🔍 DEBUG: Alternate fuel breakdown:', {
        reserve: reserveFuel,
        contingency: contingencyFuel,
        extra: extraFuel,
        expectedLanding: expectedLandingFuel
      });

      minimalFuel = {
        requiredFuel: Math.round(alternateStopCard.totalFuel || 0),
        maxPassengers: alternateStopCard.maxPassengersDisplay || alternateStopCard.maxPassengers || 'Unknown',
        fuelComponents: cleanupFuelComponents(componentText || 'Trip fuel + Reserves + Contingency'),
        route: alternateStopCard.routeDescription || alternateRouteData?.name || 'Alternate route',
        distance: Math.round(alternateStopCard.totalDistance || 0),
        time: Math.round(alternateStopCard.totalTime || 0), // Time in minutes
        timeFormatted: alternateStopCard.totalTime ? (() => {
          const rawTime = alternateStopCard.totalTime;
          console.log('🕐 TIME DEBUG - Raw value:', rawTime, 'Type:', typeof rawTime);
          
          // Check if time is in hours (like 1.6) or minutes (like 96)
          let totalMinutes;
          if (rawTime < 10) {
            // Likely in hours (e.g., 1.6 hours = 96 minutes)
            totalMinutes = Math.round(rawTime * 60);
            console.log('🕐 TIME DEBUG - Treating as HOURS:', rawTime, 'hours =', totalMinutes, 'minutes');
          } else {
            // Likely in minutes
            totalMinutes = Math.round(rawTime);
            console.log('🕐 TIME DEBUG - Treating as MINUTES:', totalMinutes, 'minutes');
          }
          
          const hours = Math.floor(totalMinutes / 60);
          const minutes = totalMinutes % 60;
          console.log('🕐 TIME DEBUG - Final:', { hours, minutes, formatted: `${hours}:${minutes.toString().padStart(2, '0')}` });
          return `${hours}:${minutes.toString().padStart(2, '0')}`;
        })() : 'Unknown',
        contingencyFuel: contingencyFuel,
        reserveFuel: reserveFuel,
        extraFuel: extraFuel,
        expectedLandingFuel: expectedLandingFuel
      };
    }
    
    return { stopBreakdown, minimalFuel, hasData: true };
  }, [stopCards, flightSettings, alternateStopCard]);
  
  // Save fuel settings function - saves fuel data without automation
  const handleSaveFuelSettings = async () => {
    if (!currentFlightId || !stopCards || stopCards.length === 0) {
      alert('No flight data available to save fuel settings.');
      return;
    }
    
    try {
      console.log('💾 Saving fuel settings with user overrides:', userOverrides);
      
      // Apply user overrides to stop cards before saving
      const modifiedStopCards = stopCards.map((card, index) => {
        const modifications = {};
        
        // Check for user overrides for this stop
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
              // Add more field types as needed
            }
          }
        });
        
        return { ...card, ...modifications };
      });
      
      // Save the modified fuel data
      await FuelSaveBackService.saveFuelData(
        currentFlightId,
        modifiedStopCards,
        flightSettings,
        weatherFuel,
        fuelPolicy,
        routeStats,
        selectedAircraft
      );
      
      // Show success message
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
  
  // Save flight function - saves complete flight without automation
  const handleSaveFlight = async () => {
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      alert('Please select an aircraft and add waypoints before saving.');
      return;
    }
    
    try {
      // Import SaveFlightButton functionality
      const { saveFlightData } = await import('../controls/SaveFlightButton');
      
      // Create flight data object with current settings
      const flightData = {
        // Use existing flight name/time or generate defaults
        flightName: currentFlightId ? `Flight ${currentFlightId}` : `Fast Planner Flight ${new Date().toLocaleDateString()}`,
        etd: new Date().toISOString(), // Current time as departure
        
        // Flight settings from flightSettings prop
        passengerWeight: flightSettings?.passengerWeight || 220,
        cargoWeight: flightSettings?.cargoWeight || 0,
        extraFuel: flightSettings?.extraFuel || 0,
        
        // Pilot settings (defaults for Fast Planner)
        captainId: "1", // Default Fast Planner pilot
        copilotId: "1", // Default Fast Planner pilot
        
        // Automation settings - DISABLED for manual save
        enableAutomation: false, // Don't run automation
        useOnlyFastPlannerWaypoints: true // Use only our waypoints
      };
      
      // Save the complete flight
      const result = await saveFlightData(
        flightData,
        selectedAircraft,
        waypoints,
        routeStats,
        false, // Don't run automation
        () => {}, // Success callback
        () => {} // Error callback
      );
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Flight saved successfully', 'success');
      } else {
        alert('Flight saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save flight:', error);
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Failed to save flight: ${error.message}`, 'error');
      } else {
        alert(`Failed to save flight: ${error.message}`);
      }
    }
  };
  
  if (!visible) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        width: '90%',
        maxWidth: '1000px',
        height: '80%',
        maxHeight: '650px',
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
            Fuel Requirements and Passenger Capacity by Stop
          </h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Save Fuel Settings Button - Always available when we have fuel data */}
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
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(to bottom, #388e3c, #2e7d32)';
                  e.target.style.borderColor = '#66bb6a';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(to bottom, #2e7d32, #1b5e20)';
                  e.target.style.borderColor = '#4caf50';
                }}
              >
                💾 Save Fuel Settings
              </button>
            )}
            {false && selectedAircraft && waypoints && waypoints.length >= 2 && (
              <button
                onClick={handleSaveFlight}
                style={{
                  background: 'linear-gradient(to bottom, #1f2937, #111827)',
                  color: 'white',
                  border: '1px solid #4FC3F7',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'linear-gradient(to bottom, #2a3a47, #1a2a37)';
                  e.target.style.borderColor = '#4FC3F7';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
                  e.target.style.borderColor = '#4FC3F7';
                }}
              >
                💾 Save Flight
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#333';
                e.target.style.borderColor = '#999';
                e.target.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'linear-gradient(to bottom, #1f2937, #111827)';
                e.target.style.borderColor = '#666';
                e.target.style.color = '#ccc';
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
        
        {/* Combined View - No Tabs */}
        
        {/* Content Area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px'
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
            <>
              {/* Detailed Breakdown Section */}
                <div>
                  {/* Detailed Breakdown Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#333' }}>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '45px' }}>Stop</th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#BB86FC', fontWeight: '600', fontSize: '9px', minWidth: '60px', borderLeft: '1px solid #2a2a2a' }}>
                            Passengers<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>Avail/Req</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#BB86FC', fontWeight: '600', fontSize: '9px', minWidth: '60px', borderRight: '1px solid #2a2a2a' }}>
                            Weight<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>Avail/Req</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '35px' }}>
                            Deck<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>mins</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '40px' }}>
                            Extra<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>fuel</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '35px' }}>
                            ARA/APPROACH<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>fuel</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '120px' }}>
                            Fuel Summary<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>Taxi:Trip:Alt:Cont:Deck:Res:Extra</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '70px' }}>
                            Depart With<br/>
                            <span style={{ fontSize: '8px', color: '#999' }}>total fuel</span>
                          </th>
                          <th style={{ padding: '3px 2px', textAlign: 'center', color: '#4FC3F7', fontWeight: '600', fontSize: '9px', minWidth: '20px' }}>✅</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fuelData.stopBreakdown.map((stop, index) => {
                          const stopCard = stopCards[index] || {};
                          const availablePassengers = stopCard.maxPassengers || 0;
                          const availableWeight = (availablePassengers * (flightSettings.passengerWeight || 220));
                          
                          // Start with empty requested values - only use override if user has entered something
                          const requestedPassengers = userOverrides[`${index}_passengers`];
                          const requestedWeight = userOverrides[`${index}_weight`];
                          
                          // Smart capacity checking logic
                          let isCapacityOk = true;
                          const standardWeight = flightSettings.passengerWeight || 220;
                          const aircraftMaxCapacity = selectedAircraft?.maxPayload || 99999; // Aircraft absolute max
                          
                          if (requestedPassengers !== undefined || requestedWeight !== undefined) {
                            if (requestedWeight !== undefined) {
                              // User provided weight - use actual weight (ignore passenger count vs standard)
                              isCapacityOk = requestedWeight <= availableWeight && requestedWeight <= aircraftMaxCapacity;
                            } else if (requestedPassengers !== undefined) {
                              // User only provided passengers - use standard weight calculation
                              const calculatedWeight = requestedPassengers * standardWeight;
                              isCapacityOk = requestedPassengers <= availablePassengers && calculatedWeight <= aircraftMaxCapacity;
                            }
                          }
                          
                          // Calculate fuel components for this stop
                          const tripFuel = stopCard.tripFuel || 0;
                          const contingencyFuel = stopCard.contingencyFuel || 0;
                          const isRefuelStop = stopCard.refuelMode === true || stop.isRefuel;
                          const isFinalStop = index === stopCards.length - 1;
                          
                          return (
                            <tr key={index} style={{
                              backgroundColor: index % 2 === 0 ? '#2a2a2a' : '#1e1e1e',
                              borderBottom: '1px solid #333'
                            }}>
                              {/* Stop Name */}
                              <td style={{ 
                                padding: '4px', 
                                color: '#fff', 
                                fontWeight: '600',
                                fontSize: '9px',
                                verticalAlign: 'middle',
                                height: '35px',
                                textAlign: 'center'
                              }}>
                                <div>{stop.stop}</div>
                                {isRefuelStop && (
                                  <div style={{ 
                                    color: '#FF6B35', 
                                    fontSize: '7px', 
                                    fontWeight: '600',
                                    marginTop: '1px'
                                  }}>
                                    (REFUEL)
                                  </div>
                                )}
                              </td>
                              
                              {/* Passengers: Available / Requested */}
                              <td style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '35px', borderLeft: '1px solid #2a2a2a' }}>
                                {!isFinalStop ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '2px', fontWeight: '600', height: '12px' }}>
                                      {availablePassengers}
                                    </div>
                                    <TinyInput
                                      stopIndex={index}
                                      fieldType="passengers"
                                      placeholder="req"
                                      width="40px"
                                    />
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '9px', color: '#999' }}>Final</span>
                                )}
                              </td>
                              
                              {/* Weight: Available / Requested */}
                              <td style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '35px', borderRight: '1px solid #2a2a2a' }}>
                                {!isFinalStop ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '2px', fontWeight: '600', height: '12px' }}>
                                      {Math.round(availableWeight)}
                                    </div>
                                    <TinyInput
                                      stopIndex={index}
                                      fieldType="weight"
                                      placeholder="req"
                                      width="40px"
                                    />
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '9px', color: '#999' }}>-</span>
                                )}
                              </td>
                              
                              {/* Deck Time (this deck only) */}
                              <td style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '35px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                  <div style={{ height: '12px' }}></div>
                                  {index > 0 && !isFinalStop ? (
                                    <TinyInput
                                      stopIndex={index}
                                      fieldType="deckTime"
                                      placeholder="15"
                                      width="40px"
                                    />
                                  ) : (
                                    <span style={{ fontSize: '8px', color: '#666' }}>-</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* Extra Fuel (only at refuel stops + departure) */}
                              <td style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '35px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                  <div style={{ height: '12px' }}></div>
                                  {(index === 0 || isRefuelStop) ? (
                                    <TinyInput
                                      stopIndex={index}
                                      fieldType="extraFuel"
                                      placeholder="0"
                                      width="40px"
                                    />
                                  ) : (
                                    <span style={{ fontSize: '8px', color: '#666' }}>-</span>
                                  )}
                                </div>
                              </td>
                              
                              {/* ARA Fuel */}
                              <td style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', height: '35px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                  <div style={{ height: '12px' }}></div>
                                  <TinyInput
                                    stopIndex={index}
                                    fieldType="araFuel"
                                    placeholder="0"
                                    width="40px"
                                  />
                                </div>
                              </td>
                              
                              {/* Fuel Summary - Taxi:Trip:Alt:Cont:Deck:Res:Extra */}
                              <td style={{ 
                                padding: '4px', 
                                color: '#ddd',
                                fontSize: '12px',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                height: '35px'
                              }}>
                                {(() => {
                                  const taxi = stopCard.taxiFuel || 0;
                                  const alt = stopCard.alternateFuel || 0;
                                  const deck = stopCard.deckFuel || 0;
                                  const res = stopCard.reserveFuel || 0;
                                  const extra = stopCard.extraFuel || userOverrides[`${index}_extraFuel`] || 0;
                                  
                                  return `Taxi:${taxi} Trip:${tripFuel} Alt:${alt} Cont:${contingencyFuel} Deck:${deck} Res:${res} Extra:${extra}`;
                                })()}
                              </td>
                              
                              {/* Depart With - Total fuel needed to depart from this location */}
                              <td style={{ 
                                padding: '4px', 
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: '600',
                                textAlign: 'center',
                                verticalAlign: 'middle',
                                height: '35px'
                              }}>
                                <div>{stop.requiredFuel.toLocaleString()}</div>
                                <div style={{ fontSize: '7px', color: '#666' }}>
                                  {isFinalStop ? 'land' : 'depart'}
                                </div>
                              </td>
                              
                              {/* Status Indicator */}
                              <td style={{ 
                                padding: '4px',
                                textAlign: 'center',
                                fontSize: '11px',
                                verticalAlign: 'middle',
                                height: '35px'
                              }}>
                                {isCapacityOk ? (
                                  <span style={{ color: '#4caf50' }}>✅</span>
                                ) : (
                                  <span style={{ color: '#f44336' }}>❌</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Color coding legend */}
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    fontSize: '11px',
                    color: '#999'
                  }}>
                    <div style={{ marginBottom: '8px', fontWeight: '600', color: '#4FC3F7' }}>Field Color Guide:</div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '12px', border: '1px solid #666', borderRadius: '2px' }}></div>
                        <span>Default/Calculated</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '12px', border: '1px solid #2196F3', borderRadius: '2px' }}></div>
                        <span>User Override</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '12px', border: '1px solid #4FC3F7', borderRadius: '2px' }}></div>
                        <span>Currently Editing</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '12px', border: '1px solid #f44336', borderRadius: '2px' }}></div>
                        <span>Over Capacity</span>
                      </div>
                    </div>
                  </div>
                </div>
              
              {/* Alternate Route Fuel Summary Section */}
              {fuelData.minimalFuel ? (
                <div>
                  <h3 style={{ 
                    color: '#ffffff', 
                    marginTop: 0, 
                    marginBottom: '24px',
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    Alternate Route Fuel Requirements
                  </h3>
                  
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      backgroundColor: '#2a2a2a',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      marginBottom: '24px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#333' }}>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Required Fuel</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Max Passengers</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Distance/Time</th>
                          <th style={{ padding: '16px 12px', textAlign: 'left', color: '#4FC3F7', fontWeight: '600', fontSize: '13px' }}>Fuel Components</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ backgroundColor: '#2a2a2a' }}>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#fff', 
                            fontWeight: '600',
                            fontSize: '14px'
                          }}>
                            {fuelData.minimalFuel.requiredFuel.toLocaleString()} LBS
                          </td>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#fff',
                            fontSize: '13px'
                          }}>
                            {fuelData.minimalFuel.maxPassengers}
                          </td>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#fff',
                            fontSize: '13px'
                          }}>
                            <div style={{ fontWeight: '600' }}>
                              {fuelData.minimalFuel.distance > 0 ? `${Math.round(fuelData.minimalFuel.distance)} NM` : 'Unknown'}
                            </div>
                            <div style={{ color: '#999', fontSize: '11px', marginTop: '2px' }}>
                              {fuelData.minimalFuel.timeFormatted || 'Unknown'}
                            </div>
                          </td>
                          <td style={{ 
                            padding: '16px 12px', 
                            color: '#ccc',
                            fontSize: '12px',
                            fontFamily: 'monospace'
                          }}>
                            {fuelData.minimalFuel.fuelComponents}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div style={{
                    backgroundColor: '#2a2a2a',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #333',
                    color: '#ccc',
                    fontSize: '13px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ marginBottom: '8px' }}>
                      <strong style={{ color: '#4FC3F7' }}>Alternate Route:</strong> {fuelData.minimalFuel.route}
                    </div>
                    <div>
                      <strong style={{ color: '#4FC3F7' }}>Expected Landing Fuel:</strong> {fuelData.minimalFuel.expectedLandingFuel} LBS (Reserve:{fuelData.minimalFuel.reserveFuel}{fuelData.minimalFuel.contingencyFuel > 0 ? `, Contingency:${fuelData.minimalFuel.contingencyFuel}` : ''}{fuelData.minimalFuel.extraFuel > 0 ? `, Extra:${fuelData.minimalFuel.extraFuel}` : ''})
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    backgroundColor: '#1a2a1a',
                    border: '1px solid #2a4a2a',
                    borderRadius: '6px',
                    color: '#66BB6A',
                    fontSize: '13px'
                  }}>
                    <strong>✅ No significant Triggered Lightning or waves detected</strong>
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#2a2a2a',
                  padding: '20px',
                  borderRadius: '6px',
                  border: '1px solid #333',
                  color: '#999',
                  fontSize: '14px',
                  textAlign: 'center',
                  marginTop: '20px'
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🗺️</div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>No Alternate Route Available</div>
                  <div>Create an alternate route to see IFR fuel requirements</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailedFuelBreakdown;