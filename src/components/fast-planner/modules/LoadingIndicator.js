/**
 * Loading Indicator Module
 * 
 * Creates an animated, elastic loading bar with optional status text
 * Can be used across the application for any loading operations
 */
const LoadingIndicator = (() => {
  // Keep track of all active loaders
  const activeLoaders = new Map();
  let loaderIdCounter = 0;

  // Create and inject the CSS if not already present
  const initializeStyles = () => {
    if (document.getElementById('loading-indicator-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'loading-indicator-styles';
    styleEl.textContent = `
      .fp-loading-container {
        position: relative;
        width: 100%;
        height: 3px;
        pointer-events: none;
        overflow: hidden;
      }
      
      .fp-loading-text {
        position: absolute;
        top: -15px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 11px;
        color: rgba(0, 200, 255, 0.9);
        font-weight: 300;
        text-transform: uppercase;
        letter-spacing: 1px;
        opacity: 0.9;
        text-align: center;
        max-width: 80%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .fp-loading-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: linear-gradient(to right, 
          rgba(0, 200, 255, 0) 0%, 
          rgba(0, 200, 255, 0.7) 40%, 
          rgba(0, 200, 255, 0.9) 50%, 
          rgba(0, 200, 255, 0.7) 60%, 
          rgba(0, 200, 255, 0) 100%
        );
        width: 30%;
        animation: fp-elastic-scroll 1.5s infinite cubic-bezier(0.645, 0.045, 0.355, 1);
        transform-origin: left center;
        border-radius: 2px;
      }
      
      @keyframes fp-elastic-scroll {
        0% {
          left: -30%;
          width: 30%;
        }
        35% {
          width: 33%;
        }
        50% {
          width: 30%;
        }
        75% {
          width: 27%;
        }
        100% {
          left: 100%;
          width: 30%;
        }
      }
    `;
    document.head.appendChild(styleEl);
  };

  /**
   * Shows a loading indicator in the specified container
   * @param {HTMLElement|string} container - Container element or selector where the loader should appear
   * @param {string} [loadingText] - Optional text to display with the loader
   * @param {Object} [options] - Additional options for the loader
   * @param {string} [options.position='top'] - Position of loader ('top', 'bottom', or 'middle')
   * @returns {number} Loader ID for later reference
   */
  const show = (container, loadingText = "", options = {}) => {
    initializeStyles();
    
    // Make sure we have a DOM element
    const containerEl = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    if (!containerEl) {
      console.error('LoadingIndicator: Container element not found');
      return -1;
    }
    
    // Prepare container for positioning
    if (window.getComputedStyle(containerEl).position === 'static') {
      containerEl.style.position = 'relative';
    }
    
    // Create the loading container
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'fp-loading-container';
    
    // Position the loading bar based on options
    if (options.position === 'bottom') {
      loadingContainer.style.position = 'absolute';
      loadingContainer.style.bottom = '0';
    } else if (options.position === 'middle') {
      loadingContainer.style.position = 'absolute';
      loadingContainer.style.top = '50%';
      loadingContainer.style.transform = 'translateY(-50%)';
    } else { // default to top
      loadingContainer.style.position = 'absolute';
      loadingContainer.style.top = '0';
    }

    // Create text element if text is provided
    if (loadingText) {
      const textEl = document.createElement('div');
      textEl.className = 'fp-loading-text';
      textEl.textContent = loadingText;
      loadingContainer.appendChild(textEl);
    }
    
    // Create the animated bar
    const loadingBar = document.createElement('div');
    loadingBar.className = 'fp-loading-bar';
    loadingContainer.appendChild(loadingBar);
    
    // Add to DOM
    containerEl.appendChild(loadingContainer);
    
    // Generate a unique ID for this loader
    const loaderId = loaderIdCounter++;
    
    // Store references for later removal
    activeLoaders.set(loaderId, {
      container: containerEl,
      element: loadingContainer
    });
    
    return loaderId;
  };
  
  /**
   * Updates the text of an existing loading indicator
   * @param {number} loaderId - The ID of the loader to update
   * @param {string} newText - The new text to display
   */
  const updateText = (loaderId, newText) => {
    const loader = activeLoaders.get(loaderId);
    if (!loader) return false;
    
    const textEl = loader.element.querySelector('.fp-loading-text');
    if (textEl) {
      textEl.textContent = newText;
    } else if (newText) {
      // Create text element if it doesn't exist but text is now provided
      const newTextEl = document.createElement('div');
      newTextEl.className = 'fp-loading-text';
      newTextEl.textContent = newText;
      loader.element.insertBefore(newTextEl, loader.element.firstChild);
    }
    
    return true;
  };
  
  /**
   * Hides and removes a loading indicator
   * @param {number} loaderId - The ID of the loader to hide
   */
  const hide = (loaderId) => {
    const loader = activeLoaders.get(loaderId);
    if (!loader) return false;
    
    // Remove from DOM
    if (loader.element && loader.element.parentNode) {
      loader.element.parentNode.removeChild(loader.element);
    }
    
    // Remove from tracking
    activeLoaders.delete(loaderId);
    
    return true;
  };
  
  /**
   * Hides all active loading indicators
   */
  const hideAll = () => {
    activeLoaders.forEach((loader, id) => {
      hide(id);
    });
  };
  
  // Public API
  return {
    show,
    updateText,
    hide,
    hideAll
  };
})();

// Make it available globally if not in a module environment
if (typeof window !== 'undefined') {
  window.LoadingIndicator = LoadingIndicator;
}

export default LoadingIndicator;