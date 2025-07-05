# FastPlanner Weather Proxy for Anvil

A Python-based weather API proxy server built specifically for Anvil that enables FastPlanner's weather features to work in production by handling CORS issues with government weather APIs.

## 🚀 Quick Setup in Anvil

### Step 1: Create New Anvil App
1. Go to [anvil.works](https://anvil.works)
2. Click "Create New App"
3. Choose "Blank App" 
4. Name it something like "FastPlanner-Weather-Proxy"

### Step 2: Upload Code
1. **Server Code**: Copy `main.py` content to your app's Server Code
2. **Client Code**: Copy `client_code.py` content to your app's Client Code
3. **Dependencies**: In Anvil, go to Settings > Dependencies and add:
   - `requests`
   - `anvil-uplink`

### Step 3: Enable HTTP Endpoints
1. In Anvil, go to Settings
2. Enable "HTTP Endpoints"
3. Make sure your app is published

### Step 4: Test Your Proxy
1. Update `test_proxy.py` with your Anvil app URL
2. Run: `python test_proxy.py`
3. All endpoints should return ✅

## 🌐 API Endpoints

Once deployed, your Anvil app provides these endpoints:

- **Health Check**: `https://your-app.anvil.app/health`
- **NOAA Weather**: `https://your-app.anvil.app/api/noaa/*`
- **Aviation Weather**: `https://your-app.anvil.app/api/awc/*`
- **Marine Buoys**: `https://your-app.anvil.app/api/buoy/*`
- **Lightning Detection**: `https://your-app.anvil.app/api/lightning/*`
- **Proxy Stats**: `https://your-app.anvil.app/stats`

## ⚡ Lightning Integration

This proxy includes your existing lightning detection capabilities:
- Lightning WMS layers from NOAA
- Real-time lightning strike data
- Compatible with your existing lightning overlay code

## 🔧 Integration with FastPlanner

### Update FastPlanner Configuration
In your FastPlanner app, update the weather service URLs:

```javascript
// Replace localhost URLs with your Anvil app URL
const WEATHER_PROXY_URL = 'https://your-app.anvil.app';

// Update API calls
const noaaUrl = `${WEATHER_PROXY_URL}/api/noaa/geoserver/...`;
const awcUrl = `${WEATHER_PROXY_URL}/api/awc/api/data/metar...`;
const buoyUrl = `${WEATHER_PROXY_URL}/api/buoy/data/realtime2/...`;
const lightningUrl = `${WEATHER_PROXY_URL}/api/lightning/ows...`;
```

### Example API Usage
```javascript
// Health check
fetch('https://your-app.anvil.app/health')
  .then(response => response.json())
  .then(data => console.log('Proxy status:', data.status));

// Get METAR data
fetch('https://your-app.anvil.app/api/awc/api/data/metar?ids=KHOU&format=json')
  .then(response => response.json())
  .then(data => console.log('Weather data:', data));

// Get lightning data
fetch('https://your-app.anvil.app/api/lightning/ows?service=WMS&request=GetCapabilities')
  .then(response => response.text())
  .then(data => console.log('Lightning capabilities:', data));
```

## 🛡️ Security Features

- **Rate Limiting**: 1000 requests per IP per 15 minutes
- **CORS Headers**: Proper cross-origin support
- **Error Handling**: Graceful fallbacks for API failures
- **Request Logging**: Track usage and errors

## 🧪 Testing

### Local Testing
```bash
# Install dependencies
pip install -r requirements.txt

# Run test suite
python test_proxy.py
```

### Production Testing
1. Update `ANVIL_APP_URL` in `test_proxy.py`
2. Run tests against your live Anvil app
3. Verify all endpoints return 200 status

## 📊 Monitoring

### Check Proxy Statistics
```bash
curl https://your-app.anvil.app/stats
```

Returns:
```json
{
  "active_clients": 5,
  "total_requests": 1250,
  "cache_size": 5,
  "rate_limit_window": 900,
  "rate_limit_max": 1000,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Monitor Anvil Logs
1. Go to your Anvil app dashboard
2. Click "Logs" to see server activity
3. Watch for proxy requests and errors

## 🌤️ Weather Services Supported

### NOAA Weather Services
- **Satellite imagery**: Real-time weather visualization
- **Radar data**: Precipitation and storm tracking
- **Marine weather**: Offshore conditions

### Aviation Weather Center
- **METAR data**: Current airport conditions
- **TAF data**: Terminal forecasts
- **Aviation alerts**: Weather warnings

### Marine Buoy Data
- **Real-time conditions**: Wave height, wind, temperature
- **Historical data**: Weather trends
- **Gulf of Mexico coverage**: Offshore helicopter operations

### Lightning Detection
- **Real-time strikes**: Current lightning activity
- **Historical data**: Lightning patterns
- **WMS layers**: Map visualization

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors in Browser**
   - Make sure HTTP endpoints are enabled in Anvil
   - Check that your app is published

2. **Rate Limiting**
   - Monitor the `/stats` endpoint
   - Increase limits in `main.py` if needed

3. **API Timeouts**
   - Government APIs can be slow
   - Consider increasing timeout values

4. **Anvil App Not Responding**
   - Check Anvil app logs for server errors
   - Verify dependencies are installed

### Debug Steps
1. Test health endpoint first: `/health`
2. Check Anvil logs for error messages
3. Verify external API availability
4. Test with simple curl commands

## 🔄 Updates

To update your weather proxy:
1. Update code in Anvil editor
2. Publish your app
3. Test endpoints work correctly

## 📈 Performance

- **Lightweight**: Pure Python, minimal dependencies
- **Scalable**: Anvil handles scaling automatically
- **Reliable**: Built-in error handling and retries
- **Fast**: Direct API proxying with caching

## 🎯 Benefits Over Node.js Version

- ✅ **Native Anvil Integration**: Works perfectly with your existing setup
- ✅ **Lightning Integration**: Includes your existing lightning overlays
- ✅ **Zero Server Management**: Anvil handles hosting automatically
- ✅ **Familiar Technology**: Python instead of Node.js
- ✅ **Built-in Scaling**: Handles traffic spikes automatically

## 🔗 Next Steps

1. **Deploy to Anvil** following the setup steps
2. **Test all endpoints** with the test script
3. **Update FastPlanner** to use your proxy URL
4. **Integrate lightning overlays** with existing code
5. **Monitor usage** with stats endpoint

Your weather proxy will provide the same functionality as the Node.js version but with the familiarity and reliability of your existing Anvil setup!