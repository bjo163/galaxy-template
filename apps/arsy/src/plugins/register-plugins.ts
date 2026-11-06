import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../config/env.js";
import type { HttpMetrics } from "../core/observability/http-metrics.js";
import { registerHttpSecurity } from "./http-security.js";
import { registerMetricsEndpoint } from "./metrics.js";
import { registerOpenApi } from "./openapi.js";

export function registerPlugins(
  app: FastifyInstance,
  config: AppConfig,
  metrics: HttpMetrics | undefined,
): void {
  registerHttpSecurity(app, config);
  if (config.openApiEnabled) {
    registerOpenApi(app);
  }

  app.register(rateLimit, {
    global: true,
    max: config.rateLimitMax,
    timeWindow: config.rateLimitWindowMs,
  });

  if (config.metricsEnabled && metrics) {
    app.register(async (metricsApp) => {
      registerMetricsEndpoint(metricsApp, config, metrics);
    });
  }
}
