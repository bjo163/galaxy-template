import {
  enableRowLevelSecurity,
  type Knex,
} from "@galaxy/database";

const projectTables = [
  "arsy_project_users",
  "arsy_model_definitions",
  "arsy_model_revisions",
  "arsy_records",
  "arsy_addon_definitions",
  "arsy_addon_installations",
] as const;

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("arsy_accounts", (table) => {
    table.uuid("id").primary();
    table.string("email", 320).notNullable().unique();
    table.string("display_name", 120).notNullable();
    table.text("password_hash").notNullable();
    table.string("status", 24).notNullable().defaultTo("active");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
  });

  await knex.schema.createTable("arsy_sessions", (table) => {
    table.uuid("id").primary();
    table.uuid("account_id").notNullable()
      .references("id")
      .inTable("arsy_accounts")
      .onDelete("CASCADE");
    table.string("token_hash", 64).notNullable().unique();
    table.timestamp("expires_at", { useTz: true }).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.index(["account_id", "expires_at"]);
  });

  await knex.schema.createTable("arsy_workspaces", (table) => {
    table.uuid("id").primary();
    table.string("name", 120).notNullable();
    table.string("slug", 63).notNullable().unique();
    table.uuid("created_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
  });

  await knex.schema.createTable("arsy_workspace_members", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable()
      .references("id")
      .inTable("arsy_workspaces")
      .onDelete("CASCADE");
    table.uuid("account_id").notNullable()
      .references("id")
      .inTable("arsy_accounts")
      .onDelete("CASCADE");
    table.string("role", 24).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.unique(["workspace_id", "account_id"]);
    table.index(["account_id", "workspace_id"]);
  });

  await knex.schema.createTable("arsy_projects", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable()
      .references("id")
      .inTable("arsy_workspaces")
      .onDelete("CASCADE");
    table.string("name", 120).notNullable();
    table.string("slug", 63).notNullable();
    table.string("status", 24).notNullable().defaultTo("active");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.unique(["workspace_id", "slug"]);
    table.unique(["workspace_id", "id"]);
  });

  await knex.schema.createTable("arsy_project_users", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable()
      .references("id")
      .inTable("arsy_workspaces")
      .onDelete("CASCADE");
    table.uuid("project_id").notNullable();
    table.uuid("account_id").notNullable()
      .references("id")
      .inTable("arsy_accounts")
      .onDelete("CASCADE");
    table.string("role", 24).notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.unique(["project_id", "account_id"]);
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_project_credentials", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.string("label", 120).notNullable();
    table.string("key_prefix", 24).notNullable();
    table.string("key_hash", 64).notNullable().unique();
    table.jsonb("scopes").notNullable();
    table.uuid("created_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("expires_at", { useTz: true }).nullable();
    table.timestamp("revoked_at", { useTz: true }).nullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
    table.index(["workspace_id", "project_id", "revoked_at"]);
  });

  await knex.schema.createTable("arsy_model_definitions", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.string("model_key", 63).notNullable();
    table.string("display_name", 120).notNullable();
    table.integer("active_revision").nullable();
    table.string("status", 24).notNullable().defaultTo("active");
    table.uuid("created_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.unique(["project_id", "model_key"]);
    table.unique(["workspace_id", "project_id", "model_key"]);
    table.unique(["workspace_id", "project_id", "id"]);
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_model_revisions", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("definition_id").notNullable();
    table.integer("revision").notNullable();
    table.jsonb("definition").notNullable();
    table.string("status", 24).notNullable();
    table.string("content_hash", 64).notNullable();
    table.uuid("created_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.unique(["definition_id", "revision"]);
    table
      .foreign(["workspace_id", "project_id", "definition_id"])
      .references(["workspace_id", "project_id", "id"])
      .inTable("arsy_model_definitions")
      .onDelete("CASCADE");
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_records", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("definition_id").notNullable();
    table.string("model_key", 63).notNullable();
    table.uuid("owner_user_id").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.uuid("created_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.uuid("updated_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.integer("model_revision").notNullable();
    table.jsonb("payload").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
    table.index(["workspace_id", "project_id", "model_key", "id"]);
    table.index([
      "workspace_id",
      "project_id",
      "model_key",
      "owner_user_id",
    ]);
    table
      .foreign(["workspace_id", "project_id", "definition_id"])
      .references(["workspace_id", "project_id", "id"])
      .inTable("arsy_model_definitions")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_addon_definitions", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.string("addon_id", 160).notNullable();
    table.string("version", 32).notNullable();
    table.jsonb("manifest").notNullable();
    table.string("content_hash", 64).notNullable();
    table.string("status", 24).notNullable();
    table.uuid("created_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.unique(["project_id", "addon_id", "version"]);
    table.unique(["workspace_id", "project_id", "id"]);
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_addon_installations", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").notNullable();
    table.uuid("definition_id").notNullable();
    table.jsonb("granted_capabilities").notNullable();
    table.jsonb("configuration").notNullable();
    table.string("status", 24).notNullable();
    table.uuid("updated_by").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
    table.unique(["project_id", "definition_id"]);
    table
      .foreign(["workspace_id", "project_id", "definition_id"])
      .references(["workspace_id", "project_id", "id"])
      .inTable("arsy_addon_definitions")
      .onDelete("CASCADE");
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("arsy_audit_events", (table) => {
    table.uuid("id").primary();
    table.uuid("workspace_id").notNullable();
    table.uuid("project_id").nullable();
    table.uuid("actor_id").notNullable()
      .references("id")
      .inTable("arsy_accounts");
    table.string("action", 80).notNullable();
    table.string("resource_type", 80).notNullable();
    table.string("resource_id", 160).notNullable();
    table.jsonb("metadata").notNullable();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.index(["workspace_id", "created_at"]);
    table.index(["project_id", "created_at"]);
    table
      .foreign(["workspace_id", "project_id"])
      .references(["workspace_id", "id"])
      .inTable("arsy_projects")
      .onDelete("CASCADE");
  });

  for (const tableName of ["arsy_projects"] as const) {
    await enableRowLevelSecurity(knex, {
      table: tableName,
      name: `${tableName}_workspace_isolation`,
      using: {
        type: "setting-equals-column",
        column: "workspace_id",
        setting: "arsy.workspace_id",
        valueType: "uuid",
      },
      check: {
        type: "setting-equals-column",
        column: "workspace_id",
        setting: "arsy.workspace_id",
        valueType: "uuid",
      },
    });
  }

  for (const tableName of projectTables) {
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
      table: tableName,
      name: `${tableName}_project_isolation`,
      using: projectScope,
      check: projectScope,
    });
  }

  const auditScope = {
    type: "and" as const,
    expressions: [
      {
        type: "setting-equals-column" as const,
        column: "workspace_id",
        setting: "arsy.workspace_id",
        valueType: "uuid" as const,
      },
      {
        type: "or" as const,
        expressions: [
          { type: "column-is-null" as const, column: "project_id" },
          {
            type: "setting-equals-column" as const,
            column: "project_id",
            setting: "arsy.project_id",
            valueType: "uuid" as const,
          },
        ],
      },
    ],
  };
  await enableRowLevelSecurity(knex, {
    table: "arsy_audit_events",
    name: "arsy_audit_events_project_isolation",
    using: auditScope,
    check: auditScope,
  });
}

export async function down(knex: Knex): Promise<void> {
  const tables = [
    "arsy_audit_events",
    "arsy_addon_installations",
    "arsy_addon_definitions",
    "arsy_records",
    "arsy_model_revisions",
    "arsy_model_definitions",
    "arsy_project_credentials",
    "arsy_project_users",
    "arsy_projects",
    "arsy_workspace_members",
    "arsy_workspaces",
    "arsy_sessions",
    "arsy_accounts",
  ];

  for (const tableName of tables) {
    await knex.schema.dropTableIfExists(tableName);
  }
}
