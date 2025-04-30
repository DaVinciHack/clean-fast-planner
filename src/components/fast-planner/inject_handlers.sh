#!/bin/bash

# Restore from our original backup
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Update the FlightCalculations module
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.fix.js /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/modules/calculations/FlightCalculations.js

# Find where to insert our handlers (after reserveMethod state variable)
lineNum=$(grep -n "const \[reserveMethod, setReserveMethod\] = useState" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | cut -d ':' -f 1)
lineNum=$((lineNum + 1))

# Read our handler functions and store in a variable
HANDLERS=$(cat /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/handler_functions.js)

# Create a temporary file for editing
cat > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit.sh << EOF
#!/bin/bash
sed -i '' "${lineNum}i\\
${HANDLERS}
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
EOF

# Make it executable
chmod +x /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit.sh

# Run it
/Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit.sh

# Update the RightPanel component props
sed -i '' 's/onPassengerWeightChange={setPassengerWeight}/onPassengerWeightChange={handlePassengerWeightChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
sed -i '' 's/onReserveFuelChange={setReserveFuel}/onReserveFuelChange={handleReserveFuelChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
sed -i '' 's/onDeckTimeChange={setDeckTimePerStop}/onDeckTimeChange={handleDeckTimeChange}/g' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Add a synchronization useEffect
# First, find where to add it
lineNum=$(grep -n "Initialize the flight calculations module" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | cut -d ':' -f 1)
endOfUseEffect=$(grep -n -A 15 "Initialize the flight calculations module" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | grep -n "\]);" | head -1)
lineOffset=$(echo $endOfUseEffect | cut -d ':' -f 1)
lineNum=$((lineNum + lineOffset))

# Create a temp file with the sync useEffect
cat > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/sync_effect.js << EOF
  
  // Ensure flight calculation settings are synchronized with the module
  useEffect(() => {
    if (flightCalculationsRef.current) {
      // Sync all state values to the calculator when they change
      flightCalculationsRef.current.updateConfig({
        passengerWeight,
        reserveFuel,
        deckTimePerStop,
        deckFuelFlow,
        taxiFuel,
        contingencyFuelPercent,
        payloadWeight
      });
      
      console.log("Flight calculation settings synchronized with calculator module");
      
      // Recalculate route if we have waypoints
      const wps = waypointManagerRef.current?.getWaypoints() || [];
      if (wps.length >= 2) {
        const coordinates = wps.map(wp => wp.coords);
        calculateRouteStats(coordinates);
      }
    }
  }, [passengerWeight, reserveFuel, deckTimePerStop, deckFuelFlow, taxiFuel, contingencyFuelPercent, payloadWeight]);
EOF

# Create a temporary file for editing
cat > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit2.sh << EOF
#!/bin/bash
sed -i '' "${lineNum}r /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/sync_effect.js" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
EOF

# Make it executable
chmod +x /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit2.sh

# Run it
/Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit2.sh

# Clean up
rm -f /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit.sh
rm -f /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/temp_edit2.sh
rm -f /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/sync_effect.js

echo "Handler functions successfully injected."