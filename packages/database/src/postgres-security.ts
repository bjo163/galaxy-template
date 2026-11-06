import type { Knex } from "knex";

export type RowLevelSecurityExpression =
  | {
      type: "setting-equals-column";
      column: string;
      setting: string;
      valueType: "uuid" | "text";
    }
  | {
      type: "column-is-null";
      column: string;
    }
  | {
      type: "and" | "or";
      expressions: RowLevelSecurityExpression[];
    };

export type RowLevelSecurityPolicy = {
  table: string;
  name: string;
  using: RowLevelSecurityExpression;
  check: RowLevelSecurityExpression;
};

export async function enableRowLevelSecurity(
  knex: Knex,
  policy: RowLevelSecurityPolicy,
): Promise<void> {
  await knex.raw("ALTER TABLE ?? ENABLE ROW LEVEL SECURITY", [policy.table]);
  await knex.raw("ALTER TABLE ?? FORCE ROW LEVEL SECURITY", [policy.table]);
  await knex.raw(
    "CREATE POLICY ?? ON ?? USING (" +
      compileExpression(knex, policy.using) +
      ") WITH CHECK (" +
      compileExpression(knex, policy.check) +
      ")",
    [policy.name, policy.table],
  );
}

export async function disableRowLevelSecurity(
  knex: Knex,
  table: string,
  policyName: string,
): Promise<void> {
  await knex.raw("DROP POLICY ?? ON ??", [policyName, table]);
  await knex.raw("ALTER TABLE ?? NO FORCE ROW LEVEL SECURITY", [table]);
  await knex.raw("ALTER TABLE ?? DISABLE ROW LEVEL SECURITY", [table]);
}

function compileExpression(
  knex: Knex,
  expression: RowLevelSecurityExpression,
): string {
  switch (expression.type) {
    case "and":
    case "or": {
      if (expression.expressions.length === 0) {
        throw new Error("Row-security logical expressions must not be empty.");
      }

      return `(${expression.expressions
        .map((child) => compileExpression(knex, child))
        .join(expression.type === "and" ? " AND " : " OR ")})`;
    }
    case "column-is-null":
      return knex.raw("?? IS NULL", [expression.column]).toQuery();
    case "setting-equals-column":
      if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(expression.setting)) {
        throw new Error(
          "Row-security setting names must be safe PostgreSQL names.",
        );
      }

      return knex
        .raw(
          expression.valueType === "uuid"
            ? "?? = NULLIF(current_setting(?, true), '')::uuid"
            : "?? = NULLIF(current_setting(?, true), '')",
          [expression.column, expression.setting],
        )
        .toQuery();
  }
}

export async function setTransactionSetting(
  transaction: Knex.Transaction,
  name: string,
  value: string,
): Promise<void> {
  if (!/^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error("Transaction setting names must be safe PostgreSQL names.");
  }

  await transaction.raw("select set_config(?, ?, true)", [name, value]);
}

export async function provisionPostgresRoles(
  knex: Knex,
  passwords: { migrator: string; runtime: string },
): Promise<void> {
  if (!passwords.migrator || !passwords.runtime) {
    throw new Error("Migration and runtime role passwords are required.");
  }

  await ensureRole(knex, "arsy_migrator", passwords.migrator);
  await ensureRole(knex, "arsy_runtime", passwords.runtime);

  const [database] = await knex("pg_catalog.pg_database")
    .select("datname")
    .whereRaw("datname = current_database()");
  if (!database) {
    throw new Error("Could not identify the connected PostgreSQL database.");
  }

  await knex.raw("GRANT CONNECT ON DATABASE ?? TO ??, ??", [
    database.datname,
    "arsy_migrator",
    "arsy_runtime",
  ]);
  await knex.raw("GRANT USAGE, CREATE ON SCHEMA ?? TO ??", [
    "public",
    "arsy_migrator",
  ]);
  await knex.raw("GRANT USAGE ON SCHEMA ?? TO ??", [
    "public",
    "arsy_runtime",
  ]);
  await knex.raw("REVOKE CREATE ON SCHEMA ?? FROM PUBLIC", ["public"]);
  await knex.raw("REVOKE CREATE ON SCHEMA ?? FROM ??", [
    "public",
    "arsy_runtime",
  ]);
  await knex.raw("REVOKE CREATE, TEMPORARY ON DATABASE ?? FROM PUBLIC", [
    database.datname,
  ]);
  await knex.raw("REVOKE CREATE, TEMPORARY ON DATABASE ?? FROM ??", [
    database.datname,
    "arsy_runtime",
  ]);
  await knex.raw("REVOKE ?? FROM ??", ["arsy_migrator", "arsy_runtime"]);

  const tables = await knex("pg_catalog.pg_tables")
    .select("tablename")
    .where({ schemaname: "public" })
    .whereRaw("left(tablename, 5) = ?", ["arsy_"]);
  for (const { tablename } of tables) {
    await knex.raw("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE ?? TO ??", [
      `public.${tablename}`,
      "arsy_runtime",
    ]);
  }

  const sequences = await knex("information_schema.sequences")
    .select("sequence_name")
    .where({ sequence_schema: "public" })
    .whereRaw("left(sequence_name, 5) = ?", ["arsy_"]);
  for (const { sequence_name } of sequences) {
    await knex.raw("GRANT USAGE, SELECT ON SEQUENCE ?? TO ??", [
      `public.${sequence_name}`,
      "arsy_runtime",
    ]);
  }
}

async function ensureRole(
  knex: Knex,
  roleName: string,
  password: string,
): Promise<void> {
  const passwordLiteral = knex.raw("?", [password]).toQuery();
  const existingRole = await knex("pg_catalog.pg_roles")
    .select("rolname")
    .where({ rolname: roleName })
    .first();
  if (!existingRole) {
    await knex.raw(
      `CREATE ROLE ?? LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${passwordLiteral}`,
      [roleName],
    );
    return;
  }

  await knex.raw(
    `ALTER ROLE ?? WITH LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD ${passwordLiteral}`,
    [roleName],
  );
}
