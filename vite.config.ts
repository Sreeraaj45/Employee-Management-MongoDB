import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Optimize dependencies for better build performance
  optimizeDeps: {
    include: ['exceljs'], // Include exceljs for pre-bundling
    exclude: ['lucide-react'],
  },
  
  // Build configuration
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Create separate chunk for exceljs to reduce main bundle size
          exceljs: ['exceljs'],
          vendor: ['react', 'react-dom'],
        }
      }
    },
    // Better chunking strategy
    chunkSizeWarningLimit: 1000,
  },
  
  // Development server configuration
  server: {
    // Proxy API requests to Express backend in development
    // This allows frontend (port 5173) to call backend (port 3001) without CORS issues
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});