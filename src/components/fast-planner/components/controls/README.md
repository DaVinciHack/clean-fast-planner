# Fast Planner Control Components

This directory contains UI control components for the Fast Planner application.

## Components

### RegionSelector
Provides a dropdown to select the current geographical region for route planning.

### SaveFlightButton
A new component that allows users to save flight plans to Palantir Foundry using the OSDK API.

## How to Use the Save Flight Button

The Save Flight button appears in the top control section near the "Hide Rigs" button. It is only enabled when:
1. An aircraft is selected
2. At least two waypoints have been added to create a valid route

When clicked, it opens a modal where you can:
- Name your flight
- Set the Estimated Time of Departure (ETD)
- Assign crew members (Captain, Copilot, Medic, SO, and Rescue Swimmer)

After filling in the required information, click "Save Flight" to create the flight in Palantir Foundry.

## Implementation Details

The SaveFlightButton component:
1. Creates a button that only becomes active when a valid route and aircraft are selected
2. Opens a modal to collect additional flight details
3. Makes an OSDK API call to create a new flight using the `createNewFlightFp2` action
4. Provides feedback on success or failure of the operation

### Example Usage

```jsx
<SaveFlightButton
  selectedAircraft={selectedAircraft}
  waypoints={waypoints}
  routeStats={routeStats}
  currentRegion={currentRegion}
  onSuccess={handleSuccessMessage}
  onError={handleErrorMessage}
/>
```

## Troubleshooting

If you encounter issues with saving flights, check the following:
1. Confirm that you're logged in to Palantir Foundry
2. Verify that the OSDK client is properly initialized
3. Ensure the selected aircraft has a valid registration/identifier
4. Check the browser console for detailed error messages
