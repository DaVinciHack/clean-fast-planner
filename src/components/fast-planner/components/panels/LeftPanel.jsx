import React, { useState, useEffect, useRef } from 'react';
import AlternateModeButton from '../controls/AlternateModeButton';

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
  alternateRouteInput, // Added for alternate route input
  onAlternateRouteInputChange, // Added for alternate route input handler
  onAlternateRouteSubmit, // Added for alternate route submission
  favoriteLocations, // Receive favorite locations
  onAddFavoriteLocation, // Receive add favorite function
  onRemoveFavoriteLocation, // Receive remove favorite function
  onReorderWaypoints, // Receive reorder waypoints function
  onClearRoute, // Added for clear route button
  onToggleChart, // Added for toggle rigs button
  chartsVisible, // Added for toggle rigs button state
  onToggleWaypointMode, // Handler for the "Add Insert Waypoints" button
  waypointModeActive // State to track if waypoint insertion mode is active
}) => {
  // Initialize with safe, sanitized defaults
  const safeWaypoints = Array.isArray(waypoints) ? waypoints : [];
  const safeFavoriteLocations = Array.isArray(favoriteLocations) ? favoriteLocations : [];
  
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
    console.log("LeftPanel: favoriteLocations prop changed:", safeFavoriteLocations.length);
    setInternalFavorites(safeFavoriteLocations);
  }, [safeFavoriteLocations]);
  
  // Debug output for favorites changes
  useEffect(() => {
    console.log("LeftPanel: Internal favorites updated:", internalFavorites.length);
  }, [internalFavorites]);
  
  // Check for newly added favorites
  useEffect(() => {
    // Skip first render
    if (prevFavoritesRef.current.length === 0 && safeFavoriteLocations.length > 0) {
      prevFavoritesRef.current = safeFavoriteLocations.map(fav => fav.id);
      return;
    }
    
    // Find favorites that weren't in the previous list
    const prevIds = new Set(prevFavoritesRef.current);
    const newFavorites = safeFavoriteLocations.filter(fav => !prevIds.has(fav.id));
    
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
    prevFavoritesRef.current = safeFavoriteLocations.map(fav => fav.id);
  }, [safeFavoriteLocations]);
  
  // Check for newly added waypoints by comparing current and previous lists by ID
  useEffect(() => {
    // Skip first render
    if (prevWaypointsRef.current.length === 0 && safeWaypoints.length > 0) {
      prevWaypointsRef.current = safeWaypoints.map(wp => wp.id);
      return;
    }
    
    // Find waypoints that weren't in the previous list
    const prevIds = new Set(prevWaypointsRef.current);
    const newWaypoints = safeWaypoints.filter(wp => !prevIds.has(wp.id));
    
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
    prevWaypointsRef.current = safeWaypoints.map(wp => wp.id);
  }, [safeWaypoints]);
  
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
      const sourceIndex = safeWaypoints.findIndex(wp => wp.id === draggedId);
      
      console.log(`LeftPanel: Reordering waypoint from index ${sourceIndex} to ${targetIndex}`);
      
      // In our waypoint manager, we need source and target waypoint IDs, not just indices
      const sourceId = draggedId;
      const targetId = safeWaypoints[targetIndex]?.id;
      
      // If the parent component provided a reorder function, call it
      if (onReorderWaypoints && sourceId && targetId) {
        console.log(`LeftPanel: Calling onReorderWaypoints with sourceId=${sourceId}, targetId=${targetId}`);
        onReorderWaypoints(sourceId, targetId);
      } else {
        console.log(`LeftPanel: Missing onReorderWaypoints function or invalid IDs`);
        
        // Fallback: try to simulate reordering by removing and adding at new index
        if (onRemoveWaypoint && onAddWaypoint && sourceIndex !== -1) {
          // Get the waypoint's data before removing
          const movedWaypoint = safeWaypoints[sourceIndex];
          
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
        style={{ position: 'fixed', top: '130px', left: '0', zIndex: '20', height: '24px', width: '24px', writingMode: 'horizontal-tb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onToggleVisibility}
      >
        {visible ? '<' : '>'}
      </div>
      
      {/* Route Editor Panel */}
      <div 
        className={`route-editor-panel ${!visible ? "hidden" : ""}`}
      >
        <h3>Flight Stops</h3>
        <p style={{ fontSize: '0.8em', color: 'var(--label-color)', margin: '0 0 10px 0' }}>
          Click map to add stops or enter names below
        </p>
        
        <div id="stops-container">
          {safeWaypoints.map((waypoint, index) => {
            // Extract all needed properties from the waypoint object
            const waypointId = waypoint.id || `waypoint-${index}`;
            const waypointName = waypoint.name || `${waypoint.isWaypoint || waypoint.type === 'WAYPOINT' ? 'WP' : 'Stop'} ${index + 1}`;
            const isWaypointType = waypoint.isWaypoint === true || waypoint.type === 'WAYPOINT' ? true : false;
            const coords = waypoint.coords || [0, 0];
            const lat = coords[1];
            const lon = coords[0];
            
            return (
              <div 
                className={`stop-entry ${isRecentlyAdded(waypointId) ? 'highlight-new' : ''}`}
                key={`waypoint-${index}-${waypointId}`}
                data-id={waypointId} 
                data-waypoint={isWaypointType ? 'true' : 'false'}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, waypointId)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, waypointId, index)}
              >
                <input 
                  type="text" 
                  value={waypointName}
                  onChange={(e) => {
                    if (onWaypointNameChange) {
                      onWaypointNameChange(waypointId, e.target.value);
                    }
                  }}
                />
                <div className="coordinates">
                  Lat: {lat.toFixed(5)}, Lon: {lon.toFixed(5)}
                </div>
                <div className="stop-controls">
                  <div 
                    className="favorite-button" 
                    title="Add to favorites"
                    onClick={() => {
                      if (onAddFavoriteLocation) {
                        const locationName = waypointName;
                        const newLocation = { 
                          name: locationName, 
                          coords: [lon, lat]  // Use extracted values
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
                        console.log(`LeftPanel: Removing waypoint at index ${index} with ID ${waypointId}`);
                        
                        // Immediately update local UI for better responsiveness
                        const wpElement = document.querySelector(`[data-id="${waypointId}"]`);
                        if (wpElement) {
                          wpElement.style.opacity = '0.5';
                          wpElement.style.height = wpElement.offsetHeight + 'px';
                          setTimeout(() => {
                            wpElement.style.height = '0';
                            wpElement.style.margin = '0';
                            wpElement.style.padding = '0';
                            wpElement.style.overflow = 'hidden';
                          }, 50);
                        }
                        
                        // Call the actual removal function
                        onRemoveWaypoint(waypointId, index);
                      }
                    }}
                  >✖</div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Add Stop by Name Input */}
        <div style={{ marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input 
              type="text" 
              className="route-input"
              placeholder="Enter rig name, platform, or coordinates"
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
                console.log('=== LeftPanel: Add button clicked ===');
                console.log('onAddWaypoint function available:', !!onAddWaypoint);
                console.log('routeInput value:', JSON.stringify(routeInput));
                console.log('routeInput trimmed:', JSON.stringify(routeInput.trim()));
                console.log('routeInput length:', routeInput.trim().length);
                
                if (onAddWaypoint && routeInput.trim()) {
                  console.log('LeftPanel: Calling onAddWaypoint with input:', routeInput.trim());
                  try {
                    onAddWaypoint(routeInput.trim());
                    console.log('LeftPanel: onAddWaypoint call completed successfully');
                  } catch (error) {
                    console.error('LeftPanel: Error calling onAddWaypoint:', error);
                  }
                  
                  // Clear the input field after adding
                  if (onRouteInputChange) {
                    console.log('LeftPanel: Clearing input field');
                    onRouteInputChange('');
                  }
                } else {
                  console.log('LeftPanel: Cannot add waypoint - missing function or empty input');
                  console.log('  - onAddWaypoint available:', !!onAddWaypoint);
                  console.log('  - routeInput has content:', !!routeInput.trim());
                }
              }}
            >
              Add
            </button>
          </div>
          
          {/* Coordinate format help text */}
          <div style={{ 
            fontSize: "11px", 
            color: "#888", 
            marginTop: "3px",
            lineHeight: "1.3"
          }}>
            Examples: STAVANGER, 60.7917,5.3417, 60° 47.502' N, 5° 20.502' E
          </div>
        </div>

        {/* Alternate Route Input */}
        <div style={{ marginTop: "15px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <input 
              type="text" 
              className="route-input"
              placeholder="Alternate Name (e.g., ENXW ENZV or ENZV)"
              style={{ 
                flex: 1, 
                marginRight: "5px", 
                marginBottom: 0, 
                height: "36px"
              }}
              value={alternateRouteInput || ''}
              onChange={(e) => {
                if (onAlternateRouteInputChange) {
                  onAlternateRouteInputChange(e.target.value);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && alternateRouteInput && alternateRouteInput.trim() !== "") {
                  if (onAlternateRouteSubmit) {
                    console.log('LeftPanel: Alternate route Enter key pressed with input:', alternateRouteInput.trim());
                    onAlternateRouteSubmit(alternateRouteInput.trim());
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
                console.log('=== LeftPanel: Alternate Route Add button clicked ===');
                console.log('onAlternateRouteSubmit function available:', !!onAlternateRouteSubmit);
                console.log('alternateRouteInput value:', JSON.stringify(alternateRouteInput));
                
                if (onAlternateRouteSubmit && alternateRouteInput && alternateRouteInput.trim()) {
                  console.log('LeftPanel: Calling onAlternateRouteSubmit with input:', alternateRouteInput.trim());
                  try {
                    onAlternateRouteSubmit(alternateRouteInput.trim());
                    console.log('LeftPanel: onAlternateRouteSubmit call completed successfully');
                  } catch (error) {
                    console.error('LeftPanel: Error calling onAlternateRouteSubmit:', error);
                  }
                } else {
                  console.log('LeftPanel: Cannot submit alternate route - missing function or empty input');
                  console.log('  - onAlternateRouteSubmit available:', !!onAlternateRouteSubmit);
                  console.log('  - alternateRouteInput has content:', !!(alternateRouteInput && alternateRouteInput.trim()));
                }
              }}
            >
              Set
            </button>
          </div>
          
          {/* Alternate route help text */}
          <div style={{ 
            fontSize: "11px", 
            color: "#888", 
            marginTop: "3px",
            lineHeight: "1.3"
          }}>
            Single: ENZV (uses current split) | Pair: ENXW ENZV (custom route)
          </div>
        </div>
        
        {/* Add Insert Waypoints Button - Full Width */}
        <div style={{ width: "100%", marginTop: "10px", marginBottom: "7px" }}>
          <button 
            id="add-waypoints" 
            className={`control-button ${waypointModeActive ? 'active' : ''}`}
            style={{
              width: "100%",
              padding: "6px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              height: "32px",
              backgroundColor: waypointModeActive ? "#00cc66" : "#0066cc",
              color: "white",
              fontWeight: waypointModeActive ? "bold" : "normal",
              border: waypointModeActive ? "2px solid #ffcc00" : "none"
            }}
            onClick={() => {
              if (onToggleWaypointMode) {
                onToggleWaypointMode(!waypointModeActive);
              }
            }}
          >
            {waypointModeActive ? 
              "✅ WAYPOINT MODE ACTIVE" : 
              "Add Insert Waypoints"}
          </button>
        </div>

        {/* Alternate Mode Button */}
        <AlternateModeButton
          waypoints={waypoints}
          fuelLocations={[]} // Will be populated from platform manager
          airports={[]} // Will be populated from platform manager  
          onAlternateUpdate={(alternate, splitPoint) => {
            console.log('Alternate selected:', alternate, splitPoint);
            // Integration with route update logic would go here
          }}
          onToggleFuelLocations={(enabled) => {
            console.log('Toggle fuel locations:', enabled);
            // Integration with map layers would go here
          }}
          onToggleAirports={(enabled) => {
            console.log('Toggle airports:', enabled);
            // Integration with map layers would go here
          }}
          onRegisterMapClickHandler={(handlerName, handler) => {
            console.log('Register map click handler:', handlerName);
            // Integration with map manager would go here
          }}
        />
        
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
              margin: '0 0 10px 0',
              padding: '6px',
              backgroundColor: 'rgba(0,123,255,0.1)',
              borderRadius: '3px'
            }}>
              <strong>{internalFavorites.length}</strong> favorites in this region
            </p>
          </div>
          <div style={{ fontSize: "0.85em" }}>
            {safeFavoriteLocations.map((location, index) => {
              // Ensure each location has an ID (use index as fallback)
              const locationId = location.id || `favorite-${index}`;
              const locationName = location.name || `Location ${index + 1}`;
              // Ensure coordinates are valid or provide defaults
              const coords = location.coords && Array.isArray(location.coords) && location.coords.length === 2 
                ? location.coords 
                : [0, 0];
              const lat = coords[1];
              const lon = coords[0];
              const hasValidCoords = location.coords && Array.isArray(location.coords) && location.coords.length === 2;
              
              return (
                <div
                  key={`favorite-${index}-${locationId}`}
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
                      if (onAddWaypoint && hasValidCoords) {
                        // Pass location object format compatible with addWaypoint
                        onAddWaypoint({
                          coordinates: [lon, lat],
                          name: locationName
                        });
                        
                        // Show a success message with a toast instead of overlay
                        const message = `Added ${locationName} to route`;
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
                      <strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{locationName}</strong>
                      {hasValidCoords ? (
                        <span style={{ 
                          fontSize: "11px", 
                          color: "var(--label-color)", 
                          marginLeft: "5px",
                          whiteSpace: "nowrap" 
                        }}>
                          ({lat.toFixed(3)}, {lon.toFixed(3)})
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
            {safeFavoriteLocations.length === 0 && (
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
