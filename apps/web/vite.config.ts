import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { nitro } from 'nitro/vite';
import viteReact from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    tanstackStart(),
    nitro(),
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
  preview: {
    port: Number(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
  },
});
