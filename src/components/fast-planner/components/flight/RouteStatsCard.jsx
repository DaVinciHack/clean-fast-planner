import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import LoadingIndicator from '../../modules/LoadingIndicator';
import { EnhancedFuelDisplay } from '../fuel';

/**
 * Route Statistics Card Component - DISPLAY ONLY
 * 
 * This component ONLY displays data calculated by StopCardCalculator.
 * It performs NO calculations of its own to ensure consistency.
 * All fuel, time, and passenger calculations are done in StopCardCalculator.js
 * 
 * CRITICAL: This component should never do its own calculations!
 */
const RouteStatsCard = ({ 
  selectedAircraft, 
  waypoints = [],
  weather = { windSpeed: 0, windDirection: 0 },
  // The ONLY source of data - calculated by StopCardsContainer
  stopCards = []
}) => {
  const [forceRerender, setForceRerender] = useState(0);
  
  // Setup update listener to force refresh when calculations change
  useEffect(() => {
    window.triggerRouteStatsUpdate = () => {
      console.log('🔄 RouteStatsCard: Update triggered by StopCardsContainer');
      setForceRerender(prev => prev + 1);
    };
    
    return () => {
      window.triggerRouteStatsUpdate = undefined;
    };
  }, []);
  
  /**
   * Extract display data from stopCards - NO CALCULATIONS HERE
   * This is purely extracting pre-calculated values
   */
  const getDisplayData = () => {
    if (!stopCards || stopCards.length === 0) {
      return {
        totalDistance: '0.0',
        flightTime: '00:00',
        totalTime: '00:00',
        totalFuel: 0,
        tripFuel: 0,
        deckFuel: 0,
        passengers: '0',
        windDisplay: 'No wind data'
      };
    }
    
    // Find key cards
    const departureCard = stopCards.find(card => card.isDeparture);
    const destinationCard = stopCards.find(card => card.isDestination);
    
    if (!departureCard || !destinationCard) {
      console.warn('⚠️ RouteStatsCard: Missing departure or destination card');
      return {
        totalDistance: '0.0',
        flightTime: '00:00', 
        totalTime: '00:00',
        totalFuel: 0,
        tripFuel: 0,
        deckFuel: 0,
        passengers: '0',
        windDisplay: 'Missing card data'
      };
    }
    
    // Extract pre-calculated values (NO calculations here!)
    const totalDistance = destinationCard.totalDistance || '0.0';
    const flightTime = destinationCard.flightTime || '00:00';
    const totalTime = destinationCard.totalTime || '00:00';
    
    // Extract fuel data from departure card
    const totalFuel = Number(departureCard.totalFuel) || 0;
    const tripFuel = Number(departureCard.tripFuel) || 0;
    const deckFuel = Number(departureCard.deckFuel) || 0;
    
    // Extract passenger data
    const passengers = departureCard.maxPassengers || 0;
    
    // Extract wind information
    let windDisplay = 'No wind';
    if (departureCard.windInfo) {
      windDisplay = departureCard.windInfo;
    } else if (weather.windSpeed > 0) {
      windDisplay = `${weather.windDirection}°/${weather.windSpeed}kt`;
    }
    
    console.log('📊 RouteStatsCard displaying pre-calculated values:', {
      totalDistance,
      flightTime,
      totalTime,
      totalFuel,
      tripFuel,
      deckFuel,
      passengers,
      windDisplay
    });
    
    return {
      totalDistance,
      flightTime,
      totalTime,
      totalFuel,
      tripFuel,
      deckFuel,
      passengers: passengers.toString(),
      windDisplay
    };
  };
  
  // Get the display data
  const displayData = getDisplayData();
  
  // Show loading if no aircraft selected
  if (!selectedAircraft) {
    return (
      <div className="route-stats-card">
        <div className="stats-header">
          <h3>Route Statistics</h3>
          <div className="aircraft-info">No Aircraft Selected</div>
        </div>
        <div className="stats-content">
          <LoadingIndicator message="Select an aircraft to see route statistics" />
        </div>
      </div>
    );
  }
  
  // Show loading if no stop cards data
  if (!stopCards || stopCards.length === 0) {
    return (
      <div className="route-stats-card">
        <div className="stats-header">
          <h3>Route Statistics</h3>
          <div className="aircraft-info">{selectedAircraft.tailNumber}</div>
        </div>
        <div className="stats-content">
          <LoadingIndicator message="Calculating route data..." />
        </div>
      </div>
    );
  }
  
  return (
    <div className="route-stats-card">
      <div className="stats-header">
        <h3>Route Statistics</h3>
        <div className="aircraft-info">
          {selectedAircraft.tailNumber} ({selectedAircraft.model})
        </div>
      </div>
      
      <div className="stats-content">
        {/* Distance and Time Row */}
        <div className="stats-row">
          <div className="stat-item">
            <div className="stat-label">DISTANCE</div>
            <div className="stat-value">{displayData.totalDistance} NM</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">TOTAL TIME</div>
            <div className="stat-value">{displayData.totalTime}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">TOTAL FUEL</div>
            <div className="stat-value">{displayData.totalFuel} lbs</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">PASSENGERS</div>
            <div className="stat-value">
              <span className="passenger-icon">👥</span> {displayData.passengers}
            </div>
          </div>
        </div>
        
        {/* Fuel Breakdown Row */}
        <div className="stats-row fuel-details">
          <div className="stat-item">
            <div className="stat-label">TRIP FUEL</div>
            <div className="stat-value">{displayData.tripFuel} lbs</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">DECK FUEL</div>
            <div className="stat-value">{displayData.deckFuel} lbs</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">FLIGHT TIME</div>
            <div className="stat-value">{displayData.flightTime}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">WIND</div>
            <div className="stat-value wind-info">{displayData.windDisplay}</div>
          </div>
        </div>
        
        {/* Enhanced Fuel Display */}
        <div className="enhanced-fuel-section">
          <EnhancedFuelDisplay 
            fuelData={{
              totalFuel: displayData.totalFuel,
              tripFuel: displayData.tripFuel,
              deckFuel: displayData.deckFuel,
              // Extract other fuel components from departure card if available
              ...(stopCards.find(card => card.isDeparture)?.fuelComponentsObject || {})
            }}
            aircraft={selectedAircraft}
            compact={true}
          />
        </div>
      </div>
      
      {/* Data Source Info */}
      <div className="data-source-info">
        <small>
          📊 Data from StopCardCalculator | 
          🌬️ Wind: {displayData.windDisplay} |
          📍 {waypoints.length} waypoints
        </small>
      </div>
    </div>
  );
};

export default RouteStatsCard;