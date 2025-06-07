/**
 * Enhanced calculateDeckFuel method for FlightFuelService.ts
 * 
 * This enhanced version prioritizes aircraft flatpitch fuel burn over policy defaults
 * while maintaining backward compatibility.
 */

private calculateDeckFuel(
    rigStops: string[],
    policy: FuelPolicyBuilder,
    policyUnit: string,
    aircraft?: Asset  // Add aircraft parameter
): { fuel: number; stops: string[] } {
    // Use both the passed rigStops and our explicit rig list
    const allRigStops = [...new Set([...rigStops, ...this.explicitRigIcaos])];
    
    let deckFuelPerStopLbs = 0;
    
    // PRIORITY 1: Use aircraft flatpitch fuel burn + policy deck time (NEW METHOD)
    if (aircraft?.flatpitchFuelBurn && policy.deckTimeMinutes) {
        const deckTimeHours = policy.deckTimeMinutes / 60;
        deckFuelPerStopLbs = deckTimeHours * aircraft.flatpitchFuelBurn;
        
        console.log("Deck fuel calculation (NEW METHOD - flatpitch + time):", {
            aircraftFlatpitchBurn: aircraft.flatpitchFuelBurn,
            deckTimeMinutes: policy.deckTimeMinutes,
            deckTimeHours: deckTimeHours,
            deckFuelPerStopLbs: deckFuelPerStopLbs
        });
    }
    // PRIORITY 2: Use aircraft flatpitch fuel burn + default time (PARTIAL NEW)
    else if (aircraft?.flatpitchFuelBurn && !policy.deckTimeMinutes) {
        // Default to 10 minutes if no policy time specified
        const defaultDeckTimeMinutes = 10;
        const deckTimeHours = defaultDeckTimeMinutes / 60;
        deckFuelPerStopLbs = deckTimeHours * aircraft.flatpitchFuelBurn;
        
        console.log("Deck fuel calculation (PARTIAL NEW - flatpitch + default time):", {
            aircraftFlatpitchBurn: aircraft.flatpitchFuelBurn,
            defaultDeckTimeMinutes: defaultDeckTimeMinutes,
            deckTimeHours: deckTimeHours,
            deckFuelPerStopLbs: deckFuelPerStopLbs
        });
    }
    // PRIORITY 3: Use policy deck fuel amount (BACKWARD COMPATIBILITY)
    else {
        deckFuelPerStopLbs = this.convertToLbs(policy.deckFuelDefault || 0, policyUnit);
        
        console.log("Deck fuel calculation (LEGACY METHOD - policy amount):", {
            policyDeckFuelDefault: policy.deckFuelDefault,
            policyUnit: policyUnit,
            deckFuelPerStopLbs: deckFuelPerStopLbs
        });
    }
    
    const totalDeckFuelLbs = deckFuelPerStopLbs * allRigStops.length;

    console.log("Deck fuel calculation summary:", {
        rigStops: allRigStops.join(', '),
        rigStopCount: allRigStops.length,
        deckFuelPerStopLbs: deckFuelPerStopLbs,
        totalDeckFuelLbs: totalDeckFuelLbs,
        method: aircraft?.flatpitchFuelBurn ? 
                (policy.deckTimeMinutes ? "flatpitch + policy time" : "flatpitch + default time") : 
                "legacy policy amount"
    });

    return {
        fuel: totalDeckFuelLbs,
        stops: allRigStops
    };
}

/**
 * You'll also need to update the call to calculateDeckFuel to pass the aircraft:
 * 
 * FIND THIS LINE (around line 336):
 * const deckFuelInfo = this.calculateDeckFuel(
 *     weatherAnalysis.rigStops,
 *     policy,
 *     policyUnit
 * );
 * 
 * CHANGE TO:
 * const deckFuelInfo = this.calculateDeckFuel(
 *     weatherAnalysis.rigStops,
 *     policy,
 *     policyUnit,
 *     aircraft  // Add aircraft parameter
 * );
 */