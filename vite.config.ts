import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: false, // 🛡️ Allow fallback ports in production
    host: true,
    proxy: {
      // Proxy NOAA nowCOAST weather services to avoid CORS issues
      '/api/noaa': {
        target: 'https://nowcoast.noaa.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/noaa/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('NOAA proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying NOAA request:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('NOAA proxy response:', proxyRes.statusCode, req.url);
          });
        }
      },
      // Proxy Aviation Weather Center API to avoid CORS issues
      '/api/awc': {
        target: 'https://aviationweather.gov',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/awc/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('AWC proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying AWC request:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('AWC proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: '/plan/', // Path for subdirectory deployment
  optimizeDeps: {
    include: ['@osdk/client', '@osdk/oauth', '@flight-app/sdk', '@osdk/foundry.admin']
  },
  build: {
    sourcemap: true, // Enable source maps for easier debugging
    rollupOptions: {
      output: {
        manualChunks: {
          // Explicitly include OSDK packages in a dedicated chunk
          'osdk-vendors': [
            '@osdk/client',
            '@osdk/oauth',
            '@flight-app/sdk',
            '@osdk/foundry.admin'
          ],
          // React in a separate chunk
          'react-vendors': [
            'react',
            'react-dom',
            'react/jsx-runtime'
          ]
        }
      }
    }
  }
});
