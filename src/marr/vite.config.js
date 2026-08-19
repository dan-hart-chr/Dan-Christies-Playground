import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The site is served from /marr/, so public/ assets sit under that prefix too.
// Vite rewrites CSS url() and index.html for us; anything referenced from JS has
// to be built on import.meta.env.BASE_URL by hand.
export default defineConfig({
  base: "/marr/",
  plugins: [react()],
});
