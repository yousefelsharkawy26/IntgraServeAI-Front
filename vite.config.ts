import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-lucide';
            }
            if (id.includes('framer-motion') || id.includes('motion-dom')) {
              return 'vendor-motion';
            }
            if (id.includes('react-router') || id.includes('react-router-dom') || id.includes('remix-run')) {
              return 'vendor-router';
            }
            if (id.includes('react-dom') || id.includes('react/') || id.includes('scheduler')) {
              return 'vendor-react-core';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('zod')) {
              return 'vendor-zod';
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query';
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            return 'vendor-react-core';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
