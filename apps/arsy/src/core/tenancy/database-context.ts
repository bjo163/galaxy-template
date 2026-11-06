import { setTransactionSetting, type Knex } from "@galaxy/database";

export async function withWorkspaceTransaction<T>(
  knex: Knex,
  workspaceId: string,
  operation: (transaction: Knex.Transaction) => Promise<T>,
): Promise<T> {
  return knex.transaction(async (transaction) => {
    await setTransactionSetting(transaction, "arsy.workspace_id", workspaceId);

    return operation(transaction);
  });
}

export async function withAccountTransaction<T>(
  knex: Knex,
  accountId: string,
  operation: (transaction: Knex.Transaction) => Promise<T>,
): Promise<T> {
  return knex.transaction(async (transaction) => {
    await setTransactionSetting(transaction, "arsy.account_id", accountId);

    return operation(transaction);
  });
}

export async function withCredentialHashTransaction<T>(
  knex: Knex,
  credentialHash: string,
  operation: (transaction: Knex.Transaction) => Promise<T>,
): Promise<T> {
  return knex.transaction(async (transaction) => {
    await setTransactionSetting(
      transaction,
      "arsy.credential_hash",
      credentialHash,
    );

    return operation(transaction);
  });
}

export async function withProjectTransaction<T>(
  knex: Knex,
  workspaceId: string,
  projectId: string,
  operation: (transaction: Knex.Transaction) => Promise<T>,
): Promise<T> {
  return withWorkspaceTransaction(knex, workspaceId, async (transaction) => {
    await setTransactionSetting(transaction, "arsy.project_id", projectId);

    return operation(transaction);
  });
}
