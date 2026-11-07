import { createDatabase } from "@galaxy/database";

import { loadConfig } from "../config/env.js";
import {
  processModelIndexJob,
  processModelMigrationBatch,
} from "../modules/models/model-lifecycle.js";

const config = loadConfig();
const databaseOptions = config.database.adapter === "postgres"
  ? {
      ...config.database,
      pool: {
        ...config.database.pool,
        min: 0,
        max: Math.max(config.database.pool?.max ?? 10, 2),
      },
    }
  : config.database;
const database = await createDatabase(databaseOptions);
const knex = database.knex;

try {
  const migrationJobs = await knex("arsy_model_migration_jobs")
    .select("id")
    .whereIn("status", ["queued", "running"])
    .orderBy("created_at", "asc")
    .limit(20);

  for (const job of migrationJobs) {
    let state: string;
    do {
      state = await processModelMigrationBatch(knex, job.id as string);
    } while (state === "running");
    console.log(`Model migration ${job.id}: ${state}`);
  }

  const indexJobs = await knex("arsy_model_index_jobs")
    .select("id")
    .whereIn("status", ["requested", "building", "retiring", "failed"])
    .orderBy("created_at", "asc")
    .limit(20);

  for (const job of indexJobs) {
    const state = await processModelIndexJob(knex, job.id as string);
    console.log(`Model index job ${job.id}: ${state}`);
  }
} finally {
  await database.close();
}
