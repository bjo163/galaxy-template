import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp as createArsyApp } from "../../app.js";
import { loadConfig, type AppConfig } from "../../config/env.js";
import { down as rollbackControlPlane } from "../../migrations/0001_arsy_control_plane.js";
import { up as migrateControlPlane } from "../../migrations/0001_arsy_control_plane.js";
import { down as rollbackSharedQuotaBuckets } from "../../migrations/0003_shared_quota_buckets.js";
import { up as migrateQuotaBuckets } from "../../migrations/0003_shared_quota_buckets.js";
import {
  down as rollbackAccountLifecycle,
  up as migrateAccountLifecycle,
} from "../../migrations/0004_account_lifecycle.js";
import { CapturingEmailDelivery } from "../../testing/fake-email-delivery.js";

const emailDelivery = new CapturingEmailDelivery();

function createApp(config?: AppConfig) {
  return createArsyApp(config, { emailDelivery });
}

async function migrateSharedQuotaBuckets(knex: Parameters<typeof migrateQuotaBuckets>[0]): Promise<void> {
  await migrateQuotaBuckets(knex);
  await migrateAccountLifecycle(knex);
}

describe("Arsy add-on API", () => {
  it("validates and manages declarative add-ons with project-scoped grants", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);

      const owner = await register(app, "addon-owner@example.com");
      const workspace = await createWorkspace(app, owner.token);
      const project = await createProject(app, owner.token, workspace.id, "addons");
      const otherProject = await createProject(
        app,
        owner.token,
        workspace.id,
        "other",
      );
      const managementCredential = await createCredential(
        app,
        owner.token,
        workspace.id,
        project.id,
        ["addons:manage"],
      );
      const readCredential = await createCredential(
        app,
        owner.token,
        workspace.id,
        project.id,
        ["records:read"],
      );
      const baseUrl =
        `/api/v1/workspaces/${workspace.id}/projects/${project.id}/addons`;
      const apiHeaders = {
        authorization: `Bearer ${managementCredential}`,
      };

      const denied = await app.inject({
        method: "GET",
        url: baseUrl,
        headers: { authorization: `Bearer ${readCredential}` },
      });
      assert.equal(denied.statusCode, 403);

      const manifest = {
        id: "com.example.contacts",
        version: "1.0.0",
        arsyApi: "^1",
        kind: "declarative",
        scope: "project",
        dependencies: [],
        capabilities: ["records.read"],
        permissions: [],
        configSchema: {
          type: "object",
          additionalProperties: false,
          required: ["pageSize"],
          properties: {
            pageSize: { type: "integer", minimum: 1, maximum: 100, default: 25 },
          },
        },
      };
      const executable = await app.inject({
        method: "POST",
        url: baseUrl,
        headers: apiHeaders,
        payload: { ...manifest, script: "throw new Error('execute')" },
      });
      assert.equal(executable.statusCode, 400);

      const createResponse = await app.inject({
        method: "POST",
        url: baseUrl,
        headers: apiHeaders,
        payload: manifest,
      });
      assert.equal(createResponse.statusCode, 201, createResponse.body);

      const duplicateDefinition = await app.inject({
        method: "POST",
        url: baseUrl,
        headers: apiHeaders,
        payload: manifest,
      });
      assert.equal(duplicateDefinition.statusCode, 409);

      const validateUrl = `${baseUrl}/com.example.contacts/1.0.0/validate`;
      const validateResponse = await app.inject({
        method: "POST",
        url: validateUrl,
        headers: apiHeaders,
      });
      assert.equal(validateResponse.statusCode, 200, validateResponse.body);
      assert.equal(validateResponse.json().status, "validated");

      const invalidGrant = await app.inject({
        method: "POST",
        url: `${baseUrl}/com.example.contacts/1.0.0/install`,
        headers: apiHeaders,
        payload: {
          grantedCapabilities: ["models.read"],
          configuration: {},
        },
      });
      assert.equal(invalidGrant.statusCode, 400);

      const installUrl = `${baseUrl}/com.example.contacts/1.0.0/install`;
      const installPayload = {
        grantedCapabilities: ["records.read"],
        configuration: {},
      };
      const installResponse = await app.inject({
        method: "POST",
        url: installUrl,
        headers: apiHeaders,
        payload: installPayload,
      });
      assert.equal(installResponse.statusCode, 201, installResponse.body);
      const installation = installResponse.json() as { id: string };

      const idempotentInstall = await app.inject({
        method: "POST",
        url: installUrl,
        headers: apiHeaders,
        payload: installPayload,
      });
      assert.equal(idempotentInstall.statusCode, 200, idempotentInstall.body);
      assert.equal(idempotentInstall.json().id, installation.id);

      const enableUrl = `${baseUrl}/installations/${installation.id}/enable`;
      const enableResponse = await app.inject({
        method: "POST",
        url: enableUrl,
        headers: apiHeaders,
      });
      assert.equal(enableResponse.statusCode, 200, enableResponse.body);
      assert.equal(enableResponse.json().status, "enabled");

      const dependentManifest = {
        ...manifest,
        id: "com.example.contacts-dashboard",
        dependencies: [{ id: "com.example.contacts", version: "1.0.0" }],
        capabilities: [],
      };
      const dependentCreate = await app.inject({
        method: "POST",
        url: baseUrl,
        headers: apiHeaders,
        payload: dependentManifest,
      });
      assert.equal(dependentCreate.statusCode, 201, dependentCreate.body);
      const dependentValidation = await app.inject({
        method: "POST",
        url: `${baseUrl}/com.example.contacts-dashboard/1.0.0/validate`,
        headers: apiHeaders,
      });
      assert.equal(dependentValidation.statusCode, 200, dependentValidation.body);
      const dependentInstall = await app.inject({
        method: "POST",
        url: `${baseUrl}/com.example.contacts-dashboard/1.0.0/install`,
        headers: apiHeaders,
        payload: { grantedCapabilities: [], configuration: {} },
      });
      assert.equal(dependentInstall.statusCode, 201, dependentInstall.body);
      const dependentInstallation = dependentInstall.json() as { id: string };
      const dependentEnable = await app.inject({
        method: "POST",
        url: `${baseUrl}/installations/${dependentInstallation.id}/enable`,
        headers: apiHeaders,
      });
      assert.equal(dependentEnable.statusCode, 200, dependentEnable.body);

      const blockedBaseDisable = await app.inject({
        method: "POST",
        url: `${baseUrl}/installations/${installation.id}/disable`,
        headers: apiHeaders,
      });
      assert.equal(blockedBaseDisable.statusCode, 409);

      const dependentDisable = await app.inject({
        method: "POST",
        url: `${baseUrl}/installations/${dependentInstallation.id}/disable`,
        headers: apiHeaders,
      });
      assert.equal(dependentDisable.statusCode, 200, dependentDisable.body);

      const enabledDelete = await app.inject({
        method: "DELETE",
        url: `${baseUrl}/installations/${installation.id}`,
        headers: apiHeaders,
      });
      assert.equal(enabledDelete.statusCode, 409);

      const disableResponse = await app.inject({
        method: "POST",
        url: `${baseUrl}/installations/${installation.id}/disable`,
        headers: apiHeaders,
      });
      assert.equal(disableResponse.statusCode, 200, disableResponse.body);
      assert.equal(disableResponse.json().status, "disabled");

      const uninstallResponse = await app.inject({
        method: "DELETE",
        url: `${baseUrl}/installations/${installation.id}`,
        headers: apiHeaders,
      });
      assert.equal(uninstallResponse.statusCode, 204);
      const dependentUninstall = await app.inject({
        method: "DELETE",
        url: `${baseUrl}/installations/${dependentInstallation.id}`,
        headers: apiHeaders,
      });
      assert.equal(dependentUninstall.statusCode, 204);

      const otherProjectAccess = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspace.id}/projects/${otherProject.id}/addons`,
        headers: apiHeaders,
      });
      assert.equal(otherProjectAccess.statusCode, 404);

      await rollbackAccountLifecycle(app.database.knex);
      await rollbackSharedQuotaBuckets(app.database.knex);
      await rollbackControlPlane(app.database.knex);
      assert.equal(
        await app.database.knex.schema.hasTable("arsy_addon_definitions"),
        false,
      );
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);
      assert.equal(
        await app.database.knex.schema.hasTable("arsy_addon_definitions"),
        true,
      );
    } finally {
      await app.close();
    }
  });
});

async function register(
  app: ReturnType<typeof createApp>,
  email: string,
): Promise<{ token: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email,
      displayName: "Add-on test",
      password: "addon-test-password-long",
    },
  });
  assert.equal(response.statusCode, 202, response.body);
  const verified = await app.inject({
    method: "POST",
    url: "/api/v1/auth/email-verification/confirm",
    payload: { token: emailDelivery.tokenFor("verify-email") },
  });
  assert.equal(verified.statusCode, 200, verified.body);
  return { token: verified.json().accessToken as string };
}

async function createWorkspace(
  app: ReturnType<typeof createApp>,
  token: string,
): Promise<{ id: string }> {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/workspaces",
    headers: { authorization: `Bearer ${token}` },
    payload: { name: "Add-on workspace", slug: "addon-workspace" },
  });
  assert.equal(response.statusCode, 201, response.body);
  return response.json();
}

async function createProject(
  app: ReturnType<typeof createApp>,
  token: string,
  workspaceId: string,
  slug: string,
): Promise<{ id: string }> {
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/workspaces/${workspaceId}/projects`,
    headers: { authorization: `Bearer ${token}` },
    payload: { name: slug, slug },
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
): Promise<string> {
  const response = await app.inject({
    method: "POST",
    url: `/api/v1/workspaces/${workspaceId}/projects/${projectId}/credentials`,
    headers: { authorization: `Bearer ${token}` },
    payload: { label: "Add-on test", scopes },
  });
  assert.equal(response.statusCode, 201, response.body);
  return response.json().secret as string;
}
