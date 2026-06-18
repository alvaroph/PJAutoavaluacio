import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Dins de Docker, API_PROXY_TARGET apunta al servei backend (http://backend:3000)
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['projectes.inspedralbes.cat', 'localhost'],
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
