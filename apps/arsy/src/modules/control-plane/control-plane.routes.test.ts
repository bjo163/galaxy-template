import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp } from "../../app.js";
import { loadConfig } from "../../config/env.js";
import { up as migrateControlPlane } from "../../migrations/0001_arsy_control_plane.js";
import { up as migrateAuthRateLimits } from "../../migrations/0003_auth_rate_limits.js";

describe("Arsy control plane", () => {
  it("creates accounts, workspaces, projects, and revocable project credentials", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);

      const registration = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "Owner@Example.com",
          displayName: "Workspace Owner",
          password: "correct-horse-battery-staple",
        },
      });
      assert.equal(registration.statusCode, 201);
      const session = registration.json() as {
        account: { id: string; email: string };
        accessToken: string;
      };
      assert.equal(session.account.email, "owner@example.com");
      assert.match(session.accessToken, /^arsy_sess_[A-Za-z0-9_-]{43}$/);

      const unauthorized = await app.inject({
        method: "GET",
        url: "/api/v1/workspaces",
      });
      assert.equal(unauthorized.statusCode, 401);

      const headers = { authorization: `Bearer ${session.accessToken}` };
      const workspaceResponse = await app.inject({
        method: "POST",
        url: "/api/v1/workspaces",
        headers,
        payload: { name: "Acme", slug: "acme" },
      });
      assert.equal(workspaceResponse.statusCode, 201);
      const workspace = workspaceResponse.json() as {
        id: string;
        role: string;
      };
      assert.equal(workspace.role, "owner");

      const projectResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${workspace.id}/projects`,
        headers,
        payload: { name: "Production", slug: "production" },
      });
      assert.equal(projectResponse.statusCode, 201, projectResponse.body);
      const project = projectResponse.json() as { id: string };

      const credentialResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${workspace.id}/projects/${project.id}/credentials`,
        headers,
        payload: {
          label: "Production API",
          scopes: ["models:read", "records:read"],
        },
      });
      assert.equal(credentialResponse.statusCode, 201, credentialResponse.body);
      const credential = credentialResponse.json() as {
        id: string;
        secret: string;
        keyPrefix: string;
      };
      assert.match(credential.secret, /^arsy_proj_[A-Za-z0-9_-]{43}$/);
      assert.equal(credential.keyPrefix, credential.secret.slice(0, 20));

      const listResponse = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspace.id}/projects/${project.id}/credentials`,
        headers,
      });
      assert.equal(listResponse.statusCode, 200, listResponse.body);
      assert.equal(listResponse.body.includes(credential.secret), false);
      assert.equal(listResponse.body.includes("key_hash"), false);

      const credentialRow = await app.database.knex("arsy_project_credentials")
        .select("key_hash")
        .where({ id: credential.id })
        .first();
      assert.ok(credentialRow?.key_hash);
      assert.notEqual(credentialRow.key_hash, credential.secret);

      const revokeResponse = await app.inject({
        method: "DELETE",
        url: `/api/v1/workspaces/${workspace.id}/projects/${project.id}/credentials/${credential.id}`,
        headers,
      });
      assert.equal(revokeResponse.statusCode, 204);

      const logoutResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers,
      });
      assert.equal(logoutResponse.statusCode, 204);

      const expiredSessionResponse = await app.inject({
        method: "GET",
        url: "/api/v1/workspaces",
        headers,
      });
      assert.equal(expiredSessionResponse.statusCode, 401);
    } finally {
      await app.close();
    }
  });

  it("lists sessions and supports per-session and global revocation", async () => {
    const app = createApp(loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }));
    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);
      const registration = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "sessions@example.com",
          displayName: "Sessions",
          password: "session-test-password-long",
        },
      });
      assert.equal(registration.statusCode, 201);
      const registered = registration.json() as { accessToken: string };
      const login = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "sessions@example.com",
          password: "session-test-password-long",
        },
      });
      assert.equal(login.statusCode, 200);
      const loggedIn = login.json() as { accessToken: string };

      const listed = await app.inject({
        method: "GET",
        url: "/api/v1/auth/sessions",
        headers: { authorization: `Bearer ${registered.accessToken}` },
      });
      assert.equal(listed.statusCode, 200);
      assert.equal(listed.json().data.length, 2);
      const current = listed.json().data.find((session: { current: boolean }) => session.current);
      assert.ok(current);

      const revokeOthers = await app.inject({
        method: "DELETE",
        url: "/api/v1/auth/sessions",
        headers: { authorization: `Bearer ${registered.accessToken}` },
      });
      assert.equal(revokeOthers.statusCode, 204);
      const remaining = await app.inject({
        method: "GET",
        url: "/api/v1/auth/sessions",
        headers: { authorization: `Bearer ${registered.accessToken}` },
      });
      assert.equal(remaining.json().data.length, 1);

      const revokeAll = await app.inject({
        method: "DELETE",
        url: "/api/v1/auth/sessions/all",
        headers: { authorization: `Bearer ${registered.accessToken}` },
      });
      assert.equal(revokeAll.statusCode, 204);
      const invalidated = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${registered.accessToken}` },
      });
      assert.equal(invalidated.statusCode, 401);
      assert.match(loggedIn.accessToken, /^arsy_sess_/);
    } finally {
      await app.close();
    }
  });

  it("does not grant workspace access to another account", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);

      const ownerResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "owner@example.com",
          displayName: "Owner",
          password: "owner-password-long-enough",
        },
      });
      const owner = ownerResponse.json() as {
        accessToken: string;
      };
      const workspaceResponse = await app.inject({
        method: "POST",
        url: "/api/v1/workspaces",
        headers: { authorization: `Bearer ${owner.accessToken}` },
        payload: { name: "Private", slug: "private" },
      });
      const workspace = workspaceResponse.json() as { id: string };

      const otherResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "other@example.com",
          displayName: "Other",
          password: "other-password-long-enough",
        },
      });
      const other = otherResponse.json() as {
        accessToken: string;
      };
      const projectResponse = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${workspace.id}/projects`,
        headers: { authorization: `Bearer ${other.accessToken}` },
        payload: { name: "Private", slug: "private" },
      });
      assert.equal(projectResponse.statusCode, 404);
      assert.deepEqual(projectResponse.json(), {
        type: "about:blank",
        title: "Not Found",
        status: 404,
        detail: "The requested workspace was not found.",
        instance: `/api/v1/workspaces/${workspace.id}/projects`,
        requestId: projectResponse.headers["x-request-id"],
      });
    } finally {
      await app.close();
    }
  });

  it("rejects weak passwords and malformed workspace requests", async () => {
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateAuthRateLimits(app.database.knex);

      const weakPasswordResponse = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "weak@example.com",
          displayName: "Weak",
          password: "short",
        },
      });
      assert.equal(weakPasswordResponse.statusCode, 400);

      const registration = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "member@example.com",
          displayName: "Member",
          password: "long-enough-password",
        },
      });
      const session = registration.json() as { accessToken: string };

      const invalidWorkspace = await app.inject({
        method: "POST",
        url: "/api/v1/workspaces",
        headers: { authorization: `Bearer ${session.accessToken}` },
        payload: { name: "Invalid slug", slug: "Invalid Slug" },
      });
      assert.equal(invalidWorkspace.statusCode, 400);
    } finally {
      await app.close();
    }
  });
});
