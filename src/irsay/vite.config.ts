import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          mapbox: ['mapbox-gl']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    include: ['mapbox-gl']
  }
})
