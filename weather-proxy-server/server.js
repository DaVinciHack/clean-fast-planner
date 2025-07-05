const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API proxy
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration - allow your FastPlanner domains
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'https://localhost:8080',
    'http://localhost:3000',
    'https://localhost:3000',
    // Add your production domains here
    'https://your-fastplanner-domain.com',
    'https://your-palantir-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// NOAA Weather Services Proxy
// Routes: /api/noaa/* -> https://nowcoast.noaa.gov/*
app.use('/api/noaa', createProxyMiddleware({
  target: 'https://nowcoast.noaa.gov',
  changeOrigin: true,
  pathRewrite: {
    '^/api/noaa': '' // Remove /api/noaa prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`📡 NOAA Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('🚨 NOAA Proxy Error:', err.message);
    res.status(500).json({
      error: 'Weather service temporarily unavailable',
      service: 'NOAA',
      timestamp: new Date().toISOString()
    });
  }
}));

// Aviation Weather Center Proxy
// Routes: /api/awc/* -> https://aviationweather.gov/*
app.use('/api/awc', createProxyMiddleware({
  target: 'https://aviationweather.gov',
  changeOrigin: true,
  pathRewrite: {
    '^/api/awc': '' // Remove /api/awc prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`✈️ AWC Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('🚨 AWC Proxy Error:', err.message);
    res.status(500).json({
      error: 'Aviation weather service temporarily unavailable',
      service: 'AWC',
      timestamp: new Date().toISOString()
    });
  }
}));

// NOAA Buoy Data Proxy
// Routes: /api/buoy/* -> https://www.ndbc.noaa.gov/*
app.use('/api/buoy', createProxyMiddleware({
  target: 'https://www.ndbc.noaa.gov',
  changeOrigin: true,
  pathRewrite: {
    '^/api/buoy': '' // Remove /api/buoy prefix
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🌊 Buoy Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
  },
  onError: (err, req, res) => {
    console.error('🚨 Buoy Proxy Error:', err.message);
    res.status(500).json({
      error: 'Marine weather service temporarily unavailable',
      service: 'BUOY',
      timestamp: new Date().toISOString()
    });
  }
}));

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableRoutes: [
      '/health',
      '/api/noaa/*',
      '/api/awc/*',
      '/api/buoy/*'
    ],
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Server Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FastPlanner Weather Proxy Server running on port ${PORT}`);
  console.log(`🌤️  Health check: http://localhost:${PORT}/health`);
  console.log(`📡 NOAA Weather: http://localhost:${PORT}/api/noaa/*`);
  console.log(`✈️  Aviation Weather: http://localhost:${PORT}/api/awc/*`);
  console.log(`🌊 Marine Buoys: http://localhost:${PORT}/api/buoy/*`);
  console.log(`🔒 CORS enabled for FastPlanner domains`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down weather proxy server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down weather proxy server...');
  process.exit(0);
});