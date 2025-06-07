#!/bin/bash

echo "Applying fix to ModularFastPlannerComponent.jsx..."

# Create temporary file
TEMP_FILE=$(mktemp)

# Find the exact line with the problematic code
PROBLEM_LINE=$(grep -n "platformManagerRef.current.loadPlatformsFromFoundry(client, defaultRegion.osdkRegion)" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | head -1 | cut -d':' -f1)

if [ -z "$PROBLEM_LINE" ]; then
  echo "Could not find the problematic line. Aborting."
  exit 1
fi

echo "Found problematic code at line $PROBLEM_LINE"

# Make a backup
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx \
   /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak.$(date +%s)

# Perform the targeted replacement with sed
# Since line numbering and exact spacing might vary, let's use a pattern-based approach
sed "/platformManagerRef\.current\.loadPlatformsFromFoundry(client, defaultRegion\.osdkRegion)/i\\
            if (platformManagerRef.current) {" \
  /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx > $TEMP_FILE

# Find the end of the promise chain (where setPlatformsVisible(true) is followed by a closing bracket and semicolon)
# and add the closing bracket for the if condition and an else clause
sed "/setPlatformsVisible(true);/a\\
              })\\
              .catch(error => {\\
                console.error(\`Error loading platforms: \${error}\`);\\
              });\\
            } else {\\
              console.error(\"Platform manager not initialized - try refreshing the page\");\\
            }" \
  $TEMP_FILE > /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

# Check if the fix was applied
if grep -q "Platform manager not initialized" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx; then
  echo "Fix successfully applied."
else
  echo "Fix may not have been applied correctly."
  # Restore from backup if needed
  # cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak \
  #    /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
fi

# Clean up
rm $TEMP_FILE
