import React, { useState, useEffect, useRef } from 'react';
import StopCard from './StopCard';
import StopCardCalculator from '../../../modules/calculations/flight/StopCardCalculator.js';

/**
 * Enhanced StopCardsContainer with StopCardCalculator Direct Integration
 * 
 * SIMPLIFIED: Now calls StopCardCalculator directly for single source of truth
 * - No more MasterFuelManager wrapper complexity
 * - Direct fuel policy integration for reserve fuel conversion
 * - Consistent calculations with header display
 */
const EnhancedStopCardsContainer = ({
  waypoints = [],
  routeStats = null,
  selectedAircraft = null,
  passengerWeight,
  cargoWeight, // 🟠 ADDED: Missing cargoWeight prop
  reserveFuel,
  contingencyFuelPercent,
  deckTimePerStop,
  deckFuelFlow,
  taxiFuel,
  extraFuel,  // 🔧 ADDED: Missing extraFuel parameter
  araFuel = 0,  // 🔧 ADDED: ARA fuel from weather analysis
  approachFuel = 0,  // 🔧 ADDED: Approach fuel from weather analysis
  weather,
  alternateRouteData = null,
  fuelPolicy = null, // Fuel policy for reserve fuel conversion
  weatherSegments = null,
  stopCards = [], // Legacy prop - will be ignored
  // 🛩️ VFR OPERATIONS: Callback for waive alternates state changes
  onWaiveAlternatesChange = null,
  // 🛩️ HEADER SYNC: Callback to update header totals
  onStopCardsCalculated = null,
  // 🔧 NEW: Callback to show fuel breakdown modal at MainCard level
  onShowFuelBreakdown = null,
  // 🔧 NEW: Callback to pass alternate card data up to parent
  onAlternateCardCalculated = null,
  // 🔧 NEW: Current flight ID for fuel save functionality
  currentFlightId = null
}) => {
  console.log('🎯 EnhancedStopCardsContainer: Using StopCardCalculator directly - single source of truth');
  
  console.log('🔍 EnhancedStopCardsContainer: Props received:', {
    waypoints: waypoints?.length || 0,
    hasAircraft: !!selectedAircraft,
    hasPolicy: !!fuelPolicy,
    hasWeather: !!weather,
    hasAlternateRouteData: !!alternateRouteData,
    alternateRouteName: alternateRouteData?.name,
    alternateRouteCoords: alternateRouteData?.coordinates?.length,
    // 🔍 DEBUG: Check weather fuel props
    araFuel: araFuel,
    approachFuel: approachFuel,
    araFuelType: typeof araFuel,
    approachFuelType: typeof approachFuel
  });
  
  // State for displaying stop cards
  const [displayStopCards, setDisplayStopCards] = useState([]);
  const [alternateStopCard, setAlternateStopCard] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  
  // State for refuel stops (array of stop indices that are refuel stops)
  const [refuelStops, setRefuelStops] = useState([]);
  
  // State for waiving alternates (VFR operations)
  const [waiveAlternates, setWaiveAlternates] = useState(false);
  
  // Force recalculation trigger when refuel stops change
  const [forceRecalculation, setForceRecalculation] = useState(0);
  
  // Track last notified cards to prevent infinite loop
  const lastNotifiedCardsRef = useRef(null);
  
  // 🎯 ONE SOURCE OF TRUTH: Calculate stop cards directly with StopCardCalculator
  useEffect(() => {
    // 🚨 SAFETY: Wait for aircraft data to be complete before calculating
    const hasRequiredAircraftData = selectedAircraft && 
      selectedAircraft.fuelBurn &&
      selectedAircraft.usefulLoad && selectedAircraft.usefulLoad > 0;
    
    // 🚨 RACE CONDITION FIX: Ensure fuel policy has actual current policy data
    const hasValidFuelPolicy = fuelPolicy && fuelPolicy.currentPolicy && fuelPolicy.currentPolicy.uuid;
      
    if (waypoints && waypoints.length >= 2 && selectedAircraft && hasValidFuelPolicy && hasRequiredAircraftData) {
      console.log('🎯 EnhancedStopCardsContainer: Calculating stop cards with StopCardCalculator (ONE SOURCE OF TRUTH)');
      console.log('🎯 EnhancedStopCardsContainer: Using weather fuel values:', { araFuel, approachFuel });
      console.log('🎯 EnhancedStopCardsContainer: Fuel policy structure:', fuelPolicy);
      
      try {
        const stopCardOptions = {
          passengerWeight: Number(passengerWeight) || 0,
          cargoWeight: Number(cargoWeight) || 0,
          contingencyFuelPercent: Number(contingencyFuelPercent) || 0,
          reserveFuel: Number(reserveFuel) || 0,
          deckTimePerStop: Number(deckTimePerStop) || 0,
          deckFuelFlow: Number(deckFuelFlow) || 0,
          taxiFuel: Number(taxiFuel) || 0,
          extraFuel: Number(extraFuel) || 0,
          araFuel: Number(araFuel) || 0,      // 🔧 Weather fuel
          approachFuel: Number(approachFuel) || 0,  // 🔧 Weather fuel
          fuelPolicy: fuelPolicy?.currentPolicy  // 🔧 FIXED: Use currentPolicy like FlightUtilities
        };
        
        console.log('🎯 EnhancedStopCardsContainer: Stop card options:', stopCardOptions);
        
        const calculatedStopCards = StopCardCalculator.calculateStopCards(
          waypoints,
          routeStats,
          selectedAircraft,
          weather,
          stopCardOptions,
          weatherSegments,
          refuelStops,     // 🛩️ REFUEL: Pass refuel stops array
          waiveAlternates, // 🛩️ VFR: Pass waive alternates flag
          alternateStopCard // 🛩️ IFR: Pass alternate card data for fuel requirements
        );
        
        if (calculatedStopCards && calculatedStopCards.length > 0) {
          console.log(`🎯 EnhancedStopCardsContainer: Generated ${calculatedStopCards.length} stop cards with weather fuel`);
          
          // 🚨 RACE CONDITION FIX: Only update if cards have actually changed
          const newCardsString = JSON.stringify(calculatedStopCards);
          const currentCardsString = JSON.stringify(displayStopCards);
          
          if (newCardsString !== currentCardsString) {
            console.log('🔄 EnhancedStopCardsContainer: Stop cards changed, updating display');
            setDisplayStopCards(calculatedStopCards);
            
            // 🛩️ HEADER SYNC: Notify header of new stop cards for totals update (prevent infinite loop)
            if (onStopCardsCalculated && newCardsString !== lastNotifiedCardsRef.current) {
              lastNotifiedCardsRef.current = newCardsString;
              onStopCardsCalculated(calculatedStopCards);
            }
          } else {
            console.log('🔄 EnhancedStopCardsContainer: Stop cards unchanged, skipping update');
          }
        }
      } catch (error) {
        console.error('🎯 EnhancedStopCardsContainer: Error calculating stop cards:', error);
        setDisplayStopCards([]);
      }
    } else {
      console.log('🎯 EnhancedStopCardsContainer: Waiting for complete data:', {
        hasWaypoints: waypoints && waypoints.length >= 2,
        hasAircraft: !!selectedAircraft,
        hasFuelPolicy: !!fuelPolicy,
        hasAircraftData: hasRequiredAircraftData,
        aircraftInfo: selectedAircraft ? {
          registration: selectedAircraft.registration,
          hasUsefulLoad: !!selectedAircraft.usefulLoad,
          usefulLoadValue: selectedAircraft.usefulLoad,
          hasFuelBurn: !!selectedAircraft.fuelBurn,
          fuelBurnValue: selectedAircraft.fuelBurn
        } : 'No aircraft'
      });
      setDisplayStopCards([]);
    }
  }, [waypoints, routeStats, selectedAircraft, weather, fuelPolicy, passengerWeight, cargoWeight, contingencyFuelPercent, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, extraFuel, araFuel, approachFuel, refuelStops, forceRecalculation, alternateStopCard]);
  
  
  // 🟠 ADDED: Restore alternate card from persistent storage on mount
  useEffect(() => {
    if (window.currentAlternateCard && !alternateStopCard) {
      console.log('🟠 EnhancedStopCardsContainer: Restoring alternate card from persistent storage:', window.currentAlternateCard);
      setAlternateStopCard(window.currentAlternateCard);
    }
  }, []);
  
  // 🟠 ADDED: Persist alternate card to survive component unmount/remount
  useEffect(() => {
    if (alternateStopCard) {
      console.log('🟠 EnhancedStopCardsContainer: Persisting alternate card to window storage:', alternateStopCard);
      window.currentAlternateCard = alternateStopCard;
    } else if (alternateStopCard === null) {
      console.log('🟠 EnhancedStopCardsContainer: Clearing persisted alternate card');
      window.currentAlternateCard = null;
    }
  }, [alternateStopCard]);
  
  // 🟠 ADDED: Calculate alternate stop card when alternate route data exists
  useEffect(() => {
    console.log('🟠 EnhancedStopCardsContainer: Alternate card useEffect triggered with data:', {
      hasAlternateRouteData: !!alternateRouteData,
      alternateRouteKeys: alternateRouteData ? Object.keys(alternateRouteData) : [],
      hasSelectedAircraft: !!selectedAircraft,
      waypointCount: waypoints.length,
      hasWeather: !!weather,
      hasFuelPolicy: !!fuelPolicy,
      waiveAlternates: waiveAlternates
    });
    
    // 🛩️ WAIVE ALTERNATES: Skip calculation if alternates are waived (VFR operations)
    if (waiveAlternates) {
      console.log('🛩️ Waiving alternates for VFR operations - clearing alternate card');
      setAlternateStopCard(null);
      return;
    }
    
    // 🚨 SAFETY: Check aircraft data completeness for alternate card too
    const hasRequiredAircraftData = selectedAircraft && 
      selectedAircraft.fuelBurn &&
      selectedAircraft.usefulLoad && selectedAircraft.usefulLoad > 0;
    
    // Only calculate if we have the necessary data AND complete aircraft data
    if (alternateRouteData && selectedAircraft && waypoints.length >= 2 && weather && hasRequiredAircraftData) {
      console.log('🟠 EnhancedStopCardsContainer: Calculating alternate stop card with data:', {
        splitPoint: alternateRouteData.splitPoint,
        name: alternateRouteData.name,
        coordinatesLength: alternateRouteData.coordinates?.length || 0,
        hasWaypoints: waypoints.length >= 2,
        hasSelectedAircraft: !!selectedAircraft
      });
      
      try {
        // Prepare parameters for StopCardCalculator (same as StopCardsContainer)
        const safeWeather = weather || { windSpeed: 0, windDirection: 0 };
        // 🚨 AVIATION SAFETY: Ensure all required parameters are provided (no fallbacks)
        if (contingencyFuelPercent === undefined || contingencyFuelPercent === null) {
          console.error('🚨 Missing contingencyFuelPercent for alternate calculation');
          setAlternateStopCard(null);
          return;
        }
        
        const numericParams = {
          passengerWeight: Number(passengerWeight) || 220,
          cargoWeight: Number(cargoWeight) || 0,
          reserveFuel: Number(reserveFuel) || 0,
          contingencyFuelPercent: Number(contingencyFuelPercent), // Required - no fallback
          deckTimePerStop: Number(deckTimePerStop) || 0,
          deckFuelFlow: Number(deckFuelFlow) || 0,
          taxiFuel: Number(taxiFuel) || 0,
          extraFuel: Number(extraFuel) || 0,
          araFuel: Number(araFuel) || 0,
          approachFuel: Number(approachFuel) || 0,
          fuelPolicy: fuelPolicy?.currentPolicy,
          // 🛩️ REFUEL: Pass refuel stops for future segmented calculations
          refuelStops: refuelStops
        };
        
        const alternateCard = StopCardCalculator.calculateAlternateStopCard(
          waypoints,
          alternateRouteData,
          routeStats,
          selectedAircraft,
          safeWeather,
          numericParams
        );
        
        if (alternateCard) {
          console.log('🟠 EnhancedStopCardsContainer: Alternate stop card calculated successfully:', {
            totalFuel: alternateCard.totalFuel,
            maxPassengers: alternateCard.maxPassengers,
            routeDescription: alternateCard.routeDescription
          });
          
          // 🚨 RACE CONDITION FIX: Only update if alternate card has actually changed
          const newAlternateString = JSON.stringify(alternateCard);
          const currentAlternateString = JSON.stringify(alternateStopCard);
          
          if (newAlternateString !== currentAlternateString) {
            console.log('🔄 EnhancedStopCardsContainer: Alternate card changed, updating');
            setAlternateStopCard(alternateCard);
            
            // 🔧 NEW: Pass alternate card data up to parent
            if (onAlternateCardCalculated) {
              onAlternateCardCalculated(alternateCard);
            }
          } else {
            console.log('🔄 EnhancedStopCardsContainer: Alternate card unchanged, skipping update');
          }
        } else {
          console.log('🟠 EnhancedStopCardsContainer: No alternate stop card generated (calculation returned null)');
          
          // 🚨 RACE CONDITION FIX: Only update if currently not null
          if (alternateStopCard !== null) {
            console.log('🔄 EnhancedStopCardsContainer: Clearing alternate card');
            setAlternateStopCard(null);
            
            // 🔧 NEW: Clear alternate card data in parent
            if (onAlternateCardCalculated) {
              onAlternateCardCalculated(null);
            }
          } else {
            console.log('🔄 EnhancedStopCardsContainer: Alternate card already null, skipping update');
          }
        }
        
      } catch (error) {
        console.error('🟠 EnhancedStopCardsContainer: Error calculating alternate stop card:', error);
        
        // 🚨 RACE CONDITION FIX: Only update if currently not null
        if (alternateStopCard !== null) {
          setAlternateStopCard(null);
          
          // 🔧 NEW: Clear alternate card data in parent on error
          if (onAlternateCardCalculated) {
            onAlternateCardCalculated(null);
          }
        }
      }
      
    } else {
      // Clear alternate card if conditions not met
      console.log('🟠 EnhancedStopCardsContainer: Waiting for alternate card data:', {
        hasAlternateRouteData: !!alternateRouteData,
        hasSelectedAircraft: !!selectedAircraft,
        waypointCount: waypoints.length,
        hasWeather: !!weather,
        hasAircraftData: hasRequiredAircraftData,
        aircraftInfo: selectedAircraft ? {
          registration: selectedAircraft.registration,
          hasUsefulLoad: !!selectedAircraft.usefulLoad,
          usefulLoadValue: selectedAircraft.usefulLoad,
          hasFuelBurn: !!selectedAircraft.fuelBurn,
          fuelBurnValue: selectedAircraft.fuelBurn
        } : 'No aircraft'
      });
      
      // 🚨 RACE CONDITION FIX: Only update if currently not null
      if (alternateStopCard !== null) {
        setAlternateStopCard(null);
        
        // 🔧 NEW: Clear alternate card data in parent when conditions not met
        if (onAlternateCardCalculated) {
          onAlternateCardCalculated(null);
        }
      }
    }
  }, [alternateRouteData, selectedAircraft, waypoints, weather, routeStats, passengerWeight, cargoWeight, reserveFuel, contingencyFuelPercent, deckTimePerStop, deckFuelFlow, taxiFuel, extraFuel, araFuel, approachFuel, fuelPolicy, refuelStops, forceRecalculation, waiveAlternates]);
  
  // Handle card click
  const handleCardClick = (index) => {
    setActiveCardIndex(index === activeCardIndex ? null : index);
  };
  
  // Handle refuel checkbox changes
  const handleRefuelChange = (cardIndex, isRefuel) => {
    console.log(`🛩️ Refuel checkbox changed: Card ${cardIndex} = ${isRefuel}`);
    console.log(`🛩️ Current refuel stops before change:`, refuelStops);
    console.log(`🛩️ Card index type:`, typeof cardIndex, `value:`, cardIndex);
    console.log(`🛩️ All stop cards for reference:`, displayStopCards.map((card, idx) => ({ 
      arrayIndex: idx, 
      cardIndex: card.index, 
      stopName: card.stopName,
      isDeparture: card.isDeparture,
      isDestination: card.isDestination
    })));
    
    // Only allow refuel on intermediate stops (not D=departure, F=final)
    if (cardIndex === 'D' || cardIndex === 'F') {
      console.log(`🛩️ Ignoring refuel change on departure/destination card: ${cardIndex}`);
      return;
    }
    
    // 🚨 AVIATION SAFETY: Simple check if trying to set refuel after alternate split point
    // Skip warning if alternates are waived (VFR operations)
    if (isRefuel && alternateRouteData && alternateRouteData.splitPoint && !waiveAlternates) {
      // Find split point card position in display order
      const splitPointPosition = displayStopCards.findIndex(card => 
        card.stopName === alternateRouteData.splitPoint
      );
      
      // Find refuel card position in display order  
      const refuelPosition = displayStopCards.findIndex(card => card.index === cardIndex);
      
      console.log(`🚨 SAFETY: Split "${alternateRouteData.splitPoint}" at position ${splitPointPosition}, refuel at position ${refuelPosition}`);
      
      if (splitPointPosition !== -1 && refuelPosition > splitPointPosition) {
        const confirmed = window.confirm(
          `🚨 FUEL PLANNING WARNING 🚨\n\n` +
          `Cannot set refuel stop after alternate leg departure point.\n\n` +
          `If unable to land for refuel, insufficient fuel to reach alternate.\n\n` +
          `Continue anyway? (NOT RECOMMENDED)`
        );
        
        if (!confirmed) {
          console.log(`🚨 SAFETY: Refuel after split point cancelled - good decision`);
          return;
        }
      }
    }
    
    setRefuelStops(prev => {
      const newRefuelStops = isRefuel 
        ? (prev.includes(cardIndex) ? prev : [...prev, cardIndex])
        : prev.filter(index => index !== cardIndex);
      
      console.log(`🛩️ Updated refuel stops:`, newRefuelStops);
      return newRefuelStops;
    });
    
    // 🛩️ PHASE 2: Trigger fuel recalculation
    console.log(`🔄 Triggering fuel recalculation due to refuel change`);
    setForceRecalculation(prev => prev + 1);
  };
  
  // Handle waive alternates checkbox changes
  const handleWaiveAlternatesChange = (event) => {
    const isWaived = event.target.checked;
    console.log(`🛩️ ENHANCED CONTAINER: Waive alternates changed: ${isWaived}`);
    setWaiveAlternates(isWaived);
    
    // 🛩️ NOTIFY PARENT: Call parent callback to hide/show alternate route line on map
    if (onWaiveAlternatesChange) {
      console.log(`🗺️ ENHANCED CONTAINER: Calling parent callback with: ${isWaived}`);
      onWaiveAlternatesChange(isWaived);
      console.log(`🗺️ ENHANCED CONTAINER: Parent callback completed`);
    } else {
      console.error(`🚨 ENHANCED CONTAINER: No callback provided! Cannot notify parent.`);
    }
  };

  // Save flight function - saves complete flight without automation
  const handleSaveFlightSettings = async () => {
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      alert('Please select an aircraft and add waypoints before saving.');
      return;
    }
    
    try {
      // Import SaveFlightButton functionality
      const { saveFlightData } = await import('../../controls/SaveFlightButton');
      
      // Create flight data object with current settings
      const flightData = {
        // Use existing flight name/time or generate defaults
        flightName: currentFlightId ? `Flight ${currentFlightId}` : `Fast Planner Flight ${new Date().toLocaleDateString()}`,
        etd: new Date().toISOString(), // Current time as departure
        
        // Flight settings
        passengerWeight: passengerWeight || 220,
        cargoWeight: cargoWeight || 0,
        extraFuel: extraFuel || 0,
        
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
  
  // COMMENTED OUT BROKEN CODE TO FIX SYNTAX ERROR - WILL REVIEW LATER
  // console.log('✈️ EnhancedStopCardsContainer: Updating aircraft in manager');
  // updateAircraft(selectedAircraft);
  // }, [selectedAircraft, updateAircraft]);
  
  // COMMENTED OUT TO FIX "applyOverrides is not defined" ERROR - WILL REVIEW LATER
  // Apply user overrides to manager
  // useEffect(() => {
  //   const overrides = {
  //     passengerWeight: Number(passengerWeight) || 220, // ✅ User input - safe default
  //     // ✅ AVIATION SAFETY FIX: Respect 0 as valid OSDK policy value
  //     taxiFuel: taxiFuel !== undefined ? Number(taxiFuel) : 9999,
  //     // ❌ REMOVED: contingencyFuelPercent - This is POLICY data, not user override!
  //     reserveFuel: reserveFuel !== undefined ? Number(reserveFuel) : 9999,
  //     deckTime: deckTimePerStop !== undefined ? Number(deckTimePerStop) : 9999,
  //     deckFuelFlow: deckFuelFlow !== undefined ? Number(deckFuelFlow) : 9999
  //   };
  //   
  //   console.log('⚙️ EnhancedStopCardsContainer: Applying user overrides to manager:', overrides);
  //   applyOverrides(overrides);
  // }, [passengerWeight, taxiFuel, reserveFuel, deckTimePerStop, deckFuelFlow, applyOverrides]);
  
  // COMMENTED OUT TO FIX "calculations is not defined" ERROR - WILL REVIEW LATER  
  // Update display when calculations change
  // useEffect(() => {
  //   if (calculations && calculations.stopCards) {
  //     console.log('📊 EnhancedStopCardsContainer: Received calculations from MasterFuelManager');
  //     setDisplayStopCards(calculations.stopCards);
  //   }
  // }, [calculations]);
  
  // COMMENTED OUT DUPLICATE FUNCTION TO FIX SYNTAX ERROR - WILL REVIEW LATER
  // Handle card click
  // const handleCardClick = (index) => {
  //   setActiveCardIndex(index === activeCardIndex ? null : index);
  // };
  
  // COMMENTED OUT TO FIX "isLoading is not defined" ERROR - WILL REVIEW LATER
  // Show loading state only if explicitly loading
  // if (isLoading && displayStopCards.length === 0) {
  //   console.log('🔄 EnhancedStopCardsContainer: Showing loading state');
  //   return (
  //     <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
  //       <h4 className="route-stops-title">ROUTE STOPS (UNIFIED FUEL)</h4>
  //       <div className="loading-message">
  //         ⏳ Calculating unified fuel requirements...
  //       </div>
  //     </div>
  //   );
  // }
  
  // COMMENTED OUT TO FIX "isReady is not defined" ERROR - WILL REVIEW LATER
  // Show waiting state only if not ready AND no existing cards
  // if (!isReady && displayStopCards.length === 0) {
  //   console.log('⏸️ EnhancedStopCardsContainer: Showing waiting state - not ready');
  //   return (
  //     <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
  //       <h4 className="route-stops-title">ROUTE STOPS (UNIFIED FUEL)</h4>
  //       <div className="waiting-message">
  //         📋 Waiting for fuel policy, aircraft, and route data...
  //       </div>
  //     </div>
  //   );
  // }
  
  // If no cards AND not ready, show nothing (no ugly fallback)
  if (displayStopCards.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
        {/* Detailed Fuel Breakdown Button */}
        <button
          onClick={() => onShowFuelBreakdown && onShowFuelBreakdown()}
          style={{
            width: '100%',
            padding: '6px 12px',
            background: 'linear-gradient(to bottom, #1f2937, #111827)',
            color: '#ffffff',
            border: '1px solid #4FC3F7',
            borderRadius: '4px',
            fontSize: '0.85em',
            fontWeight: 'normal',
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
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
          View Detailed Fuel Breakdown
        </button>
      
      {/* 🛩️ VFR OPERATIONS: Waive Alternates Checkbox */}
      <label className="waive-alternates-container" style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.8)',
        cursor: 'pointer',
        padding: '4px 0'
      }}>
        <input
          type="checkbox"
          checked={waiveAlternates}
          onChange={handleWaiveAlternatesChange}
          style={{
            width: '14px',
            height: '14px',
            marginRight: '6px',
            cursor: 'pointer'
          }}
        />
        ☑️ Waive Alternates (VFR Day Flying)
      </label>
      
      {/* COMMENTED OUT DEBUG INFO TO FIX "isReady/isLoading is not defined" ERROR - WILL REVIEW LATER */}
      {/* Debug info in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem' }}>
          Manager Ready: {isReady ? '✅' : '❌'} | 
          Cards: {displayStopCards.length} | 
          Loading: {isLoading ? '⏳' : '✅'}
        </div>
      )} */}
      
      <div className="stop-cards-container" style={{ marginTop: '0', paddingTop: '0' }}>
        <div className="stop-cards-stack">
          {displayStopCards.map((card, index) => {
            const cardId = `stop-${card.id}`;
            
            
            // 🛩️ DEBUG: Log card and index info for refuel debugging
            if (index < 5) { // Only log first few to avoid spam
              console.log(`🛩️ CARD DEBUG: index=${index}, card.index=${card.index}, isDeparture=${card.isDeparture}, isDestination=${card.isDestination}, refuelStops=${JSON.stringify(refuelStops)}`);
            }
            
            return (
              <StopCard
                key={`main-stop-${index}`}
                id={cardId}
                index={card.index}
                stopName={card.stopName}
                totalDistance={card.totalDistance}
                totalTime={card.totalTime}
                totalFuel={card.totalFuel}
                maxPassengers={card.maxPassengers}
                maxPassengersDisplay={card.maxPassengersDisplay}
                groundSpeed={card.groundSpeed}
                headwind={card.headwind}
                deckTime={card.deckTime}
                isDeparture={card.isDeparture}
                isDestination={card.isDestination}
                fuelComponents={card.fuelComponents}
                isActive={index === activeCardIndex}
                onClick={() => handleCardClick(index)}
                className="unified-fuel-card"
                // Refuel props - use card.index not array index
                isRefuelStop={refuelStops.includes(card.index)}
                onRefuelChange={(cardIndex, isRefuel) => handleRefuelChange(card.index, isRefuel)}
                // Alternate fuel requirements for IFR display
                alternateRequirements={card.alternateRequirements}
                shouldShowStrikethrough={card.shouldShowStrikethrough}
              />
            );
          })}
          
          {/* Render alternate stop card if available */}
          {alternateStopCard && (
            <StopCard
              key="alternate-stop-card"
              id="alternate-stop-card"
              index={alternateStopCard.index}
              stopName={alternateStopCard.stopName}
              totalDistance={alternateStopCard.totalDistance}
              totalTime={alternateStopCard.totalTime}
              totalFuel={alternateStopCard.totalFuel}
              maxPassengers={alternateStopCard.maxPassengers}
              maxPassengersDisplay={alternateStopCard.maxPassengersDisplay}
              groundSpeed={alternateStopCard.groundSpeed}
              headwind={alternateStopCard.headwind}
              deckTime={alternateStopCard.deckTime}
              isDeparture={alternateStopCard.isDeparture}
              isDestination={alternateStopCard.isDestination}
              isAlternate={alternateStopCard.isAlternate}
              routeDescription={alternateStopCard.routeDescription}
              fuelComponents={alternateStopCard.fuelComponents}
              isActive={false}
              onClick={() => {}}
              className="alternate-card unified-fuel-card"
            />
          )}
        </div>
        
        {/* Save Flight Button - Only show if aircraft and waypoints are available */}
        {selectedAircraft && waypoints && waypoints.length >= 2 && (
          <div style={{ marginTop: '12px', padding: '0 10px' }}>
            <button 
              onClick={handleSaveFlightSettings}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'linear-gradient(to bottom, #1f2937, #111827)',
                color: 'white',
                border: '1px solid #4FC3F7',
                borderRadius: '4px',
                fontSize: '0.85em',
                fontWeight: 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
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
            <div style={{ 
              fontSize: '11px', 
              color: '#9ca3af', 
              marginTop: '5px',
              textAlign: 'center'
            }}>
              Save complete flight with current fuel stops and settings
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default EnhancedStopCardsContainer;