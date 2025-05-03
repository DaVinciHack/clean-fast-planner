import React, { useState, useEffect, useRef } from 'react';
import StopCard from './StopCard';

/**
 * StopCardsContainer Component
 * 
 * Manages and displays a collection of StopCard components
 * based on the current route waypoints with smooth reordering animations
 */
const StopCardsContainer = ({
  waypoints = [],
  routeStats = null,
  selectedAircraft = null,
  passengerWeight = 220,
  reserveFuel = 600,
  deckTimePerStop = 5,
  deckFuelFlow = 400
}) => {
  const [stopCards, setStopCards] = useState([]);
  const [activeCardIndex, setActiveCardIndex] = useState(null);
  const [cardPositions, setCardPositions] = useState({});
  const [animatingCards, setAnimatingCards] = useState({});
  const prevWaypointsRef = useRef([]);
  const cardRefs = useRef({});
  const containerRef = useRef(null);
  
  // Calculate stop cards data whenever relevant inputs change
  useEffect(() => {
    if (waypoints.length < 2) {
      setStopCards([]);
      prevWaypointsRef.current = [];
      return;
    }
    
    // Store current card positions before update
    const currentPositions = {};
    stopCards.forEach(card => {
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
    
    // Create data for each stop
    const cards = [];
    let cumulativeDistance = 0;
    let cumulativeTime = 0;
    let cumulativeFuel = 0;
    
    // Get aircraft data for calculations
    const aircraft = selectedAircraft || {
      // Default values if no aircraft selected
      cruiseSpeed: 145,
      fuelBurn: 1100,
      maxPassengers: 19
    };
    
    // Add taxi fuel to the total
    const taxiFuel = 50; // Default value
    cumulativeFuel += taxiFuel;
    
    // Add reserve fuel to the total
    cumulativeFuel += reserveFuel;
    
    // For each leg (between waypoints)
    for (let i = 0; i < waypoints.length - 1; i++) {
      const fromWaypoint = waypoints[i];
      const toWaypoint = waypoints[i + 1];
      
      // Create a unique ID for this stop
      const stopId = toWaypoint.id || `waypoint-${i}`;
      
      // Get leg distance from routeStats if available
      let legDistance = 0;
      if (routeStats && routeStats.legs && routeStats.legs[i]) {
        legDistance = parseFloat(routeStats.legs[i].distance);
      }
      
      // Calculate leg time based on aircraft speed
      const legTimeHours = legDistance / aircraft.cruiseSpeed;
      
      // Calculate leg fuel based on burn rate
      const legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
      
      // Update cumulative values
      cumulativeDistance += legDistance;
      cumulativeTime += legTimeHours;
      cumulativeFuel += legFuel;
      
      // Add deck time and fuel for all stops except the final destination
      if (i < waypoints.length - 2) {
        const deckTimeHours = deckTimePerStop / 60; // Convert minutes to hours
        const deckFuel = Math.round(deckTimeHours * deckFuelFlow);
        
        cumulativeTime += deckTimeHours;
        cumulativeFuel += deckFuel;
      }
      
      // Calculate max passengers based on remaining load
      let maxPassengers = 0;
      if (selectedAircraft) {
        const usableLoad = Math.max(
          0, 
          selectedAircraft.maxTakeoffWeight - 
          selectedAircraft.emptyWeight - 
          cumulativeFuel
        );
        maxPassengers = Math.floor(usableLoad / passengerWeight);
        
        // Ensure we don't exceed aircraft capacity
        maxPassengers = Math.min(maxPassengers, selectedAircraft.maxPassengers || 19);
      }
      
      // Create the card data
      cards.push({
        index: i,
        id: stopId,
        stopName: toWaypoint.name,
        legDistance: legDistance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: legTimeHours,
        totalTime: cumulativeTime,
        legFuel: legFuel,
        totalFuel: cumulativeFuel,
        maxPassengers: maxPassengers,
        isNew: prevWaypointsRef.current.findIndex(wp => wp.id === toWaypoint.id) === -1
      });
    }
    
    // Update cards state
    setStopCards(cards);
    
    // Update previous waypoints
    prevWaypointsRef.current = [...waypoints];
  }, [waypoints, routeStats, selectedAircraft, passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow]);
  
  // Apply FLIP animation after cards update
  useEffect(() => {
    if (Object.keys(cardPositions).length === 0 || stopCards.length === 0) {
      return;
    }
    
    // Calculate final positions and prepare animations
    requestAnimationFrame(() => {
      const newAnimating = {};
      
      stopCards.forEach(card => {
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
  }, [stopCards, cardPositions]);
  
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
  if (stopCards.length === 0) {
    return null;
  }
  
  return (
    <div className="route-stops">
      <h4 className="route-stops-title">ROUTE STOPS</h4>
      
      <div className="stop-cards-container">
        <div className="stop-cards-stack" ref={containerRef}>
          {stopCards.map((card, index) => {
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
                legDistance={card.legDistance}
                totalDistance={card.totalDistance}
                legTime={card.legTime}
                totalTime={card.totalTime}
                legFuel={card.legFuel}
                totalFuel={card.totalFuel}
                maxPassengers={card.maxPassengers}
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