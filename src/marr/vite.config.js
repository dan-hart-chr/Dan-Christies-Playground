import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// public/ (fonts, images, videos) is served at the site root, e.g. /videos/hero.mp4
export default defineConfig({
  plugins: [react()],
});
