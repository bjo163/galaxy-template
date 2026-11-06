import { randomBytes, randomUUID } from "node:crypto";

import type { FastifyInstance, FastifyRequest } from "fastify";
import { setTransactionSetting, type Knex } from "@galaxy/database";

import {
  type AuthenticatedAccount,
  createSession,
  hashOpaqueToken,
  hashPassword,
  HttpError,
  normalizeEmail,
  requireAccount,
  verifyPassword,
} from "../../core/auth/identity.js";
import {
  createEmailActionUrl,
  EmailDeliveryUnavailableError,
  type EmailMessage,
} from "../../core/email/email-delivery.js";
import {
  withAccountTransaction,
  withInvitationHashTransaction,
  withProjectTransaction,
  withWorkspaceTransaction,
} from "../../core/tenancy/database-context.js";

type RegisterBody = {
  email: string;
  displayName: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

type WorkspaceBody = {
  name: string;
  slug: string;
};

type ProjectBody = {
  name: string;
  slug: string;
};

type CredentialBody = {
  label: string;
  scopes: string[];
  expiresAt?: string;
};

type WorkspaceMemberBody = {
  email: string;
  role: "admin" | "developer" | "viewer";
};

type ProjectInvitationBody = {
  email: string;
  role: "admin" | "developer" | "member";
};

type EmailBody = { email: string };
type TokenBody = { token: string };
type PasswordResetBody = { token: string; password: string };

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
};

const emailPattern = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";
const slugPattern = "^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$";
const supportedCredentialScopes = new Set([
  "models:read",
  "models:manage",
  "records:read",
  "records:write",
  "addons:manage",
]);
const verificationTokenLifetimeMs = 24 * 60 * 60 * 1000;
const passwordResetTokenLifetimeMs = 60 * 60 * 1000;
const invitationTokenLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function getKnex(app: FastifyInstance): Knex {
  if (!app.database) {
    throw new HttpError(503, "The database is unavailable.");
  }

  return app.database.knex;
}

function publicAccount(account: {
  id: string;
  email: string;
  displayName: string;
}) {
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}

