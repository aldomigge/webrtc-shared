import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
  server: {
    port: 3001,
    proxy: {
      '/signal': {
        target: 'http://127.0.0.1:3000',
        ws: true,
      },
      '/turn-credentials': {
        target: 'http://127.0.0.1:3000',
      },
    },
  },
});
