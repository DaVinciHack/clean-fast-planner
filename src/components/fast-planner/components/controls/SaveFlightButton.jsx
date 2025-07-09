import React, { useState } from 'react';
// import SaveFlightModal from './SaveFlightModal'; // REMOVED - dead code, using SaveFlightCard instead
import PalantirFlightService from '../../services/PalantirFlightService';
import AutomationService from '../../services/AutomationService';
import { usePanelContext } from '../../context/PanelContext';
import { useRegion } from '../../context/region';
import FlightAutomationLoader from '../loaders/FlightAutomationLoader';

/**
 * SaveFlightButton Component
 * 
 * ⚠️ WARNING: THIS COMPONENT IS NOT CURRENTLY USED IN THE MAIN APPLICATION FLOW ⚠️
 * 
 * The actual save flight functionality is handled by:
 * SaveFlightCard → RightPanel.handleSaveFlightSubmit
 * 
 * This component exists for potential alternative save workflows but is not
 * connected to the main UI. Any automation/reload functionality should be
 * implemented in RightPanel.jsx instead.
 * 
 * Creates a button that sends the current route data to Palantir to create a new flight
 * and optionally runs automation on the newly created flight
 * Now using RegionContext for region management
 */
const SaveFlightButton = ({ 
  selectedAircraft, 
  waypoints, 
  routeStats,
  onSuccess,
  onError,
  onFlightLoad = () => {}, // Callback to reload flight after automation
  toggleWaypointMode = () => {}, // Function to toggle waypoint mode
  waypointModeActive = false, // Current waypoint mode state
  runAutomation = true, // New prop to determine if automation should run after save
  ...props // Add rest parameter to capture style and other props
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [savedFlightId, setSavedFlightId] = useState(null);
  const [showAutomationLoader, setShowAutomationLoader] = useState(false);
  const [automationFlightData, setAutomationFlightData] = useState(null);
  
  // Note: This component is not currently used in the main application flow
  
  // Access the panel context for card navigation
  const panelContext = usePanelContext();
  
  // Get current region from context
  const { currentRegion } = useRegion();
  
  const handleButtonClick = () => {
    // Use the panel context to change to the saveflight card
    if (panelContext && panelContext.handleCardChange) {
      console.log('SaveFlightButton: Using panel context to switch to saveflight card');
      panelContext.handleCardChange('saveflight');
    } else {
      console.log('SaveFlightButton: Panel context not available, falling back to modal');
      // Fallback to modal if the context is not available
      openModal();
    }
  };
  
  // Open the modal (fallback)
  const openModal = () => {
    setShowModal(true);
  };
  
  // Close the modal
  const closeModal = () => {
    setShowModal(false);
  };

  /**
   * Run a diagnostic test on the API connection
   * This helps identify what's causing the 400 Bad Request error
   */
  const runDiagnosticMode = async () => {
    try {
      setIsSaving(true);
      
      // Alert the user
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Running API diagnostics...');
      }
      
      // Use the improved diagnostic method from PalantirFlightService
      const success = await PalantirFlightService.runDiagnostic();
      
      // Show appropriate message based on result
      if (success) {
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator('Diagnostic test successful! The API is working correctly.', 'success');
        }
        
        // Display a more visible success message
        const successMessage = document.createElement('div');
        successMessage.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #28a745;
          color: white;
          padding: 15px 25px;
          border-radius: 5px;
          z-index: 10000;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          max-width: 80%;
          text-align: center;
          font-weight: bold;
        `;
        successMessage.textContent = 'API Diagnostic Successful! The flight creation API is working.';
        document.body.appendChild(successMessage);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 5000);
      } else {
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator('Diagnostic test failed. See console for details.', 'error');
        }
      }
      
      return success;
    } catch (error) {
      console.error('Diagnostic mode error:', error);
      
      // Format the error for display
      const errorMessage = `API Diagnostic Error: ${error.message || 'Unknown error'}`;
      
      // Show the user what happened
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
      
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Run automation on the saved flight
   * @param {string} flightId - The ID of the flight to automate
   * @param {Object} flightData - Flight data for the loader display
   */
  const runFlightAutomation = async (flightId, flightData = null) => {
    if (!flightId) {
      console.error('Cannot run automation: No flight ID provided');
      return;
    }
    
    try {
      setIsAutomating(true);
      
      // Extract flight details for the loader
      const departureIcao = waypoints?.[0]?.name || 'DEP';
      const destinationIcao = waypoints?.[waypoints.length - 1]?.name || 'DEST';
      const flightNumber = flightData?.flightName || `Flight ${flightId.slice(-6)}`;
      
      // Store flight data for loader
      setAutomationFlightData({
        flightNumber,
        departureIcao,
        destinationIcao
      });
      
      // Show professional automation loader instead of basic loading indicator
      console.log('🚀 AUTOMATION LOADER: Setting showAutomationLoader to TRUE');
      setShowAutomationLoader(true);
      console.log('🚀 AUTOMATION LOADER: State set, loader should be visible now');
      
      // Update loading indicator (fallback for users who might see it)
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Running flight automation...');
      }
      
      // Call the automation service
      const result = await AutomationService.runAutomation(flightId);
      
      console.log('Automation successful!', result);
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Flight automation completed successfully', 'success');
      }
      
      // Note: Auto-reload functionality has been moved to RightPanel.jsx
      // This SaveFlightButton is NOT currently used in the main application flow
      // The actual save flight functionality is handled by SaveFlightCard → RightPanel.handleSaveFlightSubmit
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(`Flight saved and automated successfully`);
      }
      
    } catch (error) {
      console.error('Error running automation:', error);
      
      // Format error message
      const errorMessage = AutomationService.formatErrorMessage(error);
      
      // Show error in UI
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Flight saved but automation failed: ${errorMessage}`, 'warning');
      }
      
      // We don't call onError since the flight was saved successfully, just automation failed
      // Instead, show a warning message
      const warningContainer = document.createElement('div');
      warningContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ffc107;
        color: black;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        max-width: 80%;
        text-align: center;
        font-weight: bold;
      `;
      warningContainer.textContent = `Flight saved successfully, but automation failed: ${errorMessage}`;
      document.body.appendChild(warningContainer);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (document.body.contains(warningContainer)) {
          document.body.removeChild(warningContainer);
        }
      }, 8000);
    } finally {
      setIsAutomating(false);
      // Hide automation loader
      setShowAutomationLoader(false);
      setAutomationFlightData(null);
    }
  };
  
  /**
   * Handle automation loader completion
   */
  const handleAutomationComplete = () => {
    console.log('🎉 FlightAutomationLoader completed, hiding loader');
    setShowAutomationLoader(false);
    setAutomationFlightData(null);
  };

  /**
   * Handles the flight data submitted from the modal
   * @param {Object} flightData - The flight data from the modal form
   */
  const handleFlightFormSubmit = async (flightData) => {
    console.log('=== SAVE FLIGHT DEBUG START ===');
    console.log('selectedAircraft:', selectedAircraft);
    console.log('waypoints received:', waypoints);
    console.log('waypoints.length:', waypoints ? waypoints.length : 'undefined/null');
    console.log('=== SAVE FLIGHT DEBUG END ===');
    
    if (!selectedAircraft || !waypoints || waypoints.length < 2) {
      onError('Cannot save flight: Missing aircraft or waypoints');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Update loading indicator if available
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Saving flight to Palantir...');
      }
      
      // Get the region code from context
      const regionCode = currentRegion?.osdkRegion || "NORWAY";
      
      // DEBUG: Critical region debugging
      console.log('🌍 REGION DEBUG:', {
        currentRegion,
        regionCode,
        osdkRegion: currentRegion?.osdkRegion,
        regionName: currentRegion?.name
      });
      
      // DEBUG: Let's see what properties each waypoint actually has
      console.log('=== WAYPOINT DEBUG INFO ===');
      waypoints.forEach((wp, index) => {
        console.log(`Waypoint ${index} (${wp.name}):`, {
          name: wp.name,
          type: wp.type,
          pointType: wp.pointType,
          isWaypoint: wp.isWaypoint,
          coords: wp.coords,
          id: wp.id
        });
      });
      console.log('=== END WAYPOINT DEBUG ===');
      
      // Get waypoint locations for the API - ONLY include landing stops (rigs/airports), NOT navigation waypoints
      const locations = waypoints
        .filter(wp => {
          // Use the SAME logic as the left panel to determine waypoint type
          const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
          
          // Debug: Log waypoint properties to understand classification
          console.log(`Filtering ${wp.name}: isWaypoint=${wp.isWaypoint}, type=${wp.type}, classified as waypoint=${isWaypointType}`);
          
          // Only include in locations if it's NOT a waypoint (i.e., it's a landing stop)
          return !isWaypointType;
        })
        .map(wp => {
          // Clean up location names - trim whitespace to avoid issues
          const locationName = wp.name ? wp.name.trim() : `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
          return locationName;
        });
      
      // Format the ETD for Palantir
      const etdTimestamp = new Date(flightData.etd).toISOString();
      
      // CRITICAL FIX: Use the aircraft tail number (rawRegistration) first, then assetId as fallback
      // The automation expects the aircraft's tail number to look up the aircraft in the system
      const finalAircraftId = selectedAircraft.rawRegistration || selectedAircraft.assetId || "190";
      
      // Debug output of IDs to help find issues
      console.log('OSDK Flight Creation - Debug Data:', {
        aircraftId: finalAircraftId, // This is what we're actually sending to the API
        rawReg: selectedAircraft.rawRegistration,
        displayReg: selectedAircraft.registration,
        aircraftAssetId: selectedAircraft.assetId || '(none)',
        usingRawRegistration: !!selectedAircraft.rawRegistration,
        captainId: flightData.captainId,
        copilotId: flightData.copilotId,
        regionCode: regionCode
      });
      
      // DEBUG: Check what waypoints we actually have
      console.log('Total waypoints received:', waypoints ? waypoints.length : 'undefined/null');
      console.log('Waypoints array:', waypoints);
      
      // DEBUG: Let's see what properties each waypoint actually has
      if (waypoints && waypoints.length > 0) {
        console.log('=== WAYPOINT DEBUG INFO ===');
        waypoints.forEach((wp, index) => {
          console.log(`Waypoint ${index} (${wp.name}):`, {
            name: wp.name,
            type: wp.type,
            pointType: wp.pointType,
            isWaypoint: wp.isWaypoint,
            coords: wp.coords,
            id: wp.id
          });
        });
        console.log('=== END WAYPOINT DEBUG ===');
        
        // Prepare waypoints with leg structure - ONLY include navigation waypoints, NOT stops
        // Filter out stops/landing points before sending to Palantir
        const navigationWaypoints = waypoints.filter(wp => {
          // Use the SAME logic as the left panel to determine waypoint type
          const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
          
          // Debug: Log waypoint properties to understand classification
          console.log(`Filtering waypoint ${wp.name}: isWaypoint=${wp.isWaypoint}, type=${wp.type}, classified as navigation waypoint=${isWaypointType}`);
          
          // Only include if it's a NAVIGATION waypoint (not a landing stop)
          return isWaypointType;
        });
        
        console.log(`Filtered ${waypoints.length} total waypoints down to ${navigationWaypoints.length} navigation waypoints`);
        
        // Group waypoints by leg if available, otherwise put all in leg 0
        // CRITICAL FIX: Include waypoint type information to distinguish navigation waypoints from stops
        var waypointsWithLegs = navigationWaypoints.map((wp, index) => {
          return {
            legIndex: wp.legIndex || 0,
            name: wp.name || `Waypoint ${index + 1}`,
            coords: wp.coords,
            id: wp.id,
            // IMPORTANT: Include type classification properties so Palantir knows these are waypoints, not stops
            type: wp.type,
            pointType: wp.pointType,
            isWaypoint: wp.isWaypoint
          };
        });
      } else {
        console.log('No waypoints provided - this should result in displayWaypoints: null');
        const waypointsWithLegs = [];
      }
      
      // Prepare parameters for the API
      const apiParams = {
        // Basic parameters
        flightName: flightData.flightName,
        aircraftRegion: regionCode,
        aircraftId: finalAircraftId,
        region: regionCode,
        etd: etdTimestamp,
        locations: locations,
        alternateLocation: flightData.alternateLocation || "",
        
        // Add flight ID if this is an update (flight already exists)
        ...(flightData.flightId ? { flightId: flightData.flightId } : {}),
        
        // Structured waypoints for the API
        waypoints: waypointsWithLegs,
        
        // Waypoint handling preference
        useOnlyProvidedWaypoints: flightData.useOnlyProvidedWaypoints || false,
        
        // Crew member IDs
        captainId: flightData.captainId || null,
        copilotId: flightData.copilotId || null,
        medicId: flightData.medicId || null,
        soId: flightData.soId || null,
        rswId: flightData.rswId || null
      };
      
      console.log('Sending flight data to Palantir:', apiParams);
      
      // First try the diagnostic to make sure the API is working
      const diagnosticResult = await PalantirFlightService.runDiagnostic();
      console.log('Diagnostic test result:', diagnosticResult);
      
      // Then call the service with our actual parameters
      const result = await PalantirFlightService.createFlight(apiParams);
      console.log('Flight creation result:', result);
      
      // Check if the result is successful
      if (PalantirFlightService.isSuccessfulResult(result)) {
        // Extract the flight ID
        const flightId = PalantirFlightService.extractFlightId(result);
        
        // Set the saved flight ID to state
        setSavedFlightId(flightId);
        
        // Log success details
        console.log(`Flight created successfully with ID: ${flightId}`);
        
        // Display a more visible success message in the UI
        const successContainer = document.createElement('div');
        successContainer.className = 'api-success-notification';
        successContainer.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          background-color: #28a745;
          color: white;
          padding: 15px 25px;
          border-radius: 5px;
          z-index: 10000;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          max-width: 80%;
          text-align: center;
          font-weight: bold;
        `;
        successContainer.textContent = `Flight "${flightData.flightName}" created successfully!`;
        
        // Add a close button to the success message
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
          position: absolute;
          top: 5px;
          right: 10px;
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
        `;
        closeButton.onclick = () => document.body.removeChild(successContainer);
        successContainer.appendChild(closeButton);
        
        // Add to body
        document.body.appendChild(successContainer);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (document.body.contains(successContainer)) {
            document.body.removeChild(successContainer);
          }
        }, 5000);
        
        // Close the modal
        closeModal();
        
        // Run automation if enabled and if we have a user choice from the modal
        if (flightData.runAutomation !== undefined ? flightData.runAutomation : runAutomation) {
          if (flightId && flightId !== 'Unknown ID') {
            console.log('Running automation for flight ID:', flightId);
            // Add a slight delay to ensure flight creation is fully processed on the server
            setTimeout(async () => {
              try {
                console.log('🚀 SAVE FLIGHT: About to call runFlightAutomation with:', { flightId, flightData: !!flightData });
                await runFlightAutomation(flightId, flightData);
                console.log('🚀 SAVE FLIGHT: runFlightAutomation completed successfully');
              } catch (automationError) {
                console.error('🚀 SAVE FLIGHT: runFlightAutomation failed:', automationError);
                // Show error to user
                if (window.LoadingIndicator) {
                  window.LoadingIndicator.updateStatusIndicator(`Automation failed: ${automationError.message}`, 'error');
                }
              }
            }, 1000);
          } else {
            console.log('No valid flight ID available for automation, got:', flightId);
            
            // Show warning to user
            const warningContainer = document.createElement('div');
            warningContainer.style.cssText = `
              position: fixed;
              top: 20px;
              left: 50%;
              transform: translateX(-50%);
              background-color: #ffc107;
              color: black;
              padding: 15px 25px;
              border-radius: 5px;
              z-index: 10000;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              max-width: 80%;
              text-align: center;
              font-weight: bold;
            `;
            warningContainer.textContent = `Flight saved successfully, but automation couldn't be run: Could not extract a valid flight ID`;
            document.body.appendChild(warningContainer);
            
            // Auto-remove after 8 seconds
            setTimeout(() => {
              if (document.body.contains(warningContainer)) {
                document.body.removeChild(warningContainer);
              }
            }, 8000);
            
            // Still call success since the flight was saved
            if (onSuccess) {
              onSuccess(`Flight "${flightData.flightName}" created successfully (ID unavailable for automation)`);
            }
          }
        } else {
          console.log('Automation not enabled for this flight');
          if (onSuccess) {
            onSuccess(`Flight "${flightData.flightName}" created successfully with ID: ${flightId}`);
          }
        }
      } else {
        console.error('Invalid response from server:', result);
        throw new Error('Flight creation failed: Invalid response from server');
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      
      // Format the error message using the service
      const errorMessage = PalantirFlightService.formatErrorMessage(error);
      
      // Display a more visible error message in the UI
      const errorContainer = document.createElement('div');
      errorContainer.className = 'api-error-notification';
      errorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #ff4c4c;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        max-width: 80%;
        text-align: center;
        font-weight: bold;
      `;
      errorContainer.textContent = errorMessage;
      
      // Add a close button to the error message
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
      `;
      closeButton.onclick = () => document.body.removeChild(errorContainer);
      errorContainer.appendChild(closeButton);
      
      // Add to body
      document.body.appendChild(errorContainer);
      
      // Auto-remove after 8 seconds
      setTimeout(() => {
        if (document.body.contains(errorContainer)) {
          document.body.removeChild(errorContainer);
        }
      }, 8000);
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
      
      if (onError) {
        onError(errorMessage);
      }
      
      // Show a special message for 400 errors (likely due to API data format issues)
      if (error.message && error.message.includes('400')) {
        console.log('Detailed API error info to help debug the 400 Bad Request:');
        console.log('This might be due to incorrect field formatting or missing required fields.');
        console.log('Check the API documentation for exact field requirements.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Check if we can save a flight (have aircraft and 2+ waypoints)
  const canSaveFlight = selectedAircraft && waypoints && waypoints.length >= 2;
  
  // Button style for main button - match the app's existing styles
  const buttonStyle = {
    backgroundColor: canSaveFlight ? '#038dde' : '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: canSaveFlight ? 'pointer' : 'not-allowed',
    fontSize: '14px',
    margin: '0 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'normal',
    height: '32px'
  };
  
  // Status indicator text - based on the current state
  let buttonText = 'Save Flight';
  if (isSaving) {
    buttonText = 'Saving...';
  } else if (isAutomating) {
    buttonText = 'Automating...';
  }
  
  return (
    <>
      <button 
        style={{...buttonStyle, ...props.style}}
        onClick={handleButtonClick}
        disabled={!canSaveFlight || isSaving || isAutomating}
        title={canSaveFlight ? 'Save route to Palantir as a flight' : 'Select aircraft and add waypoints to save flight'}
        className="control-button"
      >
        {(isSaving || isAutomating) && (
          <span 
            className="spinner" 
            style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '50%',
              borderTopColor: 'white',
              animation: 'spin 1s ease-in-out infinite',
              marginRight: '8px'
            }}
          />
        )}
        {buttonText}
      </button>
      
      {/* Professional Flight Automation Loader */}
      <FlightAutomationLoader
        isVisible={showAutomationLoader}
        flightNumber={automationFlightData?.flightNumber}
        departureIcao={automationFlightData?.departureIcao}
        destinationIcao={automationFlightData?.destinationIcao}
        onComplete={handleAutomationComplete}
      />
      
      {/* REMOVED: SaveFlightModal - now using SaveFlightCard in RightPanel instead */}
      
      {/* Add loading animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

/**
 * Exported function for saving flight data without UI
 * This can be imported by other components that need to save flights
 */
export const saveFlightData = async (
  flightData,
  selectedAircraft,
  waypoints,
  routeStats,
  runAutomation = false,
  onSuccess = () => {},
  onError = () => {}
) => {
  if (!selectedAircraft || !waypoints || waypoints.length < 2) {
    const error = 'Cannot save flight: Missing aircraft or waypoints';
    onError(error);
    throw new Error(error);
  }
  
  try {
    // Import required services
    const PalantirFlightService = (await import('../../services/PalantirFlightService')).default;
    
    // Update loading indicator if available
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator('Saving flight...');
    }
    
    // Get waypoint locations for the API - ONLY include landing stops (rigs/airports), NOT navigation waypoints
    const locations = waypoints
      .filter(wp => {
        // Use the SAME logic as the left panel to determine waypoint type
        const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
        // Only include in locations if it's NOT a waypoint (i.e., it's a landing stop)
        return !isWaypointType;
      })
      .map(wp => {
        // Clean up location names - trim whitespace to avoid issues
        const locationName = wp.name ? wp.name.trim() : `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
        return locationName;
      });
    
    // Format the ETD for Palantir
    const etdTimestamp = new Date(flightData.etd).toISOString();
    
    // Use the aircraft tail number (rawRegistration) first, then assetId as fallback
    const finalAircraftId = selectedAircraft.rawRegistration || selectedAircraft.assetId || "190";
    
    // Filter navigation waypoints
    const navigationWaypoints = waypoints.filter(wp => {
      const isWaypointType = wp.isWaypoint === true || wp.type === 'WAYPOINT';
      return isWaypointType;
    });
    
    // Group waypoints by leg if available, otherwise put all in leg 0
    const waypointsWithLegs = navigationWaypoints.map((wp, index) => {
      return {
        legIndex: wp.legIndex || 0,
        name: wp.name || `Waypoint ${index + 1}`,
        coords: wp.coords,
        id: wp.id,
        type: wp.type,
        pointType: wp.pointType,
        isWaypoint: wp.isWaypoint
      };
    });
    
    // Prepare parameters for the API
    const apiParams = {
      // Basic parameters
      flightName: flightData.flightName,
      aircraftRegion: "NORWAY", // Default region
      aircraftId: finalAircraftId,
      region: "NORWAY", // Default region
      etd: etdTimestamp,
      locations: locations,
      alternateLocation: flightData.alternateLocation || "",
      
      // Add flight ID if this is an update (flight already exists)
      ...(flightData.flightId ? { flightId: flightData.flightId } : {}),
      
      // Structured waypoints for the API
      waypoints: waypointsWithLegs,
      
      // Waypoint handling preference
      useOnlyProvidedWaypoints: flightData.useOnlyFastPlannerWaypoints || false,
      
      // Crew member IDs
      captainId: flightData.captainId || null,
      copilotId: flightData.copilotId || null,
      medicId: flightData.medicId || null,
      soId: flightData.soId || null,
      rswId: flightData.rswId || null
    };
    
    console.log('Sending flight data to Palantir:', apiParams);
    
    // Call the service to create the flight
    const result = await PalantirFlightService.createFlight(apiParams);
    console.log('Flight creation result:', result);
    
    // Check if the result is successful
    if (PalantirFlightService.isSuccessfulResult(result)) {
      // Extract the flight ID
      const flightId = PalantirFlightService.extractFlightId(result);
      
      console.log(`Flight created successfully with ID: ${flightId}`);
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Flight "${flightData.flightName}" saved successfully!`, 'success');
      }
      
      // Call success callback
      onSuccess(`Flight "${flightData.flightName}" saved successfully`);
      
      return {
        success: true,
        flightId: flightId,
        message: `Flight "${flightData.flightName}" saved successfully`
      };
    } else {
      console.error('Invalid response from server:', result);
      throw new Error('Flight creation failed: Invalid response from server');
    }
  } catch (error) {
    console.error('Error creating flight:', error);
    
    // Format the error message
    const errorMessage = `Failed to save flight: ${error.message}`;
    
    // Update loading indicator with error
    if (window.LoadingIndicator) {
      window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
    }
    
    onError(errorMessage);
    throw error;
  }
};

export default SaveFlightButton;