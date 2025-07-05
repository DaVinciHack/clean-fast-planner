# FastPlanner Weather Proxy Server

A lightweight Express.js proxy server that enables FastPlanner's weather features to work in production by handling CORS issues with government weather APIs.

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start the server
npm start

# Test all endpoints
npm test
```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose up -d

# View logs
docker-compose logs -f weather-proxy

# Stop the service
docker-compose down
```

## 🌐 API Endpoints

The proxy server provides the following endpoints:

- **Health Check**: `GET /health`
- **NOAA Weather**: `GET /api/noaa/*` → `https://nowcoast.noaa.gov/*`
- **Aviation Weather**: `GET /api/awc/*` → `https://aviationweather.gov/*`
- **Marine Buoys**: `GET /api/buoy/*` → `https://www.ndbc.noaa.gov/*`

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)

### CORS Origins
Update `server.js` line 25-33 to add your production domains:
```javascript
const corsOptions = {
  origin: [
    'https://your-fastplanner-domain.com',
    'https://your-palantir-domain.com'
  ]
};
```

## 📦 Deployment Options

### Option 1: Simple VPS Deployment
```bash
# On your server
git clone <your-repo>
cd weather-proxy-server
npm install
npm start

# Or with PM2 for production
npm install -g pm2
pm2 start server.js --name weather-proxy
pm2 startup
pm2 save
```

### Option 2: Docker on VPS
```bash
# Copy files to server
scp -r weather-proxy-server/ user@your-server:/opt/

# On server
cd /opt/weather-proxy-server
docker-compose up -d
```

### Option 3: Cloud Deployment (AWS/DigitalOcean)
The Docker container can be deployed to:
- AWS ECS/Fargate
- DigitalOcean App Platform
- Google Cloud Run
- Azure Container Instances

## 🔒 Security Features

- **Rate Limiting**: 1000 requests per IP per 15 minutes
- **Helmet.js**: Security headers
- **CORS Protection**: Configured for specific domains
- **Error Handling**: Graceful error responses
- **Health Checks**: Built-in health monitoring

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### Test All Endpoints
```bash
npm test
```

### Production Monitoring
The server includes:
- Request logging with Morgan
- Error tracking
- Health check endpoint for load balancers
- Graceful shutdown handling

## 🌤️ Weather API Details

### NOAA Weather Services
- **Satellite imagery**: WMS layers for weather visualization
- **Radar data**: Real-time precipitation and storms
- **Lightning detection**: Safety-critical weather alerts

### Aviation Weather Center
- **METAR data**: Current weather conditions at airports
- **TAF data**: Terminal aerodrome forecasts
- **Aviation weather reports**: Flight planning data

### Marine Buoy Data
- **Real-time conditions**: Wave height, wind speed, temperature
- **Offshore weather**: Critical for helicopter operations
- **Historical data**: Weather trends and patterns

## 🚨 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Add your domain to `corsOptions.origin` array
   - Restart the server after changes

2. **Rate Limiting**
   - Increase limits in `server.js` if needed
   - Monitor logs for rate limit hits

3. **API Timeouts**
   - Government APIs can be slow
   - Increase timeout values if needed

4. **Health Check Failures**
   - Check if port 3001 is available
   - Verify firewall settings

### Logs
```bash
# View server logs
docker-compose logs -f weather-proxy

# Or if running directly
npm start
```

## 🔄 Updates

To update the proxy server:
1. Pull latest changes
2. Restart the service
3. Test endpoints

```bash
git pull
docker-compose restart weather-proxy
npm test
```

## 📈 Performance

- **Lightweight**: ~50MB Docker image
- **Fast**: Direct proxy with minimal processing
- **Scalable**: Can handle 1000+ concurrent requests
- **Reliable**: Built-in error handling and retries

## 🎯 Next Steps

1. **Deploy the proxy server** to your production environment
2. **Update FastPlanner** to use your proxy server URL
3. **Test weather features** work correctly
4. **Monitor performance** and adjust as needed

## 📞 Support

If you encounter issues:
1. Check the logs first
2. Verify API endpoints are accessible
3. Test with the included test script
4. Check CORS configuration matches your domain