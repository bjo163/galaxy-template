import { type Knex } from "knex";
import { Model } from "objection";
export type DatabaseOptions = {
    adapter: "pglite";
    dataDir?: string;
    maxConnections?: number;
} | {
    adapter: "postgres";
    connectionString: string;
    pool?: {
        min?: number;
        max?: number;
    };
};
export type GalaxyDatabase = {
    readonly knex: Knex;
    bindModel(modelClass: typeof Model): void;
    ping(): Promise<void>;
    close(): Promise<void>;
};
export declare function createDatabase(options: DatabaseOptions): Promise<GalaxyDatabase>;
