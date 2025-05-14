#!/bin/bash

# Create a final backup of the current state before resetting
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.pre-git-reset

# Change to the project directory
cd /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/

# Hard reset just the FastPlannerApp.jsx file to the last commit
git checkout -- src/components/fast-planner/FastPlannerApp.jsx

echo "Hard reset completed. FastPlannerApp.jsx has been restored to the last git commit version."
