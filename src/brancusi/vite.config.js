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
    proxy: {
      "/header-footer-content": {
        target: "https://api.christies.com",
        changeOrigin: true,
        secure: true,
      },
      "/christies-auth": {
        target: "https://api.christies.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/christies-auth/, "/auth"),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
