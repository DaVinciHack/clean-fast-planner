import React, { useState, useEffect } from 'react';
import StopCard from './StopCard';

/**
 * StopCardsContainer Component
 * 
 * Manages and displays a collection of StopCard components
 * based on the current route waypoints
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
  
  // Calculate stop cards data whenever relevant inputs change
  useEffect(() => {
    if (waypoints.length < 2) {
      setStopCards([]);
      return;
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
        stopName: toWaypoint.name,
        legDistance: legDistance.toFixed(1),
        totalDistance: cumulativeDistance.toFixed(1),
        legTime: legTimeHours,
        totalTime: cumulativeTime,
        legFuel: legFuel,
        totalFuel: cumulativeFuel,
        maxPassengers: maxPassengers
      });
    }
    
    setStopCards(cards);
  }, [waypoints, routeStats, selectedAircraft, passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow]);
  
  // Handle card click
  const handleCardClick = (index) => {
    setActiveCardIndex(index === activeCardIndex ? null : index);
  };
  
  // If there are no cards, don't render anything
  if (stopCards.length === 0) {
    return null;
  }
  
  return (
    <div className="stop-cards-container">
      <div className="stop-cards-header">
        <h4>Route Stops</h4>
      </div>
      
      <div className="stop-cards-scroll">
        {stopCards.map((card, index) => (
          <StopCard
            key={`stop-${index}`}
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
          />
        ))}
      </div>
    </div>
  );
};

export default StopCardsContainer;