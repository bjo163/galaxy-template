import {
  dropRowLevelSecurityPolicy,
  enableRowLevelSecurity,
  type Knex,
} from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  const workspaceScope = {
    type: "setting-equals-column" as const,
    column: "workspace_id",
    setting: "arsy.workspace_id",
    valueType: "uuid" as const,
  };

  await enableRowLevelSecurity(knex, {
    table: "arsy_audit_events",
    name: "arsy_audit_events_workspace_visibility",
    command: "select",
    using: workspaceScope,
  });
}

export async function down(knex: Knex): Promise<void> {
  await dropRowLevelSecurityPolicy(
    knex,
    "arsy_audit_events",
    "arsy_audit_events_workspace_visibility",
  );
}
