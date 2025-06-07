import React, { useState, useEffect } from 'react';

/**
 * Debug Panel Component
 * 
 * A simple component to display debugging information about the application state.
 * Can be toggled on/off with a button.
 */
const DebugPanel = ({ isVisible, mapManager, regionManager, platformManager, currentRegion }) => {
  const [platformMgrFixed, setPlatformMgrFixed] = useState(false);
  
  // Check and fix platformManager reference to mapManager
  useEffect(() => {
    if (platformManager && mapManager && !platformManager.mapManager) {
      console.log('DebugPanel: PlatformManager is missing mapManager reference, fixing...');
      platformManager.mapManager = mapManager;
      setPlatformMgrFixed(true);
    }
  }, [platformManager, mapManager]);
  
  if (!isVisible) return null;
  
  const mapStatus = mapManager ? {
    isInitialized: !!mapManager,
    isLoaded: mapManager.isMapLoaded ? mapManager.isMapLoaded() : 'unknown',
    hasMap: mapManager.getMap ? !!mapManager.getMap() : 'unknown'
  } : 'Not available';
  
  const regionStatus = regionManager ? {
    isInitialized: !!regionManager,
    hasMapManager: regionManager.mapManager ? 'yes' : 'no',
    currentRegion: regionManager.getCurrentRegion ? regionManager.getCurrentRegion()?.name || 'none' : 'unknown'
  } : 'Not available';
  
  const platformStatus = platformManager ? {
    isInitialized: !!platformManager,
    hasMapManager: platformManager.mapManager ? 'yes' : 'no',
    platformCount: platformManager.getPlatforms ? platformManager.getPlatforms().length : 'unknown',
    isVisible: platformManager.getVisibility ? platformManager.getVisibility() : 'unknown',
    referenceMgrFixed: platformMgrFixed ? 'FIXED!' : 'N/A'
  } : 'Not available';
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      padding: '10px',
      zIndex: 1000,
      fontFamily: 'monospace',
      fontSize: '12px',
      borderRadius: '5px',
      maxWidth: '300px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>Debug Info</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#66ccff' }}>Map Status</h4>
        <pre>{JSON.stringify(mapStatus, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#66ccff' }}>Region Status</h4>
        <pre>{JSON.stringify(regionStatus, null, 2)}</pre>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#66ccff' }}>Platform Status</h4>
        <pre>{JSON.stringify(platformStatus, null, 2)}</pre>
      </div>
      
      <div>
        <h4 style={{ margin: '0 0 5px 0', color: '#66ccff' }}>Current Region</h4>
        <pre>{JSON.stringify(currentRegion, null, 2)}</pre>
      </div>
      
      <button
        onClick={() => {
          if (platformManager && mapManager) {
            platformManager.mapManager = mapManager;
            setPlatformMgrFixed(true);
            alert('Fixed platformManager reference to mapManager!');
          }
        }}
        style={{
          marginTop: '10px',
          padding: '5px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Fix PlatformManager
      </button>
    </div>
  );
};

export default DebugPanel;