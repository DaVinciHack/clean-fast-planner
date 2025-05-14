# Fast Planner V3 File Cleanup Plan

## Current Application Structure

The Fast Planner V3 application is currently using a React application structure with Vite as the build tool. The main application entry points are:

- `src/main.tsx` - Main entry point that renders the App component
- `src/App.tsx` - Root component that wraps the application with AuthProvider
- `src/pages/FastPlannerPage.jsx` - Main page component that renders FastPlannerApp

## Unused Files and Directories to Remove

### 1. Old HTML/CSS/JS Implementation
The `public/fast-planner/` directory contains an older HTML-based implementation that is no longer being used:

- `public/fast-planner/index.html` - Old HTML implementation
- `public/fast-planner/js/` - Old JavaScript files
- `public/fast-planner/css/` - Old CSS files
- `public/fast-planner/auth/` - Old authentication files

These files are not referenced by the current React application and can be safely removed.

### 2. Test and Debug Files
- `public/test.html` - Test HTML file
- `public/fast-planner/debug.html` - Debug HTML file
- `public/fast-planner/changes-verification.txt` - Verification file

### 3. Old Component Implementations
Previously moved to `src/_old_components/`:
- `src/_old_components/ModularFastPlannerComponent.jsx`
- `src/_old_components/FastPlannerWithContexts.jsx`
- `src/_old_components/FastPlannerWithRegionContext.jsx`
- `src/_old_components/FastPlannerTestApp.jsx`
- `src/_old_components/ModularFastPlannerComponent-add.jsx`

## Files to Keep

### 1. Main Application Files
- `public/index.html` - Main HTML entry point
- `src/main.tsx` - Main React entry point
- `src/App.tsx` - Root application component
- `src/pages/FastPlannerPage.jsx` - Main page component

### 2. Core Components
- `src/components/fast-planner/FastPlannerApp.jsx` - Main implementation
- All supporting components in `src/components/fast-planner/components/`
- All context providers in `src/components/fast-planner/context/`
- All modules in `src/components/fast-planner/modules/`

### 3. Assets
- `public/palantir.svg` - Palantir logo
- `public/react.svg` - React logo
- Asset files used by the React application

### 4. Authentication
- `public/auth/` - Authentication callback handling

## Cleanup Steps

1. Create a backup of all files to be removed
2. Remove the `public/fast-planner/` directory
3. Remove test and debug HTML files
4. Update the main index.html to ensure all necessary scripts and styles are included
5. Verify the application still works correctly after removal

## Hardcoded Values to Fix

1. Already fixed the OAuth redirect URL in `src/client.ts`
2. Check for any remaining hardcoded URLs in the application code

## Post-Cleanup Verification

1. Run the application after cleanup
2. Verify all features still work correctly:
   - Authentication
   - Map display
   - Route creation
   - Wind input
   - Aircraft selection
