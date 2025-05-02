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
  
  // New message queue system
  let messageQueue = [];
  let isProcessingQueue = false;
  let currentMessage = null;
  let messageTimer = null;

  // Create and inject the CSS if not already present
  const initializeStyles = () => {
    if (document.getElementById('loading-indicator-styles')) return;

    const styleEl = document.createElement('style');
    styleEl.id = 'loading-indicator-styles';
    styleEl.textContent = `
      .fp-loading-container {
        position: absolute;
        width: 100%;
        height: 3px;
        pointer-events: none;
        overflow: hidden;
        background-color: transparent; /* Transparent background for the track */
        bottom: 0;
        left: 0;
        transition: opacity 0.5s ease;
      }
      
      .fp-loading-text {
        position: absolute;
        bottom: 10px;
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
          rgba(0, 180, 255, 0) 0%, 
          rgba(0, 200, 255, 0.7) 35%, 
          rgba(190, 255, 255, 1) 50%, 
          rgba(0, 200, 255, 0.7) 65%, 
          rgba(0, 180, 255, 0) 100%
        );
        width: 35%; /* Slightly longer bar */
        animation: fp-elastic-scroll 1.8s infinite cubic-bezier(0.645, 0.045, 0.355, 1);
        transform-origin: left center;
        border-radius: 1px;
      }
      
      /* When finishing, run animation to completion */
      .fp-loading-bar.finishing {
        animation: fp-complete-scroll 1s forwards cubic-bezier(0.215, 0.61, 0.355, 1);
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
      
      /* Animation for completion - always reaches the end */
      @keyframes fp-complete-scroll {
        0% {
          left: attr(data-current-position);
          width: 30%;
        }
        100% {
          left: 100%;
          width: 30%;
        }
      }
      
      .status-indicator {
        position: absolute; 
        left: 50%;
        top: 40%;
        transform: translateX(-50%);
        font-size: 10px; /* Slightly smaller */
        color: rgba(150, 150, 150, 0.95); /* Darker gray */
        text-align: center;
        overflow: hidden;
        white-space: nowrap;
        height: 14px;
        max-width: 400px;
        margin: 0 auto;
        opacity: 0;
        transition: opacity 0.3s ease;
        font-family: 'Arial Narrow', 'Franklin Gothic Medium', Arial, sans-serif;
        letter-spacing: 0.5px;
      }
      
      .status-indicator.active {
        opacity: 1;
      }
      
      /* Typewriter effect for status indicator */
      .typewriter-text {
        border-right: 2px solid rgba(150, 200, 255, 0.5);
        white-space: nowrap;
        overflow: hidden;
        animation: typing 1.8s steps(40, end), blink-caret 0.75s step-end infinite;
      }
      
      @keyframes typing {
        from { width: 0 }
        to { width: 100% }
      }
      
      @keyframes blink-caret {
        from, to { border-color: transparent }
        50% { border-color: rgba(150, 200, 255, 0.5) }
      }
    `;
    document.head.appendChild(styleEl);
  };

  /**
   * Process the next message in the queue
   */
  const processNextMessage = () => {
    if (isProcessingQueue || messageQueue.length === 0) return;
    
    // Set processing flag
    isProcessingQueue = true;
    
    // Get the next message
    currentMessage = messageQueue.shift();
    
    // Filter remaining queue to remove duplicates of current message
    for (let i = messageQueue.length - 1; i >= 0; i--) {
      if (messageQueue[i] === currentMessage) {
        messageQueue.splice(i, 1);
      }
    }
    
    // Update the status indicator with the current message
    updateStatusIndicatorInternal(currentMessage);
    
    // Calculate display time based on message length
    // Typing animation runs at 1.8s for the full text, so calculate actual time
    const textLength = currentMessage.length;
    // Assume 40 chars would take the full animation time, plus minimum display time
    const displayTime = Math.max(1800 * (textLength / 40), 800) + 1000;
    
    // Set a timer to process the next message
    messageTimer = setTimeout(() => {
      isProcessingQueue = false;
      currentMessage = null;
      
      // If queue is empty, hide the indicator after the last message
      if (messageQueue.length === 0) {
        clearStatusIndicatorInternal();
      } else {
        // Process the next message
        processNextMessage();
      }
    }, displayTime);
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
    
    // If there's an existing loading bar in the route stats card, use that instead
    // of creating a new one to avoid duplicates
    if (document.querySelector('.route-stats-card') && 
        document.querySelector('.route-stats-header') && 
        document.querySelector('.fp-loading-container')) {
      // Just update the status indicator
      if (loadingText) {
        queueMessage(loadingText);
      }
      return -1;
    }
    
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
    
    // Also update status indicator in the top card
    if (loadingText) {
      queueMessage(loadingText);
    }
    
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
    
    // Also update status indicator in the top card
    if (newText) {
      queueMessage(newText);
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
    
    // Clear status indicator after a delay if no other loaders are active
    if (activeLoaders.size === 0 && messageQueue.length === 0 && !isProcessingQueue) {
      clearStatusIndicatorInternal();
    }
    
    return true;
  };
  
  /**
   * Hides all active loading indicators
   */
  const hideAll = () => {
    activeLoaders.forEach((loader, id) => {
      hide(id);
    });
    
    // Clean up any intervals
    const loadingBars = document.querySelectorAll('.fp-loading-bar');
    loadingBars.forEach(bar => {
      const intervalId = bar.getAttribute('data-interval-id');
      if (intervalId) {
        clearInterval(parseInt(intervalId, 10));
      }
    });
    
    // Clear message queue and status indicator
    messageQueue.length = 0;
    clearTimeout(messageTimer);
    isProcessingQueue = false;
    currentMessage = null;
    clearStatusIndicatorInternal();
  };
  
  /**
   * Add a message to the queue and start processing if not already running
   * @param {string} text - The message to display
   */
  const queueMessage = (text) => {
    if (!text) return;
    
    try {
      // Don't add duplicate of current message
      if (currentMessage === text) {
        return;
      }
      
      // Don't add if already in queue - simple loop to avoid filter method
      let alreadyQueued = false;
      for (let i = 0; i < messageQueue.length; i++) {
        if (messageQueue[i] === text) {
          alreadyQueued = true;
          break;
        }
      }
      if (alreadyQueued) return;
      
      // Add message to queue (limit queue size to prevent memory issues)
      if (messageQueue.length < 10) {
        messageQueue.push(text);
      }
      
      // Start processing if not already running
      if (!isProcessingQueue) {
        processNextMessage();
      }
      
      // Show the loading bar if it's not already visible
      const loadingContainer = document.querySelector('.fp-loading-container');
      if (loadingContainer) {
        loadingContainer.style.display = 'block';
      }
    } catch (e) {
      console.error('Error in queueMessage:', e);
    }
  };
  
  /**
   * Updates the status indicator in the top card - public method
   * @param {string} text - The text to display in the status indicator
   */
  const updateStatusIndicator = (text) => {
    if (!text) return false;
    
    // Add message to queue
    queueMessage(text);
    return true;
  };
  
  /**
   * Internal implementation of updating the status indicator
   * Called by the queue processor, not directly by users
   * @param {string} text - The text to display
   */
  const updateStatusIndicatorInternal = (text) => {
    // Find the status indicator
    const statusIndicator = document.querySelector('.status-indicator');
    if (!statusIndicator) return false;
    
    // Clear any existing content first
    statusIndicator.innerHTML = '';
    
    // Create a new div with the typewriter class
    const typewriterDiv = document.createElement('div');
    typewriterDiv.className = 'typewriter-text';
    typewriterDiv.textContent = text;
    
    // Add the new typewriter element
    statusIndicator.appendChild(typewriterDiv);
    
    // Make the indicator visible
    statusIndicator.classList.add('active');
    
    // Show the loading bar
    const loadingContainer = document.querySelector('.fp-loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'block';
    }
    
    return true;
  };
  
  /**
   * Clears the status indicator in the top card - public method
   * Waits for queue to be empty and animations to complete
   */
  const clearStatusIndicator = () => {
    // If we have messages queued or are currently processing,
    // do not clear yet - it will be cleared when the queue is empty
    if (messageQueue.length > 0 || isProcessingQueue) {
      return false;
    }
    
    clearStatusIndicatorInternal();
    return true;
  };
  
  /**
   * Internal implementation of clearing the status indicator
   * Called when queue is empty and all messages are processed
   */
  const clearStatusIndicatorInternal = () => {
    // Find the status indicator
    const statusIndicator = document.querySelector('.status-indicator');
    if (!statusIndicator) return false;
    
    // Check if there's a typewriter text element
    const typewriterDiv = statusIndicator.querySelector('.typewriter-text');
    if (typewriterDiv) {
      // Get text length to estimate animation duration
      // Typing animation runs at 1.8s for the full text, so calculate actual time
      const textLength = typewriterDiv.textContent.length;
      // Assume 40 chars would take the full animation time
      const remainingTime = Math.max(1800 * (textLength / 40), 800);
      
      // Add ellipses to show completion
      const originalText = typewriterDiv.textContent;
      setTimeout(() => {
        if (typewriterDiv.parentNode) {
          typewriterDiv.textContent = originalText + "...";
        }
      }, remainingTime / 2);
      
      // Keep the text visible for the estimated remaining time plus a little extra
      setTimeout(() => {
        // Then fade out
        statusIndicator.classList.remove('active');
        
        // Make sure the loading bar completes its animation
        const loadingContainer = document.querySelector('.fp-loading-container');
        if (loadingContainer) {
          // Get the loading bar element
          const loadingBar = loadingContainer.querySelector('.fp-loading-bar');
          if (loadingBar) {
            // Add a class to make it complete its animation
            loadingBar.classList.add('finishing');
            
            // Wait for animation to complete before hiding
            setTimeout(() => {
              loadingContainer.style.opacity = '0';
              
              // Finally remove after fade out
              setTimeout(() => {
                loadingContainer.style.display = 'none';
                loadingContainer.style.opacity = '1';
                if (loadingBar) {
                  loadingBar.classList.remove('finishing');
                }
              }, 500);
            }, 1000);
          } else {
            loadingContainer.style.display = 'none';
          }
        }
        
        // Clear the content after fade animation completes
        setTimeout(() => {
          statusIndicator.innerHTML = '';
        }, 300);
      }, remainingTime + 1000); // Added extra time for the ellipses
    } else {
      // No typewriter text, just fade out
      statusIndicator.classList.remove('active');
      
      // Make sure the loading bar completes its animation
      const loadingContainer = document.querySelector('.fp-loading-container');
      if (loadingContainer) {
        // Get the loading bar element
        const loadingBar = loadingContainer.querySelector('.fp-loading-bar');
        if (loadingBar) {
          // Add a class to make it complete its animation
          loadingBar.classList.add('finishing');
          
          // Wait for animation to complete before hiding
          setTimeout(() => {
            loadingContainer.style.opacity = '0';
            
            // Finally remove after fade out
            setTimeout(() => {
              loadingContainer.style.display = 'none';
              loadingContainer.style.opacity = '1';
              if (loadingBar) {
                loadingBar.classList.remove('finishing');
              }
            }, 500);
          }, 1000);
        } else {
          loadingContainer.style.display = 'none';
        }
      }
      
      // Clear the content after fade animation completes
      setTimeout(() => {
        statusIndicator.innerHTML = '';
      }, 300);
    }
    
    return true;
  };
  
  /**
   * Initialize loading indicator in the RouteStatsCard
   * Makes sure the loading bar appears at the bottom of the card header
   * but remains hidden until needed
   */
  const initializeRouteStatsLoader = () => {
    // Find route stats card
    const statsCard = document.querySelector('.route-stats-card');
    if (!statsCard) return false;
    
    // Find the header
    const header = statsCard.querySelector('.route-stats-header');
    if (!header) return false;
    
    // Make sure header has position relative
    header.style.position = 'relative';
    
    // First, remove any existing loading containers and bars
    const existingContainers = document.querySelectorAll('.fp-loading-container');
    existingContainers.forEach(container => {
      container.remove();
    });
    
    // Create a single loading container at the bottom
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'fp-loading-container';
    loadingContainer.style.width = '100%';
    loadingContainer.style.position = 'absolute';
    loadingContainer.style.bottom = '0';
    loadingContainer.style.left = '0';
    loadingContainer.style.height = '3px';
    // Initially hidden until needed
    loadingContainer.style.display = 'none';
    
    // Create the loading bar
    const loadingBar = document.createElement('div');
    loadingBar.className = 'fp-loading-bar';
    
    // Add the data-current-position attribute for the completion animation
    loadingBar.setAttribute('data-current-position', '-30%');
    
    // Track animation progress for smooth completion
    const updatePosition = () => {
      if (!loadingBar || !loadingBar.parentNode) return;
      
      // Get computed style to determine current position
      const computedStyle = window.getComputedStyle(loadingBar);
      const leftPos = computedStyle.getPropertyValue('left');
      
      // Update the data attribute (for use when finishing animation)
      loadingBar.setAttribute('data-current-position', leftPos);
    };
    
    // Start position tracking
    const positionInterval = setInterval(updatePosition, 100);
    
    // Store interval ID for cleanup
    loadingBar.setAttribute('data-interval-id', positionInterval);
    
    loadingContainer.appendChild(loadingBar);
    
    // Add to header
    header.appendChild(loadingContainer);
    
    return true;
  };
  
  // Public API
  return {
    show,
    updateText,
    hide,
    hideAll,
    updateStatusIndicator,
    clearStatusIndicator,
    initializeRouteStatsLoader,
    // Debug API for testing
    getQueueStatus: () => ({
      length: messageQueue.length,
      currentMessage,
      isProcessing: isProcessingQueue
    })
  };
})();

// Make it available globally if not in a module environment
if (typeof window !== 'undefined') {
  window.LoadingIndicator = LoadingIndicator;
}

export default LoadingIndicator;