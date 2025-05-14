/**
 * OSDK Client Integration for Fast Planner
 * 
 * This file sets up the Foundry client using the OSDK libraries.
 * It's designed to work similarly to the client.ts in the main React app.
 */

// Global variables
let authClient = null;
let osdkClient = null;
let isInitialized = false;
let isAuthenticated = false;
let authUserEmail = null;

// Define required scopes
const REQUIRED_SCOPES = [
  "api:ontologies-read",
  "api:ontologies-write",
  "api:mediasets-read",
  "api:mediasets-write",
  "api:admin-read",
];

/**
 * Get stored authentication token
 * @returns {string|null} The stored token or null if not found
 */
function getStoredToken() {
  // Check for secureConfig storage first (used by the main app)
  try {
    const secureAuthToken = localStorage.getItem('SECURE_AUTH_TOKEN');
    if (secureAuthToken) {
      console.log('Found authentication token in main app secure storage');
      return secureAuthToken;
    }
  } catch (e) {
    console.warn('Error accessing secure auth token:', e);
  }
  
  // Try to get token from the main app's storage
  try {
    // Try to get from secureConfig which is where the main app stores it
    const userDetailsItem = localStorage.getItem('userDetails');
    if (userDetailsItem) {
      console.log('Found user details in localStorage');
      // We don't need to parse this as the token isn't stored here
      // But this confirms the user is logged in to the main app
    }
    
    // The token is stored in secureStorage in the main app, but we
    // can't access it directly. Instead, rely on the auth.signIn()
    // process below when we initialize the client.
  } catch (e) {
    console.warn('Error checking main app user details:', e);
  }
  
  // Try sessionStorage first (our app's storage)
  const sessionToken = sessionStorage.getItem('PALANTIR_TOKEN');
  if (sessionToken) {
    return sessionToken;
  }
  
  // Then try cookie
  const cookieMatch = document.cookie.match(/PALANTIR_TOKEN=([^;]+)/);
  if (cookieMatch && cookieMatch[1]) {
    return cookieMatch[1];
  }
  
  return null;
}

/**
 * Extract email from JWT token
 * @param {string} token - JWT token
 * @returns {string|null} Email or null if not found
 */
