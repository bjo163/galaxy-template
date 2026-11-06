import type { Knex } from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("arsy_shared_quota_buckets", (table) => {
    table.string("dimension", 16).notNullable();
    table.string("subject_hash", 64).notNullable();
    table.timestamp("window_started_at", { useTz: true }).notNullable();
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.bigInteger("request_count").notNullable();
    table.primary(["dimension", "subject_hash"]);
    table.index(["expires_at"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("arsy_shared_quota_buckets");
}
