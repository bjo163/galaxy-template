import { resolve } from "node:path";

import FastifyVite from "@fastify/vite";
import type { FastifyInstance } from "fastify";

export async function registerConsole(
  app: FastifyInstance,
  dev: boolean,
): Promise<void> {
  await app.register(FastifyVite, {
    root: resolve(import.meta.dirname, "../.."),
    dev,
    spa: true,
  });

  app.get("/", (_request, reply) => reply.html());
  await app.vite.ready();
}
