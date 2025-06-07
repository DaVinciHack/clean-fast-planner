/**
 * RunAutomationButton Component
 * 
 * This component provides a button to run flight automation for a specific flight ID
 * It leverages the AutomationService to handle the API call to Palantir
 */
import React, { useState } from 'react';
import AutomationService from '../../services/AutomationService';

const RunAutomationButton = ({ 
  flightId, 
  onSuccess, 
  onError,
  buttonText = 'Run Automation',
  disabled = false
}) => {
  const [isRunning, setIsRunning] = useState(false);
  
  // Function to handle running the automation
  const handleRunAutomation = async () => {
    if (!flightId) {
      if (onError) {
        onError('No flight ID provided for automation');
      }
      return;
    }
    
    try {
      setIsRunning(true);
      
      // Update loading indicator if available
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Running flight automation...');
      }
      
      // Call the AutomationService to run the automation
      const result = await AutomationService.runAutomation(flightId);
      
      console.log('Automation successful with result:', result);
      
      // Show success message
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Flight automation completed successfully', 'success');
      }
      
      // Display a visible success message
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
      successContainer.textContent = `Flight automation completed successfully!`;
      
      // Add a close button
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
      
      // Add to body and auto-remove after 5 seconds
      document.body.appendChild(successContainer);
      setTimeout(() => {
        if (document.body.contains(successContainer)) {
          document.body.removeChild(successContainer);
        }
      }, 5000);
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Error running automation:', error);
      
      // Format the error message
      const errorMessage = AutomationService.formatErrorMessage(error);
      
      // Show error message in UI
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(errorMessage, 'error');
      }
      
      // Display a visible error message
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
      
      // Add a close button
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
      
      // Add to body and auto-remove after 8 seconds
      document.body.appendChild(errorContainer);
      setTimeout(() => {
        if (document.body.contains(errorContainer)) {
          document.body.removeChild(errorContainer);
        }
      }, 8000);
      
      // Call onError callback if provided
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsRunning(false);
    }
  };
  
  // Button style - match the app's existing styles
  const buttonStyle = {
    backgroundColor: disabled ? '#6c757d' : '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: disabled || isRunning ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    margin: '0 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    opacity: disabled || isRunning ? 0.7 : 1
  };
  
  return (
    <button 
      style={buttonStyle}
      onClick={handleRunAutomation}
      disabled={disabled || isRunning}
      title={disabled ? 'Save flight first to enable automation' : 'Run automation on this flight'}
      className="control-button"
    >
      {isRunning ? (
        <>
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
          Running...
        </>
      ) : buttonText}
    </button>
  );
};

export default RunAutomationButton;