import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' để có thể deploy lên bất kỳ đâu (GitHub Pages, Netlify, Vercel, hosting tĩnh)
export default defineConfig({
  base: './',
  plugins: [react()],
});
