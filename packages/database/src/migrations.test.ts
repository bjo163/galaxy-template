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
});
