#!/bin/bash

# This script fixes the duplicate comment issue

# Make a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.comment-fix-backup

# Replace the duplicate comments with a single comment
sed -i '' 's/  \/\/ Generate stop cards data\n  \/\/ Generate stop cards data/  \/\/ Generate stop cards data/' /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Fixed duplicate comments"
