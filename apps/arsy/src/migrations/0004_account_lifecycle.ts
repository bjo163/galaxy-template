import {
  disableRowLevelSecurity,
  dropRowLevelSecurityPolicy,
  enableRowLevelSecurity,
  type Knex,
} from "@galaxy/database";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("arsy_accounts", (table) => {
    table.timestamp("email_verified_at", { useTz: true }).nullable();
  });
  await knex("arsy_accounts")
    .whereNull("email_verified_at")
    .update({ email_verified_at: knex.ref("created_at") });

  for (const tableName of [
    "arsy_email_verification_tokens",
    "arsy_password_reset_tokens",
  ] as const) {
    await knex.schema.createTable(tableName, (table) => {
      table.uuid("id").primary();
      table
        .uuid("account_id")
        .notNullable()
        .references("id")
        .inTable("arsy_accounts")
        .onDelete("CASCADE")
        .unique();
      table.string("token_hash", 64).notNullable().unique();
      table.timestamp("expires_at", { useTz: true }).notNullable();
      table.timestamp("created_at", { useTz: true }).notNullable();
      table.index(["account_id", "expires_at"]);
    });
  }

  await knex.schema.createTable("arsy_account_audit_events", (table) => {
    table.uuid("id").primary();
    table
      .uuid("account_id")
      .notNullable()
      .references("id")
      .inTable("arsy_accounts")
      .onDelete("CASCADE");
    table.string("action", 80).notNullable();
    table.string("resource_type", 80).notNullable();
    table.string("resource_id", 160).notNullable();
    table.jsonb("metadata").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.index(["account_id", "created_at"]);
  });

  await knex.schema.createTable("arsy_project_invitations", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.string("email", 320).notNullable();
    table.string("role", 24).notNullable();
    table.string("token_hash", 64).notNullable().unique();
    table
      .uuid("invited_by")
      .notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.timestamp("accepted_at", { useTz: true }).nullable();
    table.timestamp("revoked_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
    table.index(["workspace_id", "project_id", "email"]);
    table.index(["workspace_id", "project_id", "expires_at"]);
  });

  const projectScope = {
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
    table: "arsy_project_invitations",
    name: "arsy_project_invitations_project_or_token",
    using: {
      type: "or",
      expressions: [
        projectScope,
        {
          type: "setting-equals-column",
          column: "token_hash",
          setting: "arsy.invitation_token_hash",
          valueType: "text",
        },
      ],
    },
    check: projectScope,
  });

  const accountScope = {
    type: "setting-equals-column" as const,
    column: "account_id",
    setting: "arsy.account_id",
    valueType: "uuid" as const,
  };
  await enableRowLevelSecurity(knex, {
    table: "arsy_project_users",
    name: "arsy_project_users_account_visibility",
    command: "select",
    using: accountScope,
  });
}

export async function down(knex: Knex): Promise<void> {
  await dropRowLevelSecurityPolicy(
    knex,
    "arsy_project_users",
    "arsy_project_users_account_visibility",
  );
  await disableRowLevelSecurity(
    knex,
    "arsy_project_invitations",
    "arsy_project_invitations_project_or_token",
  );
  await knex.schema.dropTableIfExists("arsy_project_invitations");
  await knex.schema.dropTableIfExists("arsy_account_audit_events");
  await knex.schema.dropTableIfExists("arsy_password_reset_tokens");
  await knex.schema.dropTableIfExists("arsy_email_verification_tokens");
  await knex.schema.alterTable("arsy_accounts", (table) => {
    table.dropColumn("email_verified_at");
  });
}
