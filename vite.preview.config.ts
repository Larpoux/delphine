import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// English comments as requested.
export default defineConfig({
  root: resolve(__dirname, 'media'),
  server: {
    port: 5179,
    strictPort: true,
  },
});
