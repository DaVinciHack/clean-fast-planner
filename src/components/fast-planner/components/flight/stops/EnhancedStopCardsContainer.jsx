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
  stopCards = [] // Legacy prop - will be ignored
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
  
  // 🎯 ONE SOURCE OF TRUTH: Calculate stop cards directly with StopCardCalculator
  useEffect(() => {
    if (waypoints && waypoints.length >= 2 && selectedAircraft && fuelPolicy) {
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
          weatherSegments
        );
        
        if (calculatedStopCards && calculatedStopCards.length > 0) {
          console.log(`🎯 EnhancedStopCardsContainer: Generated ${calculatedStopCards.length} stop cards with weather fuel`);
          setDisplayStopCards(calculatedStopCards);
        }
      } catch (error) {
        console.error('🎯 EnhancedStopCardsContainer: Error calculating stop cards:', error);
        setDisplayStopCards([]);
      }
    } else {
      console.log('🎯 EnhancedStopCardsContainer: Missing required data for stop card calculation');
      setDisplayStopCards([]);
    }
  }, [waypoints, routeStats, selectedAircraft, weather, fuelPolicy, passengerWeight, cargoWeight, contingencyFuelPercent, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, extraFuel, araFuel, approachFuel]);
  
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
      hasFuelPolicy: !!fuelPolicy
    });
    
    // Only calculate if we have the necessary data
    if (alternateRouteData && selectedAircraft && waypoints.length >= 2 && weather) {
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
        const numericParams = {
          passengerWeight: Number(passengerWeight) || 220,
          cargoWeight: Number(cargoWeight) || 0, // 🟠 ADDED: Missing cargoWeight parameter
          reserveFuel: Number(reserveFuel) || 0,
          contingencyFuelPercent: Number(contingencyFuelPercent) || 0,
          deckTimePerStop: Number(deckTimePerStop) || 0,
          deckFuelFlow: Number(deckFuelFlow) || 0,
          taxiFuel: Number(taxiFuel) || 0,
          extraFuel: Number(extraFuel) || 0,  // 🔧 ADDED: Missing extraFuel parameter
          araFuel: Number(araFuel) || 0,      // 🔧 ADDED: ARA fuel from weather
          approachFuel: Number(approachFuel) || 0,  // 🔧 ADDED: Approach fuel from weather
          fuelPolicy: fuelPolicy?.currentPolicy  // 🔧 CRITICAL: Add fuel policy for reserve fuel conversion
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
          setAlternateStopCard(alternateCard);
        } else {
          console.log('🟠 EnhancedStopCardsContainer: No alternate stop card generated (calculation returned null)');
          setAlternateStopCard(null);
        }
        
      } catch (error) {
        console.error('🟠 EnhancedStopCardsContainer: Error calculating alternate stop card:', error);
        setAlternateStopCard(null);
      }
      
    } else {
      // Clear alternate card if conditions not met
      console.log('🟠 EnhancedStopCardsContainer: Clearing alternate card - missing required data:', {
        hasAlternateRouteData: !!alternateRouteData,
        hasSelectedAircraft: !!selectedAircraft,
        waypointCount: waypoints.length,
        hasWeather: !!weather
      });
      setAlternateStopCard(null);
    }
  }, [alternateRouteData, selectedAircraft, waypoints, weather, routeStats, passengerWeight, cargoWeight, reserveFuel, contingencyFuelPercent, deckTimePerStop, deckFuelFlow, taxiFuel, extraFuel, araFuel, approachFuel, fuelPolicy]);
  
  // Handle card click
  const handleCardClick = (index) => {
    setActiveCardIndex(index === activeCardIndex ? null : index);
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
    <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
      <h4 className="route-stops-title" style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>
        ROUTE STOPS (UNIFIED FUEL)
      </h4>
      
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
      </div>
    </div>
  );
};

export default EnhancedStopCardsContainer;