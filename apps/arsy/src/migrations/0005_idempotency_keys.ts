import type { Knex } from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("arsy_idempotency_keys", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("actor_id").notNullable();
    table.string("method", 8).notNullable();
    table.string("route_key", 160).notNullable();
    table.string("key_hash", 64).notNullable();
    table.string("request_hash", 64).notNullable();
    table.integer("response_status").nullable();
    table.jsonb("response_body").nullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.unique([
      "workspace_id",
      "project_id",
      "actor_id",
      "method",
      "route_key",
      "key_hash",
    ]);
    table.index(["expires_at"]);
  });

  await knex.raw(`ALTER TABLE "arsy_idempotency_keys" ENABLE ROW LEVEL SECURITY`);
  await knex.raw(`ALTER TABLE "arsy_idempotency_keys" FORCE ROW LEVEL SECURITY`);
  await knex.raw(`
    CREATE POLICY "arsy_idempotency_keys_isolation"
    ON "arsy_idempotency_keys"
    USING (
      (
        "workspace_id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
        AND "project_id" = NULLIF(current_setting('arsy.project_id', true), '')::uuid
      )
      OR current_user = 'arsy_migrator'
    )
    WITH CHECK (
      "workspace_id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
      AND "project_id" = NULLIF(current_setting('arsy.project_id', true), '')::uuid
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP POLICY IF EXISTS "arsy_idempotency_keys_isolation" ON "arsy_idempotency_keys"`);
  await knex.raw(`ALTER TABLE "arsy_idempotency_keys" DISABLE ROW LEVEL SECURITY`);
  await knex.schema.dropTableIfExists("arsy_idempotency_keys");
}
