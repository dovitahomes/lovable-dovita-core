import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { visualizer } from "rollup-plugin-visualizer";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy /client to apps/client dev server
      '^/client': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 8080,
    host: "::",
    proxy: {
      '^/client': {
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const clientPath = path.join(__dirname, 'apps/client/dist');
            
            if (!fs.existsSync(clientPath)) {
              res.writeHead(404, { 'Content-Type': 'text/html' });
              res.end(`
                <!DOCTYPE html>
                <html>
                  <head><title>Client App Not Built</title></head>
                  <body style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto;">
                    <h1>Client App Not Built</h1>
                    <p>The client app needs to be built before it can be served.</p>
                    <p>Please run:</p>
                    <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px;">cd apps/client && npm install && npm run build</pre>
                  </body>
                </html>
              `);
              return;
            }

            const requestPath = req.url?.replace('/client', '') || '/';
            const filePath = path.join(clientPath, requestPath === '/' ? 'index.html' : requestPath);
            
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              res.writeHead(200, {
                'Content-Type': requestPath.endsWith('.js') ? 'application/javascript' :
                               requestPath.endsWith('.css') ? 'text/css' :
                               requestPath.endsWith('.html') ? 'text/html' :
                               'application/octet-stream'
              });
              res.end(fs.readFileSync(filePath));
            } else {
              // Fallback to index.html for client-side routing
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(fs.readFileSync(path.join(clientPath, 'index.html')));
            }
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    process.env.ANALYZE === "true" &&
      visualizer({
        open: true,
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false, // Disable source maps in production
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["@radix-ui/react-dialog", "@radix-ui/react-select", "@radix-ui/react-tabs"],
          "query-vendor": ["@tanstack/react-query"],
          "supabase-vendor": ["@supabase/supabase-js"],
          // Heavy libraries - lazy load via dynamic imports in components
          // xlsx and jspdf should be imported dynamically where used
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
