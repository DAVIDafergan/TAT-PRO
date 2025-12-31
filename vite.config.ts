import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // מאפשר שימוש ב-process.env.API_KEY כפי שנדרש בקוד
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY || process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});