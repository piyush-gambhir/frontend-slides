import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Dev gallery for the Frontend Slides bold templates.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    // Force a single React instance — Radix + Vite dep pre-bundling can otherwise
    // load a second copy, which surfaces as "Invalid hook call".
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime'],
  },
  server: { host: true, port: Number(process.env.PORT) || 5173 },
});
