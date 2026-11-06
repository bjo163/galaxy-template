import { resolve } from "node:path";

import fastifyVite from "@fastify/vite/plugin";
import { defineConfig } from "vite";

export default defineConfig({
  root: resolve(import.meta.dirname, "console"),
  plugins: [fastifyVite({ spa: true })],
  build: {
    emptyOutDir: true,
    outDir: resolve(import.meta.dirname, "dist/console"),
  },
});
