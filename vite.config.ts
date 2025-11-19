import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['exceljs'], // ✅ ADD: Include exceljs for pre-bundling
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // ✅ ADD: Create separate chunk for exceljs
          exceljs: ['exceljs'],
          vendor: ['react', 'react-dom'],
        }
      }
    },
    // ✅ ADD: Better chunking strategy
    chunkSizeWarningLimit: 1000,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});