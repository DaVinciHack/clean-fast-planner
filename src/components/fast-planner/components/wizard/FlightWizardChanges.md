# FlightWizard.jsx Integration Changes

## 1. Add Import (Top of file, around line 3)

```javascript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import PassengerInputStep from './PassengerInputStep'; // ADD THIS LINE
import './FlightWizard.css';
```

## 2. Update Steps Array (Line 223)

**Replace this:**
```javascript
const steps = [
  { id: 'welcome', title: 'Welcome to FastPlanner' },
  { id: 'flightList', title: 'Select Flight to Load/Edit' },
  { id: 'departure', title: 'Where are you departing from?' },
  { id: 'landings', title: 'Add any rigs and final destination' },
  { id: 'aircraft', title: 'Which aircraft will you use?' },
  { id: 'time', title: 'When do you want to depart?' },
  { id: 'complete', title: 'Ready to plan your flight!' }
];
```

**With this:**
```javascript
const steps = [
  { id: 'welcome', title: 'Welcome to FastPlanner' },
  { id: 'flightList', title: 'Select Flight to Load/Edit' },
  { id: 'departure', title: 'Where are you departing from?' },
  { id: 'landings', title: 'Add any rigs and final destination' },
  { id: 'aircraft', title: 'Which aircraft will you use?' },
  { id: 'passengers', title: 'How many passengers and cargo?' }, // NEW STEP
  { id: 'time', title: 'When do you want to depart?' },
  { id: 'complete', title: 'Ready to plan your flight!' }
];
```

## 3. Add Passenger Step Rendering (Insert between aircraft step and time step, around line 750)

**Add this right after the aircraft step (after line 749):**

```javascript
          {currentStepData.id === 'passengers' && (
            <div className="wizard-step passengers-step">
              <PassengerInputStep
                flightData={flightData}
                onFlightDataUpdate={setFlightData}
                className="passenger-input-wizard"
              />
              
              <div className="wizard-buttons">
                <button className="wizard-btn secondary" onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </button>
                <button className="wizard-btn primary" onClick={handleNext}>
                  Next
                </button>
              </div>
            </div>
          )}
```

## 4. Add CSS Styling (Add to FlightWizard.css)

```css
/* Passenger Step Styling */
.wizard-step.passengers-step {
  min-height: auto;
}

.passenger-input-wizard {
  margin-bottom: 30px;
}

.wizard-step.passengers-step .wizard-buttons {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}
```

## 5. Update Complete Step to Use Passenger Data (Around line 800+)

**In the complete step (currentStepData.id === 'complete'), update the flight completion logic to include passenger data:**

```javascript
const handleCompleteWizard = () => {
  // Extract waypoints from flight data
  const waypoints = [];
  
  if (flightData.departure) {
    waypoints.push(flightData.departure);
  }
  
  if (flightData.landings && flightData.landings.length > 0) {
    waypoints.push(...flightData.landings);
  }
  
  // Pass complete flight data including passengers
  onComplete({
    waypoints,
    aircraft: flightData.aircraft,
    departureTime: flightData.departureTime,
    passengers: flightData.passengers // NEW: Pass passenger data
  });
  
  handleClose();
};
```

## Complete Integration Summary

The wizard flow will now be:

1. **Welcome** → "Welcome to FastPlanner"
2. **Flight List** → "Select Flight to Load/Edit" (optional)
3. **Departure** → "Where are you departing from?"
4. **Landings** → "Add any rigs and final destination"
5. **Aircraft** → "Which aircraft will you use?"
6. **Passengers** → "How many passengers and cargo?" (**NEW STEP**)
7. **Time** → "When do you want to depart?"
8. **Complete** → "Ready to plan your flight!"

## Passenger Data Structure

The passenger data will be stored in `flightData.passengers` with this structure:

```javascript
{
  enabled: true/false,
  standardWeight: 220,
  useStandardWeights: true/false,
  legData: {
    'departure': {
      passengerCount: 15,
      passengerWeight: 220,
      cargoWeight: 500,
      combinedWeight: true
    },
    'leg-0': {
      passengerCount: 12,
      passengerWeight: 220,
      cargoWeight: 200,
      combinedWeight: true
    }
    // ... more legs
  }
}
```

This data will then be used by your fuel stop optimization system to detect passenger overload and suggest fuel stops!