import React from 'react';
import './RouteBadge.css';

/**
 * RouteBadge Component
 * 
 * Displays a small badge identifying a waypoint's role in the route:
 * - Leg start/end
 * - Navigation waypoint
 * - Regular stop
 */
const RouteBadge = ({ type, legNumber, isFirst, isLast }) => {
  // Determine badge appearance based on waypoint type
  let badgeClass = 'route-badge';
  let badgeContent = '';
  
  if (type === 'WAYPOINT') {
    // Navigation waypoint
    badgeClass += ' waypoint-badge';
    badgeContent = 'Waypoint';
  } else if (isFirst) {
    // Departure
    badgeClass += ' departure-badge';
    badgeContent = 'Departure';
  } else if (isLast) {
    // Arrival
    badgeClass += ' arrival-badge';
    badgeContent = 'Arrival';
  } else {
    // Regular stop
    badgeClass += ' stop-badge';
    badgeContent = `Stop ${legNumber || ''}`;
  }
  
  return (
    <div className={badgeClass}>
      {badgeContent}
    </div>
  );
};

export default RouteBadge;