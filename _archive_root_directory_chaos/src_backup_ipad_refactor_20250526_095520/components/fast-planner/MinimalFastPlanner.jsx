import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';
import ErrorBoundary from './ErrorBoundary';

// Import Context Providers
import { 
  RegionProvider, 
  useRegion,
  AircraftProvider,
  useAircraft,
  MapProvider,
  useMap,
  RouteProvider,
  useRoute 
} from './context';

/**
 * MinimalDisplay - Just shows info without any UI components
 */
const MinimalDisplay = () => {
  const { regions, currentRegion, regionLoading } = useRegion();
  const { aircraftList, selectedAircraft, aircraftLoading } = useAircraft();
  const { mapReady, platformsLoaded, rigsLoading } = useMap();
  const { waypoints } = useRoute();
  
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#222', 
      color: '#eee',
      fontFamily: 'monospace',
      width: '80%',
      margin: '50px auto',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.5)'
    }}>
      <h1>Minimal FastPlanner with Contexts</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Region Context</h2>
        <p>Regions loaded: {regions.length}</p>
        <p>Current region: {currentRegion ? currentRegion.name : 'None'}</p>
        <p>Loading: {regionLoading ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Aircraft Context</h2>
        <p>Aircraft loaded: {aircraftList ? aircraftList.length : 0}</p>
        <p>Selected aircraft: {selectedAircraft ? selectedAircraft.registration : 'None'}</p>
        <p>Loading: {aircraftLoading ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Map Context</h2>
        <p>Map ready: {mapReady ? 'Yes' : 'No'}</p>
        <p>Platforms loaded: {platformsLoaded ? 'Yes' : 'No'}</p>
        <p>Rigs loading: {rigsLoading ? 'Yes' : 'No'}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Route Context</h2>
        <p>Waypoints: {waypoints.length}</p>
      </div>
    </div>
  );
};

/**
 * RouteAwareComponent - Provides route context
 */
const RouteAwareComponent = () => {
  const { selectedAircraft } = useAircraft();
  
  return (
    <RouteProvider aircraftData={selectedAircraft}>
      <MinimalDisplay />
    </RouteProvider>
  );
};

/**
 * MapAwareComponent - Provides map context
 */
const MapAwareComponent = () => {
  const { currentRegion } = useRegion();
  
  return (
    <MapProvider client={client} currentRegion={currentRegion}>
      <RouteAwareComponent />
    </MapProvider>
  );
};

/**
 * AircraftAwareComponent - Provides aircraft context
 */
const AircraftAwareComponent = () => {
  const { currentRegion } = useRegion();
  
  return (
    <AircraftProvider client={client} currentRegion={currentRegion}>
      <MapAwareComponent />
    </AircraftProvider>
  );
};

/**
 * MinimalFastPlanner Component
 * 
 * A simplified planner that just displays context values
 */
const MinimalFastPlanner = () => {
  const { isAuthenticated, userName, login } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state
    setTimeout(() => setLoading(false), 1000);
  }, []);

  return (
    <div className="fast-planner-container">
      {loading ? (
        <div className="loading-overlay">Loading contexts...</div>
      ) : !isAuthenticated ? (
        <div id="loading-overlay" className="loading-overlay">
          <div>
            <div>Not connected to Palantir Foundry</div>
            <button 
              onClick={login} 
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Connect to Palantir
            </button>
          </div>
        </div>
      ) : (
        <ErrorBoundary>
          <RegionProvider client={client}>
            <AircraftAwareComponent />
          </RegionProvider>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default MinimalFastPlanner;