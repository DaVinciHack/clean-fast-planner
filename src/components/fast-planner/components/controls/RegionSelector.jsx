import React from 'react';

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
  return (
    <div className={`region-selector ${isLoading ? 'loading' : ''}`}>
      <label htmlFor="region-select">Region:</label>
      <select 
        id="region-select" 
        value={currentRegion ? currentRegion.id : ''} 
        onChange={(e) => onRegionChange(e.target.value)}
        disabled={isLoading}
        className={isLoading ? 'loading' : ''}
      >
        {regions.map(region => (
          <option key={region.id} value={region.id}>
            {region.name}
          </option>
        ))}
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
