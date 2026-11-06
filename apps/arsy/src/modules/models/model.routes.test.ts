import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp } from "../../app.js";
import { loadConfig } from "../../config/env.js";
import { up as migrateControlPlane } from "../../migrations/0001_arsy_control_plane.js";
import { up as migrateAuthRateLimits } from "../../migrations/0003_auth_rate_limits.js";
import { up as migrateIdempotency } from "../../migrations/0006_idempotency_keys.js";

describe("Arsy model and data API", () => {
  it("publishes tenant-scoped models and validates record CRUD and filters", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);
      await migrateIdempotency(app.database.knex);
      const owner = await register(app, "model-owner@example.com");
      const workspace = await createWorkspace(app, owner.accessToken);
      const project = await createProject(app, owner.accessToken, workspace.id);
      const credential = await createCredential(
        app,
        owner.accessToken,
        workspace.id,
        project.id,
        ["models:read", "models:manage", "records:read", "records:write"],
      );
      const managementHeaders = {
        authorization: `Bearer ${owner.accessToken}`,
      };
      const modelUrl = `/api/v1/workspaces/${workspace.id}/projects/${project.id}/models`;
      const definition = {
        key: "contacts",
        displayName: "Contacts",
        fields: [
          {
            key: "name",
            type: "string",
            required: true,
            indexed: true,
            unique: true,
          },
          {
            key: "score",
            type: "integer",
            required: true,
            indexed: true,
            minimum: 0,
            maximum: 100,
          },
        ],
        access: { defaultVisibility: "project" },
      };

      const modelResponse = await app.inject({
        method: "POST",
        url: modelUrl,
        headers: managementHeaders,
        payload: definition,
      });
      assert.equal(modelResponse.statusCode, 201, modelResponse.body);
      const model = modelResponse.json() as { id: string; draftRevision: { revision: number } };

      const publishResponse = await app.inject({
        method: "POST",
        url: `${modelUrl}/contacts/publish`,
        headers: managementHeaders,
        payload: { revision: 1 },
      });
      assert.equal(publishResponse.statusCode, 200, publishResponse.body);
      assert.equal(publishResponse.json().revision, 1);

      const modelListResponse = await app.inject({
        method: "GET",
        url: modelUrl,
        headers: managementHeaders,
      });
      assert.equal(modelListResponse.statusCode, 200);
      assert.equal(modelListResponse.json().data[0].activeRevision, 1);

      const dataHeaders = {
        authorization: `Bearer ${credential.secret}`,
      };
      const recordResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts",
        headers: { ...dataHeaders, "idempotency-key": "contact-create-0000000001" },
        payload: { name: "Ada", score: 42 },
      });
      assert.equal(recordResponse.statusCode, 201, recordResponse.body);
      const record = recordResponse.json() as { id: string; name: string };
      assert.equal(record.name, "Ada");

      const compatibleRevision = await app.inject({
        method: "POST",
        url: `${modelUrl}/contacts/revisions`,
        headers: managementHeaders,
        payload: {
          ...definition,
          fields: [
            ...definition.fields,
            { key: "source", type: "string", required: false, default: "legacy" },
          ],
        },
      });
      assert.equal(compatibleRevision.statusCode, 201, compatibleRevision.body);
      const compatiblePublish = await app.inject({
        method: "POST",
        url: `${modelUrl}/contacts/publish`,
        headers: managementHeaders,
        payload: { revision: 2 },
      });
      assert.equal(compatiblePublish.statusCode, 200, compatiblePublish.body);
      const backfilledRecord = await app.inject({
        method: "GET",
        url: `/api/v1/data/contacts/${record.id}`,
        headers: dataHeaders,
      });
      assert.equal(backfilledRecord.statusCode, 200, backfilledRecord.body);
      assert.equal(backfilledRecord.json().source, "legacy");

      const breakingRevision = await app.inject({
        method: "POST",
        url: `${modelUrl}/contacts/revisions`,
        headers: managementHeaders,
        payload: {
          ...definition,
          fields: [
            ...definition.fields,
            { key: "required_new", type: "string", required: true },
          ],
        },
      });
      assert.equal(breakingRevision.statusCode, 201, breakingRevision.body);
      const blockedPublish = await app.inject({
        method: "POST",
        url: `${modelUrl}/contacts/publish`,
        headers: managementHeaders,
        payload: { revision: 3 },
      });
      assert.equal(blockedPublish.statusCode, 409);

      const writeOnly = await createCredential(app, owner.accessToken, workspace.id, project.id, ["records:write"]);
      const writeOnlyCreate = await app.inject({
        method: "POST", url: "/api/v1/data/contacts",
        headers: { authorization: `Bearer ${writeOnly.secret}` },
        payload: { name: "Grace", score: 43 },
      });
      assert.equal(writeOnlyCreate.statusCode, 201, writeOnlyCreate.body);

      const auditResponse = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspace.id}/audit`,
        headers: managementHeaders,
      });
      assert.equal(auditResponse.statusCode, 200, auditResponse.body);
      assert.ok(auditResponse.json().data.some(
        (event: { action: string; resourceId: string }) =>
          event.action === "record.created" && event.resourceId === writeOnlyCreate.json().id,
      ));

      const writeOnlyRead = await app.inject({
        method: "POST", url: "/api/v1/data/contacts/query",
        headers: { authorization: `Bearer ${writeOnly.secret}` }, payload: {},
      });
      assert.equal(writeOnlyRead.statusCode, 403);

      const readOnly = await createCredential(app, owner.accessToken, workspace.id, project.id, ["records:read"]);
      const readOnlyQuery = await app.inject({
        method: "POST", url: "/api/v1/data/contacts/query",
        headers: { authorization: `Bearer ${readOnly.secret}` }, payload: {},
      });
      assert.equal(readOnlyQuery.statusCode, 200, readOnlyQuery.body);
      const readOnlyCreate = await app.inject({
        method: "POST", url: "/api/v1/data/contacts",
        headers: { authorization: `Bearer ${readOnly.secret}` },
        payload: { name: "Katherine", score: 44 },
      });
      assert.equal(readOnlyCreate.statusCode, 403);

      const duplicateResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts",
        headers: dataHeaders,
        payload: { name: "Ada", score: 50 },
      });
      assert.equal(duplicateResponse.statusCode, 409);

      const queryResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts/query",
        headers: dataHeaders,
        payload: {
          filter: {
            and: [
              { field: "name", op: "eq", value: "Ada" },
              { field: "score", op: "gte", value: 40 },
            ],
          },
        },
      });
      assert.equal(queryResponse.statusCode, 200, queryResponse.body);
      assert.equal(queryResponse.json().data.length, 1);
      assert.equal(queryResponse.json().data[0].id, record.id);

      const firstPage = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts/query",
        headers: dataHeaders,
        payload: { limit: 1 },
      });
      assert.equal(firstPage.statusCode, 200, firstPage.body);
      const firstPageBody = firstPage.json() as {
        data: Array<{ id: string }>;
        nextCursor: string | null;
      };
      assert.equal(firstPageBody.data.length, 1);
      assert.ok(firstPageBody.nextCursor);
      const secondPage = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts/query",
        headers: dataHeaders,
        payload: { limit: 1, cursor: firstPageBody.nextCursor },
      });
      assert.equal(secondPage.statusCode, 200, secondPage.body);
      assert.notEqual(secondPage.json().data[0].id, firstPageBody.data[0].id);

      const mismatchedCursor = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts/query",
        headers: dataHeaders,
        payload: {
          limit: 1,
          filter: { field: "score", op: "gt", value: 0 },
          cursor: firstPageBody.nextCursor,
        },
      });
      assert.equal(mismatchedCursor.statusCode, 400);

      const injectionFilter = await app.inject({
        method: "POST",
        url: "/api/v1/data/contacts/query",
        headers: dataHeaders,
        payload: {
          filter: {
            field: "name) OR true --",
            op: "eq",
            value: "anything",
          },
        },
      });
      assert.equal(injectionFilter.statusCode, 400);

      const patchResponse = await app.inject({
        method: "PATCH",
        url: `/api/v1/data/contacts/${record.id}`,
        headers: dataHeaders,
        payload: { score: 77 },
      });
      assert.equal(patchResponse.statusCode, 200, patchResponse.body);
      assert.equal(patchResponse.json().score, 77);

      const readResponse = await app.inject({
        method: "GET",
        url: `/api/v1/data/contacts/${record.id}`,
        headers: dataHeaders,
      });
      assert.equal(readResponse.statusCode, 200, readResponse.body);
      assert.equal(readResponse.json().score, 77);

      const deleteResponse = await app.inject({
        method: "DELETE",
        url: `/api/v1/data/contacts/${record.id}`,
        headers: dataHeaders,
      });
      assert.equal(deleteResponse.statusCode, 204);
      assert.equal(model.id.length > 0, true);
    } finally {
      await app.close();
    }
  });

  it("does not allow a project credential to access another project's model", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);
      await migrateIdempotency(app.database.knex);
      const owner = await register(app, "model-tenant@example.com");
      const workspace = await createWorkspace(app, owner.accessToken);
      const firstProject = await createProject(
        app,
        owner.accessToken,
        workspace.id,
        "first",
      );
      const secondProject = await createProject(
        app,
        owner.accessToken,
        workspace.id,
        "second",
      );
      const firstCredential = await createCredential(
        app,
        owner.accessToken,
        workspace.id,
        firstProject.id,
        ["models:manage", "records:read", "records:write"],
      );
      const secondCredential = await createCredential(
        app,
        owner.accessToken,
        workspace.id,
        secondProject.id,
        ["records:read", "records:write"],
      );
      const managementHeaders = {
        authorization: `Bearer ${owner.accessToken}`,
      };
      const modelUrl = `/api/v1/workspaces/${workspace.id}/projects/${firstProject.id}/models`;
      const definition = {
        key: "notes",
        displayName: "Notes",
        fields: [{ key: "body", type: "string", required: true }],
        access: { defaultVisibility: "project" },
      };
      const modelResponse = await app.inject({
        method: "POST",
        url: modelUrl,
        headers: managementHeaders,
        payload: definition,
      });
      assert.equal(modelResponse.statusCode, 201, modelResponse.body);
      const publishResponse = await app.inject({
        method: "POST",
        url: `${modelUrl}/notes/publish`,
        headers: managementHeaders,
        payload: { revision: 1 },
      });
      assert.equal(publishResponse.statusCode, 200, publishResponse.body);

      const record = await app.inject({
        method: "POST",
        url: "/api/v1/data/notes",
        headers: { authorization: `Bearer ${firstCredential.secret}` },
        payload: { body: "private to first project" },
      });
      assert.equal(record.statusCode, 201, record.body);

      const crossProjectRead = await app.inject({
        method: "GET",
        url: `/api/v1/data/notes/${record.json().id}`,
        headers: { authorization: `Bearer ${secondCredential.secret}` },
      });
      assert.equal(crossProjectRead.statusCode, 404);
    } finally {
      await app.close();
    }
  });

  it("isolates private records by authenticated project user", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);
      await migrateIdempotency(app.database.knex);
      const owner = await register(app, "private-owner@example.com");
      const user = await register(app, "private-user@example.com");
      const workspace = await createWorkspace(app, owner.accessToken);
      const project = await createProject(app, owner.accessToken, workspace.id);
      const managementHeaders = {
        authorization: `Bearer ${owner.accessToken}`,
      };

      const addUserResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${workspace.id}/projects/${project.id}/users`,
        headers: managementHeaders,
        payload: { email: "private-user@example.com", role: "member" },
      });
      assert.equal(addUserResponse.statusCode, 201, addUserResponse.body);

      const credential = await createCredential(
        app,
        owner.accessToken,
        workspace.id,
        project.id,
        ["models:manage", "records:read", "records:write"],
      );
      const modelUrl = `/api/v1/workspaces/${workspace.id}/projects/${project.id}/models`;
      const modelResponse = await app.inject({
        method: "POST",
        url: modelUrl,
        headers: managementHeaders,
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
        headers: managementHeaders,
        payload: { revision: 1 },
      });
      assert.equal(publishResponse.statusCode, 200, publishResponse.body);

      const ownerRecordResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/private_notes",
        headers: { authorization: `Bearer ${credential.secret}` },
        payload: { body: "owner record" },
      });
      assert.equal(ownerRecordResponse.statusCode, 201, ownerRecordResponse.body);
      const ownerRecord = ownerRecordResponse.json() as { id: string };

      const userHeaders = {
        authorization: `Bearer ${user.accessToken}`,
        "x-arsy-workspace-id": workspace.id,
        "x-arsy-project-id": project.id,
      };
      const deniedRead = await app.inject({
        method: "GET",
        url: `/api/v1/data/private_notes/${ownerRecord.id}`,
        headers: userHeaders,
      });
      assert.equal(deniedRead.statusCode, 404);

      const userRecordResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/private_notes",
        headers: userHeaders,
        payload: { body: "user record" },
      });
      assert.equal(userRecordResponse.statusCode, 201, userRecordResponse.body);
      const userRecord = userRecordResponse.json() as {
        id: string;
        ownerUserId: string;
      };
      assert.equal(userRecord.ownerUserId, user.accountId);

      const queryResponse = await app.inject({
        method: "POST",
        url: "/api/v1/data/private_notes/query",
        headers: userHeaders,
        payload: {},
      });
      assert.equal(queryResponse.statusCode, 200, queryResponse.body);
      assert.deepEqual(
        queryResponse.json().data.map((record: { id: string }) => record.id),
        [userRecord.id],
      );

      const deniedUpdate = await app.inject({
        method: "PATCH",
        url: `/api/v1/data/private_notes/${ownerRecord.id}`,
        headers: userHeaders,
        payload: { body: "changed" },
      });
      assert.equal(deniedUpdate.statusCode, 404);
    } finally {
      await app.close();
    }
  });
});

