import {
  disableRowLevelSecurity,
  enableRowLevelSecurity,
  type Knex,
} from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await enableRowLevelSecurity(knex, {
    table: "arsy_workspaces",
    name: "arsy_workspaces_isolation",
    using: {
      type: "setting-equals-column",
      column: "id",
      setting: "arsy.workspace_id",
      valueType: "uuid",
    },
    check: {
      type: "setting-equals-column",
      column: "id",
      setting: "arsy.workspace_id",
      valueType: "uuid",
    },
  });

  await enableRowLevelSecurity(knex, {
    table: "arsy_workspace_members",
    name: "arsy_workspace_members_isolation",
    using: {
      type: "or",
      expressions: [
        {
          type: "setting-equals-column",
          column: "workspace_id",
          setting: "arsy.workspace_id",
          valueType: "uuid",
        },
        {
          type: "setting-equals-column",
          column: "account_id",
          setting: "arsy.account_id",
          valueType: "uuid",
        },
      ],
    },
    check: {
      type: "setting-equals-column",
      column: "workspace_id",
      setting: "arsy.workspace_id",
      valueType: "uuid",
    },
  });

  await enableRowLevelSecurity(knex, {
    table: "arsy_project_credentials",
    name: "arsy_project_credentials_isolation",
    using: {
      type: "or",
      expressions: [
        {
          type: "and",
          expressions: [
            {
              type: "setting-equals-column",
              column: "workspace_id",
              setting: "arsy.workspace_id",
              valueType: "uuid",
            },
            {
              type: "setting-equals-column",
              column: "project_id",
              setting: "arsy.project_id",
              valueType: "uuid",
            },
          ],
        },
        {
          type: "setting-equals-column",
          column: "key_hash",
          setting: "arsy.credential_hash",
          valueType: "text",
        },
      ],
    },
    check: {
      type: "and",
      expressions: [
        {
          type: "setting-equals-column",
          column: "workspace_id",
          setting: "arsy.workspace_id",
          valueType: "uuid",
        },
        {
          type: "setting-equals-column",
          column: "project_id",
          setting: "arsy.project_id",
          valueType: "uuid",
        },
      ],
    },
  });
}

export async function down(knex: Knex): Promise<void> {
  await disableRowLevelSecurity(
    knex,
    "arsy_project_credentials",
    "arsy_project_credentials_isolation",
  );
  await disableRowLevelSecurity(
    knex,
    "arsy_workspace_members",
    "arsy_workspace_members_isolation",
  );
  await disableRowLevelSecurity(
    knex,
    "arsy_workspaces",
    "arsy_workspaces_isolation",
  );
}
