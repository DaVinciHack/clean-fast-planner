import React, { useEffect, useRef, useState } from 'react';
import { useRegion } from '../../context/region';
import GulfCoastGeoTIFF from '../../modules/layers/GulfCoastGeoTIFF';

/**
 * GulfCoastMapLayer
 * 
 * Component for managing the Gulf Coast helicopter map layer
 */
const GulfCoastMapLayer = ({ mapManagerRef }) => {
  const { currentRegion } = useRegion();
  const gulfCoastGeoTIFFRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the Gulf Coast GeoTIFF manager
  useEffect(() => {
    if (!mapManagerRef?.current || gulfCoastGeoTIFFRef.current) return;

    const initGeoTIFF = async () => {
      try {
        console.log('Initializing Gulf Coast GeoTIFF manager...');
        const geoTiffManager = new GulfCoastGeoTIFF(mapManagerRef.current);
        await geoTiffManager.initialize();
        gulfCoastGeoTIFFRef.current = geoTiffManager;
        setIsInitialized(true);
        console.log('Gulf Coast GeoTIFF manager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Gulf Coast GeoTIFF manager:', error);
        setError('Failed to initialize Gulf Coast map layer support');
      }
    };

    // Wait for the map to be loaded first
    mapManagerRef.current.onMapLoaded(() => {
      initGeoTIFF();
    });

    return () => {
      // Cleanup - remove the layer when the component unmounts
      if (gulfCoastGeoTIFFRef.current && gulfCoastGeoTIFFRef.current.isDisplayed) {
        gulfCoastGeoTIFFRef.current.remove();
      }
      gulfCoastGeoTIFFRef.current = null;
      setIsInitialized(false);
    };
  }, [mapManagerRef]);

  // Load and display the Gulf Coast GeoTIFF when the region changes to Gulf of Mexico
  useEffect(() => {
    if (!isInitialized || !currentRegion || !gulfCoastGeoTIFFRef.current) return;

    const updateGeoTIFFVisibility = async () => {
      try {
        if (currentRegion.id === 'gulf-of-mexico') {
          // Show the layer if we're in the Gulf of Mexico region
          if (!gulfCoastGeoTIFFRef.current.isDisplayed) {
            await gulfCoastGeoTIFFRef.current.loadAndDisplay();
            setIsVisible(true);
          }
        } else {
          // Hide the layer if we're in a different region
          if (gulfCoastGeoTIFFRef.current.isDisplayed) {
            gulfCoastGeoTIFFRef.current.remove();
            setIsVisible(false);
          }
        }
      } catch (error) {
        console.error('Error updating Gulf Coast GeoTIFF visibility:', error);
        setError(`Failed to update Gulf Coast map layer: ${error.message}`);
      }
    };

    updateGeoTIFFVisibility();
  }, [currentRegion, isInitialized]);

  // Return a toggle button control for the GeoTIFF layer
  return currentRegion?.id === 'gulf-of-mexico' ? (
    <div style={{
      position: 'absolute',
      bottom: '30px',
      right: '10px',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '8px',
      borderRadius: '4px',
      color: 'white',
      fontSize: '12px'
    }}>
      {error ? (
        <div style={{ color: '#ff6b6b', marginBottom: '5px' }}>{error}</div>
      ) : null}
      
      <button
        onClick={async () => {
          if (gulfCoastGeoTIFFRef.current) {
            try {
              const newVisibility = await gulfCoastGeoTIFFRef.current.toggle();
              setIsVisible(newVisibility);
            } catch (error) {
              console.error('Error toggling Gulf Coast map layer:', error);
            }
          }
        }}
        style={{
          background: isVisible ? '#4CAF50' : '#666',
          color: 'white',
          border: 'none',
          padding: '5px 10px',
          borderRadius: '3px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          fontSize: '12px'
        }}
        disabled={!isInitialized}
      >
        <span style={{ 
          display: 'inline-block',
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          background: isVisible ? '#4CAF50' : '#666',
          marginRight: '5px',
          border: '1px solid white'
        }}></span>
        Gulf Coast Helicopter Map
      </button>
    </div>
  ) : null;
};

export default GulfCoastMapLayer;
