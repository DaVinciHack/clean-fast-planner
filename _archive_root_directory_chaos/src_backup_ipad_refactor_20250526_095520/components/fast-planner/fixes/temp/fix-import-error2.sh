#!/bin/bash

# Exit on error
set -e

echo "Running import fix script to fix remaining syntax error in FastPlannerApp.jsx..."

# Go to the script directory
cd "$(dirname "$0")"

# Run the Node.js script
node ./fix-import-error2.cjs

echo "Import fix completed successfully!"
