import type { FastifyInstance } from "fastify";

import { registerApiHealthRoutes } from "../health/health.routes.js";
import { registerAddonRoutes } from "../addons/addon.routes.js";
import { registerControlPlaneRoutes } from "../control-plane/control-plane.routes.js";
import { registerModelRoutes } from "../models/model.routes.js";
import { registerModelLifecycleRoutes } from "../models/model-lifecycle.routes.js";

export async function registerApiV1Modules(
  app: FastifyInstance,
): Promise<void> {
  app.register(registerApiHealthRoutes);
  app.register(registerControlPlaneRoutes);
  app.register(registerModelRoutes);
  app.register(registerModelLifecycleRoutes);
  app.register(registerAddonRoutes);
}
