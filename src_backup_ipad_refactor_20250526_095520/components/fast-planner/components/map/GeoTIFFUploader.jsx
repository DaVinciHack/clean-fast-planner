import React, { useState, useRef } from 'react';
import { useRegion } from '../../context/region';
import { processGeoTIFFZip } from '../../utils/processGeoTIFFZip';

/**
 * GeoTIFFUploader
 * 
 * Component for uploading and processing GeoTIFF files
 */
const GeoTIFFUploader = ({ geoTiffManagerRef, onUploadComplete }) => {
  const { currentRegion } = useRegion();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Only show the uploader for the Gulf of Mexico region
  if (!currentRegion || currentRegion.id !== 'gulf-of-mexico') {
    return null;
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);
      setProgress(10);

      // Check if it's a zip file
      if (!file.name.toLowerCase().endsWith('.zip')) {
        throw new Error('Please upload a ZIP file containing GeoTIFF data');
      }

      setProgress(30);
      console.log('Processing GeoTIFF ZIP file:', file.name);

      // Process the zip file to extract the GeoTIFF
      const tiffData = await processGeoTIFFZip(file);
      
      setProgress(70);
      console.log('GeoTIFF data extracted successfully, loading into map...');

      // Load the GeoTIFF from the extracted data
      if (geoTiffManagerRef.current) {
        // Create a Blob URL for the GeoTIFF data
        const blob = new Blob([tiffData], { type: 'image/tiff' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Load and display the GeoTIFF
        await geoTiffManagerRef.current.loadGeoTIFF('gulf-of-mexico', blobUrl, {
          opacity: 0.7,
          resolution: 256
        });
        
        geoTiffManagerRef.current.displayGeoTIFF('gulf-of-mexico');
        
        // Store the blob URL for cleanup
        window.geoTiffBlobUrl = blobUrl;
        
        setProgress(100);
        console.log('GeoTIFF loaded and displayed successfully');
        
        // Call the completion callback
        if (onUploadComplete) {
          onUploadComplete('gulf-of-mexico', file.name);
        }
      } else {
        throw new Error('GeoTIFF manager not initialized');
      }
    } catch (error) {
      console.error('Error processing GeoTIFF:', error);
      setError(`Failed to process GeoTIFF: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '10px',
      borderRadius: '4px',
      zIndex: 1000,
      color: 'white',
      maxWidth: '250px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Gulf of Mexico Map Layer</h4>
      
      {error && (
        <div style={{ 
          background: 'rgba(255, 0, 0, 0.2)', 
          padding: '5px', 
          borderRadius: '3px',
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          {error}
        </div>
      )}
      
      {isUploading ? (
        <div>
          <div style={{ fontSize: '12px', marginBottom: '5px' }}>Processing GeoTIFF...</div>
          <div style={{ 
            height: '4px', 
            background: '#333', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${progress}%`, 
              background: '#4CAF50',
              transition: 'width 0.3s'
            }}></div>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: '12px', marginBottom: '5px' }}>
            Upload zipped GeoTIFF map layer:
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileUpload}
            style={{ 
              fontSize: '12px',
              width: '100%'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default GeoTIFFUploader;
