/**
 * OSDK Client Check
 * 
 * This script checks if the OSDK client is properly loaded and provides visual
 * feedback if it's not.
 */

// This function will be called when the module is imported
const runClientCheck = () => {
  console.log('========== OSDK CLIENT CHECK STARTING ==========');
  
  try {
    // Try importing the client and auth
    const clientModule = require('./client');
    const client = clientModule.default;
    const auth = clientModule.auth;
    
    // Create a visual indicator for OSDK status
    createStatusIndicator();
    
    // Check if client exists
    if (!client) {
      console.error('❌ OSDK CLIENT NOT FOUND - client is null or undefined');
      updateStatusIndicator('OSDK CLIENT NOT FOUND', 'error');
      return false;
    }
    
    console.log('✅ OSDK client imported successfully!');
    console.log('Client object:', {
      exists: !!client,
      prototypeChain: getPrototypeChain(client),
      objectKeys: Object.keys(client)
    });
    
    // Check if auth exists
    if (!auth) {
      console.error('❌ OSDK AUTH NOT FOUND - auth is null or undefined');
      updateStatusIndicator('OSDK AUTH NOT FOUND', 'error');
      return false;
    }
    
    console.log('✅ OSDK auth imported successfully!');
    console.log('Auth object:', {
      exists: !!auth,
      prototypeChain: getPrototypeChain(auth),
      methods: Object.keys(auth).filter(key => typeof auth[key] === 'function')
    });
    
    // Check if we have necessary modules
    try {
      const clientImport = require('@osdk/client');
      const oauthImport = require('@osdk/oauth');
      const adminImport = require('@osdk/foundry.admin');
      const flightImport = require('@flight-app/sdk');
      
      console.log('✅ All OSDK modules imported successfully!');
      console.log('Modules found:', {
        clientImport: !!clientImport,
        oauthImport: !!oauthImport,
        adminImport: !!adminImport,
        flightImport: !!flightImport
      });
      
      updateStatusIndicator('OSDK Modules Loaded', 'success');
    } catch (moduleError) {
      console.error('❌ ERROR IMPORTING OSDK MODULES:', moduleError);
      updateStatusIndicator('OSDK MODULE IMPORT ERROR', 'error');
      return false;
    }
    
    console.log('========== OSDK CLIENT CHECK COMPLETE ==========');
    return true;
  } catch (error) {
    console.error('❌ OSDK CLIENT CHECK FAILED:', error);
    updateStatusIndicator('OSDK CLIENT CHECK FAILED', 'error');
    return false;
  }
};

// Helper function to get the prototype chain of an object
const getPrototypeChain = (obj) => {
  if (!obj) return [];
  
  const chain = [];
  let current = Object.getPrototypeOf(obj);
  
  while (current) {
    chain.push(current.constructor?.name || 'Unknown');
    current = Object.getPrototypeOf(current);
    
    // Prevent infinite loops
    if (chain.length > 10) break;
  }
  
  return chain;
};

// Create a visual indicator for OSDK status
const createStatusIndicator = () => {
  if (typeof document === 'undefined') return;
  
  // Check if the indicator already exists
  if (document.getElementById('osdk-status-indicator')) return;
  
  // Create indicator element
  const indicator = document.createElement('div');
  indicator.id = 'osdk-status-indicator';
  indicator.style.position = 'fixed';
  indicator.style.bottom = '10px';
  indicator.style.right = '10px';
  indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  indicator.style.color = 'white';
  indicator.style.padding = '8px 12px';
  indicator.style.borderRadius = '4px';
  indicator.style.fontSize = '12px';
  indicator.style.fontFamily = 'monospace';
  indicator.style.zIndex = '9999';
  indicator.style.display = 'none';
  
  // Add to document body
  document.body.appendChild(indicator);
};

// Update the status indicator
const updateStatusIndicator = (message, type = 'info') => {
  if (typeof document === 'undefined') return;
  
  // Get the indicator element
  const indicator = document.getElementById('osdk-status-indicator');
  if (!indicator) return;
  
  // Set the message
  indicator.textContent = message;
  
  // Set color based on type
  switch (type) {
    case 'error':
      indicator.style.backgroundColor = 'rgba(220, 53, 69, 0.8)';
      break;
    case 'success':
      indicator.style.backgroundColor = 'rgba(40, 167, 69, 0.8)';
      // Hide success indicator after 5 seconds
      setTimeout(() => {
        indicator.style.display = 'none';
      }, 5000);
      break;
    case 'warning':
      indicator.style.backgroundColor = 'rgba(255, 193, 7, 0.8)';
      break;
    default:
      indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  }
  
  // Show the indicator
  indicator.style.display = 'block';
};

// Export the check function
export default runClientCheck;
