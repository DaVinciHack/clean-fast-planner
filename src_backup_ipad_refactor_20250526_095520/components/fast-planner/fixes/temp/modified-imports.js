// Minor modification to FastPlannerApp.jsx imports
// Add our new fix to the import list and ensure emergency-waypoint-fix is NOT imported

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../client';
import './FastPlannerStyles.css';
import './modules/waypoints/waypoint-styles.css';
import './fixes/route-stats-card-fix.css'; // Import fixed CSS for route stats card
import './fixes/panel-interaction-fix.css'; // Import our new panel interaction fix

// Import UI components
import {
  LeftPanel,
  RightPanel,
  MapComponent,
  RouteStatsCard
} from './components';

// Import ModeHandler for backup
import ModeHandler from './modules/waypoints/ModeHandler';

// Import essential fixes - order matters!
import './fixes/clean-up-duplicate-events.js'; // Import first to clean up duplicates
import './fixes/fix-event-handlers.js'; // Import second to fix event handlers
import './fixes/immediate-stop-cards-fix.js'; 
import './fixes/fix-waypoint-functionality.js';
import './fixes/fix-waypoint-marker-size.js';
import './fixes/fix-stop-cards.js';
import './fixes/fix-comprehensive-fuel-calculator.js';
import './fixes/fix-existing-waypoints.js';
import './fixes/fix-norway-waypoints.js';
import './fixes/fix-waypoint-vs-stop-type.js';
import './fixes/waypoint-initialization-check.js'; 
import './fixes/fix-map-layers.js'; // Fix map layer errors

// IMPORTANT NEW FIX: Import our OSDK waypoints layer fix to prevent "already exists" errors
import './fixes/temp/fix-osdk-waypoints-layer.js'; 

// Remove debug UI tool import - it's causing UI clutter
// import './fixes/waypoint-stop-debug.js';

// CRITICAL: Selectively import only what we need to avoid conflicts
// import './cleanIntegration.js';
// import './modules/notifications.js';
// import './modules/debug-interface.js';
// REMOVED: No longer import emergency-waypoint-fix.js as it's causing layer conflicts
// import './fixes/emergency-reset-button.js';

// Import custom hooks
import useManagers from './hooks/useManagers';
import useWeather from './hooks/useWeather';
import useAircraft from './hooks/useAircraft';
import useWaypoints from './hooks/useWaypoints';
import useRouteCalculation from './hooks/useRouteCalculation';
import useUIControls from './hooks/useUIControls';

// [Rest of the file is unchanged]