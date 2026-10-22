import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the client talks to the API through Vite's proxy so the
// browser sees a single origin and the login cookie works. Point it at a
// deployed API with VITE_PROXY_TARGET (e.g. when testing against Render).
const apiTarget = process.env.VITE_PROXY_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
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
    // Requests to /api go to the Express server, so the browser sees one origin
    // and the login cookie works without extra CORS setup in development.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      // Locally stored listing images (used when Cloudinary is not configured)
      '/uploads': { target: apiTarget, changeOrigin: true },
      // Socket.IO (websocket) so the login cookie is sent with the handshake
      '/socket.io': { target: apiTarget, ws: true, changeOrigin: true },
    },
  },
});
