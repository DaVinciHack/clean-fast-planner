/**
 * FuelPolicyService - Handles loading and managing fuel policies from Palantir OSDK
 * Provides regional fuel policies with aircraft-specific defaults
 */

import client from '../../../client';

class FuelPolicyService {
  constructor() {
    this.policies = new Map(); // Cache loaded policies by region
    this.currentPolicy = null;
    this.isLoading = false;
  }

  /**
   * Load all fuel policies for a specific region
   * @param {string} region - The region to load policies for
   * @returns {Promise<Array>} Array of fuel policies for the region
   */
  async loadPoliciesForRegion(region) {
    if (!region) {
      console.warn('No region specified for fuel policy loading');
      return [];
    }

    try {
      this.isLoading = true;
      console.log(`Loading fuel policies for region: ${region}`);

      // Import the SDK to access FuelPolicyBuilder
      const sdk = await import('@flight-app/sdk');
      
      if (!sdk.FuelPolicyBuilder) {
        console.error('FuelPolicyBuilder not found in SDK');
        return [];
      }

      console.log(`🔍 OSDK QUERY: Looking for fuel policies with region.exactMatch("${region}")`);

      // TEMP DEBUG: Load ALL policies to see what regions exist
      console.log(`🔍 DEBUG: Loading ALL fuel policies to see available regions...`);
      const allPolicies = await client(sdk.FuelPolicyBuilder)
        .fetchPage({ $pageSize: 100 });
      
      console.log(`🔍 ALL POLICIES: Found ${allPolicies.data?.length || 0} total policies`);
      if (allPolicies.data && allPolicies.data.length > 0) {
        const uniqueRegions = [...new Set(allPolicies.data.map(p => p.region))];
        console.log(`🔍 ALL REGIONS IN OSDK: ${uniqueRegions.map(r => `"${r}"`).join(', ')}`);
        console.log(`🔍 SEARCHING FOR: "${region}"`);
      }

      // Load all fuel policies for the specified region
      const policies = await client(sdk.FuelPolicyBuilder)
        .where(policy => policy.region.exactMatch(region))
        .fetchPage({ 
          $pageSize: 50 // Reasonable limit for regional policies
        });

      console.log(`🔍 OSDK RESULT: Found ${policies.data?.length || 0} fuel policies for region "${region}"`);
      
      // DEBUG: Log the actual region values in the policies
      if (policies.data && policies.data.length > 0) {
        console.log(`🔍 OSDK REGIONS FOUND: ${policies.data.map(p => `"${p.region}"`).join(', ')}`);
        console.log(`🔍 OSDK POLICY NAMES: ${policies.data.map(p => p.name).join(', ')}`);
      }

      // Process and cache the policies
      const processedPolicies = this.processPolicies(policies.data || []);
      this.policies.set(region, processedPolicies);

      return processedPolicies;

    } catch (error) {
      console.error(`Error loading fuel policies for region ${region}:`, error);
      return [];
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Process raw policy data into a more usable format
   * @param {Array} rawPolicies - Raw policy data from OSDK
   * @returns {Array} Processed policy objects
   */
  processPolicies(rawPolicies) {
    return rawPolicies.map(policy => {
      // DEBUG: Log the raw policy structure to understand OSDK field names
      console.log('🔍 OSDK RAW POLICY STRUCTURE:', policy);
      console.log('🔍 CONTINGENCY FIELDS:');
      console.log('  - contingencyFuelFlightLegsValue:', policy.contingencyFuelFlightLegsValue);
      console.log('  - contingencyFuelFlightLegsDefault:', policy.contingencyFuelFlightLegsDefault);
      console.log('  - contingencyFuelAlternateValue:', policy.contingencyFuelAlternateValue);
      console.log('  - contingencyFuelAlternateDefault:', policy.contingencyFuelAlternateDefault);
      console.log('  - Available fields:', Object.keys(policy).filter(key => key.includes('contingency')));
      
      return {
        // Core identification
        uuid: policy.uuid,
        name: policy.name || 'Unnamed Policy',
        description: policy.description || '',
        region: policy.region || '',
      
      // Fuel types and defaults
      fuelTypes: {
        alternateFuel: {
          value: policy.alternateFuel || 0,
          default: policy.alternateFuelDefault || 0,
          show: policy.alternateFuelShow !== false
        },
        approachFuel: {
          value: policy.approachFuel || 0,
          default: policy.approachFuelDefault || 0,
          show: policy.approachFuelShow !== false
        },
        araFuel: {
          value: policy.araFuel || 0,
          default: policy.araFuelDefault || 0,
          show: policy.araFuelShow !== false
        },
        deckFuel: {
          value: policy.deckFuel || 0,
          default: policy.deckFuelDefault || 0,
          show: policy.deckFuelShow !== false
        },
        reserveFuel: {
          value: policy.reserveFuel || 0,
          default: policy.reserveFuelDefault || 0,
          show: policy.reserveFuelShow !== false,
          type: this.mapFuelType(policy.reserveFuelType) || 'fixed'
        },
        taxiFuel: {
          value: policy.taxiFuel || 0,
          default: policy.taxiFuelDefault || 0,
          show: policy.taxiFuelShow !== false
        },
        tripFuel: {
          value: policy.tripFuel || 0,
          default: policy.tripFuelDefault || 0,
          show: policy.tripFuelShow !== false
        },
        extraFuel: {
          value: policy.extraFuel || 0,
          default: policy.extraFuelDefault || 0,
          show: policy.extraFuelShow !== false,
          type: this.mapFuelType(policy.extraFuelType) || 'fixed'
        },
        timeOnTaskFuel: {
          value: policy.timeOnTaskFuel || 0,
          default: policy.timeOnTaskFuelDefault || 0,
          show: policy.timeOnTaskFuelShow !== false
        }
      },

      // Contingency fuel settings
      contingencyFuel: {
        flightLegs: {
          value: policy.contingencyFuelFlightLegsDefault ?? 0,
          default: policy.contingencyFuelFlightLegsDefault ?? 0,
          show: policy.contingencyFuelFlightLegsShow !== false,
          type: this.mapFuelType(policy.contingencyFuelFlightLegsType) || 'percentage'
        },
        alternate: {
          value: policy.contingencyFuelAlternateDefault ?? 0,
          default: policy.contingencyFuelAlternateDefault ?? 0,
          show: policy.contingencyFuelAlternateShow !== false,
          type: this.mapFuelType(policy.contingencyFuelAlternateType) || 'percentage'
        }
      },

      // Time-based settings
      deckFuelTime: policy.deckFuelTime || 15, // Minutes
      
      // System settings
      unitSystem: policy.unitSystem || 'metric',
      
      // Metadata
      updatedAt: policy.upDatedAt,
      updatedBy: policy.upDatedBy || 'Unknown'
    };
    });
  }

  /**
   * Map OSDK fuel type strings to internal type strings
   * @param {string} osdkType - The fuel type from OSDK
   * @returns {string} Internal type string ('time', 'fixed', 'percentage')
   */
  mapFuelType(osdkType) {
    if (!osdkType) return 'fixed';
    
    const type = osdkType.toLowerCase().trim();
    
    // Time-based types
    if (type.includes('time') || type.includes('minute') || type.includes('hour')) {
      console.log(`🔧 FUEL TYPE MAPPING: "${osdkType}" → "time"`);
      return 'time';
    }
    
    // Percentage-based types  
    if (type.includes('percentage') || type.includes('percent') || type.includes('%')) {
      console.log(`🔧 FUEL TYPE MAPPING: "${osdkType}" → "percentage"`);
      return 'percentage';
    }
    
    // Fixed amount types (default)
    console.log(`🔧 FUEL TYPE MAPPING: "${osdkType}" → "fixed"`);
    return 'fixed';
  }

  /**
   * Get cached policies for a region
   * @param {string} region - The region to get policies for
   * @returns {Array} Cached policies or empty array
   */
  getCachedPoliciesForRegion(region) {
    return this.policies.get(region) || [];
  }

  /**
   * Set the current active policy
   * @param {Object} policy - The policy to set as current
   */
  setCurrentPolicy(policy) {
    this.currentPolicy = policy;
    console.log(`Set current fuel policy: ${policy?.name || 'None'}`);
  }

  /**
   * Get the current active policy
   * @returns {Object|null} Current policy or null
   */
  getCurrentPolicy() {
    return this.currentPolicy;
  }

  /**
   * Find the default policy for an aircraft in a region
   * This would typically be based on aircraft type or naming convention
   * @param {string} region - The region
   * @param {Object} aircraft - The aircraft object
   * @returns {Object|null} Default policy for the aircraft or null
   */
  findDefaultPolicyForAircraft(region, aircraft) {
    const policies = this.getCachedPoliciesForRegion(region);
    
    console.log(`🔍 POLICY SEARCH: Finding default policy for aircraft in region: ${region}`);
    console.log(`🔍 POLICY SEARCH: Aircraft: ${aircraft?.registration || 'unknown'} (Type: ${aircraft?.aircraftType || 'unknown'})`);
    console.log(`🔍 POLICY SEARCH: Available policies: ${policies.map(p => p.name).join(', ')}`);
    
    if (policies.length === 0) {
      console.log(`🔍 POLICY SEARCH: No policies available for region: ${region}`);
      return null;
    }

    // ✅ FIXED LOGIC: defaultFuelPolicyId actually contains the POLICY NAME, not ID
    const policyName = aircraft?.defaultFuelPolicyName;
    const policyNameFromId = aircraft?.defaultFuelPolicyId; // This field contains the name!
    
    // Use whichever field has a value (prioritize policyName, fallback to policyNameFromId)
    const actualPolicyName = policyName || policyNameFromId;
    
    if (actualPolicyName && actualPolicyName !== 'undefined') {
      console.log(`🔍 POLICY SEARCH: Aircraft specifies policy name: "${actualPolicyName}"`);
      console.log(`🔍 POLICY SEARCH: Source field: ${policyName ? 'defaultFuelPolicyName' : 'defaultFuelPolicyId'}`);
      
      // Search by exact name match
      const specificPolicy = policies.find(policy => 
        policy.name === actualPolicyName ||
        policy.name.toLowerCase() === actualPolicyName.toLowerCase()
      );
      
      if (specificPolicy) {
        console.log(`✅ POLICY SEARCH: Found aircraft's specified policy: "${specificPolicy.name}"`);
        return specificPolicy;
      } else {
        console.log(`❌ POLICY SEARCH: Aircraft's specified policy "${actualPolicyName}" not found in region ${region}`);
        console.log(`❌ POLICY SEARCH: Available policies: ${policies.map(p => `"${p.name}"`).join(', ')}`);
      }
    } else {
      console.log(`⚠️ POLICY SEARCH: Aircraft has no valid policy name specified`);
      console.log(`⚠️ POLICY SEARCH: defaultFuelPolicyName: "${policyName}", defaultFuelPolicyId: "${policyNameFromId}"`);
    }

    // ❌ NO FALLBACKS - Aviation safety requires specific policies
    console.log(`❌ POLICY SEARCH: No specific policy found for aircraft. This is an error - no fallbacks allowed.`);
    console.log(`❌ POLICY SEARCH: Aircraft should specify defaultFuelPolicyName from OSDK`);
    return null;
  }

  /**
   * Check if policies are currently loading
   * @returns {boolean} True if loading
   */
  isLoadingPolicies() {
    return this.isLoading;
  }

  /**
   * Clear cached policies (useful for refresh)
   */
  clearCache() {
    this.policies.clear();
    this.currentPolicy = null;
    console.log('Fuel policy cache cleared');
  }

  /**
   * Get all cached regions
   * @returns {Array} Array of region names that have cached policies
   */
  getCachedRegions() {
    return Array.from(this.policies.keys());
  }
}

// Export singleton instance
const fuelPolicyService = new FuelPolicyService();
export default fuelPolicyService;