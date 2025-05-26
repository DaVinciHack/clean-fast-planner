#!/bin/bash

# Exit on error
set -e

echo "Running import fix script to fix syntax error in FastPlannerApp.jsx..."

# Go to the script directory
cd "$(dirname "$0")"

# Run the Node.js script
node ./fix-import-error.cjs

echo "Import fix completed successfully!"
