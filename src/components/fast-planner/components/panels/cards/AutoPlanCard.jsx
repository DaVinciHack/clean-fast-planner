import React, { useEffect, useRef } from 'react';

/**
 * Auto Plan Card Component
 * 
 * The "magic button" - combines Save Flight + Run Automation in one click
 * Special styling: Dark grey background with green border
 */
const AutoPlanCard = ({
  id,
  onAutoPlan,
  waypoints = [],
  selectedAircraft,
  isProcessing = false,
  flightId = null
}) => {
  const cardRef = useRef(null);
  
  // Listen for the triggerAutoPlan event from the AutoPlanButton
  useEffect(() => {
    const handleTriggerAutoPlan = (event) => {
      console.log('🎯 AUTO PLAN CARD: Received triggerAutoPlan event:', event.detail);
      // Automatically trigger the auto plan action
      onAutoPlan(event.detail);
    };
    
    const cardElement = cardRef.current;
    if (cardElement) {
      cardElement.addEventListener('triggerAutoPlan', handleTriggerAutoPlan);
      return () => {
        cardElement.removeEventListener('triggerAutoPlan', handleTriggerAutoPlan);
      };
    }
  }, [onAutoPlan]);
  
  const handleAutoPlan = () => {
    if (isProcessing || !selectedAircraft) return;
    
    // Determine logic based on flight state
    const isNewFlight = !flightId;
    const hasWaypoints = waypoints && waypoints.length > 0;
    
    console.log('🎯 AUTO PLAN:', { isNewFlight, hasWaypoints, waypointCount: waypoints.length });
    
    onAutoPlan({
      isNewFlight,
      hasWaypoints,
      skipWaypointGeneration: hasWaypoints // If user added waypoints, don't let Palantir add more
    });
  };

  // Determine button state and text
  const getButtonState = () => {
    if (isProcessing) return { text: 'Processing...', disabled: true };
    if (!selectedAircraft) return { text: 'Select Aircraft First', disabled: true };
    
    const isNewFlight = !flightId;
    const hasWaypoints = waypoints && waypoints.length > 0;
    
    if (isNewFlight) {
      if (hasWaypoints) {
        return { text: 'Auto Plan Route', disabled: false };
      } else {
        return { text: 'Auto Plan Flight', disabled: false };
      }
    } else {
      return { text: 'Run Automation', disabled: false };
    }
  };

  const buttonState = getButtonState();

  return (
    <div className="card-container" id={id} ref={cardRef}>
      <div className="card">
        <div className="card-header">
          <h3>Auto Plan</h3>
          <p className="card-subtitle">Save + Automation in One Click</p>
        </div>
        
        <div className="card-body">
          <div className="auto-plan-content">
            <p className="auto-plan-description">
              {!flightId ? 
                (waypoints.length > 0 ? 
                  'Save your planned route and run automation' : 
                  'Let Palantir plan your route automatically'
                ) : 
                'Run automation on saved flight'
              }
            </p>
            
            {/* Flight Status Info */}
            <div className="flight-status-info">
              <div className="status-item">
                <span className="status-label">Flight:</span>
                <span className="status-value">{flightId ? 'Saved' : 'New'}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Waypoints:</span>
                <span className="status-value">{waypoints.length}</span>
              </div>
              <div className="status-item">
                <span className="status-label">Aircraft:</span>
                <span className="status-value">{selectedAircraft?.registration || 'None'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-footer">
          <button
            className="auto-plan-button"
            onClick={handleAutoPlan}
            disabled={buttonState.disabled}
          >
            {isProcessing && <span className="spinner"></span>}
            <span>{buttonState.text}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoPlanCard;