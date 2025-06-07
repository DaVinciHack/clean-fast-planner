/**
 * OSDK Library Loader
 * 
 * This script helps to load the OSDK libraries dynamically
 * since they are not available from public CDNs.
 */

// Track loading state
let osdk = {
  clientLoaded: false,
  oauthLoaded: false,
  sdkLoaded: false
};

// Store error messages
let loadErrors = [];

/**
 * Try to load a script with retry logic
 * @param {string} url - Script URL to load
 * @param {string} name - Name for logging
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<boolean>} - Whether loading succeeded
 */
function loadScriptWithRetry(url, name, retries = 3, delay = 1000) {
  return new Promise((resolve) => {
    console.log(`Attempting to load ${name} from ${url}`);
    
    function attemptLoad(attemptsLeft) {
      const script = document.createElement('script');
      script.src = url;
      
      // Set timeout for script loading
      const timeoutId = setTimeout(() => {
        console.warn(`Loading ${name} timed out`);
        if (attemptsLeft > 0) {
          console.log(`Retrying ${name} load, ${attemptsLeft} attempts left`);
          attemptLoad(attemptsLeft - 1);
        } else {
          loadErrors.push(`Failed to load ${name} after multiple attempts`);
          resolve(false);
        }
      }, 10000); // 10 second timeout
      
      script.onload = () => {
        clearTimeout(timeoutId);
        console.log(`Successfully loaded ${name}`);
        resolve(true);
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        console.warn(`Error loading ${name}`);
        if (attemptsLeft > 0) {
          console.log(`Retrying ${name} load, ${attemptsLeft} attempts left`);
          setTimeout(() => {
            attemptLoad(attemptsLeft - 1);
          }, delay);
        } else {
          loadErrors.push(`Failed to load ${name} after multiple attempts`);
          resolve(false);
        }
      };
      
      document.head.appendChild(script);
    }
    
    attemptLoad(retries);
  });
}

/**
 * Check if OSDK libraries are loaded
 * @returns {boolean} Whether all required libraries are loaded
 */
function checkOsdkLoaded() {
  osdk.clientLoaded = typeof window.OsdkClient !== 'undefined';
  osdk.oauthLoaded = typeof window.OsdkOAuth !== 'undefined';
  osdk.sdkLoaded = typeof window.flightAppSdk !== 'undefined';
  
  return osdk.clientLoaded && osdk.oauthLoaded;
}

/**
 * Attempt to load OSDK libraries
 * @returns {Promise<boolean>} Whether loading succeeded
 */
async function loadOsdkLibraries() {
  console.log('Checking if OSDK libraries are already loaded');
  
  // First check if libraries are already loaded
  if (checkOsdkLoaded()) {
    console.log('OSDK libraries already loaded');
    return true;
  }
  
  console.log('OSDK libraries not loaded, attempting to load them');
  
  try {
    // Try to load OSDK OAuth
    if (!osdk.oauthLoaded) {
      osdk.oauthLoaded = await loadScriptWithRetry(
        'https://cdn.jsdelivr.net/npm/@osdk/oauth@1.1.1/dist/index.umd.js',
        'OSDK OAuth'
      );
    }
    
    // Try to load OSDK Client
    if (!osdk.clientLoaded) {
      osdk.clientLoaded = await loadScriptWithRetry(
        'https://cdn.jsdelivr.net/npm/@osdk/client@2.2.0-beta.10/dist/index.umd.js',
        'OSDK Client'
      );
    }
    
    // Check if loading succeeded
    const loaded = checkOsdkLoaded();
    
    if (!loaded) {
      console.error('Failed to load OSDK libraries:', loadErrors);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error loading OSDK libraries:', error);
    return false;
  }
}

// Export functions
window.loadOsdkLibraries = loadOsdkLibraries;
window.checkOsdkLoaded = checkOsdkLoaded;

// Try to load libraries when script is loaded
loadOsdkLibraries().then(success => {
  if (success) {
    console.log('OSDK libraries loaded successfully');
    
    // Check if we're already authenticated and initialize
    if (typeof initializeOSDK === 'function') {
      initializeOSDK();
    } else {
      console.log('initializeOSDK function not available yet, will initialize later');
    }
  } else {
    console.warn('Failed to load OSDK libraries');
  }
});