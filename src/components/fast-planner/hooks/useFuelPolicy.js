/**
 * useFuelPolicy - React hook for managing fuel policy state
 * Handles loading, caching, and switching between fuel policies
 */

import { useState, useEffect, useCallback } from 'react';
import fuelPolicyService from '../services/FuelPolicyService';

export function useFuelPolicy() {
  const [availablePolicies, setAvailablePolicies] = useState([]);
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentRegion, setCurrentRegion] = useState(null);

  /**
   * Load fuel policies for a specific region
   */
  const loadPoliciesForRegion = useCallback(async (region) => {
    if (!region) {
      console.log('No region specified for fuel policy loading');
      return [];
    }

    console.log(`🚀 FUEL POLICY DEBUG: loadPoliciesForRegion called with region: "${region}"`);
    console.log(`🚀 FUEL POLICY DEBUG: Current cached region: "${currentRegion}"`);

    // Check if we're already loading for this region to prevent infinite loops
    if (isLoading && currentRegion === region) {
      console.log('🔄 FUEL POLICY: Already loading for this region, skipping');
      return availablePolicies;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 FUEL POLICY: Loading fuel policies for region: ${region}`);

      // Check if we have cached policies first
      const cachedPolicies = fuelPolicyService.getCachedPoliciesForRegion(region);
      if (cachedPolicies.length > 0 && region === currentRegion) {
        console.log(`✅ FUEL POLICY: Using ${cachedPolicies.length} cached policies for region: ${region}`);
        return cachedPolicies;
      }

      // Load policies from OSDK
      console.log(`🌐 FUEL POLICY: Loading from OSDK for region: ${region}`);
      const policies = await fuelPolicyService.loadPoliciesForRegion(region);
      console.log(`📋 FUEL POLICY: Loaded ${policies.length} policies from OSDK for region: ${region}`);
      if (policies.length > 0) {
        console.log(`📋 FUEL POLICY: Policy names: ${policies.map(p => p.name).join(', ')}`);
      }
      
      // Only update state if the component is still mounted and this is still the current region request
      setAvailablePolicies(policies);
      setCurrentRegion(region);

      if (policies.length === 0) {
        console.warn(`⚠️ FUEL POLICY: No fuel policies found for region: ${region}`);
        setError(`No fuel policies available for region: ${region}`);
      } else {
        console.log(`✅ FUEL POLICY: Successfully loaded policies for region: ${region}`);
      }

      return policies;

    } catch (err) {
      console.error('Error loading fuel policies:', err);
      setError(`Failed to load fuel policies: ${err.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentRegion, isLoading, availablePolicies]); // Fixed dependencies

  /**
   * Set the active fuel policy
   */
  const selectPolicy = useCallback((policy) => {
    if (!policy) {
      console.warn('Attempted to select null/undefined policy');
      return;
    }

    console.log(`Selecting fuel policy: ${policy.name}`);
    setCurrentPolicy(policy);
    fuelPolicyService.setCurrentPolicy(policy);
  }, []);

  /**
   * Find and set default policy for an aircraft
   */
  const selectDefaultPolicyForAircraft = useCallback((aircraft) => {
    if (!currentRegion || availablePolicies.length === 0) {
      console.warn('Cannot select default policy: no region or policies loaded');
      return null;
    }

    const defaultPolicy = fuelPolicyService.findDefaultPolicyForAircraft(currentRegion, aircraft);
    if (defaultPolicy) {
      selectPolicy(defaultPolicy);
      return defaultPolicy;
    }

    console.warn('No suitable default policy found for aircraft');
    return null;
  }, [currentRegion, availablePolicies, selectPolicy]);

  /**
   * Set the active fuel policy
   */
  const selectPolicy = useCallback((policy) => {
    if (!policy) {
      console.warn('Attempted to select null/undefined policy');
      return;
    }

    console.log(`Selecting fuel policy: ${policy.name}`);
    setCurrentPolicy(policy);
    fuelPolicyService.setCurrentPolicy(policy);
  }, []);

  /**
   * Find and set default policy for an aircraft
   */
  const selectDefaultPolicyForAircraft = useCallback((aircraft) => {
    if (!currentRegion || availablePolicies.length === 0) {
      console.warn('Cannot select default policy: no region or policies loaded');
      return null;
    }

    const defaultPolicy = fuelPolicyService.findDefaultPolicyForAircraft(currentRegion, aircraft);
    if (defaultPolicy) {
      selectPolicy(defaultPolicy);
      return defaultPolicy;
    }

    console.warn('No suitable default policy found for aircraft');
    return null;
  }, [currentRegion, availablePolicies, selectPolicy]);

  /**
   * Refresh policies for current region
   */
  const refreshPolicies = useCallback(async () => {
    if (!currentRegion) {
      return;
    }

    console.log(`Refreshing policies for region: ${currentRegion}`);
    fuelPolicyService.clearCache();
    await loadPoliciesForRegion(currentRegion);
  }, [currentRegion, loadPoliciesForRegion]);

  /**
   * Get fuel settings from current policy for display/editing
   */
  const getCurrentPolicySettings = useCallback(() => {
    if (!currentPolicy) {
      return null;
    }

    return {
      // Policy info
      policyName: currentPolicy.name,
      policyDescription: currentPolicy.description,
      region: currentPolicy.region,

      // Editable settings (these can be overridden per flight)
      deckTime: currentPolicy.deckFuelTime,
      taxiFuel: currentPolicy.fuelTypes.taxiFuel.default,
      reserveFuel: currentPolicy.fuelTypes.reserveFuel.default,
      
      // Display-only settings (from policy)
      contingencyFlightLegs: currentPolicy.contingencyFuel.flightLegs.value,
      contingencyAlternate: currentPolicy.contingencyFuel.alternate.value,
      
      // Fuel type defaults (for reference)
      approachFuel: currentPolicy.fuelTypes.approachFuel.default,
      araFuel: currentPolicy.fuelTypes.araFuel.default,
      deckFuel: currentPolicy.fuelTypes.deckFuel.default,
      
      // Unit system
      unitSystem: currentPolicy.unitSystem,
      
      // Metadata
      lastUpdated: currentPolicy.updatedAt,
      updatedBy: currentPolicy.updatedBy
    };
  }, [currentPolicy]);

  /**
   * Clear all policy data (useful for region changes)
   */
  const clearPolicies = useCallback(() => {
    setAvailablePolicies([]);
    setCurrentPolicy(null);
    setCurrentRegion(null);
    setError(null);
    console.log('Cleared fuel policy state');
  }, []);

  // Separate effect to handle region changes and clear state
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      console.log('useFuelPolicy: Cleaning up on unmount');
    };
  }, []);

  return {
    // State
    availablePolicies,
    currentPolicy,
    isLoading,
    error,
    currentRegion,

    // Actions
    loadPoliciesForRegion,
    selectPolicy,
    selectDefaultPolicyForAircraft,
    clearPolicies,
    refreshPolicies,

    // Computed
    getCurrentPolicySettings,
    
    // Utilities
    hasPolicies: availablePolicies.length > 0,
    hasCurrentPolicy: !!currentPolicy
  };
}

export default useFuelPolicy;