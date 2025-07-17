import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Simulated progress state
  const [lastRealProgress, setLastRealProgress] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);
  
  // Timeout handling
  const timeoutRef = useRef(null);
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);
  
  // Step counter for unique keys
  const stepCounterRef = useRef(0);

  // Handle timeout after 145 seconds  
  const handleTimeout = useCallback(() => {
    setTimeoutOccurred(true);
    setHasError(true);
    setCurrentMessage('Save + automation timed out');
    setCurrentDetail('The save and automation process took longer than expected and has been cancelled');
    setErrorMessage(
      'The save + automation process exceeded the 145-second limit. This may be due to:\n\n' +
      '• Network connectivity issues\n' +
      '• Palantir service delays\n' +
      '• Missing or invalid flight data\n' +
      '• Fuel calculation validation errors\n\n' +
      'Please check your connection and try again. If the problem persists, ' +
      'verify that all required flight information is complete and valid.'
    );
    
    // Stop simulation
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // Initialize default state
  const initializeDefaultState = () => {
    setCurrentMessage('Preparing automation...');
    setCurrentDetail('Initializing Palantir flight automation system');
    setProgress(0);
    setLastRealProgress(0);
    setIsCompleted(false);
    setHasError(false);
    setErrorMessage('');
    setAutomationSteps([]);
    setIsSimulating(false);
    setTimeoutOccurred(false);
    
    // Reset step counter
    stepCounterRef.current = 0;
    
    // Clear any existing simulation
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Start simulated progress - slow crawl during waiting periods
  const startSimulation = useCallback((startFrom = 0) => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    
    setIsSimulating(true);
    setLastRealProgress(startFrom);
    
    // Slow, realistic progress simulation
    simulationIntervalRef.current = setInterval(() => {
      setProgress(current => {
        // Different speeds for different ranges
        let increment;
        if (current < 20) {
          increment = 0.3; // Very slow start (connection/auth)
        } else if (current < 50) {
          increment = 0.2; // Slow middle (processing)
        } else if (current < 80) {
          increment = 0.1; // Very slow towards end
        } else {
          increment = 0.05; // Crawl at the end
        }
        
        const newProgress = Math.min(current + increment, 95); // Never quite reach 100%
        
        // Stop simulation at 95% to wait for real completion
        if (newProgress >= 95) {
          clearInterval(simulationIntervalRef.current);
          simulationIntervalRef.current = null;
          setIsSimulating(false);
        }
        
        return newProgress;
      });
    }, 100); // Update every 100ms for smooth animation
  }, []);

  // Stop simulation and jump to real progress
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulating(false);
  }, []);

  // Handle progress updates from external automation
  const handleProgressUpdate = useCallback((progressData) => {
    
    const { type, message, detail, progress: newProgress, result, error } = progressData;
    
    // Stop simulation when we get real progress updates
    if (typeof newProgress === 'number' && newProgress >= 0) {
      stopSimulation();
      setLastRealProgress(newProgress);
      
      // Jump to real progress (or higher if simulation was ahead)
      setProgress(current => Math.max(current, newProgress));
      
      // If this isn't a completion, restart simulation from this point
      if (type !== 'completed' && type !== 'error' && newProgress < 95) {
        setTimeout(() => startSimulation(newProgress), 500); // Brief pause before resuming simulation
      }
    }
    
    // Add this step to our history
    setAutomationSteps(prevSteps => {
      // Generate unique ID using counter
      stepCounterRef.current += 1;
      const newStep = {
        id: `step-${stepCounterRef.current}`,
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
    
    // Handle different types of updates
    switch (type) {
      case 'completed':
        stopSimulation(); // Stop any simulation
        setProgress(100); // Jump to 100%
        setIsCompleted(true);
        // Clear timeout on successful completion
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
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
        stopSimulation(); // Stop any simulation
        setHasError(true);
        setErrorMessage(detail);
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
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
    if (!isVisible) {
      // RESET STATE: Always reset when becoming invisible
      initializeDefaultState();
      return;
    }
    
    // FRESH START: Always reset state when starting new display
    initializeDefaultState();
    
    // Start simulated progress immediately - this keeps the bar moving
    // even during long connection/auth waits
    setTimeout(() => {
      startSimulation(0);
    }, 300); // Brief delay to let initial state settle
    
    // Start 145-second timeout for save+automation operations  
    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, 145000); // 145 seconds for save+automation
    
  }, [isVisible, handleTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flight-automation-overlay">
      <div className="flight-automation-popup">
        {/* Close Button */}
        <button 
          className="loader-close-button"
          onClick={() => onComplete?.()}
          aria-label="Close loader"
        >
          ×
        </button>
        
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
                className={`step-progress-bar ${
                  hasError ? 'error-state' : 
                  isCompleted ? 'completed-state' : 
                  isSimulating ? 'active-state simulating' : 
                  'active-state'
                }`}
                style={{ 
                  width: `${progress}%`
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