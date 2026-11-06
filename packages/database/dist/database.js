import { mkdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import knexFactory from "knex";
export async function createDatabase(options) {
    let pglite;
    let socketServer;
    let knex;
    try {
        if (options.adapter === "pglite") {
            if (options.dataDir) {
                await mkdir(options.dataDir, { recursive: true });
            }
            pglite = new PGlite(options.dataDir);
            await pglite.waitReady;
            socketServer = new PGLiteSocketServer({
                db: pglite,
                host: "127.0.0.1",
                port: 0,
                maxConnections: options.maxConnections ?? 1,
            });
            await socketServer.start();
            const port = Number(socketServer.getServerConn().split(":").at(-1));
            if (!Number.isInteger(port) || port < 1 || port > 65_535) {
                throw new Error("PGlite socket server did not expose a valid port");
            }
            knex = knexFactory({
                client: "pg",
                connection: {
                    host: "127.0.0.1",
                    port,
                    database: "postgres",
                    user: "postgres",
                    password: "postgres",
                    ssl: false,
                },
                pool: { min: 0, max: 1 },
            });
        }
        else {
            knex = knexFactory({
                client: "pg",
                connection: options.connectionString,
                pool: options.pool,
            });
        }
        await knex.raw("select 1");
        const databaseKnex = knex;
        let closed = false;
        return {
            knex: databaseKnex,
            bindModel(modelClass) {
                modelClass.knex(databaseKnex);
            },
            async ping() {
                await databaseKnex.raw("select 1");
            },
            async close() {
                if (closed) {
                    return;
                }
                closed = true;
                const closeErrors = await closeResources([
                    () => databaseKnex.destroy(),
                    () => socketServer?.stop(),
                    () => pglite?.close(),
                ]);
                if (closeErrors.length > 0) {
                    throw new AggregateError(closeErrors, "Database shutdown failed");
                }
            },
        };
    }
    catch (error) {
        const cleanupErrors = await closeResources([
            () => knex?.destroy(),
            () => socketServer?.stop(),
            () => pglite?.close(),
        ]);
        if (cleanupErrors.length > 0) {
            throw new AggregateError([error, ...cleanupErrors], "Database initialization and cleanup failed");
        }
        throw error;
    }
}
async function closeResources(actions) {
    const errors = [];
    for (const action of actions) {
        try {
            await action();
        }
        catch (error) {
            errors.push(error);
        }
    }
    return errors;
}
//# sourceMappingURL=database.js.map