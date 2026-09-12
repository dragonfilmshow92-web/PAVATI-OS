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
