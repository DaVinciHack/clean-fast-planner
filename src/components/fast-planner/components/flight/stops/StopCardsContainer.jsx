import React, { useState, useEffect, useRef } from 'react';
import StopCard from './StopCard';
import StopCardCalculator from '../../../modules/calculations/flight/StopCardCalculator';

/**
 * StopCardsContainer Component
 * 
 * Manages and displays a collection of StopCard components
 * based on the current route waypoints with smooth reordering animations
 * Fuel requirements and passenger capacity are calculated internally
 * 
 * Note: stopCards prop is accepted but ignored for backward compatibility
 */
const StopCardsContainer = ({
  waypoints = [],
  routeStats = null,
  selectedAircraft = null,
  passengerWeight,  // No default - must be provided
  reserveFuel,      // No default - must be provided
  contingencyFuelPercent, // Fixed parameter name to match StopCardCalculator
  deckTimePerStop,  // No default - must be provided
  deckFuelFlow,     // No default - must be provided 
  taxiFuel,         // No default - must be provided
  weather = { windSpeed: 0, windDirection: 0 }, // Default to no wind
  alternateRouteData = null, // Alternate route data for alternate stop card
  stopCards = [] // Kept for backward compatibility but not used
}) => {
  const [calculatedStopCards, setCalculatedStopCards] = useState([]);
  const [alternateStopCard, setAlternateStopCard] = useState(null);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  const [cardPositions, setCardPositions] = useState({});
  const [animatingCards, setAnimatingCards] = useState({});
  const prevWaypointsRef = useRef([]);
  const cardRefs = useRef({});
  const containerRef = useRef(null);
  
  // Add dedicated useEffect to monitor alternateRouteData changes
  useEffect(() => {
    console.log('🟠 ALTERNATE ROUTE DATA CHANGED:', {
      exists: !!alternateRouteData,
      data: alternateRouteData ? {
        splitPoint: alternateRouteData.splitPoint,
        name: alternateRouteData.name,
        coordinatesLength: alternateRouteData.coordinates?.length || 0
      } : null
    });
  }, [alternateRouteData]);
  
  // Calculate stop cards data whenever relevant inputs change
  useEffect(() => {
    console.log('🔍 StopCardsContainer useEffect triggered with:', {
      waypointsLength: waypoints?.length || 0,
      taxiFuel: taxiFuel, // Using direct taxiFuel value with no transformation
      deckTimePerStop,
      deckFuelFlow,
      reserveFuel,
      contingencyFuelPercent, // Fixed parameter name to match StopCardCalculator
      hasAircraft: !!selectedAircraft,
      hasRouteStats: !!routeStats,
      hasAlternateRouteData: !!alternateRouteData,
      alternateRouteDataDetails: alternateRouteData ? {
        splitPoint: alternateRouteData.splitPoint,
        name: alternateRouteData.name,
        coordinatesLength: alternateRouteData.coordinates?.length || 0
      } : null
    });
    
    if (waypoints.length < 2) {
      setCalculatedStopCards([]);
      prevWaypointsRef.current = [];
      return;
    }
    
    // Add debug logging for weather data
    console.log('StopCardsContainer: Processing with weather data:', weather);
    
    // Store current card positions before update
    const currentPositions = {};
    calculatedStopCards.forEach(card => {
      const cardId = `stop-${card.id || card.index}`;
      const cardElement = document.getElementById(cardId);
      if (cardElement) {
        currentPositions[cardId] = cardElement.getBoundingClientRect();
      }
    });
    
    // If we have positions, store them
    if (Object.keys(currentPositions).length > 0) {
      setCardPositions(currentPositions);
    }
    
    // Get aircraft data for calculations
    // If no aircraft is selected, we'll show zeros
    if (!selectedAircraft) {
      console.log('StopCardsContainer: No aircraft selected, setting empty stop cards');
      setCalculatedStopCards([]);
      return;
    }
    
    // Check if aircraft has all required properties
    if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
      console.log('StopCardsContainer: Aircraft missing required properties, setting empty stop cards');
      setCalculatedStopCards([]);
      return;
    }
    
    // Create numeric parameter object
    const numericParams = {
      passengerWeight: Number(passengerWeight) || 0,
      reserveFuel: Number(reserveFuel) || 0,
      contingencyFuelPercent: Number(contingencyFuelPercent) || 0,
      deckTimePerStop: Number(deckTimePerStop) || 0,
      deckFuelFlow: Number(deckFuelFlow) || 0,
      taxiFuel: Number(taxiFuel) || 0
    };
    
    // Use the StopCardCalculator to calculate the stop cards
    // Log input values to debug
    console.log('🧮 StopCardsContainer calculating with numeric parameters:', numericParams);
    
    const newCards = StopCardCalculator.calculateStopCards(
      waypoints, 
      routeStats, 
      selectedAircraft, 
      weather, 
      numericParams
    );
    
    // Mark new cards
    const updatedCards = newCards.map(card => ({
      ...card,
      isNew: prevWaypointsRef.current.findIndex(wp => wp.id === card.id) === -1
    }));
    
    // Update cards state
    setCalculatedStopCards(updatedCards);
    
    // Update previous waypoints
    prevWaypointsRef.current = [...waypoints];
    
    // IMPORTANT: Make the calculated stop cards available globally
    // This ensures the RouteStatsCard can access the latest stop cards as the single source of truth
    if (updatedCards && updatedCards.length > 0) {
      console.log('⭐ StopCardsContainer: Publishing calculated stop cards as SINGLE SOURCE OF TRUTH');
      
      // Initialize window.currentRouteStats if needed
      if (!window.currentRouteStats) window.currentRouteStats = {};
      
      // IMPORTANT: Update immediately without setTimeout to ensure data is available right away
      try {
        // Deep clone to prevent reference issues
        const sanitizedCards = updatedCards.map(card => {
          // Make a deep copy of the card
          const cleanCard = JSON.parse(JSON.stringify(card));
          
          // Ensure all numerical fields are valid numbers
          if (cleanCard.fuelComponentsObject) {
            Object.keys(cleanCard.fuelComponentsObject).forEach(key => {
              cleanCard.fuelComponentsObject[key] = Number(cleanCard.fuelComponentsObject[key]) || 0;
            });
          } else {
            // Create default fuelComponentsObject if missing
            cleanCard.fuelComponentsObject = {
              tripFuel: 0,
              contingencyFuel: 0,
              taxiFuel: 0,
              deckFuel: 0,
              reserveFuel: 0
            };
            
            // Add extraFuel for destination cards
            if (cleanCard.isDestination) {
              cleanCard.fuelComponentsObject.extraFuel = 0;
            }
          }
          
          // Ensure critical numeric fields
          cleanCard.totalFuel = Number(cleanCard.totalFuel) || 0;
          cleanCard.deckFuel = Number(cleanCard.deckFuel) || 0;
          
          return cleanCard;
        });
        
        window.currentRouteStats.stopCards = sanitizedCards;
        
        // Specifically log the destination card if it exists
        const destinationCard = sanitizedCards.find(card => card.isDestination);
        if (destinationCard) {
          console.log('🔎 DESTINATION CARD VALIDATION:', {
            totalFuel: destinationCard.totalFuel,
            componentSum: Object.values(destinationCard.fuelComponentsObject).reduce((sum, val) => sum + val, 0),
            components: destinationCard.fuelComponentsObject
          });
        }
      } catch (error) {
        console.error('Error sanitizing stop cards:', error);
        window.currentRouteStats.stopCards = [];
      }
      
      // CRITICAL: Extract and publish the departure card fuel information as the authoritative source
      const departureCard = updatedCards.find(card => card.isDeparture);
      if (departureCard) {
        console.log('🔍 Departure card fuel breakdown:', {
          totalFuel: departureCard.totalFuel,
          fuelComponentsObject: departureCard.fuelComponentsObject,
          fuelComponents: departureCard.fuelComponents
        });
        
        // Ensure all fuel component values are valid numbers
        const safeComponents = {
          tripFuel: typeof departureCard.fuelComponentsObject?.tripFuel === 'number' 
            ? departureCard.fuelComponentsObject.tripFuel 
            : Number(departureCard.fuelComponentsObject?.tripFuel) || 0,
            
          contingencyFuel: typeof departureCard.fuelComponentsObject?.contingencyFuel === 'number'
            ? departureCard.fuelComponentsObject.contingencyFuel
            : Number(departureCard.fuelComponentsObject?.contingencyFuel) || 0,
            
          taxiFuel: typeof departureCard.fuelComponentsObject?.taxiFuel === 'number'
            ? departureCard.fuelComponentsObject.taxiFuel
            : Number(departureCard.fuelComponentsObject?.taxiFuel) || 0,
            
          deckFuel: typeof departureCard.deckFuel === 'number'
            ? departureCard.deckFuel
            : Number(departureCard.deckFuel) || 0,
            
          reserveFuel: typeof departureCard.fuelComponentsObject?.reserveFuel === 'number'
            ? departureCard.fuelComponentsObject.reserveFuel
            : Number(departureCard.fuelComponentsObject?.reserveFuel) || 0
        };
        
        // Calculate the sum to verify consistency
        const sum = safeComponents.tripFuel +
                   safeComponents.contingencyFuel +
                   safeComponents.taxiFuel +
                   safeComponents.deckFuel +
                   safeComponents.reserveFuel;
        
        // Create a clean, complete fuel data object from the departure card
        window.currentRouteStats.fuelData = {
          totalFuel: sum, // Always use the calculated sum for consistency
          tripFuel: safeComponents.tripFuel,
          contingencyFuel: safeComponents.contingencyFuel,
          taxiFuel: safeComponents.taxiFuel,
          deckFuel: safeComponents.deckFuel,
          reserveFuel: safeComponents.reserveFuel,
          sum: sum, // Include the sum for verification
          // Include parameters used in calculation for reference/debugging
          calculationParams: {
            passengerWeight: Number(passengerWeight) || 0,
            taxiFuel: Number(taxiFuel) || 0,
            contingencyFuelPercent: Number(contingencyFuelPercent) || 0,
            deckTimePerStop: Number(deckTimePerStop) || 0,
            deckFuelFlow: Number(deckFuelFlow) || 0,
            reserveFuel: Number(reserveFuel) || 0
          }
        };
        
        // Log the published data
        console.log('⛽ Published authoritative fuel data:', window.currentRouteStats.fuelData);
      }
      
      // Also publish the passenger information from all cards
      window.currentRouteStats.passengerData = updatedCards
        .filter(card => !card.isDestination) // Exclude destination cards
        .map(card => ({
          index: card.index,
          id: card.id,
          stopName: card.stopName,
          isDeparture: card.isDeparture,
          maxPassengers: card.maxPassengers,
          maxPassengersDisplay: card.maxPassengersDisplay
        }));
      console.log('👥 Published authoritative passenger data:', window.currentRouteStats.passengerData);
      
      // ENHANCEMENT: Force a route stats update by setting a trigger flag
      // This helps ensure the top card gets updated immediately
      window.currentRouteStats.updateTrigger = Date.now();
      
      // Call any registered update functions with a short delay to ensure data is available
      setTimeout(() => {
        if (typeof window.triggerRouteStatsUpdate === 'function') {
          window.triggerRouteStatsUpdate();
        }
      }, 50);
    }
    
    // Calculate alternate stop card if alternate route data exists
    if (alternateRouteData && selectedAircraft) {
      console.log('🟠 StopCardsContainer: Calculating alternate stop card with data:', {
        splitPoint: alternateRouteData.splitPoint,
        name: alternateRouteData.name,
        coordinatesLength: alternateRouteData.coordinates?.length || 0,
        hasWaypoints: waypoints.length >= 2,
        hasSelectedAircraft: !!selectedAircraft
      });
      
      try {
        const alternateCard = StopCardCalculator.calculateAlternateStopCard(
          waypoints,
          alternateRouteData,
          routeStats,
          selectedAircraft,
          weather,
          numericParams
        );
        
        if (alternateCard) {
          console.log('🟠 StopCardsContainer: Alternate stop card calculated successfully:', {
            totalFuel: alternateCard.totalFuel,
            maxPassengers: alternateCard.maxPassengers,
            routeDescription: alternateCard.routeDescription
          });
          setAlternateStopCard(alternateCard);
          
          // CRITICAL: Trigger route stats update when alternate card changes
          // This ensures the top card gets updated with alternate route data
          window.currentRouteStats.updateTrigger = Date.now();
          setTimeout(() => {
            if (typeof window.triggerRouteStatsUpdate === 'function') {
              console.log('🟠 StopCardsContainer: Triggering route stats update after alternate card calculation');
              window.triggerRouteStatsUpdate();
            }
          }, 100); // Slightly longer delay for alternate cards
        } else {
          console.log('🟠 StopCardsContainer: No alternate stop card generated (calculation returned null)');
          setAlternateStopCard(null);
        }
      } catch (error) {
        console.error('🟠 StopCardsContainer: Error calculating alternate stop card:', error);
        setAlternateStopCard(null);
      }
    } else {
      // Clear alternate stop card if no alternate route data
      const shouldClear = alternateRouteData === null || alternateRouteData === undefined;
      const reason = !alternateRouteData ? 'no alternateRouteData' : 
                     !selectedAircraft ? 'no selectedAircraft' : 
                     'unknown';
      
      console.log('🟠 StopCardsContainer: Clearing alternate stop card -', reason, {
        hasAlternateRouteData: !!alternateRouteData,
        hasSelectedAircraft: !!selectedAircraft,
        shouldClear
      });
      
      if (shouldClear) {
        setAlternateStopCard(null);
        
        // CRITICAL: Also trigger update when clearing alternate card
        // This ensures top card gets updated when alternate route is removed
        setTimeout(() => {
          if (typeof window.triggerRouteStatsUpdate === 'function') {
            console.log('🟠 StopCardsContainer: Triggering route stats update after clearing alternate card');
            window.triggerRouteStatsUpdate();
          }
        }, 50);
      }
    }
  }, [waypoints, routeStats, selectedAircraft, passengerWeight, reserveFuel, contingencyFuelPercent, deckTimePerStop, deckFuelFlow, taxiFuel, weather, alternateRouteData]);
  
  // Apply FLIP animation after cards update
  useEffect(() => {
    if (Object.keys(cardPositions).length === 0 || calculatedStopCards.length === 0) {
      return;
    }
    
    // Calculate final positions and prepare animations
    requestAnimationFrame(() => {
      const newAnimating = {};
      
      calculatedStopCards.forEach(card => {
        const cardId = `stop-${card.id}`;
        const cardElement = document.getElementById(cardId);
        
        if (cardElement && cardPositions[cardId]) {
          // Get the old and new positions
          const oldPos = cardPositions[cardId];
          const newPos = cardElement.getBoundingClientRect();
          
          // Calculate the difference
          const deltaY = oldPos.top - newPos.top;
          
          // If there's a significant change, animate it
          if (Math.abs(deltaY) > 5) {
            // Set the initial position
            cardElement.style.transform = `translateY(${deltaY}px)`;
            cardElement.style.transition = 'none';
            
            // Force reflow
            cardElement.offsetHeight;
            
            // Add moving class and set transition back
            cardElement.classList.add('moving');
            cardElement.style.transform = '';
            cardElement.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
            
            // Track which cards are animating
            newAnimating[cardId] = true;
            
            // Clean up after animation
            setTimeout(() => {
              if (cardElement) {
                cardElement.classList.remove('moving');
                setAnimatingCards(prev => {
                  const updated = {...prev};
                  delete updated[cardId];
                  return updated;
                });
              }
            }, 500);
          }
        }
      });
      
      if (Object.keys(newAnimating).length > 0) {
        setAnimatingCards(newAnimating);
      }
      
      // Clear stored positions
      setCardPositions({});
    });
  }, [calculatedStopCards, cardPositions]);
  
  // Handle card click
  const handleCardClick = (index) => {
    setActiveCardIndex(index === activeCardIndex ? null : index);
  };
  
  // Save reference to card element
  const setCardRef = (id, el) => {
    if (el) {
      cardRefs.current[id] = el;
    }
  };
  
  // If there are no cards, don't render anything
  if (calculatedStopCards.length === 0) {
    return null;
  }
  
  return (
    <div className="route-stops" style={{ margin: '0', padding: '4px 10px' }}>
      <h4 className="route-stops-title" style={{ margin: '0 0 4px 0', fontSize: '0.9em' }}>ROUTE STOPS</h4>
      
      <div className="stop-cards-container" style={{ marginTop: '0', paddingTop: '0' }}>
        <div className="stop-cards-stack" ref={containerRef}>
          {calculatedStopCards.map((card, index) => {
            const cardId = `stop-${card.id}`;
            let className = '';
            
            if (card.isNew) {
              className = 'new-card';
            } else if (animatingCards[cardId]) {
              className = 'moving';
            }
            
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
                className={className}
                ref={el => setCardRef(cardId, el)}
              />
            );
          })}
          
          {/* Render alternate stop card at the end if it exists */}
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
              isActive={false} // Alternate cards don't participate in active state
              onClick={() => {}} // No click handler for alternate cards
              className="alternate-card"
              ref={el => setCardRef('alternate-stop-card', el)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default StopCardsContainer;