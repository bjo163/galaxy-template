import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp } from "../../app.js";
import { loadConfig } from "../../config/env.js";
import { up as migrateControlPlane } from "../../migrations/0001_arsy_control_plane.js";
import { up as migrateAuthRateLimits } from "../../migrations/0003_auth_rate_limits.js";
import { HttpError } from "./identity.js";
import { enforceAuthRateLimit } from "./rate-limit.js";

describe("distributed authentication rate limit", () => {
  it("increments hashed account buckets atomically and rejects after the configured threshold", async () => {
    const app = createApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
    try {
      await app.ready();
      const database = app.database;
      assert.ok(database);
      await migrateControlPlane(database.knex);
      await migrateAuthRateLimits(database.knex);
      const now = new Date("2026-11-07T12:00:00.000Z");
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await enforceAuthRateLimit(database.knex, "login-email", "User@Example.com", 3, now);
      }
      await assert.rejects(
        () => enforceAuthRateLimit(database.knex, "login-email", "user@example.com", 3, now),
        (error: unknown) => error instanceof HttpError && error.statusCode === 429,
      );
      const rows = await database.knex("arsy_auth_rate_limits")
        .select("key_hash", "attempts")
        .where({ scope: "login-email" });
      assert.equal(rows.length, 1);
      assert.equal(rows[0]?.attempts, 4);
      assert.equal(String(rows[0]?.key_hash).includes("example.com"), false);
    } finally {
      await app.close();
    }
  });
});
