#!/bin/bash

# Create a backup
cp -v /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx.fix-backup

# Create a replacement text file
cat > /tmp/fix-text.txt << 'EOL'
    // MODIFIED: Removed departure card section to fix stop cards functionality

    // Create cards for each subsequent stop
EOL

# Apply the replacement
sed -i.sed-bak '/\/\/ Create departure card/,/\/\/ Create cards for each subsequent stop/ {//!d}; /\/\/ Create departure card/ {r /tmp/fix-text.txt
d}; /\/\/ Create cards for each subsequent stop/d' /Users/duncanburbury/FastPlannerMaster/FastPlannerV3/src/components/fast-planner/FastPlannerApp.jsx

echo "Fix applied. The departure card section has been removed."
