# MapBox GL Deployment Issues & Solutions

## 🚨 Common Server Deployment Problems

### **Issue 1: CDN Dependencies**
**Problem**: MapBox GL loaded from external CDN may fail
```html
<!-- Problematic -->
<script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"></script>
```

**Solutions**:
1. **Bundle MapBox GL locally** (recommended for production)
   ```bash
   npm install mapbox-gl
   ```
   
2. **Add fallback detection** (current implementation)
   ```javascript
   if (!window.mapboxgl) {
     console.error('MapBox GL failed to load from CDN');
   }
   ```

### **Issue 2: Domain Restrictions**
**Problem**: MapBox tokens have domain restrictions
- Token works on `localhost:8080` but fails on production domain
- Error: "Unauthorized domain" or similar

**Solution**: Update MapBox token permissions
1. Go to: https://account.mapbox.com/access-tokens/
2. Edit your token
3. Add production domain to "Allowed URLs"
4. Include both `https://yourdomain.com` and `https://yourdomain.com/*`

### **Issue 3: Base Path Issues**
**Problem**: Assets don't load from subdirectory
- App deployed to `https://domain.com/plan/`
- MapBox CSS/JS fails to load due to path issues

**Current Fix**: 
```typescript
// vite.config.ts
base: '/plan/' // Matches deployment path
```

**Verification**:
```javascript
console.log('Base URL:', import.meta.env.BASE_URL);
// Should output: "/plan/"
```

### **Issue 4: WebGL Requirements**
**Problem**: MapBox GL requires WebGL support
- Some servers disable WebGL
- Old browsers don't support WebGL

**Current Fix**: Added WebGL detection
```javascript
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  console.warn('⚠️ WebGL not supported - 3D features disabled');
}
```

### **Issue 5: Environment Variables**
**Problem**: `VITE_MAPBOX_TOKEN` not set in production

**Solution**: Ensure environment variables are properly configured
```bash
# Production server
export VITE_MAPBOX_TOKEN="pk.eyJ1Ijoi..."

# Or use .env.production file
echo "VITE_MAPBOX_TOKEN=pk.eyJ1Ijoi..." > .env.production
```

## 🔧 Deployment Checklist

### **Pre-Deployment**
- [ ] Verify MapBox token works on production domain
- [ ] Test WebGL support in target browsers
- [ ] Confirm base path configuration
- [ ] Bundle MapBox GL locally (optional but recommended)

### **Server Configuration**
- [ ] Set environment variables correctly
- [ ] Ensure CDN access (if using external dependencies)
- [ ] Configure proper MIME types for assets
- [ ] Enable gzip compression for faster loading

### **Post-Deployment Verification**
- [ ] Check browser console for MapBox errors
- [ ] Verify map loads and displays correctly
- [ ] Test all map interactions (zoom, pan, markers)
- [ ] Validate on multiple devices/browsers

## 🛠️ Debugging Production Issues

### **Browser Console Checks**
```javascript
// Check MapBox availability
console.log('MapBox GL:', window.mapboxgl);
console.log('Version:', window.mapboxgl?.version);

// Check WebGL support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
console.log('WebGL supported:', !!gl);

// Check token
console.log('Token set:', !!window.mapboxgl?.accessToken);
```

### **Network Tab Analysis**
1. Check if MapBox GL JS/CSS files load (200 status)
2. Look for CORS errors on map tiles
3. Verify font/sprite requests succeed
4. Check for 401/403 errors (token issues)

### **Common Error Messages**
- **"Unauthorized"**: Domain not added to token
- **"Not Found"**: Base path configuration issue
- **"WebGL not supported"**: Browser/server WebGL disabled
- **"Script error"**: CDN blocked or failed to load

## 📋 Production-Ready Configuration

### **Recommended Vite Config**
```typescript
export default defineConfig({
  base: '/plan/', // Match your deployment path
  build: {
    rollupOptions: {
      external: [], // Don't externalize MapBox if bundling locally
      output: {
        manualChunks: {
          'mapbox': ['mapbox-gl'] // Separate chunk for MapBox
        }
      }
    }
  }
});
```

### **Environment Variables**
```bash
# .env.production
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci1hY3R1YWwtdG9rZW4i...
VITE_ENVIRONMENT=production
VITE_ENABLE_DEBUG_LOGGING=false
```

### **Index.html Optimizations**
```html
<!-- Preload critical resources -->
<link rel="preload" href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" as="style">
<link rel="preload" href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js" as="script">

<!-- Add integrity checks for security -->
<script src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js" 
        integrity="sha384-..." crossorigin="anonymous"></script>
```

## 🚨 Emergency Fallbacks

If MapBox completely fails in production:

1. **Disable map features temporarily**
   ```javascript
   if (!window.mapboxgl) {
     // Show alternative UI without map
     document.getElementById('map-container').innerHTML = 
       '<div class="map-error">Map temporarily unavailable</div>';
   }
   ```

2. **Use alternative map provider**
   - OpenStreetMap with Leaflet
   - Google Maps (requires separate API key)

3. **Local MapBox GL bundle** (most reliable)
   ```bash
   npm install mapbox-gl
   ```
   Then import in your code instead of using CDN.

---

**Last Updated**: ${new Date().toISOString()}
**Status**: Production deployment issues addressed with enhanced error handling