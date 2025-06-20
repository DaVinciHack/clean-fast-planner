import { Client, createClient } from "@osdk/client";
import { $ontologyRid } from "@flight-app/sdk";
import { createPublicOauthClient } from "@osdk/oauth";

// Define scopes needed for the application
const scopes = [
  "api:ontologies-read",
  "api:ontologies-write",
  "api:mediasets-read",
  "api:mediasets-write",
  "api:admin-read", // Scope for Admin API read permission
];

// Initialize with environment variables
const url = "https://bristow.palantirfoundry.com";
const clientId = "7db2ec0841ba7cd5697f25eebde0a64e";

// Dynamically determine the redirect URL based on current hostname
const getRedirectUrl = () => {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // 🛡️ Production-safe port handling
  let port = '';
  if (window.location.port && 
      !((protocol === 'https:' && window.location.port === '443') || 
        (protocol === 'http:' && window.location.port === '80'))) {
    port = `:${window.location.port}`;
  }
  
  // 🛡️ Ensure base path is included for subdirectory deployments
  const basePath = (import.meta as any).env?.BASE_URL || '/plan/';
  const normalizedBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  
  return `${protocol}//${hostname}${port}${normalizedBasePath}/auth/callback`;
};

const redirectUrl = getRedirectUrl();
console.log(`Using OAuth redirect URL: ${redirectUrl}`);

// Create auth and client instances
export const auth = createPublicOauthClient(
  clientId,
  url,
  redirectUrl,
  true,
  undefined,
  window.location.toString(),
  scopes,
);

// Create the API client
const client = createClient(
  url,
  $ontologyRid,
  auth,
);

// Make the client available globally for modules that might expect it
if (typeof window !== 'undefined') {
  (window as any).client = client;
  console.log("OSDK client initialized and set to window.client");
}

export default client;
