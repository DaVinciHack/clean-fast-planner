#!/bin/bash
# setup-gulf-coast-map.sh
#
# This script sets up the Gulf Coast Helicopter Map GeoTIFF files

# Create directory for map files
mkdir -p public/US_Gulf_Coast_Heli

# Copy map files
cp "US_Gulf_Coast_Heli (1)/U.S. Gulf Coast HEL.tif" public/US_Gulf_Coast_Heli/
cp "US_Gulf_Coast_Heli (1)/U.S. Gulf Coast HEL.tfw" public/US_Gulf_Coast_Heli/
cp "US_Gulf_Coast_Heli (1)/U.S. Gulf Coast HEL.htm" public/US_Gulf_Coast_Heli/

echo "Gulf Coast Helicopter Map files copied to public directory."
echo "Add the Map Layers styles to FastPlannerStyles.css with:"
echo "cat FastPlannerStyles.css.add >> FastPlannerStyles.css"
