import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Build de arquivo único: todo o JS/CSS embutido no index.html,
// para abrir direto no navegador (file://) com duplo clique.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist-single',
    chunkSizeWarningLimit: 100000,
    assetsInlineLimit: 100000000
  }
});
