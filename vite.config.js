import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // User site, served from the domain root: https://theonlyartz.github.io/
  base: '/',
  plugins: [react()],
  server: { port: 5173, host: '127.0.0.1' },
});
