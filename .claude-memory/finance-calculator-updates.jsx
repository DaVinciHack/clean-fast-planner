// Updates for FinanceCard.jsx to add Day Rate and Fuel Cost
// This shows the key changes needed

// 1. Add new state variables (around line 20)
const [dayRate, setDayRate] = useState(() => loadSetting('dayRate', 0));
const [useDayRate, setUseDayRate] = useState(() => loadSetting('useDayRate', false));
const [fuelPricePerUnit, setFuelPricePerUnit] = useState(() => loadSetting('fuelPricePerUnit', 5.50));
const [fuelUnit, setFuelUnit] = useState(() => loadSetting('fuelUnit', 'gallons')); // gallons, liters, lbs
const [gph, setGph] = useState(() => loadSetting('gph', 100)); // Gallons Per Hour
const [includeFuelCost, setIncludeFuelCost] = useState(() => loadSetting('includeFuelCost', false));

// 2. Add update functions (around line 50)
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

// 3. Update calculateCosts function to include fuel cost
// Add fuel calculation:
const fuelCost = includeFuelCost && routeData.hasRoute ? 
  routeData.totalTimeHours * gph * fuelPricePerUnit : 0;

// Add day rate to the calculation
const dayRateCost = useDayRate ? dayRate : 0;

// 4. Add UI components (in the JSX return section)

// Day Rate Section (after billing method select)
{billingMethod === 'hourly' && (
  <div className="mb-4">
    <div className="flex items-center mb-2">
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
          className="w-full p-2 border rounded"
        />
      </div>
    )}
  </div>
)}

// Fuel Cost Section (after additional cost)
<div className="mb-4">
  <div className="flex items-center mb-2">
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
          className="w-full p-2 border rounded"
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
          className="w-full p-2 border rounded"
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
          className="w-full p-2 border rounded"
        />
      </div>
    </div>
  )}
</div>

// 5. Update Cost Breakdown to show:
// - Day Rate (if enabled)
// - Flight Hour Cost  
// - Fuel Cost (if enabled)
// - Landing Fees
// - Additional Cost
// - Total Estimated Cost (instead of just "Total Cost")

// 6. Fix the hourly rate input step from 100 to 1
<input 
  type="number" 
  id="hourly-rate" 
  value={hourlyRate}
  min="0"
  step="1"  // Changed from 100 to 1 for precision
  onChange={(e) => updateHourlyRate(Number(e.target.value))}
  className="w-full p-2 border rounded"
/>
