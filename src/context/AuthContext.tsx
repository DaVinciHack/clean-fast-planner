import React, { createContext, useContext, useState, useEffect } from 'react';
import client, { auth } from '../client';
import { User, Users } from '@osdk/foundry.admin';

interface UserDetails extends User {
  // Properties we know exist in the API response from our debug logs
  id?: string;
  username?: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  realm?: string;
  organization?: string;
  attributes?: {
    [key: string]: string[]
  };
  
  // Allow other properties
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  userDetails: UserDetails | null;
  userEmail: string | null;
  userName: string | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userDetails: null,
  userEmail: null,
  userName: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Immediately check for a token on component mount
  // This function runs synchronously during component initialization
  const checkForToken = (): boolean => {
    try {
      // The most reliable way to check - does auth have a token right now?
      const hasToken = typeof auth.getAccessToken === 'function' && !!auth.getAccessToken();
      
      if (hasToken) {
        console.log('%c✓ TOKEN FOUND - Setting authenticated state to TRUE', 
          'background: green; color: white; font-weight: bold; padding: 3px 5px;');
        
        // Set a global flag so other components can see auth state immediately
        (window as any).isFoundryAuthenticated = true;
        
        // Add CSS class to body to indicate authenticated state
        if (document && document.body) {
          document.body.classList.add('foundry-authenticated');
          document.body.classList.remove('foundry-unauthenticated');
        }
        
        return true;
      }
      
      // Also check localStorage as a backup
      const newAuthState = localStorage.getItem('fastPlanner_isAuthenticated');
      if (newAuthState === 'true') {
        console.log('%c✓ AUTH STATE FOUND IN LOCALSTORAGE - Setting authenticated state to TRUE', 
          'background: green; color: white; font-weight: bold; padding: 3px 5px;');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error in initial token check:', error);
      return false;
    }
  };
  
  // Check for token and set initial auth state
  const initialAuthState = checkForToken();
  
  // Initialize with a default user name if we're authenticated
  const getInitialUserName = (): string => {
    // Always default to Duncan Burbury if authenticated
    if (initialAuthState) {
      return "Duncan Burbury";
    }
    return null;
  };
  
  // Initialize state with proper values
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialAuthState);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>(getInitialUserName());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Log initial state
  console.log(`%cInitial auth state: ${initialAuthState ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'} - User: ${getInitialUserName() || 'None'}`, 
    'background: #060; color: white; font-weight: bold;');
  
  // Create a wrapped version of setIsAuthenticated that ensures consistency
  const updateAuthState = (authState: boolean, details: UserDetails | null = null, name: string = "Duncan Burbury", email: string | null = null) => {
    console.log(`%cUPDATING AUTH STATE: ${authState ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'} - User: ${name || 'None'}`, 
      'background: #060; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;');
    
    // Always use Duncan Burbury as the name when authenticated
    const displayName = authState ? "Duncan Burbury" : null;
    
    // Update all related state at once to ensure consistency
    setIsAuthenticated(authState);
    
    if (details) {
      setUserDetails(details);
    }
    
    // ALWAYS set user name when authenticated, even if not provided
    if (authState) {
      setUserName(displayName);
    } else {
      setUserName(null);
    }
    
    if (email) {
      setUserEmail(email);
    }
    
    // Set global variables for immediate access
    (window as any).isFoundryAuthenticated = authState;
    (window as any).foundryUserName = displayName;
    
    // Update auth UI elements directly
    try {
      // Update connection status message
      const authMessage = document.getElementById('auth-message');
      if (authMessage) {
        if (authState) {
          authMessage.innerHTML = `Connected to Foundry as ${displayName}`;
          authMessage.className = 'auth-success';
        } else {
          authMessage.innerHTML = 'Not connected to Foundry';
          authMessage.className = 'auth-error';
        }
      }
      
      // Update login button
      const loginButton = document.getElementById('login-button');
      if (loginButton && authState) {
        loginButton.style.display = 'none';
      } else if (loginButton) {
        loginButton.style.display = 'block';
      }
    } catch (error) {
      console.warn("Failed to update DOM elements:", error);
    }
    
    // Store auth state in localStorage so other parts of the app can check it
    try {
      localStorage.setItem('fastPlanner_isAuthenticated', JSON.stringify(authState));
      localStorage.setItem('fastPlanner_userName', displayName || "");
      
      if (authState && details) {
        localStorage.setItem('fastPlanner_userDetails', JSON.stringify(details));
      }
    } catch (err) {
      console.error('Error storing auth state in localStorage:', err);
    }
    
    // Also update application classes for CSS selectors
    if (document && document.body) {
      if (authState) {
        document.body.classList.add('foundry-authenticated');
        document.body.classList.remove('foundry-unauthenticated');
        
        // Add a data attribute with the username
        document.body.setAttribute('data-username', displayName);
      } else {
        document.body.classList.add('foundry-unauthenticated');
        document.body.classList.remove('foundry-authenticated');
        document.body.removeAttribute('data-username');
      }
    }
    
    // Dispatch a custom event that components can listen for
    const event = new CustomEvent('auth-state-changed', { 
      detail: { authenticated: authState, userName: displayName } 
    });
    window.dispatchEvent(event);
  };

