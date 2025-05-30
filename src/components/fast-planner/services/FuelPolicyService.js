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
    return rawPolicies.map(policy => ({
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
          type: policy.reserveFuelType || 'fixed'
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
          type: policy.extraFuelType || 'fixed'
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
          value: policy.contingencyFuelFlightLegsValue || 5,
          default: policy.contingencyFuelFlightLegsDefault || 5,
          show: policy.contingencyFuelFlightLegsShow !== false,
          type: policy.contingencyFuelFlightLegsType || 'percentage'
        },
        alternate: {
          value: policy.contingencyFuelAlternateValue || 5,
          default: policy.contingencyFuelAlternateDefault || 5,
          show: policy.contingencyFuelAlternateShow !== false,
          type: policy.contingencyFuelAlternateType || 'percentage'
        }
      },

      // Time-based settings
      deckFuelTime: policy.deckFuelTime || 15, // Minutes
      
      // System settings
      unitSystem: policy.unitSystem || 'metric',
      
      // Metadata
      updatedAt: policy.upDatedAt,
      updatedBy: policy.upDatedBy || 'Unknown'
    }));
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

    // Look for aircraft-specific policy first (by aircraft type)
    if (aircraft?.aircraftType) {
      const aircraftType = aircraft.aircraftType.toLowerCase();
      console.log(`🔍 POLICY SEARCH: Looking for policies matching aircraft type: ${aircraftType}`);
      
      const aircraftPolicy = policies.find(policy => 
        policy.name.toLowerCase().includes(aircraftType)
      );
      if (aircraftPolicy) {
        console.log(`✅ POLICY SEARCH: Found aircraft-specific policy: ${aircraftPolicy.name}`);
        return aircraftPolicy;
      }
    }

    // Look for aircraft-specific policy by registration
    if (aircraft?.registration) {
      const registration = aircraft.registration.toLowerCase();
      console.log(`🔍 POLICY SEARCH: Looking for policies matching registration: ${registration}`);
      
      const registrationPolicy = policies.find(policy => 
        policy.name.toLowerCase().includes(registration)
      );
      if (registrationPolicy) {
        console.log(`✅ POLICY SEARCH: Found registration-specific policy: ${registrationPolicy.name}`);
        return registrationPolicy;
      }
    }

    // Look for "Standard" or "Default" policy
    console.log(`🔍 POLICY SEARCH: Looking for standard/default policy`);
    const standardPolicy = policies.find(policy => 
      policy.name.toLowerCase().includes('standard') || 
      policy.name.toLowerCase().includes('default')
    );
    if (standardPolicy) {
      console.log(`✅ POLICY SEARCH: Found standard/default policy: ${standardPolicy.name}`);
      return standardPolicy;
    }

    // Return first policy as fallback
    console.log(`✅ POLICY SEARCH: Using first available policy as fallback: ${policies[0].name}`);
    return policies[0];
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