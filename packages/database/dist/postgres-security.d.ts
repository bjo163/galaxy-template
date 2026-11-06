import type { Knex } from "knex";
export type RowLevelSecurityExpression = {
    type: "setting-equals-column";
    column: string;
    setting: string;
    valueType: "uuid" | "text";
} | {
    type: "column-is-null";
    column: string;
} | {
    type: "and" | "or";
    expressions: RowLevelSecurityExpression[];
};
export type RowLevelSecurityPolicy = {
    table: string;
    name: string;
    using: RowLevelSecurityExpression;
    check: RowLevelSecurityExpression;
};
export declare function enableRowLevelSecurity(knex: Knex, policy: RowLevelSecurityPolicy): Promise<void>;
export declare function disableRowLevelSecurity(knex: Knex, table: string, policyName: string): Promise<void>;
export declare function setTransactionSetting(transaction: Knex.Transaction, name: string, value: string): Promise<void>;
export declare function provisionPostgresRoles(knex: Knex, passwords: {
    migrator: string;
    runtime: string;
}): Promise<void>;
