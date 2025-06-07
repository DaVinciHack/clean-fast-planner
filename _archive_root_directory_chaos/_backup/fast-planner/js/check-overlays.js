console.log("Checking for overlays that might block clicks...");

// Function to check for overlays
window.addEventListener('load', function() {
  // Check for elements that might be overlaying the map
  console.log("Checking for potential click-blocking elements...");
  
  const mapElement = document.getElementById('map');
  if (!mapElement) {
    console.error("Map element not found");
    return;
  }
  
  // Get map dimensions and position
  const mapRect = mapElement.getBoundingClientRect();
  console.log("Map dimensions:", {
    top: mapRect.top,
    left: mapRect.left,
    width: mapRect.width,
    height: mapRect.height,
    bottom: mapRect.bottom,
    right: mapRect.right
  });
  
  // Find all elements that might be overlapping the map
  const allElements = document.body.querySelectorAll('*');
  const potentialOverlays = [];
  
  allElements.forEach(el => {
    if (el !== mapElement && el.id !== 'map') {
      const rect = el.getBoundingClientRect();
      
      // Check if this element overlaps with the map
      if (!(rect.right < mapRect.left || 
            rect.left > mapRect.right || 
            rect.bottom < mapRect.top || 
            rect.top > mapRect.bottom)) {
        
        // Element overlaps with map
        const style = window.getComputedStyle(el);
        
        // Only consider elements that might block clicks
        if (style.pointerEvents !== 'none' && 
            style.display !== 'none' && 
            style.visibility !== 'hidden' &&
            style.opacity !== '0') {
          
          potentialOverlays.push({
            id: el.id,
            tagName: el.tagName,
            className: el.className,
            zIndex: style.zIndex,
            position: style.position,
            rect: {
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            }
          });
        }
      }
    }
  });
  
  if (potentialOverlays.length > 0) {
    console.warn("Found potential elements overlapping the map that might block clicks:", potentialOverlays);
    
    // Highlight these elements
    potentialOverlays.forEach(info => {
      const el = document.querySelector(info.id ? `#${info.id}` : (info.className ? `.${info.className}` : info.tagName));
      if (el) {
        el.style.outline = '2px solid red';
      }
    });
  } else {
    console.log("No potential click-blocking overlays found");
  }
  
  // Add a button to disable all overlays
  const disableBtn = document.createElement('button');
  disableBtn.textContent = "Disable Overlays";
  disableBtn.style.position = "fixed";
  disableBtn.style.top = "50px";
  disableBtn.style.left = "50%";
  disableBtn.style.transform = "translateX(-50%)";
  disableBtn.style.zIndex = "10000";
  disableBtn.style.padding = "10px";
  disableBtn.style.backgroundColor = "orange";
  disableBtn.style.color = "white";
  disableBtn.style.fontWeight = "bold";
  disableBtn.style.border = "none";
  disableBtn.style.borderRadius = "5px";
  disableBtn.style.cursor = "pointer";
  
  disableBtn.addEventListener('click', function() {
    console.log("Disabling potential overlays");
    
    // Get all elements except the map and disable pointer events
    const elements = document.querySelectorAll('body > *:not(#map)');
    elements.forEach(el => {
      if (el !== disableBtn && el !== mapElement) {
        el.style.pointerEvents = 'none';
      }
    });
    
    console.log("All overlays disabled, map clicks should now work");
  });
  
  document.body.appendChild(disableBtn);
});
