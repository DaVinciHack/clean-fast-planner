import React, { useEffect, useRef, useState } from 'react';
import { useRegion } from '../../context/region';
import GeoTIFFManager from '../../modules/layers/GeoTIFFManager';

/**
 * GeoTIFFLayerComponent
 * 
 * Manages loading and displaying GeoTIFF layers for specific regions
 */
const GeoTIFFLayerComponent = ({ mapManagerRef }) => {
  const { currentRegion } = useRegion();
  const geoTiffManagerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize the GeoTIFF manager
  useEffect(() => {
    if (!mapManagerRef?.current || geoTiffManagerRef.current) return;

    const initGeoTIFF = async () => {
      try {
        console.log('Initializing GeoTIFF Manager...');
        const geoTiffManager = new GeoTIFFManager(mapManagerRef.current);
        await geoTiffManager.initialize();
        geoTiffManagerRef.current = geoTiffManager;
        setIsInitialized(true);
        console.log('GeoTIFF Manager initialized successfully');
      } catch (error) {
        console.error('Failed to initialize GeoTIFF Manager:', error);
        setError('Failed to initialize GeoTIFF support');
      }
    };

    // Wait for the map to be loaded first
    mapManagerRef.current.onMapLoaded(() => {
      initGeoTIFF();
    });

    return () => {
      // Cleanup if needed
      geoTiffManagerRef.current = null;
      setIsInitialized(false);
    };
  }, [mapManagerRef]);

  // Load and display GeoTIFF for the current region when it changes
  useEffect(() => {
    if (!isInitialized || !currentRegion || !geoTiffManagerRef.current) return;

    const loadGeoTIFFForRegion = async () => {
      try {
        // Only load for Gulf of Mexico region for now
        if (currentRegion.id === 'gulf-of-mexico') {
          setIsLoading(true);
          setError(null);
          
          // URL to the GeoTIFF file - update this with your actual file path
          // This assumes you'll put the GeoTIFF in the public directory
          const geoTiffUrl = '/gulf-of-mexico.tif';
          
          // Load the GeoTIFF file
          await geoTiffManagerRef.current.loadGeoTIFF('gulf-of-mexico', geoTiffUrl, {
            opacity: 0.7,
            resolution: 256
          });
          
          // Display the GeoTIFF on the map
          geoTiffManagerRef.current.displayGeoTIFF('gulf-of-mexico');
          
          console.log('GeoTIFF for Gulf of Mexico loaded and displayed');
        } else {
          // For other regions, remove any displayed GeoTIFF
          if (geoTiffManagerRef.current) {
            geoTiffManagerRef.current.removeGeoTIFF('gulf-of-mexico');
          }
        }
      } catch (error) {
        console.error('Error loading GeoTIFF:', error);
        setError(`Failed to load GeoTIFF: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadGeoTIFFForRegion();
  }, [currentRegion, isInitialized]);

  // We don't need to render anything for this component
  return null;
};

export default GeoTIFFLayerComponent;
