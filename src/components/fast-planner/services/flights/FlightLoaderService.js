/**
 * FlightLoaderService.js
 * 
 * Service for loading flight data from Palantir OSDK
 */
import client from '../../../../client';

class FlightLoaderService {
  /**
   * Check if the OSDK client is available and authenticated
   * @returns {boolean} - True if OSDK client is available
   */
  static isClientAvailable() {
    return !!client;
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
   * Load all flights from Palantir
   * @param {Object} options - Options for loading flights
   * @param {string} options.region - Region to filter by
   * @param {string} options.searchQuery - Text to search for in flight names
   * @param {string} options.status - Status to filter by (e.g., 'planned', 'completed')
   * @param {number} options.pageSize - Number of results per page
   * @returns {Promise<Array>} - Resolves with the loaded flights
   */
  static async loadFlights(options = {}) {
    if (!this.isClientAvailable()) {
      throw new Error('OSDK client not available. Try logging in again.');
    }
    
    try {
      // Show loading status in UI
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator('Loading flights...');
      }
      
      // Import the SDK
      const sdk = await this.getSDK();
      
      // Log all available interfaces to help debug
      console.log("Available SDK interfaces:", Object.keys(sdk));
      
      // Look for flight-related interfaces
      const flightInterfaces = Object.keys(sdk).filter(key => 
        typeof key === 'string' && key.toLowerCase().includes('flight')
      );
      console.log("Flight-related interfaces:", flightInterfaces);
      
      // Get the MainFlightObjectFP2 interface or a suitable alternative
      let flightInterface = null;
      
      // Try exact match first
      if (sdk.MainFlightObjectFP2) {
        flightInterface = sdk.MainFlightObjectFP2;
      } 
      // Then try other naming variations
      else if (sdk.MainFlightObject) {
        flightInterface = sdk.MainFlightObject;
      } 
      else if (sdk.FlightObjectFP2) {
        flightInterface = sdk.FlightObjectFP2;
      }
      else if (sdk.FlightObject) {
        flightInterface = sdk.FlightObject;
      }
      // Look for any Flight-related interface as last resort
      else {
        for (const key of flightInterfaces) {
          if (sdk[key] && typeof sdk[key] === 'object') {
            flightInterface = sdk[key];
            console.log(`Using alternative flight interface: ${key}`);
            break;
          }
        }
      }
      
      // If no suitable interface is found, return an error
      if (!flightInterface) {
        console.error("No flight interface found in SDK");
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator('API endpoint not found: The flight loading action may not be available', 'error');
        }
        
        // Throw an error, never use mock data
        throw new Error('Flight interface not available in OSDK');
      }
      
      // Create base query
      let query = client(flightInterface);
      
      // Apply region filter if provided
      if (options.region) {
        // Format region name for consistency
        const formattedRegion = this.formatRegionName(options.region);
        
        console.log(`Filtering flights by region: ${formattedRegion}`);
        query = query.where({
          region: formattedRegion
        });
      }
      
      // Apply search filter if provided
      if (options.searchQuery && options.searchQuery.trim()) {
        const searchTerm = options.searchQuery.trim();
        console.log(`Searching flights with query: ${searchTerm}`);
        
        // For searching across multiple fields we need complex query
        // This depends on what's supported by your Palantir instance
        try {
          query = query.where({
            $or: [
              { flightNumber: { $containsString: searchTerm } },
              { flightName: { $containsString: searchTerm } },
              { displayWaypoints: { $containsString: searchTerm } }
            ]
          });
        } catch (searchError) {
          console.warn('Complex search not supported, falling back to simpler query:', searchError);
          
          // Fallback to simpler search if complex one not supported
          query = query.where({
            flightNumber: { $containsString: searchTerm }
          });
        }
      }
      
      // Set page size with a reasonable default
      const pageSize = options.pageSize || 30;
      
      // Execute the query
      console.log('Executing flight query with page size:', pageSize);
      const response = await query.fetchPage({
        $pageSize: pageSize
      });
      
      console.log(`Loaded ${response.data ? response.data.length : 0} flights`);
      
      // Process the results
      if (response && response.data) {
        // Format the flights for display
        const formattedFlights = response.data.map(flight => this.formatFlightForDisplay(flight));
        
        // Update loading indicator
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Loaded ${formattedFlights.length} flights successfully`);
        }
        
        return formattedFlights;
      } else {
        console.warn('No flight data returned from API');
        
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator('No flights found');
        }
        
        return [];
      }
    } catch (error) {
      console.error('Error loading flights:', error);
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Error loading flights: ${error.message}`, 'error');
      }
      
