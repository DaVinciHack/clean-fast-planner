import React, { useEffect } from 'react';
import { useRegion } from '../../context/region';

/**
 * Region Selector Component
 * 
 * Displays a dropdown menu for selecting different operational regions
 * Uses the RegionContext to manage region state
 */
const RegionSelector = () => {
  // Use the region context
  const { regions, currentRegion, regionLoading, changeRegion } = useRegion();
  
  // Debug logging
  useEffect(() => {
    console.log("RegionSelector: Available regions:", regions);
    console.log("RegionSelector: Current region:", currentRegion);
  }, [regions, currentRegion]);
  
  // Handle region change
  const handleRegionChange = (regionId) => {
    console.log(`RegionSelector: Changing region to ${regionId}`);
    changeRegion(regionId);
  };
  
  // Safely determine the current region ID
  const currentRegionId = currentRegion?.id || "";
  
  return (
    <div className={`region-selector ${regionLoading ? 'loading' : ''}`}>
      <label htmlFor="region-select">Region:</label>
      <select 
        id="region-select" 
        value={currentRegionId} 
        onChange={(e) => handleRegionChange(e.target.value)}
        disabled={regionLoading}
        className={regionLoading ? 'loading' : ''}
      >
        {regions && regions.length > 0 ? (
          regions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))
        ) : (
          <option value="">Loading regions...</option>
        )}
      </select>
      {regionLoading && (
        <span className="loading-indicator">
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
        </span>
      )}
    </div>
  );
};

export default RegionSelector;
