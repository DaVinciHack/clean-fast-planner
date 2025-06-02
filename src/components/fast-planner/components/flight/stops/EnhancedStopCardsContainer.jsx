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
  reserveFuel,
  contingencyFuelPercent,
  deckTimePerStop,
  deckFuelFlow,
  taxiFuel,
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
    hasWeather: !!weather
  });
  
  // State for displaying stop cards
  const [displayStopCards, setDisplayStopCards] = useState([]);
  const [alternateStopCard, setAlternateStopCard] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  
  // Calculate stop cards directly when inputs change - SINGLE SOURCE OF TRUTH
  useEffect(() => {
    if (waypoints.length >= 2 && selectedAircraft) {
      console.log('🎯 EnhancedStopCardsContainer: Calculating stop cards with StopCardCalculator directly');
      
      const calculatedCards = StopCardCalculator.calculateStopCards(
        waypoints,
        routeStats,
        selectedAircraft,
        weather,
        {
          passengerWeight,
          taxiFuel,
          reserveFuel,
          contingencyFuelPercent,
          deckTimePerStop,
          deckFuelFlow,
          fuelPolicy // Pass fuel policy for reserve fuel time conversion
        }
      );
      
      if (calculatedCards && calculatedCards.length > 0) {
        console.log('📊 EnhancedStopCardsContainer: Calculated', calculatedCards.length, 'stop cards');
        setDisplayStopCards(calculatedCards);
      } else {
        setDisplayStopCards([]);
      }
    } else {
      console.log('⚠️ EnhancedStopCardsContainer: Insufficient data for calculation');
      setDisplayStopCards([]);
    }
  }, [waypoints, routeStats, selectedAircraft, weather, passengerWeight, taxiFuel, reserveFuel, contingencyFuelPercent, deckTimePerStop, deckFuelFlow, fuelPolicy]);
  
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
                key={cardId}
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