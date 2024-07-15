// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/client/',  // Add this line to set the base path
  build: {
    outDir: 'dist'
  }
});
