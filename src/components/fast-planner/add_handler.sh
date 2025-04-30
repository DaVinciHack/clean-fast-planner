#!/bin/bash

# Find the first handler function
lineNum=$(grep -n "const handlePayloadWeightChange" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx | head -1 | cut -d ':' -f 1)

# Add our handleFlightSettingChange function before it
sed -i '' "${lineNum}i\\
  /**\\
   * Unified function to handle flight settings changes\\
   * Updates both individual state variables and the flight calculations module\\
   */\\
  const handleFlightSettingChange = (settingName, value) => {\\
    console.log(\`Updating flight setting: \${settingName} = \${value}\`);\\
    \\
    // Update the flightSettings object\\
    setFlightSettings(prevSettings => ({\\
      ...prevSettings,\\
      [settingName]: value\\
    }));\\
    \\
    // Update the flight calculations module if it exists\\
    if (flightCalculationsRef.current) {\\
      flightCalculationsRef.current.updateConfig({\\
        [settingName]: value\\
      });\\
    }\\
  };\\
\\
" /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx

echo "Added handleFlightSettingChange function."