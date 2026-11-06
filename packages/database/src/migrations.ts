import type { Knex } from "knex";

export type MigrationAction = "up" | "down" | "status";

export type MigrationStatus = {
  completed: string[];
  pending: string[];
};

export type MigrationResult = MigrationStatus & {
  batch: number | null;
};

const migrationConfig = (directory: string): Knex.MigratorConfig => ({
  directory,
  extension: "js",
  loadExtensions: [".js"],
  tableName: "galaxy_migrations",
  schemaName: "public",
  disableTransactions: false,
});

export async function getMigrationStatus(
  knex: Knex,
  directory: string,
): Promise<MigrationStatus> {
  const [completed, pending] = await knex.migrate.list(
    migrationConfig(directory),
  );

  return {
    completed: completed.map((migration: { name: string }) => migration.name),
    pending: pending.map((migration: { file: string }) => migration.file),
  };
}

export async function runMigrations(
  knex: Knex,
  directory: string,
  action: Exclude<MigrationAction, "status">,
): Promise<MigrationResult> {
  const config = migrationConfig(directory);
  const [batch, applied] =
    action === "up"
      ? await knex.migrate.latest(config)
      : await knex.migrate.rollback(config);
  const status = await getMigrationStatus(knex, directory);

  return {
    batch: applied.length > 0 ? batch : null,
    ...status,
  };
}
