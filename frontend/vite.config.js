import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import fs from 'fs'

function mirrorBuildPlugin() {
  return {
    name: 'mirror-build-plugin',
    closeBundle() {
      const rootClient = fileURLToPath(new URL('../client', import.meta.url));
      const localClient = fileURLToPath(new URL('./client', import.meta.url));
      const localDist = fileURLToPath(new URL('./dist', import.meta.url));
      try {
        if (fs.existsSync(rootClient)) {
          fs.cpSync(rootClient, localClient, { recursive: true });
          fs.cpSync(rootClient, localDist, { recursive: true });
        }
      } catch (err) {
        console.warn('Mirror build warning:', err.message);
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mirrorBuildPlugin()],
  build: {
    outDir: fileURLToPath(new URL('../client', import.meta.url)),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
