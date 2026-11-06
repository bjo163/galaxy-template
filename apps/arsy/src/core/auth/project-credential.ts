import type { FastifyRequest } from "fastify";
import type { Knex } from "@galaxy/database";

import { HttpError, hashOpaqueToken } from "./identity.js";
import { enforceSharedQuota } from "../rate-limiting/shared-quota.js";
import {
  withCredentialHashTransaction,
  withWorkspaceTransaction,
} from "../tenancy/database-context.js";

const credentialRequestsPerMinute = 100;
const projectRequestsPerMinute = 1_000;
const quotaWindowMs = 60_000;

export type ResolvedProjectCredential = {
  id: string;
  workspaceId: string;
  projectId: string;
  createdBy: string;
  scopes: string[];
};

export function extractProjectCredential(request: FastifyRequest): string {
  const authorization = request.headers.authorization;
  const match =
    typeof authorization === "string"
      ? /^Bearer (arsy_proj_[A-Za-z0-9_-]{43})$/.exec(authorization)
      : null;
  if (!match) {
    throw new HttpError(401, "A valid project bearer credential is required.");
  }

  return match[1];
}

export async function requireProjectCredential(
  knex: Knex,
  secret: string,
): Promise<ResolvedProjectCredential> {
  const credentialHash = hashOpaqueToken(secret);
  const credential = await withCredentialHashTransaction(
    knex,
    credentialHash,
    (trx) =>
      trx("arsy_project_credentials")
        .select(
          "id",
          "workspace_id as workspaceId",
          "project_id as projectId",
          "created_by as createdBy",
          "scopes",
        )
        .where({ key_hash: credentialHash })
        .whereNull("revoked_at")
        .where((query) =>
          query.whereNull("expires_at").orWhere("expires_at", ">", new Date()),
        )
        .first(),
  );

  if (!credential) {
    throw new HttpError(401, "The project credential is invalid or expired.");
  }

  const project = await withWorkspaceTransaction(
    knex,
    credential.workspaceId as string,
    (trx) =>
      trx("arsy_projects")
        .select("id")
        .where({
          id: credential.projectId,
          workspace_id: credential.workspaceId,
          status: "active",
        })
        .first(),
  );
  if (!project) {
    throw new HttpError(401, "The project credential is invalid or expired.");
  }

  await enforceSharedQuota(
    knex,
    [
      {
        dimension: "credential",
        subject: credential.id as string,
        limit: credentialRequestsPerMinute,
      },
      {
        dimension: "project",
        subject: credential.projectId as string,
        limit: projectRequestsPerMinute,
      },
    ],
    quotaWindowMs,
  );

  return {
    id: credential.id as string,
    workspaceId: credential.workspaceId as string,
    projectId: credential.projectId as string,
    createdBy: credential.createdBy as string,
    scopes: credential.scopes as string[],
  };
}

export function requireCredentialScope(
  credential: { scopes: readonly string[] },
  scope: string,
): void {
  if (!credential.scopes.includes(scope)) {
    throw new HttpError(403, "The project credential lacks the required scope.");
  }
}
