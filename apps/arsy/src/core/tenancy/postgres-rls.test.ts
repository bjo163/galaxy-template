import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { it } from "node:test";

import { createDatabase, setTransactionSetting } from "@galaxy/database";

import { loadConfig } from "../../config/env.js";
import { createApp } from "../../app.js";
import {
  withAccountTransaction,
  withProjectTransaction,
  withWorkspaceTransaction,
} from "./database-context.js";
import { CapturingEmailDelivery } from "../../testing/fake-email-delivery.js";

const connectionString = process.env.ARSY_POSTGRES_TEST_URL;
const tenantTables = [
  "arsy_workspaces",
  "arsy_workspace_members",
  "arsy_projects",
  "arsy_project_users",
  "arsy_project_invitations",
  "arsy_project_credentials",
  "arsy_model_definitions",
  "arsy_model_revisions",
  "arsy_records",
  "arsy_addon_definitions",
  "arsy_addon_installations",
  "arsy_audit_events",
];

it(
  "enforces project RLS for a non-owner PostgreSQL runtime role",
  { skip: !connectionString },
  async () => {
    const emailDelivery = new CapturingEmailDelivery();
    const app = createApp(
      loadConfig({
        ...process.env,
        NODE_ENV: "test",
        DATABASE_ADAPTER: "postgres",
        DATABASE_URL: connectionString,
        LOG_LEVEL: "silent",
      }),
      { emailDelivery },
    );
    let poolDatabase: Awaited<ReturnType<typeof createDatabase>> | undefined;
    const accountId = randomUUID();
    const workspaceId = randomUUID();
    const projectId = randomUUID();
    const otherProjectId = randomUUID();
    const otherWorkspaceId = randomUUID();
    const otherWorkspaceProjectId = randomUUID();
    const definitionId = randomUUID();
    const accountIds = [accountId];
    const workspaceIds = [workspaceId, otherWorkspaceId];

    try {
      await app.ready();
      assert.ok(app.database);
      const knex = app.database.knex;
      poolDatabase = await createDatabase({
        adapter: "postgres",
        connectionString,
        pool: { min: 0, max: 1 },
      });

      const role = await knex.raw(
        `SELECT r.rolsuper, r.rolbypassrls, r.rolcreatedb, r.rolcreaterole,
          pg_has_schema_privilege(current_user, 'public', 'CREATE') AS can_create_schema,
          pg_has_database_privilege(current_user, current_database(), 'CREATE') AS can_create_database,
          pg_has_role(current_user, 'arsy_migrator', 'MEMBER') AS can_assume_migrator,
          c.relowner = r.oid AS owns_tenant_table
        FROM pg_roles r
        JOIN pg_class c ON c.relname = 'arsy_projects'
        JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
        WHERE r.rolname = current_user`,
      );
      assert.equal(role.rows.length, 1);
      assert.equal(role.rows[0].rolsuper, false);
      assert.equal(role.rows[0].rolbypassrls, false);
      assert.equal(role.rows[0].rolcreatedb, false);
      assert.equal(role.rows[0].rolcreaterole, false);
      assert.equal(role.rows[0].can_create_schema, false);
      assert.equal(role.rows[0].can_create_database, false);
      assert.equal(role.rows[0].can_assume_migrator, false);
      assert.equal(role.rows[0].owns_tenant_table, false);

      const rlsStatus = await knex("pg_class as c")
        .join("pg_namespace as n", "n.oid", "c.relnamespace")
        .join("pg_roles as r", "r.oid", "c.relowner")
        .where("n.nspname", "public")
        .whereIn("c.relname", tenantTables)
        .select(
          "c.relname",
          "c.relrowsecurity",
          "c.relforcerowsecurity",
          knex.raw("r.rolname = current_user AS is_runtime_owner"),
        );
      assert.equal(rlsStatus.length, tenantTables.length);
      assert.ok(
        rlsStatus.every(
          (table) =>
            table.relrowsecurity === true &&
            table.relforcerowsecurity === true &&
            table.is_runtime_owner === false,
        ),
      );

      const now = new Date();

      await knex("arsy_accounts").insert({
        id: accountId,
        email: `${accountId}@example.test`,
        display_name: "RLS test",
        password_hash: "test-only",
        status: "active",
        created_at: now,
        updated_at: now,
      });
      await withWorkspaceTransaction(knex, workspaceId, async (trx) => {
        await trx("arsy_workspaces").insert({
          id: workspaceId,
          name: "RLS test",
          slug: `rls-${accountId.slice(0, 8)}`,
          created_by: accountId,
          created_at: now,
          updated_at: now,
        });
        await trx("arsy_workspace_members").insert({
          id: randomUUID(),
          workspace_id: workspaceId,
          account_id: accountId,
          role: "owner",
          created_at: now,
        });
      });

      await withProjectTransaction(knex, workspaceId, projectId, async (trx) => {
        await trx("arsy_projects").insert({
          id: projectId,
          workspace_id: workspaceId,
          name: "RLS test",
          slug: "rls-test",
          status: "active",
          created_at: now,
          updated_at: now,
        });
        await trx("arsy_addon_definitions").insert({
          id: definitionId,
          workspace_id: workspaceId,
          project_id: projectId,
          addon_id: "com.example.rls",
          version: "1.0.0",
          manifest: JSON.stringify({ id: "com.example.rls" }),
          content_hash: "0".repeat(64),
          status: "draft",
          created_by: accountId,
          created_at: now,
        });
      });
      await withWorkspaceTransaction(
        knex,
        otherWorkspaceId,
        async (trx) => {
          await trx("arsy_workspaces").insert({
            id: otherWorkspaceId,
            name: "Other workspace",
            slug: `other-${accountId.slice(0, 8)}`,
            created_by: accountId,
            created_at: now,
            updated_at: now,
          });
          await trx("arsy_workspace_members").insert({
            id: randomUUID(),
            workspace_id: otherWorkspaceId,
            account_id: accountId,
            role: "owner",
            created_at: now,
          });
        },
      );
      await withProjectTransaction(
        knex,
        otherWorkspaceId,
        otherWorkspaceProjectId,
        (trx) =>
          trx("arsy_projects").insert({
            id: otherWorkspaceProjectId,
            workspace_id: otherWorkspaceId,
            name: "Other workspace",
            slug: "other-project",
            status: "active",
            created_at: now,
            updated_at: now,
          }),
      );

      assert.deepEqual(
        await knex("arsy_workspaces").select("id").where({ id: workspaceId }),
        [],
      );
      assert.deepEqual(
        await knex("arsy_workspace_members")
          .select("id")
          .where({ workspace_id: workspaceId }),
        [],
      );
      assert.deepEqual(
        await knex("arsy_projects").select("id").where({ id: projectId }),
        [],
      );
      const emptyContext = await knex.transaction(async (trx) => {
        await setTransactionSetting(trx, "arsy.workspace_id", "");
        await setTransactionSetting(trx, "arsy.project_id", "");
        return trx("arsy_projects").select("id");
      });
      assert.deepEqual(emptyContext, []);
      const withoutContext = await knex("arsy_addon_definitions")
        .select("id")
        .where({ id: definitionId });
      assert.deepEqual(withoutContext, []);

      const ownMembership = await withAccountTransaction(
        knex,
        accountId,
        (trx) =>
          trx("arsy_workspace_members")
            .select("id")
            .where({ workspace_id: workspaceId, account_id: accountId }),
      );
      assert.equal(ownMembership.length, 1);

      await assert.rejects(
        knex("arsy_workspaces").insert({
          id: randomUUID(),
          name: "Unscoped workspace",
          slug: `unscoped-${randomUUID().slice(0, 8)}`,
          created_by: accountId,
          created_at: now,
          updated_at: now,
        }),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "42501",
      );

      const withOtherProject = await knex.transaction(async (trx) => {
        await setTransactionSetting(trx, "arsy.workspace_id", workspaceId);
        await setTransactionSetting(trx, "arsy.project_id", otherProjectId);
        return trx("arsy_addon_definitions")
          .select("id")
          .where({ id: definitionId });
      });
      assert.deepEqual(withOtherProject, []);

      const withOtherWorkspace = await knex.transaction(async (trx) => {
        await setTransactionSetting(
          trx,
          "arsy.workspace_id",
          otherWorkspaceId,
        );
        await setTransactionSetting(trx, "arsy.project_id", projectId);
        return trx("arsy_addon_definitions")
          .select("id")
          .where({ id: definitionId });
      });
      assert.deepEqual(withOtherWorkspace, []);

      await assert.rejects(
        knex.transaction(async (trx) => {
          await setTransactionSetting(
            trx,
            "arsy.workspace_id",
            otherWorkspaceId,
          );
          await setTransactionSetting(
            trx,
            "arsy.project_id",
            otherWorkspaceProjectId,
          );
          await trx("arsy_addon_definitions").insert({
            id: randomUUID(),
            workspace_id: workspaceId,
            project_id: projectId,
            addon_id: "com.example.cross-tenant",
            version: "1.0.0",
            manifest: JSON.stringify({ id: "com.example.cross-tenant" }),
            content_hash: "2".repeat(64),
            status: "draft",
            created_by: accountId,
            created_at: now,
          });
        }),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "42501",
      );

      await assert.rejects(
        knex.transaction(async (trx) => {
          await setTransactionSetting(trx, "arsy.workspace_id", workspaceId);
          await setTransactionSetting(trx, "arsy.project_id", otherProjectId);
          await trx("arsy_addon_definitions").insert({
            id: randomUUID(),
            workspace_id: workspaceId,
            project_id: projectId,
            addon_id: "com.example.forbidden",
            version: "1.0.0",
            manifest: JSON.stringify({ id: "com.example.forbidden" }),
            content_hash: "1".repeat(64),
            status: "draft",
            created_by: accountId,
            created_at: now,
          });
        }),
        (error: unknown) =>
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "42501",
      );

      assert.ok(poolDatabase);
      const afterSuccessfulTransaction = await withProjectTransaction(
        poolDatabase.knex,
        workspaceId,
        projectId,
        (trx) => trx("arsy_projects").select("id").where({ id: projectId }),
      );
      assert.equal(afterSuccessfulTransaction.length, 1);
      assert.deepEqual(
        await poolDatabase.knex("arsy_projects").select("id"),
        [],
      );
      await assert.rejects(
        withProjectTransaction(
          poolDatabase.knex,
          workspaceId,
          projectId,
          async (trx) => {
            await trx("arsy_projects").select("id").where({ id: projectId });
            throw new Error("forced transaction failure");
          },
        ),
        /forced transaction failure/,
      );
      assert.deepEqual(
        await poolDatabase.knex("arsy_projects").select("id"),
        [],
      );

      const owner = await registerAccount(
        app,
        emailDelivery,
        `rls-owner-${randomUUID()}@example.test`,
      );
      const member = await registerAccount(
        app,
        emailDelivery,
        `rls-member-${randomUUID()}@example.test`,
      );
      accountIds.push(owner.accountId, member.accountId);

      const workspaceResponse = await app.inject({
        method: "POST",
        url: "/api/v1/workspaces",
        headers: { authorization: `Bearer ${owner.accessToken}` },
        payload: {
          name: "RLS API workspace",
          slug: `rls-api-${randomUUID().slice(0, 8)}`,
        },
      });
      assert.equal(workspaceResponse.statusCode, 201, workspaceResponse.body);
      const apiWorkspaceId = workspaceResponse.json().id as string;
      workspaceIds.push(apiWorkspaceId);

      const projectResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${apiWorkspaceId}/projects`,
        headers: { authorization: `Bearer ${owner.accessToken}` },
        payload: { name: "RLS API project", slug: "rls-api-project" },
      });
      assert.equal(projectResponse.statusCode, 201, projectResponse.body);
      const apiProjectId = projectResponse.json().id as string;
      const workspaceCredentialHeaders = {
        authorization: `Bearer ${owner.accessToken}`,
      };

      const memberAccount = await knex("arsy_accounts")
        .select("email")
        .where({ id: member.accountId })
        .first();
      assert.ok(memberAccount);
      const acceptedMemberResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${apiWorkspaceId}/projects/${apiProjectId}/invitations`,
        headers: { authorization: `Bearer ${owner.accessToken}` },
        payload: { email: memberAccount.email as string, role: "member" },
      });
      assert.equal(
        acceptedMemberResponse.statusCode,
        201,
        acceptedMemberResponse.body,
      );
      const invitationAcceptanceResponse = await app.inject({
        method: "POST",
        url: "/api/v1/invitations/accept",
        headers: { authorization: `Bearer ${member.accessToken}` },
        payload: { token: emailDelivery.tokenFor("accept-invitation") },
      });
      assert.equal(
        invitationAcceptanceResponse.statusCode,
        200,
        invitationAcceptanceResponse.body,
      );

      const credentialResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${apiWorkspaceId}/projects/${apiProjectId}/credentials`,
        headers: { authorization: `Bearer ${owner.accessToken}` },
        payload: {
          label: "RLS integration",
          scopes: ["models:manage", "records:read", "records:write"],
        },
      });
      assert.equal(credentialResponse.statusCode, 201, credentialResponse.body);
      const credentialId = credentialResponse.json().id as string;
      assert.deepEqual(
        await knex("arsy_project_credentials")
          .select("id")
          .where({ id: credentialId }),
        [],
      );
      const visibleCredential = await withProjectTransaction(
        knex,
        apiWorkspaceId,
        apiProjectId,
        (trx) =>
          trx("arsy_project_credentials")
            .select("id")
            .where({ id: credentialId }),
      );
      assert.equal(visibleCredential.length, 1);
      const projectCredential = credentialResponse.json().secret as string;
      const projectCredentialHeaders = {
        authorization: `Bearer ${projectCredential}`,
      };
      const modelUrl =
        `/api/v1/workspaces/${apiWorkspaceId}/projects/${apiProjectId}/models`;
      const modelResponse = await app.inject({
        method: "POST",
        url: modelUrl,
        headers: projectCredentialHeaders,
        payload: {
          key: "private_notes",
          displayName: "Private notes",
          fields: [{ key: "body", type: "string", required: true }],
          access: { defaultVisibility: "private" },
        },
      });
      assert.equal(modelResponse.statusCode, 201, modelResponse.body);

      const publishResponse = await app.inject({
        method: "POST",
        url: `${modelUrl}/private_notes/publish`,
        headers: projectCredentialHeaders,
        payload: { revision: 1 },
      });
      assert.equal(publishResponse.statusCode, 200, publishResponse.body);

      const ownerRecordResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/private_notes",
        headers: projectCredentialHeaders,
        payload: { body: "private record" },
      });
      assert.equal(ownerRecordResponse.statusCode, 201, ownerRecordResponse.body);

      const privateRecordId = ownerRecordResponse.json().id as string;
      const privateRecordRead = await app.inject({
        method: "GET",
        url: `/api/v1/data/private_notes/${privateRecordId}`,
        headers: {
          authorization: `Bearer ${member.accessToken}`,
          "x-arsy-workspace-id": apiWorkspaceId,
          "x-arsy-project-id": apiProjectId,
        },
      });
      assert.equal(privateRecordRead.statusCode, 404);
    } finally {
      await poolDatabase?.close();
      if (
        app.database &&
        (await app.database.knex.schema.hasTable("arsy_workspaces"))
      ) {
        for (const id of workspaceIds) {
          await withWorkspaceTransaction(
            app.database.knex,
            id,
            (trx) => trx("arsy_workspaces").where({ id }).delete(),
          );
        }
        await app.database.knex("arsy_accounts")
          .whereIn("id", accountIds)
          .delete();
      }
      await app.close();
    }
  },
);

async function registerAccount(
  app: ReturnType<typeof createApp>,
  emailDelivery: CapturingEmailDelivery,
  email: string,
): Promise<{ accessToken: string; accountId: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email,
      displayName: "RLS integration",
      password: "rls-integration-password",
    },
  });
  assert.equal(response.statusCode, 202, response.body);
  const verification = await app.inject({
    method: "POST",
    url: "/api/v1/auth/email-verification/confirm",
    payload: { token: emailDelivery.tokenFor("verify-email") },
  });
  assert.equal(verification.statusCode, 200, verification.body);
  const body = verification.json() as {
    accessToken: string;
    account: { id: string };
  };
  return { accessToken: body.accessToken, accountId: body.account.id };
}
