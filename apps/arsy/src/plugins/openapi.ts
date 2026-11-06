import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import type { FastifyInstance } from "fastify";

export function registerOpenApi(app: FastifyInstance): void {
  app.register(swagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "Arsy API",
        description: "Versioned HTTP API for Arsy.",
        version: "1.0.0",
      },
      tags: [{ name: "health", description: "Service health and readiness" }],
    },
  });

  app.register(swaggerUi, {
    routePrefix: "/documentation",
    staticCSP: true,
    uiConfig: {
      deepLinking: true,
      displayRequestDuration: true,
      docExpansion: "list",
    },
  });
}
