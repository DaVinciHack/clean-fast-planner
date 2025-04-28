# Fast-Planner-Clean

A clean, streamlined version of the Fast Flight Planner application.

## Setup

This project requires access to the `@flight-app/sdk` package from the original Flight-App-React-workspace.

To set up the project:

1. Run the setup script:
   ```
   ./setup.sh
   ```

   This will create a symbolic link to the SDK package and install the dependencies.

2. Start the development server:
   ```
   npm run dev
   ```

3. Open your browser and navigate to: `http://localhost:8080`

## Authentication

The application uses the same authentication flow as the original project, connecting to the Palantir Foundry platform. You'll need to log in with your Palantir credentials to access the flight planning features.

## Features

- Map-based flight planning
- Rig/platform visualization
- Route planning with waypoints
- Aircraft selection and performance calculations

## Project Structure

- `/src/components/fast-planner` - Main components
- `/src/components/fast-planner/modules` - Core functionality modules
- `/src/components/fast-planner/components` - UI components