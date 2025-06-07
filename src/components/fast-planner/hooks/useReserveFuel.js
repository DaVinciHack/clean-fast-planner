import { useMemo } from 'react';

/**
 * Custom hook for calculating reserve fuel amount from policy
 * Single source of truth for reserve fuel calculations
 * 
 * @param {Object} fuelPolicy - The fuel policy object
 * @param {Object} selectedAircraft - The selected aircraft object
 * @param {number} fallbackReserveFuel - Fallback value if calculation fails
 * @returns {Object} - { fuel: number, time: number, method: string }
 */
export const useReserveFuel = (fuelPolicy, selectedAircraft, fallbackReserveFuel = 0) => {
  return useMemo(() => {
    const currentPolicy = fuelPolicy?.currentPolicy;
    
    if (!currentPolicy || !selectedAircraft) {
      return {
        fuel: fallbackReserveFuel || 0,
        time: 0,
        method: 'fallback'
      };
    }

    // Check if policy has the expected structure
    if (!currentPolicy.fuelTypes || !currentPolicy.fuelTypes.reserveFuel) {
      console.warn('🔧 useReserveFuel: Policy missing fuelTypes.reserveFuel structure, using fallback');
      return {
        fuel: fallbackReserveFuel || 0,
        time: 0,
        method: 'fallback'
      };
    }

    const reserveType = currentPolicy.fuelTypes.reserveFuel.type || 'fixed';
    const policyValue = currentPolicy.fuelTypes.reserveFuel.default || 0;

    if (reserveType === 'time' && selectedAircraft.fuelBurn) {
      // Time-based: time (minutes) × fuel flow (lbs/hour) ÷ 60
      const timeMinutes = policyValue;
      const fuelFlowPerHour = selectedAircraft.fuelBurn;
      const fuelAmount = Math.round((timeMinutes * fuelFlowPerHour) / 60);
      
      console.log(`🔧 useReserveFuel: ${timeMinutes} min × ${fuelFlowPerHour} lbs/hr = ${fuelAmount} lbs`);
      
      return {
        fuel: fuelAmount,
        time: timeMinutes,
        method: 'time'
      };
    } else {
      // Fixed amount - the policy value is already in lbs
      return {
        fuel: policyValue,
        time: selectedAircraft.fuelBurn ? Math.round((policyValue * 60) / selectedAircraft.fuelBurn) : 0,
        method: 'fixed'
      };
    }
  }, [fuelPolicy?.currentPolicy, selectedAircraft?.fuelBurn, fallbackReserveFuel]);
};
