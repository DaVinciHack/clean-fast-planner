/**
 * FavoriteLocationsManager.js
 * 
 * Manages a list of user-defined favorite locations (e.g., common airports, bases).
 * Supports categorization by region.
 */

class FavoriteLocationsManager {
  constructor() {
    // Structure to store favorite locations, keyed by region ID
    // Example: { 'gulf-of-mexico': [{ id: 'khou', name: 'Houston Hobby', coords: [-95.2789, 29.6451] }] }
    this.favoriteLocations = {};
    this.callbacks = {
      onChange: null, // Callback when the list of favorites changes
    };

    // Load from localStorage if available
    this.loadFromLocalStorage();

    // If no data was loaded, use default static data
    if (Object.keys(this.favoriteLocations).length === 0) {
      this.loadStaticData();
    }
  }

  /**
   * Set a callback function.
   * @param {string} type - The callback type (e.g., 'onChange').
   * @param {Function} callback - The callback function.
   */
  setCallback(type, callback) {
    if (this.callbacks.hasOwnProperty(type)) {
      this.callbacks[type] = callback;
    }
  }

  /**
   * Trigger a callback if it exists.
   * @param {string} type - The callback type.
   * @param {*} data - The data to pass to the callback.
   */
  triggerCallback(type, data) {
    if (this.callbacks[type]) {
      this.callbacks[type](data);
    }
  }

  /**
   * Load favorites from localStorage
   */
  loadFromLocalStorage() {
    try {
      const savedFavorites = localStorage.getItem('fastPlannerFavorites');
      if (savedFavorites) {
        this.favoriteLocations = JSON.parse(savedFavorites);
        console.log('Loaded favorites from localStorage:', this.favoriteLocations);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      // Fall back to static data
      this.loadStaticData();
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveToLocalStorage() {
    try {
      localStorage.setItem('fastPlannerFavorites', JSON.stringify(this.favoriteLocations));
      console.log('Saved favorites to localStorage');
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }

  /**
   * Load initial static favorite locations data.
   * In a real application, this would load from user preferences/storage.
   */
  loadStaticData() {
    console.log('Loading static favorites data');
    this.favoriteLocations = {
      'gulf-of-mexico': [
        { id: 'khou', name: 'Houston Hobby', coords: [-95.2789, 29.6451] },
        { id: 'kmsy', name: 'New Orleans Intl', coords: [-90.2594, 29.9934] },
        { id: 'kgls', name: 'Galveston', coords: [-94.8604, 29.2653] },
        { id: 'kefd', name: 'Ellington Field', coords: [-95.1587, 29.6073] },
      ],
      'norway': [
        { id: 'enro', name: 'Florø Airport', coords: [5.0256, 61.5833] },
        { id: 'enbr', name: 'Bergen Airport', coords: [5.3214, 60.2933] },
        { id: 'engo', name: 'Flesland Heliport', coords: [5.3400, 60.2850] }, // Example base
      ],
      'united-kingdom': [
        { id: 'egpd', name: 'Aberdeen Airport', coords: [-2.1978, 57.2047] },
        { id: 'egjj', name: 'Jersey Airport', coords: [-2.1978, 49.2078] },
      ],
       'west-africa': [
        { id: 'dnmm', name: 'Murtala Muhammed Intl', coords: [3.3222, 6.5775] },
      ],
       'brazil': [
        { id: 'sbrj', name: 'Santos Dumont Airport', coords: [-43.1656, -22.9100] },
      ],
       'australia': [
        { id: 'ypph', name: 'Perth Airport', coords: [115.9669, -31.9361] },
      ],
    };
    // Save static data to localStorage
    this.saveToLocalStorage();
  }

  /**
   * Get favorite locations for a specific region.
   * @param {string} regionId - The ID of the region.
   * @returns {Array} - Array of favorite location objects for the region.
   */
  getFavoriteLocationsByRegion(regionId) {
    return this.favoriteLocations[regionId] || [];
  }

  /**
   * Add a favorite location to a region.
   * @param {string} regionId - The ID of the region.
   * @param {Object} location - The location object { id, name, coords }.
   */
  addFavoriteLocation(regionId, location) {
    console.log(`Adding favorite location to region ${regionId}:`, location);
    
    // Make sure region exists in our data structure
    if (!this.favoriteLocations[regionId]) {
      this.favoriteLocations[regionId] = [];
    }

    // Ensure location has a unique ID (or generate one)
    if (!location.id) {
        // Generate a more unique ID by including a timestamp
        const timestamp = new Date().getTime();
        location.id = `${location.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}`; // Better ID generation
        console.log(`Generated ID for location: ${location.id}`);
    }

    // Check for duplicates (both by ID and by similar name+coordinates)
    const isDuplicate = this.favoriteLocations[regionId].some(fav => 
      fav.id === location.id || 
      (fav.name === location.name && 
       Math.abs(fav.coords[0] - location.coords[0]) < 0.001 && 
       Math.abs(fav.coords[1] - location.coords[1]) < 0.001)
    );

    if (!isDuplicate) {
      this.favoriteLocations[regionId].push(location);
      console.log(`Added favorite location "${location.name}" to region "${regionId}"`);
      
      // Save to localStorage after adding
      this.saveToLocalStorage();
      
      // IMPORTANT: Pass specific data for the current region to callback
      if (this.callbacks.onChange) {
        console.log(`Triggering onChange callback for region ${regionId} with ${this.favoriteLocations[regionId].length} favorites`);
        this.callbacks.onChange({
          region: regionId,
          favorites: this.favoriteLocations[regionId]
        });
      } else {
        console.log('No onChange callback registered');
      }
    } else {
      console.log(`Favorite location "${location.name}" already exists in region "${regionId}"`);
    }
  }

  /**
   * Remove a favorite location from a region by ID.
   * @param {string} regionId - The ID of the region.
   * @param {string} locationId - The ID of the location to remove.
   */
  removeFavoriteLocation(regionId, locationId) {
    console.log(`Removing favorite location from region ${regionId} with ID: ${locationId}`);
    
    if (this.favoriteLocations[regionId]) {
      const initialLength = this.favoriteLocations[regionId].length;
      this.favoriteLocations[regionId] = this.favoriteLocations[regionId].filter(
        (location) => location.id !== locationId
      );
      
      if (this.favoriteLocations[regionId].length < initialLength) {
        console.log(`Removed favorite location with ID "${locationId}" from region "${regionId}"`);
        
        // Save to localStorage after removing
        this.saveToLocalStorage();
        
        // IMPORTANT: Pass specific data for the current region to callback
        if (this.callbacks.onChange) {
          console.log(`Triggering onChange callback for region ${regionId} with ${this.favoriteLocations[regionId].length} favorites after removal`);
          this.callbacks.onChange({
            region: regionId,
            favorites: this.favoriteLocations[regionId]
          });
        } else {
          console.log('No onChange callback registered');
        }
      } else {
        console.log(`Favorite location with ID "${locationId}" not found in region "${regionId}"`);
        console.log(`Available IDs:`, this.favoriteLocations[regionId].map(loc => loc.id));
      }
    } else {
      console.log(`Region "${regionId}" not found in favorites`);
    }
  }

  // Future enhancement: Methods for user-specific favorites, persistence (localStorage, API), etc.
}

export default FavoriteLocationsManager;
