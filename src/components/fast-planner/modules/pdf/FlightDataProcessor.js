/**
 * FlightDataProcessor.js
 * 
 * Processes flight planning data for PDF report generation
 * Extracts and formats data from RouteCalculator, StopCards, and other sources
 */

class FlightDataProcessor {
  constructor() {
    this.defaultAircraftInfo = {
      type: 'TBD',
      registration: 'TBD',
      capacity: 0
    };
  }

  /**
   * Process complete flight data for PDF generation
   * @param {Object} routeStats - Route statistics from RouteCalculator
   * @param {Array} stopCards - Stop card data from StopCardCalculator
   * @param {Object} selectedAircraft - Selected aircraft information
   * @param {Array} waypoints - Waypoint data
   * @param {Object} costData - Cost calculation data
   * @returns {Object} - Formatted flight data for PDF
   */
  processFlightData(routeStats, stopCards, selectedAircraft, waypoints, costData = {}) {
    // Debug logging to understand data structure
    console.log('📄 FlightDataProcessor - Input data:');
    console.log('  - routeStats:', routeStats);
    console.log('  - stopCards:', stopCards);
    console.log('  - selectedAircraft:', selectedAircraft);
    console.log('  - waypoints:', waypoints?.length, 'items');
    console.log('  - costData:', costData);

    // Generate unique flight ID
    const flightId = this.generateFlightId();
    
    // Process aircraft information
    const aircraft = this.processAircraftData(selectedAircraft);
    
    // Process route and leg data
    const route = this.processRouteData(routeStats, waypoints);
    const legs = this.processLegData(stopCards, waypoints);
    
    // Process totals
    const totals = this.processTotals(routeStats, legs, costData, stopCards);
    
    // Process costs
    const costs = this.processCosts(costData, totals);

    const result = {
      flightId,
      flightDate: new Date().toLocaleDateString(),
      aircraft,
      route,
      legs,
      totals,
      costs,
      generatedAt: new Date().toISOString()
    };

    console.log('📄 FlightDataProcessor - Generated result:', result);
    return result;
  }

  /**
   * Generate unique flight quote ID
   * @returns {string} - Flight quote ID
   */
  generateFlightId() {
    const prefix = 'FQ'; // FQ for Flight Quote
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Process aircraft data
   * @param {Object} selectedAircraft - Aircraft data from selection
   * @returns {Object} - Processed aircraft information
   */
  processAircraftData(selectedAircraft) {
    if (!selectedAircraft) {
      return this.defaultAircraftInfo;
    }

    // Debug aircraft data structure
    console.log('📄 Processing aircraft data:', selectedAircraft);
    console.log('📄 Aircraft keys:', Object.keys(selectedAircraft));
    console.log('📄 defaultModel:', selectedAircraft.defaultModel);
    console.log('📄 aircraftType:', selectedAircraft.aircraftType);
    console.log('📄 type:', selectedAircraft.type);
    console.log('📄 model:', selectedAircraft.model);

    // Clean registration - remove anything in brackets
    const rawRegistration = selectedAircraft.registration || selectedAircraft.aircraftRegistration || selectedAircraft.tailNumber || 'TBD';
    const cleanRegistration = rawRegistration.replace(/\s*\([^)]*\)\s*$/, '').trim();

    return {
      type: selectedAircraft.modelNmae || selectedAircraft.modelName || selectedAircraft.modelType || selectedAircraft.aircraftType || selectedAircraft.type || 'TBD',
      registration: cleanRegistration,
      capacity: selectedAircraft.maxPassengers || selectedAircraft.capacity || selectedAircraft.passengerCapacity || 0,
      fuelCapacity: selectedAircraft.fuelCapacity || selectedAircraft.maxFuel || 0,
      range: selectedAircraft.range || selectedAircraft.maxRange || 0,
      manufacturer: selectedAircraft.manufacturer || selectedAircraft.make || '',
      model: selectedAircraft.model || selectedAircraft.aircraftModel || selectedAircraft.type || ''
    };
  }

  /**
   * Process route summary data
   * @param {Object} routeStats - Route statistics
   * @param {Array} waypoints - Waypoint data
   * @returns {Object} - Route summary
   */
  processRouteData(routeStats, waypoints) {
    const departure = waypoints?.[0]?.name || 'Unknown';
    const destination = waypoints?.[waypoints.length - 1]?.name || 'Unknown';
    
    return {
      summary: `${departure} → ${destination}`,
      departure,
      destination,
      waypointCount: waypoints?.length || 0,
      coordinates: waypoints?.map(wp => ({
        name: wp.name,
        lat: wp.coordinates?.[1],
        lng: wp.coordinates?.[0]
      })) || []
    };
  }

