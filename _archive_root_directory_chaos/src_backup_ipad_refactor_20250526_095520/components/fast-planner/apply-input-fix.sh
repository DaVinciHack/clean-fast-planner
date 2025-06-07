#!/bin/bash
# Input fix script

# Save the current directory
CURRENT_DIR=$(pwd)

# Go to the FastPlannerApp directory
cd "$(dirname "$0")"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: node is not installed. Please install Node.js to run this script."
    exit 1
fi

# Create a backup
cp FastPlannerApp.jsx FastPlannerApp.jsx.input-fix-backup-$(date +%Y%m%d%H%M%S)

# Apply the input fix
node apply-input-fix.js

# Print success message
echo ""
echo "==============================================="
echo "🎉 Input fix has been applied successfully!"
echo "==============================================="
echo ""
echo "Changes made:"
echo "1. Added input-fix.js and input-fix.css files"
echo "2. Updated FastPlannerApp.jsx to use the fixes"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. Test the input field in the application"
echo ""
echo "If you have any issues, a backup of your FastPlannerApp.jsx"
echo "was created before making changes."
echo ""

# Return to the original directory
cd "$CURRENT_DIR"
