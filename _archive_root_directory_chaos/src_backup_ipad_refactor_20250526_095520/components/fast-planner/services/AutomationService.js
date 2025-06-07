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
   * @returns {Promise<Object>} - The result of the automation
   */
  static async runAutomation(flightId) {
    if (!flightId) {
      throw new Error('Flight ID is required for automation');
    }
    
    try {
      console.log(`AutomationService: Running automation for flight ${flightId}`);
      
      // Import the SDK
      const sdk = await this.getSDK();
      
      // CRITICAL: Don't pass any options parameter
      const result = await client(sdk.singleFlightAutomation).applyAction(
        { flightId: flightId }
        // No options parameter - this is the key difference!
      );
      
      console.log('Automation successful!', result);
      return result;
    } catch (error) {
      console.error('Automation failed:', error);
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