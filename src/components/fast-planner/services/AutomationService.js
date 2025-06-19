/**
 * AutomationService.js
 * 
 * Service for handling flight automation in Palantir
 */
import client from '../../../client';

class AutomationService {
  /**
   * Run automation for a flight
   * @param {string} flightId - The ID of the flight to automate
   * @param {Function} onProgress - Optional callback for progress updates
   * @returns {Promise<Object>} - The result of the automation
   */
  static async runAutomation(flightId, onProgress = null) {
    if (!flightId) {
      throw new Error('Flight ID is required for automation');
    }
    
    try {
      console.log(`AutomationService: Running automation for flight ${flightId}`);
      
      // Report initial progress
      if (onProgress) {
        onProgress({
          type: 'step',
          message: 'Starting flight automation...',
          detail: 'Initializing Palantir automation system',
          progress: 0
        });
      }
      
      // Import the SDK
      const sdk = await this.getSDK();
      
      if (onProgress) {
        onProgress({
          type: 'step',
          message: 'Connecting to Palantir Foundry',
          detail: 'Establishing secure connection to automation engine',
          progress: 10
        });
      }
      
      // Add a small delay to show the connection message
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onProgress) {
        onProgress({
          type: 'step',
          message: 'Running Palantir Flight Automation',
          detail: `Processing flight ID: ${flightId}`,
          progress: 20
        });
      }
      
      // CRITICAL: Don't pass any options parameter
      const result = await client(sdk.singleFlightAutomation).applyAction(
        { flightId: flightId }
        // No options parameter - this is the key difference!
      );
      
      if (onProgress) {
        onProgress({
          type: 'step',
          message: 'Processing automation results',
          detail: 'Validating and formatting flight data',
          progress: 90
        });
      }
      
      // Add a brief delay to show processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (onProgress) {
        onProgress({
          type: 'completed',
          message: 'Automation completed successfully',
          detail: 'Flight automation finished - preparing to reload flight data',
          progress: 100,
          result
        });
      }
      
      console.log('Automation successful!', result);
      return result;
    } catch (error) {
      console.error('Automation failed:', error);
      
      if (onProgress) {
        onProgress({
          type: 'error',
          message: 'Automation failed',
          detail: this.formatErrorMessage(error),
          progress: 0,
          error
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Import the SDK dynamically
   * @returns {Object} - The SDK object
   */
  static async getSDK() {
    try {
      return await import('@flight-app/sdk');
    } catch (error) {
      console.error('Error importing SDK:', error);
      throw new Error(`Failed to import SDK: ${error.message}`);
    }
  }
  
  /**
   * Format error message for the user
   * @param {Error} error - The error object
   * @returns {string} - A user-friendly error message
   */
  static formatErrorMessage(error) {
    if (!error) return 'Unknown error occurred';
    
    const message = error.message || '';
    
    if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication error: You need to log in again to run automation';
    }
    
    if (message.includes('404') || message.includes('not found')) {
      return 'API endpoint not found: The automation action may not be available';
    }
    
    if (message.includes('400') || message.includes('Bad Request')) {
      return 'API request error (400): The server rejected the automation request. The flight might not be in a valid state for automation.';
    }
    
    return `Error running automation: ${message}`;
  }
}

export default AutomationService;