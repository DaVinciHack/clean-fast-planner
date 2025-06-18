/**
 * Enhanced Location Search Module
 * 
 * Provides multi-field search functionality for locations with hierarchical search:
 * 1. locName (exact match, case-insensitive)
 * 2. locationDescription (exact match, case-insensitive)  
 * 3. LOCATION NOTES (exact match, case-insensitive)
 * 4. Fuzzy search (with user confirmation)
 * 
 * Used by PlatformManager for enhanced location finding capabilities.
 */

class EnhancedLocationSearch {
  constructor() {
    this.platforms = [];
    this.searchableFields = new Map(); // Store additional fields for fuzzy search
  }

  /**
   * Set the platforms data with enhanced searchable fields
   * @param {Array} platforms - Array of platform objects
   * @param {Array} rawOSDKData - Raw OSDK data with additional fields
   */
  setPlatforms(platforms, rawOSDKData = []) {
    this.platforms = platforms;
    this.buildSearchableFields(rawOSDKData);
  }

  /**
   * Build searchable fields map from raw OSDK data
   * @param {Array} rawOSDKData - Raw OSDK data
   */
  buildSearchableFields(rawOSDKData) {
    this.searchableFields.clear();
    
    rawOSDKData.forEach(item => {
      // Get the primary name used in platforms
      const primaryName = item.locName || item.name || item.location_name || (item.id && item.id.toString());
      
      if (primaryName) {
        this.searchableFields.set(primaryName, {
          locName: item.locName || '',
          locationDescription: item.locationDescription || '',
          locationNotes: item['LOCATION NOTES'] || item.locationNotes || '',
          locAlias: item['LOC ALIAS'] || item.locAlias || '',
          locationCd: item['LOCATION CD'] || item.locationCd || ''
        });
      }
    });
    
    console.log(`EnhancedLocationSearch: Built searchable fields for ${this.searchableFields.size} locations`);
  }

  /**
   * Find platform by name using hierarchical search
   * @param {string} searchTerm - The search term
   * @returns {Object} - Search result with platform and match info
   */
  findPlatformByName(searchTerm) {
    if (!searchTerm || !this.platforms || this.platforms.length === 0) {
      return { platform: null, matchType: 'none', matchField: null };
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    if (!normalizedSearch) {
      return { platform: null, matchType: 'none', matchField: null };
    }

    console.log(`EnhancedLocationSearch: Searching for "${normalizedSearch}"`);
    console.log(`EnhancedLocationSearch: Have ${this.platforms.length} platforms and ${this.searchableFields.size} searchable records`);

    // 1. EXACT MATCH: locName (current platform.name field)
    let platform = this.platforms.find(p => 
      p.name.toLowerCase() === normalizedSearch
    );
    
    if (platform) {
      console.log(`✅ Found exact match in locName: ${platform.name}`);
      return { platform, matchType: 'exact', matchField: 'locName' };
    }

    // 2. EXACT MATCH: locationDescription
    platform = this.findInAdditionalFields(normalizedSearch, 'locationDescription');
    if (platform) {
      console.log(`✅ Found exact match in locationDescription: ${platform.name}`);
      return { platform, matchType: 'exact', matchField: 'locationDescription' };
    }

    // 3. EXACT MATCH: LOCATION NOTES
    platform = this.findInAdditionalFields(normalizedSearch, 'locationNotes');
    if (platform) {
      console.log(`✅ Found exact match in LOCATION NOTES: ${platform.name}`);
      return { platform, matchType: 'exact', matchField: 'locationNotes' };
    }

    // 4. FUZZY SEARCH: All fields
    const fuzzyResults = this.performFuzzySearch(normalizedSearch);
    if (fuzzyResults.length > 0) {
      console.log(`🔍 Found ${fuzzyResults.length} fuzzy matches`);
      return { 
        platform: null, 
        matchType: 'fuzzy', 
        matchField: null,
        fuzzyResults: fuzzyResults 
      };
    }

    console.log(`❌ No matches found for "${searchTerm}"`);
    return { platform: null, matchType: 'none', matchField: null };
  }

  /**
   * Search in additional fields (locationDescription, locationNotes)
   * @param {string} searchTerm - Normalized search term
   * @param {string} fieldName - Field to search in
   * @returns {Object|null} - Platform object or null
   */
  findInAdditionalFields(searchTerm, fieldName) {
    for (const platform of this.platforms) {
      const searchableData = this.searchableFields.get(platform.name);
      if (searchableData && searchableData[fieldName]) {
        const fieldValue = searchableData[fieldName].toLowerCase();
        if (fieldValue === searchTerm) {
          return platform;
        }
      }
    }
    return null;
  }

  /**
   * Perform fuzzy search across all fields
   * @param {string} searchTerm - Normalized search term
   * @returns {Array} - Array of fuzzy match results
   */
  performFuzzySearch(searchTerm) {
    const fuzzyResults = [];
    const minSimilarity = 0.7; // 70% similarity threshold
    
    console.log(`🔍 Fuzzy search for "${searchTerm}" with threshold ${minSimilarity}`);

    for (const platform of this.platforms) {
      const searchableData = this.searchableFields.get(platform.name);
      
      // Search in platform name
      const nameScore = this.calculateSimilarity(searchTerm, platform.name.toLowerCase());
      if (nameScore >= minSimilarity) {
        fuzzyResults.push({
          platform,
          score: nameScore,
          matchField: 'locName',
          matchValue: platform.name
        });
        continue; // Don't check other fields if name matches
      }

      // Search in additional fields if available
      if (searchableData) {
        const fields = [
          { key: 'locationDescription', label: 'Description' },
          { key: 'locationNotes', label: 'Notes' },
          { key: 'locAlias', label: 'Alias' }
        ];

        for (const field of fields) {
          const fieldValue = searchableData[field.key];
          if (fieldValue) {
            const score = this.calculateSimilarity(searchTerm, fieldValue.toLowerCase());
            if (score >= minSimilarity) {
              fuzzyResults.push({
                platform,
                score,
                matchField: field.key,
                matchValue: fieldValue,
                matchLabel: field.label
              });
              break; // Only one match per platform
            }
          }
        }
      }
    }

    // Sort by similarity score (highest first)
    return fuzzyResults.sort((a, b) => b.score - a.score).slice(0, 5); // Top 5 results
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string  
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // Simple containment check first
    if (str2.includes(str1) || str1.includes(str2)) {
      const shorter = Math.min(str1.length, str2.length);
      const longer = Math.max(str1.length, str2.length);
      return shorter / longer;
    }

    // Levenshtein distance calculation
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Get all searchable fields for a platform (for debugging)
   * @param {string} platformName - Platform name
   * @returns {Object} - All searchable fields
   */
  getSearchableFields(platformName) {
    return this.searchableFields.get(platformName) || {};
  }
}

export default EnhancedLocationSearch;