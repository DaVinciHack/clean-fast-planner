#!/bin/bash

# Update the handlePayloadWeightChange function
lineNumStart=$(grep -n "const handlePayloadWeightChange" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | head -1 | cut -d ':' -f 1)
lineNumEnd=$(tail -n +$lineNumStart /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | grep -n "^  };" | head -1 | cut -d ':' -f 1)
lineNumEnd=$(($lineNumStart + $lineNumEnd - 1))

# Create a new version of the function
cat > /tmp/new_payload_handler.txt << 'EOF'
  const handlePayloadWeightChange = (weight) => {
    setPayloadWeight(weight);
    handleFlightSettingChange('payloadWeight', weight);
    
    // Recalculate route stats with the new payload weight
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRouteInfoFromStats(stats);
        }, 50);
      }
    }
  };
EOF

# Use sed to replace the function
sed -i '' "${lineNumStart},${lineNumEnd}c\\
$(cat /tmp/new_payload_handler.txt)
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Update the handleReserveFuelChange function
lineNumStart=$(grep -n "const handleReserveFuelChange" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | head -1 | cut -d ':' -f 1)
lineNumEnd=$(tail -n +$lineNumStart /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | grep -n "^  };" | head -1 | cut -d ':' -f 1)
lineNumEnd=$(($lineNumStart + $lineNumEnd - 1))

# Create a new version of the function
cat > /tmp/new_reserve_handler.txt << 'EOF'
  const handleReserveFuelChange = (fuel) => {
    setReserveFuel(fuel);
    handleFlightSettingChange('reserveFuel', fuel);
    
    // Recalculate route stats with the new reserve fuel
    const wps = waypointManagerRef.current?.getWaypoints() || [];
    if (wps.length >= 2) {
      const coordinates = wps.map(wp => wp.coords);
      const stats = calculateRouteStats(coordinates);
      
      // Force update the route with new leg info
      if (waypointManagerRef.current) {
        setTimeout(() => {
          waypointManagerRef.current.updateRouteInfoFromStats(stats);
        }, 50);
      }
    }
  };
EOF

# Use sed to replace the function
sed -i '' "${lineNumStart},${lineNumEnd}c\\
$(cat /tmp/new_reserve_handler.txt)
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Clean up temporary files
rm -f /tmp/new_payload_handler.txt
rm -f /tmp/new_reserve_handler.txt

echo "Updated handler functions."