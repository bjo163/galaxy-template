# Arsy database migrations

Add one TypeScript migration per schema change in this directory. Use a
zero-padded sequential prefix and named `up`/`down` exports:

```ts
import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("example_records", (table) => {
    table.increments("id").primary();
    table.timestamp("created_at", { useTz: true }).notNullable();
    table.timestamp("updated_at", { useTz: true }).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("example_records");
}
```

Migrations run in transactions and use the shared `galaxy_migrations` history
and lock tables. Keep each migration reversible and avoid editing a migration
after it has been applied to a shared environment.
