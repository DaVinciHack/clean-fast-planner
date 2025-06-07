// Label diagnostic script - run this in browser console

const checkLabels = () => {
  console.log('=== LABEL LAYERS DIAGNOSTIC ===');
  
  // Get the map instance
  const pm = window.platformManager || window.appManagers?.platformManagerRef?.current;
  if (!pm || !pm.mapManager) {
    console.error('Cannot find PlatformManager or MapManager');
    return;
  }
  
  const map = pm.mapManager.getMap();
  if (!map) {
    console.error('Map not available');
    return;
  }
  
  // Check each label layer
  const labelLayers = [
    'platforms-fixed-labels',
    'platforms-movable-labels', 
    'blocks-labels',
    'bases-labels',
    'airfields-labels'
  ];
  
  console.log('Checking label layers...\n');
  
  labelLayers.forEach(layerId => {
    const layer = map.getLayer(layerId);
    
    if (!layer) {
      console.log(`❌ ${layerId}: DOES NOT EXIST`);
      return;
    }
    
    console.log(`✅ ${layerId}: EXISTS`);
    
    // Get layer properties
    const visibility = map.getLayoutProperty(layerId, 'visibility');
    const textField = map.getLayoutProperty(layerId, 'text-field');
    const textSize = map.getLayoutProperty(layerId, 'text-size');
    const paintProps = map.getPaintProperty(layerId, 'text-opacity');
    
    console.log(`   Visibility: ${visibility}`);
    console.log(`   Text field: ${JSON.stringify(textField)}`);
    console.log(`   Text size: ${JSON.stringify(textSize)}`);
    console.log(`   Text opacity: ${JSON.stringify(paintProps)}`);
    
    // Check if there are features for this layer
    const source = map.getSource('major-platforms');
    if (source && source._data) {
      const platformType = layerId.replace('-labels', '').replace('platforms-', '');
      const features = source._data.features.filter(f => {
        if (layerId === 'platforms-fixed-labels') return f.properties?.platformType === 'fixed';
        if (layerId === 'platforms-movable-labels') return f.properties?.platformType === 'movable';
        if (layerId === 'blocks-labels') return f.properties?.platformType === 'blocks';
        if (layerId === 'bases-labels') return f.properties?.platformType === 'bases';
        if (layerId === 'airfields-labels') return f.properties?.platformType === 'airfield';
        return false;
      });
      console.log(`   Features with matching type: ${features.length}`);
      if (features.length > 0 && features[0].properties.name) {
        console.log(`   Sample names: ${features.slice(0, 3).map(f => f.properties.name).join(', ')}`);
      }
    }
    
    console.log('');
  });
  
  // Check current zoom level
  const currentZoom = map.getZoom();
  console.log(`Current zoom level: ${currentZoom.toFixed(2)}`);
  console.log('Platform labels should show at zoom 12+');
  console.log('Block labels should show at zoom 13+');
  
  console.log('=== END DIAGNOSTIC ===');
};

// Also provide a fix to force labels visible
const forceLabelsVisible = () => {
  const pm = window.platformManager || window.appManagers?.platformManagerRef?.current;
  const map = pm?.mapManager?.getMap();
  if (!map) return;
  
  ['platforms-fixed-labels', 'platforms-movable-labels', 'blocks-labels'].forEach(layerId => {
    if (map.getLayer(layerId)) {
      // Remove opacity restrictions
      map.setPaintProperty(layerId, 'text-opacity', 1);
      // Make sure visibility is on
      map.setLayoutProperty(layerId, 'visibility', 'visible');
      console.log(`Forced ${layerId} to be visible`);
    }
  });
};

// Run the check
checkLabels();

// Export for reuse
window.checkLabels = checkLabels;
window.forceLabelsVisible = forceLabelsVisible;

console.log('\nTo force labels visible (for testing), run: forceLabelsVisible()');
