import { createDatabase } from "@galaxy/database";

import { loadConfig } from "../config/env.js";

const config = loadConfig();
const database = await createDatabase(config.database);
const batchSize = 500;

async function deleteExpiredRows(
  table: "arsy_sessions" | "arsy_auth_rate_limits",
  timestampColumn: "expires_at" | "window_started_at",
  cutoff: Date,
): Promise<number> {
  let total = 0;
  while (true) {
    const deleted = await database.knex.transaction(async (trx) => {
      const rows = await trx(table)
        .select("id")
        .where(timestampColumn, "<", cutoff)
        .orderBy(timestampColumn, "asc")
        .limit(batchSize)
        .forUpdate()
        .skipLocked();
      if (rows.length === 0) return 0;
      return trx(table)
        .whereIn("id", rows.map((row) => row.id))
        .delete();
    });
    const deletedCount = Number(deleted ?? 0);
    total += deletedCount;
    if (deletedCount === 0) break;
  }
  return total;
}

try {
  const now = new Date();
  const expiredSessions = await deleteExpiredRows("arsy_sessions", "expires_at", now);
  const staleRateLimitBuckets = await deleteExpiredRows(
    "arsy_auth_rate_limits",
    "window_started_at",
    new Date(now.getTime() - 48 * 60 * 60 * 1000),
  );
  process.stdout.write(
    JSON.stringify({ expiredSessions, staleRateLimitBuckets }) + "\n",
  );
} finally {
  await database.close();
}
