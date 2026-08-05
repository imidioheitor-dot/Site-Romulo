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
  // Mantém os nomes das funções depois de minificar. Sem isso, quando um
  // erro acontece só no site publicado, a pilha vem como "Tg → Oc → al" e não
  // diz nada; com isso, o nome do componente aparece no console e no aviso
  // de erro da tela.
  esbuild: { keepNames: true },
  build: {
    chunkSizeWarningLimit: 1200,
    // Mapas de código: o navegador passa a mostrar arquivo e linha reais no
    // console, em vez do bundle minificado. Este repositório é público, então
    // não há nada a esconder aqui — e é o que torna um bug que só aparece em
    // produção investigável de primeira.
    sourcemap: true
  }
});
