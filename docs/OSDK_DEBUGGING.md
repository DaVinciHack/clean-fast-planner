# OSDK Connection Debugging Guide

This document provides guidance on how to diagnose and fix issues with the OSDK (Ontology Software Development Kit) connection in the Fast Planner application.

## Recent Changes

We've added several debugging tools and enhancements to help diagnose OSDK connection issues:

1. **Enhanced client.ts file**:
   - Added detailed logging throughout the initialization process
   - Added error handling with try/catch blocks
   - Implemented better error reporting
   - Made sure exports are properly handled even if initialization fails

2. **OSDKDebugger Component**:
   - Added a dedicated UI tool to check OSDK connectivity
   - Tests various aspects of the OSDK connection
   - Accessible at http://localhost:8080/debug (after the changes)

3. **Vite Configuration Updates**:
   - Added `@osdk/foundry.admin` to the optimizeDeps section
   - Configured manual chunking to ensure OSDK packages are properly included
   - Enabled source maps for better debugging

4. **AuthContext Enhancements**:
   - Added more robust error handling
   - Added detailed logging for debugging authentication issues
   - Improved token and user information extraction

5. **Debug Scripts**:
   - Added `scripts/debug_osdk.sh` to check for common issues

## Common Issues and Solutions

### 1. OSDK Client Not Initializing

**Symptoms**:
- OSDK client is null or undefined
- Error messages like "Cannot read properties of null (reading 'getOwners')"
- Authentication works but aircraft and platform data doesn't load

**Solutions**:
- Check the console for OSDK initialization errors
- Verify that all OSDK packages are properly imported in client.ts
- Make sure the vite.config.ts includes all OSDK packages in optimizeDeps
- Check network requests in the browser to see if OSDK API calls are being made
- Verify that the ontology RID is correct

### 2. Authentication Issues

**Symptoms**:
- Authentication succeeds but user details don't load
- "Unauthorized" errors in the console
- Token exists but API calls fail

**Solutions**:
- Check if all required scopes are included in the auth client
- Verify that the redirect URL is correct
- Check for CORS issues in the network tab

### 3. Module Loading Issues

**Symptoms**:
- Errors like "Users.getCurrent is not a function"
- OSDK-related functions are undefined
- Build seems successful but functionality is missing

**Solutions**:
- Make sure all OSDK packages are properly included in the build
- Check the vite.config.ts file for proper optimizeDeps and manual chunks
- Verify that imports/exports in client.ts are correct
- Run the debug script to check package installation

## Using the OSDKDebugger

The OSDKDebugger component provides a visual interface for testing OSDK connectivity:

1. Access the debugger at http://localhost:8080/debug
2. The debugger will automatically run tests for:
   - Module imports
   - Auth client status
   - Authentication state
   - User details
   - OSDK API calls

If tests fail, the debugger will provide suggestions for fixing the issues.

## Debug Script

Run the debug script to check for common issues:

```bash
./scripts/debug_osdk.sh
```

This script checks:
- OSDK package installation
- Vite configuration
- Client and authentication code
- Build configuration
- Built files for OSDK references

## Browser Debugging

To debug OSDK issues in the browser:

1. Open the browser console (F12)
2. Look for:
   - OSDK initialization logs (with "==== OSDK CLIENT INITIALIZATION" prefix)
   - Auth state logs (with "AUTH STATE:" prefix)
   - API call errors

The enhanced client.ts file includes extensive logging to help track down issues.

## Production Build Considerations

When deploying to production:

1. Make sure the vite.config.ts file has the correct optimizeDeps and manual chunks
2. Verify that the built files include OSDK references
3. Check that source maps are included for debugging
4. Ensure CORS is properly configured in your Palantir Foundry instance
5. Test the application on the production domain to verify OSDK connectivity

## Fallback Strategy

If OSDK connectivity issues persist, the application now has a fallback strategy:

1. Authentication can still succeed (displaying user information)
2. For development/testing purposes, a fallback user is created if OSDK fails
3. Error messages are displayed to users when OSDK functionality is unavailable

## Additional Resources

- [OSDK Documentation](https://developers.palantir.com/docs/foundry/api-overview/ontology-toolkit/osdk-js/index)
- [Foundry Admin API](https://developers.palantir.com/docs/foundry/api-overview/administration/ontology-datamodel)
- [OAuth Documentation](https://developers.palantir.com/docs/foundry/api-overview/authentication)
