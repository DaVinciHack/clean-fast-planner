import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import FastPlannerPage from './pages/FastPlannerPage';
import OSDKDebugger from './components/OSDKDebugger';
import './index.css';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  
  // Simple client-side router
  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };
    
    // Listen for changes to the URL
    window.addEventListener('popstate', handleRouteChange);
    
    // Add a little nav to the top of the page for debugging routes
    const addDebugNav = () => {
      // Create the nav element if it doesn't exist
      if (!document.getElementById('debug-nav')) {
        const nav = document.createElement('div');
        nav.id = 'debug-nav';
        nav.style.position = 'fixed';
        nav.style.top = '0';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = '#333';
        nav.style.color = 'white';
        nav.style.padding = '5px 10px';
        nav.style.display = 'flex';
        nav.style.alignItems = 'center';
        nav.style.justifyContent = 'space-between';
        nav.style.zIndex = '1000';
        
        // Get the base path from the current URL
        const basePath = '/planner';
        
        // Create links
        const homeLink = document.createElement('a');
        homeLink.href = `${basePath}/`;
        homeLink.textContent = 'Flight Planner';
        homeLink.style.color = 'white';
        homeLink.style.textDecoration = 'none';
        homeLink.style.padding = '5px 10px';
        homeLink.style.marginRight = '10px';
        
        const debugLink = document.createElement('a');
        debugLink.href = `${basePath}/debug`;
        debugLink.textContent = 'OSDK Debugger';
        debugLink.style.color = 'white';
        debugLink.style.textDecoration = 'none';
        debugLink.style.padding = '5px 10px';
        
        // Highlight the active link
        if (window.location.pathname === `${basePath}/` || window.location.pathname === basePath) {
          homeLink.style.backgroundColor = '#555';
        } else if (window.location.pathname === `${basePath}/debug`) {
          debugLink.style.backgroundColor = '#555';
        }
        
        // Add click handlers for SPA navigation
        homeLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.history.pushState(null, '', `${basePath}/`);
          setCurrentPath(`${basePath}/`);
        });
        
        debugLink.addEventListener('click', (e) => {
          e.preventDefault();
          window.history.pushState(null, '', `${basePath}/debug`);
          setCurrentPath(`${basePath}/debug`);
        });
        
        // Add links to nav
        nav.appendChild(homeLink);
        nav.appendChild(debugLink);
        
        // Add nav to body
        document.body.prepend(nav);
        
        // Add padding to body to account for fixed nav
        document.body.style.paddingTop = '40px';
      }
    };
    
    // Add the debug nav after a short delay to ensure DOM is ready
    setTimeout(addDebugNav, 100);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      
      // Clean up debug nav on unmount
      const nav = document.getElementById('debug-nav');
      if (nav) {
        document.body.removeChild(nav);
        document.body.style.paddingTop = '0';
      }
    };
  }, []);
  
  // Determine which component to render based on path
  const renderComponent = () => {
    // Handle paths with or without the /planner prefix
    const path = currentPath.replace(/^\/planner/, '');
    
    switch (path) {
      case '/debug':
        return <OSDKDebugger />;
      case '':
      case '/':
      default:
        return <FastPlannerPage />;
    }
  };
  
  return (
    <AuthProvider>
      <div className="app-container">
        {renderComponent()}
      </div>
    </AuthProvider>
  );
}

export default App;