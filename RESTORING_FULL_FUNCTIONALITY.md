# Restoring Full Fast Planner Functionality

The application has been temporarily simplified to fix critical syntax errors. Follow these steps to restore full functionality.

## Approach 1: Restore from Backup (Quick Method)

1. First, make sure your application runs correctly with the current simplified version
2. If it works, you can restore the original file with careful editing:

```bash
# Copy the backup file
cp /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx.bak /tmp/original.jsx

# Open the file in an editor
# In VS Code:
code /tmp/original.jsx

# Look at line 2626-2629:
# - Remove the line containing just "};", if it exists
# - Make sure the closing brace and export statement are separated

# Save the edited file and copy it back
cp /tmp/original.jsx /Users/duncanburbury/Fast-Planner-Clean/src/components/fast-planner/ModularFastPlannerComponent.jsx
```

## Approach 2: Incremental Restoration (Safer Method)

1. Start with the working simplified version
2. Gradually restore functionality in this order:
   - State variables and refs from the original file
   - useEffect hooks one by one
   - Event handlers
   - Render content

## Approach 3: Use the Enhanced Components Only

1. Keep using the simplified ModularFastPlannerComponent.jsx
2. Apply the enhanced components to fix the fuel calculation issues:
   - Enhanced FlightCalculations.js (already applied)
   - Updated FlightSettings.jsx component

## What's Already Fixed

- FlightCalculations.js module has been updated with improved fuel calculations
- FlightSettings.jsx has been enhanced with an "Update Calculations" button

## Testing After Restoration

After restoring functionality, test the fuel calculation fixes by:

1. Creating a route with multiple waypoints
2. Going to the Settings tab and changing values
3. Clicking the "Update Calculations" button
4. Verifying the top card displays updated values

## Need Help?

If you encounter issues restoring functionality, consider:

1. Debugging the syntax errors one section at a time
2. Comparing with the backup file to identify problematic sections
3. Using a format/lint tool to help identify any syntax issues
