import React, { useState } from 'react';
import '../../modules/waypoints/waypoint-styles.css';

/**
 * WaypointEntry Component
 * 
 * Renders a waypoint in the route as a distinct UI element from regular stops.
 * Used within the left panel's route listing.
 */
const WaypointEntry = ({ 
  waypoint, 
  index,
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
  const [name, setName] = useState(waypoint.name || `Waypoint ${index + 1}`);
  
  const handleNameChange = (e) => {
    setName(e.target.value);
    if (onNameChange) {
      onNameChange(waypoint.id, e.target.value);
    }
  };
  
  const handleRemove = () => {
    if (onRemove) {
      onRemove(waypoint.id, index);
    }
  };
  
  const handleAddToFavorites = () => {
    if (addToFavorites) {
      const locationName = waypoint.name || `Waypoint ${index + 1}`;
      addToFavorites({
        name: locationName,
        coords: waypoint.coords
      });
    }
  };
  
  return (
    <div 
      className={`waypoint-entry ${isRecentlyAdded ? 'highlight-new' : ''}`}
      draggable={true}
      onDragStart={(e) => onDragStart && onDragStart(e, waypoint.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver && onDragOver(e)}
      onDragEnter={(e) => onDragEnter && onDragEnter(e)}
      onDragLeave={(e) => onDragLeave && onDragLeave(e)}
      onDrop={(e) => onDrop && onDrop(e, waypoint.id, index)}
      data-id={waypoint.id}
      data-is-waypoint="true" // Flag to identify as a waypoint vs. regular stop
    >
      <input 
        type="text" 
        value={name}
        onChange={handleNameChange}
        title={name}
      />
      <div className="coordinates">
        Lat: {waypoint.coords[1].toFixed(5)}, Lon: {waypoint.coords[0].toFixed(5)}
      </div>
      <div className="waypoint-controls">
        <div 
          className="favorite-button" 
          title="Add to favorites"
          onClick={handleAddToFavorites}
        >❤️</div>
        <div className="drag-handle" title="Drag to reorder">☰</div>
        <div 
          className="remove-waypoint" 
          title="Remove waypoint"
          onClick={handleRemove}
        >✖</div>
      </div>
    </div>
  );
};

export default WaypointEntry;