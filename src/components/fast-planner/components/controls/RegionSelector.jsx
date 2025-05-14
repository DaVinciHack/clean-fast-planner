import React, { useEffect } from 'react';

/**
 * Region Selector Component
 * 
 * Displays a dropdown menu for selecting different operational regions
 * Integrated with the right panel card design
 */
const RegionSelector = ({ 
  regions, 
  currentRegion, 
  onRegionChange,
  isLoading
}) => {
  // Log current state for debugging
  useEffect(() => {
    console.log("RegionSelector: Available regions:", regions);
    console.log("RegionSelector: Current region:", currentRegion);
  }, [regions, currentRegion]);
  
  // Handle region change with additional logging
  const handleRegionChange = (regionId) => {
    console.log(`RegionSelector: Changing region to ${regionId}`);
    onRegionChange(regionId);
  };
  
  // Safely determine the current region ID
  const currentRegionId = currentRegion?.id || "";
  
  return (
    <div className={`region-selector ${isLoading ? 'loading' : ''}`}>
      <label htmlFor="region-select">Region:</label>
      <select 
        id="region-select" 
        value={currentRegionId} 
        onChange={(e) => handleRegionChange(e.target.value)}
        disabled={isLoading}
        className={isLoading ? 'loading' : ''}
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
      {isLoading && (
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
