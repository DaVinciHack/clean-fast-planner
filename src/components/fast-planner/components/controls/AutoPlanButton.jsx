import React, { useState } from 'react';

/**
 * Auto Plan Button Component
 * 
 * The magic button that combines Save Flight + Run Automation
 * Styled with dark grey background and green border
 */
const AutoPlanButton = ({
  selectedAircraft,
  waypoints = [],
  flightId = null,
  style = {},
  onSuccess,
  onError,
  onAutoPlan, // Function to call when Auto Plan is clicked
  className = ""
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async () => {
    console.log('🎯 AUTO PLAN BUTTON: Click attempted', {
      isProcessing,
      hasAircraft: !!selectedAircraft,
      aircraftReg: selectedAircraft?.registration,
      waypointCount: waypoints.length,
      disabled: buttonState.disabled
    });
    
    if (isProcessing || !selectedAircraft) return;
    
    console.log('🎯 AUTO PLAN BUTTON: Clicked - proceeding');
    setIsProcessing(true);
    
    try {
      // Determine the auto plan parameters
      const isNewFlight = !flightId;
      const hasWaypoints = waypoints && waypoints.length > 0;
      const skipWaypointGeneration = hasWaypoints; // If user added waypoints, don't let Palantir add more
      
      const autoPlanData = {
        isNewFlight,
        hasWaypoints,
        skipWaypointGeneration
      };
      
      console.log('🎯 AUTO PLAN BUTTON: Auto plan data:', autoPlanData);
      
      // Call the onAutoPlan function directly
      if (onAutoPlan) {
        await onAutoPlan(autoPlanData);
      } else {
        console.error('🎯 AUTO PLAN BUTTON: onAutoPlan function not provided');
      }
    } catch (error) {
      console.error('🎯 AUTO PLAN BUTTON: Error:', error);
      
      // Enhanced error handling with user-friendly messages
      let userMessage = 'Auto Plan failed';
      let actionAdvice = '';
      
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          userMessage = 'Authentication expired';
          actionAdvice = 'Please log in again and try Auto Plan';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
          userMessage = 'Connection problem';
          actionAdvice = 'Check your internet connection and try again';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          userMessage = 'Invalid flight data';
          actionAdvice = 'Check your aircraft selection and waypoints, then try again';
        } else if (error.message.includes('Flight ID is required')) {
          userMessage = 'Flight save failed';
          actionAdvice = 'Unable to create flight - try the manual Save Flight button instead';
        } else {
          userMessage = `Auto Plan failed: ${error.message}`;
          actionAdvice = 'Try using the manual Save Flight and Run Automation separately';
        }
      }
      
      // Create detailed error message for LoadingIndicator
      const detailedMessage = actionAdvice ? 
        `${userMessage}. ${actionAdvice}` : 
        userMessage;
      
      if (onError) {
        onError(detailedMessage);
      }
      
      // Also show a console group for developer debugging
      console.group('🎯 AUTO PLAN ERROR DETAILS');
      console.error('Original error:', error);
      console.log('User message:', userMessage);
      console.log('Action advice:', actionAdvice);
      console.log('Auto Plan data was:', { isNewFlight: !flightId, hasWaypoints: waypoints && waypoints.length > 0 });
      console.groupEnd();
    } finally {
      setIsProcessing(false);
    }
  };

  // Determine button state
  const getButtonState = () => {
    if (isProcessing) return { text: 'Processing...', disabled: true };
    
    return { 
      text: 'Auto Plan', 
      disabled: !selectedAircraft // Disabled if no aircraft selected
    };
  };

  const buttonState = getButtonState();
  
  // Debug the button state
  console.log('🎯 AUTO PLAN BUTTON: State debug', {
    selectedAircraft: !!selectedAircraft,
    aircraftReg: selectedAircraft?.registration,
    isProcessing,
    buttonText: buttonState.text,
    buttonDisabled: buttonState.disabled,
    waypointCount: waypoints.length,
    flightId
  });
  
  // Define flight state variables for use in title
  const isNewFlight = !flightId;
  const hasWaypoints = waypoints && waypoints.length > 0;

  return (
    <button
      className={`control-button ${className}`}
      style={{
        ...style
      }}
      onClick={handleClick}
      disabled={buttonState.disabled}
      title={isNewFlight ? 
        (hasWaypoints ? 
          'Save your route and run automation' : 
          'Let Palantir plan your route automatically'
        ) : 
        'Run automation on saved flight'
      }
    >
      {isProcessing && <span className="spinner"></span>}
      {!isProcessing && <span style={{ marginRight: '4px' }}>⚡</span>}
      <span>{buttonState.text}</span>
    </button>
  );
};

export default AutoPlanButton;