import { createHash, randomUUID } from "node:crypto";
import type { Knex } from "@galaxy/database";

import { HttpError } from "./identity.js";

const windowMs = 15 * 60 * 1000;

export async function enforceAuthRateLimit(
  knex: Knex,
  scope: string,
  identifier: string,
  maximumAttempts: number,
  now = new Date(),
): Promise<void> {
  const keyHash = createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
  const windowStartedAt = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const rows = await knex("arsy_auth_rate_limits")
    .insert({
      id: randomUUID(),
      scope,
      key_hash: keyHash,
      window_started_at: windowStartedAt,
      attempts: 1,
      updated_at: now,
    })
    .onConflict(["scope", "key_hash", "window_started_at"])
    .merge({
      attempts: knex.raw('"arsy_auth_rate_limits"."attempts" + 1'),
      updated_at: now,
    })
    .returning("attempts");
  const attempts = Number(rows[0]?.attempts ?? 0);
  if (attempts > maximumAttempts) {
    throw new HttpError(429, "Too many authentication attempts. Try again later.");
  }
}
