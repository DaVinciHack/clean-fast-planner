import React, { useState, useEffect, useRef } from 'react';
import StopCard from './StopCard';
// Import statement removed; we'll access WindCalculations from the window

/**
 * StopCardsContainer Component
 * 
 * Manages and displays a collection of StopCard components
 * based on the current route waypoints with smooth reordering animations
 * Includes wind calculations for more accurate timing and fuel estimates
 */
const StopCardsContainer = ({
  waypoints = [],
  routeStats = null,
  selectedAircraft = null,
  passengerWeight = 220,
  reserveFuel = 600,
  deckTimePerStop = 5,
  deckFuelFlow = 400,
  weather = { windSpeed: 0, windDirection: 0 } // Default to no wind
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
    
    // Add debug logging for weather data
    console.log('StopCardsContainer: Processing with weather data:', weather);
    
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
    // If no aircraft is selected, we'll show zeros
    if (!selectedAircraft) {
      console.log('StopCardsContainer: No aircraft selected, setting empty stop cards');
      setStopCards([]);
      return;
    }
    
    // Check if aircraft has all required properties
    if (!selectedAircraft.cruiseSpeed || !selectedAircraft.fuelBurn) {
      console.log('StopCardsContainer: Aircraft missing required properties, setting empty stop cards');
      setStopCards([]);
      return;
    }
    
    const aircraft = selectedAircraft;
    
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
      
      // Calculate leg timing and fuel with wind adjustments
      let legTimeHours = 0;
      let legFuel = 0;
      let legGroundSpeed = aircraft.cruiseSpeed;
      let headwindComponent = 0;
      
      // Check if we have coordinates - either as separate lat/lon or as coords array
      const fromHasCoords = (fromWaypoint.lat && fromWaypoint.lon) || 
                           (fromWaypoint.coords && fromWaypoint.coords.length === 2);
      const toHasCoords = (toWaypoint.lat && toWaypoint.lon) || 
                         (toWaypoint.coords && toWaypoint.coords.length === 2);
      
      if (fromHasCoords && toHasCoords) {
        // Create lat/lon objects from either format
        const fromCoords = {
          lat: fromWaypoint.lat || fromWaypoint.coords[1],
          lon: fromWaypoint.lon || fromWaypoint.coords[0]
        };
        
        const toCoords = {
          lat: toWaypoint.lat || toWaypoint.coords[1],
          lon: toWaypoint.lon || toWaypoint.coords[0]
        };
        
        // Use wind calculations if we have full coordinates
        let legDetails;
        if (window.WindCalculations) {
          legDetails = window.WindCalculations.calculateLegWithWind(
            fromCoords,
            toCoords,
            legDistance,
            aircraft,
            weather
          );
        } else {
          // Fallback calculation if WindCalculations isn't available
          const time = legDistance / aircraft.cruiseSpeed;
          const fuel = time * aircraft.fuelBurn;
          legDetails = {
            time,
            fuel,
            groundSpeed: aircraft.cruiseSpeed,
            headwindComponent: 0,
            course: 0
          };
          console.warn('WindCalculations not available, using basic calculations');
        }
        
        legTimeHours = legDetails.time;
        legFuel = Math.round(legDetails.fuel);
        legGroundSpeed = Math.round(legDetails.groundSpeed);
        headwindComponent = Math.round(legDetails.headwindComponent);
      } else {
        // Fall back to simple calculation without wind
        legTimeHours = legDistance / aircraft.cruiseSpeed;
        legFuel = Math.round(legTimeHours * aircraft.fuelBurn);
      }
      
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
        isNew: prevWaypointsRef.current.findIndex(wp => wp.id === toWaypoint.id) === -1,
        groundSpeed: legGroundSpeed,
        headwind: headwindComponent
      });
    }
    
    // Update cards state
    setStopCards(cards);
    
    // Update previous waypoints
    prevWaypointsRef.current = [...waypoints];
  }, [waypoints, routeStats, selectedAircraft, passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, weather]);
  
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
    <div className="route-stops" style={{ marginTop: '0' }}>
      <h4 className="route-stops-title" style={{ margin: '0 0 8px 0', fontSize: '0.95em' }}>ROUTE STOPS</h4>
      
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
                totalDistance={card.totalDistance}
                totalTime={card.totalTime}
                totalFuel={card.totalFuel}
                maxPassengers={card.maxPassengers}
                groundSpeed={card.groundSpeed}
                headwind={card.headwind}
                deckTime={card.deckTime}
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