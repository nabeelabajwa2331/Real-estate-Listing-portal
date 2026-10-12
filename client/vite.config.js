import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      // Locally stored listing images (used when Cloudinary is not configured)
      '/uploads': { target: 'http://localhost:5000', changeOrigin: true },
      // Socket.IO (websocket) so the login cookie is sent with the handshake
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
});
