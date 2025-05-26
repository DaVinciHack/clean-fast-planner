import React from 'react';
import BaseCard from './BaseCard';

/**
 * EvacuationCard Component
 * 
 * Contains evacuation planning tools from the original RightPanel component.
 */
const EvacuationCard = ({ id }) => {
  return (
    <BaseCard title="Evacuation Planner" id={id}>
      <div className="control-section">
        <h4>Evacuation Parameters</h4>
        
        <label htmlFor="total-evacuees">Total Personnel to Evacuate:</label>
        <input 
          type="number" 
          id="total-evacuees" 
          defaultValue={120}
          min="1"
        />
        
        <label htmlFor="available-aircraft">Available Aircraft:</label>
        <select id="available-aircraft" multiple>
          <option value="N603PW">N603PW (AW139)</option>
          <option value="N604PW">N604PW (AW139)</option>
          <option value="N701BH">N701BH (S92)</option>
          <option value="N702BH">N702BH (S92)</option>
        </select>
        <div className="small-hint">Hold Ctrl/Cmd to select multiple</div>
        
        <label htmlFor="priority-level">Priority Level:</label>
        <select id="priority-level">
          <option value="1">1 - Immediate (Medical Emergency)</option>
          <option value="2">2 - Urgent (Weather Threat)</option>
          <option value="3" selected>3 - Standard Evacuation</option>
          <option value="4">4 - Non-Essential Personnel</option>
        </select>
        
        <button className="control-button evacuation-calculate">
          Calculate Evacuation Plan
        </button>
        
        <div className="evacuation-results">
          <h4>Evacuation Plan</h4>
          <div className="evacuation-summary">
            <div>Total Evacuees: 120</div>
            <div>Total Flights Required: 10</div>
            <div>Estimated Completion Time: 4:30</div>
          </div>
          
          <div className="evacuation-flight-list">
            <h5>Flight Schedule</h5>
            <div className="evacuation-flight">
              <div className="flight-number">Flight 1</div>
              <div className="flight-details">
                <div>N603PW - 12 pax</div>
                <div>Depart: 10:00 - Arrive: 10:45</div>
              </div>
            </div>
            <div className="evacuation-flight">
              <div className="flight-number">Flight 2</div>
              <div className="flight-details">
                <div>N701BH - 19 pax</div>
                <div>Depart: 10:15 - Arrive: 11:00</div>
              </div>
            </div>
            <div className="evacuation-flight">
              <div className="flight-number">Flight 3</div>
              <div className="flight-details">
                <div>N604PW - 12 pax</div>
                <div>Depart: 10:30 - Arrive: 11:15</div>
              </div>
            </div>
            <div className="evacuation-more">+7 more flights...</div>
          </div>
        </div>
      </div>
    </BaseCard>
  );
};

export default EvacuationCard;