async function writeAudit(
  trx: Knex.Transaction,
  input: {
    workspaceId: string;
    projectId?: string;
    actorId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await trx("arsy_audit_events").insert({
    id: randomUUID(),
    workspace_id: input.workspaceId,
    project_id: input.projectId ?? null,
    actor_id: input.actorId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    metadata: input.metadata ?? {},
    created_at: new Date(),
  });
}

async function writeAccountAudit(
  trx: Knex.Transaction,
  input: {
    accountId: string;
    action: string;
    resourceType: string;
    resourceId: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await trx("arsy_account_audit_events").insert({
    id: randomUUID(),
    account_id: input.accountId,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId,
    metadata: input.metadata ?? {},
    created_at: new Date(),
  });
}

async function replaceAccountToken(
  trx: Knex.Transaction,
  table:
    | "arsy_email_verification_tokens"
    | "arsy_password_reset_tokens",
  accountId: string,
  token: string,
  expiresAt: Date,
): Promise<void> {
  await trx(table)
    .insert({
      id: randomUUID(),
      account_id: accountId,
      token_hash: hashOpaqueToken(token),
      expires_at: expiresAt,
      created_at: new Date(),
    })
    .onConflict("account_id")
    .merge({
      token_hash: hashOpaqueToken(token),
      expires_at: expiresAt,
      created_at: new Date(),
    });
}

async function sendLifecycleEmail(
  request: FastifyRequest,
  provider: FastifyInstance["emailDelivery"],
  operation: "email-verification" | "password-reset" | "project-invitation",
  message: EmailMessage,
): Promise<void> {
  try {
    await provider.send(message);
  } catch {
    request.log.error({ operation }, "lifecycle email delivery failed");
    throw new EmailDeliveryUnavailableError();
  }
}

async function findWorkspaceRole(
  knex: Knex,
  workspaceId: string,
  accountId: string,
): Promise<string | null> {
  const membership = await withWorkspaceTransaction(
    knex,
    workspaceId,
    (trx) =>
      trx("arsy_workspace_members")
        .select("role")
        .where({ workspace_id: workspaceId, account_id: accountId })
        .first(),
  );

  return (membership?.role as string | undefined) ?? null;
}

async function requireWorkspaceRole(
  knex: Knex,
  workspaceId: string,
  accountId: string,
  allowedRoles: readonly string[],
): Promise<string> {
  const role = await findWorkspaceRole(knex, workspaceId, accountId);
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpError(404, "The requested workspace was not found.");
  }

  return role;
}

export async function registerControlPlaneRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.post<{ Body: RegisterBody }>(
    "/auth/register",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email", "displayName", "password"],
          properties: {
            email: { type: "string", minLength: 3, maxLength: 320, pattern: emailPattern },
            displayName: { type: "string", minLength: 1, maxLength: 120 },
            password: { type: "string", minLength: 12, maxLength: 256 },
          },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const email = normalizeEmail(request.body.email);
      const exists = await knex("arsy_accounts").select("id").where({ email }).first();
      if (exists) {
        throw new HttpError(409, "An account with this email already exists.");
      }

      const now = new Date();
      const displayName = request.body.displayName.trim();
      if (!displayName) {
        throw new HttpError(400, "Display name must not be empty.");
      }
      const account = {
        id: randomUUID(),
        email,
        display_name: displayName,
        password_hash: await hashPassword(request.body.password),
        status: "active",
        created_at: now,
        updated_at: now,
      };

      const verificationToken = `arsy_verify_${randomBytes(32).toString("base64url")}`;
      await knex.transaction(async (trx) => {
        const inserted = await trx("arsy_accounts")
          .insert(account)
          .onConflict("email")
          .ignore()
          .returning("id");
        if (inserted.length === 0) {
          throw new HttpError(409, "An account with this email already exists.");
        }

        await replaceAccountToken(
          trx,
          "arsy_email_verification_tokens",
          account.id,
          verificationToken,
          new Date(now.getTime() + verificationTokenLifetimeMs),
        );
        await writeAccountAudit(trx, {
          accountId: account.id,
          action: "account.email_verification_requested",
          resourceType: "account",
          resourceId: account.id,
        });
      });
      const verificationUrl = createEmailActionUrl(
        app.publicAppUrl,
        "verify-email",
        verificationToken,
      );
      await sendLifecycleEmail(request, app.emailDelivery, "email-verification", {
        to: email,
        subject: "Verify your Arsy email address",
        text: `Verify your email address within 24 hours:\n\n${verificationUrl}`,
      });
      return reply.code(202).send({ status: "verification_required", email });
    },
  );

  app.post<{ Body: TokenBody }>(
    "/auth/email-verification/confirm",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["token"],
          properties: { token: { type: "string", minLength: 20, maxLength: 128 } },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const verified = await knex.transaction(async (trx) => {
        const token = await trx("arsy_email_verification_tokens")
          .select("account_id as accountId")
          .where({ token_hash: hashOpaqueToken(request.body.token) })
          .andWhere("expires_at", ">", new Date())
          .forUpdate()
          .first();
        if (!token) {
          return null;
        }

        const account = await trx("arsy_accounts")
          .select(
            "id",
            "email",
            "display_name as displayName",
            "email_verified_at as emailVerifiedAt",
          )
          .where({ id: token.accountId, status: "active" })
          .forUpdate()
          .first();
        if (!account || account.emailVerifiedAt) {
          return null;
        }

        const now = new Date();
        await trx("arsy_accounts")
          .where({ id: account.id })
          .update({ email_verified_at: now, updated_at: now });
        await trx("arsy_email_verification_tokens")
          .where({ account_id: account.id })
          .delete();
        await writeAccountAudit(trx, {
          accountId: account.id as string,
          action: "account.email_verified",
          resourceType: "account",
          resourceId: account.id as string,
        });
        const session = await createSession(trx, account.id as string);
        return { account, session };
      });

      if (!verified) {
        throw new HttpError(400, "The verification link is invalid or expired.");
      }

      return reply.send({
        account: publicAccount({
          id: verified.account.id as string,
          email: verified.account.email as string,
          displayName: verified.account.displayName as string,
        }),
        accessToken: verified.session.token,
        expiresAt: verified.session.expiresAt.toISOString(),
      });
    },
  );

  app.post<{ Body: EmailBody }>(
    "/auth/email-verification/resend",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email"],
          properties: {
            email: { type: "string", minLength: 3, maxLength: 320, pattern: emailPattern },
          },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const email = normalizeEmail(request.body.email);
      const account = await knex("arsy_accounts")
        .select("id")
        .where({ email, status: "active" })
        .whereNull("email_verified_at")
        .first();
      if (account) {
        const token = `arsy_verify_${randomBytes(32).toString("base64url")}`;
        await knex.transaction(async (trx) => {
          await replaceAccountToken(
            trx,
            "arsy_email_verification_tokens",
            account.id as string,
            token,
            new Date(Date.now() + verificationTokenLifetimeMs),
          );
          await writeAccountAudit(trx, {
            accountId: account.id as string,
            action: "account.email_verification_requested",
            resourceType: "account",
            resourceId: account.id as string,
          });
        });
        try {
          await sendLifecycleEmail(request, app.emailDelivery, "email-verification", {
            to: email,
            subject: "Verify your Arsy email address",
            text: `Verify your email address within 24 hours:\n\n${createEmailActionUrl(
              app.publicAppUrl,
              "verify-email",
              token,
            )}`,
          });
        } catch (error) {
          if (!(error instanceof EmailDeliveryUnavailableError)) {
            throw error;
          }
        }
      }

      return reply.code(202).send({ status: "if_account_exists_check_email" });
    },
  );

  app.post<{ Body: EmailBody }>(
    "/auth/password-reset/request",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email"],
          properties: {
            email: { type: "string", minLength: 3, maxLength: 320, pattern: emailPattern },
          },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const email = normalizeEmail(request.body.email);
      const account = await knex("arsy_accounts")
        .select("id")
        .where({ email, status: "active" })
        .first();
      if (account) {
        const token = `arsy_reset_${randomBytes(32).toString("base64url")}`;
        await knex.transaction(async (trx) => {
          await replaceAccountToken(
            trx,
            "arsy_password_reset_tokens",
            account.id as string,
            token,
            new Date(Date.now() + passwordResetTokenLifetimeMs),
          );
          await writeAccountAudit(trx, {
            accountId: account.id as string,
            action: "account.password_reset_requested",
            resourceType: "account",
            resourceId: account.id as string,
          });
        });
        try {
          await sendLifecycleEmail(request, app.emailDelivery, "password-reset", {
            to: email,
            subject: "Reset your Arsy password",
            text: `Reset your password within 1 hour:\n\n${createEmailActionUrl(
              app.publicAppUrl,
              "reset-password",
              token,
            )}`,
          });
        } catch (error) {
          if (!(error instanceof EmailDeliveryUnavailableError)) {
            throw error;
          }
        }
      }

      return reply.code(202).send({ status: "if_account_exists_check_email" });
    },
  );

  app.post<{ Body: PasswordResetBody }>(
    "/auth/password-reset/confirm",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["token", "password"],
          properties: {
            token: { type: "string", minLength: 20, maxLength: 128 },
            password: { type: "string", minLength: 12, maxLength: 256 },
          },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const passwordHash = await hashPassword(request.body.password);
      const reset = await knex.transaction(async (trx) => {
        const token = await trx("arsy_password_reset_tokens")
          .select("account_id as accountId")
          .where({ token_hash: hashOpaqueToken(request.body.token) })
          .andWhere("expires_at", ">", new Date())
          .forUpdate()
          .first();
        if (!token) {
          return false;
        }

        const account = await trx("arsy_accounts")
          .select("id")
          .where({ id: token.accountId, status: "active" })
          .forUpdate()
          .first();
        if (!account) {
          return false;
        }

        const now = new Date();
        await trx("arsy_accounts")
          .where({ id: account.id })
          .update({ password_hash: passwordHash, updated_at: now });
        await trx("arsy_password_reset_tokens")
          .where({ account_id: account.id })
          .delete();
        await trx("arsy_sessions").where({ account_id: account.id }).delete();
        await writeAccountAudit(trx, {
          accountId: account.id as string,
          action: "account.password_reset_completed",
          resourceType: "account",
          resourceId: account.id as string,
        });
        return true;
      });

      if (!reset) {
        throw new HttpError(400, "The password reset link is invalid or expired.");
      }

      return reply.code(204).send();
    },
  );

  app.post<{ Body: LoginBody }>(
    "/auth/login",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email", "password"],
          properties: {
            email: { type: "string", minLength: 3, maxLength: 320, pattern: emailPattern },
            password: { type: "string", minLength: 1, maxLength: 256 },
          },
        },
      },
    },
    async (request, reply) => {
      const knex = getKnex(app);
      const email = normalizeEmail(request.body.email);
      const account = await knex("arsy_accounts")
        .select(
          "id",
          "email",
          "display_name as displayName",
          "password_hash as passwordHash",
          "status",
          "email_verified_at as emailVerifiedAt",
        )
        .where({ email })
        .first();

      const validPassword = await verifyPassword(
        request.body.password,
        (account?.passwordHash as string | undefined) ??
          "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      );
      if (!account || !validPassword || account.status !== "active") {
        throw new HttpError(401, "The email or password is incorrect.");
      }
      if (!account.emailVerifiedAt) {
        throw new HttpError(403, "Verify your email address before signing in.");
      }

      const session = await createSession(knex, account.id as string);
      return reply.send({
        account: publicAccount({
          id: account.id as string,
          email: account.email as string,
          displayName: account.displayName as string,
        }),
        accessToken: session.token,
        expiresAt: session.expiresAt.toISOString(),
      });
    },
  );

  app.post("/auth/logout", async (request, reply) => {
    const account = await requireAccount(request, getKnex(app));
    const tokenHash = request.sessionTokenHash;
    if (!tokenHash) {
      throw new HttpError(401, "Authentication is required.");
    }

    await getKnex(app)("arsy_sessions")
      .where({ token_hash: tokenHash, account_id: account.id })
      .delete();
    return reply.code(204).send();
  });

  app.get("/auth/me", async (request) => {
    const account = await requireAccount(request, getKnex(app));
    return { account: publicAccount(account) };
  });

  app.get("/workspaces", async (request) => {
    const account = await requireAccount(request, getKnex(app));
    const knex = getKnex(app);
    const [workspaceMemberships, projectMemberships] = await Promise.all([
      withAccountTransaction(
        knex,
        account.id,
        (trx) =>
          trx("arsy_workspace_members")
            .select("workspace_id as id", "role")
            .where({ account_id: account.id }),
      ),
      withAccountTransaction(
        knex,
        account.id,
        (trx) =>
          trx("arsy_project_users")
            .distinct("workspace_id as id")
            .where({ account_id: account.id }),
      ),
    ]);
    const memberships = new Map<string, string>();
    for (const membership of workspaceMemberships) {
      memberships.set(membership.id as string, membership.role as string);
    }
    for (const membership of projectMemberships) {
      if (!memberships.has(membership.id as string)) {
        memberships.set(membership.id as string, "project_member");
      }
    }
    const rows = await Promise.all(
      [...memberships].map(async ([workspaceId, role]) => {
        const workspace = await withWorkspaceTransaction(
          knex,
          workspaceId,
          (trx) =>
            trx("arsy_workspaces")
              .select("id", "name", "slug", "created_at as createdAt")
              .where({ id: workspaceId })
              .first(),
        );
        if (!workspace) {
          throw new Error("An account membership references a missing workspace.");
        }

        return { ...workspace, role };
      }),
    );
    rows.sort(
      (left, right) =>
        new Date(left.createdAt as string).getTime() -
        new Date(right.createdAt as string).getTime(),
    );

    return {
      data: rows.map((row) => ({
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        role: row.role,
        createdAt: new Date(row.createdAt as string).toISOString(),
      })),
    };
  });

  app.post<{ Body: WorkspaceBody }>(
    "/workspaces",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["name", "slug"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            slug: { type: "string", minLength: 1, maxLength: 63, pattern: slugPattern },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      const now = new Date();
      const workspaceId = randomUUID();

      await withWorkspaceTransaction(knex, workspaceId, async (trx) => {
        await trx("arsy_workspaces").insert({
          id: workspaceId,
          name: request.body.name.trim(),
          slug: request.body.slug,
          created_by: account.id,
          created_at: now,
          updated_at: now,
        });
        await trx("arsy_workspace_members").insert({
          id: randomUUID(),
          workspace_id: workspaceId,
          account_id: account.id,
          role: "owner",
          created_at: now,
        });
        await writeAudit(trx, {
          workspaceId,
          actorId: account.id,
          action: "workspace.created",
          resourceType: "workspace",
          resourceId: workspaceId,
        });
      });

      return reply.code(201).send({
        id: workspaceId,
        name: request.body.name.trim(),
        slug: request.body.slug,
        role: "owner",
        createdAt: now.toISOString(),
      });
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId/members",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceRole(
        getKnex(app),
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer", "viewer"],
      );
      const members = await withWorkspaceTransaction(
        getKnex(app),
        request.params.workspaceId,
        (trx) =>
          trx("arsy_workspace_members")
            .join(
              "arsy_accounts",
              "arsy_accounts.id",
              "arsy_workspace_members.account_id",
            )
            .select(
              "arsy_accounts.id as accountId",
              "arsy_accounts.email",
              "arsy_accounts.display_name as displayName",
              "arsy_workspace_members.role",
              "arsy_workspace_members.created_at as createdAt",
            )
            .where({ workspace_id: request.params.workspaceId })
            .orderBy("arsy_workspace_members.created_at", "asc"),
      );
      return {
        data: members.map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt as string).toISOString(),
        })),
      };
    },
  );

  app.post<{ Params: { workspaceId: string }; Body: WorkspaceMemberBody }>(
    "/workspaces/:workspaceId/members",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email", "role"],
          properties: {
            email: { type: "string", minLength: 3, maxLength: 320, pattern: emailPattern },
            role: { type: "string", enum: ["admin", "developer", "viewer"] },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner"],
      );
      const member = await knex("arsy_accounts")
        .select("id", "email", "display_name as displayName")
        .where({ email: normalizeEmail(request.body.email) })
        .andWhere({ status: "active" })
        .first();
      if (!member) {
        throw new HttpError(404, "The account must register before it can be added.");
      }

      const now = new Date();
      const membershipId = randomUUID();
      await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        async (trx) => {
          await trx("arsy_workspace_members")
            .insert({
              id: membershipId,
              workspace_id: request.params.workspaceId,
              account_id: member.id,
              role: request.body.role,
              created_at: now,
            })
            .onConflict(["workspace_id", "account_id"])
            .merge({ role: request.body.role });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            actorId: account.id,
            action: "workspace.member_added",
            resourceType: "workspace_member",
            resourceId: member.id as string,
            metadata: { role: request.body.role },
          });
        },
      );

      return reply.code(201).send({
        accountId: member.id,
        email: member.email,
        displayName: member.displayName,
        role: request.body.role,
        createdAt: now.toISOString(),
      });
    },
  );

  app.delete<{
    Params: { workspaceId: string; accountId: string };
  }>(
    "/workspaces/:workspaceId/members/:accountId",
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner"],
      );
      const membership = await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        (trx) =>
          trx("arsy_workspace_members")
            .select("role")
            .where({
              workspace_id: request.params.workspaceId,
              account_id: request.params.accountId,
            })
            .first(),
      );
      if (!membership || membership.role === "owner") {
        throw new HttpError(404, "The removable workspace member was not found.");
      }
      await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        async (trx) => {
          await trx("arsy_workspace_members")
            .where({
              workspace_id: request.params.workspaceId,
              account_id: request.params.accountId,
            })
            .delete();
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            actorId: account.id,
            action: "workspace.member_removed",
            resourceType: "workspace_member",
            resourceId: request.params.accountId,
          });
        },
      );
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId/projects",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      const workspaceRole = await findWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
      );
      let projectIds: string[] | null = null;
      if (!workspaceRole) {
        projectIds = await withAccountTransaction(
          knex,
          account.id,
          async (trx) =>
            (
              await trx("arsy_project_users")
                .select("project_id")
                .where({
                  workspace_id: request.params.workspaceId,
                  account_id: account.id,
                })
            ).map((row) => row.project_id as string),
        );
        if (projectIds.length === 0) {
          throw new HttpError(404, "The requested workspace was not found.");
        }
      }

      const rows = await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        async (trx) =>
          {
            const query = trx("arsy_projects")
            .select(
              "id",
              "name",
              "slug",
              "status",
              "created_at as createdAt",
            )
            .where("workspace_id", request.params.workspaceId)
            .orderBy("created_at", "asc");
            if (projectIds) {
              query.whereIn("id", projectIds);
            }
            return (await query) as ProjectRow[];
          },
      );

      return {
        data: rows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          status: row.status,
          createdAt: new Date(row.createdAt).toISOString(),
        })),
      };
    },
  );

  app.post<{ Params: { workspaceId: string }; Body: ProjectBody }>(
    "/workspaces/:workspaceId/projects",
    {
      schema: {
        params: {
          type: "object",
          required: ["workspaceId"],
          properties: { workspaceId: { type: "string", format: "uuid" } },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["name", "slug"],
          properties: {
            name: { type: "string", minLength: 1, maxLength: 120 },
            slug: { type: "string", minLength: 1, maxLength: 63, pattern: slugPattern },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer"],
      );

      const now = new Date();
      const projectId = randomUUID();
      await withProjectTransaction(
        knex,
        request.params.workspaceId,
        projectId,
        async (trx) => {
          await trx("arsy_projects").insert({
            id: projectId,
            workspace_id: request.params.workspaceId,
            name: request.body.name.trim(),
            slug: request.body.slug,
            status: "active",
            created_at: now,
            updated_at: now,
          });
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId,
            actorId: account.id,
            action: "project.created",
            resourceType: "project",
            resourceId: projectId,
          });
        },
      );

      return reply.code(201).send({
        id: projectId,
        workspaceId: request.params.workspaceId,
        name: request.body.name.trim(),
        slug: request.body.slug,
        status: "active",
        createdAt: now.toISOString(),
      });
    },
  );

  app.get<{ Params: { workspaceId: string; projectId: string } }>(
    "/workspaces/:workspaceId/projects/:projectId/users",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      const workspaceRole = await findWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
      );
      if (workspaceRole) {
        if (!["owner", "admin", "developer", "viewer"].includes(workspaceRole)) {
          throw new HttpError(404, "The requested workspace was not found.");
        }
      } else {
        const projectMembership = await withProjectTransaction(
          knex,
          request.params.workspaceId,
          request.params.projectId,
          (trx) =>
            trx("arsy_project_users")
              .select("id")
              .where({
                workspace_id: request.params.workspaceId,
                project_id: request.params.projectId,
                account_id: account.id,
              })
              .first(),
        );
        if (!projectMembership) {
          throw new HttpError(404, "The requested project was not found.");
        }
      }
      const rows = await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        (trx) =>
          trx("arsy_project_users")
            .join(
              "arsy_accounts",
              "arsy_accounts.id",
              "arsy_project_users.account_id",
            )
            .select(
              "arsy_accounts.id as accountId",
              "arsy_accounts.email",
              "arsy_accounts.display_name as displayName",
              "arsy_project_users.role",
              "arsy_project_users.created_at as createdAt",
            )
            .where({
              "arsy_project_users.workspace_id": request.params.workspaceId,
              "arsy_project_users.project_id": request.params.projectId,
            })
            .orderBy("arsy_project_users.created_at", "asc"),
      );

      return {
        data: rows.map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt as string).toISOString(),
        })),
      };
    },
  );

  app.post<{
    Params: { workspaceId: string; projectId: string };
    Body: ProjectInvitationBody;
  }>(
    "/workspaces/:workspaceId/projects/:projectId/invitations",
    {
      schema: {
        params: {
          type: "object",
          required: ["workspaceId", "projectId"],
          properties: {
            workspaceId: { type: "string", format: "uuid" },
            projectId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["email", "role"],
          properties: {
            email: {
              type: "string",
              minLength: 3,
              maxLength: 320,
              pattern: emailPattern,
            },
            role: { type: "string", enum: ["admin", "developer", "member"] },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      const workspaceRole = await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin"],
      );
      if (request.body.role === "admin" && workspaceRole !== "owner") {
        throw new HttpError(403, "Only a workspace owner may grant project admin.");
      }

      const email = normalizeEmail(request.body.email);
      const now = new Date();
      const token = `arsy_invite_${randomBytes(32).toString("base64url")}`;
      const tokenHash = hashOpaqueToken(token);
      const expiresAt = new Date(now.getTime() + invitationTokenLifetimeMs);
      const invitation = await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          const project = await trx("arsy_projects")
            .select("id", "status")
            .where({
              id: request.params.projectId,
              workspace_id: request.params.workspaceId,
              status: "active",
            })
            .forUpdate()
            .first();
          if (!project) {
            throw new HttpError(404, "The requested project was not found.");
          }

          const existing = await trx("arsy_project_invitations")
            .select("id")
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              email,
            })
            .whereNull("accepted_at")
            .whereNull("revoked_at")
            .andWhere("expires_at", ">", now)
            .forUpdate()
            .first();
          const invitationId = (existing?.id as string | undefined) ?? randomUUID();
          if (existing) {
            await trx("arsy_project_invitations")
              .where({ id: invitationId })
              .update({
                role: request.body.role,
                token_hash: tokenHash,
                invited_by: account.id,
                expires_at: expiresAt,
                updated_at: now,
              });
          } else {
            await trx("arsy_project_invitations").insert({
              id: invitationId,
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              email,
              role: request.body.role,
              token_hash: tokenHash,
              invited_by: account.id,
              expires_at: expiresAt,
              accepted_at: null,
              revoked_at: null,
              created_at: now,
              updated_at: now,
            });
          }
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: account.id,
            action: existing
              ? "project.invitation_resent"
              : "project.invitation_created",
            resourceType: "project_invitation",
            resourceId: invitationId,
            metadata: { role: request.body.role },
          });

          return { id: invitationId, createdAt: existing ? undefined : now };
        },
      );

      await sendLifecycleEmail(request, app.emailDelivery, "project-invitation", {
        to: email,
        subject: "You have been invited to an Arsy project",
        text: `You have been invited to join project ${request.params.projectId} as ${request.body.role}. Accept within 7 days:\n\n${createEmailActionUrl(
          app.publicAppUrl,
          "accept-invitation",
          token,
        )}`,
      });

      return reply.code(invitation.createdAt ? 201 : 200).send({
        id: invitation.id,
        email,
        role: request.body.role,
        expiresAt: expiresAt.toISOString(),
        createdAt: invitation.createdAt?.toISOString() ?? null,
      });
    },
  );

  app.get<{ Params: { workspaceId: string; projectId: string } }>(
    "/workspaces/:workspaceId/projects/:projectId/invitations",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceRole(
        getKnex(app),
        request.params.workspaceId,
        account.id,
        ["owner", "admin"],
      );
      const rows = await withProjectTransaction(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        (trx) =>
          trx("arsy_project_invitations")
            .select(
              "id",
              "email",
              "role",
              "expires_at as expiresAt",
              "accepted_at as acceptedAt",
              "revoked_at as revokedAt",
              "created_at as createdAt",
            )
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
            })
            .orderBy("created_at", "desc"),
      );

      return {
        data: rows.map((row) => ({
          id: row.id,
          email: row.email,
          role: row.role,
          expiresAt: new Date(row.expiresAt as string).toISOString(),
          acceptedAt: row.acceptedAt
            ? new Date(row.acceptedAt as string).toISOString()
            : null,
          revokedAt: row.revokedAt
            ? new Date(row.revokedAt as string).toISOString()
            : null,
          createdAt: new Date(row.createdAt as string).toISOString(),
        })),
      };
    },
  );

  app.delete<{
    Params: { workspaceId: string; projectId: string; invitationId: string };
  }>(
    "/workspaces/:workspaceId/projects/:projectId/invitations/:invitationId",
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin"],
      );
      await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          const invitation = await trx("arsy_project_invitations")
            .select("accepted_at as acceptedAt", "revoked_at as revokedAt")
            .where({
              id: request.params.invitationId,
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
            })
            .forUpdate()
            .first();
          if (!invitation) {
            throw new HttpError(404, "The project invitation was not found.");
          }
          if (invitation.acceptedAt) {
            throw new HttpError(409, "An accepted invitation cannot be revoked.");
          }
          if (!invitation.revokedAt) {
            const now = new Date();
            await trx("arsy_project_invitations")
              .where({ id: request.params.invitationId })
              .update({ revoked_at: now, updated_at: now });
            await writeAudit(trx, {
              workspaceId: request.params.workspaceId,
              projectId: request.params.projectId,
              actorId: account.id,
              action: "project.invitation_revoked",
              resourceType: "project_invitation",
              resourceId: request.params.invitationId,
            });
          }
        },
      );
      return reply.code(204).send();
    },
  );

  app.post<{ Body: TokenBody }>(
    "/invitations/accept",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["token"],
          properties: { token: { type: "string", minLength: 20, maxLength: 128 } },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const tokenHash = hashOpaqueToken(request.body.token);
      const accepted = await withInvitationHashTransaction(
        getKnex(app),
        tokenHash,
        async (trx) => {
          const invitation = await trx("arsy_project_invitations")
            .select(
              "id",
              "workspace_id as workspaceId",
              "project_id as projectId",
              "email",
              "role",
            )
            .where({ token_hash: tokenHash })
            .whereNull("accepted_at")
            .whereNull("revoked_at")
            .andWhere("expires_at", ">", new Date())
            .forUpdate()
            .first();
          if (!invitation || invitation.email !== account.email) {
            return null;
          }

          await setTransactionSetting(
            trx,
            "arsy.workspace_id",
            invitation.workspaceId as string,
          );
          await setTransactionSetting(
            trx,
            "arsy.project_id",
            invitation.projectId as string,
          );
          const project = await trx("arsy_projects")
            .select("id")
            .where({
              id: invitation.projectId,
              workspace_id: invitation.workspaceId,
              status: "active",
            })
            .first();
          if (!project) {
            return null;
          }

          const existingMembership = await trx("arsy_project_users")
            .select("id")
            .where({
              workspace_id: invitation.workspaceId,
              project_id: invitation.projectId,
              account_id: account.id,
            })
            .first();
          if (existingMembership) {
            throw new HttpError(409, "The account is already a project member.");
          }

          const acceptedAt = new Date();
          await trx("arsy_project_users").insert({
            id: randomUUID(),
            workspace_id: invitation.workspaceId,
            project_id: invitation.projectId,
            account_id: account.id,
            role: invitation.role,
            created_at: acceptedAt,
          });
          const updated = await trx("arsy_project_invitations")
            .where({
              id: invitation.id,
              workspace_id: invitation.workspaceId,
              project_id: invitation.projectId,
            })
            .whereNull("accepted_at")
            .whereNull("revoked_at")
            .update({ accepted_at: acceptedAt, updated_at: acceptedAt });
          if (updated !== 1) {
            throw new HttpError(409, "The project invitation is no longer available.");
          }
          await writeAudit(trx, {
            workspaceId: invitation.workspaceId as string,
            projectId: invitation.projectId as string,
            actorId: account.id,
            action: "project.invitation_accepted",
            resourceType: "project_invitation",
            resourceId: invitation.id as string,
          });

          return {
            workspaceId: invitation.workspaceId,
            projectId: invitation.projectId,
            role: invitation.role,
            acceptedAt: acceptedAt.toISOString(),
          };
        },
      );
      if (!accepted) {
        throw new HttpError(404, "The invitation is invalid or unavailable.");
      }

      return reply.code(200).send(accepted);
    },
  );

  app.delete<{
    Params: { workspaceId: string; projectId: string; accountId: string };
  }>(
    "/workspaces/:workspaceId/projects/:projectId/users/:accountId",
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceRole(
        getKnex(app),
        request.params.workspaceId,
        account.id,
        ["owner", "admin"],
      );
      await withProjectTransaction(
        getKnex(app),
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
          const membership = await trx("arsy_project_users")
            .select("role")
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              account_id: request.params.accountId,
            })
            .first();
          if (!membership) {
            throw new HttpError(404, "The project user was not found.");
          }
          if (membership.role === "admin") {
            const admins = await trx("arsy_project_users")
              .count({ count: "id" })
              .where({
                workspace_id: request.params.workspaceId,
                project_id: request.params.projectId,
                role: "admin",
              })
              .first();
            if (Number(admins?.count ?? 0) <= 1) {
              throw new HttpError(409, "A project must retain at least one admin.");
            }
          }
          await trx("arsy_project_users")
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
              account_id: request.params.accountId,
            })
            .delete();
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: account.id,
            action: "project.user_removed",
            resourceType: "project_user",
            resourceId: request.params.accountId,
          });
        },
      );
      return reply.code(204).send();
    },
  );

  app.get<{ Params: { workspaceId: string; projectId: string } }>(
    "/workspaces/:workspaceId/projects/:projectId/credentials",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer"],
      );
      const rows = await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) =>
          trx("arsy_project_credentials")
            .select(
              "id",
              "label",
              "key_prefix as keyPrefix",
              "scopes",
              "expires_at as expiresAt",
              "revoked_at as revokedAt",
              "created_at as createdAt",
            )
            .where({
              workspace_id: request.params.workspaceId,
              project_id: request.params.projectId,
            })
            .orderBy("created_at", "desc"),
      );

      return {
        data: rows.map((row) => ({
          id: row.id,
          label: row.label,
          keyPrefix: row.keyPrefix,
          scopes: row.scopes,
          expiresAt: row.expiresAt
            ? new Date(row.expiresAt as string).toISOString()
            : null,
          revokedAt: row.revokedAt
            ? new Date(row.revokedAt as string).toISOString()
            : null,
          createdAt: new Date(row.createdAt as string).toISOString(),
        })),
      };
    },
  );

  app.post<{
    Params: { workspaceId: string; projectId: string };
    Body: CredentialBody;
  }>(
    "/workspaces/:workspaceId/projects/:projectId/credentials",
    {
      schema: {
        params: {
          type: "object",
          required: ["workspaceId", "projectId"],
          properties: {
            workspaceId: { type: "string", format: "uuid" },
            projectId: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          additionalProperties: false,
          required: ["label", "scopes"],
          properties: {
            label: { type: "string", minLength: 1, maxLength: 120 },
            scopes: {
              type: "array",
              minItems: 1,
              maxItems: 5,
              uniqueItems: true,
              items: { type: "string", enum: [...supportedCredentialScopes] },
            },
            expiresAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin"],
      );

      const project = await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        (trx) =>
          trx("arsy_projects")
            .select("id")
            .where({
              id: request.params.projectId,
              workspace_id: request.params.workspaceId,
              status: "active",
            })
            .first(),
      );
      if (!project) {
        throw new HttpError(404, "The requested project was not found.");
      }

      const expiresAt = request.body.expiresAt
        ? new Date(request.body.expiresAt)
        : null;
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        throw new HttpError(400, "Credential expiration must be in the future.");
      }

      const secret = `arsy_proj_${randomBytes(32).toString("base64url")}`;
      const keyPrefix = secret.slice(0, 20);
      const credentialId = randomUUID();
      const now = new Date();

      await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
        await trx("arsy_project_credentials").insert({
          id: credentialId,
          workspace_id: request.params.workspaceId,
          project_id: request.params.projectId,
          label: request.body.label.trim(),
          key_prefix: keyPrefix,
          key_hash: hashOpaqueToken(secret),
          scopes: JSON.stringify(request.body.scopes),
          created_by: account.id,
          expires_at: expiresAt,
          revoked_at: null,
          created_at: now,
          },
        );
        await writeAudit(trx, {
          workspaceId: request.params.workspaceId,
          projectId: request.params.projectId,
          actorId: account.id,
          action: "project_credential.created",
          resourceType: "project_credential",
          resourceId: credentialId,
          metadata: { scopes: request.body.scopes, keyPrefix },
        });
      });

      return reply.code(201).send({
        id: credentialId,
        label: request.body.label.trim(),
        keyPrefix,
        secret,
        scopes: request.body.scopes,
        expiresAt: expiresAt?.toISOString() ?? null,
        createdAt: now.toISOString(),
      });
    },
  );

  app.delete<{
    Params: { workspaceId: string; projectId: string; credentialId: string };
  }>(
    "/workspaces/:workspaceId/projects/:projectId/credentials/:credentialId",
    {
      schema: {
        params: {
          type: "object",
          required: ["workspaceId", "projectId", "credentialId"],
          properties: {
            workspaceId: { type: "string", format: "uuid" },
            projectId: { type: "string", format: "uuid" },
            credentialId: { type: "string", format: "uuid" },
          },
        },
      },
    },
    async (request, reply) => {
      const account = await requireAccount(request, getKnex(app));
      const knex = getKnex(app);
      await requireWorkspaceRole(
        knex,
        request.params.workspaceId,
        account.id,
        ["owner", "admin"],
      );
      const now = new Date();
      const changed = await withProjectTransaction(
        knex,
        request.params.workspaceId,
        request.params.projectId,
        async (trx) => {
        const count = await trx("arsy_project_credentials")
          .where({
            id: request.params.credentialId,
            workspace_id: request.params.workspaceId,
            project_id: request.params.projectId,
          })
          .whereNull("revoked_at")
          .update({ revoked_at: now });
        if (count > 0) {
          await writeAudit(trx, {
            workspaceId: request.params.workspaceId,
            projectId: request.params.projectId,
            actorId: account.id,
            action: "project_credential.revoked",
            resourceType: "project_credential",
            resourceId: request.params.credentialId,
            },
          );
        }
        return count;
      });

      if (changed === 0) {
        throw new HttpError(404, "The active credential was not found.");
      }

      return reply.code(204).send();
    },
  );

  app.get<{ Params: { workspaceId: string } }>(
    "/workspaces/:workspaceId/audit",
    async (request) => {
      const account = await requireAccount(request, getKnex(app));
      await requireWorkspaceRole(
        getKnex(app),
        request.params.workspaceId,
        account.id,
        ["owner", "admin", "developer", "viewer"],
      );
      const knex = getKnex(app);
      const workspaceRows = await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        (trx) =>
          trx("arsy_audit_events")
            .select(
              "id",
              "project_id as projectId",
              "actor_id as actorId",
              "action",
              "resource_type as resourceType",
              "resource_id as resourceId",
              "metadata",
              "created_at as createdAt",
            )
            .where({
              workspace_id: request.params.workspaceId,
              project_id: null,
            })
            .orderBy("created_at", "desc")
            .limit(100),
      );
      const projects = await withWorkspaceTransaction(
        knex,
        request.params.workspaceId,
        (trx) =>
          trx("arsy_projects")
            .select("id")
            .where({ workspace_id: request.params.workspaceId }),
      );
      const projectRows = await Promise.all(
        projects.map((project: { id: string }) =>
          withProjectTransaction(
            knex,
            request.params.workspaceId,
            project.id,
            (trx) =>
              trx("arsy_audit_events")
                .select(
                  "id",
                  "project_id as projectId",
                  "actor_id as actorId",
                  "action",
                  "resource_type as resourceType",
                  "resource_id as resourceId",
                  "metadata",
                  "created_at as createdAt",
                )
                .where({
                  workspace_id: request.params.workspaceId,
                  project_id: project.id,
                })
                .orderBy("created_at", "desc")
                .limit(100),
          ),
        ),
      );
      const rows = [...workspaceRows, ...projectRows.flat()]
        .sort(
          (left, right) =>
            new Date(right.createdAt as string).getTime() -
            new Date(left.createdAt as string).getTime(),
        )
        .slice(0, 100);

      return {
        data: rows.map((row) => ({
          ...row,
          createdAt: new Date(row.createdAt as string).toISOString(),
        })),
      };
    },
  );
}