function extractEmailFromToken(token) {
  try {
    if (!token) return null;
    
    // Basic JWT Decode (Payload only)
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(payloadBase64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // Extract email from common claim names
      return payload.email || payload.sub || null;
    }
  } catch (error) {
    console.error('Error decoding token:', error);
  }
  
  return null;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
function checkAuthentication() {
  const token = getStoredToken();
  if (token) {
    isAuthenticated = true;
    authUserEmail = extractEmailFromToken(token);
    return true;
  }
  return false;
}

/**
 * Update the authentication UI based on current status
 */
function updateAuthUI() {
  const authSection = document.getElementById('auth-status');
  const authMessage = document.getElementById('auth-message');
  const loginButton = document.getElementById('login-button');
  
  if (!authSection || !authMessage || !loginButton) {
    console.error('Auth UI elements not found');
    return;
  }
  
  // Check current authentication status
  const isCurrentlyAuthenticated = checkAuthentication();
  
  if (isCurrentlyAuthenticated) {
    authMessage.innerHTML = `Connected to Foundry${authUserEmail ? ' as ' + authUserEmail : ''}`;
    authMessage.className = 'auth-success';
    loginButton.textContent = 'Logout';
    loginButton.href = '#';
    loginButton.onclick = function(e) {
      e.preventDefault();
      handleLogout();
      return false;
    };
  } else {
    authMessage.innerHTML = 'Not connected to Foundry';
    authMessage.className = 'auth-error';
    loginButton.textContent = 'Login to Foundry';
    // Keep the href attribute as is for the login URL
  }
}

/**
 * Initialize the OSDK client
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initializeOSDK() {
  // If already initialized and authenticated, return success
  if (isInitialized && isAuthenticated && osdkClient) {
    console.log('OSDK client already initialized and authenticated');
    return true;
  }
  
  try {
    console.log('Initializing OSDK client...');
    
    // Check if authenticated using existing tokens
    const isCurrentlyAuthenticated = checkAuthentication();
    isAuthenticated = isCurrentlyAuthenticated;
    
    // Get existing token if available
    const existingToken = getStoredToken();
    
    // Check if userDetails exists in localStorage from main app
    const mainAppAuthenticated = localStorage.getItem('userDetails') !== null;
    
    // Check if OSDK libraries are loaded
    if (typeof window.OsdkClient === 'undefined' || typeof window.OsdkOAuth === 'undefined') {
      console.error('OSDK libraries not loaded');
      return false;
    }
    
    // Create auth client
    authClient = window.OsdkOAuth.createPublicOauthClient(
      FOUNDRY_CONFIG.clientId,
      FOUNDRY_CONFIG.apiUrl,
      FOUNDRY_CONFIG.redirectUrl,
      true, // useSessionStorage
      undefined, // customSessionStorageKey
      window.location.toString(),
      REQUIRED_SCOPES
    );
    
    // If there's an existing token, use it
    if (existingToken) {
      console.log('Using existing token for authentication');
      const originalGetAccessToken = authClient.getAccessToken;
      authClient.getAccessToken = async function() {
        return existingToken;
      };
      
      const originalIsAuthenticated = authClient.isAuthenticated;
      authClient.isAuthenticated = async function() {
        return true;
      };
    } 
    // If we know the main app is authenticated but don't have a token,
    // we'll get a fresh token via signIn
    else if (mainAppAuthenticated && !isCurrentlyAuthenticated) {
      console.log('Main app appears to be authenticated, but we need a fresh token');
      try {
        // The signIn will use the browser's login state from the main app
        console.log('Attempting to signIn using browser session');
        const signInResult = await authClient.signIn();
        console.log('Sign-in result:', signInResult);
        
        if (signInResult && signInResult.access_token) {
          // Store the new token
          sessionStorage.setItem('PALANTIR_TOKEN', signInResult.access_token);
          document.cookie = `PALANTIR_TOKEN=${signInResult.access_token}; path=/`;
          
          // Update authentication state
          isAuthenticated = true;
          
          // Extract user email
          try {
            authUserEmail = extractEmailFromToken(signInResult.access_token);
          } catch (e) {
            console.error('Error extracting email from token:', e);
          }
        } else {
          console.warn('Failed to get access token from signIn');
        }
      } catch (signInError) {
        console.error('Error during signIn:', signInError);
      }
    } else if (!isCurrentlyAuthenticated) {
      console.log('User not authenticated, the login button will be shown');
      updateAuthUI();
      return false;
    }
    
    // Create OSDK client
    osdkClient = window.OsdkClient.createClient(
      FOUNDRY_CONFIG.apiUrl,
      FOUNDRY_CONFIG.ontologyRid,
      authClient
    );
    
    isInitialized = true;
    console.log('OSDK client initialized successfully');
    
    // Update the UI
    updateAuthUI();
    
    return true;
  } catch (error) {
    console.error('Error initializing OSDK client:', error);
    return false;
  }
}

/**
 * Handle logout
 */
function handleLogout() {
  console.log('Logging out...');
  
  // Clear tokens
  sessionStorage.removeItem('PALANTIR_TOKEN');
  
  // Clear cookie
  document.cookie = 'PALANTIR_TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Reset state
  authClient = null;
  osdkClient = null;
  isInitialized = false;
  isAuthenticated = false;
  authUserEmail = null;
  
  // Update UI
  updateAuthUI();
  
  // Reload the page to clear any in-memory state
  window.location.reload();
}

/**
 * Get the OSDK client
 * @returns {Object|null} The OSDK client or null if not initialized
 */
function getOsdkClient() {
  return osdkClient;
}

/**
 * Get the current user's email
 * @returns {string|null} The user's email or null if not authenticated
 */
function getUserEmail() {
  return authUserEmail;
}

// Make functions available globally
window.initializeOSDK = initializeOSDK;
window.checkAuthentication = checkAuthentication;
window.updateAuthUI = updateAuthUI;
window.getOsdkClient = getOsdkClient;
window.handleLogout = handleLogout;
window.getUserEmail = getUserEmail;

/**
 * Check if the app is running inside the main app (via iframe or same origin)
 * @returns {boolean} Is inside main app
 */
function isConnectedToMainApp() {
  try {
    // Check if userDetails exists in localStorage
    const userDetails = localStorage.getItem('userDetails');
    return userDetails !== null;
  } catch (e) {
    console.warn('Error checking main app connection:', e);
    return false;
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking authentication status...');
  
  // Check if we're connected to the main app
  const mainAppConnected = isConnectedToMainApp();
  if (mainAppConnected) {
    console.log('Connected to main app, using its authentication');
    // If we are, automatically try to sign in
    setTimeout(function() {
      initializeOSDK().then(success => {
        if (success) {
          console.log('Successfully initialized with main app authentication');
          
          // If we have a "Load Rig Data" button, automatically click it
          const loadRigDataButton = document.getElementById('load-rig-data');
          if (loadRigDataButton) {
            console.log('Automatically loading rig data');
            loadRigDataButton.click();
          }
        }
      });
    }, 1000); // Give a little time for other libraries to load
  } else {
    // Standard initialization if not connected to main app
    updateAuthUI();
    
    // Try to initialize OSDK if authenticated
    if (checkAuthentication()) {
      console.log('User is authenticated, initializing OSDK...');
      setTimeout(function() {
        initializeOSDK();
      }, 1000); // Give a little time for other libraries to load
    }
  }
});