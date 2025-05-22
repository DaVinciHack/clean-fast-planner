
    <BaseCard title="Finance Calculator" id={id}>
      {/* Billing Method Section */}
      <div className="finance-calculator-section">
        <h4>Billing Method</h4>
        <select 
          id="billing-method"
          value={billingMethod}
          onChange={(e) => updateBillingMethod(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="hourly">Hourly Rate</option>
          <option value="mileage">Per Nautical Mile</option>
        </select>
        
        {billingMethod === 'hourly' ? (
          <div className="mt-4">
            <div className="finance-grid">
              <div className="finance-input-group">
                <label htmlFor="hourly-rate">Hourly Rate (USD)</label>
                <input 
                  type="number" 
                  id="hourly-rate" 
                  value={hourlyRate}
                  min="0"
                  step="1"
                  onChange={(e) => updateHourlyRate(Number(e.target.value))}
                />
              </div>
              
              <div className="finance-input-group">
                <div className="finance-checkbox-group">
                  <input 
                    type="checkbox" 
                    id="use-day-rate" 
                    checked={useDayRate}
                    onChange={(e) => updateUseDayRate(e.target.checked)}
                  />
                  <label htmlFor="use-day-rate">Include Day Rate</label>
                </div>
                {useDayRate && (
                  <input 
                    type="number" 
                    id="day-rate" 
                    value={dayRate}
                    min="0"
                    step="100"
                    onChange={(e) => updateDayRate(Number(e.target.value))}
                    placeholder="Day Rate (USD)"
                    className="mt-2"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="finance-input-group">
              <label htmlFor="mileage-rate">Rate per NM (USD)</label>
              <input 
                type="number" 
                id="mileage-rate" 
                value={mileageRate}
                min="0"
                step="10"
                onChange={(e) => updateMileageRate(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Additional Costs Section */}
      <div className="finance-calculator-section">
        <h4>Additional Costs</h4>
        
        {/* Landing Fees */}
        <div className="finance-checkbox-group">
          <input 
            type="checkbox" 
            id="include-landing-fees" 
            checked={includeLandingFees}
            onChange={(e) => updateIncludeLandingFees(e.target.checked)}
          />
          <label htmlFor="include-landing-fees">Include Landing Fees</label>
        </div>
        
        {includeLandingFees && (
          <div className="finance-collapsible">
            <div className="finance-grid">
              <div className="finance-input-group">
                <label htmlFor="landing-fee">Landing Fee (USD)</label>
                <input 
                  type="number" 
                  id="landing-fee" 
                  value={landingFee}
                  min="0"
                  step="50"
                  onChange={(e) => updateLandingFee(Number(e.target.value))}
                />
              </div>
              <div className="finance-input-group">
                <label htmlFor="custom-landings">Number of Landings</label>
                <input 
                  type="number" 
                  id="custom-landings" 
                  value={customLandings}
                  min="0"
                  step="1"
                  onChange={(e) => updateCustomLandings(Number(e.target.value))}
                />
                <div className="finance-info">Airports only, not rigs</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Additional Cost */}
        <div className="finance-input-group mt-4">
          <label htmlFor="additional-cost">Additional Cost (USD)</label>
          <input 
            type="number" 
            id="additional-cost" 
            value={additionalCost}
            min="0"
            step="100"
            onChange={(e) => updateAdditionalCost(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Fuel Cost Section */}
      <div className="finance-calculator-section">
        <h4>Fuel Cost</h4>
        <div className="finance-checkbox-group">
          <input 
            type="checkbox" 
            id="include-fuel" 
            checked={includeFuelCost}
            onChange={(e) => updateIncludeFuelCost(e.target.checked)}
          />
          <label htmlFor="include-fuel">Include Fuel Cost</label>
        </div>
        
        {includeFuelCost && (
          <div className="finance-collapsible">
            <div className="finance-grid">
              <div className="finance-input-group">
                <label htmlFor="fuel-unit">Fuel Unit</label>
                <select 
                  id="fuel-unit"
                  value={fuelUnit}
                  onChange={(e) => updateFuelUnit(e.target.value)}
                >
                  <option value="gallons">Gallons</option>
                  <option value="liters">Liters</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>
              
              <div className="finance-input-group">
                <label htmlFor="gph">
                  {fuelUnit === 'gallons' ? 'GPH' : fuelUnit === 'liters' ? 'LPH' : 'PPH'}
                </label>
                <input 
                  type="number" 
                  id="gph" 
                  value={gph}
                  min="0"
                  step="10"
                  onChange={(e) => updateGph(Number(e.target.value))}
                />
              </div>
              
              <div className="finance-input-group finance-grid-full">
                <label htmlFor="fuel-price">
                  Fuel Price per {fuelUnit === 'lbs' ? 'pound' : fuelUnit.slice(0, -1)} (USD)
                </label>
                <input 
                  type="number" 
                  id="fuel-price" 
                  value={fuelPricePerUnit}
                  min="0"
                  step="0.01"
                  onChange={(e) => updateFuelPricePerUnit(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}
      </div>