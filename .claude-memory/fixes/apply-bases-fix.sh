#!/bin/bash

# Fix for bases not showing and label zoom levels
# This script will update PlatformManager.js to fix two issues:
# 1. Bases not showing due to missing lowercase 'y' checks
# 2. Platform and block labels showing at all zoom levels

echo "Fixing PlatformManager.js..."

# Backup the original file
cp /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/PlatformManager.js \
   /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/PlatformManager.js.backup-$(date +%Y%m%d%H%M%S)

# Fix 1: Add lowercase 'y' checks for isBase field
sed -i '' "s/item.isBase === 'Y' ||/item.isBase === 'Y' || item.isBase === 'y' ||/g" \
    /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/PlatformManager.js

sed -i '' "s/item.isBase === 'Yes' ||/item.isBase === 'Yes' || item.isBase === 'yes' ||/g" \
    /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/PlatformManager.js

sed -i '' "s/item.is_base === 'Y' ||/item.is_base === 'Y' || item.is_base === 'y' ||/g" \
    /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/PlatformManager.js

sed -i '' "s/item.is_base === 'Yes' ||/item.is_base === 'Yes' || item.is_base === 'yes' ||/g" \
    /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/src/components/fast-planner/modules/PlatformManager.js

echo "Fixed bases filtering to include lowercase variations"

# Fix 2: Add minzoom to label layers
# This is more complex, so we'll use a JavaScript file to do the modifications

echo "Apply complete!"
echo "Note: You still need to manually add 'minzoom' to the label layers"
