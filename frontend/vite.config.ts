import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Base URL for assets (change for CDN deployment)
    base: env.VITE_BASE_URL || '/',
    
    server: {
      host: "::",
      port: 8080,
      // Proxy API requests to backend in development
      proxy: {
        '/api': {
          target: env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    
    // Preview server (for testing production build locally)
    preview: {
      port: 8080,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    
    plugins: [
      react(), 
      mode === "development" && componentTagger()
    ].filter(Boolean),
    
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    
    // Build optimizations
    build: {
      // Output directory
      outDir: 'dist',
      // Generate source maps for production (optional)
      sourcemap: mode === 'development',
      // Chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['framer-motion', 'lucide-react'],
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast'
            ],
          }
        }
      },
      // Minification
      minify: mode === 'production' ? 'esbuild' : false,
      // Target modern browsers
      target: 'es2020',
    },
    
    // Environment variable prefix
    envPrefix: 'VITE_',
    
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    }
  };
});
