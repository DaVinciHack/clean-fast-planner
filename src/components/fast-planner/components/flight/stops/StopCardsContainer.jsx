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
  passengerWeight = 220,
  reserveFuel = 500,
  contingencyPercent = 10,
  deckTimePerStop = 5,
  deckFuelFlow = 400,
  taxiFuel = 100,
  weather = { windSpeed: 0, windDirection: 0 }, // Default to no wind
  stopCards = [] // Kept for backward compatibility but not used
}) => {
  const [calculatedStopCards, setCalculatedStopCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  const [cardPositions, setCardPositions] = useState({});
  const [animatingCards, setAnimatingCards] = useState({});
  const prevWaypointsRef = useRef([]);
  const cardRefs = useRef({});
  const containerRef = useRef(null);
  
  // Calculate stop cards data whenever relevant inputs change
  useEffect(() => {
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
    
    // Use the StopCardCalculator to calculate the stop cards
    const newCards = StopCardCalculator.calculateStopCards(
      waypoints, 
      routeStats, 
      selectedAircraft, 
      weather, 
      {
        passengerWeight,
        reserveFuel,
        contingencyFuelPercent: contingencyPercent,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel
      }
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
  }, [waypoints, routeStats, selectedAircraft, passengerWeight, reserveFuel, contingencyPercent, deckTimePerStop, deckFuelFlow, taxiFuel, weather]);
  
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
        </div>
      </div>
    </div>
  );
};

export default StopCardsContainer;