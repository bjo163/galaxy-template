import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { createDatabase } from "@galaxy/database";
import { validateModelDefinition } from "../../core/models/model-definition.js";
import {
  applyModelMigrationPlan,
  makeModelIndexName,
  processModelMigrationBatch,
} from "./model-lifecycle.js";

const databases: Awaited<ReturnType<typeof createDatabase>>[] = [];

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.close()));
});

describe("model lifecycle primitives", () => {
  it("applies only declarative rename, default, and remove operations", () => {
    const result = applyModelMigrationPlan(
      { old_name: "Ada", obsolete: true },
      {
        operations: [
          { op: "rename", field: "old_name", to: "display_name" },
          { op: "set_default", field: "enabled", value: true },
          { op: "remove", field: "obsolete" },
        ],
      },
    );
    assert.deepEqual(result, { display_name: "Ada", enabled: true });
  });

  it("rejects invalid transforms and validates the final target payload", () => {
    assert.throws(
      () => applyModelMigrationPlan({ name: "Ada" }, { operations: [{ op: "execute", field: "name" }] }),
      /Unsupported migration operation/,
    );

    const target = validateModelDefinition({
      key: "contacts",
      displayName: "Contacts",
      fields: [
        { key: "display_name", type: "string", required: true, indexed: false, unique: false },
      ],
      access: { defaultVisibility: "project" },
    });
    const migrated = applyModelMigrationPlan(
      { old_name: "Ada" },
      { operations: [{ op: "rename", field: "old_name", to: "display_name" }] },
    );
    assert.deepEqual(migrated, { display_name: "Ada" });
  });

  it("stages resumable migration batches without mutating live record payloads", async () => {
    const database = await createDatabase({ adapter: "pglite" });
    databases.push(database);
    const knex = database.knex;
    await knex.schema.createTable("arsy_model_migration_jobs", (table) => {
      table.uuid("id").primary();
      table.uuid("workspace_id").notNullable();
      table.uuid("project_id").notNullable();
      table.uuid("definition_id").notNullable();
      table.integer("to_revision").notNullable();
      table.string("status").notNullable();
      table.jsonb("plan").notNullable();
      table.uuid("last_record_id").nullable();
      table.bigInteger("total_records").notNullable();
      table.bigInteger("processed_records").notNullable();
      table.bigInteger("failed_records").notNullable();
      table.text("last_error").nullable();
      table.timestamp("started_at").nullable();
      table.timestamp("completed_at").nullable();
      table.timestamp("updated_at").notNullable();
    });
    await knex.schema.createTable("arsy_records", (table) => {
      table.uuid("id").primary();
      table.uuid("workspace_id").notNullable();
      table.uuid("project_id").notNullable();
      table.uuid("definition_id").notNullable();
      table.jsonb("payload").notNullable();
      table.integer("model_revision").notNullable();
      table.timestamp("updated_at").notNullable();
    });
    await knex.schema.createTable("arsy_model_migration_records", (table) => {
      table.uuid("job_id").notNullable();
      table.uuid("workspace_id").notNullable();
      table.uuid("project_id").notNullable();
      table.uuid("record_id").notNullable();
      table.jsonb("payload").notNullable();
      table.timestamp("updated_at").notNullable();
      table.primary(["job_id", "record_id"]);
    });

    const jobId = "00000000-0000-4000-8000-000000000001";
    const workspaceId = "00000000-0000-4000-8000-000000000002";
    const projectId = "00000000-0000-4000-8000-000000000003";
    const definitionId = "00000000-0000-4000-8000-000000000004";
    const recordIds = [
      "00000000-0000-4000-8000-000000000005",
      "00000000-0000-4000-8000-000000000006",
    ];
    const targetDefinition = {
      key: "contacts",
      displayName: "Contacts",
      fields: [{ key: "display_name", type: "string", required: true, indexed: false, unique: false }],
      access: { defaultVisibility: "project" },
    };
    const plan = {
      targetDefinition,
      operations: [{ op: "rename", field: "name", to: "display_name" }],
    };
    await knex("arsy_model_migration_jobs").insert({
      id: jobId,
      workspace_id: workspaceId,
      project_id: projectId,
      definition_id: definitionId,
      to_revision: 2,
      status: "queued",
      plan: JSON.stringify(plan),
      total_records: 2,
      processed_records: 0,
      failed_records: 0,
      updated_at: new Date(),
    });
    await knex("arsy_records").insert(recordIds.map((id) => ({
      id,
      workspace_id: workspaceId,
      project_id: projectId,
      definition_id: definitionId,
      payload: JSON.stringify({ name: id }),
      model_revision: 1,
      updated_at: new Date(),
    })));

    assert.equal(await processModelMigrationBatch(knex, jobId), "running");
    assert.equal(await processModelMigrationBatch(knex, jobId), "ready");
    const live = await knex("arsy_records").select("payload", "model_revision").orderBy("id");
    assert.equal(live[0].model_revision, 1);
    assert.deepEqual(live[0].payload, { name: recordIds[0] });
    const staged = await knex("arsy_model_migration_records").select("payload").orderBy("record_id");
    assert.equal(staged.length, 2);
    assert.deepEqual(staged[0].payload, { display_name: recordIds[0] });
  });

  it("creates deterministic and type-sensitive online index names", () => {
    const first = makeModelIndexName("project", "contacts", "email", "string", false);
    assert.equal(first, makeModelIndexName("project", "contacts", "email", "string", false));
    assert.notEqual(first, makeModelIndexName("project", "contacts", "email", "uuid", false));
    assert.notEqual(first, makeModelIndexName("project", "contacts", "email", "string", true));
    assert.match(first, /^arsy_mi_[a-f0-9]{20}$/);
  });
});
