import React from 'react';
import FastPlannerApp from '../components/fast-planner/FastPlannerApp';

/**
 * FastPlannerPage Component
 * 
 * Main container for the Fast Planner application.
 * Simply renders the FastPlannerApp component.
 */
const FastPlannerPage = () => {
  return (
    <div className="fast-planner-page">
      <FastPlannerApp />
    </div>
  );
};

export default FastPlannerPage;