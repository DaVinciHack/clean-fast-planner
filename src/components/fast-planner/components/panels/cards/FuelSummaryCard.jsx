/**
 * FuelSummaryCard.jsx
 * 
 * Card component for accessing live fuel summary panel.
 * Provides quick fuel overview and access to detailed fuel breakdown.
 */

import React, { useState, useMemo } from 'react';
import FuelSummaryPanel from '../../fuel/FuelSummaryPanel';

const FuelSummaryCard = ({
  stopCards = [],
  flightSettings = {},
  weatherFuel = {},
  fuelPolicy = null,
  routeStats = {},
  selectedAircraft = null,
  currentFlightId = null
}) => {
  const [showPanel, setShowPanel] = useState(false);
  
  // Calculate quick summary stats
  const quickStats = useMemo(() => {
    if (!stopCards || stopCards.length === 0) {
      return {
        hasData: false,
        departureFuel: 0,
        totalStops: 0,
        refuelStops: 0
      };
    }
    
    const departureCard = stopCards[0];
    const refuelStops = stopCards.filter(card => 
      card.refuelMode === true
    ).length;
    
    return {
      hasData: true,
      departureFuel: Math.round(departureCard?.totalFuel || 0),
      totalStops: stopCards.length,
      refuelStops: refuelStops,
      tripFuel: Math.round(routeStats.tripFuel || departureCard?.tripFuel || 0),
      reserveFuel: Math.round(flightSettings.reserveFuel || 0)
    };
  }, [stopCards, flightSettings, routeStats]);
  
  return (
    <>
      <div className="tab-content fuel-summary-tab">
        <h3>💾 Fuel Summary</h3>
        
        {quickStats.hasData ? (
          <div>
            {/* Quick Stats Display */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '10px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4FC3F7' }}>
                  {quickStats.departureFuel.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>Departure Fuel (lbs)</div>
              </div>
              
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '10px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4FC3F7' }}>
                  {quickStats.totalStops}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>Total Stops</div>
              </div>
              
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '10px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF6B35' }}>
                  {quickStats.refuelStops}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>Refuel Stops</div>
              </div>
              
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '10px',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#66BB6A' }}>
                  {quickStats.tripFuel.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>Trip Fuel (lbs)</div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => setShowPanel(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4FC3F7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#29B6F6'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4FC3F7'}
              >
                📊 View Detailed Fuel Summary
              </button>
              
              {/* Quick Info */}
              <div style={{
                backgroundColor: '#2a2a2a',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #333',
                fontSize: '12px',
                color: '#ccc'
              }}>
                <div style={{ marginBottom: '8px', color: '#4FC3F7', fontWeight: '600' }}>
                  Live Fuel Data:
                </div>
                <div style={{ lineHeight: '1.4' }}>
                  • Aircraft: {selectedAircraft?.registration || 'Not selected'}<br/>
                  • Policy: {fuelPolicy?.currentPolicy?.name || 'Default'}<br/>
                  • Weather Fuel: {Math.round((weatherFuel.araFuel || 0) + (weatherFuel.approachFuel || 0))} lbs<br/>
                  • Reserve: {quickStats.reserveFuel.toLocaleString()} lbs
                </div>
              </div>
              
              {quickStats.refuelStops > 0 && (
                <div style={{
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  border: '1px solid #FF6B35',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#FF6B35'
                }}>
                  <strong>⛽ Refuel Operations:</strong><br/>
                  {quickStats.refuelStops} refuel stop{quickStats.refuelStops > 1 ? 's' : ''} detected.
                  View detailed summary for fuel planning.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666',
            backgroundColor: '#2a2a2a',
            borderRadius: '6px',
            border: '1px solid #333'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <div style={{ fontSize: '14px', marginBottom: '5px' }}>No Fuel Data Available</div>
            <div style={{ fontSize: '12px' }}>
              Create a route with waypoints to see fuel summary
            </div>
          </div>
        )}
      </div>
      
      {/* Fuel Summary Panel */}
      <FuelSummaryPanel
        visible={showPanel}
        onClose={() => setShowPanel(false)}
        stopCards={stopCards}
        flightSettings={flightSettings}
        weatherFuel={weatherFuel}
        fuelPolicy={fuelPolicy}
        routeStats={routeStats}
        selectedAircraft={selectedAircraft}
        currentFlightId={currentFlightId}
      />
    </>
  );
};

export default FuelSummaryCard;