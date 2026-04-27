import { defineConfig } from "vite";

export default defineConfig({
  base: "/brancusi/",
  server: {
    host: true,
    watch: {
      usePolling: true,
      interval: 120,
    },
    hmr: {
      overlay: true,
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) {
            return "three";
          }
        },
      },
    },
  },
});
