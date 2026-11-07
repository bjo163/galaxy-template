import type { Knex } from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`DROP POLICY IF EXISTS "arsy_workspaces_isolation" ON "arsy_workspaces"`);
  await knex.raw(`
    CREATE POLICY "arsy_workspaces_isolation"
    ON "arsy_workspaces"
    USING (
      "id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
      OR EXISTS (
        SELECT 1
        FROM "arsy_workspace_members" AS membership
        WHERE membership."workspace_id" = "arsy_workspaces"."id"
          AND membership."account_id" = NULLIF(current_setting('arsy.account_id', true), '')::uuid
      )
    )
    WITH CHECK (
      "id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP POLICY IF EXISTS "arsy_workspaces_isolation" ON "arsy_workspaces"`);
  await knex.raw(`
    CREATE POLICY "arsy_workspaces_isolation"
    ON "arsy_workspaces"
    USING (
      "id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
    )
    WITH CHECK (
      "id" = NULLIF(current_setting('arsy.workspace_id', true), '')::uuid
    )
  `);
}
