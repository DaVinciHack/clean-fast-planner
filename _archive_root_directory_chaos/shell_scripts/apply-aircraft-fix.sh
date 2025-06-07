#!/bin/bash

echo "Applying fix to AircraftContext.jsx..."

# Make a backup
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/context/AircraftContext.jsx \
   /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/context/AircraftContext.jsx.bak2

# Create a temporary file
TEMP_FILE=$(mktemp)

# Extract line number where the replacement should start
LINE_NUM=$(grep -n "getAvailableTypesInRegion" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/context/AircraftContext.jsx | cut -d':' -f1)

# Calculate the starting line for the replacement (line before getAvailableTypesInRegion)
START_LINE=$((LINE_NUM - 1))

# Calculate the ending line (update state line)
END_LINE=$(grep -n "setAircraftsByType" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/context/AircraftContext.jsx | head -1 | cut -d':' -f1)
END_LINE=$((END_LINE + 1))

echo "Replacing lines $START_LINE to $END_LINE"

# Replace the lines using sed
cat /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/context/AircraftContext.jsx | 
    sed "${START_LINE},${END_LINE}c\\
        // IMPORTANT: Create an object with ALL possible aircraft types (empty arrays)\\
        // This is the key trick from the original component - always show all types\\
        const allTypes = {\\
          'S92': [],\\
          'S76': [],\\
          'S76D': [],\\
          'AW139': [],\\
          'AW189': [],\\
          'H175': [],\\
          'H160': [],\\
          'EC135': [],\\
          'EC225': [],\\
          'AS350': [],\\
          'A119': []\\
        };\\
        \\
        // Now fill in the types with actual aircraft in this region\\
        aircraftInRegion.forEach(aircraft => {\\
          const type = aircraft.modelType || 'S92';\\
          if (allTypes[type]) {\\
            allTypes[type].push(aircraft);\\
          } else {\\
            // If we encounter an unknown type, create a new bucket\\
            allTypes[type] = [aircraft];\\
          }\\
        });\\
        \\
        // Log counts for debugging\\
        Object.keys(allTypes).forEach(type => {\\
          console.log(\`Type \${type}: \${allTypes[type].length} aircraft\`);\\
        });\\
        \\
        // Update the state with ALL types, even empty ones\\
        setAircraftsByType(allTypes);" > $TEMP_FILE

# Replace the original file with our modified version
mv $TEMP_FILE /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/context/AircraftContext.jsx

echo "Fix applied successfully!"
