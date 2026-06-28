import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev gallery for the Frontend Slides bold templates.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: Number(process.env.PORT) || 5173 },
});
