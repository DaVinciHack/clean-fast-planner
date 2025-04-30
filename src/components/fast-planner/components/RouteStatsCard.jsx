import React from 'react';

/**
 * Route Statistics Card Component
 * 
 * Displays route statistics in a card format at the top of the page
 */
const RouteStatsCard = ({ routeStats, selectedAircraft }) => {
  // Always show the card, even without route stats
  const stats = routeStats || {
    endurance: '2.3',
    availableFuel: '3070',
    fuelRequired: '3570',
    takeoffWeight: '24807',
    operationalRadius: '85'
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
      </div>
      <div className="route-stats-content">
        <div className="stats-row">
          <div className="route-stat-item">
            <div className="route-stat-label">Est. Endurance (excl. reserve):</div>
            <div className="route-stat-value">{stats.endurance} hrs</div>
          </div>
          <div className="route-stat-item">
            <div className="route-stat-label">Available Mission Fuel:</div>
            <div className="route-stat-value">{stats.availableFuel} lbs</div>
          </div>
          <div className="route-stat-item">
            <div className="route-stat-label">Actual Fuel Uplift:</div>
            <div className="route-stat-value">{stats.fuelRequired} lbs</div>
          </div>
        </div>
        <div className="stats-row">
          <div className="route-stat-item">
            <div className="route-stat-label">Est. Takeoff Weight:</div>
            <div className="route-stat-value">{stats.takeoffWeight} lbs</div>
          </div>
          <div className="route-stat-item operational-radius">
            <div className="route-stat-label">Operational Radius:</div>
            <div className="route-stat-value">{stats.operationalRadius} NM</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteStatsCard;