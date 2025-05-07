import React, { useState, useEffect, useRef } from 'react';

/**
 * Left Panel Component
 * 
 * Displays and manages the route's waypoints/stops list and route controls
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
  onRemoveFavoriteLocation, // Receive remove favorite function
  onReorderWaypoints, // Receive reorder waypoints function
  onClearRoute, // Added for clear route button
  onToggleChart, // Added for toggle rigs button
  chartsVisible // Added for toggle rigs button state
}) => {
  // Keep track of recently added waypoint IDs for highlighting
  const [recentWaypoints, setRecentWaypoints] = useState({});
  const prevWaypointsRef = useRef([]);
  
  // Keep track of recently added favorite locations for highlighting
  const [recentFavorites, setRecentFavorites] = useState({});
  const prevFavoritesRef = useRef([]);
  
  // Internal state for favorites to ensure UI updates even if parent state doesn't
  const [internalFavorites, setInternalFavorites] = useState([]);
  
  // Keep internal favorites in sync with props
  useEffect(() => {
    console.log("LeftPanel: favoriteLocations prop changed:", favoriteLocations.length);
    setInternalFavorites(favoriteLocations);
  }, [favoriteLocations]);
  
  // Debug output for favorites changes
  useEffect(() => {
    console.log("LeftPanel: Internal favorites updated:", internalFavorites.length);
  }, [internalFavorites]);
  
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
      
      console.log(`LeftPanel: Reordering waypoint from index ${sourceIndex} to ${targetIndex}`);
      
      // In our waypoint manager, we need source and target waypoint IDs, not just indices
      const sourceId = draggedId;
      const targetId = waypoints[targetIndex]?.id;
      
      // If the parent component provided a reorder function, call it
      if (onReorderWaypoints && sourceId && targetId) {
        console.log(`LeftPanel: Calling onReorderWaypoints with sourceId=${sourceId}, targetId=${targetId}`);
        onReorderWaypoints(sourceId, targetId);
      } else {
        console.log(`LeftPanel: Missing onReorderWaypoints function or invalid IDs`);
        
        // Fallback: try to simulate reordering by removing and adding at new index
        if (onRemoveWaypoint && onAddWaypoint && sourceIndex !== -1) {
          // Get the waypoint's data before removing
          const movedWaypoint = waypoints[sourceIndex];
          
          // Remove from original position
          onRemoveWaypoint(sourceId, sourceIndex);
          
          // If we have the coordinates, add it at the new position
          // Note: This is a fallback that won't work well with multiple users
          if (movedWaypoint && movedWaypoint.coords) {
            setTimeout(() => {
              // Add at new position - not ideal as it creates a new waypoint
              onAddWaypoint({
                coordinates: movedWaypoint.coords,
                name: movedWaypoint.name
              });
            }, 10);
          }
        }
      }
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && routeInput.trim() !== "") {
      if (onAddWaypoint) {
        console.log('LeftPanel: Enter key pressed with input:', routeInput.trim());
        onAddWaypoint(routeInput.trim());
        
        // Clear the input field after search attempt
        if (onRouteInputChange) {
          onRouteInputChange('');
        }
      }
    }
  };
  
  return (
    <>
      {/* Left panel toggle tab - with horizontal > and < markers */}
      <div 
        className="panel-tab left-panel-tab main-toggle tab-selector" 
        style={{ position: 'fixed', top: '50px', left: '0', zIndex: '20', height: '24px', width: '24px', writingMode: 'horizontal-tb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onToggleVisibility}
      >
        {visible ? '<' : '>'}
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
                      const newLocation = { 
                        name: locationName, 
                        coords: waypoint.coords 
                      };
                      
                      // Add directly to internal state for immediate UI update
                      // Generate a temporary ID for display purposes
                      const tempId = `${locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
                      const tempLocation = {
                        ...newLocation,
                        id: tempId
                      };
                      
                      // Update internal state immediately
                      setInternalFavorites(prev => [...prev, tempLocation]);
                      
                      // Also call the parent handler
                      if (onAddFavoriteLocation) {
                        onAddFavoriteLocation(newLocation);
                      }
                      
                      // Show success message
                      const message = `Added ${locationName} to favorites`;
                      // Create a toast-style notification instead of using the loading overlay
                      const toast = document.createElement('div');
                      toast.style.position = 'fixed';
                      toast.style.bottom = '20px';
                      toast.style.left = '50%';
                      toast.style.transform = 'translateX(-50%)';
                      toast.style.backgroundColor = 'rgba(0, 200, 83, 0.9)';
                      toast.style.color = 'white';
                      toast.style.padding = '10px 20px';
                      toast.style.borderRadius = '5px';
                      toast.style.zIndex = '1000';
                      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                      toast.textContent = message;
                      document.body.appendChild(toast);
                      
                      // Remove after 1.5 seconds
                      setTimeout(() => {
                        document.body.removeChild(toast);
                      }, 1500);
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
                      console.log(`LeftPanel: Removing waypoint at index ${index} with ID ${waypoint.id}`);
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
                if (onAddWaypoint && routeInput.trim()) {
                  console.log('LeftPanel: Add button clicked with input:', routeInput.trim());
                  onAddWaypoint(routeInput.trim());
                  // Clear the input field after adding
                  if (onRouteInputChange) {
                    onRouteInputChange('');
                  }
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
        
        {/* Route Control Buttons - Full Width Side by Side */}
        <div style={{ 
          display: "flex", 
          width: "100%", 
          gap: "5px",
          marginTop: "10px"
        }}>
          <button 
            id="clear-route" 
            className="control-button" 
            onClick={onClearRoute}
            style={{
              flex: 1,
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px"
            }}
          >
            Clear Route
          </button>
          <button 
            id="toggle-chart" 
            className="control-button" 
            onClick={onToggleChart}
            style={{
              flex: 1,
              padding: "8px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px"
            }}
          >
            {chartsVisible ? 'Hide Rigs' : 'Show Rigs'}
          </button>
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
                <strong>{internalFavorites.length}</strong> favorites in this region
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
                      const newLocation = { name, coords };
                      
                      // Add directly to internal state for immediate UI update
                      // Generate a temporary ID for display purposes
                      const tempId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
                      const tempLocation = {
                        ...newLocation,
                        id: tempId
                      };
                      
                      // Update internal state immediately
                      setInternalFavorites(prev => [...prev, tempLocation]);
                      
                      // Also call the parent handler
                      if (onAddFavoriteLocation) {
                        onAddFavoriteLocation(newLocation);
                      }
                      
                      // Show success message with toast notification
                      const message = `Added ${name} to favorites`;
                      const toast = document.createElement('div');
                      toast.style.position = 'fixed';
                      toast.style.bottom = '20px';
                      toast.style.left = '50%';
                      toast.style.transform = 'translateX(-50%)';
                      toast.style.backgroundColor = 'rgba(0, 200, 83, 0.9)';
                      toast.style.color = 'white';
                      toast.style.padding = '10px 20px';
                      toast.style.borderRadius = '5px';
                      toast.style.zIndex = '1000';
                      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                      toast.textContent = message;
                      document.body.appendChild(toast);
                      
                      // Remove after 1.5 seconds
                      setTimeout(() => {
                        document.body.removeChild(toast);
                      }, 1500);
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
                      const newLocation = { name, coords };
                      
                      // Add directly to internal state for immediate UI update
                      // Generate a temporary ID for display purposes
                      const tempId = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
                      const tempLocation = {
                        ...newLocation,
                        id: tempId
                      };
                      
                      // Update internal state immediately
                      setInternalFavorites(prev => [...prev, tempLocation]);
                      
                      // Also call the parent handler
                      if (onAddFavoriteLocation) {
                        onAddFavoriteLocation(newLocation);
                      }
                      
                      // Show success message with toast notification
                      const message = `Added ${name} to favorites`;
                      const toast = document.createElement('div');
                      toast.style.position = 'fixed';
                      toast.style.bottom = '20px';
                      toast.style.left = '50%';
                      toast.style.transform = 'translateX(-50%)';
                      toast.style.backgroundColor = 'rgba(0, 200, 83, 0.9)';
                      toast.style.color = 'white';
                      toast.style.padding = '10px 20px';
                      toast.style.borderRadius = '5px';
                      toast.style.zIndex = '1000';
                      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                      toast.textContent = message;
                      document.body.appendChild(toast);
                      
                      // Remove after 1.5 seconds
                      setTimeout(() => {
                        document.body.removeChild(toast);
                      }, 1500);
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
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    padding: "5px 3px",
                    marginBottom: "4px",
                    borderRadius: "4px",
                    backgroundColor: "rgba(0,0,0,0.1)",
                    transition: "background-color 0.2s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.2)"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.1)"}
                >
                  <span
                    onClick={() => {
                      if (onAddWaypoint && location.coords && location.coords.length === 2) {
                        // Pass location object format compatible with addWaypoint
                        onAddWaypoint({
                          coordinates: location.coords,
                          name: location.name
                        });
                        
                        // Show a success message with a toast instead of overlay
                        const message = `Added ${location.name} to route`;
                        const toast = document.createElement('div');
                        toast.style.position = 'fixed';
                        toast.style.bottom = '20px';
                        toast.style.left = '50%';
                        toast.style.transform = 'translateX(-50%)';
                        toast.style.backgroundColor = 'rgba(0, 123, 255, 0.9)';
                        toast.style.color = 'white';
                        toast.style.padding = '10px 20px';
                        toast.style.borderRadius = '5px';
                        toast.style.zIndex = '1000';
                        toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                        toast.textContent = message;
                        document.body.appendChild(toast);
                        
                        // Remove after 1.5 seconds
                        setTimeout(() => {
                          document.body.removeChild(toast);
                        }, 1500);
                      }
                    }}
                    style={{ 
                      cursor: "pointer", 
                      flexGrow: 1, 
                      marginRight: "10px", 
                      display: "flex", 
                      alignItems: "center",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis"
                    }}
                  >
                    <span style={{ marginRight: "8px", fontSize: "14px", color: "#ff5e85" }}>❤️</span>
                    <span style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{location.name}</strong>
                      {location.coords && location.coords.length === 2 ? (
                        <span style={{ 
                          fontSize: "11px", 
                          color: "var(--label-color)", 
                          marginLeft: "5px",
                          whiteSpace: "nowrap" 
                        }}>
                          ({location.coords[1].toFixed(3)}, {location.coords[0].toFixed(3)})
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: "11px", 
                          color: "var(--danger-color)", 
                          marginLeft: "5px",
                          whiteSpace: "nowrap" 
                        }}>
                          (Invalid coordinates)
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