      // Never use mock data in aviation applications
      // Return empty array when there's an error
      return [];
    }
  }
  
  /**
   * Format a region name to match OSDK format
   * @param {string} region - The region name to format
   * @returns {string} - The formatted region name
   */
  static formatRegionName(region) {
    if (!region) return '';
    
    // Map of region IDs to OSDK region names
    const regionMap = {
      'gulf-of-mexico': 'GULF OF MEXICO',
      'gom': 'GULF OF MEXICO',
      'gulf of mexico': 'GULF OF MEXICO',
      'norway': 'NORWAY',
      'united-kingdom': 'UNITED KINGDOM',
      'uk': 'UNITED KINGDOM',
      'west-africa': 'NIGERIA',
      'nigeria': 'NIGERIA',
      'brazil': 'BRAZIL',
      'australia': 'AUSTRALIA'
    };
    
    // First check if we are passing a region that's already in the correct format
    const upperRegion = region.toUpperCase();
    
    // If the uppercase version is already a known region name, use it
    if (Object.values(regionMap).includes(upperRegion)) {
      return upperRegion;
    }
    
    // Check if direct mapping exists
    const lowerRegion = region.toLowerCase();
    if (regionMap[lowerRegion]) {
      return regionMap[lowerRegion];
    }
    
    // If no mapping found, return the original region name in uppercase
    return upperRegion;
  }
  
  /**
   * Load a single flight by ID
   * @param {string} flightId - The flight ID
   * @returns {Promise<Object>} - Resolves with the flight details
   */
  static async loadFlightById(flightId) {
    if (!this.isClientAvailable()) {
      throw new Error('OSDK client not available. Try logging in again.');
    }
    
    if (!flightId) {
      throw new Error('Flight ID is required');
    }
    
    try {
      // Show loading status in UI
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Loading flight ${flightId}...`);
      }
      
      // Import the SDK
      const sdk = await this.getSDK();
      
      // Get the MainFlightObjectFP2 interface
      if (!sdk.MainFlightObjectFP2) {
        throw new Error('MainFlightObjectFP2 interface not found in SDK');
      }
      
      // Create query to get a specific flight by ID
      const query = client(sdk.MainFlightObjectFP2).where({
        flightId: flightId
      });
      
      // Execute the query
      const response = await query.fetchPage({
        $pageSize: 1
      });
      
      // Process the result
      if (response && response.data && response.data.length > 0) {
        const formattedFlight = this.formatFlightForDisplay(response.data[0]);
        
        // Update loading indicator
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Loaded flight details for ${formattedFlight.title}`);
        }
        
        return formattedFlight;
      } else {
        console.warn(`Flight with ID ${flightId} not found`);
        
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(`Flight ${flightId} not found`, 'error');
        }
        
        throw new Error(`Flight with ID ${flightId} not found`);
      }
    } catch (error) {
      console.error(`Error loading flight ${flightId}:`, error);
      
      // Update loading indicator with error
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(`Error loading flight: ${error.message}`, 'error');
      }
      
      throw error;
    }
  }
  
  /**
   * Format a flight object for display
   * @param {Object} flight - The raw flight object from the API
   * @returns {Object} - Formatted flight object
   */
  static formatFlightForDisplay(flight) {
    // Determine the flight status based on timestamps
    let status = 'Unknown';
    const now = new Date();
    const etd = flight.etd ? new Date(flight.etd) : null;
    
    if (etd) {
      if (etd < now) {
        status = 'Completed';
      } else if (etd > now && (etd - now) < (4 * 60 * 60 * 1000)) { // Within 4 hours
        status = 'In Progress';
      } else {
        status = 'Planned';
      }
    }
    
    // Extract departure and destination waypoints
    const extractWaypoints = () => {
      // Try different fields depending on what's available
      if (flight.displayWaypoints && flight.displayWaypoints.length > 0) {
        return flight.displayWaypoints;
      }
      
      if (flight.combinedWaypoints && flight.combinedWaypoints.length > 0) {
        return flight.combinedWaypoints;
      }
      
      if (flight.stopsArray && flight.stopsArray.length > 0) {
        return flight.stopsArray;
      }
      
      // If none of the above, try to extract from legs
      if (flight.legsNames && flight.legsNames.length > 0) {
        return flight.legsNames;
      }
      
      return ['Unknown'];
    };
    
    const waypoints = extractWaypoints();
    const departureLocation = waypoints.length > 0 ? waypoints[0] : 'Unknown';
    const destinationLocation = waypoints.length > 1 ? waypoints[waypoints.length - 1] : 'Unknown';
    
    // Format date for display
    const formatDate = (date) => {
      if (!date) return 'Unknown';
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    };
    
    const formattedDate = formatDate(etd);
    
    // Create a display title using departure/destination
    const title = `${departureLocation} to ${destinationLocation}`;
    
    // Return formatted flight object
    return {
      id: flight.flightId,
      title: title,
      flightNumber: flight.flightNumber || '',
      departure: departureLocation,
      destination: destinationLocation,
      etd: etd,
      formattedDate: formattedDate,
      status: status,
      aircraftId: flight.aircraftId || '',
      region: flight.region || '',
      captainId: flight.captainId || '',
      copilotId: flight.copilotId || '',
      waypoints: waypoints,
      fullRouteGeoShape: flight.fullRouteGeoShape,  // For displaying on map
      rawData: flight // Keep the raw data for reference
    };
  }
  
  /**
   * Format error message for the user
   * @param {Error} error - The error object
   * @returns {string} - A user-friendly error message
   */
  static formatErrorMessage(error) {
    if (!error) return 'Unknown error occurred';
    
    // Log the full error for debugging
    console.error('Full error details:', error);
    
    // Format specific error types
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      return 'Authentication error: You need to log in again to access flights';
    }
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'API endpoint not found: The flight loading action may not be available';
    }
    
    if (error.message.includes('MainFlightObjectFP2')) {
      return 'API endpoint not found: The flight loading action is not available in this environment';
    }
    
    // Default message
    return `Error loading flights: ${error.message}`;
  }
}

export default FlightLoaderService;