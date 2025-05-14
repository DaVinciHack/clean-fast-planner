import React from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';

// Import Context Providers
import { RegionProvider, useRegion } from './context';

/**
 * RegionSelector Component
 * Shows available regions and allows selecting one
 */
const RegionSelector = () => {
  const { regions, currentRegion, changeRegion, regionLoading } = useRegion();
  
  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    changeRegion(regionId);
  };
  
  return (
    <div className="region-selector">
      <h3>Region Selection</h3>
      {regionLoading ? (
        <div className="loading">Loading regions...</div>
      ) : (
        <div>
          <select 
            value={currentRegion?.id || ''} 
            onChange={handleRegionChange}
            className="region-dropdown"
          >
            <option value="" disabled>Select a region</option>
            {regions.map(region => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          
          {currentRegion && (
            <div className="current-region">
              <h4>Current Region: {currentRegion.name}</h4>
              <div>ID: {currentRegion.id}</div>
              <div>Bounds: {JSON.stringify(currentRegion.bounds)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * FastPlannerTestApp Component
 * A test component that uses the Region Context
 */
const FastPlannerTestApp = () => {
  const { isAuthenticated, login } = useAuth();
  
  return (
    <div className="fast-planner-container test-app">
      <h2>Fast Planner Test App</h2>
      
      {/* Authentication Status */}
      <div className="auth-status">
        {isAuthenticated ? (
          <div className="auth-success">Authenticated with Palantir Foundry</div>
        ) : (
          <div className="auth-error">
            Not authenticated
            <button onClick={login} className="login-button">
              Connect to Palantir
            </button>
          </div>
        )}
      </div>
      
      {/* Region Provider */}
      <RegionProvider client={client}>
        <div className="test-container">
          <RegionSelector />
        </div>
      </RegionProvider>
    </div>
  );
};

export default FastPlannerTestApp;