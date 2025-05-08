#!/bin/bash

# Create a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.final-fix-backup

# Restore the safety backup version - this is from before our changes
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.safety-backup /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Reset to safety backup. This should restore both stop card functionality and wind data application."
