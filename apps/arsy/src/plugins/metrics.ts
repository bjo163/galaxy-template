import { createHash, timingSafeEqual } from "node:crypto";

import type { FastifyInstance } from "fastify";

import type { AppConfig } from "../config/env.js";
import { createProblemDetails } from "../core/http/problem-details.js";
import type { HttpMetrics } from "../core/observability/http-metrics.js";

export function registerMetricsEndpoint(
  app: FastifyInstance,
  config: AppConfig,
  metrics: HttpMetrics,
): void {
  app.get(
    "/metrics",
    {
      schema: { hide: true },
    },
    async (request, reply) => {
      if (!isAuthorized(request.headers.authorization, config.metricsToken)) {
        return reply
          .code(401)
          .header("www-authenticate", "Bearer")
          .type("application/problem+json")
          .send(
            createProblemDetails(
              request,
              401,
              "Valid metrics credentials are required.",
            ),
          );
      }

      return reply
        .code(200)
        .header("cache-control", "no-store")
        .type(metrics.registry.contentType)
        .send(await metrics.registry.metrics());
    },
  );
}

function isAuthorized(
  authorization: string | undefined,
  configuredToken: string,
): boolean {
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  const suppliedToken = createHash("sha256")
    .update(authorization.slice("Bearer ".length))
    .digest();
  const expectedToken = createHash("sha256").update(configuredToken).digest();

  return timingSafeEqual(suppliedToken, expectedToken);
}
