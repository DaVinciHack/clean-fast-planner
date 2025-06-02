import React, { useState, useEffect, useRef } from 'react';
import StopCard from './StopCard';
import useMasterFuelManager from '../../../hooks/useMasterFuelManager.js';

/**
 * Enhanced StopCardsContainer with MasterFuelManager Integration
 * 
 * PHASE 2: Integration with MasterFuelManager
 * - Subscribes to unified fuel calculations
 * - Eliminates race conditions
 * - Single source of truth for all fuel data
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
  fuelPolicy = null, // NEW: Fuel policy from parent
  weatherSegments = null, // NEW: Weather segments for ARA/approach fuel
  stopCards = [] // Legacy prop - will be ignored
}) => {
  console.log('🎯 EnhancedStopCardsContainer: Component mounted/rendered with MasterFuelManager');
  console.log('🔍 EnhancedStopCardsContainer: Props received:', {
    waypoints: waypoints?.length || 0,
    hasAircraft: !!selectedAircraft,
    hasPolicy: !!fuelPolicy,
    hasWeather: !!weather
  });
  
  
  // Use MasterFuelManager instead of direct calculations
  const {
    calculations,
    isLoading,
    updatePolicy,
    updateWeather,
    updateWeatherSegments,
    updateWaypoints,
    updateAircraft,
    applyOverrides,
    isReady
  } = useMasterFuelManager();
  
  console.log('🔍 EnhancedStopCardsContainer: Hook state:', {
    isLoading,
    isReady,
    hasCalculations: !!calculations,
    calculationsType: calculations ? typeof calculations : 'none'
  });
  
  const [displayStopCards, setDisplayStopCards] = useState([]);
  const [alternateStopCard, setAlternateStopCard] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  
  // Update MasterFuelManager when inputs change
  useEffect(() => {
    console.log('🏛️ EnhancedStopCardsContainer: Fuel policy update attempted:', {
      hasFuelPolicy: !!fuelPolicy,
      fuelPolicyType: typeof fuelPolicy,
      fuelPolicyValue: fuelPolicy
    });
    if (fuelPolicy) {
      console.log('🏛️ EnhancedStopCardsContainer: Updating fuel policy in manager');
      updatePolicy(fuelPolicy);
    } else {
      console.log('⚠️ EnhancedStopCardsContainer: No fuel policy provided, cannot update manager');
    }
  }, [fuelPolicy, updatePolicy]);
  
  useEffect(() => {
    if (weather) {
      console.log('🌬️ EnhancedStopCardsContainer: Updating weather in manager', weather);
      updateWeather(weather);
    } else {
      console.log('⚠️ EnhancedStopCardsContainer: No weather provided', weather);
    }
  }, [weather, updateWeather]);
  
  useEffect(() => {
    if (weatherSegments) {
      console.log('🌩️ EnhancedStopCardsContainer: Updating weather segments in manager');
      updateWeatherSegments(weatherSegments);
    }
  }, [weatherSegments, updateWeatherSegments]);
  
  useEffect(() => {
    if (waypoints && waypoints.length >= 2) {
      console.log('🗺️ EnhancedStopCardsContainer: Updating waypoints in manager');
      updateWaypoints(waypoints);
    }
  }, [waypoints, updateWaypoints]);
  
  useEffect(() => {
    if (selectedAircraft) {
      console.log('✈️ EnhancedStopCardsContainer: Updating aircraft in manager');
      updateAircraft(selectedAircraft);
    }
  }, [selectedAircraft, updateAircraft]);
  
  // Apply user overrides to manager
  useEffect(() => {
    const overrides = {
      passengerWeight: Number(passengerWeight) || 220, // ✅ User input - safe default
      // ✅ AVIATION SAFETY FIX: Respect 0 as valid OSDK policy value
      taxiFuel: taxiFuel !== undefined ? Number(taxiFuel) : 9999,
      // ❌ REMOVED: contingencyFuelPercent - This is POLICY data, not user override!
      reserveFuel: reserveFuel !== undefined ? Number(reserveFuel) : 9999,
      deckTime: deckTimePerStop !== undefined ? Number(deckTimePerStop) : 9999,
      deckFuelFlow: deckFuelFlow !== undefined ? Number(deckFuelFlow) : 9999
    };
    
    console.log('⚙️ EnhancedStopCardsContainer: Applying user overrides to manager:', overrides);
    applyOverrides(overrides);
  }, [passengerWeight, taxiFuel, reserveFuel, deckTimePerStop, deckFuelFlow, applyOverrides]);
  
  // Update display when calculations change
  useEffect(() => {
    if (calculations && calculations.stopCards) {
      console.log('📊 EnhancedStopCardsContainer: Received calculations from MasterFuelManager');
      setDisplayStopCards(calculations.stopCards);
    }
  }, [calculations]);
  
  // Handle card click
  const handleCardClick = (index) => {
    setActiveCardIndex(index === activeCardIndex ? null : index);
  };
  
  // Show loading state only if explicitly loading
  if (isLoading && displayStopCards.length === 0) {
    console.log('🔄 EnhancedStopCardsContainer: Showing loading state');
    return (
      <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
        <h4 className="route-stops-title">ROUTE STOPS (UNIFIED FUEL)</h4>
        <div className="loading-message">
          ⏳ Calculating unified fuel requirements...
        </div>
      </div>
    );
  }
  
  // Show waiting state only if not ready AND no existing cards
  if (!isReady && displayStopCards.length === 0) {
    console.log('⏸️ EnhancedStopCardsContainer: Showing waiting state - not ready');
    return (
      <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
        <h4 className="route-stops-title">ROUTE STOPS (UNIFIED FUEL)</h4>
        <div className="waiting-message">
          📋 Waiting for fuel policy, aircraft, and route data...
        </div>
      </div>
    );
  }
  
  // If no cards AND not ready, show nothing (no ugly fallback)
  if (displayStopCards.length === 0) {
    return null;
  }
  
  return (
    <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
      <h4 className="route-stops-title" style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>
        ROUTE STOPS (UNIFIED FUEL)
      </h4>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem' }}>
          Manager Ready: {isReady ? '✅' : '❌'} | 
          Cards: {displayStopCards.length} | 
          Loading: {isLoading ? '⏳' : '✅'}
        </div>
      )}
      
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