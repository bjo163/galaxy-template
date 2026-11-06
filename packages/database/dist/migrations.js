const migrationConfig = (directory) => ({
    directory,
    extension: "js",
    loadExtensions: [".js"],
    tableName: "galaxy_migrations",
    schemaName: "public",
    disableTransactions: false,
});
export async function getMigrationStatus(knex, directory) {
    const [completed, pending] = await knex.migrate.list(migrationConfig(directory));
    return {
        completed: completed.map((migration) => migration.name),
        pending: pending.map((migration) => migration.file),
    };
}
export async function runMigrations(knex, directory, action) {
    const config = migrationConfig(directory);
    const [batch, applied] = action === "up"
        ? await knex.migrate.latest(config)
        : await knex.migrate.rollback(config);
    const status = await getMigrationStatus(knex, directory);
    return {
        batch: applied.length > 0 ? batch : null,
        ...status,
    };
}
//# sourceMappingURL=migrations.js.map