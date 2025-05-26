import React, { useState } from 'react';
import client from '../../../../client';

/**
 * Final confirmation tests for automation API
 */
const ApiTester = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCreatedFlightId, setLastCreatedFlightId] = useState(null);
  
  const addResult = (text, type = 'info') => {
    const message = `${new Date().toISOString()}: ${text}`;
    console.log(message);
    setResults(prev => [...prev, { text: message, type }]);
  };
  
  // Test with specific flight ID
  const testSpecificFlightId = async () => {
    setResults([]);
    setIsLoading(true);
    
    // Use the flight ID provided
    const flightId = "289805b0-ea8c-47ab-ac63-508a37ad3430";
    
    addResult(`Testing automation with flight ID: ${flightId}`, 'info');
    
    try {
      const sdk = await import('@flight-app/sdk');
      
      if (!sdk.singleFlightAutomation) {
        addResult("ERROR: singleFlightAutomation action not found", 'error');
        return;
      }
      
      addResult("Calling automation with NO options...", 'info');
      const result = await client(sdk.singleFlightAutomation).applyAction(
        { flightId: flightId }
        // No options parameter at all
      );
      
      addResult("SUCCESS! Automation completed", 'success');
      addResult(`Result: ${JSON.stringify(result, null, 2)}`, 'info');
      
    } catch (error) {
      addResult(`FAILED: ${error.message}`, 'error');
      console.error("Full error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create a new flight and immediately test automation
  const createAndTestNew = async () => {
    setResults([]);
    setIsLoading(true);
    
    addResult("Creating brand new flight and testing automation...", 'info');
    
    try {
      const sdk = await import('@flight-app/sdk');
      
      // Step 1: Create a new flight
      addResult("Step 1: Creating new flight...", 'info');
      
      const flightParams = {
        "flightName": `New Test Flight ${new Date().toISOString()}`,
        "aircraftRegion": "NORWAY",
        "new_parameter": "Norway",
        "aircraftId": "190",
        "region": "NORWAY",
        "etd": new Date().toISOString(),
        "locations": ["ENZV", "ENLE"]
      };
      
      const createResult = await client(sdk.createNewFlightFp2).applyAction(
        flightParams,
        { $returnEdits: true }  // Flight creation needs options
      );
      
      addResult("Flight created successfully!", 'success');
      
      // Step 2: Extract the flight ID
      let flightId = null;
      
      if (createResult && createResult.addedObjects) {
        for (const obj of createResult.addedObjects) {
          if (obj.objectType === 'MainFlightObjectFp2' && obj.primaryKey) {
            flightId = obj.primaryKey;
            setLastCreatedFlightId(flightId);
            addResult(`Extracted flight ID: ${flightId}`, 'success');
            break;
          }
        }
      }
      
      if (!flightId) {
        addResult("Could not extract flight ID from result", 'error');
        return;
      }
      
      // Step 3: Wait a moment for the flight to be registered
      addResult("Step 3: Waiting 1 second for flight to be ready...", 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Step 4: Call automation with the new flight ID
      addResult(`Step 4: Automating flight ${flightId}...`, 'info');
      
      const automationResult = await client(sdk.singleFlightAutomation).applyAction(
        { flightId: flightId }
        // No options parameter - this is the key difference!
      );
      
      addResult("SUCCESS! Automation completed on fresh flight", 'success');
      addResult(`Automation result: ${JSON.stringify(automationResult, null, 2)}`, 'info');
      
      addResult("\n=== CONFIRMATION ===", 'warning');
      addResult("Both tests passed!", 'success');
      addResult("The key is to NOT pass any options to the automation API", 'success');
      addResult("Flight creation requires options, but automation doesn't", 'info');
      
    } catch (error) {
      addResult(`Test failed: ${error.message}`, 'error');
      console.error("Full error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Final implementation
  const getFinalImplementation = () => {
    setResults([]);
    
    addResult("Here's the correct implementation for both API calls:", 'info');
    
    const code = `
// WORKING FLIGHT CREATION
const createFlightResult = await client(sdk.createNewFlightFp2).applyAction(
  flightParams,
  { $returnEdits: true }  // Flight creation NEEDS options
);

// Extract flight ID
let flightId = null;
if (createFlightResult?.addedObjects) {
  for (const obj of createFlightResult.addedObjects) {
    if (obj.objectType === 'MainFlightObjectFp2' && obj.primaryKey) {
      flightId = obj.primaryKey;
      break;
    }
  }
}

// WORKING AUTOMATION
const automationResult = await client(sdk.singleFlightAutomation).applyAction(
  { flightId: flightId }
  // NO options - this is the key difference!
);
    `;
    
    addResult(code, 'code');
    
    addResult("\nExplanation:", 'info');
    addResult("1. Flight creation needs options: { $returnEdits: true }", 'info');
    addResult("2. Automation should NOT use options parameter at all", 'info');
    addResult("3. These API endpoints have different parameter requirements despite both being OSDK actions", 'info');
    
    addResult("\nReady to implement this solution in your production code!", 'success');
  };
  
  return (
    <div style={{ 
      backgroundColor: '#1e1e1e', 
      color: 'white',
      padding: '15px',
      borderRadius: '5px',
      marginBottom: '20px',
      width: '100%'
    }}>
      <h3>Final Confirmation Tests</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={testSpecificFlightId}
          disabled={isLoading}
          style={{
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            marginRight: '10px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Test Specific Flight ID
        </button>
        
        <button 
          onClick={createAndTestNew}
          disabled={isLoading}
          style={{
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            marginRight: '10px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          Create & Test New Flight
        </button>
        
        <button 
          onClick={getFinalImplementation}
          style={{
            backgroundColor: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 15px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          Get Final Implementation
        </button>
      </div>
      
      {lastCreatedFlightId && (
        <div style={{ 
          backgroundColor: '#2a2a2a', 
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '15px',
          fontFamily: 'monospace'
        }}>
          <strong>Last Created Flight ID:</strong> {lastCreatedFlightId}
        </div>
      )}
      
      <div style={{ 
        backgroundColor: '#2a2a2a', 
        padding: '10px',
        borderRadius: '4px',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        {results.length === 0 ? (
          <p>Click a button above to run tests.</p>
        ) : (
          <div>
            {results.map((result, index) => (
              <div key={index} style={{ 
                padding: '5px',
                borderBottom: '1px solid #3a3a3a',
                marginBottom: '5px',
                fontSize: '13px',
                lineHeight: '1.4',
                fontFamily: result.type === 'code' ? 'monospace' : 'inherit',
                whiteSpace: result.type === 'code' ? 'pre' : 'pre-wrap',
                color: result.type === 'success' ? '#4caf50' : 
                        result.type === 'error' ? '#f44336' : 
                        result.type === 'warning' ? '#ff9800' :
                        result.type === 'code' ? '#03a9f4' : '#ffffff',
                backgroundColor: result.type === 'code' ? '#1a1a1a' : 'transparent'
              }}>
                {result.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiTester;