  /**
   * Process leg-by-leg data from stop cards
   * @param {Array} stopCards - Stop card data
   * @param {Array} waypoints - Waypoint data
   * @returns {Array} - Processed leg data
   */
  processLegData(stopCards, waypoints) {
    const legs = [];
    
    console.log('📄 Processing leg data - stopCards:', stopCards?.length, 'waypoints:', waypoints?.length);
    
    if (stopCards && stopCards.length > 0) {
      // Filter out waypoints and navigation points - only include actual stops
      const actualStops = stopCards.filter(card => {
        // Skip if it's a waypoint or navigation point
        if (card.isWaypoint || card.type === 'waypoint' || card.pointType === 'NAVIGATION_WAYPOINT') {
          return false;
        }
        // Include departure, destination, and intermediate stops
        return card.isDeparture || card.isDestination || (!card.isAlternate && card.stopName);
      });
      
      console.log('📄 Filtered actual stops:', actualStops.length, 'from', stopCards.length, 'total cards');
      
      // Create legs between actual stops
      for (let i = 0; i < actualStops.length - 1; i++) {
        const fromCard = actualStops[i];
        const toCard = actualStops[i + 1];
        
        console.log('📄 Creating leg from', fromCard.stopName, 'to', toCard.stopName);
        
        // Calculate leg distance (difference between cumulative distances)
        const legDistance = (toCard.totalDistance || 0) - (fromCard.totalDistance || 0);
        
        // Get leg time from the destination card
        const legTime = toCard.flightTime || toCard.time || toCard.totalTime || 0;
        
        // Get passengers for this leg - use fromCard passengers since they're traveling on this leg
        const legPassengers = fromCard.maxPassengers || fromCard.passengers || fromCard.pax || 0;
        
        legs.push({
          legNumber: i + 1,
          from: fromCard.stopName || fromCard.name || 'Unknown',
          to: toCard.stopName || toCard.name || 'Unknown',
          distance: this.formatDistance(legDistance),
          time: this.formatTime(legTime),
          fuel: this.formatFuel(toCard.totalFuel || toCard.fuel || 0),
          passengers: legPassengers,
          deckTime: this.formatTime(toCard.deckTime || 0),
          coordinates: {
            from: fromCard.coordinates || fromCard.coords,
            to: toCard.coordinates || toCard.coords
          }
        });
      }
      
      // Add alternate route if present
      const alternateCard = stopCards.find(card => card.isAlternate);
      if (alternateCard) {
        legs.push({
          legNumber: legs.length + 1,
          from: alternateCard.stopName || alternateCard.name || 'Alternate Route',
          to: alternateCard.alternateName || alternateCard.destination || 'Unknown',
          distance: this.formatDistance(alternateCard.totalDistance || alternateCard.distance || 0),
          time: this.formatTime(alternateCard.flightTime || alternateCard.time || alternateCard.totalTime || 0),
          fuel: this.formatFuel(alternateCard.totalFuel || alternateCard.fuel || 0),
          passengers: alternateCard.maxPassengers || alternateCard.passengers || alternateCard.pax || 0,
          deckTime: '00:00',
          isAlternate: true,
          coordinates: {
            from: alternateCard.coordinates || alternateCard.coords,
            to: alternateCard.alternateCoords
          }
        });
      }
      
    } else if (waypoints && waypoints.length > 1) {
      // Fallback: create legs from waypoints if stop cards not available
      for (let i = 0; i < waypoints.length - 1; i++) {
        legs.push({
          legNumber: i + 1,
          from: waypoints[i].name || `Waypoint ${i + 1}`,
          to: waypoints[i + 1].name || `Waypoint ${i + 2}`,
          distance: 'TBD',
          time: 'TBD',
          fuel: 'TBD',
          passengers: 0,
          deckTime: '00:00',
          coordinates: {
            from: waypoints[i].coordinates,
            to: waypoints[i + 1].coordinates
          }
        });
      }
    }
    
    console.log('📄 Processed legs:', legs);
    return legs;
  }

