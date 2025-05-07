import React, { useState } from 'react';
import client from '../../../../client';

/**
 * ApiTester Component with advanced debugging
 * 
 * This version tries different object IDs and parameter combinations
 */
const ApiTester = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCreatedFlightId, setLastCreatedFlightId] = useState(null);
  const [allCreatedIds, setAllCreatedIds] = useState({});
  
  const addResult = (text, type = 'info') => {
    const message = `${new Date().toISOString()}: ${text}`;
    console.log(message); // Also log to console
    setResults(prev => [...prev, { text: message, type }]);
  };
  
  // Test creating a flight and trying automation with all possible IDs
  const testAllObjectAutomation = async () => {
    setIsLoading(true);
    setResults([]);
    addResult("Starting comprehensive automation test...", 'info');
    
    try {
      const sdk = await import('@flight-app/sdk');
      
      // First, create a new flight
      addResult("Step 1: Creating a new flight...", 'info');
      
      const flightParams = {
        "flightName": `Comprehensive Test Flight ${new Date().toISOString()}`,
        "aircraftRegion": "NORWAY",
        "new_parameter": "Norway",
        "aircraftId": "190",
        "region": "NORWAY",
        "etd": new Date().toISOString(),
        "locations": ["ENZV", "ENLE"]
      };
      
      const createResult = await client(sdk.createNewFlightFp2).applyAction(
        flightParams,
        { $returnEdits: true }
      );
      
      addResult("Flight created successfully!", 'success');
      console.log('Flight creation result:', createResult);
      
      // Extract ALL object IDs
      const createdIds = {};
      
      if (createResult && createResult.addedObjects) {
        addResult("Extracting all created object IDs...", 'info');
        
        createResult.addedObjects.forEach(obj => {
          createdIds[obj.objectType] = obj.primaryKey;
          addResult(`Found ${obj.objectType}: ${obj.primaryKey}`, 'info');
        });
        
        setAllCreatedIds(createdIds);
      }
      
      // Save the MainFlightObjectFp2 ID as the primary ID
      if (createdIds.MainFlightObjectFp2) {
        setLastCreatedFlightId(createdIds.MainFlightObjectFp2);
      }
      
      // Wait for the flight to be ready
      addResult("Step 2: Waiting 2 seconds for flight to be ready...", 'info');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now try automation with each type of object ID
      addResult("Step 3: Testing automation with different object IDs...", 'info');
      
      let automationSucceeded = false;
      
      for (const [objectType, objectId] of Object.entries(createdIds)) {
        addResult(`\n--- Testing with ${objectType} ID: ${objectId} ---`, 'info');
        
        try {
          const automationParams = { flightId: objectId };
          const automationOptions = { returnEdits: true };
          
          addResult(`Attempting automation...`, 'info');
          
          const automationResult = await client(sdk.singleFlightAutomation).applyAction(
            automationParams,
            automationOptions
          );
          
          addResult(`SUCCESS! Automation worked with ${objectType} ID!`, 'success');
          addResult(`Result: ${JSON.stringify(automationResult, null, 2)}`, 'info');
          automationSucceeded = true;
          break; // Stop trying once we find a working ID
          
        } catch (error) {
          addResult(`Failed with ${objectType} ID: ${error.message}`, 'error');
          
          // Try with different options
          const alternativeOptions = [
            { mode: "VALIDATE_AND_EXECUTE", returnEdits: "ALL_V2_WITH_DELETIONS" },
            { mode: "VALIDATE_ONLY" },
            {},
            null
          ];
          
          for (const options of alternativeOptions) {
            try {
              addResult(`  Trying with options: ${JSON.stringify(options)}`, 'info');
              const result = await client(sdk.singleFlightAutomation).applyAction(
                { flightId: objectId },
                options
              );
              addResult(`SUCCESS with ${objectType} and options ${JSON.stringify(options)}!`, 'success');
              addResult(`Result: ${JSON.stringify(result, null, 2)}`, 'info');
              automationSucceeded = true;
              break;
            } catch (err) {
              addResult(`  Failed with options ${JSON.stringify(options)}: ${err.message}`, 'error');
            }
          }
          
          if (automationSucceeded) break;
        }
      }
      
      if (!automationSucceeded) {
        addResult("\n=== ADDITIONAL DEBUGGING ===", 'warning');
        addResult("None of the object IDs worked. Let's try some different approaches:", 'info');
        
        // Try to inspect the automation action parameters
        if (sdk.singleFlightAutomation && sdk.singleFlightAutomation.apiName) {
          addResult(`Automation API name: ${sdk.singleFlightAutomation.apiName}`, 'info');
        }
        
        // Try with a completely different parameter structure
        addResult("Trying alternative parameter structures...", 'info');
        
        const alternativeParams = [
          { flightId: createdIds.MainFlightObjectFp2 },
          { flight: createdIds.MainFlightObjectFp2 },
          { id: createdIds.MainFlightObjectFp2 },
          { primaryKey: createdIds.MainFlightObjectFp2 },
          { MainFlightObjectFp2: createdIds.MainFlightObjectFp2 },
          { object: { objectType: "MainFlightObjectFp2", primaryKey: createdIds.MainFlightObjectFp2 } }
        ];
        
        for (const params of alternativeParams) {
          try {
            addResult(`Trying params: ${JSON.stringify(params)}`, 'info');
            const result = await client(sdk.singleFlightAutomation).applyAction(
              params,
              { returnEdits: true }
            );
            addResult(`SUCCESS with params ${JSON.stringify(params)}!`, 'success');
            addResult(`Result: ${JSON.stringify(result, null, 2)}`, 'info');
            break;
          } catch (error) {
            addResult(`Failed: ${error.message}`, 'error');
          }
        }
      }
      
    } catch (error) {
      addResult(`Overall test failed: ${error.message}`, 'error');
      console.error('Full error details:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check the automation action definition
  const inspectAutomationAction = async () => {
    setIsLoading(true);
    setResults([]);
    addResult("Inspecting singleFlightAutomation action...", 'info');
    
    try {
      const sdk = await import('@flight-app/sdk');
      
      // Get the automation action
      const automationAction = sdk.singleFlightAutomation;
      
      if (automationAction) {
        addResult("Found singleFlightAutomation action", 'success');
        
        // Try to inspect its properties
        addResult("Action properties:", 'info');
        const properties = Object.getOwnPropertyNames(automationAction);
        properties.forEach(prop => {
          try {
            const value = automationAction[prop];
            if (typeof value !== 'function') {
              addResult(`  ${prop}: ${JSON.stringify(value)}`, 'info');
            } else {
              addResult(`  ${prop}: [Function]`, 'info');
            }
          } catch (e) {
            addResult(`  ${prop}: [Unable to inspect]`, 'info');
          }
        });
        
        // Check if it has parameter definitions
        if (automationAction.parameters) {
          addResult("Parameter definitions:", 'info');
          addResult(JSON.stringify(automationAction.parameters, null, 2), 'info');
        }
        
        // Check if we can get its API definition
        if (automationAction.apiName) {
          addResult(`API Name: ${automationAction.apiName}`,