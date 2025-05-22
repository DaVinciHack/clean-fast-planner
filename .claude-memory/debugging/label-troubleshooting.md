# Troubleshooting Labels Not Showing

## Things to Check in Browser Console

### 1. Run the diagnostic
```javascript
// Copy and paste the label-diagnostic.js content, or:
// Check if layers exist
const map = pm.mapManager.getMap();
console.log('Fixed labels exist?', !!map.getLayer('platforms-fixed-labels'));
console.log('Movable labels exist?', !!map.getLayer('platforms-movable-labels'));
console.log('Blocks labels exist?', !!map.getLayer('blocks-labels'));
```

### 2. Check for console errors
Look for any Mapbox GL errors when the map loads, especially:
- "Error parsing interpolation expression"
- "Unknown layer"
- "Invalid value for text-opacity"

### 3. Force labels visible (temporary test)
```javascript
const map = pm.mapManager.getMap();
['platforms-fixed-labels', 'platforms-movable-labels', 'blocks-labels'].forEach(id => {
  if (map.getLayer(id)) {
    map.setPaintProperty(id, 'text-opacity', 1);
    map.setLayoutProperty(id, 'visibility', 'visible');
  }
});
```

### 4. Check if features have names
```javascript
const source = map.getSource('major-platforms');
if (source && source._data) {
  const hasNames = source._data.features.filter(f => f.properties.name);
  console.log('Features with names:', hasNames.length);
  console.log('Sample:', hasNames.slice(0, 3).map(f => f.properties.name));
}
```

## Possible Issues

1. **Layer Order**: Labels might be under other layers
2. **Missing Font**: 'Open Sans Semibold' might not be loaded
3. **Text Field**: The 'name' property might not exist in features
4. **Paint/Layout Conflict**: The text-opacity might be conflicting

## Quick Fix to Try
If nothing else works, try simplified labels:

```javascript
// Remove the existing label layer and add a simple one
const map = pm.mapManager.getMap();
if (map.getLayer('platforms-fixed-labels')) {
  map.removeLayer('platforms-fixed-labels');
}

map.addLayer({
  id: 'platforms-fixed-labels',
  type: 'symbol',
  source: 'major-platforms',
  filter: ['==', ['get', 'platformType'], 'fixed'],
  layout: {
    'text-field': ['get', 'name'],
    'text-size': 12,
    'visibility': 'visible'
  },
  paint: {
    'text-color': '#ffffff'
  }
});
```
