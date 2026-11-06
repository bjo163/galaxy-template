import { createDatabase, provisionPostgresRoles } from "@galaxy/database";

const adminConnectionString = process.env.ARSY_POSTGRES_ADMIN_URL?.trim();
const migratorPassword = process.env.ARSY_MIGRATOR_PASSWORD;
const runtimePassword = process.env.ARSY_RUNTIME_PASSWORD;

if (!adminConnectionString) {
  throw new Error("ARSY_POSTGRES_ADMIN_URL is required.");
}
if (!migratorPassword || !runtimePassword) {
  throw new Error(
    "ARSY_MIGRATOR_PASSWORD and ARSY_RUNTIME_PASSWORD are required.",
  );
}

const database = await createDatabase({
  adapter: "postgres",
  connectionString: adminConnectionString,
});

try {
  await provisionPostgresRoles(database.knex, {
    migrator: migratorPassword,
    runtime: runtimePassword,
  });
  console.log("PostgreSQL migration and runtime roles are configured.");
} finally {
  await database.close();
}
