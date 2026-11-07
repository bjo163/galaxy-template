import type { Knex } from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("arsy_model_migration_jobs", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("definition_id").notNullable();
    table.integer("from_revision").nullable();
    table.integer("to_revision").notNullable();
    table.string("status", 24).notNullable().defaultTo("queued");
    table.string("change_class", 24).notNullable();
    table.jsonb("plan").notNullable();
    table.uuid("last_record_id").nullable();
    table.bigInteger("total_records").notNullable().defaultTo(0);
    table.bigInteger("processed_records").notNullable().defaultTo(0);
    table.bigInteger("failed_records").notNullable().defaultTo(0);
    table.text("last_error").nullable();
    table.uuid("created_by").notNullable().references("id").inTable("arsy_accounts");
    table.timestamp("started_at", { useTz: true }).nullable();
    table.timestamp("completed_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"]).inTable("arsy_projects").onDelete("CASCADE");
    table.foreign(["workspace_id", "project_id", "definition_id"])
      .references(["workspace_id", "project_id", "id"])
      .inTable("arsy_model_definitions").onDelete("CASCADE");
    table.index(["status", "created_at"]);
    table.index(["workspace_id", "project_id", "definition_id", "created_at"]);
    table.check("?? IN ('queued', 'running', 'failed', 'ready', 'cancelled')", ["status"]);
    table.check("?? IN ('compatible', 'conditional', 'breaking')", ["change_class"]);
    table.check("?? >= 0 AND ?? >= 0 AND ?? >= 0", ["total_records", "processed_records", "failed_records"]);
  });

  await knex.schema.createTable("arsy_model_migration_records", (table) => {
    table.uuid("job_id").notNullable();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("record_id").notNullable();
    table.jsonb("payload").notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.primary(["job_id", "record_id"]);
    table.foreign("job_id").references("id").inTable("arsy_model_migration_jobs").onDelete("CASCADE");
    table.foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"]).inTable("arsy_projects").onDelete("CASCADE");
    table.foreign("record_id").references("id").inTable("arsy_records").onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_model_index_jobs", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("definition_id").notNullable();
    table.string("model_key", 63).notNullable();
    table.integer("revision").notNullable();
    table.boolean("is_unique").notNullable().defaultTo(false);
    table.string("field_key", 63).notNullable();
    table.string("field_type", 24).notNullable();
    table.string("index_name", 63).notNullable().unique();
    table.string("operation", 16).notNullable();
    table.string("status", 24).notNullable().defaultTo("requested");
    table.integer("attempts").notNullable().defaultTo(0);
    table.text("last_error").nullable();
    table.uuid("created_by").notNullable().references("id").inTable("arsy_accounts");
    table.timestamp("started_at", { useTz: true }).nullable();
    table.timestamp("completed_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"]).inTable("arsy_projects").onDelete("CASCADE");
    table.foreign(["workspace_id", "project_id", "definition_id"])
      .references(["workspace_id", "project_id", "id"])
      .inTable("arsy_model_definitions").onDelete("CASCADE");
    table.index(["status", "created_at"]);
    table.index(["workspace_id", "project_id", "definition_id", "revision"]);
    table.check("?? IN ('create', 'drop')", ["operation"]);
    table.check("?? IN ('requested', 'building', 'ready', 'failed', 'retiring', 'removed')", ["status"]);
  });

  for (const tableName of ["arsy_model_migration_jobs", "arsy_model_migration_records", "arsy_model_index_jobs"] as const) {
    await knex.raw(`ALTER TABLE "${tableName}" ENABLE ROW LEVEL SECURITY`);
    await knex.raw(`ALTER TABLE "${tableName}" FORCE ROW LEVEL SECURITY`);
    await knex.raw(`
      CREATE POLICY "${tableName}_project_isolation"
      ON "${tableName}"
      USING (
        (
          "workspace_id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
          AND "project_id" = NULLIF(current_setting('arsy.project_id', true), '')::uuid
        )
        OR current_user = 'arsy_migrator'
      )
      WITH CHECK (
        (
          "workspace_id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
          AND "project_id" = NULLIF(current_setting('arsy.project_id', true), '')::uuid
        )
        OR current_user = 'arsy_migrator'
      )
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of ["arsy_model_index_jobs", "arsy_model_migration_records", "arsy_model_migration_jobs"] as const) {
    await knex.raw(`DROP POLICY IF EXISTS "${tableName}_project_isolation" ON "${tableName}"`);
    await knex.raw(`ALTER TABLE "${tableName}" DISABLE ROW LEVEL SECURITY`);
    await knex.schema.dropTableIfExists(tableName);
  }
}
