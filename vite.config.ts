import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint2 from 'vite-plugin-eslint2';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    eslint2(),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    outDir: 'build',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {
      '@libs': '/src/libs',
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['tslib'],
  },
});
