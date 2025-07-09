/**
 * Environment Comparison Script
 * Detailed comparison between local and online environments
 */

console.log('🔍 ENVIRONMENT COMPARISON STARTING...');

function compareEnvironments() {
  console.log('\n=== ENVIRONMENT COMPARISON ===');
  
  // Basic environment info
  console.log('🌍 Hostname:', window.location.hostname);
  console.log('🌍 Port:', window.location.port);
  console.log('🌍 Protocol:', window.location.protocol);
  console.log('🌍 Pathname:', window.location.pathname);
  console.log('🌍 Full URL:', window.location.href);
  
  // User agent and browser info
  console.log('🖥️ User Agent:', navigator.userAgent);
  console.log('🖥️ Platform:', navigator.platform);
  console.log('🖥️ Cookies enabled:', navigator.cookieEnabled);
  console.log('🖥️ Online:', navigator.onLine);
  
  // Vite/development specific
  console.log('⚡ Vite HMR:', typeof window.__vite_plugin_react_preamble_installed__ !== 'undefined' ? 'ACTIVE' : 'NOT ACTIVE');
  console.log('⚡ Development mode:', process?.env?.NODE_ENV === 'development' ? 'YES' : 'NO');
  
  // React and build info
  console.log('⚛️ React version:', React?.version || 'Unknown');
  console.log('⚛️ React dev tools:', typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ? 'AVAILABLE' : 'NOT AVAILABLE');
  
  // Authentication and OAuth
  const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  console.log('🔐 Auth token stored:', authToken ? 'YES' : 'NO');
  
  const oauthState = localStorage.getItem('oauth_state') || sessionStorage.getItem('oauth_state');
  console.log('🔐 OAuth state:', oauthState ? 'YES' : 'NO');
  
  // OSDK client inspection
  const client = window.client;
  if (client) {
    console.log('🔌 OSDK Client type:', typeof client);
    console.log('🔌 OSDK Client constructor:', client.constructor?.name || 'Unknown');
    console.log('🔌 OSDK Client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)).slice(0, 10));
  }
  
  // Check for production vs development differences
  console.log('📦 Build type indicators:');
  console.log('  - Source maps available:', !!window.sourceMap || document.querySelector('script[src*=".map"]') !== null);
  console.log('  - Minified code:', document.querySelector('script[src*=".min."]') !== null);
  console.log('  - Hot reload:', typeof window.$RefreshReg$ !== 'undefined');
  
  // Network and loading timing
  const timing = performance.timing;
  if (timing) {
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
    console.log('⏱️ Page load time:', loadTime, 'ms');
    console.log('⏱️ DOM ready time:', domReady, 'ms');
  }
  
  // Check for any global variables that might differ
  console.log('🌐 Global variables:');
  console.log('  - window.appManagers:', typeof window.appManagers);
  console.log('  - window.managers:', typeof window.managers);
  console.log('  - window.client:', typeof window.client);
  console.log('  - window.fastPlannerApp:', typeof window.fastPlannerApp);
  console.log('  - window.activeRegionFromContext:', window.activeRegionFromContext);
  
  // CSS and style differences
  const styleSheets = Array.from(document.styleSheets);
  console.log('🎨 Stylesheets loaded:', styleSheets.length);
  console.log('🎨 CSS file types:', styleSheets.map(sheet => {
    const href = sheet.href;
    if (!href) return 'inline';
    if (href.includes('.css')) return 'css';
    if (href.includes('chunk')) return 'chunk';
    return 'other';
  }));
  
  // JavaScript bundle differences
  const scripts = Array.from(document.scripts);
  console.log('📄 Scripts loaded:', scripts.length);
  console.log('📄 Script types:', scripts.map(script => {
    const src = script.src;
    if (!src) return 'inline';
    if (src.includes('vendors')) return 'vendors';
    if (src.includes('index')) return 'index';
    if (src.includes('chunk')) return 'chunk';
    return 'other';
  }));
}

// Aircraft-specific environment checks
function compareAircraftEnvironment() {
  console.log('\n=== AIRCRAFT-SPECIFIC ENVIRONMENT ===');
  
  // Check for aircraft-related global state
  const aircraftKeys = Object.keys(window).filter(key => 
    key.toLowerCase().includes('aircraft') || 
    key.toLowerCase().includes('manager') ||
    key.toLowerCase().includes('osdk')
  );
  console.log('✈️ Aircraft-related globals:', aircraftKeys);
  
  // Check for callback-related differences
  const callbackKeys = Object.keys(window).filter(key => 
    key.toLowerCase().includes('callback') || 
    key.toLowerCase().includes('trigger') ||
    key.toLowerCase().includes('event')
  );
  console.log('📞 Callback-related globals:', callbackKeys);
  
  // Check localStorage/sessionStorage for aircraft data
  const storageKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.toLowerCase().includes('aircraft') || key.toLowerCase().includes('manager')) {
      storageKeys.push(key);
    }
  }
  console.log('💾 Aircraft storage keys:', storageKeys);
  
  // Check for React hook state (development only)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('🔗 React dev tools hook available - can inspect component state');
  }
}

// Execute comparison
function runEnvironmentComparison() {
  console.log('🚀 Starting Environment Comparison...');
  console.log('🕐 Timestamp:', new Date().toISOString());
  
  compareEnvironments();
  compareAircraftEnvironment();
  
  console.log('\n=== COMPARISON COMPLETE ===');
  console.log('📋 Save this output and compare with the other environment');
  console.log('🔍 Key differences to look for:');
  console.log('  - Authentication/OAuth differences');
  console.log('  - OSDK client initialization differences');
  console.log('  - Build type differences (dev vs prod)');
  console.log('  - Global variable availability');
  console.log('  - Network/timing differences');
}

// Auto-run comparison after page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runEnvironmentComparison, 1000);
  });
} else {
  setTimeout(runEnvironmentComparison, 1000);
}

// Expose for manual execution
window.runEnvironmentComparison = runEnvironmentComparison;

console.log('🔍 Environment comparison loaded. Auto-running in 1 second...');
console.log('🔍 Manual execution: window.runEnvironmentComparison()');