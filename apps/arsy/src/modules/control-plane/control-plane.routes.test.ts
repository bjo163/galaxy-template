import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createApp } from "../../app.js";
import { loadConfig } from "../../config/env.js";
import { up as migrateControlPlane } from "../../migrations/0001_arsy_control_plane.js";
import { up as migrateSharedQuotaBuckets } from "../../migrations/0003_shared_quota_buckets.js";
import { up as migrateAccountLifecycle } from "../../migrations/0004_account_lifecycle.js";
import { up as migrateWorkspaceAuditVisibility } from "../../migrations/0005_workspace_audit_visibility.js";
import { CapturingEmailDelivery } from "../../testing/fake-email-delivery.js";

describe("Arsy control plane", () => {
  it("creates accounts, workspaces, projects, and revocable project credentials", async () => {
    const emailDelivery = new CapturingEmailDelivery();
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      { emailDelivery },
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);
      await migrateAccountLifecycle(app.database.knex);
      await migrateWorkspaceAuditVisibility(app.database.knex);

      const registration = await app.inject({
        method: "POST",
        url: "/api/v1/auth/register",
        payload: {
          email: "Owner@Example.com",
          displayName: "Workspace Owner",
          password: "correct-horse-battery-staple",
        },
      });
      assert.equal(registration.statusCode, 202);
      assert.equal(registration.json().status, "verification_required");
      assert.equal(registration.body.includes(emailDelivery.tokenFor("verify-email")), false);
      const expiredVerificationToken = emailDelivery.tokenFor("verify-email");
      const registeredAccount = await app.database.knex("arsy_accounts")
        .select("id")
        .where({ email: "owner@example.com" })
        .first();
      assert.ok(registeredAccount);
      await app.database.knex("arsy_email_verification_tokens")
        .where({ account_id: registeredAccount.id })
        .update({ expires_at: new Date(Date.now() - 1_000) });

      const expiredVerification = await app.inject({
        method: "POST",
        url: "/api/v1/auth/email-verification/confirm",
        payload: { token: expiredVerificationToken },
      });
      assert.equal(expiredVerification.statusCode, 400);

      const resendVerification = await app.inject({
        method: "POST",
        url: "/api/v1/auth/email-verification/resend",
        payload: { email: "owner@example.com" },
      });
      assert.equal(resendVerification.statusCode, 202);
      const verificationToken = emailDelivery.tokenFor("verify-email");
      assert.notEqual(verificationToken, expiredVerificationToken);

      const unverifiedLogin = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "owner@example.com",
          password: "correct-horse-battery-staple",
        },
      });
      assert.equal(unverifiedLogin.statusCode, 403);

      const verification = await app.inject({
        method: "POST",
        url: "/api/v1/auth/email-verification/confirm",
        payload: { token: verificationToken },
      });
      assert.equal(verification.statusCode, 200, verification.body);
      const session = verification.json() as {
        account: { id: string; email: string };
        accessToken: string;
      };
      assert.equal(session.account.email, "owner@example.com");
      assert.match(session.accessToken, /^arsy_sess_[A-Za-z0-9_-]{43}$/);
      assert.equal(
        (
          await app.inject({
            method: "POST",
            url: "/api/v1/auth/email-verification/confirm",
            payload: { token: verificationToken },
          })
        ).statusCode,
        400,
      );

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

  it("does not grant workspace access to another account", async () => {
    const emailDelivery = new CapturingEmailDelivery();
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      { emailDelivery },
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);
      await migrateAccountLifecycle(app.database.knex);
      await migrateWorkspaceAuditVisibility(app.database.knex);

      const owner = await registerAccount(app, emailDelivery, {
        email: "owner@example.com",
        displayName: "Owner",
        password: "owner-password-long-enough",
      });
      const workspaceResponse = await app.inject({
        method: "POST",
        url: "/api/v1/workspaces",
        headers: { authorization: `Bearer ${owner.accessToken}` },
        payload: { name: "Private", slug: "private" },
      });
      const workspace = workspaceResponse.json() as { id: string };

      const other = await registerAccount(app, emailDelivery, {
        email: "other@example.com",
        displayName: "Other",
        password: "other-password-long-enough",
      });
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
    const emailDelivery = new CapturingEmailDelivery();
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      { emailDelivery },
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);
      await migrateAccountLifecycle(app.database.knex);
      await migrateWorkspaceAuditVisibility(app.database.knex);

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

      const session = await registerAccount(app, emailDelivery, {
        email: "member@example.com",
        displayName: "Member",
        password: "long-enough-password",
      });

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

  it("uses single-use expiring reset tokens and uniform reset responses", async () => {
    const emailDelivery = new CapturingEmailDelivery();
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      { emailDelivery },
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);
      await migrateAccountLifecycle(app.database.knex);
      await migrateWorkspaceAuditVisibility(app.database.knex);

      const account = await registerAccount(app, emailDelivery, {
        email: "reset@example.com",
        displayName: "Reset User",
        password: "original-password-long",
      });
      const resetRequest = (email: string) =>
        app.inject({
          method: "POST",
          url: "/api/v1/auth/password-reset/request",
          payload: { email },
        });
      const knownAccountResponse = await resetRequest("reset@example.com");
      const unknownAccountResponse = await resetRequest("missing@example.com");
      assert.equal(knownAccountResponse.statusCode, 202);
      assert.equal(unknownAccountResponse.statusCode, 202);
      assert.deepEqual(knownAccountResponse.json(), unknownAccountResponse.json());

      const expiredToken = emailDelivery.tokenFor("reset-password");
      const storedToken = await app.database.knex("arsy_password_reset_tokens")
        .select("token_hash")
        .where({ account_id: account.account.id })
        .first();
      assert.ok(storedToken);
      assert.notEqual(storedToken.token_hash, expiredToken);
      await app.database.knex("arsy_password_reset_tokens")
        .where({ account_id: account.account.id })
        .update({ expires_at: new Date(Date.now() - 1_000) });

      const expiredReset = await app.inject({
        method: "POST",
        url: "/api/v1/auth/password-reset/confirm",
        payload: { token: expiredToken, password: "new-password-long-enough" },
      });
      assert.equal(expiredReset.statusCode, 400);

      emailDelivery.failure = new Error("private smtp diagnostic");
      const failedDeliveryResponse = await resetRequest("reset@example.com");
      emailDelivery.failure = null;
      assert.equal(failedDeliveryResponse.statusCode, 202);
      assert.deepEqual(failedDeliveryResponse.json(), knownAccountResponse.json());
      assert.equal(failedDeliveryResponse.body.includes("private smtp diagnostic"), false);

      await resetRequest("reset@example.com");
      const resetToken = emailDelivery.tokenFor("reset-password");
      const completedReset = await app.inject({
        method: "POST",
        url: "/api/v1/auth/password-reset/confirm",
        payload: { token: resetToken, password: "replacement-password-long" },
      });
      assert.equal(completedReset.statusCode, 204, completedReset.body);

      const replayedReset = await app.inject({
        method: "POST",
        url: "/api/v1/auth/password-reset/confirm",
        payload: { token: resetToken, password: "another-password-long" },
      });
      assert.equal(replayedReset.statusCode, 400);

      const revokedSession = await app.inject({
        method: "GET",
        url: "/api/v1/auth/me",
        headers: { authorization: `Bearer ${account.accessToken}` },
      });
      assert.equal(revokedSession.statusCode, 401);

      const login = await app.inject({
        method: "POST",
        url: "/api/v1/auth/login",
        payload: {
          email: "reset@example.com",
          password: "replacement-password-long",
        },
      });
      assert.equal(login.statusCode, 200, login.body);
      const audit = await app.database.knex("arsy_account_audit_events")
        .select("action")
        .where({ account_id: account.account.id })
        .orderBy("created_at", "asc");
      assert.ok(audit.some((row) => row.action === "account.password_reset_completed"));
    } finally {
      await app.close();
    }
  });

  it("scopes invitations to the intended account and supports revocation and expiry", async () => {
    const emailDelivery = new CapturingEmailDelivery();
    const app = createApp(
      loadConfig({ NODE_ENV: "test", LOG_LEVEL: "silent" }),
      { emailDelivery },
    );

    try {
      await app.ready();
      assert.ok(app.database);
      await migrateControlPlane(app.database.knex);
      await migrateSharedQuotaBuckets(app.database.knex);
      await migrateAccountLifecycle(app.database.knex);
      await migrateWorkspaceAuditVisibility(app.database.knex);

      const owner = await registerAccount(app, emailDelivery, {
        email: "invite-owner@example.com",
        displayName: "Invite Owner",
        password: "invite-owner-password",
      });
      const invitee = await registerAccount(app, emailDelivery, {
        email: "invitee@example.com",
        displayName: "Invitee",
        password: "invitee-password-long",
      });
      const other = await registerAccount(app, emailDelivery, {
        email: "other-invitee@example.com",
        displayName: "Other Invitee",
        password: "other-invitee-password",
      });
      const ownerHeaders = {
        authorization: `Bearer ${owner.accessToken}`,
      };
      const workspace = await app.inject({
        method: "POST",
        url: "/api/v1/workspaces",
        headers: ownerHeaders,
        payload: { name: "Invitations", slug: "invitations" },
      });
      assert.equal(workspace.statusCode, 201, workspace.body);
      const workspaceId = workspace.json().id as string;
      const project = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${workspaceId}/projects`,
        headers: ownerHeaders,
        payload: { name: "Shared project", slug: "shared-project" },
      });
      assert.equal(project.statusCode, 201, project.body);
      const projectId = project.json().id as string;
      const unrelatedProject = await app.inject({
        method: "POST",
        url: `/api/v1/workspaces/${workspaceId}/projects`,
        headers: ownerHeaders,
        payload: { name: "Private project", slug: "private-project" },
      });
      assert.equal(unrelatedProject.statusCode, 201, unrelatedProject.body);

      const invitationUrl =
        `/api/v1/workspaces/${workspaceId}/projects/${projectId}/invitations`;
      const invitation = await app.inject({
        method: "POST",
        url: invitationUrl,
        headers: ownerHeaders,
        payload: { email: invitee.account.email, role: "developer" },
      });
      assert.equal(invitation.statusCode, 201, invitation.body);
      const invitationId = invitation.json().id as string;
      const invitationToken = emailDelivery.tokenFor("accept-invitation");
      assert.equal(invitation.body.includes(invitationToken), false);
      const invitationRow = await app.database.knex("arsy_project_invitations")
        .select("token_hash", "expires_at")
        .where({ id: invitationId })
        .first();
      assert.ok(invitationRow);
      assert.notEqual(invitationRow.token_hash, invitationToken);
      assert.ok(new Date(invitationRow.expires_at as string).getTime() > Date.now());

      const wrongAccount = await app.inject({
        method: "POST",
        url: "/api/v1/invitations/accept",
        headers: { authorization: `Bearer ${other.accessToken}` },
        payload: { token: invitationToken },
      });
      assert.equal(wrongAccount.statusCode, 404);
      const accepted = await app.inject({
        method: "POST",
        url: "/api/v1/invitations/accept",
        headers: { authorization: `Bearer ${invitee.accessToken}` },
        payload: { token: invitationToken },
      });
      assert.equal(accepted.statusCode, 200, accepted.body);
      assert.equal(accepted.json().role, "developer");
      const replay = await app.inject({
        method: "POST",
        url: "/api/v1/invitations/accept",
        headers: { authorization: `Bearer ${invitee.accessToken}` },
        payload: { token: invitationToken },
      });
      assert.equal(replay.statusCode, 404);

      const workspaces = await app.inject({
        method: "GET",
        url: "/api/v1/workspaces",
        headers: { authorization: `Bearer ${invitee.accessToken}` },
      });
      assert.equal(workspaces.statusCode, 200, workspaces.body);
      assert.equal(workspaces.json().data[0].role, "project_member");
      const projects = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspaceId}/projects`,
        headers: { authorization: `Bearer ${invitee.accessToken}` },
      });
      assert.equal(projects.statusCode, 200, projects.body);
      assert.deepEqual(
        projects.json().data.map((row: { id: string }) => row.id),
        [projectId],
      );
      const projectUsers = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspaceId}/projects/${projectId}/users`,
        headers: { authorization: `Bearer ${invitee.accessToken}` },
      });
      assert.equal(projectUsers.statusCode, 200, projectUsers.body);

      const revokedInvitation = await app.inject({
        method: "POST",
        url: invitationUrl,
        headers: ownerHeaders,
        payload: { email: invitee.account.email, role: "member" },
      });
      assert.equal(revokedInvitation.statusCode, 201, revokedInvitation.body);
      const revokedId = revokedInvitation.json().id as string;
      const revokedToken = emailDelivery.tokenFor("accept-invitation");
      const revoke = await app.inject({
        method: "DELETE",
        url: `${invitationUrl}/${revokedId}`,
        headers: ownerHeaders,
      });
      assert.equal(revoke.statusCode, 204);
      const revokedAcceptance = await app.inject({
        method: "POST",
        url: "/api/v1/invitations/accept",
        headers: { authorization: `Bearer ${invitee.accessToken}` },
        payload: { token: revokedToken },
      });
      assert.equal(revokedAcceptance.statusCode, 404);

      const expiredInvitation = await app.inject({
        method: "POST",
        url: invitationUrl,
        headers: ownerHeaders,
        payload: { email: other.account.email, role: "member" },
      });
      assert.equal(expiredInvitation.statusCode, 201, expiredInvitation.body);
      const expiredId = expiredInvitation.json().id as string;
      const expiredToken = emailDelivery.tokenFor("accept-invitation");
      await app.database.knex("arsy_project_invitations")
        .where({ id: expiredId })
        .update({ expires_at: new Date(Date.now() - 1_000) });
      const expiredAcceptance = await app.inject({
        method: "POST",
        url: "/api/v1/invitations/accept",
        headers: { authorization: `Bearer ${other.accessToken}` },
        payload: { token: expiredToken },
      });
      assert.equal(expiredAcceptance.statusCode, 404);

      const listedInvitations = await app.inject({
        method: "GET",
        url: invitationUrl,
        headers: ownerHeaders,
      });
      assert.equal(listedInvitations.statusCode, 200, listedInvitations.body);
      assert.equal(listedInvitations.body.includes("token_hash"), false);
      const firstAuditPage = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspaceId}/audit?projectId=${projectId}&action=project.invitation_created&limit=1`,
        headers: ownerHeaders,
      });
      assert.equal(firstAuditPage.statusCode, 200, firstAuditPage.body);
      assert.equal(firstAuditPage.json().data.length, 1);
      assert.ok(firstAuditPage.json().nextCursor);
      const secondAuditPage = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspaceId}/audit?projectId=${projectId}&action=project.invitation_created&limit=1&cursor=${encodeURIComponent(firstAuditPage.json().nextCursor as string)}`,
        headers: ownerHeaders,
      });
      assert.equal(secondAuditPage.statusCode, 200, secondAuditPage.body);
      assert.equal(secondAuditPage.json().data.length, 1);
      assert.notEqual(
        secondAuditPage.json().data[0].id,
        firstAuditPage.json().data[0].id,
      );
      const invalidAuditLimit = await app.inject({
        method: "GET",
        url: `/api/v1/workspaces/${workspaceId}/audit?limit=101`,
        headers: ownerHeaders,
      });
      assert.equal(invalidAuditLimit.statusCode, 400);
      const audit = await app.database.knex("arsy_audit_events")
        .select("action")
        .where({ workspace_id: workspaceId, project_id: projectId });
      assert.ok(audit.some((row) => row.action === "project.invitation_accepted"));
      assert.ok(audit.some((row) => row.action === "project.invitation_revoked"));
      assert.notEqual(unrelatedProject.json().id, projectId);
    } finally {
      await app.close();
    }
  });
});

async function registerAccount(
  app: ReturnType<typeof createApp>,
  emailDelivery: CapturingEmailDelivery,
  input: { email: string; displayName: string; password: string },
): Promise<{ accessToken: string; account: { id: string; email: string } }> {
  const registration = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: input,
  });
  assert.equal(registration.statusCode, 202, registration.body);
  const verification = await app.inject({
    method: "POST",
    url: "/api/v1/auth/email-verification/confirm",
    payload: { token: emailDelivery.tokenFor("verify-email") },
  });
  assert.equal(verification.statusCode, 200, verification.body);
  return verification.json();
}
