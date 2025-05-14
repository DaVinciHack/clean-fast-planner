import React, { useState, useEffect } from 'react';

/**
 * OSDK Error Dialog Component
 * 
 * Displays a dialog when the OSDK client fails to initialize.
 * This component is automatically added to the DOM when an error occurs.
 */
const OSDKErrorDialog = ({ onDismiss }) => {
  return (
    <div className="osdk-error-dialog">
      <div className="error-content">
        <h3>OSDK Client Error</h3>
        <p>The Palantir OSDK client failed to initialize properly. This will prevent loading aircraft and platform data.</p>
        <p>Error: Client is null or undefined</p>
        <p>Please reload the page and try again.</p>
        <div className="error-actions">
          <button onClick={onDismiss}>Dismiss</button>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </div>
      
      <style jsx="true">{`
        .osdk-error-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .error-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        
        .error-content h3 {
          color: #dc3545;
          margin-top: 0;
        }
        
        .error-actions {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        .error-actions button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }
        
        .error-actions button:first-child {
          background-color: #f8f9fa;
          color: #212529;
        }
        
        .error-actions button:last-child {
          background-color: #007bff;
          color: white;
        }
      `}</style>
    </div>
  );
};

// Function to create and add the dialog to the page
export const showOSDKErrorDialog = () => {
  // Create container for the dialog
  const container = document.createElement('div');
  container.id = 'osdk-error-dialog-container';
  document.body.appendChild(container);
  
  // Function to remove the dialog
  const handleDismiss = () => {
    try {
      const dialogContainer = document.getElementById('osdk-error-dialog-container');
      if (dialogContainer) {
        document.body.removeChild(dialogContainer);
      }
    } catch (error) {
      console.error('Error removing OSDK error dialog:', error);
    }
  };
  
  // Inject the dialog component
  const script = document.createElement('script');
  script.innerHTML = `
    (function() {
      // Create dialog element
      const dialog = document.createElement('div');
      dialog.className = 'osdk-error-dialog';
      dialog.innerHTML = \`
        <div class="error-content">
          <h3>OSDK Client Error</h3>
          <p>The Palantir OSDK client failed to initialize properly. This will prevent loading aircraft and platform data.</p>
          <p>Error: Client is null or undefined</p>
          <p>Please reload the page and try again.</p>
          <div class="error-actions">
            <button id="dismiss-osdk-error">Dismiss</button>
            <button id="reload-page">Reload Page</button>
          </div>
        </div>
      \`;
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = \`
        .osdk-error-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .error-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        
        .error-content h3 {
          color: #dc3545;
          margin-top: 0;
        }
        
        .error-actions {
          margin-top: 20px;
          display: flex;
          justify-content: center;
          gap: 10px;
        }
        
        .error-actions button {
          padding: 8px 16px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
        }
        
        .error-actions button:first-child {
          background-color: #f8f9fa;
          color: #212529;
        }
        
        .error-actions button:last-child {
          background-color: #007bff;
          color: white;
        }
      \`;
      
      // Add dialog and style to container
      const container = document.getElementById('osdk-error-dialog-container');
      if (container) {
        container.appendChild(style);
        container.appendChild(dialog);
        
        // Add event listeners
        document.getElementById('dismiss-osdk-error').addEventListener('click', function() {
          const container = document.getElementById('osdk-error-dialog-container');
          if (container) {
            document.body.removeChild(container);
          }
        });
        
        document.getElementById('reload-page').addEventListener('click', function() {
          window.location.reload();
        });
      }
    })();
  `;
  
  // Add script to container
  container.appendChild(script);
};

export default OSDKErrorDialog;