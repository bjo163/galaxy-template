import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../config/env.js";

export function registerHttpSecurity(
  app: FastifyInstance,
  config: AppConfig,
): void {
  app.register(
    helmet,
    config.nodeEnv === "development"
      ? {
          contentSecurityPolicy: {
            directives: { workerSrc: ["'self'", "blob:"] },
          },
        }
      : {},
  );
  app.register(cors, {
    origin: config.corsOrigins,
    credentials: false,
  });
}
