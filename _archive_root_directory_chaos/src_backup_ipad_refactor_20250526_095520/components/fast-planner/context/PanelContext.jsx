import React, { createContext, useContext } from 'react';

/**
 * PanelContext
 * 
 * Provides a communication channel between components that need to 
 * control panel/card visibility without direct references or DOM manipulation.
 * 
 * This simplifies the interaction between SaveFlightButton and RightPanelContainer,
 * making the code more maintainable and following React best practices.
 */

// Create the context with default values that do nothing
const PanelContext = createContext({
  handleCardChange: () => {},
  activeCard: 'main'
});

// Custom hook for easy access to the context
export const usePanelContext = () => useContext(PanelContext);

// Provider component for wrapping parts of the app that need access
export const PanelProvider = ({ children, value }) => (
  <PanelContext.Provider value={value}>
    {children}
  </PanelContext.Provider>
);

export default PanelContext;
