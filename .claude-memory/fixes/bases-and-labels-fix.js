// Fix for PlatformManager.js - Bases filtering and label zoom levels

// ISSUE 1: Bases not showing - need to add lowercase 'y' check
// Current code (line ~617-624):
/*
if (item.isBase === 'Y' || 
    item.isBase === 'Yes' || 
    item.isBase === 'YES' ||
    item.is_base === 'Y' ||
    item.is_base === 'Yes' ||
    item.is_base === 'YES') {
*/

// Fixed code - add lowercase checks:
if (item.isBase === 'Y' || 
    item.isBase === 'y' ||  // ADD THIS
    item.isBase === 'Yes' || 
    item.isBase === 'yes' || // ADD THIS
    item.isBase === 'YES' ||
    item.is_base === 'Y' ||
    item.is_base === 'y' ||  // ADD THIS
    item.is_base === 'Yes' ||
    item.is_base === 'yes' || // ADD THIS
    item.is_base === 'YES') {
  isBases = true;
  // ... rest of the code
}

// ISSUE 2: Labels showing at all zoom levels for blocks and platforms
// Need to add minzoom to blocks-labels and platform-labels layers

// For blocks-labels (around line 1256):
map.addLayer({
  id: 'blocks-labels',
  type: 'symbol',
  source: sourceId,
  filter: ['all', ['==', ['get', 'platformType'], 'blocks']],
  layout: {
    'text-field': ['get', 'name'],
    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
    'text-size': [
      'interpolate', ['linear'], ['zoom'],
      13, 9,     // Start showing labels only at zoom 13+
      16, 11     // Smaller text even at high zoom
    ],
    'text-offset': [0, 0.8],
    'text-anchor': 'top',
    'visibility': 'visible',
    'minzoom': 13  // ADD THIS - only show labels at zoom 13+
  },
  // ... rest of layer config
});