# Gulf Coast Helicopter Map Integration Instructions

This document provides step-by-step instructions for integrating the Gulf Coast Helicopter Map GeoTIFF layer into the Fast Planner application.

## Overview

The implementation adds a specialized map layer for the Gulf of Mexico region that displays the helicopter map. This enhances flight planning capabilities by providing detailed aviation-specific map information for this region.

## Files Created

1. `src/components/fast-planner/modules/layers/GulfCoastGeoTIFF.js` - Core module for handling the GeoTIFF file
2. `src/components/fast-planner/components/map/GulfCoastMapLayer.jsx` - React component for displaying and toggling the map layer
3. `setup-gulf-coast-map.sh` - Script to copy the map files to the public directory

## Integration Steps

### 1. Set up the map files

First, run the setup script to copy the GeoTIFF files to the public directory:

```bash
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV5
chmod +x setup-gulf-coast-map.sh
./setup-gulf-coast-map.sh
```

### 2. Add the GulfCoastMapLayer component to FastPlannerApp.jsx

Open `src/components/fast-planner/FastPlannerApp.jsx` and make the following changes:

1. Import the GulfCoastMapLayer component:

```jsx
import GulfCoastMapLayer from './components/map/GulfCoastMapLayer';
```

2. Add the component to the JSX, inside the map container div, alongside other map components:

```jsx
{/* Add this near the MapComponent */}
<GulfCoastMapLayer mapManagerRef={mapManagerRef} />
```

### 3. Update the package.json with new dependencies

These libraries will be loaded at runtime, so no need to install them via npm. However, for documentation purposes, you might want to make a note of the dependencies:

```
"geotiff": "^1.0.0-beta.16",
"leaflet": "^1.9.3",
"leaflet-geotiff": "^0.2.0"
```

## Usage

1. The Gulf Coast Helicopter Map will automatically appear when you're in the Gulf of Mexico region.
2. A control button in the bottom right corner allows you to toggle the map layer on/off.
3. The layer is semi-transparent (70% opacity) to allow seeing the base map underneath.

## Troubleshooting

- If the map doesn't appear, check the browser console for errors
- Ensure the GeoTIFF files were copied correctly to the public directory
- Try adjusting the opacity in the GulfCoastGeoTIFF.js file if the layer is too transparent or opaque

## Future Improvements

- Add support for additional GeoTIFF maps for other regions
- Implement a layer manager that can handle multiple overlays
- Add opacity control for the user to adjust transparency

## Notes

- This implementation is completely separate from other functionality to minimize the risk of breaking existing features
- The GeoTIFF is only loaded when in the Gulf of Mexico region to conserve memory and bandwidth
- The implementation fully follows our core principles: no quick fixes, no dummy data, and proper structural improvements
