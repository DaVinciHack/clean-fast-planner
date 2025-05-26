import React, { useState, useEffect } from 'react';
import BaseCard from './BaseCard';

/**
 * Finance Calculator Component with browser persistence
 */
const FinanceCard = ({ id }) => {
  // Load settings from localStorage with defaults if not found
  const loadSetting = (key, defaultValue) => {
    try {
      const savedValue = localStorage.getItem(`financeCalc_${key}`);
      return savedValue !== null ? JSON.parse(savedValue) : defaultValue;
    } catch (error) {
      console.warn(`Error loading setting ${key}:`, error);
      return defaultValue;
    }
  };

  // Basic settings with localStorage persistence
  const [hourlyRate, setHourlyRate] = useState(() => loadSetting('hourlyRate', 4500));
  const [mileageRate, setMileageRate] = useState(() => loadSetting('mileageRate', 100));
  const [billingMethod, setBillingMethod] = useState(() => loadSetting('billingMethod', 'hourly'));
  const [landingFee, setLandingFee] = useState(() => loadSetting('landingFee', 250));
  const [includeLandingFees, setIncludeLandingFees] = useState(() => loadSetting('includeLandingFees', true));
  const [additionalCost, setAdditionalCost] = useState(() => loadSetting('additionalCost', 0));
  const [useFlightTime, setUseFlightTime] = useState(() => loadSetting('useFlightTime', true)); // Toggle between flight time and total time
  const [customLandings, setCustomLandings] = useState(() => loadSetting('customLandings', 0)); // Custom number of landings
  const [taxRate, setTaxRate] = useState(() => loadSetting('taxRate', 25)); // Tax rate percentage
  const [includeTax, setIncludeTax] = useState(() => loadSetting('includeTax', false)); // Toggle tax calculation
  
  // Save settings to localStorage when they change
  const saveSetting = (key, value) => {
    try {
      localStorage.setItem(`financeCalc_${key}`, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error saving setting ${key}:`, error);
    }
  };
  
  // Custom setters that update both state and localStorage
  const updateHourlyRate = (value) => {
    setHourlyRate(value);
    saveSetting('hourlyRate', value);
  };
  
  const updateMileageRate = (value) => {
    setMileageRate(value);
    saveSetting('mileageRate', value);
  };
  
  const updateBillingMethod = (value) => {
    setBillingMethod(value);
    saveSetting('billingMethod', value);
  };
  
  const updateLandingFee = (value) => {
    setLandingFee(value);
    saveSetting('landingFee', value);
  };
  
  const updateIncludeLandingFees = (value) => {
    setIncludeLandingFees(value);
    saveSetting('includeLandingFees', value);
  };
  
  const updateAdditionalCost = (value) => {
    setAdditionalCost(value);
    saveSetting('additionalCost', value);
  };
  
  const updateUseFlightTime = (value) => {
    setUseFlightTime(value);
    saveSetting('useFlightTime', value);
  };
  
  const updateCustomLandings = (value) => {
    setCustomLandings(value);
    saveSetting('customLandings', value);
  };
  
  const updateTaxRate = (value) => {
    setTaxRate(value);
    saveSetting('taxRate', value);
  };
  
  const updateIncludeTax = (value) => {
    setIncludeTax(value);
    saveSetting('includeTax', value);
  };
  
  // Route data extracted from the DOM
  const [routeData, setRouteData] = useState({
    flightTime: '00:00',
    flightTimeHours: 0,
    totalTime: '00:00',
    totalTimeHours: 0,
    distance: 0,
    fuelRequired: 0,
    landings: 0,
    hasRoute: false
  });
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Convert HH:MM to hours
  const timeToHours = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(n => parseInt(n) || 0);
    return hours + (minutes / 60);
  };
  
  // Read route data directly from the route stats card DOM elements
  const readRouteData = () => {
    try {
      // Find the route-stats-card element
      const statsCard = document.querySelector('.route-stats-card');
      if (!statsCard) return false;
      
      // Find all route-stat-value elements
      const statValues = statsCard.querySelectorAll('.route-stat-value');
      if (statValues.length < 4) return false;
      
      // Extract distance from the first value
      const distanceText = statValues[0].textContent || '';
      const distanceMatch = distanceText.match(/(\d+\.?\d*)/);
      const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
      
      // Extract flight time from the third value
      const flightTimeText = statValues[2].textContent || '';
      const flightTime = flightTimeText.trim();
      const flightTimeHours = timeToHours(flightTime);
      
      // Extract total time from the 7th value (should be the one in the second row, third column)
      const totalTimeText = statValues[6]?.textContent || '';
      const totalTime = totalTimeText.trim();
      const totalTimeHours = timeToHours(totalTime);
      
      // Extract fuel from the fourth value
      const fuelText = statValues[3].textContent || '';
      const fuelMatch = fuelText.match(/(\d+)/);
      const fuelRequired = fuelMatch ? parseInt(fuelMatch[1]) : 0;
      
      // Count waypoints for landings
      const waypoints = document.querySelectorAll('.stop-entry').length;
      const landings = waypoints;
      
      // Update route data if we found valid data
      if (distance > 0 || flightTimeHours > 0) {
        setRouteData({
          flightTime,
          flightTimeHours,
          totalTime,
          totalTimeHours,
          distance,
          fuelRequired,
          landings,
          hasRoute: true
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error reading route data:', error);
      return false;
    }
  };
  
  // Initialize and set up periodic checking for route data changes
  useEffect(() => {
    // Read data immediately
    readRouteData();
    
    // Set up interval to check for changes
    const intervalId = setInterval(() => {
      readRouteData();
    }, 500);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Calculate costs based on route data and settings
  const calculateCosts = () => {
    try {
      // Check if we have valid route data
      if (!routeData.hasRoute) return null;
      
      // Calculate main cost based on billing method
      let mainCost = 0;
      
      // Always use the custom landing count when specified, otherwise use route data
      const landingsCount = customLandings > 0 ? customLandings : routeData.landings;
      
      // Calculate landing fees if included
      const landingCost = includeLandingFees && landingsCount > 0
        ? landingsCount * landingFee
        : 0;
      
      // Additional cost
      const extra = parseFloat(additionalCost) || 0;
      
      if (billingMethod === 'hourly') {
        // Use either flight time or total time based on toggle
        const timeHours = useFlightTime ? routeData.flightTimeHours : routeData.totalTimeHours;
        const timeDisplay = useFlightTime ? routeData.flightTime : routeData.totalTime;
        
        mainCost = timeHours * hourlyRate;
        
        // Subtotal before tax
        const subtotal = mainCost + landingCost + extra;
        
        // Calculate tax if included
        const taxAmount = includeTax ? (subtotal * taxRate / 100) : 0;
        
        // Total cost including tax if applicable
        const totalCost = subtotal + taxAmount;
        
        return {
          mainCost,
          timeHours,
          timeDisplay,
          isFlightTime: useFlightTime,
          landingCost,
          landingsCount,
          extra,
          subtotal,
          taxAmount,
          taxRate: includeTax ? taxRate : 0,
          includeTax,
          totalCost
        };
      } else { // mileage
        mainCost = routeData.distance * mileageRate;
        
        // Subtotal before tax
        const subtotal = mainCost + landingCost + extra;
        
        // Calculate tax if included
        const taxAmount = includeTax ? (subtotal * taxRate / 100) : 0;
        
        // Total cost including tax if applicable
        const totalCost = subtotal + taxAmount;
        
        return {
          mainCost,
          landingCost,
          landingsCount,
          extra,
          subtotal,
          taxAmount,
          taxRate: includeTax ? taxRate : 0,
          includeTax,
          totalCost
        };
      }
    } catch (error) {
      console.error('Error calculating costs:', error);
      return null;
    }
  };
  
  // Get calculated costs
  const costs = calculateCosts();
  
  return (
    <BaseCard title="Finance Calculator" id={id}>
      <div className="control-section">
        <h4>Flight Cost Parameters</h4>
        
        <div className="mb-4">
          <label htmlFor="billing-method">Billing Method:</label>
          <select 
            id="billing-method"
            value={billingMethod}
            onChange={(e) => updateBillingMethod(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="hourly">Hourly Rate</option>
            <option value="mileage">Per Nautical Mile</option>
          </select>
        </div>
        
        {billingMethod === 'hourly' ? (
          <div className="mb-4">
            <label htmlFor="hourly-rate">Hourly Rate (USD):</label>
            <input 
              type="number" 
              id="hourly-rate" 
              value={hourlyRate}
              min="0"
              step="100"
              onChange={(e) => updateHourlyRate(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="mileage-rate">Rate per NM (USD):</label>
            <input 
              type="number" 
              id="mileage-rate" 
              value={mileageRate}
              min="0"
              step="10"
              onChange={(e) => updateMileageRate(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="include-landing-fees" 
              checked={includeLandingFees}
              onChange={(e) => updateIncludeLandingFees(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="include-landing-fees">Include Landing Fees</label>
          </div>
          
          {includeLandingFees && (
            <div>
              <div className="mb-2">
                <label htmlFor="landing-fee">Landing Fee (USD):</label>
                <input 
                  type="number" 
                  id="landing-fee" 
                  value={landingFee}
                  min="0"
                  step="50"
                  onChange={(e) => updateLandingFee(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="mb-2">
                <label htmlFor="custom-landings">Number of Landings:</label>
                <input 
                  type="number" 
                  id="custom-landings" 
                  value={customLandings}
                  min="0"
                  step="1"
                  onChange={(e) => updateCustomLandings(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Only count landings at airports, not rigs
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="additional-cost">Additional Cost (USD):</label>
          <input 
            type="number" 
            id="additional-cost" 
            value={additionalCost}
            min="0"
            step="100"
            onChange={(e) => updateAdditionalCost(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        
        {/* Time Type Toggle Switch - Simplified UI */}
        {billingMethod === 'hourly' && (
          <div className="mb-4">
            <label className="block mb-2">Time Type:</label>
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="time-toggle" 
                checked={!useFlightTime}
                onChange={() => updateUseFlightTime(!useFlightTime)}
                className="mr-2"
              />
              <div className="flex-1">
                <span className={`${useFlightTime ? 'font-bold text-blue-500' : ''}`}>
                  Flight Time
                </span>
                <span className="mx-2">|</span>
                <span className={`${!useFlightTime ? 'font-bold text-green-500' : ''}`}>
                  Total Time
                </span>
              </div>
            </div>
          </div>
        )}
        

        
        {/* Tax Calculator - Standard UI */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="include-tax" 
              checked={includeTax}
              onChange={(e) => updateIncludeTax(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="include-tax">Include Tax</label>
          </div>
          
          {includeTax && (
            <div className="mb-2">
              <label htmlFor="tax-rate">Tax Rate (%):</label>
              <input 
                type="number" 
                id="tax-rate" 
                value={taxRate}
                min="0"
                max="100"
                step="0.1"
                onChange={(e) => updateTaxRate(Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
          )}
        </div>
        
        <h4>Cost Breakdown</h4>
        {routeData.hasRoute && costs ? (
          <div className="finance-results">
            <div className="finance-item">
              <div className="finance-label">
                {billingMethod === 'hourly' 
                  ? `${costs.isFlightTime ? 'Flight' : 'Total'} Time Cost (${costs.timeDisplay}):`
                  : `Distance Cost (${routeData.distance} nm):`
                }
              </div>
              <div className="finance-value">{formatCurrency(costs.mainCost)}</div>
            </div>
            
            {includeLandingFees && costs.landingsCount > 0 && (
              <div className="finance-item">
                <div className="finance-label">Landing Fees ({costs.landingsCount} landings):</div>
                <div className="finance-value">{formatCurrency(costs.landingCost)}</div>
              </div>
            )}
            
            {additionalCost > 0 && (
              <div className="finance-item">
                <div className="finance-label">Additional Cost:</div>
                <div className="finance-value">{formatCurrency(costs.extra)}</div>
              </div>
            )}
            
            {/* Display subtotal if tax is included */}
            {includeTax && (
              <div className="finance-item">
                <div className="finance-label">Subtotal:</div>
                <div className="finance-value">{formatCurrency(costs.subtotal)}</div>
              </div>
            )}
            
            {/* Display tax amount if included */}
            {includeTax && (
              <div className="finance-item">
                <div className="finance-label">Tax ({taxRate}%):</div>
                <div className="finance-value">{formatCurrency(costs.taxAmount)}</div>
              </div>
            )}
            
            <div className="finance-item total">
              <div className="finance-label">Total Cost:</div>
              <div className="finance-value">{formatCurrency(costs.totalCost)}</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center text-gray-400 italic">
            Create a route to see financial data
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default FinanceCard;