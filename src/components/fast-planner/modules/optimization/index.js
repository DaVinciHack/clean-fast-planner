/**
 * Fuel Stop Optimization Module
 * 
 * Standalone module for optimizing fuel stops to maximize passenger capacity.
 * Completely separate from existing systems - ready for integration when needed.
 * 
 * AVIATION SAFETY: No dummy data - only real platform fuel capability.
 */

export { FuelStopOptimizer } from './FuelStopOptimizer.js';
export { CorridorSearcher } from './CorridorSearcher.js';
export { PlatformEvaluator } from './PlatformEvaluator.js';
export { OptimizationScorer } from './OptimizationScorer.js';
export { FuelStopOptimizationManager } from './FuelStopOptimizationManager.js';
export { FuelStopSuggestionUI, FuelStopNotification } from './FuelStopSuggestionUI.js';

// Convenience import for the main integration point
export { default as FuelStopOptimizationManager } from './FuelStopOptimizationManager.js';

/**
 * Quick integration example:
 * 
 * import { FuelStopOptimizationManager } from './modules/optimization';
 * 
 * const optimizationManager = new FuelStopOptimizationManager();
 * 
 * // Set up callbacks
 * optimizationManager.setCallbacks({
 *   onSuggestionsReady: (suggestions) => {
 *     // Show UI with suggestions
 *   },
 *   onError: (error) => {
 *     // Show error message
 *   }
 * });
 * 
 * // Check for passenger overload and optimize
 * const result = await optimizationManager.checkAndOptimize({
 *   selectedAircraft,
 *   waypoints,
 *   stopCards,
 *   requiredPassengers: 15,
 *   availablePlatforms: [...],
 *   alternateRouteData
 * });
 */