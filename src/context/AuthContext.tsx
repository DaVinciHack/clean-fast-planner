import React, { createContext, useContext, useState, useEffect } from 'react';
import client, { auth } from '../client';

interface AuthContextType {
  isAuthenticated: boolean;
  userDetails: any | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userDetails: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userDetails, setUserDetails] = useState<any | null>(null);

  // Check authentication status on component mount and when location changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Checking authentication status...");
        
        // IMPORTANT: Force-set authentication to true if we detect aircraft data is already loaded
        // This is a workaround for OSDK's token handling
        if (window.aircraftLoaded || window.platformsLoaded) {
          console.log("Data already loaded, assuming authenticated");
          setIsAuthenticated(true);
          return;
        }
        
        // Try multiple ways to check for authentication
        let token;
        
        // Method 1: Try to get access token
        try {
          token = auth.getAccessToken?.();
          console.log("Token available via getAccessToken:", !!token);
        } catch (tokenError) {
          console.log("Error getting token with getAccessToken:", tokenError);
        }
        
        // If no token yet, try another method
        if (!token && auth.getToken) {
          try {
            token = auth.getToken();
            console.log("Token available via getToken:", !!token);
          } catch (tokenError) {
            console.log("Error getting token with getToken:", tokenError);
          }
        }
        
        // Method 3: Check localStorage for potential token (some OSDK implementations store it there)
        if (!token) {
          try {
            const storedToken = localStorage.getItem('foundry-token') || 
                               localStorage.getItem('osdk-token') || 
                               localStorage.getItem('palantir-token');
            if (storedToken) {
              token = storedToken;
              console.log("Token found in localStorage");
            }
          } catch (storageError) {
            console.log("Error checking localStorage:", storageError);
          }
        }
        
        if (token) {
          console.log("Setting authentication state to true");
          setIsAuthenticated(true);
          
          // Extract basic info from token
          try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              console.log("Token payload:", payload);
              
              // Extract user information - try different possible fields
              const email = payload.email || payload.mail || payload.preferred_username || '';
              const name = payload.name || payload.given_name || payload.cn || email.split('@')[0] || 'User';
              
              setUserDetails({
                email: email,
                userName: name,
                fullName: payload.name || name,
                sub: payload.sub || payload.oid || payload.uid,
                exp: payload.exp
              });
              
              console.log("Extracted user details:", { email, name });
            }
          } catch (e) {
            console.error('Error parsing token:', e);
          }
        } else {
          console.log("No token found, setting authentication state to false");
          setIsAuthenticated(false);
          setUserDetails(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUserDetails(null);
      }
    };

    // Run auth check - also add listener for URL changes as OSDK redirects after auth
    checkAuth();
    
    // Recheck auth after potential redirect (with a slight delay)
    const handleUrlChange = () => {
      console.log("URL changed, rechecking auth status...");
      setTimeout(checkAuth, 500);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    // Also check periodically in case token is refreshed
    const authCheckInterval = setInterval(checkAuth, 10000);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(authCheckInterval);
    };
  }, []);

  // Simple login function
  const login = () => {
    console.log("Login function called");
    try {
      // Check which auth methods are available
      console.log("Available auth methods:", Object.keys(auth));
      
      // Try different potential login methods
      if (typeof auth.signIn === 'function') {
        console.log("Using auth.signIn()");
        auth.signIn();
      } else if (typeof auth.login === 'function') {
        console.log("Using auth.login()");
        auth.login();
      } else if (typeof auth.authenticate === 'function') {
        console.log("Using auth.authenticate()");
        auth.authenticate();
      } else {
        console.error("No login method found on auth object");
        // Fallback - try to redirect directly to the auth page
        window.location.href = `${auth.url}/oauth2/auth?client_id=${auth.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}`;
      }
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  // Simple logout function
  const logout = () => {
    console.log("Logout function called");
    try {
      if (typeof auth.signOut === 'function') {
        auth.signOut();
      } else if (typeof auth.logout === 'function') {
        auth.logout();
      }
      setIsAuthenticated(false);
      setUserDetails(null);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userDetails, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;