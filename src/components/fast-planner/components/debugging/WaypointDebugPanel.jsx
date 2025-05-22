// src/components/fast-planner/components/debugging/WaypointDebugPanel.jsx

import React from 'react';
import { parseCoordinates, looksLikeCoordinates } from '../../utils/coordinateParser';

/**
 * Temporary debugging panel for waypoint functionality
 * This can be temporarily added to FastPlannerApp.jsx for debugging
 */
const WaypointDebugPanel = ({ 
  waypointManagerRef, 
  platformManagerRef, 
  onAddWaypoint,
  routeInput 
}) => {
  const runDiagnostic = () => {
    console.log('=== WAYPOINT SYSTEM DIAGNOSTIC ===');
    
    // Check managers
    console.log('waypointManagerRef.current:', !!waypointManagerRef.current);
    console.log('platformManagerRef.current:', !!platformManagerRef.current);
    console.log('onAddWaypoint function:', !!onAddWaypoint);
    console.log('Current routeInput:', JSON.stringify(routeInput));
    
    // Test coordinate parsing
    const testCoords = "60.7917, 5.3417";
    console.log(`Testing coordinate parsing with: "${testCoords}"`);
    console.log('looksLikeCoordinates:', looksLikeCoordinates(testCoords));
    const parseResult = parseCoordinates(testCoords);
    console.log('parseCoordinates result:', parseResult);
    
    // Test platform search
    if (platformManagerRef.current && typeof platformManagerRef.current.findPlatformByName === 'function') {
      const testPlatform = platformManagerRef.current.findPlatformByName('STAVANGER');
      console.log('Platform search test (STAVANGER):', !!testPlatform);
      if (testPlatform) {
        console.log('Found platform:', testPlatform.name, testPlatform.coordinates);
      }
    } else {
      console.log('Platform search not available');
    }
    
    console.log('=== DIAGNOSTIC COMPLETED ===');
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 10000,
      fontSize: '12px'
    }}>
      <h4>Waypoint Debug Panel</h4>
      <button onClick={runDiagnostic} style={{
        background: '#007bff',
        color: 'white',
        border: 'none',
        padding: '5px 10px',
        borderRadius: '3px',
        cursor: 'pointer'
      }}>
        Run Diagnostic
      </button>
      <div style={{ marginTop: '10px', fontSize: '11px' }}>
        <div>Manager Refs: {waypointManagerRef.current ? '✅' : '❌'} / {platformManagerRef.current ? '✅' : '❌'}</div>
        <div>addWaypoint: {onAddWaypoint ? '✅' : '❌'}</div>
        <div>Input: "{routeInput}"</div>
      </div>
    </div>
  );
};

export default WaypointDebugPanel;
