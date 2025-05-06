/**
 * Fix for ModularFastPlannerComponent.jsx
 * 
 * Issue: platformManagerRef.current is null when trying to load platforms
 * 
 * Apply this fix by replacing the following code:
 * 
 * FIND:
 * ```
 * // Don't load static data, just load from Foundry
 * platformManagerRef.current.loadPlatformsFromFoundry(client, defaultRegion.osdkRegion)
 *   .then(platforms => {
 *     console.log(`Loaded ${platforms.length} platforms for ${defaultRegion.name}`);
 *     rigsAutoloadedRef.current = true;
 *     setPlatformsLoaded(true);
 *     setPlatformsVisible(true);
 * ```
 * 
 * REPLACE WITH:
 * ```
 * // Don't load static data, just load from Foundry
 * if (platformManagerRef.current) {
 *   platformManagerRef.current.loadPlatformsFromFoundry(client, defaultRegion.osdkRegion)
 *     .then(platforms => {
 *       console.log(`Loaded ${platforms.length} platforms for ${defaultRegion.name}`);
 *       rigsAutoloadedRef.current = true;
 *       setPlatformsLoaded(true);
 *       setPlatformsVisible(true);
 *     })
 *     .catch(error => {
 *       console.error(`Error loading platforms: ${error}`);
 *     });
 * } else {
 *   console.error("Platform manager not initialized");
 * }
 * ```
 */