import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client, { auth } from '../client';
import { User, Users } from '@osdk/foundry.admin';

/**
 * OSDKDebugger Component
 * 
 * A diagnostic tool that tests OSDK connectivity and helps debug connection issues.
 * This component checks each step of the OSDK initialization process and reports
 * success or failure at each step.
 */
const OSDKDebugger = () => {
  const { isAuthenticated, userDetails, userName, login } = useAuth();
  const [results, setResults] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [allTestsComplete, setAllTestsComplete] = useState(false);
  const [testSummary, setTestSummary] = useState({ success: 0, failure: 0, total: 0 });
  
  // Add a test result to our results list
  const addResult = (testName, success, message, details = null) => {
    const timestamp = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const newResult = {
      id: Date.now(),
      timestamp,
      testName,
      success,
      message,
      details
    };
    
    setResults(prev => [newResult, ...prev]);
    setTestSummary(prev => ({
      success: prev.success + (success ? 1 : 0),
      failure: prev.failure + (success ? 0 : 1),
      total: prev.total + 1
    }));
    
    // Also log to console for debugging
    if (success) {
      console.log(`%c✅ ${testName}: ${message}`, 'color: green; font-weight: bold;');
      if (details) console.log(details);
    } else {
      console.error(`%c❌ ${testName}: ${message}`, 'color: red; font-weight: bold;');
      if (details) console.error(details);
    }
    
    return success;
  };
  
  // Run all diagnostic tests
  const runAllTests = async () => {
    setResults([]);
    setTestSummary({ success: 0, failure: 0, total: 0 });
    setAllTestsComplete(false);
    
    // 1. Check if client module is imported
    setActiveTest("Module Import Check");
    await checkClientImport();
    
    // 2. Check auth client
    setActiveTest("Auth Client Check");
    await checkAuthClient();
    
    // 3. Check authentication status
    setActiveTest("Authentication Status Check");
    await checkAuthStatus();
    
    // 4. Check user details
    setActiveTest("User Details Check");
    await checkUserDetails();
    
    // 5. Test OSDK API call
    setActiveTest("OSDK API Call Test");
    await testOsdkApiCall();
    
    // Tests complete
    setActiveTest(null);
    setAllTestsComplete(true);
  };
  
  // Check if client module is imported correctly
  const checkClientImport = async () => {
    try {
      addResult("Module Import Check", 
        !!client, 
        !!client ? "OSDK client import successful" : "OSDK client import failed - client is null or undefined",
        { clientExists: !!client, authExists: !!auth }
      );
      
      // Additional test - try to re-import client
      try {
        const clientModule = await import('../client');
        addResult("Client Re-import Check", 
          !!clientModule.default, 
          "OSDK client re-import: " + (!!clientModule.default ? "success" : "failed"),
          { reImportedClient: !!clientModule.default, reImportedAuth: !!clientModule.auth }
        );
      } catch (reimportError) {
        addResult("Client Re-import Check", false, "Failed to re-import client module", reimportError);
      }
      
      // Test if clientModule structure is valid
      if (client) {
        const methods = Object.keys(client);
        addResult("Client Methods Check", 
          methods.length > 0, 
          methods.length > 0 ? `Client has ${methods.length} methods` : "Client object is empty",
          { methods }
        );
      }
    } catch (error) {
      addResult("Module Import Check", false, "Error checking client import", error);
    }
  };
  
  // Check auth client
  const checkAuthClient = async () => {
    try {
      addResult("Auth Client Check", 
        !!auth, 
        !!auth ? "Auth client is available" : "Auth client is null or undefined",
        { auth }
      );
      
      if (auth) {
        // Check if auth has required methods
        const requiredMethods = ['signIn', 'getAccessToken', 'isAuthenticated'];
        const missingMethods = requiredMethods.filter(method => typeof auth[method] !== 'function');
        
        addResult("Auth Methods Check", 
          missingMethods.length === 0, 
          missingMethods.length === 0 
            ? "Auth client has all required methods" 
            : `Auth client is missing methods: ${missingMethods.join(', ')}`,
          { 
            availableMethods: Object.keys(auth).filter(key => typeof auth[key] === 'function'),
            missingMethods
          }
        );
        
        // Check auth state
        try {
          const isAuthenticatedMethod = typeof auth.isAuthenticated === 'function';
          const authState = isAuthenticatedMethod ? auth.isAuthenticated() : false;
          
          addResult("Auth State Check", 
            isAuthenticatedMethod, 
            isAuthenticatedMethod 
              ? `Auth state from auth.isAuthenticated(): ${authState}` 
              : "Could not check auth state - isAuthenticated method not available",
            { authState }
          );
        } catch (stateError) {
          addResult("Auth State Check", false, "Error checking auth state", stateError);
        }
        
        // Check token
        try {
          const hasTokenMethod = typeof auth.getAccessToken === 'function';
          const token = hasTokenMethod ? auth.getAccessToken() : null;
          const tokenExists = !!token;
          
          addResult("Token Check", 
            hasTokenMethod, 
            hasTokenMethod 
              ? `Token exists: ${tokenExists}` 
              : "Could not check token - getAccessToken method not available",
            { 
              tokenExists,
              tokenLength: token ? token.length : 0,
              tokenSnippet: token ? `${token.substring(0, 10)}...` : 'none' 
            }
          );
          
          // If we have a token, try to decode it
          if (token) {
            try {
              const tokenParts = token.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                addResult("Token Decoding Check", 
                  true, 
                  "Successfully decoded token payload",
                  { 
                    subject: payload.sub,
                    fields: Object.keys(payload),
                    expiresAt: new Date(payload.exp * 1000).toLocaleString(),
                    issuedAt: new Date(payload.iat * 1000).toLocaleString(),
                  }
                );
              } else {
                addResult("Token Decoding Check", false, "Token is not in valid JWT format", { tokenParts });
              }
            } catch (tokenError) {
              addResult("Token Decoding Check", false, "Error decoding token", tokenError);
            }
          }
        } catch (tokenError) {
          addResult("Token Check", false, "Error checking token", tokenError);
        }
      }
    } catch (error) {
      addResult("Auth Client Check", false, "Error checking auth client", error);
    }
  };
  
  // Check authentication status from AuthContext
  const checkAuthStatus = async () => {
    try {
      addResult("Auth Context Check", 
        isAuthenticated !== undefined, 
        isAuthenticated !== undefined ? `isAuthenticated: ${isAuthenticated}` : "isAuthenticated is undefined",
        { isAuthenticated, userName }
      );
      
      // Check if the stored auth state matches the actual auth client state
      if (auth && typeof auth.isAuthenticated === 'function') {
        const clientAuthState = auth.isAuthenticated();
        const statesMatch = clientAuthState === isAuthenticated;
        
        addResult("Auth State Consistency Check", 
          statesMatch, 
          statesMatch 
            ? "Auth states are consistent" 
            : `Auth states are inconsistent - context: ${isAuthenticated}, client: ${clientAuthState}`,
          { contextState: isAuthenticated, clientState: clientAuthState }
        );
      }
    } catch (error) {
      addResult("Auth Status Check", false, "Error checking auth status", error);
    }
  };
  
  // Check user details
  const checkUserDetails = async () => {
    try {
      addResult("User Details Check", 
        !!userDetails, 
        !!userDetails ? `User details available - ${userName}` : "User details not available",
        userDetails
      );
      
      // Check localStorage backups
      try {
        const storedDetails = localStorage.getItem('userDetails');
        const parsedDetails = storedDetails ? JSON.parse(storedDetails) : null;
        
        addResult("Stored User Details Check", 
          !!parsedDetails, 
          !!parsedDetails ? "User details found in localStorage" : "No user details in localStorage",
          parsedDetails
        );
      } catch (storageError) {
        addResult("Stored User Details Check", false, "Error reading stored user details", storageError);
      }
    } catch (error) {
      addResult("User Details Check", false, "Error checking user details", error);
    }
  };
  
  // Test OSDK API call
  const testOsdkApiCall = async () => {
    try {
      if (!client) {
        return addResult("OSDK API Call Test", false, "Cannot test API call - client is null or undefined");
      }
      
      // Check if Users module is available
      const usersModuleAvailable = !!Users && typeof Users.getCurrent === 'function';
      addResult("Users Module Check", 
        usersModuleAvailable, 
        usersModuleAvailable ? "Users module is available" : "Users module is not properly imported",
        { 
          usersExists: !!Users,
          getCurrentExists: Users ? typeof Users.getCurrent === 'function' : false
        }
      );
      
      if (!usersModuleAvailable) {
        addResult("OSDK API Call Test", false, "Cannot test API call - Users module not available");
        return;
      }
      
      // Test actual API call
      try {
        const user = await Users.getCurrent(client, { preview: true });
        
        const apiCallSuccess = !!user;
        addResult("API Call Execution", 
          apiCallSuccess, 
          apiCallSuccess ? "Successfully executed Users.getCurrent API call" : "API call returned no data",
          apiCallSuccess ? { 
            id: user.id,
            username: user.username,
            name: `${user.givenName || ''} ${user.familyName || ''}`.trim() || user.username,
            fields: Object.keys(user)
          } : null
        );
      } catch (apiError) {
        addResult("API Call Execution", false, "Error executing OSDK API call", apiError);
        
        // Check for specific error types
        if (apiError instanceof TypeError && apiError.message.includes('is not a function')) {
          addResult("API Error Analysis", 
            false, 
            "This appears to be a module loading issue - OSDK modules may not be properly included in the build",
            { suggestion: "Check Vite config and make sure OSDK packages are included in optimizeDeps" }
          );
        } else if (apiError.message && apiError.message.includes('network')) {
          addResult("API Error Analysis", 
            false, 
            "This appears to be a network connectivity issue",
            { suggestion: "Check CORS settings and network connectivity" }
          );
        } else if (apiError.message && apiError.message.includes('401')) {
          addResult("API Error Analysis", 
            false, 
            "This appears to be an authentication issue (401 Unauthorized)",
            { suggestion: "Check that you are properly authenticated and have the correct scopes" }
          );
        }
      }
    } catch (error) {
      addResult("OSDK API Call Test", false, "Error setting up OSDK API call test", error);
    }
  };
  
  // Display a loading indicator for the current test
  const renderLoadingIndicator = () => {
    if (!activeTest) return null;
    
    return (
      <div className="active-test-indicator">
        <div className="spinner"></div>
        <span>Running: {activeTest}...</span>
      </div>
    );
  };
  
  // Render a summary of test results
  const renderTestSummary = () => {
    if (!allTestsComplete) return null;
    
    return (
      <div className={`test-summary ${testSummary.failure > 0 ? 'has-failures' : 'all-success'}`}>
        <h3>Test Summary</h3>
        <div>
          <span className="success">✅ {testSummary.success} passed</span>
          <span className="failure">❌ {testSummary.failure} failed</span>
          <span className="total">🔄 {testSummary.total} total</span>
        </div>
        {testSummary.failure > 0 && (
          <div className="failure-analysis">
            <h4>Diagnosis:</h4>
            <p>
              OSDK client issues detected. Please check the console for detailed error messages
              and make sure all required modules are properly included in the build.
            </p>
          </div>
        )}
      </div>
    );
  };
  
  // Run tests on mount
  useEffect(() => {
    // Wait a bit for everything to initialize
    const timer = setTimeout(() => {
      runAllTests();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="osdk-debugger">
      <div className="debugger-header">
        <h2>OSDK Connection Debugger</h2>
        <div className="auth-status">
          <span className={`status-indicator ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}></span>
          <span className="status-text">
            {isAuthenticated ? `Authenticated as ${userName}` : 'Not authenticated'}
          </span>
          {!isAuthenticated && (
            <button onClick={login} className="login-button">Login</button>
          )}
        </div>
        
        <button 
          onClick={runAllTests} 
          disabled={!!activeTest}
          className="refresh-button"
        >
          Refresh Tests
        </button>
      </div>
      
      {renderLoadingIndicator()}
      {renderTestSummary()}
      
      <div className="results-container">
        <h3>Test Results</h3>
        {results.length === 0 ? (
          <div className="no-results">Running diagnostics...</div>
        ) : (
          <div className="results-list">
            {results.map(result => (
              <div key={result.id} className={`result-item ${result.success ? 'success' : 'failure'}`}>
                <div className="result-header">
                  <span className="result-icon">{result.success ? '✅' : '❌'}</span>
                  <span className="result-timestamp">{result.timestamp}</span>
                  <span className="result-name">{result.testName}</span>
                </div>
                <div className="result-message">{result.message}</div>
                {result.details && (
                  <pre className="result-details">
                    {typeof result.details === 'object' 
                      ? JSON.stringify(result.details, null, 2)
                      : String(result.details)
                    }
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <style jsx="true">{`
        .osdk-debugger {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 1200px;
          margin: 2rem auto;
          padding: 1.5rem;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .debugger-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        
        .debugger-header h2 {
          margin: 0;
          color: #3c4043;
        }
        
        .auth-status {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .status-indicator.authenticated {
          background-color: #34a853;
        }
        
        .status-indicator.unauthenticated {
          background-color: #ea4335;
        }
        
        .status-text {
          font-weight: 600;
        }
        
        .login-button, .refresh-button {
          background-color: #1a73e8;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .login-button:hover, .refresh-button:hover {
          background-color: #1765cc;
        }
        
        .login-button:disabled, .refresh-button:disabled {
          background-color: #dadce0;
          cursor: not-allowed;
        }
        
        .active-test-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background-color: #e8f0fe;
          border-radius: 4px;
        }
        
        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid #dadce0;
          border-top: 3px solid #1a73e8;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .test-summary {
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .test-summary h3 {
          margin: 0;
        }
        
        .test-summary.has-failures {
          background-color: #fce8e6;
          border-left: 4px solid #ea4335;
        }
        
        .test-summary.all-success {
          background-color: #e6f4ea;
          border-left: 4px solid #34a853;
        }
        
        .test-summary > div {
          display: flex;
          gap: 1rem;
        }
        
        .success {
          color: #34a853;
          font-weight: 600;
        }
        
        .failure {
          color: #ea4335;
          font-weight: 600;
        }
        
        .total {
          color: #5f6368;
          font-weight: 600;
        }
        
        .failure-analysis {
          margin-top: 0.5rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .failure-analysis h4 {
          margin: 0 0 0.5rem 0;
          color: #ea4335;
        }
        
        .failure-analysis p {
          margin: 0;
          font-size: 0.9rem;
        }
        
        .results-container {
          background-color: white;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          padding: 1rem;
        }
        
        .results-container h3 {
          margin-top: 0;
          margin-bottom: 1rem;
          color: #3c4043;
        }
        
        .no-results {
          color: #5f6368;
          font-style: italic;
        }
        
        .results-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .result-item {
          padding: 1rem;
          border-radius: 4px;
          border-left: 4px solid;
        }
        
        .result-item.success {
          background-color: #f8fbf8;
          border-left-color: #34a853;
        }
        
        .result-item.failure {
          background-color: #fff8f7;
          border-left-color: #ea4335;
        }
        
        .result-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .result-icon {
          flex-shrink: 0;
        }
        
        .result-timestamp {
          font-size: 0.8rem;
          color: #5f6368;
        }
        
        .result-name {
          font-weight: 600;
          margin-left: 0.5rem;
        }
        
        .result-message {
          margin-bottom: 0.5rem;
        }
        
        .result-details {
          background-color: #f8f9fa;
          padding: 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
          overflow-x: auto;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .debugger-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          
          .auth-status {
            width: 100%;
            justify-content: space-between;
          }
          
          .refresh-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OSDKDebugger;
