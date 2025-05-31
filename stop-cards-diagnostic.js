/**
 * Quick diagnostic to identify the stop cards issue
 * 
 * Run this in browser console to check which container is actually being used
 */

console.log('🔍 STOP CARDS DIAGNOSTIC');

// Check if EnhancedStopCardsContainer is mounting
console.log('📦 Checking for component mount messages...');

// Check which containers are in the DOM
const routeStopsElements = document.querySelectorAll('.route-stops');
console.log('🏷️ Found .route-stops elements:', routeStopsElements.length);

routeStopsElements.forEach((el, index) => {
  console.log(`📍 Element ${index}:`, {
    title: el.querySelector('.route-stops-title')?.textContent,
    hasCards: el.querySelectorAll('.stop-card, .stop-card-container').length,
    isVisible: el.offsetHeight > 0,
    hasUnifiedTitle: el.textContent.includes('UNIFIED FUEL')
  });
});

// Check for the specific titles
const titles = document.querySelectorAll('.route-stops-title');
titles.forEach((title, index) => {
  console.log(`📝 Title ${index}: "${title.textContent}"`);
});

// Check if MasterFuelManager exists
try {
  if (window.masterFuelManager) {
    console.log('🏛️ MasterFuelManager found on window');
  } else {
    console.log('❌ MasterFuelManager NOT found on window');
  }
} catch (e) {
  console.log('❌ Error checking MasterFuelManager:', e);
}

// Check for any React errors in console
console.log('📊 Check above for any React component errors...');
