/**
 * Configuration file for Fast Planner OSDK integration
 */

// Foundry API configuration
const FOUNDRY_CONFIG = {
  apiUrl: 'https://bristow.palantirfoundry.com',  // Actual Foundry API URL
  clientId: '7db2ec0841ba7cd5697f25eebde0a64e',  // Actual client ID
  // Use the same URL that's already registered in Foundry
  redirectUrl: 'http://localhost:8080/auth/callback',
  ontologyRid: 'ri.ontology.main.ontology.cbb7e48e-47d3-448d-8c46-3ecea0729ea5'  // Updated with your ontology RID
};

// Mapbox configuration
const MAPBOX_CONFIG = {
  accessToken: 'pk.eyJ1IjoiZGlya3N0ZXIxMDEiLCJhIjoiY204YW9mdm4yMTliMTJscXVnaXRqNmptNyJ9.VDLt_kE5BnAV8S4vXjFMlg',
  defaultCenter: [-90.5, 27.5], // Gulf of Mexico center
  defaultZoom: 6
};

// Default aircraft types (used as fallback if OSDK data is unavailable)
const DEFAULT_AIRCRAFT_TYPES = {
  s92: {
    name: "Sikorsky S-92",
    cruiseSpeed: 145, // knots
    fuelBurn: 1450,   // lbs per hour
    maxFuel: 5200,    // lbs
    maxTakeoffWeight: 26500, // lbs
    emptyWeight: 17000, // lbs
    passengerWeight: 220 // lbs per passenger
  },
  aw139: {
    name: "Leonardo AW139",
    cruiseSpeed: 150, // knots
    fuelBurn: 1100,   // lbs per hour
    maxFuel: 3900,    // lbs
    maxTakeoffWeight: 14991, // lbs
    emptyWeight: 10250, // lbs
    passengerWeight: 220 // lbs per passenger
  },
  h175: {
    name: "Airbus H175",
    cruiseSpeed: 150, // knots
    fuelBurn: 980,    // lbs per hour
    maxFuel: 4400,    // lbs
    maxTakeoffWeight: 17196, // lbs
    emptyWeight: 10800, // lbs
    passengerWeight: 220 // lbs per passenger
  },
  h160: {
    name: "Airbus H160",
    cruiseSpeed: 150, // knots
    fuelBurn: 750,    // lbs per hour
    maxFuel: 3000,    // lbs
    maxTakeoffWeight: 13338, // lbs
    emptyWeight: 8100, // lbs
    passengerWeight: 220 // lbs per passenger
  }
};