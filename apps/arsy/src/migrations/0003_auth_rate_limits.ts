import type { Knex } from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("arsy_auth_rate_limits", (table) => {
    table.uuid("id").primary();
    table.string("scope", 32).notNullable();
    table.string("key_hash", 64).notNullable();
    table.timestamp("window_started_at", { useTz: true }).notNullable();
    table.integer("attempts").notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.unique(["scope", "key_hash", "window_started_at"]);
    table.index(["window_started_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("arsy_auth_rate_limits");
}
