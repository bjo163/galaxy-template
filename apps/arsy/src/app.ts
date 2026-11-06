import { randomUUID } from "node:crypto";

import Fastify, { LogController } from "fastify";
import type { FastifyInstance } from "fastify";

import { loadConfig, type AppConfig } from "./config/env.js";
import { HttpMetrics } from "./core/observability/http-metrics.js";
import { registerModules } from "./modules/register-modules.js";
import { registerIdentityDecorators } from "./core/auth/identity.js";
import { registerDatabase } from "./plugins/database.js";
import { registerErrorHandling } from "./plugins/error-handler.js";
import { registerPlugins } from "./plugins/register-plugins.js";

export function createApp(config: AppConfig = loadConfig()): FastifyInstance {
  const metrics = config.metricsEnabled ? new HttpMetrics() : undefined;
  const app = Fastify({
    trustProxy: config.trustProxy,
    requestTimeout: config.requestTimeoutMs,
    bodyLimit: config.bodyLimitBytes,
    routerOptions: {
      maxParamLength: 100,
    },
    logger: {
      level: config.logLevel,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "req.headers.x-api-key",
          'res.headers["set-cookie"]',
          "req.body.password",
          "req.body.token",
          "req.body.secret",
        ],
        censor: "[REDACTED]",
      },
    },
    genReqId: (request) => {
      const requestId = request.headers["x-request-id"];

      return typeof requestId === "string" &&
        /^[A-Za-z0-9._-]{1,128}$/.test(requestId)
        ? requestId
        : randomUUID();
    },
    logController: new LogController({
      disableRequestLogging: true,
    }),
  });

  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.addHook("onResponse", async (request, reply) => {
    metrics?.recordRequest(request, reply);
    request.log.info(
      {
        method: request.method,
        route: request.routeOptions.url,
        statusCode: reply.statusCode,
        responseTimeMs: reply.elapsedTime,
      },
      "request completed",
    );
  });

  registerDatabase(app, config.database);
  registerIdentityDecorators(app);
  registerPlugins(app, config, metrics);
  registerErrorHandling(app);
  registerModules(app);

  return app;
}
