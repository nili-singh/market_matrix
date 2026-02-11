import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://market-matrix-t2nc.onrender.com/api',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'https://market-matrix-t2nc.onrender.com',
        ws: true,
      },
    },
  },
});
