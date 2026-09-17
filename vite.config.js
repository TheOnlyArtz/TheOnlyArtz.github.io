import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages project site: https://theonlyartz.github.io/JevIsraeliElections/
  base: '/JevIsraeliElections/',
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
});
