import type { FastifyInstance } from "fastify";

import { problemDetailsSchema } from "../../core/http/problem-details.js";
import {
  apiHealthResponseSchema,
  healthResponseSchema,
  unavailableHealthResponseSchema,
} from "./health.schema.js";

export async function registerHealthRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/health/live",
    {
      config: { rateLimit: false },
      schema: {
        tags: ["health"],
        summary: "Check process liveness",
        description: "Indicates whether this process is running.",
        response: { 200: healthResponseSchema },
      },
    },
    async () => ({ status: "ok" }),
  );

  app.get(
    "/health/ready",
    {
      config: { rateLimit: false },
      schema: {
        tags: ["health"],
        summary: "Check service readiness",
        description:
          "Indicates whether this process and its database can receive traffic.",
        response: {
          200: healthResponseSchema,
          503: unavailableHealthResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const database = request.server.database;
      if (!database) {
        request.log.error("database is not initialized");
        return reply.code(503).send({ status: "unavailable" as const });
      }

      try {
        await database.ping();
        return { status: "ok" as const };
      } catch (error) {
        request.log.warn({ err: error }, "database readiness check failed");
        return reply.code(503).send({ status: "unavailable" as const });
      }
    },
  );
}

export async function registerApiHealthRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Get API service status",
        description: "Returns a minimal status response for the versioned API.",
        response: {
          200: apiHealthResponseSchema,
          429: problemDetailsSchema,
        },
      },
    },
    async () => ({ status: "ok", service: "arsy" }),
  );
}
