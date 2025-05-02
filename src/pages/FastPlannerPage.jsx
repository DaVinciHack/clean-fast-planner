import React, { useState, useEffect } from 'react';
// Import all possible implementations
import ModularFastPlannerComponent from '../components/fast-planner/ModularFastPlannerComponent';
import FastPlannerWithContexts from '../components/fast-planner/FastPlannerWithContexts';
import FastPlannerWithRegionContext from '../components/fast-planner/FastPlannerWithRegionContext';
import FastPlannerApp from '../components/fast-planner/FastPlannerApp';

const FastPlannerPage = () => {
  // State to track which implementation to use
  const [implementation, setImplementation] = useState('new');

  // Parse URL parameters on initial load
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const contextParam = searchParams.get('context');
    
    if (contextParam) {
      console.log(`URL parameter context=${contextParam} detected`);
      setImplementation(contextParam);
    } else {
      // Default to the new implementation if no parameter is specified
      console.log('No context parameter, defaulting to new implementation');
      setImplementation('new');
    }
  }, []);

  // Render the selected implementation
  const renderImplementation = () => {
    switch (implementation) {
      case 'original':
        console.log('Rendering original ModularFastPlannerComponent');
        return <ModularFastPlannerComponent />;
      case 'region':
        console.log('Rendering FastPlannerWithRegionContext');
        return <FastPlannerWithRegionContext />;
      case 'all':
        console.log('Rendering FastPlannerWithContexts');
        return <FastPlannerWithContexts />;
      case 'new':
      default:
        console.log('Rendering FastPlannerApp');
        return <FastPlannerApp />;
    }
  };

  return (
    <div className="fast-planner-page">
      {renderImplementation()}
    </div>
  );
};

export default FastPlannerPage;