#!/bin/bash
# apply-waypoint-fix.sh
#
# This script applies the standalone waypoint fix by adding a script tag to index.html

# Find the index.html file
INDEX_HTML_PATH="/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/index.html"

if [ ! -f "$INDEX_HTML_PATH" ]; then
  echo "ERROR: Cannot find index.html at $INDEX_HTML_PATH"
  echo "Please provide the correct path to index.html"
  exit 1
fi

# Create a backup
cp "$INDEX_HTML_PATH" "${INDEX_HTML_PATH}.backup"
echo "Created backup at: ${INDEX_HTML_PATH}.backup"

# Read the injection content
INJECTION_CONTENT=$(cat "/Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/waypoint-fix-injection.html")

# Add the script to the index.html file if it's not already there
if grep -q "waypoint-fix.js" "$INDEX_HTML_PATH"; then
  echo "Waypoint fix already added to index.html"
else
  # Insert the script tag before the closing </head> tag
  awk -v injection="$INJECTION_CONTENT" '
  /<\/head>/ { print injection; }
  { print; }
  ' "${INDEX_HTML_PATH}.backup" > "$INDEX_HTML_PATH"
  
  echo "Added waypoint fix to index.html"
fi

echo "Done! Restart your development server to apply the fix."
echo "Read /Users/duncanburbury/FastPlannerMaster/FastPlannerV5/public/WAYPOINT_FIX_README.md for more details."
