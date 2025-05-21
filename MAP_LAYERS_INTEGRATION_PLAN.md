# Map Layers Integration Plan

This document outlines the complete implementation plan for adding a Map Layers tab to the Fast Planner application and integrating the Gulf Coast Helicopter Map.

## Overview

The Map Layers tab will allow users to toggle various map overlays, including:
- Gulf Coast Helicopter Map (for Gulf of Mexico region)
- Weather overlays (future)
- VFR charts (future)
- Base layers (grid, platforms)

## Components Created

1. **GulfCoastGeoTIFF.js** - Core module for handling the GeoTIFF file
2. **useMapLayers.js** - Hook for managing map layer state and references
3. **MapLayersCard.jsx** - Card component for the right panel tab

## Files Updated

1. **RightPanelContainer.jsx** - Added Map Layers to the available tabs
2. **RightPanel.jsx** - Added MapLayersCard component and passed required refs
3. **cards/index.js** - Updated to export the MapLayersCard

## Integration Steps

### Step 1: Copy the GeoTIFF Files

Copy the Gulf Coast Helicopter Map files to the public directory:

```bash
mkdir -p public/US_Gulf_Coast_Heli
cp "US_Gulf_Coast_Heli (1)/U.S. Gulf Coast HEL.tif" public/US_Gulf_Coast_Heli/
cp "US_Gulf_Coast_Heli (1)/U.S. Gulf Coast HEL.tfw" public/US_Gulf_Coast_Heli/
cp "US_Gulf_Coast_Heli (1)/U.S. Gulf Coast HEL.htm" public/US_Gulf_Coast_Heli/
```

### Step 2: Add the useMapLayers Hook to FastPlannerApp.jsx

1. Import the useMapLayers hook at the top of the file:

```javascript
import useMapLayers from './hooks/useMapLayers';
```

2. Use the hook in the FastPlannerCore component:

```javascript
const {
  gulfCoastMapRef,
  weatherLayerRef,
  vfrChartsRef,
  layerStates,
  toggleLayer
} = useMapLayers({ mapManagerRef });
```

3. Pass the refs to the RightPanel component:

```jsx
<RightPanel
  visible={rightPanelVisible}
  onToggleVisibility={toggleRightPanel}
  mapManagerRef={mapManagerRef}
  gulfCoastMapRef={gulfCoastMapRef}
  weatherLayerRef={weatherLayerRef}
  vfrChartsRef={vfrChartsRef}
  // ... other existing props
/>
```

### Step 3: Update package.json

Add the required dependencies if not already present:

```json
"dependencies": {
  // ... existing dependencies
  "leaflet": "^1.9.3",
  "leaflet-geotiff": "^0.2.0"
}
```

Note: These libraries will be loaded at runtime via CDN, so no npm install is needed.

## Usage

1. When in the Gulf of Mexico region, the Map Layers tab will show the Gulf Coast Helicopter Map option.
2. Click on the Map Layers tab in the right panel to open the layers panel.
3. Toggle layers on/off using the toggle buttons.
4. Future map layers like weather and VFR charts will be added to this panel.

## Design Notes

- The implementation follows the existing tab structure in your application
- The GeoTIFF layer only loads when in the Gulf of Mexico region to conserve resources
- This is a modular design that can be easily extended with additional map layers
- All functionality is cleanly separated from other parts of the application to avoid interference

## Testing Plan

1. Test switching between regions and verify the Gulf Coast layer is only available in the Gulf of Mexico
2. Test toggling the layer on and off
3. Verify the layer appears correctly overlaid on the base map
4. Test with different aircraft and waypoints to ensure the layer doesn't interfere with other functionality
