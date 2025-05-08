import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    strictPort: true, // This will force Vite to use exactly port 8080
    host: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  base: '/planner/', // Path for subdirectory deployment
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