/**
 * Test React Aircraft State Script
 * Tests if the useAircraft hook is receiving and updating state
 */

console.log('⚛️ TESTING REACT AIRCRAFT STATE...');
console.log('🌍 Environment:', window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE');

function testReactAircraftState() {
  
  // First trigger the callback to make sure data flows
  console.log('\n=== TRIGGERING AIRCRAFT CALLBACK ===');
  const aircraftManager = window.appManagers?.aircraftManagerRef?.current;
  
  if (aircraftManager && aircraftManager.filteredAircraft) {
    console.log('🔄 Triggering onAircraftFiltered callback...');
    aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
    console.log('✅ Callback triggered');
  }
  
  // Wait a bit for React to process, then check UI
  setTimeout(() => {
    console.log('\n=== CHECKING UI AFTER CALLBACK ===');
    
    // Look for aircraft dropdown options
    const selects = document.querySelectorAll('select');
    console.log('📋 Total select elements:', selects.length);
    
    let aircraftSelectFound = false;
    selects.forEach((select, index) => {
      const options = Array.from(select.options);
      console.log(`📋 Select ${index + 1}:`, {
        className: select.className,
        optionCount: options.length,
        hasAircraftOptions: options.some(opt => opt.text.includes('S92') || opt.text.includes('H175') || opt.text.includes('AW'))
      });
      
      // Check if this looks like an aircraft type select
      if (options.some(opt => opt.text.includes('S92') || opt.text.includes('H175') || opt.text.includes('AW'))) {
        aircraftSelectFound = true;
        console.log(`✈️ Aircraft type select found at index ${index + 1}:`);
        options.slice(0, 5).forEach(opt => {
          console.log(`  - ${opt.value}: ${opt.text}`);
        });
      }
    });
    
    // Look for "No aircraft" text
    const bodyText = document.body.innerText;
    const hasNoAircraftText = bodyText.includes('No aircraft');
    console.log('🚫 "No aircraft" text present:', hasNoAircraftText);
    
    // Look for aircraft-related buttons or text
    const aircraftText = bodyText.toLowerCase();
    const hasAircraftMentions = aircraftText.includes('aircraft') || aircraftText.includes('helicopter');
    console.log('✈️ Aircraft mentioned in page:', hasAircraftMentions);
    
    // Check MainCard specifically (since that's where aircraft dropdowns should be)
    const mainCardElements = document.querySelectorAll('[class*="main-card"], [class*="MainCard"], .card');
    console.log('🃏 MainCard-like elements found:', mainCardElements.length);
    
    mainCardElements.forEach((card, index) => {
      const cardSelects = card.querySelectorAll('select');
      if (cardSelects.length > 0) {
        console.log(`🃏 Card ${index + 1} has ${cardSelects.length} select elements`);
        cardSelects.forEach((select, selectIndex) => {
          console.log(`  Select ${selectIndex + 1}: ${select.options.length} options`);
        });
      }
    });
    
    console.log('\n=== UI STATE SUMMARY ===');
    const uiSummary = {
      environment: window.location.hostname === 'localhost' ? 'LOCAL' : 'ONLINE',
      totalSelects: selects.length,
      aircraftSelectFound: aircraftSelectFound,
      hasNoAircraftText: hasNoAircraftText,
      hasAircraftMentions: hasAircraftMentions,
      mainCardElements: mainCardElements.length
    };
    
    console.log(JSON.stringify(uiSummary, null, 2));
    window.reactAircraftUISummary = uiSummary;
    
    // Try to force a re-render by triggering callback again
    console.log('\n=== FORCE RE-RENDER TEST ===');
    if (aircraftManager) {
      console.log('🔄 Triggering callback again to force re-render...');
      aircraftManager.triggerCallback('onAircraftFiltered', aircraftManager.filteredAircraft, null);
      aircraftManager.triggerCallback('onAircraftLoaded', aircraftManager.aircraftList);
      console.log('✅ Re-render callbacks triggered');
    }
    
  }, 1000); // Wait 1 second for React to process
}

// Run the test
testReactAircraftState();

console.log('⚛️ React aircraft state test running...');
console.log('📋 Results will appear in 1 second...');