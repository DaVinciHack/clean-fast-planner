import React from 'react';

/**
 * Panel that displays legs and waypoints with the ability to edit them
 */
const LegsPanel = ({ 
  flight, 
  routeManager, 
  activeLegIndex, 
  onSelectLeg,
  onRemovePoint 
}) => {
  if (!flight || !flight.legs || flight.legs.length === 0) {
    return (
      <div className="legs-panel">
        <div className="panel-header">
          <h3>Flight Route</h3>
        </div>
        <div className="panel-content empty-state">
          <p>No route defined yet. Click on the map to add stops.</p>
        </div>
      </div>
    );
  }
  
  // Function to render a point (stop or waypoint)
  const renderPoint = (point, legIndex, isStop, role) => {
    // Determine icon and style based on point type
    let icon = '🔵'; // Default
    let pointClass = 'waypoint-item';
    
    if (isStop) {
      pointClass = 'stop-item';
      
      // Different icons based on role
      if (role === 'Dep') {
        icon = '🛫'; // Departure
      } else if (role === 'Des') {
        icon = '🛬'; // Destination
      } else if (role && role.startsWith('Stop')) {
        icon = '🛑'; // Intermediate stop
      }
    }
    
    // Define actions that can be performed on this point
    const actions = [];
    
    // All points can be removed
    if (onRemovePoint) {
      actions.push({
        label: 'Remove',
        onClick: () => onRemovePoint(point.name, legIndex)
      });
    }
    
    // If it's a stop (not departure/destination) with no waypoints, we can make it active for editing
    if (isStop && role !== 'Dep' && role !== 'Des' && 
        legIndex < flight.legs.length - 1 && onSelectLeg) {
      actions.push({
        label: 'Edit Leg',
        onClick: () => onSelectLeg(legIndex)
      });
    }
    
    return (
      <div 
        className={`point-item ${pointClass} ${legIndex === activeLegIndex ? 'active-leg' : ''}`}
        key={`${point.name}-${legIndex}`}
      >
        <div className="point-icon">{icon}</div>
        <div className="point-details">
          <div className="point-name">
            {point.name}
            {role && <span className="point-role"> ({role})</span>}
          </div>
          <div className="point-coords">
            Lat: {point.lat.toFixed(4)}, Lon: {point.lon.toFixed(4)}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="point-actions">
            {actions.map((action, i) => (
              <button 
                key={i} 
                className="action-button"
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="legs-panel">
      <div className="panel-header">
        <h3>Flight Route</h3>
      </div>
      <div className="panel-content">
        {flight.legs.map((leg, legIndex) => {
          // Calculate total points in this leg for display
          const totalPoints = (leg.from ? 1 : 0) + leg.waypoints.length + (leg.to ? 1 : 0);
          
          return (
            <div 
              key={leg.id || legIndex}
              className={`leg-container ${legIndex === activeLegIndex ? 'active-leg' : ''}`}
            >
              <div className="leg-header" onClick={() => onSelectLeg && onSelectLeg(legIndex)}>
                <div className="leg-title">
                  Leg {legIndex + 1}: {leg.from?.name || 'Unknown'} → {leg.to?.name || 'Unknown'}
                </div>
                <div className="leg-stats">
                  <span>{leg.distance?.toFixed(1) || '--'} nm</span>
                  {leg.time > 0 && (
                    <span> • {Math.round(leg.time * 60)}m</span>
                  )}
                  {leg.fuel > 0 && (
                    <span> • {Math.round(leg.fuel)} lbs</span>
                  )}
                </div>
                <div className="leg-points-count">
                  {totalPoints} point{totalPoints !== 1 ? 's' : ''}
                </div>
              </div>
              
              <div className="leg-points">
                {/* Departure stop */}
                {leg.from && renderPoint(leg.from, legIndex, true, 'Dep')}
                
                {/* Waypoints */}
                {leg.waypoints.map((waypoint, wpIndex) => (
                  renderPoint(waypoint, legIndex, false, `WP${wpIndex + 1}`)
                ))}
                
                {/* Destination stop */}
                {leg.to && renderPoint(leg.to, legIndex, true, 
                  legIndex === flight.legs.length - 1 ? 'Des' : `Stop${legIndex + 1}`)}
              </div>
              
              {/* Leg actions */}
              <div className="leg-actions">
                <button 
                  className={`edit-leg-button ${legIndex === activeLegIndex ? 'active' : ''}`}
                  onClick={() => onSelectLeg && onSelectLeg(legIndex)}
                >
                  {legIndex === activeLegIndex ? 'Editing' : 'Edit Waypoints'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LegsPanel;