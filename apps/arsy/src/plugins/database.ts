import type { FastifyInstance } from "fastify";

import { createDatabase } from "@galaxy/database";
import type { DatabaseOptions, GalaxyDatabase } from "@galaxy/database";

import type { AppConfig } from "../config/env.js";
import type { HttpMetrics } from "../core/observability/http-metrics.js";

declare module "fastify" {
  interface FastifyInstance {
    database: GalaxyDatabase | null;
  }
}

export function registerDatabase(
  app: FastifyInstance,
  config: AppConfig["database"],
  metrics?: HttpMetrics,
): void {
  const options: DatabaseOptions =
    config.adapter === "pglite"
      ? { adapter: "pglite", dataDir: config.dataDir }
      : {
          adapter: "postgres",
          connectionString: config.connectionString,
          pool: config.pool,
        };

  app.decorate("database", null);

  app.addHook("onReady", async () => {
    const database = await createDatabase(options);
    app.database = database;
    const queryStartedAt = new WeakMap<object, number>();
    const eventEmitter = database.knex as unknown as {
      on(event: string, listener: (...args: unknown[]) => void): void;
    };
    eventEmitter.on("query", (query) => {
      if (typeof query === "object" && query !== null) {
        queryStartedAt.set(query, Date.now());
      }
    });
    eventEmitter.on("query-response", (_response, query) => {
      if (typeof query !== "object" || query === null) return;
      const startedAt = queryStartedAt.get(query);
      if (startedAt === undefined) return;
      queryStartedAt.delete(query);
      const sql = typeof (query as { sql?: unknown }).sql === "string"
        ? (query as { sql: string }).sql.trim()
        : "";
      const operation = sql.split(/\\s+/, 1)[0]?.toUpperCase() ?? "OTHER";
      metrics?.recordDatabaseQuery(operation, Math.max(0, Date.now() - startedAt) / 1000);
    });
    metrics?.recordDatabasePool(database.knex);
    app.log.info({ adapter: config.adapter }, "database connected");
  });

  app.addHook("onClose", async () => {
    const database = app.database;
    app.database = null;
    await database?.close();
    if (database) {
      app.log.info({ adapter: config.adapter }, "database disconnected");
    }
  });
}
