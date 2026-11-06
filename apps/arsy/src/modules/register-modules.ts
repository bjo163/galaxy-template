import type { FastifyInstance } from "fastify";

import { registerApiV1Modules } from "./api-v1/register-modules.js";
import { registerHealthRoutes } from "./health/health.routes.js";

export function registerModules(app: FastifyInstance): void {
  app.register(registerHealthRoutes);
  app.register(registerApiV1Modules, { prefix: "/api/v1" });
}
