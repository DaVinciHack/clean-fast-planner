#!/bin/bash

echo "Setting up Fast-Planner-Clean project..."

# Create node_modules directory if it doesn't exist
mkdir -p node_modules/@flight-app

# Create symbolic link to the OSDK package
echo "Creating symbolic link to @flight-app/sdk..."
ln -sf /Users/duncanburbury/Fast-Planner-OSDK/Flight-App-React-workspace/node_modules/@flight-app/sdk node_modules/@flight-app/

# Install dependencies
echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Setup complete! You can now run 'npm run dev' to start the application."