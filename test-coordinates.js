// Test script for coordinate parsing
import { parseCoordinates, looksLikeCoordinates } from './src/components/fast-planner/utils/coordinateParser.js';

// Test various coordinate formats
const testCases = [
  "60.7917, 5.3417",           // Decimal degrees
  "60° 47.502' N, 5° 20.502' E", // Degrees decimal minutes
  "60° 47' 30.12\" N, 5° 20' 30.12\" E", // Degrees minutes seconds
  "60.7917,5.3417",            // No spaces
  "STAVANGER",                 // Platform name (should not parse as coordinates)
  "invalid input"              // Invalid
];

console.log("Testing coordinate parsing...\n");

testCases.forEach((testCase, index) => {
  console.log(`Test ${index + 1}: "${testCase}"`);
  console.log(`  Looks like coordinates: ${looksLikeCoordinates(testCase)}`);
  
  const result = parseCoordinates(testCase);
  console.log(`  Parse result:`, result);
  console.log("");
});
