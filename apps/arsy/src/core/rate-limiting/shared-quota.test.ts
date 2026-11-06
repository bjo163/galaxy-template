import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";

import { createDatabase } from "@galaxy/database";

import { up as migrateSharedQuotaBuckets } from "../../migrations/0003_shared_quota_buckets.js";
import {
  enforceSharedQuota,
  SharedQuotaBackendUnavailableError,
  SharedQuotaExceededError,
} from "./shared-quota.js";

const connectionString = process.env.ARSY_POSTGRES_TEST_URL;

describe("shared request quotas", () => {
  it("isolates credentials while aggregating requests by project", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    const now = Date.UTC(2025, 0, 1);
    const projectId = randomUUID();
    const otherProjectId = randomUUID();
    const firstCredentialId = randomUUID();
    const secondCredentialId = randomUUID();
    const otherProjectCredentialId = randomUUID();

    try {
      await migrateSharedQuotaBuckets(database.knex);
      const request = (credentialId: string) =>
        enforceSharedQuota(
          database.knex,
          [
            { dimension: "credential", subject: credentialId, limit: 2 },
            { dimension: "project", subject: projectId, limit: 4 },
          ],
          60_000,
          now,
        );

      await request(firstCredentialId);
      await request(firstCredentialId);
      await assert.rejects(
        request(firstCredentialId),
        (error: unknown) =>
          error instanceof SharedQuotaExceededError &&
          error.quota.dimension === "credential" &&
          error.quota.limit === 2,
      );

      await request(secondCredentialId);
      await assert.rejects(
        request(secondCredentialId),
        (error: unknown) =>
          error instanceof SharedQuotaExceededError &&
          error.quota.dimension === "project" &&
          error.quota.limit === 4,
      );
      await enforceSharedQuota(
        database.knex,
        [
          {
            dimension: "credential",
            subject: otherProjectCredentialId,
            limit: 2,
          },
          { dimension: "project", subject: otherProjectId, limit: 4 },
        ],
        60_000,
        now,
      );
    } finally {
      await database.close();
    }
  });

  it("increments concurrent requests atomically and resets at the window boundary", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    const now = Date.UTC(2025, 0, 1);
    const credentialId = randomUUID();
    const projectId = randomUUID();
    let allowed = 0;
    let limited = 0;

    try {
      await migrateSharedQuotaBuckets(database.knex);
      await Promise.all(
        Array.from({ length: 20 }, async () => {
          try {
            await enforceSharedQuota(
              database.knex,
              [
                { dimension: "credential", subject: credentialId, limit: 4 },
                { dimension: "project", subject: projectId, limit: 100 },
              ],
              60_000,
              now,
            );
            allowed += 1;
          } catch (error) {
            assert.ok(error instanceof SharedQuotaExceededError);
            limited += 1;
          }
        }),
      );

      assert.equal(allowed, 4);
      assert.equal(limited, 16);
      await enforceSharedQuota(
        database.knex,
        [{ dimension: "credential", subject: credentialId, limit: 1 }],
        60_000,
        now + 60_000,
      );
    } finally {
      await database.close();
    }
  });

  it("returns retry metadata and fails closed when the shared table is unavailable", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    const now = Date.UTC(2025, 0, 1);
    const rule = { dimension: "ip" as const, subject: "127.0.0.1", limit: 1 };

    try {
      await migrateSharedQuotaBuckets(database.knex);
      await enforceSharedQuota(database.knex, [rule], 60_000, now);
      await assert.rejects(
        enforceSharedQuota(database.knex, [rule], 60_000, now + 50_000),
        (error: unknown) =>
          error instanceof SharedQuotaExceededError &&
          error.quota.retryAfterSeconds === 10,
      );

      await database.knex.schema.dropTable("arsy_shared_quota_buckets");
      await assert.rejects(
        enforceSharedQuota(database.knex, [rule], 60_000, now),
        (error: unknown) => error instanceof SharedQuotaBackendUnavailableError,
      );
    } finally {
      await database.close();
    }
  });

  it(
    "enforces project and credential limits across independent PostgreSQL pools",
    { skip: !connectionString },
    async () => {
      const firstDatabase = await createDatabase({
        adapter: "postgres",
        connectionString: connectionString!,
        pool: { min: 0, max: 5 },
      });
      const secondDatabase = await createDatabase({
        adapter: "postgres",
        connectionString: connectionString!,
        pool: { min: 0, max: 5 },
      });
      const now = Date.now();

      try {
        const runConcurrentQuota = async (
          credentialIds: readonly string[],
          credentialLimit: number,
          projectLimit: number,
        ) => {
          const projectId = randomUUID();
          const outcomes = await Promise.all(
            Array.from({ length: 140 }, async (_, index) => {
              const credentialId =
                credentialIds[index % credentialIds.length];
              if (!credentialId) {
                throw new Error("The shared quota test needs a credential.");
              }
              try {
                await enforceSharedQuota(
                  index % 2 === 0 ? firstDatabase.knex : secondDatabase.knex,
                  [
                    {
                      dimension: "credential",
                      subject: credentialId,
                      limit: credentialLimit,
                    },
                    {
                      dimension: "project",
                      subject: projectId,
                      limit: projectLimit,
                    },
                  ],
                  60_000,
                  now,
                );
                return "allowed";
              } catch (error) {
                assert.ok(error instanceof SharedQuotaExceededError);
                return "limited";
              }
            }),
          );
          assert.equal(
            outcomes.filter((outcome) => outcome === "allowed").length,
            100,
          );
          assert.equal(
            outcomes.filter((outcome) => outcome === "limited").length,
            40,
          );
        };

        await runConcurrentQuota([randomUUID(), randomUUID()], 1_000, 100);
        await runConcurrentQuota([randomUUID()], 100, 1_000);
      } finally {
        await Promise.all([firstDatabase.close(), secondDatabase.close()]);
      }
    },
  );
});