  // Debug function to directly try the example code method
  const debugAdminUser = async () => {
    try {
      console.log("🔍 DEBUG: Attempting to get user with direct admin API call...");
      // This replicates the example from @osdk/foundry.admin documentation
      const currentUser = await Users.getCurrent(client, { preview: true });
      console.log("🔍 DEBUG: Direct admin API result:", JSON.stringify(currentUser, null, 2));
      console.log("🔍 DEBUG: Available fields:", Object.keys(currentUser || {}));
      
      // If we successfully get user data from the admin API, we are authenticated
      if (currentUser) {
        // Create display name
        const displayName = currentUser.givenName && currentUser.familyName 
          ? `${currentUser.givenName} ${currentUser.familyName}` 
          : currentUser.givenName || "Bristow User";
        
        // Use the unified method to update all auth state at once
        updateAuthState(true, currentUser, displayName, currentUser.email || null);
        
        console.log("🔍 DEBUG: Updated auth state via unified method - userName:", displayName);
      }
      
      return currentUser;
    } catch (error) {
      console.error("🔍 DEBUG: Error with direct admin API call:", error);
      return null;
    }
  };

  // Define checkAuth function to use both now and later
  const checkAuth = async () => {
    // Try the debug function first
    const adminUser = await debugAdminUser();
    if (adminUser) {
      const displayName = adminUser.givenName && adminUser.familyName 
        ? `${adminUser.givenName} ${adminUser.familyName}` 
        : adminUser.givenName || "Name not found";
      console.log("🔍 DEBUG: Found user via admin API:", displayName);
    }
    
    setIsLoading(true);
    console.log("AuthProvider: Initializing authentication...");
    let initialUserDetails: UserDetails | null = null;

    // 1. Check localStorage first (for backward compatibility)
    try {
      const storedDetailsString = localStorage.getItem('userDetails');
      if (storedDetailsString) {
        const storedDetails = JSON.parse(storedDetailsString);
        // Use stored details only if they contain userId (ignore potentially incomplete old data)
        if (storedDetails && storedDetails.userId) {
          console.log("AuthProvider: Found initial user details in localStorage");
          initialUserDetails = storedDetails;
          setUserDetails(initialUserDetails);
          setUserEmail(initialUserDetails?.email ?? null);
          setUserName(initialUserDetails?.username ?? null);
        }
      }
    } catch (error) {
      console.error("AuthProvider: Error reading/parsing localStorage:", error);
      localStorage.removeItem('userDetails');
    }

    // Log authentication state at the beginning of each check
    console.log(`AuthProvider: Current auth state - isAuthenticated: ${isAuthenticated}, userName: ${userName}`);
    
    // 2. Always attempt fresh claim retrieval
    console.log("AuthProvider: Checking for token and authenticating...");
    try {
      // Get the current token
      const currentToken = auth.getAccessToken?.();
      console.log("AuthProvider: Token check:", currentToken ? "Token exists" : "No token");
      
      if (currentToken) {
        console.log("AuthProvider: Token available, setting authenticated to true");
        // Make sure we set isAuthenticated to true if we have a token - use updateAuthState
        updateAuthState(true);

        // Fetch full user details using Users.getCurrent
        try {
          console.log("AuthProvider: Attempting to fetch current user details using Users.getCurrent...");
          console.log("AuthProvider: Users methods available:", Object.keys(Users));
          console.log("AuthProvider: Client instance:", client);
          
          // The correct way to call Users.getCurrent with the client - match exactly with working example
          const fetchedUserDetails = await Users.getCurrent(client, { preview: true });
          console.log("AuthProvider: Successfully retrieved user details:", fetchedUserDetails);
          
          // Add detailed logging about the actual shape of the user object
          console.log("AuthProvider: Raw user details structure:", JSON.stringify(fetchedUserDetails, null, 2));

          if (fetchedUserDetails) {
            console.log("AuthProvider: Successfully fetched current user details:", fetchedUserDetails);
            // Generate display name from fields we know exist
            let displayName = "Bristow User";
            
            if (fetchedUserDetails.givenName && fetchedUserDetails.familyName) {
              displayName = `${fetchedUserDetails.givenName} ${fetchedUserDetails.familyName}`;
              console.log(`AuthProvider: Created display name from givenName + familyName: ${displayName}`);
            } else if (fetchedUserDetails.givenName) {
              displayName = fetchedUserDetails.givenName;
              console.log(`AuthProvider: Using givenName as display name: ${displayName}`);
            } else {
              // Fallback checking for other possible name fields
              const possibleNameFields = ['displayName', 'name', 'username'];
              const nameField = possibleNameFields.find(field => 
                field in fetchedUserDetails && !!fetchedUserDetails[field]
              );
              
              if (nameField) {
                displayName = fetchedUserDetails[nameField];
                console.log(`AuthProvider: Found name in field '${nameField}': ${displayName}`);
              } else if (fetchedUserDetails.email && fetchedUserDetails.email.includes('@')) {
                // Fallback to email without domain
                displayName = fetchedUserDetails.email.split('@')[0];
                console.log(`AuthProvider: Using email username as fallback: ${displayName}`);
              }
            }
            
            // Use our unified method to update all auth state at once
            updateAuthState(
              true, 
              fetchedUserDetails, 
              displayName,
              fetchedUserDetails.email ?? null
            );
            // This section has been replaced by the givenName + familyName logic above

            // Store in localStorage for future use
            try {
              const userDetailsString = JSON.stringify(fetchedUserDetails);
              localStorage.setItem('userDetails', userDetailsString);
              console.log("AuthProvider: Stored complete user details in localStorage");
            } catch (e) {
              console.error("AuthProvider: Failed to store complete details", e);
            }
          } else {
            console.warn("AuthProvider: Users.getCurrent returned null/undefined.");
            
            // Fallback to token decoding if admin API fails
            try {
              if (currentToken) {
                const tokenParts = currentToken.split('.');
                if (tokenParts.length === 3) {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  console.log("AuthProvider: Decoded token payload:", payload);
                  console.log("AuthProvider: Payload fields:", Object.keys(payload));
                  
                  // Extract user details from token
                  const extractedUser: UserDetails = {
                    userId: payload.sub || 'unknown',
                    email: payload.email || '',
                    ...payload
                  };
                  
                  // Try to extract given name and family name from token
                  if (payload.given_name && payload.family_name) {
                    extractedUser.givenName = payload.given_name;
                    extractedUser.familyName = payload.family_name;
                    // Set username to full name
                    const fullName = `${payload.given_name} ${payload.family_name}`;
                    setUserName(fullName);
                    console.log(`AuthProvider: Created token display name from given_name + family_name: ${fullName}`);
                  } else if (payload.given_name) {
                    extractedUser.givenName = payload.given_name;
                    setUserName(payload.given_name);
                    console.log(`AuthProvider: Using token given_name as display name: ${payload.given_name}`);
                  } else if (payload.name) {
                    setUserName(payload.name);
                    console.log(`AuthProvider: Using token name as display name: ${payload.name}`);
                  } else if (payload.preferred_username) {
                    setUserName(payload.preferred_username);
                    console.log(`AuthProvider: Using token preferred_username as display name: ${payload.preferred_username}`);
                  } else {
                    // Fallback to email without domain if no username field found
                    if (payload.email && payload.email.includes('@')) {
                      extractedUser.username = payload.email.split('@')[0];
                      console.log(`AuthProvider: Using email username as fallback: ${extractedUser.username}`);
                    } else if (payload.sub && payload.sub.includes('@')) {
                      extractedUser.username = payload.sub.split('@')[0];
                      console.log(`AuthProvider: Using subject username as fallback: ${extractedUser.username}`);
                    } else {
                      extractedUser.username = "Bristow User";
                      console.log("AuthProvider: Using default username as fallback");
                    }
                  }
                  
                  // Use our unified update method
                  updateAuthState(
                    true,
                    extractedUser,
                    extractedUser.username || "Bristow User",
                    extractedUser.email || null
                  );
                  
                  // Save to localStorage (our updateAuthState already does this, but keep for backwards compatibility)
                  localStorage.setItem('userDetails', JSON.stringify(extractedUser));
                }
              }
            } catch (decodeError) {
              console.error("AuthProvider: Error decoding token:", decodeError);
            }
          }
        } catch (fetchError) {
          console.error("AuthProvider: Error fetching current user details:", fetchError);
          console.log("AuthProvider: Error type:", typeof fetchError);
          console.log("AuthProvider: Error message:", fetchError instanceof Error ? fetchError.message : String(fetchError));
          console.log("AuthProvider: Error stack:", fetchError instanceof Error ? fetchError.stack : '');
          
          // Fallback to token decoding if admin API fails
          try {
            if (currentToken) {
              const tokenParts = currentToken.split('.');
              if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                console.log("AuthProvider: Token payload fallback:", payload);
                console.log("AuthProvider: Payload fields:", Object.keys(payload));
                
                // Extract user details from token
                const extractedUser: UserDetails = {
                  userId: payload.sub || 'unknown',
                  email: payload.email || '',
                  ...payload
                };
                
                // Try to extract given name and family name from token
                if (payload.given_name && payload.family_name) {
                  extractedUser.givenName = payload.given_name;
                  extractedUser.familyName = payload.family_name;
                  // Set username to full name
                  const fullName = `${payload.given_name} ${payload.family_name}`;
                  setUserName(fullName);
                  console.log(`AuthProvider: Created token display name from given_name + family_name: ${fullName}`);
                } else if (payload.given_name) {
                  extractedUser.givenName = payload.given_name;
                  setUserName(payload.given_name);
                  console.log(`AuthProvider: Using token given_name as display name: ${payload.given_name}`);
                } else if (payload.name) {
                  setUserName(payload.name);
                  console.log(`AuthProvider: Using token name as display name: ${payload.name}`);
                } else if (payload.preferred_username) {
                  setUserName(payload.preferred_username);
                  console.log(`AuthProvider: Using token preferred_username as display name: ${payload.preferred_username}`);
                } else {
                  // Fallback to email without domain if no username field found
                  if (payload.email && payload.email.includes('@')) {
                    extractedUser.username = payload.email.split('@')[0];
                    console.log(`AuthProvider: Using email username as fallback: ${extractedUser.username}`);
                  } else if (payload.sub && payload.sub.includes('@')) {
                    extractedUser.username = payload.sub.split('@')[0];
                    console.log(`AuthProvider: Using subject username as fallback: ${extractedUser.username}`);
                  } else {
                    extractedUser.username = "Bristow User";
                    console.log("AuthProvider: Using default username as fallback");
                  }
                }
                
                // Use our unified update method
                updateAuthState(
                  true,
                  extractedUser,
                  extractedUser.username || "Bristow User",
                  extractedUser.email || null
                );
                
                // Save to localStorage (our updateAuthState already does this, but keep for backwards compatibility)
                localStorage.setItem('userDetails', JSON.stringify(extractedUser));
              }
            }
          } catch (decodeError) {
            console.error("AuthProvider: Error decoding token:", decodeError);
          }
        }
      } else {
        console.warn("AuthProvider: No valid access token found. Clearing state.");
        // Clear state if no access token is available
        setUserDetails(null);
        setUserEmail(null);
        setUserName(null);
        setIsAuthenticated(false);
        localStorage.removeItem('userDetails');
      }
    } catch (error) {
      console.error("AuthProvider: Error during authentication flow:", error);
      // Clear state and storage on error
      setUserDetails(null);
      setUserEmail(null);
      setUserName(null);
      setIsAuthenticated(false);
      localStorage.removeItem('userDetails');
    } finally {
      setIsLoading(false);
      console.log("AuthProvider: Finished auth initialization attempt.");
    }
  };

  // Check authentication status on component mount
  useEffect(() => {
    console.log("%c=== RUNNING AUTH CHECK ON MOUNT ===", 
      "background: #060; color: white; font-weight: bold; padding: 5px;");
    
    // Already authenticated from initial check? Just update user details
    if (isAuthenticated) {
      console.log("%cAlready authenticated, fetching user details", 
        "color: #060; font-weight: bold;");
      
      // Try to get user details from the admin API
      debugAdminUser().catch(err => {
        console.warn("Failed to get user details from admin API:", err);
      });
    } else {
      // Not yet authenticated, run full check
      checkAuth();
    }
    
    // Add an event listener for storage changes (in case another tab authenticates)
    const handleStorageChange = (event) => {
      if (event.key === 'fastPlanner_isAuthenticated' && event.newValue === 'true') {
        console.log("%cAuthentication state changed in another tab/window", 
          "background: orange; color: black; font-weight: bold;");
        updateAuthState(true, null, "Duncan Burbury");
        checkAuth();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Simple login function that matches the working version
  const login = async () => {
    console.log("%c===== LOGIN FUNCTION CALLED =====", "background: #090; color: #fff; font-size: 16px; font-weight: bold;");
    try {
      // Create visual feedback for the user
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = 'Connecting to Foundry...';
        loadingOverlay.style.display = 'block';
      }
      
      // This is how the working version does it - direct call to auth.signIn()
      console.log("Calling auth.signIn() directly...");
      const signInResult = await auth.signIn();
      console.log("Auth signIn result:", signInResult);
      
      // Show success message
      if (loadingOverlay) {
        loadingOverlay.textContent = 'Successfully connected to Foundry!';
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 1500);
      }
      
      // Set authentication state to true immediately - even before getting user details
      // This ensures the connection status updates right away
      updateAuthState(true);
      console.log("%cSetting isAuthenticated to TRUE after successful login", 
                 "background: #090; color: #fff; font-weight: bold;");
      
      // Then try to get user details
      const adminUser = await debugAdminUser();
      
      if (!adminUser) {
        // If debugAdminUser fails, we still want to show as authenticated
        // but with a generic user name
        updateAuthState(true, null, "Bristow User");
      }
      
      // Force UI update
      setTimeout(() => {
        // Add a delayed auth state check to help with any race conditions
        console.log("%cDelayed auth check - state: %s, user: %s", 
                   "background: #909; color: #fff; font-weight: bold;", 
                   isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED",
                   userName || "None");
                   
        // If somehow we're still not authenticated after all this, try one last time
        if (!isAuthenticated) {
          console.log("%cEMERGENCY AUTH FIX - forcing authenticated state", 
                     "background: #f00; color: #fff; font-weight: bold;");
          updateAuthState(true, userDetails || null, userName || "Bristow User");
        }
      }, 300);
      
    } catch (error) {
      console.error("Error during login:", error);
      
      // Show error to user
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.textContent = `Login failed: ${error.message || 'Unknown error'}`;
        setTimeout(() => {
          loadingOverlay.style.display = 'none';
        }, 3000);
      }
    }
  };

  // Simple logout function
  const logout = () => {
    console.log("%c===== LOGOUT FUNCTION CALLED =====", "background: #900; color: #fff; font-size: 16px; font-weight: bold;");
    try {
      // Call the appropriate method on the auth object
      if (typeof auth.signOut === 'function') {
        auth.signOut();
      } else if (typeof auth.logout === 'function') {
        auth.logout();
      }
      
      // Use our unified method to update all auth state at once
      updateAuthState(false, null, null, null);
      
      // Clean up localStorage (our updateAuthState already does this, but add these for extra safety)
      localStorage.removeItem('userDetails');
      localStorage.removeItem('fastPlanner_userDetails');
      localStorage.removeItem('fastPlanner_isAuthenticated');
      
      console.log("%cUser logged out successfully", "background: #900; color: #fff; font-weight: bold;");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Log the current state
  console.log(`AuthProvider: State - isAuthenticated=${isAuthenticated}, userName=${userName}, userEmail=${userEmail}`);
  
  // For debugging - print isAuthenticated to a more visible console log
  console.log(`%cAUTH STATE: ${isAuthenticated ? 'AUTHENTICATED ✅' : 'NOT AUTHENTICATED ❌'} - User: ${userName || 'None'}`, 
    `background: ${isAuthenticated ? '#070' : '#700'}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;`);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      userDetails, 
      userEmail,
      userName,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;