import type { Knex } from "knex";
export type MigrationAction = "up" | "down" | "status";
export type MigrationStatus = {
    completed: string[];
    pending: string[];
};
export type MigrationResult = MigrationStatus & {
    batch: number | null;
};
export declare function getMigrationStatus(knex: Knex, directory: string): Promise<MigrationStatus>;
export declare function runMigrations(knex: Knex, directory: string, action: Exclude<MigrationAction, "status">): Promise<MigrationResult>;
