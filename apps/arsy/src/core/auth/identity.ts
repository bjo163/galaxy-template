import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

import type { FastifyRequest } from "fastify";
import type { Knex } from "@galaxy/database";

const sessionLifetimeMs = 1000 * 60 * 60 * 24 * 7;

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      64,
      { N: 32_768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 },
      (error, key) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(key);
      },
    );
  });
}

export type AuthenticatedAccount = {
  id: string;
  email: string;
  displayName: string;
};

declare module "fastify" {
  interface FastifyRequest {
    authenticatedAccount: AuthenticatedAccount | null;
    sessionTokenHash: string | null;
  }
}

export class HttpError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function registerIdentityDecorators(app: {
  decorateRequest(name: "authenticatedAccount", value: null): void;
  decorateRequest(name: "sessionTokenHash", value: null): void;
}): void {
  app.decorateRequest("authenticatedAccount", null);
  app.decorateRequest("sessionTokenHash", null);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await derivePasswordKey(password, salt);

  return `scrypt$32768$8$1$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [algorithm, n, r, p, saltValue, expectedValue, ...extra] =
    encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    n !== "32768" ||
    r !== "8" ||
    p !== "1" ||
    !saltValue ||
    !expectedValue ||
    extra.length > 0
  ) {
    return false;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const expected = Buffer.from(expectedValue, "base64url");
  if (salt.length !== 16 || expected.length !== 64) {
    return false;
  }

  const actual = await derivePasswordKey(password, salt);

  return timingSafeEqual(actual, expected);
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function requireAccount(
  request: FastifyRequest,
  knex: Knex,
): Promise<AuthenticatedAccount> {
  const authorization = request.headers.authorization;
  const match =
    typeof authorization === "string"
      ? /^Bearer (arsy_sess_[A-Za-z0-9_-]{43})$/.exec(authorization)
      : null;

  if (!match) {
    throw new HttpError(401, "A valid bearer session is required.");
  }

  const tokenHash = hashOpaqueToken(match[1]);
  const now = new Date();
  const row = await knex("arsy_sessions")
    .join("arsy_accounts", "arsy_accounts.id", "arsy_sessions.account_id")
    .select(
      "arsy_accounts.id",
      "arsy_accounts.email",
      "arsy_accounts.display_name as displayName",
      "arsy_sessions.token_hash as tokenHash",
    )
    .where("arsy_sessions.token_hash", tokenHash)
    .andWhere("arsy_sessions.expires_at", ">", now)
    .andWhere("arsy_accounts.status", "active")
    .first();

  if (!row) {
    throw new HttpError(401, "The session is invalid or expired.");
  }

  request.sessionTokenHash = row.tokenHash as string;
  const account: AuthenticatedAccount = {
    id: row.id as string,
    email: row.email as string,
    displayName: row.displayName as string,
  };
  request.authenticatedAccount = account;
  return account;
}

export async function createSession(
  knex: Knex,
  accountId: string,
): Promise<{ token: string; expiresAt: Date }> {
  const token = `arsy_sess_${randomBytes(32).toString("base64url")}`;
  const expiresAt = new Date(Date.now() + sessionLifetimeMs);
  await knex("arsy_sessions").insert({
    id: randomUUID(),
    account_id: accountId,
    token_hash: hashOpaqueToken(token),
    expires_at: expiresAt,
    created_at: new Date(),
  });

  return { token, expiresAt };
}

export function requireAuthenticatedAccount(
  request: FastifyRequest,
): AuthenticatedAccount {
  if (!request.authenticatedAccount) {
    throw new HttpError(401, "Authentication is required.");
  }

  return request.authenticatedAccount;
}
