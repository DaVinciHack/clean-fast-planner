/**
 * Mapping between orgUnit codes and display region names
 * This mapping is used to convert between internal orgUnit codes and user-friendly region names
 */

// Map from orgUnit code to display name
export const orgUnitToRegionMap = {
  '1000': 'Norway',
  '2': 'Gulf of Mexico',
  '3': 'Trinidad and Tobago',
  '4': 'Brazil',
  '6': 'United Kingdom',
  '7': 'Netherlands',
  '8': 'Nigeria',
  '9': 'Ireland',
  '600': 'UKSAR',
  // Add any additional mappings as needed
};

// Map from display name to orgUnit code
export const regionToOrgUnitMap = {
  'Norway': '1000',
  'Gulf of Mexico': '2',
  'Trinidad and Tobago': '3',
  'Brazil': '4',
  'United Kingdom': '6',
  'Netherlands': '7',
  'Nigeria': '8',
  'Ireland': '9',
  'UKSAR': '600',
  // Add any additional mappings as needed
};

// Function to get orgUnit code from region display name (case insensitive)
export function getOrgUnitFromRegion(regionDisplay) {
  // Convert both sides to uppercase for case-insensitive matching
  const regionUpper = regionDisplay.toUpperCase();
  for (const [key, value] of Object.entries(regionToOrgUnitMap)) {
    if (key.toUpperCase() === regionUpper) {
      return value;
    }
  }
  console.warn(`No matching orgUnit found for region: ${regionDisplay}`);
  return null;
}

// Function to get display region from orgUnit code
export function getRegionFromOrgUnit(orgUnitCode) {
  const region = orgUnitToRegionMap[orgUnitCode];
  if (!region) {
    console.warn(`No matching region found for orgUnit: ${orgUnitCode}`);
    return orgUnitCode; // Fallback to showing the code if no mapping exists
  }
  return region;
}
