#!/bin/bash

# Script to apply the fix to ModularFastPlannerComponent.jsx
# This handles the issue with platformManagerRef.current being null

echo "Applying fix to ModularFastPlannerComponent.jsx..."

# Use sed to find and replace the problematic code
# We need to use a temporary file since the original is quite large

TEMP_FILE=$(mktemp)

# Make a backup of the original file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx \
   /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak

# Apply the fix using sed - this handles the multiline replacement
sed '
/platformManagerRef\.current\.loadPlatformsFromFoundry(client, defaultRegion\.osdkRegion)/,/setPlatformsVisible(true);/ {
    c\
            // Don'\''t load static data, just load from Foundry\
            if (platformManagerRef.current) {\
              platformManagerRef.current.loadPlatformsFromFoundry(client, defaultRegion.osdkRegion)\
                .then(platforms => {\
                  console.log(`Loaded ${platforms.length} platforms for ${defaultRegion.name}`);\
                  rigsAutoloadedRef.current = true;\
                  setPlatformsLoaded(true);\
                  setPlatformsVisible(true);\
                })\
                .catch(error => {\
                  console.error(`Error loading platforms: ${error}`);\
                });\
            } else {\
              console.error("Platform manager not initialized");\
            }
}
' /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx > $TEMP_FILE

# Check if the sed command succeeded
if [ $? -eq 0 ]; then
    # Replace the original file with the fixed version
    mv $TEMP_FILE /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
    echo "Fix applied successfully!"
else
    echo "Error applying fix. Check the original file and try again."
    rm $TEMP_FILE
fi
