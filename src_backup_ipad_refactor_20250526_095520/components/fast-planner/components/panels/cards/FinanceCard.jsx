import React, { useState, useEffect } from 'react';
import BaseCard from './BaseCard';
import './FinanceCard.css';
import { PDFButton } from '../../../modules/pdf';

/**
 * Finance Calculator Component with browser persistence
 */
const FinanceCard = ({ 
  id,
  // New props for PDF generation
  routeStats = null,
  stopCards = null,
  selectedAircraft = null,
  waypoints = null
}) => {
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
  const [includeTax, setIncludeTax] = useState(() => loadSetting('includeTax', false));
  
  // Day rate and fuel cost states
  const [dayRate, setDayRate] = useState(() => loadSetting('dayRate', 0));
  const [useDayRate, setUseDayRate] = useState(() => loadSetting('useDayRate', false));
  const [fuelPricePerUnit, setFuelPricePerUnit] = useState(() => loadSetting('fuelPricePerUnit', 5.50));
  const [fuelUnit, setFuelUnit] = useState(() => loadSetting('fuelUnit', 'gallons')); // gallons, liters, lbs
  const [gph, setGph] = useState(() => loadSetting('gph', 100)); // Gallons Per Hour
  const [includeFuelCost, setIncludeFuelCost] = useState(() => loadSetting('includeFuelCost', false)); // Toggle tax calculation
  
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
  
  const updateDayRate = (value) => {
    setDayRate(value);
    saveSetting('dayRate', value);
  };
  
  const updateUseDayRate = (value) => {
    setUseDayRate(value);
    saveSetting('useDayRate', value);
  };
  
  const updateFuelPricePerUnit = (value) => {
    setFuelPricePerUnit(value);
    saveSetting('fuelPricePerUnit', value);
  };
  
  const updateFuelUnit = (value) => {
    setFuelUnit(value);
    saveSetting('fuelUnit', value);
  };
  
  const updateGph = (value) => {
    setGph(value);
    saveSetting('gph', value);
  };
  
  const updateIncludeFuelCost = (value) => {
    setIncludeFuelCost(value);
    saveSetting('includeFuelCost', value);
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
      
            // Calculate fuel cost if included
      const fuelCost = includeFuelCost && routeData.hasRoute && routeData.totalTimeHours > 0
        ? routeData.totalTimeHours * gph * fuelPricePerUnit
        : 0;
      
      // Day rate cost
      const dayRateCost = useDayRate ? dayRate : 0;
      
      // Additional cost
      const extra = parseFloat(additionalCost) || 0;
      
      if (billingMethod === 'hourly') {
        // Use either flight time or total time based on toggle
        const timeHours = useFlightTime ? routeData.flightTimeHours : routeData.totalTimeHours;
        const timeDisplay = useFlightTime ? routeData.flightTime : routeData.totalTime;
        
        mainCost = timeHours * hourlyRate;
        
        // Subtotal before tax
        const subtotal = mainCost + dayRateCost + fuelCost + landingCost + extra;
        
        // Calculate tax if included
        const taxAmount = includeTax ? (subtotal * taxRate / 100) : 0;
        
        // Total cost including tax if applicable
        const totalCost = subtotal + taxAmount;
        
        return {
          mainCost,
          timeHours,
          timeDisplay,
          isFlightTime: useFlightTime,
          dayRateCost,
          fuelCost,
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
        const subtotal = mainCost + dayRateCost + fuelCost + landingCost + extra;
        
        // Calculate tax if included
        const taxAmount = includeTax ? (subtotal * taxRate / 100) : 0;
        
        // Total cost including tax if applicable
        const totalCost = subtotal + taxAmount;
        
        return {
          mainCost,
          landingCost,
          landingsCount,
          extra,
          dayRateCost,
          fuelCost,
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
      <div className="control-section finance-calculator-section">
        <h4>Flight Cost Parameters</h4>
        
        <div className="finance-input-group">
          <label htmlFor="billing-method">Billing Method:</label>
          <select 
            id="billing-method"
            value={billingMethod}
            onChange={(e) => updateBillingMethod(e.target.value)}
            className="finance-input"
          >
            <option value="hourly">Hourly Rate</option>
            <option value="mileage">Per Nautical Mile</option>
          </select>
        </div>
        
        {billingMethod === 'hourly' ? (
          <>
            <div className="finance-input-group">
              <label htmlFor="hourly-rate">Hourly Rate (USD):</label>
              <input 
                type="number" 
                id="hourly-rate" 
                value={hourlyRate}
                min="0"
                step="1"
                onChange={(e) => updateHourlyRate(Number(e.target.value))}
                className="finance-input"
              />
            </div>
            
            {/* Day Rate Option */}
            <div className="finance-input-group">
              <div className="finance-checkbox-group">
                <input 
                  type="checkbox" 
                  id="use-day-rate" 
                  checked={useDayRate}
                  onChange={(e) => updateUseDayRate(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="use-day-rate">Include Day Rate</label>
              </div>
              
              {useDayRate && (
              <div>
                <label htmlFor="day-rate">Day Rate (USD):</label>
                <input 
                  type="number" 
                  id="day-rate" 
                  value={dayRate}
                  min="0"
                  step="100"
                  onChange={(e) => updateDayRate(Number(e.target.value))}
                  className="finance-input"
                />
              </div>
              )}
            </div>
          </>
        ) : (
          <div className="finance-input-group">
            <label htmlFor="mileage-rate">Rate per NM (USD):</label>
            <input 
              type="number" 
              id="mileage-rate" 
              value={mileageRate}
              min="0"
              step="10"
              onChange={(e) => updateMileageRate(Number(e.target.value))}
              className="finance-input"
            />
          </div>
        )}
        
        <div className="finance-input-group">
          <div className="finance-checkbox-group">
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
                  className="finance-input"
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
                  className="finance-input"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Only count landings at airports, not rigs
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="finance-input-group">
          <label htmlFor="additional-cost">Additional Cost (USD):</label>
          <input 
            type="number" 
            id="additional-cost" 
            value={additionalCost}
            min="0"
            step="100"
            onChange={(e) => updateAdditionalCost(Number(e.target.value))}
            className="finance-input"
          />
        </div>
        
        {/* Fuel Cost Calculator */}
        <div className="finance-input-group">
          <div className="finance-checkbox-group">
            <input 
              type="checkbox" 
              id="include-fuel" 
              checked={includeFuelCost}
              onChange={(e) => updateIncludeFuelCost(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="include-fuel">Include Fuel Cost</label>
          </div>
          
          {includeFuelCost && (
            <div>
              <div className="mb-2">
                <label htmlFor="fuel-unit">Fuel Unit:</label>
                <select 
                  id="fuel-unit"
                  value={fuelUnit}
                  onChange={(e) => updateFuelUnit(e.target.value)}
                  className="finance-input"
                >
                  <option value="gallons">Gallons</option>
                  <option value="liters">Liters</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>
              
              <div className="mb-2">
                <label htmlFor="gph">
                  {fuelUnit === 'gallons' ? 'GPH' : fuelUnit === 'liters' ? 'LPH' : 'PPH'} 
                  ({fuelUnit === 'gallons' ? 'Gallons' : fuelUnit === 'liters' ? 'Liters' : 'Pounds'} Per Hour):
                </label>
                <input 
                  type="number" 
                  id="gph" 
                  value={gph}
                  min="0"
                  step="10"
                  onChange={(e) => updateGph(Number(e.target.value))}
                  className="finance-input"
                />
              </div>
              
              <div className="mb-2">
                <label htmlFor="fuel-price">Fuel Price per {fuelUnit === 'lbs' ? 'pound' : fuelUnit.slice(0, -1)}:</label>
                <input 
                  type="number" 
                  id="fuel-price" 
                  value={fuelPricePerUnit}
                  min="0"
                  step="0.01"
                  onChange={(e) => updateFuelPricePerUnit(Number(e.target.value))}
                  className="finance-input"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Time Type Toggle Switch - Simplified UI */}
        {billingMethod === 'hourly' && (
          <div className="finance-input-group">
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
        <div className="finance-input-group">
          <div className="finance-checkbox-group">
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
                className="finance-input"
              />
            </div>
          )}
        </div>
        
        </div>
      <div className="cost-breakdown-section">
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
            
            {costs.dayRateCost > 0 && (
              <div className="finance-item">
                <div className="finance-label">Day Rate:</div>
                <div className="finance-value">{formatCurrency(costs.dayRateCost)}</div>
              </div>
            )}
            
            {costs.fuelCost > 0 && (
              <div className="finance-item">
                <div className="finance-label">Fuel Cost ({routeData.totalTime}):</div>
                <div className="finance-value">{formatCurrency(costs.fuelCost)}</div>
              </div>
            )}
            
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
            
            {/* PDF Report Button */}
            <div className="finance-pdf-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <PDFButton
                routeStats={routeStats}
                stopCards={stopCards}
                selectedAircraft={selectedAircraft}
                waypoints={waypoints}
                costData={{
                  totalCost: costs.totalCost,
                  flightTimeCost: costs.mainCost,
                  dayRate: costs.dayRateCost,
                  fuelCost: costs.fuelCost,
                  landingFees: costs.landingCost,
                  additionalCost: costs.extra,
                  tax: includeTax ? costs.taxAmount : null,
                  includeTax: includeTax
                }}
                buttonText="📄 Download Flight Report"
                className="finance-pdf-button"
              />
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