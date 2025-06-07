import React from 'react';

// Hardcoded stop cards to show when regular stop cards fail
const hardcodedCards = [
  {
    id: 'departure',
    index: 0,
    stopName: 'DEPARTURE',
    totalDistance: '0.0',
    totalTime: 0,
    totalFuel: 2000,
    maxPassengers: 12,
    isDeparture: true,
    isDestination: false,
    fuelComponents: 'Trip:1000 Res:600 Cont:100 Taxi:50 Deck:250'
  },
  {
    id: 'destination',
    index: 1,
    stopName: 'DESTINATION',
    totalDistance: '158.8',
    totalTime: 1.0,
    totalFuel: 700,
    maxPassengers: 0,
    maxPassengersDisplay: 'Final Stop',
    isDeparture: false,
    isDestination: true,
    fuelComponents: 'Res:600 Extra:100'
  }
];

/**
 * EmergencyStopCards Component
 * 
 * A completely standalone component that will always show stop cards
 * regardless of the state of the rest of the application
 */
const EmergencyStopCards = () => {
  // Format time as HH:MM
  const formatTime = (timeHours) => {
    if (!timeHours && timeHours !== 0) return '00:00';
    const hours = Math.floor(timeHours);
    const minutes = Math.floor((timeHours - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };
  
  return (
    <div style={{
      margin: '10px 0',
      padding: '10px',
      backgroundColor: 'rgba(35, 35, 35, 0.95)',
      borderRadius: '4px',
      boxShadow: '0 3px 8px rgba(0, 0, 0, 0.4)',
      border: '1px solid #e74c3c'
    }}>
      <h4 style={{ 
        color: '#e74c3c', 
        fontSize: '0.85em', 
        fontWeight: '600', 
        textTransform: 'uppercase', 
        marginBottom: '8px',
        marginTop: '0'
      }}>EMERGENCY STOP CARDS</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {hardcodedCards.map((card, index) => {
          // Determine styling based on stop type
          const borderColor = card.isDeparture ? '#2ecc71' : 
                             card.isDestination ? '#e74c3c' : 
                             '#3498db';
          const bgColor = card.isDeparture ? 'rgba(45, 55, 45, 0.95)' : 
                         card.isDestination ? 'rgba(55, 45, 45, 0.95)' : 
                         'rgba(45, 45, 55, 0.95)';
          
          // Determine stop number display
          const stopNumberDisplay = card.isDeparture ? 'D' : 
                                   card.isDestination ? 'F' : 
                                   card.index;
                                   
          return (
            <div key={`emergency-stop-${index}`} style={{
              backgroundColor: bgColor,
              borderLeft: `3px solid ${borderColor}`,
              borderRadius: '3px',
              padding: '8px 10px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
              cursor: 'pointer'
            }}>
              {/* Stop header with number and name */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ 
                  backgroundColor: borderColor,
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75em',
                  fontWeight: 'bold',
                  marginRight: '8px'
                }}>
                  {stopNumberDisplay}
                </div>
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.85em',
                  color: 'white',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {card.stopName || `Stop ${index + 1}`}
                </div>
              </div>
              
              {/* Stop details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Distance */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: borderColor, fontSize: '0.9em' }}>📍</span>
                  <div style={{ fontSize: '0.75em', color: '#f5f5f5' }}>{card.totalDistance || '0'} nm</div>
                </div>
                
                {/* Time */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: borderColor, fontSize: '0.9em' }}>⏱️</span>
                  <div style={{ fontSize: '0.75em', color: '#f5f5f5' }}>{formatTime(card.totalTime)}</div>
                </div>
                
                {/* Fuel */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: borderColor, fontSize: '0.9em' }}>⛽</span>
                  <div style={{ fontSize: '0.75em', color: '#f5f5f5' }}>{card.totalFuel || '0'} lbs</div>
                </div>
                
                {/* Passengers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ color: borderColor, fontSize: '0.9em' }}>👥</span>
                  <div style={{ fontSize: '0.75em', color: '#f5f5f5' }}>
                    {card.maxPassengersDisplay || card.maxPassengers || '0'}
                  </div>
                </div>
              </div>
              
              {/* Fuel Components */}
              {card.fuelComponents && (
                <div style={{ 
                  marginTop: '6px', 
                  paddingTop: '4px', 
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '0.7em',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {card.fuelComponents}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EmergencyStopCards;