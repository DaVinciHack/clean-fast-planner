// Simple test for coordinate parsing functionality

// Import the coordinate parser functions
import { parseCoordinates, looksLikeCoordinates } from './src/components/fast-planner/utils/coordinateParser.js';

console.log("=== COORDINATE PARSER TEST ===\n");

// Test cases
const testCases = [
  "STAVANGER",                    // Platform name - should NOT parse as coordinates
  "60.7917, 5.3417",             // Decimal degrees - should parse
  "60° 47.502' N, 5° 20.502' E", // Degrees decimal minutes - should parse
  "60° 47' 30\" N, 5° 20' 30\" E", // Degrees minutes seconds - should parse
  "invalid",                      // Invalid - should not parse
  "60.7917,5.3417"               // No spaces - should parse
];

testCases.forEach((input, index) => {
  console.log(`Test ${index + 1}: "${input}"`);
  
  // Test if it looks like coordinates
  const looksLike = looksLikeCoordinates(input);
  console.log(`  Looks like coordinates: ${looksLike}`);
  
  if (looksLike) {
    // Test parsing
    const parseResult = parseCoordinates(input);
    console.log(`  Parse result:`, parseResult);
    
    if (parseResult.isValid) {
      console.log(`  ✅ SUCCESS: ${parseResult.format} -> [${parseResult.coordinates[0]}, ${parseResult.coordinates[1]}]`);
    } else {
      console.log(`  ❌ FAILED: ${parseResult.error}`);
    }
  } else {
    console.log(`  ➡️  SKIP: Will search for platform named "${input}"`);
  }
  
  console.log("");
});

console.log("=== TEST COMPLETED ===");
