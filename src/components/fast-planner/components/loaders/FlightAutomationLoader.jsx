import React, { useState, useEffect, useCallback } from 'react';
import './FlightAutomationLoader.css';

/**
 * FlightAutomationLoader - Professional aviation automation progress display
 * Shows real Palantir messages and responds to actual automation completion
 */
const FlightAutomationLoader = ({ 
  isVisible, 
  flightNumber, 
  departureIcao, 
  destinationIcao,
  onComplete,
  onProgressUpdate = null // New prop for receiving real automation progress
}) => {
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentDetail, setCurrentDetail] = useState('');
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [automationSteps, setAutomationSteps] = useState([]);

  // Initialize default state
  const initializeDefaultState = () => {
    setCurrentMessage('Preparing automation...');
    setCurrentDetail('Initializing Palantir flight automation system');
    setProgress(0);
    setIsCompleted(false);
    setHasError(false);
    setErrorMessage('');
    setAutomationSteps([]);
  };

  // Handle progress updates from external automation
  const handleProgressUpdate = useCallback((progressData) => {
    console.log('🚀 FlightAutomationLoader: Received progress update:', progressData);
    
    const { type, message, detail, progress: newProgress, result, error } = progressData;
    
    // Add this step to our history
    setAutomationSteps(prevSteps => {
      const newStep = {
        id: Date.now(),
        message,
        detail,
        progress: newProgress,
        type,
        timestamp: new Date()
      };
      
      // If this is a success step, mark the previous step as completed
      if (type === 'step' && prevSteps.length > 0) {
        const updatedSteps = [...prevSteps];
        const lastStep = updatedSteps[updatedSteps.length - 1];
        if (lastStep.type === 'step') {
          lastStep.type = 'success'; // Mark previous step as completed
        }
        return [...updatedSteps, newStep];
      }
      
      return [...prevSteps, newStep];
    });
    
    // Update current display
    setCurrentMessage(message);
    setCurrentDetail(detail);
    setProgress(newProgress);
    
    // Handle different types of updates
    switch (type) {
      case 'completed':
        setIsCompleted(true);
        // Mark the final step as completed
        setAutomationSteps(prevSteps => {
          if (prevSteps.length > 0) {
            const updatedSteps = [...prevSteps];
            const lastStep = updatedSteps[updatedSteps.length - 1];
            if (lastStep.type === 'step') {
              lastStep.type = 'completed';
            }
            return updatedSteps;
          }
          return prevSteps;
        });
        // Auto-complete after showing success message briefly
        setTimeout(() => {
          onComplete?.();
        }, 2000); // Give user time to see completion message
        break;
        
      case 'error':
        setHasError(true);
        setErrorMessage(detail);
        // Auto-close after showing error
        setTimeout(() => {
          onComplete?.();
        }, 4000); // Give more time to read error
        break;
        
      default:
        // Regular step updates
        break;
    }
  }, [onComplete]); // Only depend on onComplete

  // Set up progress update handler - only once when component mounts
  useEffect(() => {
    if (onProgressUpdate) {
      onProgressUpdate(handleProgressUpdate);
    }
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    console.log('🚀 FlightAutomationLoader useEffect triggered:', { isVisible, flightNumber, departureIcao, destinationIcao });
    if (!isVisible) {
      console.log('🚀 FlightAutomationLoader: Not visible, returning early');
      // RESET STATE: Always reset when becoming invisible
      initializeDefaultState();
      return;
    }
    
    console.log('🚀 FlightAutomationLoader: Starting automation display');
    
    // FRESH START: Always reset state when starting new display
    initializeDefaultState();
    
    // No more fixed timers - we now respond to real progress updates
    
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }
  
  console.log('🚀 FlightAutomationLoader: Rendering loader with props:', { 
    isVisible, 
    flightNumber, 
    departureIcao, 
    destinationIcao,
    currentMessage,
    progress,
    isCompleted,
    hasError 
  });

  return (
    <div className="flight-automation-overlay">
      <div className="flight-automation-popup">
        {/* Current Step Display */}
        <div className={`current-step ${hasError ? 'error' : isCompleted ? 'completed' : 'active'}`}>
          <div className="step-info">
            <h3>
              {hasError && <span style={{marginRight: '8px'}}>❌</span>}
              {isCompleted && <span style={{marginRight: '8px'}}>✅</span>}
              {!hasError && !isCompleted && <span style={{marginRight: '8px'}}>⚡</span>}
              {currentMessage || 'Preparing automation...'}
            </h3>
            <p>{currentDetail || 'Initializing Palantir flight automation system'}</p>
            {hasError && errorMessage && (
              <p style={{color: '#ff6b6b', fontSize: '0.9em', marginTop: '8px'}}>
                {errorMessage}
              </p>
            )}
            <div className="step-progress">
              <div 
                className="step-progress-bar"
                style={{ 
                  width: `${progress}%`,
                  background: hasError ? '#ff6b6b' : isCompleted ? '#22c55e' : 'linear-gradient(90deg, #1e8ffe, #3ba0ff)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Flight Information */}
        {flightNumber && (
          <div className="flight-info">
            <div className="flight-details">
              <span>Flight: {flightNumber}</span>
              {departureIcao && destinationIcao && (
                <span>{departureIcao} → {destinationIcao}</span>
              )}
            </div>
          </div>
        )}

        {/* Real Automation Steps History */}
        <div className="steps-list">
          {automationSteps.length > 0 ? (
            automationSteps.map((step, index) => (
              <div 
                key={step.id}
                className={`step-item ${
                  step.type === 'error' ? 'error' : 
                  step.type === 'completed' || step.type === 'success' ? 'completed' : 
                  'active'
                }`}
              >
                <div className="step-marker">
                  {step.type === 'error' ? (
                    <div className="step-error">❌</div>
                  ) : step.type === 'completed' || step.type === 'success' ? (
                    <div className="step-checkmark">✓</div>
                  ) : (
                    <div className="step-loader"></div>
                  )}
                </div>
                <div className="step-content">
                  <span className="step-name">{step.message}</span>
                  {step.detail && (
                    <span className="step-detail">{step.detail}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="step-item active">
              <div className="step-marker">
                <div className="step-loader"></div>
              </div>
              <div className="step-content">
                <span className="step-name">Waiting for automation to start...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightAutomationLoader;