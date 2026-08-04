import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api vai para o servidor local que roda o MESMO
// roteador da Netlify Function (`npm run dev:api`).
const API_LOCAL = process.env.API_LOCAL || 'http://localhost:8888';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': { target: API_LOCAL, changeOrigin: true }
    }
  },
  build: {
    chunkSizeWarningLimit: 1200
  }
});
