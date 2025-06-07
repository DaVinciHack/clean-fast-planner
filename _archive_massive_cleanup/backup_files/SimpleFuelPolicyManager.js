// Simple Fuel Policy Manager - no over-engineering
import client from '../../client';

export class SimpleFuelPolicyManager {
  constructor() {
    this.currentRegion = null;
    this.policies = [];
    this.selectedPolicy = null;
  }

  // Load policies for a region
  async loadPoliciesForRegion(region) {
    console.log(`Loading fuel policies for region: ${region}`);
    
    try {
      const sdk = await import('@flight-app/sdk');
      const policies = await client(sdk.FuelPolicyBuilder)
        .where(policy => policy.region.exactMatch(region))
        .fetchPage({ $pageSize: 50 });

      this.currentRegion = region;
      this.policies = policies.data || [];
      
      console.log(`Loaded ${this.policies.length} policies for ${region}`);
      
      // Auto-select first policy
      if (this.policies.length > 0) {
        this.selectPolicy(this.policies[0]);
      }
      
      return this.policies;
    } catch (error) {
      console.error('Error loading fuel policies:', error);
      return [];
    }
  }

  // Select a policy
  selectPolicy(policy) {
    this.selectedPolicy = policy;
    console.log(`Selected policy: ${policy.name}`);
  }

  // Find policy for aircraft
  findPolicyForAircraft(aircraft) {
    if (!aircraft || this.policies.length === 0) return null;

    // Look for aircraft type match
    const typeMatch = this.policies.find(p => 
      p.name.toLowerCase().includes(aircraft.aircraftType?.toLowerCase() || '')
    );
    if (typeMatch) return typeMatch;

    // Look for registration match using CLEAN registration
    const cleanReg = aircraft.rawRegistration || aircraft.assetIdentifier || aircraft.registration;
    const regMatch = this.policies.find(p =>
      p.name.toLowerCase().includes(cleanReg?.toLowerCase() || '')
    );
    if (regMatch) return regMatch;

    // Return first policy as fallback
    return this.policies[0];
  }

  // Select policy for aircraft
  selectPolicyForAircraft(aircraft) {
    const policy = this.findPolicyForAircraft(aircraft);
    if (policy) {
      this.selectPolicy(policy);
      return policy;
    }
    return null;
  }
}
