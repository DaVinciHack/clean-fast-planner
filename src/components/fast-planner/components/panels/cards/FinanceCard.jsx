import React from 'react';
import BaseCard from './BaseCard';

/**
 * FinanceCard Component
 * 
 * Contains finance calculations and billing details from the original RightPanel component.
 */
const FinanceCard = ({ id }) => {
  return (
    <BaseCard title="Finance Calculator" id={id}>
      <div className="control-section">
        <h4>Flight Cost Parameters</h4>
        
        <label htmlFor="hourly-rate">Hourly Rate (USD):</label>
        <input 
          type="number" 
          id="hourly-rate" 
          defaultValue={4500}
          min="0"
          step="100"
        />
        
        <label htmlFor="landing-fee">Landing Fee (USD):</label>
        <input 
          type="number" 
          id="landing-fee" 
          defaultValue={250}
          min="0"
          step="50"
        />
        
        <label htmlFor="fuel-cost">Fuel Cost (USD/lb):</label>
        <input 
          type="number" 
          id="fuel-cost" 
          defaultValue={3.25}
          min="0"
          step="0.05"
        />
        
        <h4>Contract Details</h4>
        
        <label htmlFor="billing-method">Billing Method:</label>
        <select id="billing-method">
          <option value="hourly">Hourly Rate</option>
          <option value="fixed">Fixed Price</option>
          <option value="mileage">Per Nautical Mile</option>
        </select>
        
        <button className="control-button finance-calculate">
          Calculate Quote
        </button>
        
        <div className="finance-results">
          <h4>Cost Breakdown</h4>
          <div className="finance-item">
            <div className="finance-label">Flight Time Cost:</div>
            <div className="finance-value">$9,900.00</div>
          </div>
          <div className="finance-item">
            <div className="finance-label">Landing Fees:</div>
            <div className="finance-value">$2,500.00</div>
          </div>
          <div className="finance-item">
            <div className="finance-label">Fuel Cost:</div>
            <div className="finance-value">$16,850.00</div>
          </div>
          <div className="finance-item total">
            <div className="finance-label">Total Cost:</div>
            <div className="finance-value">$29,250.00</div>
          </div>
          <div className="finance-item per-passenger">
            <div className="finance-label">Cost Per Passenger (12 pax):</div>
            <div className="finance-value">$2,437.50</div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

export default FinanceCard;