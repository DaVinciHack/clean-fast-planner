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
  const port = window.location.port ? `:${window.location.port}` : '';
  return `${protocol}//${hostname}${port}/auth/callback`;
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