async function register(
  app: ReturnType<typeof createApp>,
  email: string,
): Promise<{ accessToken: string; accountId: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email,
      displayName: "Model Test",
      password: "model-test-password-long",
    },
  });
  assert.equal(response.statusCode, 201, response.body);
  const body = response.json() as {
    accessToken: string;
    account: { id: string };
  };
  return { accessToken: body.accessToken, accountId: body.account.id };
}

async function createWorkspace(
  app: ReturnType<typeof createApp>,
  token: string,
): Promise<{ id: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/workspaces",
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Model workspace", slug: "model-workspace" },
  });
  assert.equal(response.statusCode, 201, response.body);
  return response.json();
}

async function createProject(
  app: ReturnType<typeof createApp>,
  token: string,
  workspaceId: string,
  slug = "model-project",
): Promise<{ id: string }> {
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/workspaces/${workspaceId}/projects`,
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Model project", slug },
  });
  assert.equal(response.statusCode, 201, response.body);
  return response.json();
}

async function createCredential(
  app: ReturnType<typeof createApp>,
  token: string,
  workspaceId: string,
  projectId: string,
  scopes: string[],
): Promise<{ secret: string }> {
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/workspaces/${workspaceId}/projects/${projectId}/credentials`,
    headers: { authorization: `Bearer ${token}` },
    payload: { label: "Model test", scopes },
  });
  assert.equal(response.statusCode, 201, response.body);
  return response.json();
}
