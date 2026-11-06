import type { FastifyInstance } from "fastify";

import { createDatabase } from "@galaxy/database";
import type { DatabaseOptions, GalaxyDatabase } from "@galaxy/database";

import type { AppConfig } from "../config/env.js";

declare module "fastify" {
  interface FastifyInstance {
    database: GalaxyDatabase | null;
  }
}

export function registerDatabase(
  app: FastifyInstance,
  config: AppConfig["database"],
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
