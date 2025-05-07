// Script to run the flight automation on a created flight
// This standalone script calls the single-flight-automation action

import { SingleFlightAutomation } from "@flight-app/sdk";

// Get the flight ID from command line arguments or set it directly
const flightId = process.argv[2] || "43ff5f8c-1ec9-4dfa-b24f-dc3b570e04b6";

async function runFlightAutomation() {
  try {
    console.log(`Running automation for flight ID: ${flightId}`);
    
    // Import the OSDK client
    const { client } = await import("../src/client.js");
    
    // Call the single-flight-automation action with the flight ID
    const result = await client(SingleFlightAutomation).applyAction({
      flightId: flightId,
      returnEdits: true  // Optional: set to true if you want to see what changed
    });
    
    console.log("Automation applied successfully!");
    console.log("Result:", JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.error("Error applying flight automation:", error);
    throw error;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  runFlightAutomation()
    .then(() => console.log("Script completed."))
    .catch(err => {
      console.error("Script failed:", err);
      process.exit(1);
    });
}

// Export the function for use in other modules
export default runFlightAutomation;
