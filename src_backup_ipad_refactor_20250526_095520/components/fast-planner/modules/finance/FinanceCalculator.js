/**
 * FinanceCalculator.js
 * 
 * Module for calculating financial aspects of a flight including costs
 * based on flight time, fuel, landing fees, etc.
 */

class FinanceCalculator {
  constructor() {
    this.callbacks = {
      onCalculationComplete: null
    };
    
    // Default values - these should be overridden by UI inputs
    this.settings = {
      hourlyRate: 4500,        // USD per hour
      landingFee: 250,         // USD per landing
      fuelCost: 3.25,          // USD per lb
      billingMethod: 'hourly', // 'hourly', 'fixed', or 'mileage'
      mileageRate: 100,        // USD per nm (only used for mileage billing)
      fixedPrice: 25000,       // USD (only used for fixed price billing)
      paidLandings: null       // Number of landings to charge for (null = all)
    };
  }
  
  /**
   * Set a callback function
   * @param {string} type - The callback type
   * @param {Function} callback - The callback function
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }
  
  /**
   * Trigger a callback if it exists
   * @param {string} type - The callback type
   * @param {*} data - The data to pass to the callback
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }
  
  /**
   * Update finance settings
   * @param {Object} settings - New settings object
   */
  updateSettings(settings) {
    this.settings = {
      ...this.settings,
      ...settings
    };
    
    console.log('FinanceCalculator: Settings updated', this.settings);
  }
  
  /**
   * Calculate finance details based on route statistics
   * @param {Object} routeStats - Route statistics object from RouteCalculator
   * @returns {Object} - Finance calculation results
   */
  calculateFinance(routeStats) {
    console.log('FinanceCalculator: Calculating finance for route', {
      routeStats: routeStats ? {
        timeHours: routeStats.timeHours,
        totalDistance: routeStats.totalDistance,
        fuelRequired: routeStats.fuelRequired,
        legs: routeStats.legs ? routeStats.legs.length : 0,
        maxPassengers: routeStats.maxPassengers
      } : 'No route stats',
      settings: this.settings
    });
    
    // Validate input data
    if (!routeStats) {
      console.error('FinanceCalculator: No route statistics provided');
      return null;
    }
    
    // Extract needed values from routeStats, use 0 as fallback
    const {
      timeHours = 0,
      totalDistance = 0,
      fuelRequired = 0,
      maxPassengers = 0,
      legs = [],
      waypoints = []
    } = routeStats;
    
    // Calculate flight time cost based on billing method
    let flightTimeCost = 0;
    
    switch (this.settings.billingMethod) {
      case 'hourly':
        // Calculate based on hourly rate
        flightTimeCost = timeHours * this.settings.hourlyRate;
        break;
        
      case 'fixed':
        // Use fixed price
        flightTimeCost = this.settings.fixedPrice;
        break;
        
      case 'mileage':
        // Calculate based on distance
        flightTimeCost = parseFloat(totalDistance) * this.settings.mileageRate;
        break;
        
      default:
        // Fall back to hourly
        flightTimeCost = timeHours * this.settings.hourlyRate;
    }
    
    // Get waypoints if available in routeStats, otherwise try to get from legs
    let waypointsList = [];
    
    // Try to get waypoints from the waypoints parameter
    if (waypoints && waypoints.length > 0) {
      waypointsList = waypoints;
    }
    // If no waypoints, try to get from route legs
    else if (legs && legs.length > 0) {
      // Extract waypoints from legs
      waypointsList = legs.map((leg, index) => {
        return { name: `Waypoint ${index + 1}`, coords: leg.from };
      });
      
      // Add the last waypoint (destination)
      if (legs.length > 0) {
        waypointsList.push({ 
          name: `Waypoint ${legs.length + 1}`, 
          coords: legs[legs.length - 1].to 
        });
      }
    }
    
    // Log the waypoints we found
    console.log('FinanceCalculator: Waypoints for landing fee calculation:', 
      waypointsList ? waypointsList.map(wp => wp.name || 'Unnamed') : 'None found');
    
    // Calculate landing fees based on paid landings setting
    const totalLandings = waypointsList.length || (legs.length > 0 ? legs.length + 1 : 0);
    const paidLandings = this.settings.paidLandings !== null && this.settings.paidLandings !== undefined
      ? Math.min(this.settings.paidLandings, totalLandings)
      : totalLandings;
    
    const landingFees = paidLandings * this.settings.landingFee;
    
    // Calculate fuel cost
    const fuelCost = fuelRequired * this.settings.fuelCost;
    
    // Calculate total cost
    const totalCost = flightTimeCost + landingFees + fuelCost;
    
    // Calculate cost per passenger (if passengers > 0)
    const costPerPassenger = maxPassengers > 0
      ? totalCost / maxPassengers
      : 0;
    
    // Format results with 2 decimal precision for display
    const results = {
      flightTimeCost: this.formatCurrency(flightTimeCost),
      landingFees: this.formatCurrency(landingFees),
      fuelCost: this.formatCurrency(fuelCost),
      totalCost: this.formatCurrency(totalCost),
      costPerPassenger: this.formatCurrency(costPerPassenger),
      passengerCount: maxPassengers,
      totalLandings: totalLandings,
      paidLandings: paidLandings,
      waypoints: waypointsList,
      timeHours: timeHours,
      totalDistance: totalDistance,
      fuelRequired: fuelRequired,
      raw: {
        flightTimeCost,
        landingFees,
        fuelCost,
        totalCost,
        costPerPassenger,
        passengerCount: maxPassengers,
        billingMethod: this.settings.billingMethod,
        hourlyRate: this.settings.hourlyRate,
        landingFee: this.settings.landingFee,
        fuelCost: this.settings.fuelCost,
        mileageRate: this.settings.mileageRate,
        fixedPrice: this.settings.fixedPrice,
        totalLandings: totalLandings,
        paidLandings: paidLandings
      }
    };
    
    console.log('FinanceCalculator: Results calculated', results);
    
    // Trigger callback with results
    this.triggerCallback('onCalculationComplete', results);
    
    return results;
  }
  
  /**
   * Format a number as a currency string
   * @param {number} value - The value to format
   * @returns {string} - Formatted currency string
   */
  formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}

export default FinanceCalculator;