  /**
   * Process total values - extract from stop cards for accuracy
   * @param {Object} routeStats - Route statistics
   * @param {Array} legs - Processed leg data
   * @param {Object} costData - Cost data
   * @param {Array} stopCards - Original stop cards for accurate totals
   * @returns {Object} - Total values
   */
  processTotals(routeStats, legs, costData, stopCards) {
    let totalDistance = 0;
    let totalFlightTime = 0;
    let totalFuel = 0;
    let maxPassengers = 0;

    // Extract totals from stop cards for accuracy (best source)
    if (stopCards && stopCards.length > 0) {
      // Get departure card for fuel
      const departureCard = stopCards.find(card => card.isDeparture);
      if (departureCard) {
        totalFuel = departureCard.totalFuel || departureCard.fuel || 0;
      }
      
      // Get final destination card for distance and flight time
      const destinationCard = stopCards.find(card => card.isDestination);
      if (destinationCard) {
        totalDistance = destinationCard.totalDistance || destinationCard.distance || 0;
        totalFlightTime = destinationCard.totalTime || destinationCard.flightTime || destinationCard.time || 0;
      }
      
      // Get max passengers from any card
      stopCards.forEach(card => {
        if (!card.isAlternate) { // Exclude alternate route from passenger calc
          const passengers = card.maxPassengers || card.passengers || card.pax || 0;
          maxPassengers = Math.max(maxPassengers, passengers);
        }
      });
      
    } else if (routeStats) {
      // Fallback to route stats
      totalDistance = routeStats.totalDistance || 0;
      totalFlightTime = routeStats.totalTime || 0;
      totalFuel = routeStats.totalFuel || 0;
      maxPassengers = routeStats.maxPassengers || 0;
    } else if (legs && legs.length > 0) {
      // Final fallback: calculate from legs
      legs.forEach(leg => {
        if (!leg.isAlternate) { // Exclude alternate from main totals
          const distance = parseFloat(leg.distance) || 0;
          const fuel = parseFloat(leg.fuel) || 0;
          totalDistance += distance;
          totalFuel += fuel;
          maxPassengers = Math.max(maxPassengers, leg.passengers || 0);
        }
      });
    }

    return {
      distance: this.formatDistance(totalDistance),
      flightTime: this.formatTime(totalFlightTime),
      fuel: this.formatFuel(totalFuel),
      passengers: maxPassengers,
      cost: costData.totalCost || 0
    };
  }

  /**
   * Process cost breakdown
   * @param {Object} costData - Cost calculation data
   * @param {Object} totals - Total values
   * @returns {Object} - Cost breakdown
   */
  processCosts(costData, totals) {
    return {
      flightTime: costData.flightTimeCost || 0,
      fuel: costData.fuelCost || 0,
      dayRate: costData.dayRate || 0,
      additional: costData.additionalCost || 0,
      landing: costData.landingFees || 0,
      tax: costData.includeTax ? (costData.tax || 0) : null
    };
  }

  /**
   * Format distance value
   * @param {number} distance - Distance in nautical miles
   * @returns {string} - Formatted distance
   */
  formatDistance(distance) {
    if (!distance || isNaN(distance)) return '0';
    return Math.round(distance * 10) / 10; // Round to 1 decimal
  }

  /**
   * Format time value
   * @param {number|string} time - Time in hours (decimal), minutes, or HH:MM format
   * @returns {string} - Formatted time as HH:MM
   */
  formatTime(time) {
    if (!time) return '00:00';
    
    // If already formatted as HH:MM, return as-is
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    
    // Handle decimal hours (like 1.75 for 1 hour 45 minutes)
    if (typeof time === 'number' && time < 24) {
      const hours = Math.floor(time);
      const minutes = Math.round((time - hours) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    // Handle time in minutes
    const totalMinutes = parseInt(time) || 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Format fuel value
   * @param {number} fuel - Fuel in pounds
   * @returns {string} - Formatted fuel
   */
  formatFuel(fuel) {
    if (!fuel || isNaN(fuel)) return '0';
    return Math.round(fuel);
  }

  /**
   * Extract data from current application state
   * @param {Object} appState - Current application state with all managers
   * @returns {Object} - Processed flight data ready for PDF
   */
  extractFromAppState(appState) {
    const {
      routeStats,
      stopCards,
      selectedAircraft,
      waypoints,
      costData
    } = appState;

    return this.processFlightData(
      routeStats,
      stopCards,
      selectedAircraft,
      waypoints,
      costData
    );
  }
}

export default FlightDataProcessor;
