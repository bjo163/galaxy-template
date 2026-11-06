import { HttpError } from "./auth/identity.js";

export type TimestampIdCursor = {
  createdAt: string;
  id: string;
};

const uuidPattern =
  "^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";

export function encodeTimestampIdCursor(
  createdAt: Date | string,
  id: string,
): string {
  const timestamp =
    createdAt instanceof Date ? createdAt.toISOString() : new Date(createdAt).toISOString();
  return Buffer.from(JSON.stringify({ createdAt: timestamp, id }), "utf8").toString(
    "base64url",
  );
}

export function decodeTimestampIdCursor(
  cursor: string | undefined,
): TimestampIdCursor | null {
  if (cursor === undefined) {
    return null;
  }
  if (
    cursor.length > 256 ||
    !/^[A-Za-z0-9_-]+$/.test(cursor)
  ) {
    throw new HttpError(400, "The pagination cursor is invalid.");
  }

  let value: unknown;
  try {
    value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "The pagination cursor is invalid.");
  }

  if (
    typeof value !== "object" ||
    value === null ||
    !("createdAt" in value) ||
    !("id" in value) ||
    typeof value.createdAt !== "string" ||
    typeof value.id !== "string" ||
    !new RegExp(uuidPattern, "i").test(value.id) ||
    !Number.isFinite(Date.parse(value.createdAt))
  ) {
    throw new HttpError(400, "The pagination cursor is invalid.");
  }

  return {
    createdAt: value.createdAt,
    id: value.id,
  };
}
