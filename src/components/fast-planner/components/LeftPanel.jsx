import React, { useState, useEffect, useRef } from 'react';

/**
 * Left Panel Component
 * 
 * Displays and manages the route's waypoints/stops list
 */
const LeftPanel = ({ 
  visible, 
  waypoints, 
  onRemoveWaypoint, 
  onWaypointNameChange,
  onAddWaypoint,
  onToggleVisibility,
  routeInput,
  onRouteInputChange,
  favoriteLocations, // Receive favorite locations
  onAddFavoriteLocation, // Receive add favorite function
  onRemoveFavoriteLocation // Receive remove favorite function
}) => {
  // Keep track of recently added waypoint IDs for highlighting
  const [recentWaypoints, setRecentWaypoints] = useState({});
  const prevWaypointsRef = useRef([]);
  
  // Keep track of recently added favorite locations for highlighting
  const [recentFavorites, setRecentFavorites] = useState({});
  const prevFavoritesRef = useRef([]);
  
  // Check for newly added favorites
  useEffect(() => {
    // Skip first render
    if (prevFavoritesRef.current.length === 0 && favoriteLocations.length > 0) {
      prevFavoritesRef.current = favoriteLocations.map(fav => fav.id);
      return;
    }
    
    // Find favorites that weren't in the previous list
    const prevIds = new Set(prevFavoritesRef.current);
    const newFavorites = favoriteLocations.filter(fav => !prevIds.has(fav.id));
    
    // If we found new favorites, highlight them
    if (newFavorites.length > 0) {
      console.log(`Found ${newFavorites.length} new favorites to highlight`);
      
      const updates = {};
      newFavorites.forEach(fav => {
        updates[fav.id] = Date.now();
        
        // Schedule removal of highlight
        setTimeout(() => {
          setRecentFavorites(prev => {
            const updated = { ...prev };
            delete updated[fav.id];
            return updated;
          });
        }, 2100); // Slightly longer than animation duration (2s)
      });
      
      // Update the highlight state
      setRecentFavorites(prev => ({
        ...prev,
        ...updates
      }));
    }
    
    // Update reference to current favorites
    prevFavoritesRef.current = favoriteLocations.map(fav => fav.id);
  }, [favoriteLocations]);
  
  // Check for newly added waypoints by comparing current and previous lists by ID
  useEffect(() => {
    // Skip first render
    if (prevWaypointsRef.current.length === 0 && waypoints.length > 0) {
      prevWaypointsRef.current = waypoints.map(wp => wp.id);
      return;
    }
    
    // Find waypoints that weren't in the previous list
    const prevIds = new Set(prevWaypointsRef.current);
    const newWaypoints = waypoints.filter(wp => !prevIds.has(wp.id));
    
    // If we found new waypoints, highlight them
    if (newWaypoints.length > 0) {
      console.log(`Found ${newWaypoints.length} new waypoints to highlight`);
      
      const updates = {};
      newWaypoints.forEach(wp => {
        updates[wp.id] = Date.now();
        
        // Schedule removal of highlight
        setTimeout(() => {
          setRecentWaypoints(prev => {
            const updated = { ...prev };
            delete updated[wp.id];
            return updated;
          });
        }, 2100); // Slightly longer than animation duration (2s)
      });
      
      // Update the highlight state
      setRecentWaypoints(prev => ({
        ...prev,
        ...updates
      }));
    }
    
    // Update reference to current waypoints
    prevWaypointsRef.current = waypoints.map(wp => wp.id);
  }, [waypoints]);
  
  // Check if a waypoint was recently added and should be highlighted
  const isRecentlyAdded = (waypointId) => {
    return !!recentWaypoints[waypointId];
  };
  
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("text/plain", id);
    e.currentTarget.classList.add("dragging");
  };
  
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };
  
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };
  
  const handleDrop = (e, targetId, targetIndex) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");
    
    const draggedId = e.dataTransfer.getData("text/plain");
    
    if (draggedId !== targetId) {
      // Find source index
      const sourceIndex = waypoints.findIndex(wp => wp.id === draggedId);
      
      // Call parent handler with reordering info
      const updatedWaypoints = [...waypoints];
      const [movedWaypoint] = updatedWaypoints.splice(sourceIndex, 1);
      updatedWaypoints.splice(targetIndex, 0, movedWaypoint);
      
      // Update parent component with new order
      if (onWaypointNameChange) {
        onWaypointNameChange(draggedId, movedWaypoint.name, updatedWaypoints);
      }
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && routeInput.trim() !== "") {
      if (onAddWaypoint) {
        onAddWaypoint(routeInput.trim());
      }
    }
  };
  
  return (
    <>
      {/* Left panel toggle tab - shorter and with double arrows */}
      <div 
        className="panel-tab left-panel-tab main-toggle tab-selector" 
        style={{ top: '50px', left: '5px', height: '24px' }}
        onClick={onToggleVisibility}
      >
        {visible ? '<<' : '>>'}
      </div>
      
      {/* Route Editor Panel */}
      <div className={`route-editor-panel ${!visible ? "hidden" : ""}`}>
        <h3>Flight Stops</h3>
        <p style={{ fontSize: '0.8em', color: 'var(--label-color)', margin: '0 0 10px 0' }}>
          Click map to add stops or enter names below
        </p>
        
        <div id="stops-container">
          {waypoints.map((waypoint, index) => (
            <div 
              className={`stop-entry ${isRecentlyAdded(waypoint.id) ? 'highlight-new' : ''}`}
              key={waypoint.id} 
              data-id={waypoint.id} 
              draggable={true}
              onDragStart={(e) => handleDragStart(e, waypoint.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, waypoint.id, index)}
            >
              <input 
                type="text" 
                value={waypoint.name || `Stop ${index + 1}`}
                onChange={(e) => {
                  if (onWaypointNameChange) {
                    onWaypointNameChange(waypoint.id, e.target.value);
                  }
                }}
              />
              <div className="coordinates">
                Lat: {waypoint.coords[1].toFixed(5)}, Lon: {waypoint.coords[0].toFixed(5)}
              </div>
              <div className="stop-controls">
                <div 
                  className="favorite-button" 
                  title="Add to favorites"
                  onClick={() => {
                    if (onAddFavoriteLocation) {
                      const locationName = waypoint.name || `Stop ${index + 1}`;
                      onAddFavoriteLocation({ 
                        name: locationName, 
                        coords: waypoint.coords 
                      });
                      // Show success message
                      const loadingOverlay = document.getElementById('loading-overlay');
                      if (loadingOverlay) {
                        loadingOverlay.textContent = `Added ${locationName} to favorites`;
                        loadingOverlay.style.display = 'block';
                        setTimeout(() => {
                          loadingOverlay.style.display = 'none';
                        }, 1500);
                      }
                    }
                  }}
                  style={{ 
                    color: "#ff5e85", 
                    fontSize: "16px",
                    padding: "3px 6px",
                    borderRadius: "4px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(255,94,133,0.15)";
                    e.currentTarget.style.transform = "scale(1.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >❤️</div>
                <div className="drag-handle">☰</div>
                <div 
                  className="remove-stop" 
                  onClick={() => {
                    if (onRemoveWaypoint) {
                      onRemoveWaypoint(waypoint.id, index);
                    }
                  }}
                >✖</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Add Stop by Name Input */}
        <div style={{ marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input 
              type="text" 
              className="route-input"
              placeholder="Enter rig name or waypoint"
              style={{ 
                flex: 1, 
                marginRight: "5px", 
                marginBottom: 0, 
                height: "36px"
              }}
              value={routeInput}
              onChange={(e) => {
                if (onRouteInputChange) {
                  onRouteInputChange(e.target.value);
                }
              }}
              onKeyPress={handleKeyPress}
            />
            <button 
              className="control-button" 
              style={{
                marginTop: 0,
                height: "36px",
                padding: "0 15px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              onClick={() => {
                if (onAddWaypoint) {
                  onAddWaypoint(routeInput.trim() || "New Stop");
                }
              }}
            >
              Add
            </button>
          </div>
          <p style={{ fontSize: '0.75em', color: 'var(--label-color)', margin: '3px 0 0 0' }}>
            Type a rig name (e.g. "Mars", "Thunder Horse") to find it automatically
          </p>
        </div>
        
        {/* Favorite Locations Section */}
        <div style={{ marginTop: "20px" }}>
          <h4>Favorite Locations</h4>
          {/* Input for adding new favorite location */}
          <div style={{ marginBottom: "15px" }}>
            <p style={{ fontSize: '0.8em', color: 'var(--label-color)', margin: '0 0 5px 0' }}>
              Click the heart icon ❤️ next to a waypoint or in any popup to add to favorites
            </p>
            <p style={{ 
              fontSize: '0.8em', 
              color: 'var(--accent-cyan)', 
              margin: '0 0 5px 0',
              padding: '6px',
              backgroundColor: 'rgba(0,123,255,0.1)',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>
                <strong>{favoriteLocations.length}</strong> favorites in this region
              </span>
              <button 
                style={{
                  marginLeft: '5px',
                  padding: '2px 5px',
                  fontSize: '0.9em',
                  backgroundColor: 'var(--button-bg)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const debugInfo = document.getElementById('favorites-debug-info');
                  if (debugInfo) {
                    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
                  }
                }}
              >
                Debug
              </button>
            </p>
            <div 
              id="favorites-debug-info" 
              style={{ 
                display: 'none', 
                fontSize: '0.7em', 
                backgroundColor: '#1a1a1a',
                border: '1px solid var(--border-color)',
                padding: '5px',
                maxHeight: '150px',
                overflowY: 'auto',
                marginBottom: '5px',
                whiteSpace: 'pre-wrap'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Info:</div>
              {favoriteLocations.map((loc, index) => (
                <div key={index} style={{ marginBottom: '5px', borderBottom: '1px dotted #333' }}>
                  <div>Index: {index}</div>
                  <div>ID: {loc.id || 'undefined'}</div>
                  <div>Name: {loc.name || 'unnamed'}</div>
                  <div>Coords: {loc.coords ? `[${loc.coords.join(', ')}]` : 'invalid'}</div>
                </div>
              ))}
              <button 
                style={{
                  padding: '3px 8px',
                  fontSize: '0.9em',
                  backgroundColor: 'var(--danger-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  marginTop: '5px'
                }}
                onClick={() => {
                  try {
                    localStorage.removeItem('fastPlannerFavorites');
                    alert('Favorites cleared from localStorage! Refresh the page to see changes.');
                  } catch (e) {
                    alert('Error clearing favorites: ' + e.message);
                  }
                }}
              >
                Clear All Favorites
              </button>
            </div>
            
            <div style={{ display: "flex", marginTop: "10px", alignItems: "center" }}>
              <input
                type="text"
                className="route-input"
                placeholder="Or manually add: Name, Lat, Lon"
                style={{ 
                  flex: 1, 
                  marginRight: "5px", 
                  marginBottom: 0, 
                  height: "36px" 
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.target.value.trim() !== "") {
                    const input = e.target.value.trim();
                    const parts = input.split(',').map(part => part.trim());
                    if (parts.length === 3 && !isNaN(parts[1]) && !isNaN(parts[2])) {
                      const name = parts[0];
                      const coords = [parseFloat(parts[2]), parseFloat(parts[1])]; // Lon, Lat
                      if (onAddFavoriteLocation) {
                        onAddFavoriteLocation({ name, coords });
                        e.target.value = ''; // Clear input
                        
                        // Show success message
                        const loadingOverlay = document.getElementById('loading-overlay');
                        if (loadingOverlay) {
                          loadingOverlay.textContent = `Added ${name} to favorites`;
                          loadingOverlay.style.display = 'block';
                          setTimeout(() => {
                            loadingOverlay.style.display = 'none';
                          }, 1500);
                        }
                      }
                    } else {
                      alert("Invalid format. Please use 'Name, Lat, Lon'.");
                    }
                  }
                }}
              />
              <button
                className="control-button"
                style={{
                  marginTop: 0,
                  height: "36px",
                  padding: "0 15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onClick={() => {
                  const inputElement = document.querySelector('.route-editor-panel input[placeholder="Or manually add: Name, Lat, Lon"]');
                  if (inputElement && inputElement.value.trim() !== "") {
                    const input = inputElement.value.trim();
                    const parts = input.split(',').map(part => part.trim());
                    if (parts.length === 3 && !isNaN(parts[1]) && !isNaN(parts[2])) {
                      const name = parts[0];
                      const coords = [parseFloat(parts[2]), parseFloat(parts[1])]; // Lon, Lat
                      if (onAddFavoriteLocation) {
                        onAddFavoriteLocation({ name, coords });
                        inputElement.value = ''; // Clear input
                        
                        // Show success message
                        const loadingOverlay = document.getElementById('loading-overlay');
                        if (loadingOverlay) {
                          loadingOverlay.textContent = `Added ${name} to favorites`;
                          loadingOverlay.style.display = 'block';
                          setTimeout(() => {
                            loadingOverlay.style.display = 'none';
                          }, 1500);
                        }
                      }
                    } else {
                      alert("Invalid format. Please use 'Name, Lat, Lon'.");
                    }
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
          <div style={{ fontSize: "0.85em" }}>
            {favoriteLocations.map((location, index) => {
              // Ensure each location has an ID (use index as fallback)
              const locationId = location.id || `favorite-${index}`;
              
              return (
                <div
                  key={locationId}
                  className={`favorite-item ${recentFavorites[locationId] ? 'highlight-new' : ''}`}
                >
                  <span
                    onClick={() => {
                      if (onAddWaypoint && location.coords && location.coords.length === 2) {
                        onAddWaypoint(location.name, location.coords);
                        
                        // Show a success message
                        const loadingOverlay = document.getElementById('loading-overlay');
                        if (loadingOverlay) {
                          loadingOverlay.textContent = `Added ${location.name} to route`;
                          loadingOverlay.style.display = 'block';
                          setTimeout(() => {
                            loadingOverlay.style.display = 'none';
                          }, 1500);
                        }
                      }
                    }}
                    style={{ 
                      cursor: "pointer", 
                      flexGrow: 1, 
                      marginRight: "10px", 
                      display: "flex", 
                      alignItems: "center" 
                    }}
                  >
                    <span style={{ marginRight: "8px", fontSize: "14px", color: "#ff5e85" }}>❤️</span>
                    <span>
                      <strong>{location.name}</strong>
                      <br />
                      {location.coords && location.coords.length === 2 ? (
                        <span style={{ fontSize: "11px", color: "var(--label-color)" }}>
                          {location.coords[1].toFixed(3)}, {location.coords[0].toFixed(3)}
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--danger-color)" }}>
                          Invalid coordinates
                        </span>
                      )}
                    </span>
                  </span>
                  <div
                    className="remove-stop" // Reusing class for styling
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the parent onClick
                      if (onRemoveFavoriteLocation) {
                        console.log("Removing favorite with ID:", locationId);
                        onRemoveFavoriteLocation(locationId);
                      }
                    }}
                    style={{ 
                      cursor: "pointer", 
                      fontSize: "1em", 
                      padding: "5px 8px",
                      color: "var(--danger-color)",
                      borderRadius: "4px",
                      marginLeft: "auto",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(255,0,0,0.15)"}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    ✖
                  </div>
                </div>
              );
            })}
            {favoriteLocations.length === 0 && (
              <div style={{ 
                padding: "10px", 
                textAlign: "center", 
                fontSize: "0.9em",
                color: "var(--label-color)",
                fontStyle: "italic",
                backgroundColor: "rgba(0,0,0,0.2)",
                borderRadius: "5px"
              }}>
                No favorites added yet
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LeftPanel;
