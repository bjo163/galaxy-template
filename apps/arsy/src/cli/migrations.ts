import { mkdir, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDatabase,
  getMigrationStatus,
  runMigrations,
} from "@galaxy/database";

import { loadConfig } from "../config/env.js";

const action = process.argv[2];
if (action !== "up" && action !== "down" && action !== "status") {
  throw new Error("Usage: arsy db:migrate <up|down|status>");
}

const config = loadConfig();
const migrationsDirectory = resolve(
  fileURLToPath(new URL("../migrations", import.meta.url)),
);
await mkdir(migrationsDirectory, { recursive: true });

const migrationFiles = (await readdir(migrationsDirectory)).filter((file) =>
  file.endsWith(".js"),
);
if (migrationFiles.length === 0 && action !== "status") {
  throw new Error(
    "No migration files exist yet. Add a domain migration before applying or rolling back.",
  );
}

const database = await createDatabase(config.database);

try {
  if (action === "status") {
    const status = await getMigrationStatus(database.knex, migrationsDirectory);
    console.log("Applied migrations:");
    console.log(status.completed.length > 0 ? status.completed : "(none)");
    console.log("Pending migrations:");
    console.log(status.pending.length > 0 ? status.pending : "(none)");
  } else {
    const result = await runMigrations(
      database.knex,
      migrationsDirectory,
      action,
    );
    const verb = action === "up" ? "Applied" : "Rolled back";
    console.log(
      `${verb} ${result.batch ? `batch ${result.batch}` : "no migrations"}.`,
    );
    console.log(
      `Completed: ${result.completed.length}, pending: ${result.pending.length}.`,
    );
  }
} finally {
  await database.close();
}
