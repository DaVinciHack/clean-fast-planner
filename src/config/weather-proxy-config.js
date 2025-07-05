// Weather Proxy Configuration
// Switch between development (Anvil) and production (your server)

const WEATHER_PROXY_CONFIG = {
  // Development: Use Anvil proxy (has CORS issues)
  development: {
    baseUrl: 'https://pkm5jqs3bpnr43dm.anvil.app/4IAOF5KCKDXGYCF6BHL7OKO6/_/api',
    endpoints: {
      noaa: '/proxy-noaa-weather',
      aviation: '/proxy-aviation-weather', 
      buoy: '/proxy-buoy-weather',
      lightning: '/proxy-lightning-weather'
    }
  },
  
  // Production: Use PHP proxy (no CORS issues)
  production: {
    baseUrl: 'https://bristow.info/weather',  // PHP weather proxy
    endpoints: {
      noaa: '/weather-proxy.php?proxy=noaa',
      aviation: '/weather-proxy.php?proxy=awc',
      buoy: '/weather-proxy.php?proxy=buoy', 
      lightning: '/weather-proxy.php?proxy=noaa'  // Lightning also uses NOAA
    }
  }
};

// Switch between environments
const USE_PRODUCTION_PROXY = true;  // Set to true to use your server

const ACTIVE_CONFIG = USE_PRODUCTION_PROXY 
  ? WEATHER_PROXY_CONFIG.production 
  : WEATHER_PROXY_CONFIG.development;

// Export the active configuration
export const WEATHER_PROXY_BASE_URL = ACTIVE_CONFIG.baseUrl;
export const WEATHER_ENDPOINTS = ACTIVE_CONFIG.endpoints;

// Helper function to build weather URLs
export function buildWeatherUrl(service, path, params = {}) {
  const endpoint = WEATHER_ENDPOINTS[service];
  if (!endpoint) {
    throw new Error(`Unknown weather service: ${service}`);
  }
  
  let url = `${WEATHER_PROXY_BASE_URL}${endpoint}`;
  
  if (USE_PRODUCTION_PROXY) {
    // PHP proxy format: /weather-proxy.php?proxy=noaa&path=path/to/service&param=value
    url += `&path=${path}`;
  } else {
    // Anvil format: /proxy-noaa-weather?path=path/to/service&param=value
    url += `?path=${path}`;
  }
  
  // Add additional parameters
  const paramString = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
    
  if (paramString) {
    url += (url.includes('?') ? '&' : '?') + paramString;
  }
  
  return url;
}

// Example usage:
// const noaaUrl = buildWeatherUrl('noaa', 'geoserver/observations/satellite/ows', {
//   service: 'WMS',
//   request: 'GetCapabilities'
// });