// src/components/fast-planner/hooks/useScreenSize.js

import { useState, useEffect } from 'react';

/**
 * Simple hook for detecting screen size
 * Returns whether the screen is considered "small" (iPad or smaller)
 */
const useScreenSize = () => {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      // iPad breakpoint - anything 1200px or less is considered small
      setIsSmallScreen(window.innerWidth <= 1200);
    };
    
    // Check on mount
    checkScreenSize();
    
    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  return { isSmallScreen };
};

export default useScreenSize;
