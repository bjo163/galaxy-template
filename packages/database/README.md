# Galaxy database

`@galaxy/database` is the shared persistence foundation for Galaxy services.
Knex owns connections, SQL queries, and migrations; Objection owns typed models
and relations. `BaseModel` and `BaseRepository` provide the shared model,
timestamp, naming, and transaction conventions.

This package is for fixed, code-first application schemas. It does not provide
an Odoo-like runtime model registry, tenant-defined fields, dynamic record
authorization, or add-on lifecycle. Arsy's dynamic model catalog and record
API are separate application modules that use this package's Knex connection
without generating Objection classes per tenant. Track Arsy work status in the
[canonical GitHub issue register](https://github.com/bjo163/galaxy-template/issues/1).

## Adapters

- `pglite` runs an embedded PostgreSQL-compatible database for local
  development, tests, and single-process deployments. It uses a loopback-only
  PostgreSQL wire-protocol socket so the same Knex and Objection APIs are used.
  `dataDir` must point to a durable directory when data needs to survive
  restarts. Omitting it uses an ephemeral in-memory database.
- `postgres` connects to a PostgreSQL server using a connection string and is
  the intended adapter for horizontally scaled production services.

PGlite is not a drop-in replacement for a multi-node PostgreSQL cluster. Its
embedded execution and storage model need to be considered when sizing,
replicating, and backing up a deployment.

## Example

```ts
import { BaseModel, BaseRepository, createDatabase } from "@galaxy/database";

class Account extends BaseModel {
  static tableName = "accounts";

  id!: string;
  email!: string;
}

class AccountRepository extends BaseRepository<Account> {}

const database = await createDatabase({
  adapter: "pglite",
  dataDir: "./data/arsy",
});

database.bindModel(Account);
const accounts = new AccountRepository(Account, database.knex);

try {
  await database.knex.migrate.latest({ directory: "./migrations" });
  const account = await accounts.findById("account-id");
  await database.ping();
} finally {
  await database.close();
}
```

Services should own their migration directories and domain models. Keep
transactions explicit by passing a Knex transaction to repository methods:

```ts
await database.knex.transaction(async (transaction) => {
  await accounts.insert({ email: "person@example.com" }, transaction);
});
```

Use `getMigrationStatus` and `runMigrations` from this package to execute
compiled JavaScript migrations. The runner centralizes the migration history
and lock table names and enables transactions. Each service owns and versions
its own migrations.

This package does not replace PocketBase auth, access rules, file storage,
realtime subscriptions, or its admin UI. Migrate those capabilities only after
the product requirements and data export/import path are defined.
