import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  test: {
    // Component tests render into a real DOM via React Testing Library.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          map: ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      // Locally stored listing images (used when Cloudinary is not configured)
      '/uploads': { target: apiTarget, changeOrigin: true },
      // Socket.IO (websocket) so the login cookie is sent with the handshake
      '/socket.io': { target: apiTarget, ws: true, changeOrigin: true },
    },
  },
});
