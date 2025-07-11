#!/bin/bash
# Create clean production zip

# Remove old files
rm -rf production-temp platform-auto-loading-fix-FINAL.zip

# Create temp directory
mkdir production-temp

# Copy essential files
cp dist/index.html production-temp/
cp -r dist/assets production-temp/

# Create auth directories and copy callback files
mkdir -p production-temp/auth production-temp/planner/auth
cp public/auth/callback.html production-temp/auth/
cp public/auth/callback.html production-temp/planner/auth/

# Add icons
cp -r public/assets/icons production-temp/assets/

# Create zip from inside temp directory so files are in root
cd production-temp
zip -r ../platform-auto-loading-fix-FINAL.zip .
cd ..

# Clean up
rm -rf production-temp

echo "✅ Created platform-auto-loading-fix-FINAL.zip"
echo "Structure:"
unzip -l platform-auto-loading-fix-FINAL.zip | head -10