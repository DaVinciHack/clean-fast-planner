# Debugging Guide - Bases Not Showing & Labels Missing

## Current Status
1. **Bases not showing** - Despite adding lowercase checks
2. **All labels disappeared** - After adding min-zoom

## What We've Done
1. Added lowercase checks for isBase field ('y', 'yes')
2. Changed 'minzoom' to 'min-zoom' (correct Mapbox syntax)
3. Verified basesVisible is initialized to true
4. Confirmed toggle function exists and looks correct

## Things to Check in Browser Console

### 1. Check if bases are in the data
```javascript
// Check PlatformManager instance
const pm = window.platformManager || window.appManagers?.platformManagerRef?.current;

// See how many platforms have isBases = true
const bases = pm.platforms.filter(p => p.isBases === true);
console.log('Bases count:', bases.length);

// Check raw data fields
pm.platforms.slice(0, 5).forEach(p => {
  if (p.isBase || p.is_base) {
    console.log('Platform with base field:', p.name, 'isBase:', p.isBase, 'is_base:', p.is_base);
  }
});
```

### 2. Check map layers
```javascript
const map = pm.mapManager.getMap();

// Check if layers exist
console.log('bases-layer exists:', !!map.getLayer('bases-layer'));
console.log('bases-labels exists:', !!map.getLayer('bases-labels'));

// Check visibility
if (map.getLayer('bases-layer')) {
  console.log('bases visibility:', map.getLayoutProperty('bases-layer', 'visibility'));
}

// Check source data
const source = map.getSource('major-platforms');
if (source && source._data) {
  const basesInSource = source._data.features.filter(f => 
    f.properties?.platformType === 'bases'
  );
  console.log('Bases in map source:', basesInSource.length);
}
```

### 3. Check label configuration
```javascript
// Get all label layers
['platforms-fixed-labels', 'platforms-movable-labels', 'blocks-labels', 'bases-labels'].forEach(layerId => {
  const layer = map.getLayer(layerId);
  if (layer) {
    console.log(`${layerId}:`, {
      exists: true,
      visibility: map.getLayoutProperty(layerId, 'visibility'),
      minZoom: layer.minzoom || 'not set'
    });
  }
});
```

## Possible Issues

1. **Data Issue**: The isBase field might not be present in the OSDK data
2. **Case Sensitivity**: The field might be different than expected (IS_BASE, IsBase, etc.)
3. **Min-zoom syntax**: Mapbox might need the min-zoom in the layer config, not layout
4. **Filter Issue**: Something else might be filtering out bases before they get to the map

## Quick Fix to Try
If labels are completely gone, try removing min-zoom temporarily:

```javascript
// In browser console
const map = pm.mapManager.getMap();
['platforms-fixed-labels', 'platforms-movable-labels', 'blocks-labels'].forEach(layerId => {
  if (map.getLayer(layerId)) {
    // Remove min-zoom constraint
    map.setLayoutProperty(layerId, 'text-size', [
      'interpolate', ['linear'], ['zoom'],
      10, 9,
      13, 11,
      16, 14
    ]);
  }
});
```
