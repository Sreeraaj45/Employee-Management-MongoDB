import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Base path for assets
  // In production, Express serves from root, so use '/'
  // For subdirectory deployment, change to '/subdirectory/'
  base: '/',
  
  // Optimize dependencies for better build performance
  optimizeDeps: {
    include: ['exceljs'], // Include exceljs for pre-bundling
    exclude: ['lucide-react'],
  },
  
  // Build configuration
  build: {
    // Output directory (relative to project root)
    outDir: 'dist',
    
    // Generate sourcemaps for production debugging (optional)
    sourcemap: false,
    
    // Minify output
    minify: 'esbuild',
    
    // Target modern browsers
    target: 'es2015',
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          // Create separate chunk for exceljs to reduce main bundle size
          exceljs: ['exceljs'],
          // Vendor chunk for React and core libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Chart libraries (amcharts4 excluded due to module resolution issues)
          charts: ['chart.js', '@amcharts/amcharts5'],
        },
        // Asset file naming
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Better chunking strategy
    chunkSizeWarningLimit: 1000,
    
    // Clear output directory before build
    emptyOutDir: true,
  },
  
  // Development server configuration
  server: {
    // Port for dev server
    port: 5173,
    
    // Automatically open browser
    open: false,
    
    // HMR configuration to fix websocket issues
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
    
    // Proxy API requests to Express backend in development
    // This allows frontend (port 5173) to call backend (port 3001) without CORS issues
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the /api prefix
      },
    },
  },
  
  // Preview server configuration (for testing production build locally)
  preview: {
    port: 4173,
    open: false,
  },
});