import React from 'react';
import WaypointEntry from './WaypointEntry';
import RouteBadge from './RouteBadge';
import { isNavigationalWaypoint } from '../../modules/waypoints/WaypointUtils';

/**
 * RouteItemAdapter Component
 * 
 * Adapts between waypoints and stops, rendering the appropriate component
 * based on the waypoint type.
 */
const RouteItemAdapter = ({ 
  item, 
  index, 
  totalItems,
  onRemove,
  onNameChange,
  isRecentlyAdded,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  addToFavorites
}) => {
  // Determine if this is a navigational waypoint or a regular stop
  const isWaypoint = isNavigationalWaypoint(item);
  
  // If it's a waypoint, render the WaypointEntry component
  if (isWaypoint) {
    return (
      <div className="route-item-container">
        <RouteBadge 
          type="WAYPOINT" 
          isFirst={index === 0}
          isLast={index === totalItems - 1} 
        />
        <WaypointEntry
          waypoint={item}
          index={index}
          onRemove={onRemove}
          onNameChange={onNameChange}
          isRecentlyAdded={isRecentlyAdded}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          addToFavorites={addToFavorites}
        />
      </div>
    );
  }
  
  // Regular stop entry (pass through the props to default stop UI component)
  // Note: This doesn't render the actual component since we don't want to modify
  // the existing StopEntry component. Instead, the LeftPanel would handle this.
  return (
    <div className="route-item-container">
      <RouteBadge 
        type="STOP" 
        legNumber={index}
        isFirst={index === 0}
        isLast={index === totalItems - 1} 
      />
      {/* Return null so the LeftPanel can render the normal stop entry */}
      {null}
    </div>
  );
};

export default RouteItemAdapter;