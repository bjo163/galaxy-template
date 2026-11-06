import { createHash } from "node:crypto";

import type { Knex } from "@galaxy/database";

const quotaTable = "arsy_shared_quota_buckets";
const cleanupIntervalMs = 60_000;

export type QuotaDimension = "ip" | "credential" | "project";

export type QuotaRule = {
  dimension: QuotaDimension;
  subject: string;
  limit: number;
};

type QuotaResult = {
  dimension: QuotaDimension;
  limit: number;
  requestCount: number;
  retryAfterSeconds: number;
  resetAtEpochSeconds: number;
};

export class SharedQuotaExceededError extends Error {
  readonly statusCode = 429;

  constructor(readonly quota: QuotaResult) {
    super("The request rate limit was exceeded.");
    this.name = "SharedQuotaExceededError";
  }
}

export class SharedQuotaBackendUnavailableError extends Error {
  readonly statusCode = 503;

  constructor(cause: unknown) {
    super("The shared request quota backend is unavailable.", { cause });
    this.name = "SharedQuotaBackendUnavailableError";
  }
}

let nextCleanupAt = 0;

export async function enforceSharedQuota(
  knex: Knex,
  rules: readonly QuotaRule[],
  windowMs: number,
  nowMs?: number,
): Promise<void> {
  if (!Number.isSafeInteger(windowMs) || windowMs < 1) {
    throw new RangeError("The quota window must be a positive safe integer.");
  }
  if (nowMs !== undefined && !Number.isSafeInteger(nowMs)) {
    throw new RangeError("The quota timestamp must be a safe integer.");
  }
  if (rules.length === 0) {
    throw new RangeError("At least one quota rule is required.");
  }
  for (const rule of rules) {
    if (
      !rule.subject ||
      !Number.isSafeInteger(rule.limit) ||
      rule.limit < 1
    ) {
      throw new RangeError("Quota subjects and limits must be valid.");
    }
  }

  let results: QuotaResult[];
  try {
    results = await knex.transaction(async (trx) => {
      const cleanupTimeMs = nowMs ?? (await readDatabaseClock(trx));
      const shouldCleanExpired = cleanupTimeMs >= nextCleanupAt;
      if (shouldCleanExpired) {
        nextCleanupAt = cleanupTimeMs + cleanupIntervalMs;
        await trx(quotaTable)
          .where("expires_at", "<=", new Date(cleanupTimeMs))
          .delete();
      }

      const lockedBuckets: Array<{
        rule: QuotaRule;
        subjectHash: string;
        windowStartedAtMs: number;
        requestCount: number;
      }> = [];
      for (const rule of rules) {
        const subjectHash = hashSubject(rule.dimension, rule.subject);
        await trx(quotaTable)
          .insert({
            dimension: rule.dimension,
            subject_hash: subjectHash,
            window_started_at: new Date(0),
            expires_at: new Date(0),
            request_count: 0,
          })
          .onConflict(["dimension", "subject_hash"])
          .ignore();

        const existing = await trx(quotaTable)
          .select("window_started_at", "request_count")
          .where({
            dimension: rule.dimension,
            subject_hash: subjectHash,
          })
          .forUpdate()
          .first();
        if (!existing) {
          throw new Error("The shared quota bucket could not be locked.");
        }

        lockedBuckets.push({
          rule,
          subjectHash,
          windowStartedAtMs: toEpochMilliseconds(existing.window_started_at),
          requestCount: Number(existing.request_count),
        });
      }

      const currentTimeMs = nowMs ?? (await readDatabaseClock(trx));
      const windowStartedAtMs = Math.floor(currentTimeMs / windowMs) * windowMs;
      const windowStartedAt = new Date(windowStartedAtMs);
      const expiresAt = new Date(windowStartedAtMs + windowMs);
      const applied: QuotaResult[] = [];
      for (const bucket of lockedBuckets) {
        const requestCount =
          bucket.windowStartedAtMs === windowStartedAtMs
            ? bucket.requestCount + 1
            : 1;
        if (!Number.isSafeInteger(requestCount) || requestCount < 1) {
          throw new Error("The shared quota backend returned an invalid count.");
        }
        const updatedRows = await trx(quotaTable)
          .where({
            dimension: bucket.rule.dimension,
            subject_hash: bucket.subjectHash,
          })
          .update({
            window_started_at: windowStartedAt,
            expires_at: expiresAt,
            request_count: requestCount,
          });
        if (updatedRows !== 1) {
          throw new Error("The shared quota bucket could not be updated.");
        }

        applied.push({
          dimension: bucket.rule.dimension,
          limit: bucket.rule.limit,
          requestCount,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((windowStartedAtMs + windowMs - currentTimeMs) / 1000),
          ),
          resetAtEpochSeconds: Math.ceil(
            (windowStartedAtMs + windowMs) / 1000,
          ),
        });
      }
      return applied;
    });
  } catch (error) {
    throw new SharedQuotaBackendUnavailableError(error);
  }

  const exceededQuota = results.find(
    (result) => result.requestCount > result.limit,
  );
  if (exceededQuota) {
    throw new SharedQuotaExceededError(exceededQuota);
  }
}

function hashSubject(dimension: QuotaDimension, subject: string): string {
  return createHash("sha256")
    .update(`${dimension}\0${subject}`)
    .digest("hex");
}

async function readDatabaseClock(trx: Knex.Transaction): Promise<number> {
  const row = await trx
    .select(trx.raw("clock_timestamp() AS database_clock"))
    .first();
  const epochMilliseconds = toEpochMilliseconds(row?.database_clock);
  if (!Number.isSafeInteger(epochMilliseconds)) {
    throw new Error("The shared quota backend returned an invalid clock.");
  }
  return epochMilliseconds;
}

function toEpochMilliseconds(value: unknown): number {
  const timestamp =
    value instanceof Date
      ? value
      : typeof value === "string"
        ? new Date(value)
        : undefined;
  const epochMilliseconds = timestamp?.getTime();
  if (epochMilliseconds === undefined || !Number.isFinite(epochMilliseconds)) {
    throw new Error("The shared quota backend returned an invalid window.");
  }
  return epochMilliseconds;
}
