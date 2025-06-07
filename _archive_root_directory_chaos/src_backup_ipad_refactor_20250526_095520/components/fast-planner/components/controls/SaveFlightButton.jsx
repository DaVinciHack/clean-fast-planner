import React, { useState } from 'react';
import SaveFlightModal from './SaveFlightModal';
import PalantirFlightService from '../../services/PalantirFlightService';
import AutomationService from '../../services/AutomationService';
import { usePanelContext } from '../../context/PanelContext';
import { useRegion } from '../../context/region';

/**
 * SaveFlightButton Component
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
  runAutomation = true, // New prop to determine if automation should run after save
  ...props // Add rest parameter to capture style and other props
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [savedFlightId, setSavedFlightId] = useState(null);
  
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
   */
  const runFlightAutomation = async (flightId) => {
    if (!flightId) {
      console.error('Cannot run automation: No flight ID provided');
      return;
    }
    
    try {
      setIsAutomating(true);
      
      // Update loading indicator
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
    }
  };

  /**
   * Handles the flight data submitted from the modal
   * @param {Object} flightData - The flight data from the modal form
   */
  const handleFlightFormSubmit = async (flightData) => {
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
      
      // Get waypoint locations for the API - clean up whitespace
      const locations = waypoints.map(wp => {
        // Clean up location names - trim whitespace to avoid issues
        const locationName = wp.name ? wp.name.trim() : `${wp.coords[1].toFixed(6)},${wp.coords[0].toFixed(6)}`;
        return locationName;
      });
      
      // Format the ETD for Palantir
      const etdTimestamp = new Date(flightData.etd).toISOString();
      
      // We need to use the numeric ID which we've confirmed works
      // The assetId is likely the correct field based on our testing
      const finalAircraftId = selectedAircraft.assetId || "190"; // Fallback to 190 if assetId isn't available
      
      // Debug output of IDs to help find issues
      console.log('OSDK Flight Creation - Debug Data:', {
        aircraftId: finalAircraftId, // We'll use this value directly
        rawReg: selectedAircraft.rawRegistration,
        displayReg: selectedAircraft.registration,
        aircraftAssetId: selectedAircraft.assetId || '(none)',
        captainId: flightData.captainId,
        copilotId: flightData.copilotId,
        regionCode: regionCode
      });
      
      // Prepare waypoints with leg structure
      // Group waypoints by leg if available, otherwise put all in leg 0
      const waypointsWithLegs = waypoints.map((wp, index) => {
        return {
          legIndex: wp.legIndex || 0,
          name: wp.name || `Waypoint ${index + 1}`,
          coords: wp.coords,
          id: wp.id
        };
      });
      
      // Prepare parameters for the new createFlightWithWaypoints function
      const apiParams = {
        // Basic parameters
        flightName: flightData.flightName,
        aircraftRegion: regionCode,
        aircraftId: finalAircraftId,
        region: regionCode,
        etd: etdTimestamp,
        locations: locations,
        alternateLocation: flightData.alternateLocation || "",
        
        // Structured waypoints for the new API
        waypoints: waypointsWithLegs,
        
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
            setTimeout(() => {
              runFlightAutomation(flightId);
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
      
      {/* Using our modular SaveFlightModal component */}
      <SaveFlightModal 
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleFlightFormSubmit}
        isSaving={isSaving || isAutomating}
        waypoints={waypoints}
        onRunDiagnostic={runDiagnosticMode}
        runAutomation={runAutomation} // Pass runAutomation flag to modal
      />
      
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

export default SaveFlightButton;