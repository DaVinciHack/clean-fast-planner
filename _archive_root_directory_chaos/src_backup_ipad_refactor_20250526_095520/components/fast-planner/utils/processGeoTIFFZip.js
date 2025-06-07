/**
 * processGeoTIFFZip.js
 * 
 * Utility functions for processing zipped GeoTIFF files
 */

/**
 * Process a zipped GeoTIFF file
 * @param {File} zipFile - The zip file containing GeoTIFF data
 * @returns {Promise<ArrayBuffer>} - Promise resolving to the GeoTIFF array buffer
 */
export const processGeoTIFFZip = async (zipFile) => {
  try {
    // Check if JSZip library is available
    if (!window.JSZip) {
      await loadJSZip();
    }
    
    // Read the zip file
    const zipData = await readFileAsArrayBuffer(zipFile);
    
    // Process the zip file
    const zip = await window.JSZip.loadAsync(zipData);
    
    // Find the first .tif or .tiff file in the zip
    let tiffFile = null;
    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.toLowerCase().endsWith('.tif') || 
          relativePath.toLowerCase().endsWith('.tiff')) {
        tiffFile = zipEntry;
      }
    });
    
    if (!tiffFile) {
      throw new Error('No GeoTIFF file found in the zip archive');
    }
    
    // Extract the GeoTIFF file
    const tiffData = await tiffFile.async('arraybuffer');
    
    return tiffData;
  } catch (error) {
    console.error('Error processing zipped GeoTIFF:', error);
    throw error;
  }
};

/**
 * Load the JSZip library if not already loaded
 * @returns {Promise} - Resolves when JSZip is loaded
 */
const loadJSZip = () => {
  return new Promise((resolve, reject) => {
    try {
      // Check if JSZip is already loaded
      if (window.JSZip) {
        resolve();
        return;
      }
      
      // Load JSZip library
      const jszipScript = document.createElement('script');
      jszipScript.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
      jszipScript.async = true;
      document.body.appendChild(jszipScript);
      
      // Check if library is loaded
      const checkScriptsLoaded = setInterval(() => {
        if (window.JSZip) {
          clearInterval(checkScriptsLoaded);
          console.log('JSZip library loaded successfully');
          resolve();
        }
      }, 100);
      
      // Set a timeout to avoid infinite waiting
      setTimeout(() => {
        if (!window.JSZip) {
          clearInterval(checkScriptsLoaded);
          reject(new Error('Timeout loading JSZip library'));
        }
      }, 10000);
    } catch (error) {
      console.error('Error loading JSZip library:', error);
      reject(error);
    }
  });
};

/**
 * Read a file as an array buffer
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} - Promise resolving to the file contents as an array buffer
 */
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      resolve(event.target.result);
    };
    
    reader.onerror = (event) => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

export default processGeoTIFFZip;
