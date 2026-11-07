import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import { createDatabase, getMigrationStatus, runMigrations } from "./index.js";

const databases: Awaited<ReturnType<typeof createDatabase>>[] = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("database migrations", () => {
  it("reports, applies, and rolls back migrations with one shared history table", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    databases.push(database);
    const directory = await mkdtemp(join(tmpdir(), "galaxy-migrations-"));
    temporaryDirectories.push(directory);

    await writeFile(
      join(directory, "001_create_migration_probe.js"),
      [
        "export async function up(knex) {",
        "  await knex.schema.createTable('migration_probe', (table) => {",
        "    table.increments('id').primary();",
        "    table.string('value').notNullable();",
        "  });",
        "}",
        "",
        "export async function down(knex) {",
        "  await knex.schema.dropTable('migration_probe');",
        "}",
        "",
      ].join("\n"),
    );

    assert.deepEqual(await getMigrationStatus(database.knex, directory), {
      completed: [],
      pending: ["001_create_migration_probe.js"],
    });

    const applied = await runMigrations(database.knex, directory, "up");
    assert.deepEqual(applied, {
      batch: 1,
      completed: ["001_create_migration_probe.js"],
      pending: [],
    });
    assert.equal(
      await database.knex.schema.hasTable("galaxy_migrations"),
      true,
    );
    assert.equal(
      await database.knex.schema.hasTable("galaxy_migrations_lock"),
      true,
    );
    assert.deepEqual(await runMigrations(database.knex, directory, "up"), {
      batch: null,
      completed: ["001_create_migration_probe.js"],
      pending: [],
    });

    const rolledBack = await runMigrations(database.knex, directory, "down");
    assert.deepEqual(rolledBack, {
      batch: 1,
      completed: [],
      pending: ["001_create_migration_probe.js"],
    });
    assert.equal(await database.knex.schema.hasTable("migration_probe"), false);
  });

  it("rolls back an interrupted migration and safely retries it", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    databases.push(database);
    const directory = await mkdtemp(join(tmpdir(), "galaxy-migrations-retry-"));
    temporaryDirectories.push(directory);
    const migrationPath = join(directory, "001_retryable_probe.js");
    const failureMarker = join(directory, "fail-once");

    await writeFile(failureMarker, "fail");
    await writeFile(
      migrationPath,
      [
        "import { existsSync } from 'node:fs';",
        "export async function up(knex) {",
        "  await knex.schema.createTable('retryable_probe', (table) => table.increments('id').primary());",
        `  if (existsSync(${JSON.stringify(failureMarker)})) throw new Error('injected migration interruption');`,
        "}",
        "export async function down(knex) { await knex.schema.dropTableIfExists('retryable_probe'); }",
        "",
      ].join("\n"),
    );

    await assert.rejects(
      runMigrations(database.knex, directory, "up"),
      /injected migration interruption/,
    );
    assert.equal(await database.knex.schema.hasTable("retryable_probe"), false);
    assert.deepEqual(await getMigrationStatus(database.knex, directory), {
      completed: [],
      pending: ["001_retryable_probe.js"],
    });

    await rm(failureMarker);
    const retried = await runMigrations(database.knex, directory, "up");
    assert.deepEqual(retried, {
      batch: 1,
      completed: ["001_retryable_probe.js"],
      pending: [],
    });
    assert.equal(await database.knex.schema.hasTable("retryable_probe"), true);
  });

  it("upgrades an already-migrated database without reapplying prior migrations", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    databases.push(database);
    const directory = await mkdtemp(join(tmpdir(), "galaxy-migrations-upgrade-"));
    temporaryDirectories.push(directory);

    await writeFile(
      join(directory, "001_initial.js"),
      [
        "export async function up(knex) {",
        "  await knex.schema.createTable('upgrade_probe', (table) => { table.increments('id').primary(); });",
        "}",
        "export async function down(knex) { await knex.schema.dropTableIfExists('upgrade_probe'); }",
        "",
      ].join("\n"),
    );
    await runMigrations(database.knex, directory, "up");
    await database.knex("upgrade_probe").insert({});

    await writeFile(
      join(directory, "002_expand.js"),
      [
        "export async function up(knex) {",
        "  await knex.schema.alterTable('upgrade_probe', (table) => { table.string('expanded_value').nullable(); });",
        "}",
        "export async function down(knex) {",
        "  await knex.schema.alterTable('upgrade_probe', (table) => { table.dropColumn('expanded_value'); });",
        "}",
        "",
      ].join("\n"),
    );

    const upgraded = await runMigrations(database.knex, directory, "up");
    assert.deepEqual(upgraded, {
      batch: 2,
      completed: ["001_initial.js", "002_expand.js"],
      pending: [],
    });
    assert.equal(await database.knex.schema.hasColumn("upgrade_probe", "expanded_value"), true);
    assert.equal(await database.knex("upgrade_probe").count({ total: "id" }).first().then((row) => Number(row?.total)), 1);
  });
});
