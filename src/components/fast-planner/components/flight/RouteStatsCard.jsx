import React from 'react';
import { useAuth } from '../../../context/AuthContext';

/**
 * Route Statistics Card Component
 * 
 * Displays route statistics in a card format at the top of the page
 * Including total distance, flight time, total time (flight + deck time),
 * trip fuel, total fuel (trip + deck fuel), and passenger numbers
 */
const RouteStatsCard = ({ 
  routeStats, 
  selectedAircraft, 
  waypoints,
  deckTimePerStop = 5,
  deckFuelPerStop = 100,
  passengerWeight = 220,
  cargoWeight = 0
}) => {
  // Get authentication state and user details
  const { isAuthenticated, userName } = useAuth();

  // Add debug logging to track the routeStats data
  console.log("RouteStatsCard - received stats:", routeStats);
  
  // Calculate the number of landings (waypoints - 1 or 0 if no waypoints)
  const landingsCount = waypoints && waypoints.length > 1 ? waypoints.length - 1 : 0;
  
  // Calculate total deck time (in minutes) - prefer value from stats if available
  const totalDeckTime = routeStats?.deckTimeMinutes || (landingsCount * deckTimePerStop);
  
  // Calculate total deck fuel - prefer value from stats if available
  const totalDeckFuel = routeStats?.deckFuel || (landingsCount * deckFuelPerStop);
  
  // Always show the card, even without route stats
  // Use default values if routeStats is not available
  const stats = routeStats || {
    totalDistance: '0',
    estimatedTime: '00:00',
    timeHours: 0,
    fuelRequired: 0,
    usableLoad: 0,
    maxPassengers: 0,
    endurance: '2.3',
    availableFuel: '3070',
    takeoffWeight: '24807',
    operationalRadius: '85'
  };
  
  // Format total time (flight time + deck time)
  const calculateTotalTime = () => {
    // Use totalTimeFormatted from stats if available
    if (stats.totalTimeFormatted) {
      return stats.totalTimeFormatted;
    }
    
    if (!stats.timeHours && stats.timeHours !== 0) return '00:00';
    
    // Convert deck time from minutes to hours
    const deckTimeHours = totalDeckTime / 60;
    // Add flight time and deck time
    const totalTimeHours = stats.timeHours + deckTimeHours;
    
    // Format as HH:MM
    const hours = Math.floor(totalTimeHours);
    const minutes = Math.floor((totalTimeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  // Use totalFuel from stats if available, or calculate from components if those are available,
  // or fall back to basic calculation as last resort
  const totalFuel = stats.totalFuel || 
                    (stats.tripFuel && stats.deckFuel && stats.contingencyFuel && stats.taxiFuel && stats.reserveFuel) ? 
                      (parseInt(stats.tripFuel) + parseInt(stats.deckFuel) + parseInt(stats.contingencyFuel) + parseInt(stats.taxiFuel) + parseInt(stats.reserveFuel)) : 
                      (parseInt(stats.fuelRequired || 0) + totalDeckFuel);
  
  // Calculate maximum passengers based on usable load and passenger weight
  const calculateMaxPassengers = () => {
    // If we have calculatedPassengers from the flight calculator, use that
    if (stats.calculatedPassengers !== undefined) {
      return stats.calculatedPassengers;
    }
    
    // Otherwise calculate manually as a fallback
    if (!selectedAircraft || !stats.usableLoad) return 0;
    
    // Get max passengers from the aircraft data or calculate based on usable load
    const maxByLoad = Math.floor(stats.usableLoad / passengerWeight);
    const aircraftMaxPax = selectedAircraft.maxPassengers || 19;
    
    // Return the lower value (can't exceed aircraft capacity)
    return Math.min(maxByLoad, aircraftMaxPax);
  };
  
  return (
    <div className="route-stats-card">
      <div className="route-stats-header">
        <div className="logo-container">
          <img src="https://bristow.info/SAR/VTOL-5a215f01.png" alt="VTOL" className="vtol-logo" />
        </div>
        <div className="route-stats-title">
          {selectedAircraft ? (
            <span>{selectedAircraft.registration.split(' (')[0]} • {selectedAircraft.modelType}</span>
          ) : (
            <span>Route Statistics</span>
          )}
        </div>
        
        {/* Auth status container - always show on the right */}
        <div className="auth-status-container">
          {/* Username display with script font */}
          {isAuthenticated && userName && (
            <span className="username-display">{userName}</span>
          )}
          
          {/* Connection indicator dot - changes color based on status */}
          <span 
            className={`connection-indicator ${isAuthenticated ? 'connected' : 'disconnected'}`} 
            title={isAuthenticated ? 'Connected to OSDK' : 'Not connected to OSDK'}
          ></span>
        </div>
      </div>
      <div className="route-stats-content">
        <div className="stats-row">
          {/* Column 1: Total Distance and Trip Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label">Total Distance:</div>
            <div className="route-stat-value">{stats.totalDistance || '0'} NM</div>
          </div>
          
          {/* Column 2: Deck Time and Deck Fuel */}
          <div className="route-stat-item">
            <div className="route-stat-label">Deck Time:</div>
            <div className="route-stat-value">{stats.deckTimeMinutes || totalDeckTime} mins</div>
          </div>
          
          {/* Column 3: Flight Time and Total Time */}
          <div className="route-stat-item">
            <div className="route-stat-label">Flight Time:</div>
            <div className="route-stat-value">{stats.estimatedTime || '00:00'}</div>
          </div>
          
          {/* Column 4: Total Fuel and Passengers */}
          <div className="route-stat-item">
            <div className="route-stat-label">Total Fuel:</div>
            <div className="route-stat-value">{totalFuel} lbs</div>
          </div>
        </div>
        
        <div className="stats-row">
          {/* Column 1: Trip Fuel (below Total Distance) */}
          <div className="route-stat-item">
            <div className="route-stat-label">Trip Fuel:</div>
            <div className="route-stat-value">{stats.tripFuel || stats.fuelRequired || '0'} lbs</div>
          </div>
          
          {/* Column 2: Deck Fuel (below Deck Time) */}
          <div className="route-stat-item">
            <div className="route-stat-label">Deck Fuel:</div>
            <div className="route-stat-value">{stats.deckFuel || totalDeckFuel} lbs</div>
          </div>
          
          {/* Column 3: Total Time (below Flight Time) */}
          <div className="route-stat-item">
            <div className="route-stat-label">Total Time:</div>
            <div className="route-stat-value">{calculateTotalTime()}</div>
          </div>
          
          {/* Column 4: Passengers (below Total Fuel) */}
          <div className="route-stat-item">
            <div className="route-stat-label">Passengers:</div>
            <div className="route-stat-value">{calculateMaxPassengers()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteStatsCard;