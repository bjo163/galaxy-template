import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";

import { BaseModel, BaseRepository, createDatabase } from "./index.js";

class TestRecord extends BaseModel {
  static tableName = "test_records";

  id!: number;
  displayName!: string;
}

class TestRecordRepository extends BaseRepository<TestRecord> {}

const databases: Awaited<ReturnType<typeof createDatabase>>[] = [];

afterEach(async () => {
  await Promise.all(
    databases.splice(0).map(async (database) => database.close()),
  );
});

describe("PGlite database adapter", () => {
  it("runs Objection repository queries and health checks", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    databases.push(database);
    database.bindModel(TestRecord);

    await database.knex.schema.createTable("test_records", (table) => {
      table.increments("id").primary();
      table.string("display_name").notNullable();
      table.timestamp("created_at", { useTz: true }).notNullable();
      table.timestamp("updated_at", { useTz: true }).notNullable();
    });

    const repository = new TestRecordRepository(TestRecord, database.knex);
    const inserted = await repository.insert({
      displayName: "database smoke test",
    });

    assert.equal(inserted.displayName, "database smoke test");
    assert.equal(inserted.createdAt instanceof Date, true);
    assert.equal(inserted.updatedAt instanceof Date, true);
    await database.ping();

    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await repository.patchById(inserted.id, {
      displayName: "updated record",
    });
    assert.equal(updated?.displayName, "updated record");
    assert.ok(updated?.updatedAt instanceof Date);
    assert.ok(updated.updatedAt.getTime() > inserted.updatedAt.getTime());

    const found = await repository.findById(inserted.id);
    assert.equal(found?.displayName, "updated record");

    assert.equal(await repository.deleteById(inserted.id), 1);
    assert.equal(await repository.findById(inserted.id), undefined);
  });

  it("closes safely more than once", async () => {
    const database = await createDatabase({ adapter: "pglite" });

    await database.close();
    await database.close();
  });

  it("persists PGlite data when a durable data directory is configured", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "galaxy-database-"));
    let database: Awaited<ReturnType<typeof createDatabase>> | undefined;

    try {
      database = await createDatabase({ adapter: "pglite", dataDir });
      await database.knex.raw("create table persistence_check (value text)");
      await database.knex.raw(
        "insert into persistence_check (value) values (?)",
        ["persisted"],
      );
      await database.close();

      database = await createDatabase({ adapter: "pglite", dataDir });
      const result = await database.knex.raw(
        "select value from persistence_check",
      );

      assert.equal(result.rows[0]?.value, "persisted");
    } finally {
      await database?.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  });

  it("creates missing parent directories for a durable PGlite data directory", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "galaxy-database-"));
    const dataDir = join(rootDir, "missing", "parent", "data");
    let database: Awaited<ReturnType<typeof createDatabase>> | undefined;

    try {
      database = await createDatabase({ adapter: "pglite", dataDir });
      await database.knex.raw("select 1");
    } finally {
      await database?.close();
      await rm(rootDir, { recursive: true, force: true });
    }
  });
});
