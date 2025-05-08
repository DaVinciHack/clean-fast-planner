import React, { useState, useEffect } from 'react';
import BaseCard from './BaseCard';

/**
 * Finance Calculator Component
 */
const FinanceCard = ({ id }) => {
  // Basic settings
  const [hourlyRate, setHourlyRate] = useState(4500);
  const [mileageRate, setMileageRate] = useState(100);
  const [billingMethod, setBillingMethod] = useState('hourly');
  const [landingFee, setLandingFee] = useState(250);
  const [includeLandingFees, setIncludeLandingFees] = useState(true);
  const [additionalCost, setAdditionalCost] = useState(0);
  const [useFlightTime, setUseFlightTime] = useState(true); // Toggle between flight time and total time
  
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
      
      if (billingMethod === 'hourly') {
        // Use either flight time or total time based on toggle
        const timeHours = useFlightTime ? routeData.flightTimeHours : routeData.totalTimeHours;
        const timeDisplay = useFlightTime ? routeData.flightTime : routeData.totalTime;
        
        mainCost = timeHours * hourlyRate;
        
        return {
          mainCost,
          timeHours,
          timeDisplay,
          isFlightTime: useFlightTime,
          landingCost: includeLandingFees && routeData.landings > 0 ? routeData.landings * landingFee : 0,
          extra: parseFloat(additionalCost) || 0,
          totalCost: mainCost + 
                     (includeLandingFees && routeData.landings > 0 ? routeData.landings * landingFee : 0) + 
                     (parseFloat(additionalCost) || 0)
        };
      } else { // mileage
        mainCost = routeData.distance * mileageRate;
        
        // Calculate landing fees if included
        const landingCost = includeLandingFees && routeData.landings > 0
          ? routeData.landings * landingFee
          : 0;
        
        // Additional cost
        const extra = parseFloat(additionalCost) || 0;
        
        // Total cost
        const totalCost = mainCost + landingCost + extra;
        
        return {
          mainCost,
          landingCost,
          extra,
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
            onChange={(e) => setBillingMethod(e.target.value)}
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
              onChange={(e) => setHourlyRate(Number(e.target.value))}
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
              onChange={(e) => setMileageRate(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
        
        <div className="mb-2">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="include-landing-fees" 
              checked={includeLandingFees}
              onChange={(e) => setIncludeLandingFees(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="include-landing-fees">Include Landing Fees</label>
          </div>
        </div>
        
        {includeLandingFees && (
          <div className="mb-4">
            <label htmlFor="landing-fee">Landing Fee (USD):</label>
            <input 
              type="number" 
              id="landing-fee" 
              value={landingFee}
              min="0"
              step="50"
              onChange={(e) => setLandingFee(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="additional-cost">Additional Cost (USD):</label>
          <input 
            type="number" 
            id="additional-cost" 
            value={additionalCost}
            min="0"
            step="100"
            onChange={(e) => setAdditionalCost(Number(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <h4>Cost Breakdown</h4>
        {routeData.hasRoute && costs ? (
          <div className="finance-results">
            <div className="finance-item">
              <div className="finance-label">
                {billingMethod === 'hourly' 
                  ? `Flight Time Cost (${routeData.flightTime}):`
                  : `Distance Cost (${routeData.distance} nm):`
                }
              </div>
              <div className="finance-value">{formatCurrency(costs.mainCost)}</div>
            </div>
            
            {includeLandingFees && routeData.landings > 0 && (
              <div className="finance-item">
                <div className="finance-label">Landing Fees ({routeData.landings} landings):</div>
                <div className="finance-value">{formatCurrency(costs.landingCost)}</div>
              </div>
            )}
            
            {additionalCost > 0 && (
              <div className="finance-item">
                <div className="finance-label">Additional Cost:</div>
                <div className="finance-value">{formatCurrency(costs.extra)}</div>
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