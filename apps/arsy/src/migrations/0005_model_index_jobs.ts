import {
  disableRowLevelSecurity,
  enableRowLevelSecurity,
  type Knex,
} from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("arsy_model_index_jobs", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.string("model_key", 63).notNullable();
    table.integer("revision").notNullable();
    table.string("field_key", 63).notNullable();
    table.string("operation", 8).notNullable();
    table.string("index_name", 63).notNullable();
    table.boolean("is_unique").notNullable();
    table.string("state", 16).notNullable();
    table.integer("attempts").notNullable().defaultTo(0);
    table.string("last_error", 120).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.unique([
      "workspace_id",
      "project_id",
      "model_key",
      "revision",
      "field_key",
      "operation",
    ]);
    table.index(["workspace_id", "project_id", "model_key", "state"]);
  });

  const isolation = {
    type: "and" as const,
    expressions: [
      {
        type: "setting-equals-column" as const,
        column: "workspace_id",
        setting: "arsy.workspace_id",
        valueType: "uuid" as const,
      },
      {
        type: "setting-equals-column" as const,
        column: "project_id",
        setting: "arsy.project_id",
        valueType: "uuid" as const,
      },
    ],
  };
  await enableRowLevelSecurity(knex, {
    table: "arsy_model_index_jobs",
    name: "arsy_model_index_jobs_isolation",
    using: isolation,
    check: isolation,
  });
}

export async function down(knex: Knex): Promise<void> {
  await disableRowLevelSecurity(
    knex,
    "arsy_model_index_jobs",
    "arsy_model_index_jobs_isolation",
  );
  await knex.schema.dropTableIfExists("arsy_model_index_jobs");
}
