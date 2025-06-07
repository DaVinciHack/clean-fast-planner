// Add this code to the region filtering useEffect in AircraftContext.jsx
// around line 150-163, replacing the existing filtering code:

// IMPORTANT: Create an object with ALL possible aircraft types (empty arrays)
// This is the key trick from the original component - always show all types
const allTypes = {
  'S92': [],
  'S76': [],
  'S76D': [],
  'AW139': [],
  'AW189': [],
  'H175': [],
  'H160': [],
  'EC135': [],
  'EC225': [],
  'AS350': [],
  'A119': []
};

// Now fill in the types with actual aircraft in this region
aircraftInRegion.forEach(aircraft => {
  const type = aircraft.modelType || 'S92';
  if (allTypes[type]) {
    allTypes[type].push(aircraft);
  } else {
    // If we encounter an unknown type, create a new bucket
    allTypes[type] = [aircraft];
  }
});

// Log counts for debugging
Object.keys(allTypes).forEach(type => {
  console.log(`Type ${type}: ${allTypes[type].length} aircraft`);
});

// Update the state with ALL types, even empty ones
setAircraftsByType(allTypes);